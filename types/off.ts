export interface Off {
  name: string;        // 이름
  date: string;        // MM/DD 형식 (원본)
  dateParsed: string;  // YYYY-MM-DD 형식 (파싱 후)
  memo?: string;       // 비고
}

export interface OffItem {
  name: string;
  date: string;        // YYYY-MM-DD
  dateObj: Date;
  memo?: string;
}
