import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "더데이치과 연차 관리",
  description: "구글 시트 연동 연차 관리 시스템",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
