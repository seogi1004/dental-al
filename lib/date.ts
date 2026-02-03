import { ParsedLeave } from '@/types';

export const getTodayString = (): string => new Date().toISOString().split('T')[0];

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
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  
  const [_, year, month, day] = match;
  return d.getFullYear() === parseInt(year) &&
         d.getMonth() === parseInt(month) - 1 &&
         d.getDate() === parseInt(day);
};

export const formatDate = (dateStr: string): string => {
  const { date, type } = parseLeaveDate(dateStr);
  if (!date || isNaN(new Date(date).getTime())) return dateStr;
  
  const d = new Date(date);
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const formatted = `${d.getMonth() + 1}/${d.getDate()}(${week[d.getDay()]})`;
  
  return type === 'FULL' ? formatted : `${formatted} ${type}`;
};
