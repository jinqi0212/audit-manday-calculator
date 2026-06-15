import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '审核人天计算工具',
  description: '管理体系认证审核人天计算与专业代码查询工具',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
