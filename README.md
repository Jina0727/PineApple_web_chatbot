# Soft Story 챗봇 (RAG 기반)

[Soft Story Corp](https://www.softstorycorp.com/ko) 웹사이트에 붙일 **마케팅/상담 안내 챗봇**입니다.
방문자가 더빙·성우 녹음·AI 보이스 서비스에 대해 물으면, 회사 지식베이스에서 관련 내용을
찾아(RAG) GPT가 한국어로 답변합니다.

> 이 프로젝트는 **RAG(Retrieval-Augmented Generation)를 직접 손으로 익히는 학습용**으로
> 설계되었습니다. 그래서 벡터 DB 같은 외부 인프라 없이, **메모리 배열 + 코사인 유사도**로
> 검색을 직접 구현합니다. 데이터가 커지면 이 부분만 실제 벡터 DB로 교체하면 됩니다.
> 자세한 구조 설명은 [docs/architecture.md](docs/architecture.md) 참고.

---

## 기술 스택

| 구분 | 사용 기술 | 비고 |
|---|---|---|
| 프레임워크 | **Next.js 14 (App Router) + TypeScript** | 프론트 + 백엔드(API Route) 통합 |
| 답변 생성(LLM) | **OpenAI GPT-4o mini** (`gpt-4o-mini`) | OpenAI API. 저렴·빠름 |
| 임베딩 | **OpenAI** `text-embedding-3-small` (기본) / 로컬 `multilingual-e5-small` (토글) | `EMBEDDING_PROVIDER`로 전환 |
| 벡터 검색 | **인메모리 + 코사인 유사도** (직접 구현) | 학습 목적. 추후 벡터 DB로 교체 가능 |

> 💡 **임베딩과 생성은 다른 모델입니다.** "텍스트 → 벡터"(임베딩)와 "답변 생성"은 별개예요.
> 기본값은 둘 다 OpenAI (임베딩=`text-embedding-3-small`, 생성=`gpt-4o-mini`)입니다.
> 학습용으로 임베딩만 로컬에서 돌리려면 `.env.local`에 `EMBEDDING_PROVIDER=local`을 설정하세요.

---

## 빠르게 시작하기

```bash
# 1) 의존성 설치
npm install

# 2) API 키 설정 — .env.local.example를 복사해서 .env.local 생성 후 키 입력
cp .env.local.example .env.local
#   .env.local 안의 OPENAI_API_KEY=... 를 실제 키로 채우세요.
#   키 발급: https://platform.openai.com/api-keys  (ChatGPT 구독과 별개, 사용량 과금)

# 3) 개발 서버 실행
npm run dev
#   http://localhost:3000 접속
```

> 💡 첫 메시지에 지식베이스를 한 번 색인합니다(서버 시작 후 1회). OpenAI 임베딩 기본값에선
> 빠릅니다(~1~2초). 로컬 모드(`EMBEDDING_PROVIDER=local`)는 첫 실행에 모델(~120MB)을
> 내려받느라 20~40초 걸린 뒤 빨라집니다.

---

## 디렉토리 구조

```
.
├── data/
│   └── knowledge-base.md        # 챗봇이 학습하는 지식 (Soft Story 사이트 내용)
├── docs/
│   └── architecture.md          # RAG 동작 원리 + 설계 설명 (학습 문서)
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts     # 백엔드: 검색(RAG) → GPT 스트리밍 호출
│   │   ├── layout.tsx
│   │   ├── page.tsx              # 채팅 페이지
│   │   └── globals.css
│   ├── components/
│   │   └── Chat.tsx              # 채팅 UI (스트리밍 표시)
│   └── lib/
│       ├── rag/
│       │   ├── embeddings.ts     # 텍스트 → 벡터 (OpenAI 기본 / 로컬 토글)
│       │   ├── chunk.ts          # 문서 → 조각(chunk) 자르기
│       │   ├── store.ts          # 인메모리 벡터 저장소 + 코사인 유사도  ← RAG의 심장
│       │   └── index.ts          # 색인(ingestion) + 검색(retrieve) 오케스트레이션
│       └── prompt.ts             # 검색 결과를 끼워넣은 시스템 프롬프트 생성
├── .env.local.example
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

## 지식베이스 수정하기

챗봇이 아는 내용은 전부 [data/knowledge-base.md](data/knowledge-base.md) 한 파일에 있습니다.
- 내용을 고치면 **서버를 재시작**하면 다시 색인됩니다.
- 새 서비스/FAQ를 추가하려면 빈 줄로 문단을 구분해서 적으면 됩니다 (문단 단위로 잘려 색인됨).

---

## Soft Story 웹사이트에 붙이기 (위젯)

이 앱은 독립 실행되는 채팅 페이지입니다. 실제 사이트(softstorycorp.com)에 띄우는 방법은
[docs/architecture.md](docs/architecture.md)의 **"기존 사이트에 위젯으로 붙이기"** 절 참고.
요약하면: Vercel에 배포 → 사이트에 `<iframe>` 또는 작은 스크립트로 챗 위젯 삽입.

---

## 다음 단계 (확장 아이디어)

- [ ] 검색된 출처(어느 문단에서 답이 나왔는지)를 화면에 표시 — RAG 디버깅에 유용
- [ ] 인메모리 저장소 → 실제 벡터 DB(pgvector, Chroma, LanceDB)로 교체
- [x] ~~임베딩 OpenAI 전환~~ — 완료(기본값). e5 대비 검색 품질·점수 분리 개선, 서버리스 호환
- [ ] 하이브리드 검색(벡터 + 키워드 BM25) — 일반 질의 검색 정확도 추가 보강
- [ ] 문의 폼 연동 (견적 문의로 자연스럽게 유도)
- [ ] 우측 하단 플로팅 위젯 UI
