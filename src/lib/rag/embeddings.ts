/**
 * 임베딩(Embedding) — 텍스트를 "의미를 담은 숫자 배열(벡터)"로 변환하는 단계.
 *
 * [제공자(provider) 토글]
 *   - openai (기본): OpenAI `text-embedding-3-small` API 사용. 가볍고 빠르며(모델 다운로드 없음)
 *                    서버리스 배포에 적합. 점수 분리가 또렷해 threshold가 안정적.
 *   - local        : transformers.js `Xenova/multilingual-e5-small`를 로컬에서 구동(무료/오프라인).
 *                    학습용. e5는 query/passage 접두사가 필요하고 점수 마진이 얇다.
 *   env `EMBEDDING_PROVIDER=local` 로 전환. (기본은 openai)
 *
 * [중요] 색인과 질문은 반드시 같은 provider로 임베딩해야 한다(벡터 공간이 달라지므로).
 *        provider를 바꾸면 서버 재시작 시 자동 재색인되고, threshold(RAG_MIN_SCORE)도 다시 맞춰야 한다.
 *
 * [생성 모델과의 관계] 답변 생성은 OpenAI GPT가, "텍스트→벡터"는 이 모듈이 담당한다(별개 모델).
 */

import OpenAI from "openai";
import type { FeatureExtractionPipeline } from "@xenova/transformers";

const PROVIDER = (process.env.EMBEDDING_PROVIDER ?? "openai").toLowerCase();
const OPENAI_EMBED_MODEL =
  process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
const LOCAL_MODEL = "Xenova/multilingual-e5-small";

export const embeddingProvider = PROVIDER;

// ─── OpenAI provider ─────────────────────────────────────────────────────────
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  return (openaiClient ??= new OpenAI()); // OPENAI_API_KEY 환경변수 자동 사용
}

async function embedOpenAI(texts: string[]): Promise<number[][]> {
  // OpenAI 임베딩은 e5 같은 query/passage 접두사가 필요 없다.
  const res = await getOpenAI().embeddings.create({
    model: OPENAI_EMBED_MODEL,
    input: texts,
  });
  // 입력 순서대로 반환되지만, 안전하게 index로 정렬해 매핑한다.
  return res.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ─── Local provider (transformers.js) ────────────────────────────────────────
// 동적 import로, openai를 쓸 때는 무거운 transformers를 아예 로드하지 않는다.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;
function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", LOCAL_MODEL),
    );
  }
  return extractorPromise;
}

async function embedLocal(
  text: string,
  kind: "query" | "passage",
): Promise<number[]> {
  const extractor = await getExtractor();
  // e5 규칙: 질문은 "query:", 문서 조각은 "passage:" 접두사.
  const out = await extractor(`${kind}: ${text}`, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(out.data as Float32Array);
}

// ─── 공개 API ────────────────────────────────────────────────────────────────
/** 텍스트 하나를 벡터로 변환한다. kind는 local(e5)에서만 의미가 있다. */
export async function embed(
  text: string,
  kind: "query" | "passage",
): Promise<number[]> {
  if (PROVIDER === "local") return embedLocal(text, kind);
  const [vec] = await embedOpenAI([text]);
  return vec;
}

/** 여러 텍스트를 임베딩한다(색인 단계). openai는 배치 호출로 빠르게 처리. */
export async function embedAll(
  texts: string[],
  kind: "query" | "passage",
): Promise<number[][]> {
  if (PROVIDER === "local") {
    const out: number[][] = [];
    for (const t of texts) out.push(await embedLocal(t, kind));
    return out;
  }
  // OpenAI: 한 번에 여러 개 보낼 수 있다(요청당 100개씩 나눠 호출).
  const out: number[][] = [];
  const BATCH = 100;
  for (let i = 0; i < texts.length; i += BATCH) {
    out.push(...(await embedOpenAI(texts.slice(i, i + BATCH))));
  }
  return out;
}
