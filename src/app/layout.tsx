import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soft Story 챗봇",
  description: "성우 녹음·더빙·AI 보이스 스튜디오 Soft Story Corp 안내 챗봇",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
