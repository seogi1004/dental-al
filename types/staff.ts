import { Leave } from './leave';
import { Off } from './off';

export interface Staff {
  name: string;
  role: string;
  date: string;
  total: number;
  used: number;
  memo: string;
  leaves?: Leave[];
  offs?: Off[];
  isNew?: boolean;
}

export type StaffData = Staff[];
