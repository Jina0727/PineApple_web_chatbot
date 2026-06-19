/**
 * 백엔드 API Route — RAG의 마지막 'G(Generation)' 단계를 묶는 곳.
 *
 *  요청 흐름:
 *   1) 브라우저가 보낸 대화(messages)를 받는다.
 *   2) 남용 방지: rate limit + 입력 길이 cap 검사 (공개 위젯이라 비용 폭탄 방지)
 *   3) 마지막 사용자 질문으로 지식베이스를 검색한다.        (retrieve)
 *   4) 검색 결과를 시스템 프롬프트에 끼워넣는다.            (buildSystemPrompt)
 *   5) OpenAI GPT에게 스트리밍으로 답변을 요청하고,
 *      생성되는 토큰을 그대로 브라우저로 흘려보낸다.
 *
 *  ⚠️ API 키(OPENAI_API_KEY)는 이 서버 코드에서만 사용된다. 브라우저로 절대 노출 금지.
 */

import OpenAI from "openai";
import { retrieve } from "@/lib/rag";
import { buildSystemPrompt } from "@/lib/prompt";

// transformers.js(임베딩)와 파일 시스템을 쓰므로 Edge가 아닌 Node.js 런타임이 필요하다.
export const runtime = "nodejs";
// 임베딩 모델 최초 다운로드 등으로 첫 요청이 길 수 있어 여유를 둔다(Vercel 기준).
export const maxDuration = 60;

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ---- 남용 방지 설정 ----------------------------------------------------------
const MAX_INPUT_CHARS = 1000; // 사용자 한 메시지 최대 길이
const MAX_MESSAGES = 24; // 보낼 대화 히스토리 최대 개수(프롬프트 폭주 방지)
const RATE_LIMIT = 20; // IP당 허용 요청 수
const RATE_WINDOW_MS = 60_000; // 윈도우(1분)

// 아주 단순한 인메모리 rate limiter.
// ⚠️ 서버리스(Vercel 등)에선 함수 인스턴스마다 메모리가 분리되어 완벽하지 않다.
//    운영에서 제대로 막으려면 Upstash/Redis 같은 공유 저장소를 쓰는 게 정석.
const hits = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "unknown";
}
// -----------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  // (0) API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      "서버에 OPENAI_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요.",
      { status: 500 },
    );
  }

  // (1) Rate limit — 비싼 작업(검색·임베딩·LLM) 전에 먼저 막는다.
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return new Response("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", {
      status: 429,
    });
  }

  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages가 비어 있습니다.", { status: 400 });
  }

  // (2) 입력 길이 cap — 마지막 사용자 메시지가 과도하게 길면 거절
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser && lastUser.content.length > MAX_INPUT_CHARS) {
    return new Response(
      `메시지가 너무 깁니다. (${MAX_INPUT_CHARS}자 이내로 입력해 주세요.)`,
      { status: 400 },
    );
  }

  // (3) 히스토리 cap — 최근 N개만 사용해 프롬프트 폭주를 막는다.
  const trimmed = messages.slice(-MAX_MESSAGES);

  // (4) 검색(RAG): 마지막 사용자 질문으로 관련 조각 찾기
  const retrieved = lastUser ? await retrieve(lastUser.content, 3) : [];

  // (5) 검색 결과를 시스템 프롬프트에 주입
  const system = buildSystemPrompt(retrieved);

  // (6) OpenAI 스트리밍 호출 → 브라우저로 그대로 전달
  const client = new OpenAI(); // OPENAI_API_KEY 환경변수를 자동으로 사용
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // OpenAI는 시스템 프롬프트를 messages 배열의 'system' 역할로 넣는다.
        const completion = await client.chat.completions.create({
          model: MODEL,
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: "system", content: system },
            ...trimmed.map((m) => ({ role: m.role, content: m.content })),
          ],
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        console.error("[chat] OpenAI 호출 오류:", err);
        controller.enqueue(
          encoder.encode("\n\n[죄송합니다. 일시적인 오류가 발생했어요.]"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
