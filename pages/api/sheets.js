import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  let session = null;
  
  // [설정] 로그인 시 사용할 시트 정보 (수정용)
  const SHEET_NAME = '연차계산'; 

  try {
    session = await getServerSession(req, res, authOptions);
  } catch (e) {
    console.error("Session Check Error:", e);
  }

  // ============================================================
  // [POST] 데이터 저장 (로그인 필수) - Google API 사용
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
      const rows = newData.map(item => [
        item.name, item.role, item.date, item.total, item.used, item.memo
      ]);

      // 1. 기존 데이터 지우기
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${SHEET_NAME}!A2:F1000`
      });

      // 2. 새 데이터 쓰기
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A2`,
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
  // [GET] 데이터 읽기
  // ============================================================
  if (req.method === 'GET') {
    try {
      // 1. 로그인이 되어 있다면 -> Google API로 읽기 (가장 정확하고 빠름)
      if (session) {
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        auth.setCredentials({ access_token: session.accessToken });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${SHEET_NAME}!A2:F`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return res.status(200).json([]);

        return res.status(200).json(mapRowsToData(rows));
      } 
      
      // 2. 로그인이 안 되어 있다면 -> [웹에 게시된 CSV] 읽기 (공개 데이터)
      else {
        // ★ 중요: 고객님이 제공해주신 '웹에 게시' 전용 링크를 사용합니다.
        // 이 링크는 로그인 권한과 상관없이 데이터를 줍니다.
        const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPph1JA3oxqJG0x78pFA_WxZTmxNsZzecThtyRLavlMiCd-0-ELMTZaIuWAwuP0PJK_b-NhYI5KDPa/pub?gid=0&single=true&output=csv";
        
        // 캐시 방지를 위해 타임스탬프 추가
        const response = await fetch(`${csvUrl}&t=${Date.now()}`);
        
        if (!response.ok) {
          console.error(`CSV Fetch Failed (${response.status})`);
          return res.status(200).json([]);
        }

        const csvText = await response.text();
        
        // 만약 여전히 로그인 페이지가 뜬다면 (HTML 반환) 뭔가 잘못된 것
        if (csvText.includes("<!DOCTYPE html") || csvText.includes("google.com/accounts")) {
           console.error("Error: 구글 로그인 페이지가 반환됨. 링크를 다시 확인해주세요.");
           return res.status(200).json([]);
        }

        const rows = parseCSV(csvText);

        // 헤더만 있거나 비어있으면 빈 배열
        if (rows.length <= 1) return res.status(200).json([]);
        
        // 1행(헤더) 제외하고 2행부터 데이터로 사용
        return res.status(200).json(mapRowsToData(rows.slice(1)));
      }

    } catch (error) {
      console.error("Fetch Error:", error);
      return res.status(200).json([]);
    }
  }
}

// 헬퍼 함수: 행 데이터를 객체로 변환
function mapRowsToData(rows) {
  return rows.map(row => ({
    name: row[0] || '',   // 이름
    role: row[1] || '',   // 직급
    date: row[2] || '',   // 입사일
    total: row[3] || 0,   // 발생
    used: row[4] || 0,    // 사용
    memo: row[5] || ''    // 비고
  }));
}

// 헬퍼 함수: CSV 파서 (쉼표, 따옴표 처리)
function parseCSV(text) {
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
      // 빈 줄 무시
      if (currentRow.length > 0 && currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  // 마지막 줄 처리
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }
  
  return rows;
}
