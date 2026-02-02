import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  let session = null;
  
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (e) {
    console.error("Session Check Error:", e);
    // 세션 체크 실패해도 GET 요청은 진행하도록 무시
  }

  // ============================================================
  // [POST] 데이터 저장 (로그인 필수)
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
      const SHEET_NAME = '2026년'; // 시트 이름

      const newData = req.body;
      const rows = newData.map(item => [
        item.name, item.role, item.date, item.total, item.used, item.memo
      ]);

      // 기존 데이터 지우기 & 새로 쓰기
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${SHEET_NAME}!A2:F1000`
      });

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
  // [GET] 데이터 읽기 (비로그인 허용)
  // ============================================================
  if (req.method === 'GET') {
    try {
      // 1. 로그인이 되어 있다면 -> Google API 사용 (가장 안정적)
      if (session) {
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        auth.setCredentials({ access_token: session.accessToken });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const SHEET_NAME = '2026년';

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${SHEET_NAME}!A2:F`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return res.status(200).json([]);

        return res.status(200).json(mapRowsToData(rows));
      } 
      
      // 2. 로그인이 안 되어 있다면 -> CSV Fetch (공개 시트 읽기)
      else {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        // gid=0은 첫번째 시트입니다. 2026년 시트가 첫번째 탭에 있어야 합니다.
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          // 시트가 비공개이거나 URL이 잘못된 경우
          console.error("CSV Fetch Failed:", response.status);
          return res.status(200).json([]); // 에러 대신 빈 배열 반환하여 화면은 뜨게 함
        }

        const csvText = await response.text();
        const rows = parseCSV(csvText); // CSV 파싱

        // 헤더(1행) 제외하고 2행부터 데이터로 사용
        if (rows.length <= 1) return res.status(200).json([]);
        
        // 2행부터 매핑 (CSV 파서는 전체를 가져오므로 slice(1) 필요)
        return res.status(200).json(mapRowsToData(rows.slice(1)));
      }

    } catch (error) {
      console.error("Fetch Error:", error);
      // 에러가 나도 빈 배열을 줘서 프론트엔드가 멈추지 않게 함
      return res.status(200).json([]);
    }
  }
}

// 헬퍼 함수: 행 데이터를 객체로 변환
function mapRowsToData(rows) {
  return rows.map(row => ({
    name: row[0] || '',   // A열
    role: row[1] || '',   // B열
    date: row[2] || '',   // C열
    total: row[3] || 0,   // D열
    used: row[4] || 0,    // E열
    memo: row[5] || ''    // F열
  }));
}

// 헬퍼 함수: 간단한 CSV 파서 (쉼표가 포함된 셀 데이터 처리)
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
        i++; // skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell) currentRow.push(currentCell.trim());
  if (currentRow.some(c => c !== '')) rows.push(currentRow);
  
  return rows;
}