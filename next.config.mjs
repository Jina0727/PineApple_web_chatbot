/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // transformers.js(@xenova/transformers)는 네이티브/wasm 파일을 포함하므로
    // 서버 번들에 포함시키지 않고 외부 패키지로 그대로 둔다.
    serverComponentsExternalPackages: ["@xenova/transformers"],

    // 배포(서버리스) — 기본 임베딩은 OpenAI라 런타임에 transformers가 필요 없다.
    // 함수 크기(보통 250MB 한도) 폭증을 막기 위해 무거운 로컬 임베딩 의존성을 함수에서 제외.
    // (지식베이스는 빌드 시 kb.generated.ts로 인라인되므로 별도 파일 추적이 필요 없다.)
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
