import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from 'next';
import { StaffData, Off } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let session: any = null;
  
  // 시트 이름 설정
  const SHEET_SUMMARY = '연차계산'; // 요약 정보
  const SHEET_CALENDAR = '2026년';  // 달력 상세 정보
  const SHEET_OFF = '2026년_오프';
  const GID_OFF = "1135506325";

  try {
    session = await getServerSession(req, res, authOptions);
  } catch (e) {
    console.error("Session Check Error:", e);
  }

  // ============================================================
  // [POST] 데이터 저장 (로그인 필수)
  // ※ 현재 로직은 '연차계산' 시트(요약)만 수정합니다. 
  //   '2026년' 시트는 구조가 복잡하여 읽기 전용으로 유지하는 것이 안전합니다.
  // ============================================================
  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: '데이터를 저장하려면 로그인이 필요합니다.' });
    }

    if (!session?.isAdmin) {
      return res.status(403).json({ error: 'Permission denied. Admin only.' });
    }

    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ access_token: session.accessToken });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const newData: StaffData = req.body;
      
      // [변경] E열(사용연차)을 보호하기 위해 업데이트 로직 수정
      // 목적: E열에 있는 엑셀 수식(COUNTIF 등)을 보존
      
      // Part 1: A, B, C, D열 (이름, 직급, 입사일, 발생연차)
      const rowsPart1 = newData.map(item => [
        item.name, item.role, item.date, item.total
      ]);
      
      // Part 2: F열 (비고) - E열(사용연차) 건너뜀
      const rowsPart2 = newData.map(item => [
        item.memo
      ]);

      // 1. 기존 데이터 지우기 (E열 제외)
      // A2:D15 및 F2:F15 초기화
      await sheets.spreadsheets.values.batchClear({
        spreadsheetId,
        requestBody: {
          ranges: [`${SHEET_SUMMARY}!A2:D15`, `${SHEET_SUMMARY}!F2:F15`]
        }
      });

      // 2. 새 데이터 쓰기 (E열 건너뛰고 A~D, F 업데이트)
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `${SHEET_SUMMARY}!A2`,
              values: rowsPart1
            },
            {
              range: `${SHEET_SUMMARY}!F2`,
              values: rowsPart2
            }
          ]
        }
      });

      return res.status(200).json({ success: true });

    } catch (error: any) {
      console.error("Save Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // [GET] 데이터 읽기 (두 시트 병합)
  // ============================================================
  if (req.method === 'GET') {
    try {
      let summaryRows: any[][] = [];
      let calendarRows: any[][] = [];
      let offRows: any[][] = [];
      let fetchedViaApi = false;

      // --------------------------------------------------------
      // CASE 1: 로그인 유저 -> Google API 사용 (정확함)
      // --------------------------------------------------------
      if (session && session.accessToken) {
        try {
          const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          auth.setCredentials({ access_token: session.accessToken });
          const sheets = google.sheets({ version: 'v4', auth });
          const spreadsheetId = process.env.GOOGLE_SHEET_ID;

          // 세 시트 동시에 요청
          const [resSummary, resCalendar, resOff] = await Promise.all([
            sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `${SHEET_SUMMARY}!A2:F15`,
            }),
            sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `${SHEET_CALENDAR}!A3:ZZ`, // 3행부터, E열(인덱스 4) 이후 데이터 검색
            }),
            sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `${SHEET_OFF}!A2:C`,  // 헤더 제외, A:이름, B:날짜, C:비고
            })
          ]);

          summaryRows = resSummary.data.values || [];
          calendarRows = resCalendar.data.values || [];
          offRows = resOff.data.values || [];
          fetchedViaApi = true;
        } catch (apiError: any) {
          console.error("Google API Fetch Failed (Falling back to CSV):", apiError.message);
          // API 실패 시 아래 CSV 로직으로 넘어감
        }
      } 
      
      // --------------------------------------------------------
      // CASE 2: 비로그인 유저 또는 API 실패 시 -> CSV 파싱 (공개 링크)
      // --------------------------------------------------------
      if (!fetchedViaApi) {
        const SHEET_ID = "1dmMlb4IxUQO9AZBVSAgS72cXDJqWDLicx-FL0IzH5Eo";
        const GID_CALENDAR = "191374435"; 

        const baseUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

        // 1번 시트 (연차계산) - gid=0
        const urlSummary = `${baseUrl}&gid=0`;
        
        // 2번 시트 (2026년) - gid=191374435
        const urlCalendar = `${baseUrl}&gid=${GID_CALENDAR}`;

        // 3번 시트 (2026년_오프)
        const urlOff = `${baseUrl}&gid=${GID_OFF}`;

        const [textSummary, textCalendar, textOff] = await Promise.all([
            fetch(urlSummary).then(r => r.ok ? r.text() : ""),
            fetch(urlCalendar).then(r => r.ok ? r.text() : ""),
            fetch(urlOff).then(r => r.ok ? r.text() : "")
        ]);

        const parsedSummary = parseCSV(textSummary);
        const parsedCalendar = parseCSV(textCalendar);
        const parsedOff = parseCSV(textOff);

        // 헤더 제거
        summaryRows = parsedSummary.slice(1); 
        calendarRows = parsedCalendar.slice(2);
        offRows = parsedOff.slice(1);
      }

      // --------------------------------------------------------
      // 데이터 병합 (Merge)
      // --------------------------------------------------------
      
        // 1. 달력 데이터 정리 (이름 -> 날짜 배열 맵 생성)
      const calendarMap: { [key: string]: { parsed: string; original: string }[] } = {};
      const currentYear = '2026'; // 시트 이름에서 유추하거나 고정

      calendarRows.forEach(row => {
        const name = row[0]; // A열: 이름
        const dates: { parsed: string; original: string }[] = [];
        
        // E열(인덱스 4)부터 끝까지 돌면서 날짜가 있는 셀만 수집
        for (let i = 4; i < row.length; i++) {
            let cellValue = row[i] ? row[i].trim() : '';
            if (!cellValue) continue;

            // 날짜 파싱 로직 개선 (MM-DD AM/PM -> YYYY-MM-DD (TYPE))
            // 예: "1-5" -> "2026-01-05"
            // 예: "1-5 AM" -> "2026-01-05 (AM)"
            try {
                // AM/PM 감지
                let type = '';
                if (cellValue.toUpperCase().includes('AM')) type = 'AM';
                else if (cellValue.toUpperCase().includes('PM')) type = 'PM';

                // 날짜 숫자만 추출 (1-5, 01-05, 1/5 등)
                // 문자와 공백 제거 후 숫자와 구분자(-, /)만 남김
                let datePart = cellValue.replace(/AM|PM/gi, '').trim();
                
                // 구분자 통일
                datePart = datePart.replace(/\//g, '-');
                
                const parts = datePart.split('-');
                if (parts.length >= 2) {
                    const month = parts[0].padStart(2, '0');
                    const day = parts[1].padStart(2, '0');
                    
                    let formattedDate = `${currentYear}-${month}-${day}`;
                    if (type) formattedDate += ` (${type})`;
                    
                    dates.push({ parsed: formattedDate, original: cellValue });
                } else {
                    // 파싱 실패 시 원본 유지
                     dates.push({ parsed: cellValue, original: cellValue });
                }
            } catch (e) {
                dates.push({ parsed: cellValue, original: cellValue });
            }
        }
        
        if (name) {
            calendarMap[name] = dates;
        }
      });

      // 오프 데이터 파싱 (세로 형태 → 이름별 그룹화)
      const offMap: { [name: string]: Off[] } = {};

      offRows.forEach(row => {
        const name = row[0]?.trim();
        const dateRaw = row[1]?.trim();  // MM/DD
        const memo = row[2]?.trim() || '';
        
        if (!name || !dateRaw) return;
        
        // MM/DD → YYYY-MM-DD 파싱 로직 강화
        try {
          // 1. "AM", "PM" 제거 및 공백 정리
          let datePart = dateRaw.replace(/AM|PM/gi, '').trim();

          // 2. 구분자 통일 (/, . -> -)
          datePart = datePart.replace(/[\/\.]/g, '-');

          const parts = datePart.split('-');
          if (parts.length >= 2) {
            const monthStr = parts[0].trim();
            const dayStr = parts[1].trim();
            
            // 3. 숫자 여부 및 범위 체크
            const month = parseInt(monthStr, 10);
            const day = parseInt(dayStr, 10);
            
            if (!isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              const monthFormatted = String(month).padStart(2, '0');
              const dayFormatted = String(day).padStart(2, '0');
              const dateParsed = `${currentYear}-${monthFormatted}-${dayFormatted}`;
              
              // 4. 유효한 날짜 객체인지 재확인 (예: 2월 30일 방지)
              const d = new Date(dateParsed);
              if (!isNaN(d.getTime()) && d.getMonth() + 1 === month && d.getDate() === day) {
                if (!offMap[name]) offMap[name] = [];
                offMap[name].push({ name, date: dateRaw, dateParsed, memo });
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing off date: ${dateRaw} for ${name}`, e);
        }
      });

      // 2. 요약 데이터에 달력 데이터 합치기
      const combinedData: StaffData = summaryRows
        .filter(row => row[2] && row[2].trim().length > 0) // 입사일(row[2])이 없는 행 제외 (GID 메타데이터 등 필터링)
        .map(row => {
        const name = row[0] || '';
        const baseData: any = {
            name: name,
            role: row[1] || '',
            date: row[2] || '',
            total: Number(row[3]) || 0,
            used: Number(row[4]) || 0,
            memo: row[5] || ''
        };

        // 이름이 일치하는 달력 데이터가 있으면 추가, 없으면 빈 배열
        baseData.leaves = calendarMap[name] || [];
        baseData.offs = offMap[name] || [];
        
        return baseData;
      });

      return res.status(200).json(combinedData);

    } catch (error) {
      console.error("Fetch Error:", error);
      return res.status(200).json([]); // 에러 시 빈 배열 반환
    }
  }
}

// 헬퍼 함수: CSV 파서 (기존 유지)
function parseCSV(text: string): string[][] {
  if (!text) return [];
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentCell += '"';
        i++; 
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.length > 0 && currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }
  return rows;
}
