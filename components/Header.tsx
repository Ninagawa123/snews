'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header({ updatedAt }: { updatedAt: string }) {
  const pathname = usePathname();

  const onLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // トップページにいる時だけリロード。それ以外は通常のクライアント遷移。
    if (pathname === '/') {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          onClick={onLogoClick}
          className="flex items-baseline gap-1 no-underline"
        >
          <span className="text-2xl font-bold tracking-tight text-yahoo-red">
            素
          </span>
          <span className="text-2xl font-bold tracking-tight text-yahoo-blue">
            にゅぅす
          </span>
        </Link>
        <div className="text-xs text-gray-500">
          最終更新 <time>{updatedAt}</time>
        </div>
      </div>
    </header>
  );
}
