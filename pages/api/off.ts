import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from 'next';

const normalizeToMMDD = (str: string) => {
  if (!str) return '';
  
  let type = '';
  const upperStr = str.toUpperCase();
  if (upperStr.includes('AM')) type = ' AM';
  else if (upperStr.includes('PM')) type = ' PM';
  else if (upperStr.includes('오전')) type = ' AM';
  else if (upperStr.includes('오후')) type = ' PM';

  const clean = str.replace(/[^0-9]/g, ' ').trim().split(/\s+/);
  if (clean.length >= 2) {
    const month = parseInt(clean[clean.length - 2]);
    const day = parseInt(clean[clean.length - 1]);
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}${type}`;
  }
  return str;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SHEET_OFF = '2026년_오프';
  const GID_OFF = 1135506325;

  let session: any = null;

  try {
    session = await getServerSession(req, res, authOptions);
  } catch (e) {
    console.error("Session Check Error:", e);
    return res.status(500).json({ error: "Session check failed" });
  }

  if (!session) {
    return res.status(401).json({ error: 'Login required' });
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: session.accessToken });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (req.method === 'GET') {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_OFF}!A:C`,
      });
      return res.status(200).json(response.data.values || []);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (!session.isAdmin) {
    return res.status(403).json({ error: 'Permission denied. Admin only.' });
  }

    let dynamicGidOff = GID_OFF;
    try {
      const gidResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: '연차계산!B20',
      });
      const fetchedGid = gidResponse.data.values?.[0]?.[0];
      if (fetchedGid) {
        dynamicGidOff = parseInt(fetchedGid, 10);
      }
    } catch (e) {
      console.warn("Failed to fetch dynamic GID for Off, utilizing fallback:", e);
    }

    if (req.method === 'POST') {
    const { name, date, memo } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: 'Missing name or date' });
    }

    try {
      const normalizedDate = normalizeToMMDD(date);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_OFF}!A:C`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[name, normalizedDate, memo || '']]
        }
      });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Add Off Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { name, oldDate, newDate, memo } = req.body;
    if (!name || !oldDate || !newDate) {
      return res.status(400).json({ error: 'Missing parameters (name, oldDate, newDate)' });
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_OFF}!A:B`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'No data found' });
      }

      const targetDate = normalizeToMMDD(oldDate);
      let rowIndexToUpdate = -1;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === name) {
          const rowDate = normalizeToMMDD(rows[i][1]);
          if (rowDate === targetDate) {
            rowIndexToUpdate = i;
            break;
          }
        }
      }

      if (rowIndexToUpdate === -1) {
        return res.status(404).json({ error: 'Off record not found' });
      }

      const sheetRow = rowIndexToUpdate + 1;
      const range = `${SHEET_OFF}!B${sheetRow}:C${sheetRow}`;
      const normalizedNewDate = normalizeToMMDD(newDate);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[normalizedNewDate, memo || '']]
        }
      });

      return res.status(200).json({ success: true });

    } catch (error: any) {
      console.error("Update Off Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: 'Missing name or date' });
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_OFF}!A:B`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'No data found' });
      }

      const targetDate = normalizeToMMDD(date);
      let rowIndexToDelete = -1;
      
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === name) {
          const rowDate = normalizeToMMDD(rows[i][1]);
          if (rowDate === targetDate) {
            rowIndexToDelete = i;
            break;
          }
        }
      }

      if (rowIndexToDelete === -1) {
        return res.status(404).json({ error: 'Off record not found' });
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: dynamicGidOff,
                  dimension: "ROWS",
                  startIndex: rowIndexToDelete,
                  endIndex: rowIndexToDelete + 1
                }
              }
            }
          ]
        }
      });

      return res.status(200).json({ success: true });

    } catch (error: any) {
      console.error("Delete Off Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
