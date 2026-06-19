/**
 * 검색 eval 테스트 케이스.
 *
 * 각 케이스: 질문 q + 기대 키워드 expect.
 * - expect에 키워드가 있으면: 검색된 조각 안에 그 키워드 중 하나라도 있으면 통과(= 맞는 자료를 찾았다).
 * - expect가 빈 배열이면: '검색 결과가 비어야' 통과(= KB에 없는 질문을 threshold가 걸러냄 → 환각 방지).
 *
 * 케이스는 자유롭게 늘려가며 검색 품질을 측정하세요. (RAG는 "되는지"보다 "정확한지"가 핵심)
 */

export interface EvalCase {
  q: string;
  expect: string[];
}

export const cases: EvalCase[] = [
  // --- 서비스/내용 검색 (맞는 조각을 찾아야 통과) ---
  { q: "한국어 더빙 서비스 있나요?", expect: ["한국어 더빙"] },
  { q: "하이브리드 더빙은 비용을 얼마나 아끼나요?", expect: ["60", "하이브리드"] },
  { q: "AI로 음성 만들 수 있어요?", expect: ["Fineapple", "AI 내레이션", "AI 보이스"] },
  { q: "성우 녹음만 따로 맡길 수 있나요?", expect: ["성우 녹음"] },
  { q: "영어 같은 외국어로도 더빙되나요?", expect: ["외국어", "다국어"] },
  { q: "TTS 학습용 음성 데이터셋 살 수 있나요?", expect: ["데이터셋"] },
  { q: "성우가 자기 목소리로 AI를 만들 수 있나요?", expect: ["아티스트 AI", "소유"] },
  { q: "견적 문의는 어떻게 하나요?", expect: ["문의", "business@softstorycorp.com"] },
  { q: "녹음 스튜디오 장비는 뭘 쓰나요?", expect: ["Neumann", "Pro Tools"] },
  { q: "어떤 작업들을 해봤나요?", expect: ["블리피", "타이거", "LG", "카카오"] },

  // --- 영어 질문 (영어 KB를 찾아야 통과) ---
  { q: "What dubbing services do you offer?", expect: ["dubbing", "Korean"] },
  { q: "How can I get a quote?", expect: ["business@softstorycorp.com", "quote", "inquiry"] },

  // --- 키워드/고유명사 (하이브리드 검색이 강한 영역) ---
  { q: "타이거 블레이드 게임도 더빙했나요?", expect: ["타이거", "VR"] },
  { q: "Neumann 마이크로 녹음하나요?", expect: ["Neumann"] },

  // --- 환각 방지: KB에 없는 주제 → threshold가 걸러 검색결과가 비어야 통과 ---
  { q: "오늘 서울 날씨 알려줘", expect: [] },
  { q: "비트코인 시세가 얼마야?", expect: [] },
];
