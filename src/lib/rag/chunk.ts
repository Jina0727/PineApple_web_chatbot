/**
 * 청킹(Chunking) — 긴 문서를 검색 단위(작은 조각)로 자르는 단계.
 *
 * [왜 필요한가]
 * 임베딩/검색은 "한 덩어리의 의미"를 하나의 벡터로 만든다. 문서 전체를 하나의 벡터로
 * 만들면 너무 많은 주제가 섞여 검색이 부정확해진다. 그래서 의미 단위로 잘게 나눈다.
 *
 * [전략]
 *   1) 빈 줄(문단) 기준으로 나눈다.
 *   2) 너무 긴 단일 문단은 maxChars 한도로 다시 쪼갠다(문장 경계 우선).
 *   3) 짧은 문단들은 maxChars 길이가 될 때까지 이어 붙인다.
 * 실전에서는 조각 간 겹침(overlap), 토큰 기반 길이 측정 등 더 정교한 전략을 쓰지만
 * 개념은 동일하다.
 */

export interface Chunk {
  /** 원문에서의 순번 (디버깅/출처 표시에 사용) */
  id: number;
  /** 조각 텍스트 */
  text: string;
}

/**
 * maxChars를 넘는 긴 텍스트를 문장 경계 기준으로 쪼갠다.
 * 한 문장이 maxChars보다 길면 마지막엔 하드 슬라이스한다.
 */
function splitLong(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  // 문장 끝(. ! ? 。)을 기준으로 분할
  const sentences = text.split(/(?<=[.!?。])\s+/);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && buf.length + s.length + 1 > maxChars) {
      out.push(buf);
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
    // 한 문장 자체가 너무 길면 강제로 잘라낸다.
    while (buf.length > maxChars) {
      out.push(buf.slice(0, maxChars));
      buf = buf.slice(maxChars);
    }
  }
  if (buf) out.push(buf);
  return out;
}

export function chunk(markdown: string, maxChars = 600): Chunk[] {
  // 1) 빈 줄(\n\n) 기준으로 문단을 나누고, 공백/제목/인용 문단은 제거한다.
  //    그리고 maxChars를 넘는 문단은 splitLong으로 미리 쪼갠다.
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0 && !/^#{1,6}\s/.test(p) && !p.startsWith(">"))
    .flatMap((p) => splitLong(p, maxChars));

  // 2) 문단들을 maxChars 한도 안에서 greedy하게 묶는다.
  const chunks: Chunk[] = [];
  let buffer = "";
  for (const para of paragraphs) {
    if (buffer && buffer.length + para.length + 1 > maxChars) {
      chunks.push({ id: chunks.length, text: buffer });
      buffer = para;
    } else {
      buffer = buffer ? `${buffer} ${para}` : para;
    }
  }
  if (buffer) chunks.push({ id: chunks.length, text: buffer });

  return chunks;
}
