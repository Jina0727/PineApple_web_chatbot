/**
 * 검색 eval 실행기 — `npm run eval`
 *
 * 실제 RAG 검색 파이프라인(retrieve)을 그대로 호출해, 케이스별로
 * "맞는 조각을 찾았는가 / 관련 없는 질문을 걸러냈는가"를 측정한다.
 * 첫 실행은 임베딩 모델 다운로드로 느릴 수 있다.
 *
 * 콘솔에 찍히는 [RAG] 로그의 점수(✓/✗ 와 숫자)를 보고 RAG_MIN_SCORE(컷오프)를 튜닝하면 된다.
 */

import { retrieve } from "../src/lib/rag";
import { cases } from "./cases";

async function main() {
  let pass = 0;
  console.log(`\n=== 검색 eval (${cases.length} cases) ===\n`);

  for (const c of cases) {
    const results = await retrieve(c.q, 3);
    const joined = results
      .map((r) => r.text)
      .join("\n")
      .toLowerCase();

    const ok =
      c.expect.length === 0
        ? results.length === 0 // 관련 없음 케이스: 비어야 통과
        : c.expect.some((k) => joined.includes(k.toLowerCase()));

    if (ok) pass++;
    const top = results[0]?.score.toFixed(3) ?? "—";
    console.log(`${ok ? "✅" : "❌"} [top=${top}] ${c.q}`);
    if (!ok) {
      console.log(
        `     기대: ${c.expect.length ? c.expect.join(" / ") : "(검색결과 없어야 함)"}`,
      );
    }
  }

  const pct = Math.round((100 * pass) / cases.length);
  console.log(`\n검색 정확도: ${pass}/${cases.length} (${pct}%)\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
