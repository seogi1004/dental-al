import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: session.accessToken });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = '2026년!A2:F';

    if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      const rows = response.data.values;
      if (!rows || rows.length === 0) return res.status(200).json([]);

      const formattedData = rows.map(row => ({
        name: row[0] || '',
        role: row[1] || '',
        date: row[2] || '',
        total: row[3] || 0,
        used: row[4] || 0,
        memo: row[5] || ''
      }));

      return res.status(200).json(formattedData);
    }

    if (req.method === 'POST') {
      const newData = req.body;
      const rows = newData.map(item => [
        item["이름"], item["직급"], item["입사일"], item["발생"], item["사용"], item["비고"]
      ]);

      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: '2026년!A2:F1000'
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '2026년!A2',
        valueInputOption: 'USER_ENTERED',
        resource: { values: rows },
      });

      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
