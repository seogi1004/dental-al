import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const SHEET_CALENDAR = '2026년';

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (e) {
    console.error("Session Error:", e);
  }

  if (!session) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: session.accessToken });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // ============================================================
  // [POST] 연차 추가
  // Body: { name, date } (date는 "01/15" 또는 "01/15 AM" 형식)
  // ============================================================
  if (req.method === 'POST') {
    try {
      const { name, date } = req.body;
      if (!name || !date) return res.status(400).json({ error: 'Missing name or date' });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_CALENDAR}!A:X`,
      });
      const rows = response.data.values || [];

      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === name) {
          rowIndex = i;
          break;
        }
      }
      if (rowIndex === -1) return res.status(404).json({ error: 'User not found' });

      let colIndex = -1;
      const targetRow = rows[rowIndex] || [];
      for (let j = 4; j <= 23; j++) {
        if (!targetRow[j] || targetRow[j].trim() === '') {
          colIndex = j;
          break;
        }
      }
      if (colIndex === -1) return res.status(400).json({ error: '연차 저장 공간이 부족합니다.' });

      const rowNum = rowIndex + 1;
      const colLetter = String.fromCharCode(65 + colIndex);
      const range = `${SHEET_CALENDAR}!${colLetter}${rowNum}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[date]] }
      });

      return res.status(200).json({ success: true, message: `Added to ${range}` });
    } catch (error) {
      console.error("Add Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // [DELETE] 연차 삭제
  // Body: { name, date } (date는 "1-15" 또는 "1-15 AM" 원본 텍스트)
  // ============================================================
  if (req.method === 'DELETE') {
    try {
        const { name, date } = req.body;
        if (!name || !date) return res.status(400).json({ error: 'Missing name or date' });

        // 1. 전체 데이터 읽기 (좌표 찾기 위함)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_CALENDAR}!A:Z`, // A열(이름) ~ Z열(충분히 넓게)
        });
        
        const rows = response.data.values || [];
        
        // 2. 행(Row) 찾기
        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === name) { // A열 매칭
                rowIndex = i; // 0-based index
                break;
            }
        }

        if (rowIndex === -1) return res.status(404).json({ error: 'User not found' });

        // 3. 열(Col) 찾기 (E열 = 인덱스 4 부터)
        let colIndex = -1;
        const targetRow = rows[rowIndex];
        for (let j = 4; j < targetRow.length; j++) {
            if (targetRow[j] && targetRow[j].trim() === date.trim()) {
                colIndex = j;
                break;
            }
        }

        if (colIndex === -1) return res.status(404).json({ error: 'Date not found' });

        // 4. A1 표기법 변환 (Row는 1-based, Col은 알파벳)
        const rowNum = rowIndex + 1;
        const colLetter = String.fromCharCode(65 + colIndex); // 0=A, 1=B, ... (Z 넘어가는 경우 처리 필요하나 E~X 범위라 안심)
        // 만약 Z 넘어가면 로직 추가 필요하지만, 현재는 20개(X열) 까지라 OK.

        const range = `${SHEET_CALENDAR}!${colLetter}${rowNum}`;

        // 5. 해당 셀 지우기
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range
        });

        return res.status(200).json({ success: true, message: `Deleted ${range}` });

    } catch (error) {
        console.error("Delete Error:", error);
        return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // [PUT] 연차 수정
  // Body: { name, oldDate, newDate }
  // ============================================================
  if (req.method === 'PUT') {
    try {
        const { name, oldDate, newDate } = req.body;
        if (!name || !oldDate || !newDate) return res.status(400).json({ error: 'Missing params' });

        // 1. 전체 데이터 읽기
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_CALENDAR}!A:Z`,
        });
        
        const rows = response.data.values || [];
        
        // 2. 행(Row) 찾기
        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === name) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex === -1) return res.status(404).json({ error: 'User not found' });

        // 3. 열(Col) 찾기
        let colIndex = -1;
        const targetRow = rows[rowIndex];
        for (let j = 4; j < targetRow.length; j++) {
            if (targetRow[j] && targetRow[j].trim() === oldDate.trim()) {
                colIndex = j;
                break;
            }
        }

        if (colIndex === -1) return res.status(404).json({ error: 'Original date not found' });

        // 4. 해당 셀 업데이트
        const rowNum = rowIndex + 1;
        const colLetter = String.fromCharCode(65 + colIndex);
        const range = `${SHEET_CALENDAR}!${colLetter}${rowNum}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [[newDate]] }
        });

        return res.status(200).json({ success: true, message: `Updated ${range}` });

    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}