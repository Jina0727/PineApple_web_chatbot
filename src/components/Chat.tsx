"use client";

/**
 * 채팅 UI (클라이언트 컴포넌트)
 *
 * - 사용자가 입력하면 전체 대화를 POST /api/chat 으로 보낸다.
 * - 서버는 GPT의 답변을 "텍스트 스트림"으로 흘려보내고, 여기서는 도착하는 대로
 *   마지막 어시스턴트 메시지에 이어 붙여 실시간으로 보여준다(타이핑 효과).
 * - 헤더의 한국어/EN 토글로 UI 문구(환영·추천질문·버튼)를 전환한다.
 *   (봇 답변 자체는 백엔드가 사용자가 쓴 언어를 감지해 같은 언어로 답한다.)
 */

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Lang = "ko" | "en";

// UI 문구 모음 — 토글에 따라 한국어/영어로 전환된다.
const STRINGS: Record<
  Lang,
  {
    brandSub: string;
    welcomeTitle: string;
    welcomeSub: string;
    suggestions: string[];
    placeholder: string;
    send: string;
    ariaInput: string;
    errorConnect: string;
  }
> = {
  ko: {
    brandSub: "AI 성우 사용 도우미",
    welcomeTitle: "처음 오셨나요? 반가워요 👋",
    welcomeSub: "성우 고르기부터 첫 음성 만들기까지 안내해 드려요.",
    suggestions: [
      "어떻게 시작하나요?",
      "성우는 어떻게 골라요?",
      "감정 톤은 어떻게 써요?",
      "긴 글도 만들 수 있나요?",
    ],
    placeholder: "메시지를 입력하세요…",
    send: "전송",
    ariaInput: "메시지 입력",
    errorConnect: "연결 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
  },
  en: {
    brandSub: "Your AI voice guide",
    welcomeTitle: "First time here? Welcome 👋",
    welcomeSub: "I'll guide you from picking a voice to your first audio.",
    suggestions: [
      "How do I get started?",
      "How do I pick a voice?",
      "How do I use emotion tones?",
      "Can I make long text?",
    ],
    placeholder: "Type a message…",
    send: "Send",
    ariaInput: "Message input",
    errorConnect: "Something went wrong connecting. Please try again shortly.",
  },
};

// 봇 답변에 섞여 나오는 마크다운 서식 기호를 제거해 평범한 텍스트로 보여준다.
function toPlain(text: string): string {
  return text
    .replace(/\*+/g, "") // **굵게**, *기울임* 마커
    .replace(/`+/g, "") // 백틱
    .replace(/^\s*#{1,6}\s+/gm, ""); // 제목 #
}

export default function Chat() {
  const [lang, setLang] = useState<Lang>("ko");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 방문자 브라우저 언어로 초기 언어 결정(한국어가 아니면 영어로 시작 — 외국인 대상).
  // SSR 불일치를 피하려고 마운트 후에 설정한다.
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      !navigator.language.toLowerCase().startsWith("ko")
    ) {
      setLang("en");
    }
  }, []);

  // 새 메시지가 추가될 때마다 맨 아래로 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const t = STRINGS[lang];

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
        copy[copy.length - 1] = { role: "assistant", content: t.errorConnect };
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
            <p>{t.brandSub}</p>
          </div>
        </div>
        <div className="chat__lang" role="group" aria-label="Language">
          <button
            type="button"
            className={lang === "ko" ? "active" : ""}
            onClick={() => setLang("ko")}
            aria-pressed={lang === "ko"}
          >
            한국어
          </button>
          <button
            type="button"
            className={lang === "en" ? "active" : ""}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
      </header>

      <div className="chat__messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="chat__welcome">
            <p className="chat__welcome-title">{t.welcomeTitle}</p>
            <p className="chat__welcome-sub">{t.welcomeSub}</p>
            <div className="chat__chips">
              {t.suggestions.map((q) => (
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
          placeholder={t.placeholder}
          disabled={loading}
          aria-label={t.ariaInput}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "…" : t.send}
        </button>
      </form>
    </div>
  );
}
