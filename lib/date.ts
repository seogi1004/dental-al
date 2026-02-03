import { ParsedLeave } from '@/types';

export const getTodayString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseLeaveDate = (dateStr: string): ParsedLeave => {
  if (!dateStr) return { date: '', type: 'FULL' };
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})(?:\s*\((AM|PM)\))?$/);
  if (match) {
      return { date: match[1], type: (match[2] as 'AM' | 'PM' | undefined) || 'FULL' };
  }
  return { date: dateStr, type: 'FULL' };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr || dateStr.trim() === '') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  
  const [_, year, month, day] = match;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1;
  const d = parseInt(day, 10);
  
  const dateObj = new Date(y, m, d);
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj.getFullYear() === y &&
         dateObj.getMonth() === m &&
         dateObj.getDate() === d;
};

export const formatDate = (dateStr: string): string => {
  const { date, type } = parseLeaveDate(dateStr);
  if (!date) return dateStr;

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;

  const [_, year, month, day] = match;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1;
  const d = parseInt(day, 10);
  
  const dateObj = new Date(y, m, d);
  if (isNaN(dateObj.getTime())) return dateStr;
  
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const formatted = `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${week[dateObj.getDay()]})`;
  
  return type === 'FULL' ? formatted : `${formatted} ${type}`;
};
