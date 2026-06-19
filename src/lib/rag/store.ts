/**
 * 벡터 저장소(Vector Store) — RAG의 심장.
 *
 * [무엇을 배우나]
 * "벡터 DB"라는 마법 상자 없이도 검색이 그냥 수학(코사인 유사도)이라는 것을 직접 본다.
 * 데이터가 작을 때는 모든 조각과 일일이 유사도를 계산해도 충분히 빠르다.
 * 데이터가 수천~수만 개로 커지면 이 클래스를 실제 벡터 DB(pgvector, Chroma 등)로
 * 교체하면 된다 — 개념은 동일하고, 그쪽은 ANN으로 더 빠르게 찾아줄 뿐이다.
 */

export interface VectorRecord {
  /** 원문 조각 텍스트 */
  text: string;
  /** 조각의 임베딩 벡터 */
  embedding: number[];
}

export interface SearchResult {
  text: string;
  /** 질문과의 코사인 유사도 (1에 가까울수록 비슷함) */
  score: number;
}

/**
 * 코사인 유사도 = (A·B) / (|A| × |B|)
 * 두 벡터가 이루는 각도의 코사인. 의미가 비슷할수록 1에 가깝다.
 *
 * 참고: 우리 임베딩은 정규화(normalize)되어 있어 |A|=|B|=1 이므로 사실상 내적과 같다.
 * 그래도 개념이 드러나도록 일반식을 그대로 구현한다.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class VectorStore {
  private records: VectorRecord[] = [];

  add(record: VectorRecord): void {
    this.records.push(record);
  }

  get size(): number {
    return this.records.length;
  }

  /**
   * 질문 벡터와 가장 비슷한 조각 topK개를 유사도 내림차순으로 반환한다.
   * (전수 계산 → 정렬 → 상위 K개. 작은 데이터에는 이걸로 충분하다.)
   */
  search(queryEmbedding: number[], topK = 3): SearchResult[] {
    return this.records
      .map((r) => ({
        text: r.text,
        score: cosineSimilarity(queryEmbedding, r.embedding),
      }))
      .sort((x, y) => y.score - x.score)
      .slice(0, topK);
  }
}
