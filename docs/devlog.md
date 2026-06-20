# Soft Story 챗봇 — 개발 로그

> 작업한 내용을 시간순으로 기록하는 로그입니다. 새 작업은 아래에 계속 덧붙이면 됩니다.
> 프로젝트 개요·구조는 [README](../README.md), RAG 원리는 [architecture.md](architecture.md) 참고.

---

## 2026-06-19 — 초기 구축부터 임베딩 전환까지

### 0. 기획 & 핵심 의사결정

- **목적**: [softstorycorp.com](https://www.softstorycorp.com/ko)(한국 기반 성우 녹음·더빙·AI 보이스 스튜디오)에 붙일 마케팅/상담 안내 챗봇.
- **스택**: Next.js 14 (App Router) + TypeScript 풀스택. (프론트 + 백엔드 API Route 통합)
- **지식 주입 방식**: **RAG** 채택. 정보량은 많지 않지만 RAG를 직접 익히는 게 목표라 학습용으로 선택.
- **⚠️ 바로잡은 오해**: "Claude/ChatGPT 구독을 호스팅해서 API 없이 앱에 쓰기"는 **불가능**. 소비자 구독은 개인용이고, 앱에 붙이는 정식 경로는 해당 제공자의 **API(구독과 별개 결제)** 뿐.

### 1. 스캐폴딩 (초기 구조)

18개 파일로 동작하는 RAG 챗봇 골격 생성. 핵심 구조:

```
data/knowledge-base.md      지식 원천
src/lib/rag/                RAG 핵심
  ├ chunk.ts        문서 → 조각
  ├ embeddings.ts   텍스트 → 벡터
  ├ store.ts        인메모리 + 코사인 유사도 (벡터 DB 미사용 — 학습 목적)
  └ index.ts        색인 + 검색
src/lib/prompt.ts          검색결과를 시스템 프롬프트에 주입
src/app/api/chat/route.ts  검색 → LLM 스트리밍
src/components/Chat.tsx     채팅 UI
```

- **벡터 DB 대신 인메모리 배열 + 코사인 유사도**를 직접 구현 → "검색 = 수학(내적)"임을 코드로 확인. 데이터 커지면 `store.ts`/`index.ts`만 교체.
- 검증: `npm install` + `next build` 통과.

### 2. LLM 전환: Claude → OpenAI GPT

- 답변 생성 모델을 **Claude Haiku 4.5 → OpenAI `gpt-4o-mini`** 로 변경 (사용자 요청).
- `@anthropic-ai/sdk` 제거 → `openai` 설치. 호출은 `chat.completions.create({ stream: true })`. 시스템 프롬프트는 messages 배열의 `system` 역할로 전달.
- 환경변수: `ANTHROPIC_API_KEY` → `OPENAI_API_KEY`, `CLAUDE_MODEL` → `OPENAI_MODEL`.

### 3. 보안: API 키 위치 정리

- 실제 키가 **`.env.local.example`(git 커밋되는 템플릿)** 에 들어가 있던 것을 발견 → 키 제거, 템플릿은 자리표시자로 복구.
- 실제 키는 **`.env.local`(gitignore됨)** 로 이동. 노출된 키는 재발급(rotate) 권장.

### 4. 다국어 응답

- 시스템 프롬프트를 "**방문자가 사용한 언어로 답하기**"로 변경. 한국어로 물으면 한국어, 영어로 물으면 영어로.
- 기반 기술이 원래 다국어(임베딩·GPT)라 프롬프트 한 줄 수정으로 적용.

### 5. 지식베이스(DB) 보강 — 멀티에이전트 워크플로우

- 사이트 **한국어+영어 30개 페이지** 수집(회사/서비스 7종/포트폴리오/문의/블로그·보도·약관).
- **14개 에이전트 워크플로우**로 11개 섹션(한/영) 병렬 합성 → FAQ(한/영) → 검수.
- 결과물: `data/knowledge-base.md`(한국어 ~18.6K자) + `data/knowledge-base-en.md`(영어 ~35.8K자), 각 ~94문단.
- `index.ts`를 **`data/`의 모든 `.md` 자동 색인**으로 변경 → 한국어+영어 KB 동시 인덱싱.

### 6. 품질 하드닝 (코드 리뷰 반영)

| 항목 | 내용 | 파일 |
|---|---|---|
| 환각 가드 강화 | 가격·수치 지어내기 금지, 자료 없으면 "문의 안내" | `prompt.ts` |
| 검색 threshold | 유사도 컷오프 `RAG_MIN_SCORE` — 관련 없으면 컨텍스트 미주입 | `index.ts` |
| rate limit | IP당 분당 20회 (인메모리; 운영은 Redis 권장) | `route.ts` |
| 입력 cap | 메시지 1000자 / 히스토리 24개 제한 | `route.ts` |
| chunking cap | 긴 문단은 문장 경계로 분할 | `chunk.ts` |
| 검색 eval | `npm run eval` — 맞는 조각 찾았나 / 무관 질의 걸렀나 측정 | `eval/` |
| e5 prefix 확인 | query/passage 접두사 이미 적용돼 있음 | `embeddings.ts` |

- **eval로 threshold 보정**: 점수 분포를 보고 무관 질의(날씨·비트코인)를 거르도록 값 조정. (측정 → 보정의 실제 과정)

### 7. 임베딩 전환: 로컬 → OpenAI

- **로컬 e5 → OpenAI `text-embedding-3-small`(기본)**, `EMBEDDING_PROVIDER=local`로 로컬 토글 유지(오프라인/학습용).
- `embeddings.ts`만 변경 (chunk·store·retrieve·route는 그대로).
- 임베딩 바꾸면 점수 공간이 달라지므로 **eval로 threshold 재보정**: `0.45 → 0.25` → **eval 14/14**.

**전환 효과 (eval로 측정):**

| | 로컬 e5 | OpenAI |
|---|---|---|
| eval 정확도 | 13/14 | **14/14** |
| 점수 분리 간격 | 0.014 (빠듯) | **0.064 (~4.5배 넓음)** |
| 첫 실행 | ~20~40초(모델 120MB 다운) | **~1~2초** |
| 서버리스 배포 | 무거움 | **가벼움** |
| 비용 | 무료 | ~$0.02/1M토큰 (사실상 0) |

- **보너스**: e5에서 못 풀던 포트폴리오 일반 질의("어떤 작업 해봤나요?") 미스가 OpenAI 임베딩으로 **자동 해결**.

---

## 2026-06-19 (이어서) — 하이브리드 검색: 구현 후 측정으로 기본 off

### 8. 하이브리드 검색 (벡터 + BM25)

- **목적**: 고유명사·정확한 용어에 강한 키워드 검색(BM25)을 의미검색(벡터)에 결합해 정확도 향상.
- **구현**: `bm25.ts`에 BM25를 **직접 구현**(한국어는 2-gram 토큰화). `index.ts`에서 벡터+BM25를 **RRF(Reciprocal Rank Fusion)**로 융합(벡터 가중 2 : BM25 1). 관련성 게이트(벡터 코사인 컷오프)는 유지.
- **측정 (eval로 비교)**: 벡터 단독 **16/16** vs 하이브리드 **15/16**.
  - OpenAI 임베딩이 고유명사("타이거 블레이드", "Neumann")까지 의미로 이미 잘 잡아, 이 규모(116조각)에선 BM25가 노이즈만 추가. "어떤 작업…" 같은 흔한 단어 질문에서 좋은 벡터 결과를 덮음(벡터 가중치를 높여도 회복 안 됨).
- **결정**: 하이브리드는 **구현해두되 기본 off** (`HYBRID_SEARCH=on`으로 토글). 이점은 **임베딩이 약하거나(local) KB가 커질 때** 나타나므로 그때를 위한 도구로 보유.
- **교훈**: "더 많은 기계장치 ≠ 더 좋음." 도입 전에 측정한 게 답을 줬다.

### 9. 배포 준비 (Vercel)

- **GitHub 푸시**: 초기 커밋 후, 하이브리드·배포설정까지 push (repo: github.com/Jina0727/PineApple_web_chatbot). `.env.local`(실제 키)은 gitignore로 제외 확인.
- **서버리스 대비 `next.config.mjs` 2가지**:
  - `outputFileTracingIncludes`로 `data/**` 함수 번들에 포함 — 동적 `fs.readFileSync`라 자동 추적이 안 되기 때문(없으면 배포 후 지식베이스 못 읽어 에러).
  - `outputFileTracingExcludes`로 `@xenova/transformers`·`onnxruntime-node` 제외 — OpenAI 임베딩이 기본이라 런타임 불필요, 함수 크기 250MB 한도 폭증 방지.
- **배포 흐름**: Vercel에서 이 GitHub repo import → 환경변수 `OPENAI_API_KEY` 등록 → 배포. `.env.local`은 커밋 안 되므로 **Vercel 대시보드에 환경변수를 직접 등록**해야 함.

---

## 2026-06-20 — 배포 & 디버깅: "범인은 테스트 도구"

### 10. Vercel 배포
- GitHub import로 첫 배포(`d49e9c6`)는 됐지만, 이후 `git push` 자동배포가 안 됨(프로덕션이 22시간째 옛 커밋, "Ready **Stale**").
- 해결: **Vercel CLI `vercel --prod`** 로 로컬 코드를 직접 배포. 공개 URL: https://pine-apple-web-chatbot.vercel.app

### 11. "한국어만 실패" 디버깅 — 알고 보니 테스트 도구 문제
- 증상: 배포 후 curl 테스트에서 **영어는 정상, 한국어는 전부 "문의 안내"로 빠짐.**
- 헛다리: "한국어 KB가 배포에 누락"으로 추정 → KB를 빌드 시 인라인(`bundle-kb.mjs` → `kb.generated.ts`)하는 방식으로 전환. (이건 그 자체로 서버리스 파일추적 의존성을 없애는 개선이라 그대로 유지)
- 진짜 원인: 진단용 `/api/health` 를 붙여 보니 **프로덕션에서 한국어 KB가 멀쩡히 색인됐고(2파일·116조각), "한국어 더빙" 질문이 0.657로 매칭**됨 → 검색은 정상이었음.
- 결정타: `curl -d '...한국어...'`(인라인)는 **Git Bash/Windows에서 한국어를 CP949로 깨뜨려** 전송 → 프로덕션이 깨진 글자를 못 찾은 것. **UTF-8 파일(`--data-binary @file`)로 보내니 완벽한 한국어 답변.**
- 교훈: 측정값이 모순될 때(health 0.657인데 chat 실패)는 **앱보다 테스트 경로를 먼저 의심**할 것. 윈도우에서 비ASCII는 CLI 인자 대신 파일로.

### 12. 최종 검증 (프로덕션, UTF-8)
- [KO] 한국어 더빙 / 하이브리드 60% / 회사주소·대표 → 모두 정확 ✅
- [EN] 영어 질문 → 영어 답변 ✅
- [무관] 비트코인 → 환각 가드 작동(안 지어냄) ✅

---

## 현재 상태

- **구성**: Next.js 14 + TypeScript / 생성=`gpt-4o-mini` / 임베딩=`text-embedding-3-small`(기본) / 인메모리 벡터검색.
- **지식베이스**: 한국어 + 영어 (사이트 30페이지 기반, FAQ 포함).
- **품질 장치**: 환각 가드, threshold(openai 0.25 / local 0.83), rate limit, 입력/히스토리 cap, 검색 eval(**16/16**), 하이브리드 검색(구현·기본 off).
- **검증**: `next build` ✅, `npm run eval` ✅ 14/14.
- **실행**: `.env.local`에 `OPENAI_API_KEY` 입력 후 `npm run dev` → http://localhost:3000.

## 다음 후보

- [x] ~~**배포(Vercel)**~~ — 완료: https://pine-apple-web-chatbot.vercel.app (한/영/환각가드 검증). KB는 빌드 시 인라인
- [ ] **사이트 위젯 임베드** — softstorycorp.com에 iframe 또는 직접 통합
- [x] ~~하이브리드 검색(벡터+BM25)~~ — 구현 완료, 측정 결과 **기본 off**(벡터 단독 16/16 > 하이브리드 15/16). `HYBRID_SEARCH=on` 토글
- [ ] **출처 표시 UI** — 어떤 문단에서 답이 나왔는지 화면에 노출
- [ ] **실무 정보 보강** — 가격/납품포맷/수정정책 등(사이트에 없어 현재는 "문의 안내"로 처리)

## 환경변수 정리

| 변수 | 기본값 | 용도 |
|---|---|---|
| `OPENAI_API_KEY` | (필수) | OpenAI API 키 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 생성 모델 |
| `EMBEDDING_PROVIDER` | `openai` | `local`로 로컬 임베딩 전환 |
| `OPENAI_EMBED_MODEL` | `text-embedding-3-small` | 임베딩 모델 |
| `RAG_MIN_SCORE` | openai 0.25 / local 0.83 | 검색 유사도 컷오프 |
| `HYBRID_SEARCH` | `off` | `on`이면 벡터+BM25 하이브리드 검색 |
