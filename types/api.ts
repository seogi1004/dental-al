import { StaffData } from './staff';

export type SheetsGetResponse = StaffData;
export type SheetsPostRequest = StaffData;

export interface CalendarPostRequest {
  name: string;
  date: string;
}

export interface CalendarPutRequest {
  name: string;
  oldDate: string;
  newDate: string;
}

export interface CalendarDeleteRequest {
  name: string;
  date: string;
}
