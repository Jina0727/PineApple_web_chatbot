/**
 * RAG 오케스트레이션 — 색인(ingestion)과 검색(retrieve)을 한곳에서 묶는다.
 *
 *  [색인]  data/*.md → 청킹 → (벡터 임베딩 + BM25 키워드) 두 인덱스 적재   (서버에서 1회)
 *  [검색]  질문 → 벡터 검색으로 '관련성 게이트' → 통과하면 벡터+BM25를 RRF로 융합
 *
 * 하이브리드 검색: 벡터(의미)와 BM25(정확한 단어)를 결합해 검색 정확도를 높인다.
 *   - 끄려면 env `HYBRID_SEARCH=off` (벡터 단독으로 동작).
 */

import fs from "node:fs";
import path from "node:path";
import { chunk } from "./chunk";
import { embed, embedAll, embeddingProvider } from "./embeddings";
import { VectorStore, type SearchResult } from "./store";
import { BM25Index } from "./bm25";

// 하이브리드 검색 on/off — 기본 off.
//   이 규모(OpenAI 임베딩 + ~116조각)에선 벡터 단독이 eval상 더 정확했다(16/16 vs 15/16):
//   임베딩이 좋아 고유명사도 의미검색으로 잡혀, BM25가 보태는 건 노이즈뿐이었다.
//   하이브리드의 이점은 임베딩이 약하거나(local 모드) KB가 훨씬 커질 때 나타난다.
//   `HYBRID_SEARCH=on`으로 켜서 직접 비교해 볼 수 있다(`npm run eval`).
const HYBRID = (process.env.HYBRID_SEARCH ?? "off").toLowerCase() === "on";

// 최소 유사도 컷오프 — 임베딩 제공자마다 점수 분포가 달라 기본값이 다르다(둘 다 eval로 보정).
//   · local(e5-small):                무관~0.82 / 관련 0.84+  → 0.83 (간격이 좁아 빠듯)
//   · openai(text-embedding-3-small):  무관~0.22 / 관련 0.28+  → 0.25 (간격이 ~4.5배 넓어 안정적)
//   `npm run eval`로 점수 분포를 보고 RAG_MIN_SCORE로 언제든 덮어쓸 수 있다.
const MIN_SCORE = Number(
  process.env.RAG_MIN_SCORE ?? (embeddingProvider === "local" ? 0.83 : 0.25),
);

// 각 검색기(벡터/BM25)에서 융합 전에 가져올 후보 수
const CANDIDATES = 10;

interface RagIndex {
  store: VectorStore;
  bm25: BM25Index;
}

let indexPromise: Promise<RagIndex> | null = null;

async function buildIndex(): Promise<RagIndex> {
  // 1) data 폴더의 모든 .md 파일을 읽어 청킹한다.
  const dataDir = path.join(process.cwd(), "data");
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const texts: string[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dataDir, file), "utf-8");
    for (const c of chunk(raw)) texts.push(c.text);
  }

  // 2) 벡터 인덱스 (의미 검색용)
  const vectors = await embedAll(texts, "passage");
  const store = new VectorStore();
  texts.forEach((t, i) => store.add({ text: t, embedding: vectors[i] }));

  // 3) BM25 키워드 인덱스 (정확한 단어 검색용)
  const bm25 = new BM25Index();
  texts.forEach((t) => bm25.add(t));
  bm25.build();

  console.log(
    `[RAG] 색인 완료: ${files.length}개 파일, ${store.size}개 조각 ` +
      `(임베딩=${embeddingProvider}, 하이브리드=${HYBRID ? "on" : "off"})`,
  );
  return { store, bm25 };
}

/** 색인된 인덱스를 얻는다(최초 1회만 실제 색인 수행). */
export function getIndex(): Promise<RagIndex> {
  if (!indexPromise) indexPromise = buildIndex();
  return indexPromise;
}

// RRF 가중치. 우리 임베딩(OpenAI)이 강해서 벡터를 더 신뢰하고, BM25는 보조 부스터로 둔다.
// (동일 가중이면 '작업' 같은 흔한 단어 질문에서 BM25 노이즈가 좋은 벡터 결과를 덮을 수 있음 — eval로 확인)
const W_VECTOR = 2;
const W_BM25 = 1;

/**
 * RRF (Reciprocal Rank Fusion) — 여러 검색기의 '순위'를 합치는 표준 융합법.
 *   각 항목 점수 = Σ weight × 1/(k + 순위).  점수 정규화가 필요 없어 견고하다(k=60이 관례).
 * 벡터와 BM25는 점수 스케일이 완전히 달라서, 점수가 아니라 '순위'로 합친다.
 */
function rrfFuse(
  lists: { items: { text: string }[]; weight: number }[],
  k = 60,
): string[] {
  const score = new Map<string, number>();
  for (const { items, weight } of lists) {
    items.forEach((item, rank) => {
      score.set(item.text, (score.get(item.text) ?? 0) + weight / (k + rank + 1));
    });
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([text]) => text);
}

/**
 * 질문과 관련된 지식 조각 topK개를 찾는다.
 * 1) 벡터 검색으로 관련성을 판단(게이트) → 관련 없으면 빈 결과(환각 방지)
 * 2) 통과하면 벡터 + BM25를 RRF로 융합해 순위 결정
 */
export async function retrieve(query: string, topK = 3): Promise<SearchResult[]> {
  const { store, bm25 } = await getIndex();
  const qVec = await embed(query, "query");

  // 1) 벡터 검색 — 전체 조각을 코사인 순으로 (소규모라 전수 계산 OK)
  const vecRanked = store.search(qVec, store.size);
  const cosineByText = new Map(vecRanked.map((r) => [r.text, r.score]));

  // 2) 관련성 게이트: 최고 코사인이 컷오프 미만이면 'KB에 없는 질문' → 빈 결과
  if (vecRanked.length === 0 || vecRanked[0].score < MIN_SCORE) {
    console.log(
      `[RAG] "${query.slice(0, 30)}…" → 관련 자료 없음 ` +
        `(top 코사인 ${vecRanked[0]?.score.toFixed(3) ?? "—"} < ${MIN_SCORE})`,
    );
    return [];
  }

  // 3) 하이브리드 off면 코사인 상위 topK 그대로
  if (!HYBRID) {
    return vecRanked.slice(0, topK);
  }

  // 4) 하이브리드: 벡터 top-N + BM25 top-N 을 RRF로 융합
  const vecTop = vecRanked.slice(0, CANDIDATES);
  const bmTop = bm25.search(query, CANDIDATES);
  const fusedTexts = rrfFuse([
    { items: vecTop, weight: W_VECTOR },
    { items: bmTop, weight: W_BM25 },
  ]).slice(0, topK);
  const results = fusedTexts.map((text) => ({
    text,
    score: cosineByText.get(text) ?? 0, // 표시는 코사인으로(해석 쉬움), 순위는 RRF
  }));

  console.log(
    `[RAG] "${query.slice(0, 30)}…" → 하이브리드 ${results.length}개 ` +
      `(벡터+BM25 RRF, BM25매칭 ${bmTop.length}개, top코사인 ${vecRanked[0].score.toFixed(3)})`,
  );
  return results;
}
