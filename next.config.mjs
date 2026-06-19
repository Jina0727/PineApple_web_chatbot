/** @type {import('next').NextConfig} */
const nextConfig = {
  // transformers.js(@xenova/transformers)는 네이티브/wasm 파일을 포함하므로
  // 서버 번들에 포함시키지 않고 외부 패키지로 그대로 두어야 정상 동작합니다.
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers"],
  },
};

export default nextConfig;
