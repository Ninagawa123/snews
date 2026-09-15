import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MainList, CompactList } from '@/components/NewsList';
import { getSidebarByCategory, getTopNews } from '@/lib/rss';

// 1時間ごとに再検証（ISR）
export const revalidate = 3600;

function formatUpdatedAt(): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export default async function HomePage() {
  const [top, sidebar] = await Promise.all([
    getTopNews(),
    getSidebarByCategory(),
  ]);

  return (
    <>
      <Header updatedAt={formatUpdatedAt()} />
      <CategoryTabs active="top" />
      <main className="mx-auto max-w-5xl px-2 sm:px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <section className="bg-white rounded-md shadow-sm overflow-hidden">
          <h1 className="px-4 py-3 border-b border-gray-200 text-base font-bold">
            主要ニュース
          </h1>
          <MainList items={top} />
        </section>
        <aside className="space-y-4">
          {sidebar.map(({ category, items }) => (
            <div
              key={category.slug}
              className="bg-white rounded-md shadow-sm overflow-hidden"
            >
              <h2 className="px-3 py-2 border-b border-gray-200 text-sm font-bold flex justify-between items-center">
                <span>{category.name}</span>
                <a
                  href={`/category/${category.slug}`}
                  className="text-xs text-yahoo-blue font-normal no-underline hover:underline"
                >
                  もっと見る
                </a>
              </h2>
              <CompactList items={items} />
            </div>
          ))}
        </aside>
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
        このサイトは Yahoo!ニュース / NHK NEWS WEB の公開 RSS フィードを利用しています。
        本文・画像の権利は各配信元に帰属します。広告は表示していません。
      </footer>
    </>
  );
}
