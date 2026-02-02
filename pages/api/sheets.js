import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  let session = null;
  
  // 시트 이름 설정
  const SHEET_SUMMARY = '연차계산'; // 요약 정보
  const SHEET_CALENDAR = '2026년';  // 달력 상세 정보

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

    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ access_token: session.accessToken });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const newData = req.body;
      // 요약 시트에 들어갈 데이터만 추출 (이름, 직급, 입사일, 발생, 사용, 비고)
      const rows = newData.map(item => [
        item.name, item.role, item.date, item.total, item.used, item.memo
      ]);

      // 1. 기존 데이터 지우기
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${SHEET_SUMMARY}!A2:F1000`
      });

      // 2. 새 데이터 쓰기
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_SUMMARY}!A2`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: rows },
      });

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error("Save Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // [GET] 데이터 읽기 (두 시트 병합)
  // ============================================================
  if (req.method === 'GET') {
    try {
      let summaryRows = [];
      let calendarRows = [];

      // --------------------------------------------------------
      // CASE 1: 로그인 유저 -> Google API 사용 (정확함)
      // --------------------------------------------------------
      if (session) {
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        auth.setCredentials({ access_token: session.accessToken });
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // 두 시트 동시에 요청
        const [resSummary, resCalendar] = await Promise.all([
          sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_SUMMARY}!A2:F`,
          }),
          sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_CALENDAR}!A3:ZZ`, // 3행부터, E열(인덱스 4) 이후 데이터 검색
          })
        ]);

        summaryRows = resSummary.data.values || [];
        calendarRows = resCalendar.data.values || [];
      } 
      
      // --------------------------------------------------------
      // CASE 2: 비로그인 유저 -> CSV 파싱 (공개 링크)
      // --------------------------------------------------------
      else {
        // [수정됨] 보내주신 시트 ID (URL 중간에 있는 긴 문자열)
        const SHEET_ID = "1dmMlb4IxUQO9AZBVSAgS72cXDJqWDLicx-FL0IzH5Eo";
        
        // [수정됨] 보내주신 2026년 시트의 GID
        const GID_CALENDAR = "191374435"; 

        // 구글 시트 내보내기(Export) 주소 형식 사용
        const baseUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

        // 1번 시트 (연차계산) - gid=0
        const urlSummary = `${baseUrl}&gid=0`;
        
        // 2번 시트 (2026년) - gid=191374435
        const urlCalendar = `${baseUrl}&gid=${GID_CALENDAR}`;

        const [textSummary, textCalendar] = await Promise.all([
            fetch(urlSummary).then(r => r.ok ? r.text() : ""),
            fetch(urlCalendar).then(r => r.ok ? r.text() : "")
        ]);

        const parsedSummary = parseCSV(textSummary);
        const parsedCalendar = parseCSV(textCalendar);

        // 헤더 제거
        summaryRows = parsedSummary.slice(1); 
        calendarRows = parsedCalendar.slice(2);
      }

      // --------------------------------------------------------
      // 데이터 병합 (Merge)
      // --------------------------------------------------------
      
      // 1. 달력 데이터 정리 (이름 -> 날짜 배열 맵 생성)
      const calendarMap = {};
      calendarRows.forEach(row => {
        const name = row[0]; // A열: 이름
        // E열(인덱스 4)부터 끝까지 돌면서 날짜가 있는 셀만 수집
        const dates = [];
        for (let i = 4; i < row.length; i++) {
            if (row[i] && row[i].trim() !== '') {
                dates.push(row[i].trim());
            }
        }
        if (name) {
            calendarMap[name] = dates;
        }
      });

      // 2. 요약 데이터에 달력 데이터 합치기
      const combinedData = summaryRows.map(row => {
        const name = row[0] || '';
        const baseData = {
            name: name,
            role: row[1] || '',
            date: row[2] || '',
            total: row[3] || 0,
            used: row[4] || 0,
            memo: row[5] || ''
        };

        // 이름이 일치하는 달력 데이터가 있으면 추가, 없으면 빈 배열
        baseData.leaves = calendarMap[name] || [];
        
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
function parseCSV(text) {
  if (!text) return [];
  const rows = [];
  let currentRow = [];
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
