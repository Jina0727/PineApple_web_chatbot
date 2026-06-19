/**
 * BM25 키워드 검색 — 하이브리드 검색의 '키워드(lexical/희소)' 절반.
 *
 * [왜 필요한가]
 * 벡터 검색은 '의미'에 강하지만, 고유명사·정확한 용어·숫자(예: "타이거 블레이드", "Neumann",
 * "LG", "60%")에는 약할 수 있다. BM25는 정확히 그 '단어가 들어있는 정도'를 점수화한다.
 * 둘을 합치면(하이브리드) 의미 + 정확한 단어를 모두 잡는다.
 *
 * [BM25란] TF-IDF를 개선한 표준 키워드 점수 공식.
 *   - TF(단어 빈도): 그 단어가 문서에 많이 나올수록 ↑ (단, 포화됨)
 *   - IDF(역문서빈도): 흔한 단어일수록 ↓, 희귀한 단어일수록 ↑
 *   - 문서 길이 정규화: 긴 문서가 유리해지지 않게 보정
 * 벡터 DB 없이 코사인을 직접 짠 것처럼, 키워드 검색도 "결국 단어 통계"임을 직접 본다.
 *
 * [한국어 토큰화] 한국어는 조사가 붙어 띄어쓰기로 단어가 깔끔히 안 나뉜다(예: "더빙은").
 * 그래서 형태소 분석기(무거움) 대신, 한글은 2글자(bigram)로 쪼갠다("더빙은"→"더빙","빙은").
 * 이러면 질문의 "더빙"이 문서의 "더빙은" 안에서도 매칭된다. 영어/숫자는 단어 그대로 쓴다.
 */

const K1 = 1.5; // TF 포화 강도
const B = 0.75; // 문서 길이 정규화 강도

function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens: string[] = [];
  // 1) 라틴 문자/숫자 단어 (영어 단어, LG, 이메일 일부 등)
  for (const m of lower.matchAll(/[a-z0-9]+/g)) tokens.push(m[0]);
  // 2) 한글 음절 런 → 2-gram (단어 경계가 모호하므로)
  for (const m of lower.matchAll(/[가-힣]+/g)) {
    const run = m[0];
    if (run.length === 1) tokens.push(run);
    else for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2));
  }
  return tokens;
}

export interface BM25Result {
  text: string;
  score: number;
}

export class BM25Index {
  private docs: string[] = [];
  private tf: Map<string, number>[] = []; // 문서별 단어 빈도
  private len: number[] = []; // 문서별 토큰 수
  private df = new Map<string, number>(); // 단어가 등장한 문서 수
  private avgdl = 0; // 평균 문서 길이

  /** 색인할 문서(조각)를 추가한다. */
  add(text: string): void {
    const toks = tokenize(text);
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    this.docs.push(text);
    this.tf.push(tf);
    this.len.push(toks.length);
  }

  /** 추가가 끝나면 호출 — df/평균길이 등 통계를 계산한다. */
  build(): void {
    this.df.clear();
    for (const tf of this.tf) {
      for (const term of tf.keys()) this.df.set(term, (this.df.get(term) ?? 0) + 1);
    }
    const total = this.len.reduce((s, l) => s + l, 0);
    this.avgdl = total / (this.len.length || 1);
  }

  /** 질문과 BM25 점수가 높은 순으로 topK개 반환(점수 0은 제외). */
  search(query: string, topK: number): BM25Result[] {
    const N = this.docs.length;
    const qTerms = [...new Set(tokenize(query))];
    const out: BM25Result[] = [];

    for (let i = 0; i < N; i++) {
      const tf = this.tf[i];
      const dl = this.len[i];
      let score = 0;
      for (const term of qTerms) {
        const f = tf.get(term);
        if (!f) continue;
        const n = this.df.get(term) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score +=
          idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * dl) / this.avgdl)));
      }
      if (score > 0) out.push({ text: this.docs[i], score });
    }

    return out.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
