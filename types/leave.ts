export type LeaveType = 'FULL' | 'AM' | 'PM';

export interface Leave {
  original: string;
  parsed: string;
}

export interface ParsedLeave {
  date: string;
  type: LeaveType;
}

export interface LeaveItem {
  original: string;
  date: string;
  type: LeaveType;
  dateObj: Date;
  name: string;
  role: string;
  isDuplicate?: boolean;
  warning?: string | null;
}
