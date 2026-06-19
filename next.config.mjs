/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // transformers.js(@xenova/transformers)는 네이티브/wasm 파일을 포함하므로
    // 서버 번들에 포함시키지 않고 외부 패키지로 그대로 둔다.
    serverComponentsExternalPackages: ["@xenova/transformers"],

    // 배포(서버리스) 대비 ① — data/*.md 는 동적 fs.readFileSync로 읽어 정적 분석이 안 되므로
    // 함수 번들에 명시적으로 포함시킨다. (없으면 배포 환경에서 지식베이스를 못 읽어 에러)
    outputFileTracingIncludes: {
      "/api/chat": ["./data/**/*"],
    },

    // 배포(서버리스) 대비 ② — 기본 임베딩은 OpenAI라 런타임에 transformers가 필요 없다.
    // 함수 크기(보통 250MB 한도) 폭증을 막기 위해 무거운 로컬 임베딩 의존성을 함수에서 제외.
    // (EMBEDDING_PROVIDER=local 로 배포하려면 이 제외 목록을 비워야 한다.)
    outputFileTracingExcludes: {
      "/api/chat": [
        "node_modules/@xenova/**",
        "node_modules/onnxruntime-node/**",
        "node_modules/sharp/**",
      ],
    },
  },
};

export default nextConfig;
