"use client";

/**
 * 채팅 UI (클라이언트 컴포넌트)
 *
 * - 사용자가 입력하면 전체 대화를 POST /api/chat 으로 보낸다.
 * - 서버는 GPT의 답변을 "텍스트 스트림"으로 흘려보내고, 여기서는 도착하는 대로
 *   마지막 어시스턴트 메시지에 이어 붙여 실시간으로 보여준다(타이핑 효과).
 */

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// 처음 화면에 보여줄 추천 질문(빠른 시작용 칩)
const SUGGESTIONS = [
  "어떻게 시작하나요?",
  "성우는 어떻게 골라요?",
  "감정 톤은 어떻게 써요?",
  "긴 글도 만들 수 있나요?",
];

// 봇 답변에 섞여 나오는 마크다운 서식 기호를 제거해 평범한 텍스트로 보여준다.
function toPlain(text: string): string {
  return text
    .replace(/\*+/g, "") // **굵게**, *기울임* 마커
    .replace(/`+/g, "") // 백틱
    .replace(/^\s*#{1,6}\s+/gm, ""); // 제목 #
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 추가될 때마다 맨 아래로 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // 1) 사용자 메시지 + 빈 어시스턴트 메시지(여기에 스트림을 채워넣음)를 추가
    const history: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      // 2) 스트림을 읽어 마지막(어시스턴트) 메시지에 이어 붙인다.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { role: "assistant", content: last.content + piece };
          return copy;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "연결 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="chat__brand">
          <span className="chat__logo">🍍</span>
          <div>
            <strong>FineApple Voice</strong>
            <p>AI 성우 사용 도우미</p>
          </div>
        </div>
      </header>

      <div className="chat__messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="chat__welcome">
            <p className="chat__welcome-title">처음 오셨나요? 반가워요 👋</p>
            <p className="chat__welcome-sub">
              성우 고르기부터 첫 음성 만들기까지 안내해 드려요. (한국어 · English OK)
            </p>
            <div className="chat__chips">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  className="chip"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`bubble bubble--${m.role}`}>
              {m.content ? (
                m.role === "assistant" ? toPlain(m.content) : m.content
              ) : (
                <span className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <form className="chat__input" onSubmit={onSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요…"
          disabled={loading}
          aria-label="메시지 입력"
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "…" : "전송"}
        </button>
      </form>
    </div>
  );
}
