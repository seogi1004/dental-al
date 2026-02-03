import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from 'next';
import { CalendarPostRequest, CalendarDeleteRequest, CalendarPutRequest } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SHEET_CALENDAR = '2026년';

  let session: any;
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

  if (req.method === 'POST') {
    if (!session?.isAdmin) {
      return res.status(403).json({ error: 'Permission denied. Admin only.' });
    }
    try {
      const { name, date }: CalendarPostRequest = req.body;
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
        requestBody: { values: [[date]] }
      });

      return res.status(200).json({ success: true, message: `Added to ${range}` });
    } catch (error: any) {
      console.error("Add Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    if (!session?.isAdmin) {
      return res.status(403).json({ error: 'Permission denied. Admin only.' });
    }
    try {
        const { name, date }: CalendarDeleteRequest = req.body;
        if (!name || !date) return res.status(400).json({ error: 'Missing name or date' });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_CALENDAR}!A:Z`,
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
        const targetRow = rows[rowIndex];
        for (let j = 4; j < targetRow.length; j++) {
            if (targetRow[j] && targetRow[j].trim() === date.trim()) {
                colIndex = j;
                break;
            }
        }

        if (colIndex === -1) return res.status(404).json({ error: 'Date not found' });

        const rowNum = rowIndex + 1;
        const colLetter = String.fromCharCode(65 + colIndex);

        const range = `${SHEET_CALENDAR}!${colLetter}${rowNum}`;

        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range
        });

        return res.status(200).json({ success: true, message: `Deleted ${range}` });

    } catch (error: any) {
        console.error("Delete Error:", error);
        return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    if (!session?.isAdmin) {
      return res.status(403).json({ error: 'Permission denied. Admin only.' });
    }
    try {
        const { name, oldDate, newDate }: CalendarPutRequest = req.body;
        if (!name || !oldDate || !newDate) return res.status(400).json({ error: 'Missing params' });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_CALENDAR}!A:Z`,
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
        const targetRow = rows[rowIndex];
        for (let j = 4; j < targetRow.length; j++) {
            if (targetRow[j] && targetRow[j].trim() === oldDate.trim()) {
                colIndex = j;
                break;
            }
        }

        if (colIndex === -1) return res.status(404).json({ error: 'Original date not found' });

        const rowNum = rowIndex + 1;
        const colLetter = String.fromCharCode(65 + colIndex);
        const range = `${SHEET_CALENDAR}!${colLetter}${rowNum}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[newDate]] }
        });

        return res.status(200).json({ success: true, message: `Updated ${range}` });

    } catch (error: any) {
        console.error("Update Error:", error);
        return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
