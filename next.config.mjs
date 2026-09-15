const isProd = process.env.NODE_ENV === 'production';
// GitHub Pages のプロジェクトページ配下にデプロイする想定 (username.github.io/snews/)
const basePath = isProd ? '/snews' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  // 記事IDのbase64urlは長くなり得るため、安全側に振っておく
  experimental: { largePageDataBytes: 512 * 1000 },
};

export default nextConfig;
