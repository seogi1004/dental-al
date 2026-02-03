export const addOff = async (name: string, date: string, memo?: string) => {
  const res = await fetch('/api/off', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date, memo })
  });
  if (!res.ok) {
     const errorData = await res.json();
     throw new Error(errorData.error || 'Failed to add off');
  }
  return res.json();
};

export const updateOff = async (name: string, oldDate: string, newDate: string, memo?: string) => {
  const res = await fetch('/api/off', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, oldDate, newDate, memo })
  });
  if (!res.ok) {
     const errorData = await res.json();
     throw new Error(errorData.error || 'Failed to update off');
  }
  return res.json();
};

export const deleteOff = async (name: string, date: string) => {
  const res = await fetch('/api/off', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date })
  });
  if (!res.ok) {
     const errorData = await res.json();
     throw new Error(errorData.error || 'Failed to delete off');
  }
  return res.json();
};
