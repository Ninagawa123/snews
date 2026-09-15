import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { decodeArticleId, encodeArticleId, fetchArticle, type Article } from '@/lib/article';
import { CATEGORIES } from '@/lib/sources';
import { getCategoryNews } from '@/lib/rss';

// 静的エクスポート用: ビルド時にRSSから取れる全記事URLをidに変換して事前生成する
export async function generateStaticParams() {
  const ids = new Set<string>();
  for (const cat of CATEGORIES) {
    const news = await getCategoryNews(cat);
    for (const item of news) {
      if (item.link) ids.add(encodeArticleId(item.link));
    }
  }
  return Array.from(ids).map((id) => ({ id }));
}

// 事前生成に含まれない id は 404 とする（GitHub Pages 静的配信のため）
export const dynamicParams = false;

function formatUpdatedAt(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

// 本文が要約止まりかどうかを判定
function isSummaryOnly(a: Article): boolean {
  const total = a.paragraphs.reduce((n, p) => n + p.length, 0);
  if (a.paragraphs.length <= 2) return true;
  if (total < 400) return true;
  return false;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const url = decodeArticleId(id);
  if (!url) notFound();

  const article = await fetchArticle(url);
  const summaryOnly = article ? isSummaryOnly(article) : false;

  return (
    <>
      <Header updatedAt={formatUpdatedAt(article?.fetchedAt)} />
      <main className="mx-auto max-w-3xl px-4 py-4">
        <div className="mb-3 text-sm">
          <Link href="/" className="text-yahoo-blue hover:underline">
            ← 一覧に戻る
          </Link>
        </div>

        <article className="bg-white rounded-md shadow-sm p-5 sm:p-8">
          {article ? (
            <>
              <h1 className="text-2xl sm:text-[26px] font-bold leading-snug">
                {article.title}
              </h1>
              <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                <span>配信元: {article.host}</span>
                <span>取得: {formatUpdatedAt(article.fetchedAt)}</span>
              </div>

              {summaryOnly && (
                <div className="mt-5 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">この記事は要約のみ表示されています</p>
                  <p className="mt-1 text-amber-800">
                    配信元がJavaScript描画のため、本文の続きは元記事でご覧ください。
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-amber-700 no-underline"
                  >
                    {article.host} で続きを読む →
                  </a>
                </div>
              )}

              <div className="mt-6 space-y-4 text-[15px] leading-7 text-gray-900">
                {article.paragraphs.length > 0 ? (
                  article.paragraphs.map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <p className="text-gray-500">
                    本文を抽出できませんでした。下のリンクから元記事をご覧ください。
                  </p>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-yahoo-blue text-white text-sm font-semibold px-4 py-2 rounded hover:opacity-90 no-underline"
                >
                  {article.host} で全文を読む →
                </a>
                <p className="mt-3 text-xs text-gray-500 break-all">
                  元URL:{' '}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yahoo-blue hover:underline"
                  >
                    {article.url}
                  </a>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  記事の権利は配信元に帰属します。
                </p>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">
              <p>記事を取得できませんでした。</p>
              <p className="mt-2 break-all">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yahoo-blue hover:underline"
                >
                  {url}
                </a>
              </p>
            </div>
          )}
        </article>
      </main>
      <footer className="mx-auto max-w-3xl px-4 py-6 text-xs text-gray-500">
        個人用・広告なし。配信元RSSに含まれるURLから本文を第一階層のみ取得しています。
      </footer>
    </>
  );
}
