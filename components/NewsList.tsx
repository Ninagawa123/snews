import Link from 'next/link';
import type { NewsItem } from '@/lib/rss';
import { encodeArticleId } from '@/lib/article';

function internalHref(link: string): string {
  return `/article/${encodeArticleId(link)}`;
}

export function MainList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-500">
        現在ニュースを取得できませんでした。しばらくしてから再度お試しください。
      </div>
    );
  }

  const hero = items[0];
  const rest = items.slice(1);

  return (
    <div>
      <Link
        href={internalHref(hero.link)}
        className="block bg-white hover:bg-gray-50 no-underline"
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold leading-snug line-clamp-3">
            {hero.title}
          </h2>
          {hero.contentSnippet && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {hero.contentSnippet}
            </p>
          )}
          <div className="mt-2 text-xs text-gray-500 flex gap-2">
            <span>{hero.source}</span>
            <span>·</span>
            <span>{hero.pubDateText}</span>
          </div>
        </div>
      </Link>

      <ul>
        {rest.map((it, i) => (
          <li key={`${it.link}-${i}`}>
            <Link
              href={internalHref(it.link)}
              className="block p-3 border-b border-gray-100 hover:bg-gray-50 no-underline"
            >
              <div className="text-[15px] font-semibold leading-snug line-clamp-2">
                {it.title}
              </div>
              <div className="mt-1 text-xs text-gray-500 flex gap-2">
                <span>{it.source}</span>
                <span>·</span>
                <span>{it.pubDateText}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompactList({ items }: { items: NewsItem[] }) {
  return (
    <ul>
      {items.map((it, i) => (
        <li key={`${it.link}-${i}`}>
          <Link
            href={internalHref(it.link)}
            className="block px-3 py-2 text-sm border-b border-gray-100 hover:bg-gray-50 no-underline"
          >
            <div className="line-clamp-2 font-medium">{it.title}</div>
            <div className="mt-0.5 text-[11px] text-gray-500">
              {it.source} · {it.pubDateText}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
