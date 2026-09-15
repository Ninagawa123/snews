import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MainList } from '@/components/NewsList';
import { CATEGORIES, findCategory } from '@/lib/sources';
import { getCategoryNews } from '@/lib/rss';

export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.filter((c) => c.slug !== 'top').map((c) => ({
    slug: c.slug,
  }));
}

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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  const items = await getCategoryNews(category);

  return (
    <>
      <Header updatedAt={formatUpdatedAt()} />
      <CategoryTabs active={slug} />
      <main className="mx-auto max-w-5xl px-2 sm:px-4 py-4">
        <section className="bg-white rounded-md shadow-sm overflow-hidden">
          <h1 className="px-4 py-3 border-b border-gray-200 text-base font-bold">
            {category.name}のニュース
          </h1>
          <MainList items={items} />
        </section>
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
        配信元: {category.feeds.map((f) => f.source).join(' / ')} の公開 RSS
        フィード。 記事の権利は各配信元に帰属します。広告は表示していません。
      </footer>
    </>
  );
}
