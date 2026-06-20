import type { Metadata } from "next";
import Chat from "@/components/Chat";

// iframe 위젯 전용 페이지 — 챗 UI가 화면(iframe)을 꽉 채운다.
// 별도로 검색에 노출될 필요가 없으므로 noindex.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedPage() {
  return (
    <main className="embed">
      <Chat />
    </main>
  );
}
