import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  let session = null;
  
  // ★ 설정: 시트 이름과 GID 확인
  const SHEET_NAME = '연차계산'; // 로그인 시 사용 (탭 이름)
  const SHEET_GID = '0';       // 비로그인 시 사용 (주소창의 #gid= 숫자)

  try {
    session = await getServerSession(req, res, authOptions);
  } catch (e) {
    console.error("Session Check Error:", e);
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
  // [GET] 데이터 읽기 (비로그인 허용)
  // ============================================================
  if (req.method === 'GET') {
    try {
      // 1. 로그인이 되어 있다면 -> Google API 사용
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
      
      // 2. 로그인이 안 되어 있다면 -> [웹에 게시]된 CSV 읽기
      else {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        
        // ★ 'pub' 방식으로 변경: [파일] > [공유] > [웹에 게시] 설정이 필수입니다.
        // 이 방식이 Vercel 서버에서 데이터를 읽어오는 가장 확실한 방법입니다.
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?gid=${SHEET_GID}&single=true&output=csv`;
        
        // 캐시 방지를 위해 타임스탬프 추가
        const response = await fetch(`${csvUrl}&t=${Date.now()}`);
        
        if (!response.ok) {
          console.error(`CSV Fetch Failed (${response.status}). 구글 시트에서 [웹에 게시]를 했는지 확인하세요.`);
          return res.status(200).json([]);
        }

        const csvText = await response.text();
        
        // 여전히 로그인 페이지가 반환된다면 웹 게시에 실패한 것임
        if (csvText.includes("<!DOCTYPE html") || csvText.includes("google.com/accounts")) {
           console.error("Error: 구글 로그인 페이지가 반환됨. [웹에 게시]가 필요합니다.");
           return res.status(200).json([]);
        }

        const rows = parseCSV(csvText);

        if (rows.length <= 1) return res.status(200).json([]);
        
        return res.status(200).json(mapRowsToData(rows.slice(1)));
      }

    } catch (error) {
      console.error("Fetch Error:", error);
      return res.status(200).json([]);
    }
  }
}

// 헬퍼 함수
function mapRowsToData(rows) {
  return rows.map(row => ({
    name: row[0] || '',
    role: row[1] || '',
    date: row[2] || '',
    total: row[3] || 0,
    used: row[4] || 0,
    memo: row[5] || ''
  }));
}

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
