import { Leave } from './leave';

export interface Staff {
  name: string;
  role: string;
  date: string;
  total: number;
  used: number;
  memo: string;
  leaves?: Leave[];
  isNew?: boolean;
}

export type StaffData = Staff[];
