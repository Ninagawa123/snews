import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '素にゅぅす - 広告なしの個人向けニュース',
  description:
    '無料の公開RSSから最新ニュースを1時間ごとに自動更新する、広告なしの個人用ニュースサイト。',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-yahoo-gray min-h-screen font-sans">{children}</body>
    </html>
  );
}
