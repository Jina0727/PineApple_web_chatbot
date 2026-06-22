# FineApple Voice 온보딩 지식베이스 (한/영) — 데모

> fineapplevoice.com 온보딩 챗봇이 사용하는 지식베이스입니다.
> 사실은 앱 코드(app/, lib/i18n.ts, lib/audio.ts, 약관)에서 직접 추출했습니다.
> 문단(빈 줄로 구분)이 검색 단위입니다. 각 주제에 한국어 + English를 함께 담아 양쪽 언어로 검색·응답됩니다.
> ⚠️ 각 "## 제목" 뒤에는 반드시 빈 줄을 넣으세요. 제목과 본문이 붙어 있으면 제목 문단으로 간주돼 색인에서 통째로 제외됩니다.
> 가입 방식·요금 정책은 확정 전이라 "문의 안내"로 처리합니다(docs/open-questions.md 참고).
> 이용약관·개인정보처리방침 요약은 사이트의 실제 정책에서 추출했으며, 정책이 바뀌면 이 KB도 함께 갱신해야 합니다(전문은 항상 사이트 페이지가 기준).

## 서비스 개요 / What is FineApple Voice

FineApple Voice는 입력한 한국어 텍스트를 자연스러운 한국어 음성으로 만들어 주는 AI 성우 서비스입니다. 광고, 오디오북, 영상, 게임 등에 바로 쓸 수 있는 고품질 한국어 음성을 만들 수 있습니다. 화면(UI)은 한국어와 영어를 지원하지만, 생성되는 음성은 항상 한국어입니다 — 그래서 대본은 한국어로 입력해야 합니다. 제공: Soft Story corp.
FineApple Voice turns Korean text into natural Korean speech with our own Korean voice models — ready for ads, audiobooks, video, and games. The interface is available in Korean and English, but the generated voice always speaks Korean, so write your script in Korean. Provided by Soft Story corp.

## 시작하는 법 (3단계) / Getting started (3 steps)

시작은 간단합니다. ① 메인 화면에서 "시작하기"(또는 "5분 무료로 시작") 버튼을 누르고, ② 로그인한 다음, ③ 스튜디오에서 성우를 고르고 텍스트를 입력해 음성을 만들면 됩니다. 처음이라면 짧은 한 문장으로 먼저 만들어 보는 걸 추천합니다.
It's simple: ① on the home page, click "Start" (or "Start 5 min free"), ② log in, ③ in the studio, pick a voice, type your text, and generate. If it's your first time, try a single short sentence first.

## 로그인 / 계정 / Logging in & accounts

스튜디오를 사용하려면 로그인이 필요합니다(사용자 이름 + 비밀번호). 로그인하면 곧장 음성 스튜디오로 이동합니다. 계정 발급이나 가입 방법 안내가 필요하면 business@softstorycorp.com으로 문의해 주세요.
You need to log in to use the studio (username + password). After login you go straight to the voice studio. For help getting an account, please contact business@softstorycorp.com.

## 성우 고르기 / Choosing a voice

한국어 성우 6명 중에서 고를 수 있습니다 — 지아(차분한 내레이션, 여성), 유나(감정 풍부·표현력, 여성), 서연(따뜻한 저음, 여성), 준호(표준·안정적, 남성), 민재(밝은 청년, 남성), 도현(대화체 청년, 남성). 각 성우의 샘플을 들어보고 콘텐츠 분위기에 맞는 목소리를 선택하세요.
Pick from 6 Korean voices — Jia (calm narration, female), Yuna (expressive·emotional, female), Seoyeon (warm low tone, female), Junho (standard·steady, male), Minjae (bright young man, male), Dohyun (conversational, male). Listen to each sample and choose the voice that fits your content.

## 감정 톤 (일부 성우 전용) / Emotion tone (select voices only)

감정 톤은 차분함, 기쁨, 슬픔, 분노, 두려움, 사랑 중에서 고를 수 있습니다(기본값은 '기본'). 단, 감정 톤은 유나와 서연 두 성우에서만 제공됩니다 — 다른 성우를 선택하면 감정 톤 옵션이 보이지 않는 게 정상입니다. 감정 표현이 필요하면 유나나 서연을 선택하세요.
Emotion tone offers Calm, Joy, Sadness, Anger, Fear, and Love (default is "Default"). Emotion tone is available only for Yuna and Seoyeon — if you pick another voice, the emotion options won't appear, which is expected. For emotional delivery, choose Yuna or Seoyeon.

## 텍스트 입력 / Entering your text

텍스트는 길이 제한이 없습니다. 긴 글을 넣으면 문장 단위로 자동 분할되어, 첫 구간부터 만들어지는 대로 바로 재생됩니다(전체가 끝날 때까지 기다리지 않아도 됩니다). 한국어 텍스트를 입력하세요. 줄바꿈으로 문단을 나누면 더 자연스럽게 끊어 읽습니다.
There is no length limit. Long text is automatically split by sentence, and playback starts on the first part as soon as it's ready — you don't wait for the whole thing. Type Korean text. Separating paragraphs with line breaks gives more natural phrasing.

## 음성 만들기·듣기·다운로드 / Generate, listen, download

성우와 텍스트를 정한 뒤 "음성 생성" 버튼을 누르면 음성이 만들어집니다. 만들어진 음성은 화면의 플레이어에서 바로 재생할 수 있고, 긴 글은 여러 구간이 하나의 음성으로 이어집니다. 결과물은 WAV 음성 파일로 제공됩니다.
After choosing a voice and text, click "Generate voice." You can play the result right in the on-screen player, and long text is stitched into a single audio. Output is provided as a WAV audio file.

## 생성이 느리거나 오류가 날 때 / If it's slow or errors out

처음 만들 때는 서버가 깨어나는 시간(콜드 스타트) 때문에 잠깐 느릴 수 있습니다. "잠깐 졸았어요 — 한 번 더 눌러서 깨워주세요"(또는 "I dozed off — tap once more") 메시지가 보이면, 생성 버튼을 한 번 더 눌러 주세요. 보통 다시 시도하면 됩니다. 계속 안 되면 잠시 후 다시 시도하거나 문의해 주세요.
The first generation can be briefly slow because the server is waking up (cold start). If you see "I dozed off — tap once more," just tap Generate again — a retry usually works. If it keeps failing, try again shortly or contact us.

## 요금 / 무료 사용 / Pricing & free use

FineApple Voice는 현재 데모 단계로, 요금과 결제 기능은 준비 중입니다. 메인에 "5분 무료로 시작" 안내가 있으며, 자세한 요금·무료 한도 안내는 추후 제공됩니다. 문의는 business@softstorycorp.com으로 해주세요.
FineApple Voice is currently in a demo stage; pricing and payment are in preparation. The home page mentions "Start 5 minutes free," and detailed pricing and free-usage limits will be shared later. For questions, contact business@softstorycorp.com.

## 생성한 음성의 사용 범위 / Usage rights for generated audio

생성한 음성은 광고·유튜브·영상 등 상업적 용도로 이용할 수 있습니다. 단, 이용약관의 금지 사항(타인 사칭, 불법·유해 콘텐츠 등)은 지켜야 합니다. 음성 모델과 성우 음성 자체에 대한 권리는 회사에 있으며, 추가 문의는 business@softstorycorp.com으로 해주세요.
You can use the generated audio for commercial purposes such as ads, YouTube, and videos. You must still follow the prohibited uses in the Terms (no impersonation, illegal or harmful content, etc.). Rights to the voice models and voice-actor audio themselves belong to the company; for further questions, contact business@softstorycorp.com.

## 금지된 사용 / Prohibited use

다음 용도로는 서비스를 사용할 수 없습니다: 타인 사칭이나 동의 없는 음성·초상 모방, 음란물 또는 미성년자에게 유해한 콘텐츠, 폭력·학대·혐오·차별 조장, 불법·범죄 조장, 허위사실·사기·스팸. 입력하는 텍스트에 대한 적법한 권리를 보유해야 합니다. 위반 시 사전 통지 없이 이용이 제한될 수 있습니다.
You may not use the service for: impersonation or imitating someone's voice/likeness without consent, obscene content or content harmful to minors, promoting violence/abuse/hate/discrimination, illegal or criminal activity, or misinformation/fraud/spam. You must hold lawful rights to any text you submit. Violations may lead to restriction without prior notice.

## 더 높은 품질·대규모 더빙이 필요할 때 / Need higher quality or large-scale dubbing

더 높은 품질이 필요하거나, 실제 성우 녹음, 대규모 더빙·현지화 같은 기업·턴키 프로젝트가 필요하면 모회사 Soft Story Corp에서 전문 제작을 제공합니다. softstorycorp.com 또는 business@softstorycorp.com으로 문의하세요.
For higher quality, real voice-actor recording, or enterprise/turnkey projects like large-scale dubbing and localization, our parent company Soft Story Corp offers professional production. Contact softstorycorp.com or business@softstorycorp.com.

## 이용약관 요약 / Terms of Use (summary)

FineApple Voice 이용약관의 핵심입니다. 서비스는 입력한 텍스트를 AI 음성으로 합성해 제공하며, 회사는 품질 향상을 위해 기능을 변경하거나 중단할 수 있습니다. 이용자는 입력 텍스트에 대한 적법한 권리를 보유해야 하고, 타인의 권리를 침해하거나 불법·부정한 목적으로 사용할 수 없습니다. 천재지변·시스템 장애 등 불가항력에 따른 중단에 대해 회사는 책임지지 않으며, 생성한 콘텐츠의 사용 결과에 대한 책임은 이용자에게 있습니다. 현재 약관은 초안이며 정식 출시 전 변경될 수 있습니다(최종 업데이트 2026-06-19). 전문은 사이트의 이용약관 페이지에서 확인하세요.
Key points of the FineApple Voice Terms of Use: the service synthesizes your text into AI speech, and the company may change or discontinue features to improve quality. You must hold lawful rights to the text you submit and may not infringe others' rights or use the service for unlawful purposes. The company isn't liable for interruptions from force majeure (natural disasters, system failures), and you are responsible for how you use the generated content. The Terms are currently a draft and may change before launch (last updated 2026-06-19). See the Terms of Use page for the full text.

## 개인정보 — 수집·이용·보관 / Privacy — what we collect & keep

개인정보처리방침에 따르면, 회사는 로그인 아이디(비밀번호는 암호화 저장), 음성 합성을 위해 입력하는 텍스트, 로그인 유지용 인증 토큰(쿠키), 상담 챗봇 이용 시 입력하는 대화 내용을 수집·처리합니다. 민감정보는 수집하지 않습니다. 이 정보는 본인 확인·로그인 유지, 음성 합성, 서비스 운영·품질 개선 목적으로만 이용합니다. 개인정보는 목적 달성 또는 회원 탈퇴 시 지체 없이 파기하며, 입력 텍스트와 생성 결과물은 서비스 제공에 필요한 기간만 보관 후 삭제합니다. 챗봇 대화는 당사가 별도로 저장하지 않습니다.
Per the Privacy Policy, the company collects your login ID (password stored encrypted), the text you enter for voice synthesis, an auth-token cookie that keeps you logged in, and the messages you type in the support chatbot. No sensitive data is collected. This is used only for identity/login, voice synthesis, and operating and improving the service. Personal data is destroyed without delay when its purpose is met or you delete your account; input text and generated audio are kept only as long as needed, then deleted. The company does not separately store chatbot conversations.

## 개인정보 — 국외이전·권리·문의 / Privacy — overseas transfer & your rights

서비스 제공 과정에서 데이터가 국외에서 처리될 수 있습니다 — Cloudflare(미국, 호스팅), 음성 합성용 국외 GPU 사업자, Vercel(미국, 상담 챗봇 호스팅), OpenAI(미국, 챗봇 응답 생성). OpenAI는 API로 전송된 데이터를 모델 학습에 사용하지 않으며 최대 30일 보관 후 삭제합니다. 회사는 개인정보를 마케팅 목적으로 제3자에게 판매·제공하지 않습니다. 이용자는 business@softstorycorp.com으로 개인정보 열람·정정·삭제·처리정지를 요청할 수 있고, 개인정보 보호책임자는 천영재입니다. 광고·행태정보 쿠키는 사용하지 않습니다. 분쟁이나 침해 신고는 개인정보분쟁조정위원회(kopico.go.kr) 또는 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118)로 문의할 수 있습니다. 전문은 사이트의 개인정보처리방침 페이지를 확인하세요.
Some data may be processed overseas to run the service — Cloudflare (US, hosting), an overseas GPU provider for voice synthesis, Vercel (US, chatbot hosting), and OpenAI (US, chatbot response generation). OpenAI does not use API data for model training and deletes it after up to 30 days. The company never sells or shares personal data for marketing. You can request access, correction, deletion, or suspension of your data at business@softstorycorp.com; the data protection officer is Cheon Youngjae. No advertising or behavioral cookies are used. For disputes or reports, you may contact Korea's Personal Information Dispute Mediation Committee (kopico.go.kr) or the Privacy Infringement Report Center (privacy.kisa.or.kr, 118). See the Privacy Policy page for the full text.

## 문의 / 지원 / Contact & support

서비스 관련 문의나 도움이 필요하면 business@softstorycorp.com으로 연락해 주세요. 이용약관과 개인정보처리방침은 사이트 하단 및 로그인 화면에서 확인할 수 있습니다.
For questions or help, contact business@softstorycorp.com. The Terms of Use and Privacy Policy are available in the site footer and on the login screen.
