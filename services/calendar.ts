async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP Error: ${res.status}`);
  }
  return res.json();
}

export async function addLeave(name: string, date: string): Promise<void> {
  const res = await fetch('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date }),
  });
  await handleResponse(res);
}

export async function updateLeave(name: string, oldDate: string, newDate: string): Promise<void> {
  const res = await fetch('/api/calendar', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, oldDate, newDate }),
  });
  await handleResponse(res);
}

export async function deleteLeave(name: string, date: string): Promise<void> {
  const res = await fetch('/api/calendar', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date }),
  });
  await handleResponse(res);
}
