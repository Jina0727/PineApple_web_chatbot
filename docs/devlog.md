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

## 현재 상태

- **구성**: Next.js 14 + TypeScript / 생성=`gpt-4o-mini` / 임베딩=`text-embedding-3-small`(기본) / 인메모리 벡터검색.
- **지식베이스**: 한국어 + 영어 (사이트 30페이지 기반, FAQ 포함).
- **품질 장치**: 환각 가드, threshold(openai 0.25 / local 0.83), rate limit, 입력/히스토리 cap, 검색 eval(14/14).
- **검증**: `next build` ✅, `npm run eval` ✅ 14/14.
- **실행**: `.env.local`에 `OPENAI_API_KEY` 입력 후 `npm run dev` → http://localhost:3000.

## 다음 후보

- [ ] **배포(Vercel)** — 공개 URL 확보 (`data/` outputFileTracing 포함)
- [ ] **사이트 위젯 임베드** — softstorycorp.com에 iframe 또는 직접 통합
- [ ] **하이브리드 검색**(벡터 + 키워드 BM25) — 일반 질의 검색 정확도 한 단계 더
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
