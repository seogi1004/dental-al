import { StaffData } from '@/types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP Error: ${res.status}`);
  }
  return res.json();
}

export async function fetchSheets(): Promise<StaffData> {
  const res = await fetch('/api/sheets');
  const data = await handleResponse<StaffData>(res);
  return data && data.length > 0 ? data : [];
}

export async function saveSheets(data: StaffData): Promise<void> {
  const res = await fetch('/api/sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
}
