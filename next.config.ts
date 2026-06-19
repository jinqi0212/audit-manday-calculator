import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
    unoptimized: true, // GitHub Pages 不需要图片优化
  },
  // 静态导出配置（用于 GitHub Pages）
  output: 'export',
  // GitHub Pages 部署路径配置（如果使用项目页面而非用户页面）
  basePath: process.env.NODE_ENV === 'production' ? '/audit-manday-calculator' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/audit-manday-calculator' : '',
};

export default nextConfig;
