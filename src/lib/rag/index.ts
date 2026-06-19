/**
 * RAG 오케스트레이션 — 색인(ingestion)과 검색(retrieve)을 한곳에서 묶는다.
 *
 *  [색인]  knowledge-base.md → 청킹 → 임베딩 → VectorStore에 적재   (서버에서 1회)
 *  [검색]  사용자 질문 → 임베딩 → VectorStore.search() → 상위 K개 조각
 *
 * 색인은 비싸므로(임베딩 모델 로딩 + 전 조각 임베딩) Promise를 캐시해 단 한 번만 한다.
 * 지식베이스를 수정했다면 서버를 재시작하면 다시 색인된다.
 */

import fs from "node:fs";
import path from "node:path";
import { chunk } from "./chunk";
import { embed, embedAll, embeddingProvider } from "./embeddings";
import { VectorStore, type SearchResult } from "./store";

let storePromise: Promise<VectorStore> | null = null;

async function buildStore(): Promise<VectorStore> {
  // 1) data 폴더의 모든 .md 파일을 읽는다.
  //    (knowledge-base.md = 한국어, knowledge-base-en.md = 영어 … 파일을 추가만 하면 자동 색인)
  const dataDir = path.join(process.cwd(), "data");
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  // 2) 파일마다 청킹해서 한데 모은다.
  const texts: string[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dataDir, file), "utf-8");
    for (const c of chunk(raw)) texts.push(c.text);
  }

  // 3) 모든 조각을 임베딩 ("passage:" 접두사)
  const vectors = await embedAll(texts, "passage");

  // 4) 저장소에 적재
  const store = new VectorStore();
  texts.forEach((t, i) => store.add({ text: t, embedding: vectors[i] }));

  console.log(
    `[RAG] 지식베이스 색인 완료: ${files.length}개 파일, ${store.size}개 조각 (임베딩=${embeddingProvider})`,
  );
  return store;
}

/** 색인된 저장소를 얻는다(최초 1회만 실제 색인 수행). */
export function getStore(): Promise<VectorStore> {
  if (!storePromise) storePromise = buildStore();
  return storePromise;
}

/**
 * 질문과 의미가 가까운 지식 조각 topK개를 찾는다.
 * @param query 사용자 질문
 * @param topK  가져올 조각 수 (기본 3)
 */
// 최소 유사도 컷오프. 이보다 낮은 조각은 '관련 없음'으로 보고 컨텍스트에 넣지 않는다.
// → 관련 자료가 없을 때 GPT가 지어내지 않고 '문의 안내'로 빠지게 하는 환각 방지 장치.
// e5 점수는 전반적으로 높게 몰려 있으니, 값은 `npm run eval`로 점수 분포를 보고 튜닝하세요.
// 최소 유사도 컷오프 — 임베딩 제공자마다 점수 분포가 달라 기본값이 다르다(둘 다 eval로 보정).
//   · local(e5-small):                무관~0.82 / 관련 0.84+  → 0.83 (간격이 좁아 빠듯)
//   · openai(text-embedding-3-small):  무관~0.22 / 관련 0.28+  → 0.25 (간격이 ~4.5배 넓어 안정적)
//   `npm run eval`로 점수 분포를 보고 RAG_MIN_SCORE로 언제든 덮어쓸 수 있다.
const MIN_SCORE = Number(
  process.env.RAG_MIN_SCORE ?? (embeddingProvider === "local" ? 0.83 : 0.25),
);

export async function retrieve(query: string, topK = 3): Promise<SearchResult[]> {
  const store = await getStore();
  const queryEmbedding = await embed(query, "query"); // 질문은 "query:" 접두사
  const all = store.search(queryEmbedding, topK);
  const results = all.filter((r) => r.score >= MIN_SCORE); // ← 임계값 컷

  // 학습용: 통과/탈락 조각과 점수를 서버 터미널에서 확인 (threshold 튜닝에 유용).
  console.log(
    `[RAG] 질문="${query.slice(0, 40)}…" → 통과 ${results.length}/${all.length} (컷오프 ${MIN_SCORE}):`,
    all.map(
      (r) =>
        `${r.score >= MIN_SCORE ? "✓" : "✗"}(${r.score.toFixed(3)}) ${r.text.slice(0, 24)}…`,
    ),
  );

  return results;
}
