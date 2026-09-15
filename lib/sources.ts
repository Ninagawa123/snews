export type Category = {
  slug: string;
  name: string;
  feeds: { source: string; url: string }[];
};

// 全て公式に公開されている RSS フィード。無料 & 規約準拠で取得可能。
// 「主要」は各社の汎用フィードを混ぜて多様な話題を集める。
// 個別カテゴリはカテゴリ限定のフィードのみを採用し、汎用/混合フィードは
// 混入を避けるため入れない。さらに rss.ts 側でタイトル語彙による
// カテゴリ・ミスマッチ排除フィルタを重ねる。
export const CATEGORIES: Category[] = [
  {
    slug: 'top',
    name: '主要',
    feeds: [
      { source: '朝日新聞', url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf' },
      { source: 'livedoor', url: 'https://news.livedoor.com/topics/rss/top.xml' },
      { source: '読売新聞', url: 'https://www.bing.com/news/search?q=site%3Ayomiuri.co.jp&format=rss&cc=jp&setlang=ja' },
      { source: '日本経済新聞', url: 'https://www.bing.com/news/search?q=site%3Anikkei.com%2Farticle&format=rss&cc=jp&setlang=ja' },
      { source: '共同通信', url: 'https://www.bing.com/news/search?q=site%3A47news.jp&format=rss&cc=jp&setlang=ja' },
      { source: 'ロイター', url: 'https://www.bing.com/news/search?q=site%3Ajp.reuters.com&format=rss&cc=jp&setlang=ja' },
      { source: 'NHK', url: 'https://www.nhk.or.jp/rss/news/cat0.xml' },
    ],
  },
  {
    slug: 'domestic',
    name: '国内',
    feeds: [
      { source: 'livedoor 国内', url: 'https://news.livedoor.com/topics/rss/dom.xml' },
      { source: 'livedoor 政治', url: 'https://news.livedoor.com/topics/rss/pol.xml' },
      { source: '読売 社会', url: 'https://www.bing.com/news/search?q=site%3Ayomiuri.co.jp%2Fnational&format=rss&cc=jp&setlang=ja' },
      { source: '読売 政治', url: 'https://www.bing.com/news/search?q=site%3Ayomiuri.co.jp%2Fpolitics&format=rss&cc=jp&setlang=ja' },
      { source: '共同通信', url: 'https://www.bing.com/news/search?q=site%3A47news.jp&format=rss&cc=jp&setlang=ja' },
      { source: 'NHK 社会', url: 'https://www.nhk.or.jp/rss/news/cat1.xml' },
      { source: 'NHK 政治', url: 'https://www.nhk.or.jp/rss/news/cat2.xml' },
    ],
  },
  {
    slug: 'world',
    name: '国際',
    feeds: [
      { source: 'livedoor 海外', url: 'https://news.livedoor.com/topics/rss/int.xml' },
      { source: '読売 国際', url: 'https://www.bing.com/news/search?q=site%3Ayomiuri.co.jp%2Fworld&format=rss&cc=jp&setlang=ja' },
      { source: 'ロイター 国際', url: 'https://www.bing.com/news/search?q=site%3Ajp.reuters.com%2Fworld&format=rss&cc=jp&setlang=ja' },
      { source: 'ロイター', url: 'https://www.bing.com/news/search?q=site%3Ajp.reuters.com&format=rss&cc=jp&setlang=ja' },
      { source: 'NHK 国際', url: 'https://www.nhk.or.jp/rss/news/cat6.xml' },
    ],
  },
  {
    slug: 'business',
    name: '経済',
    feeds: [
      { source: 'livedoor 経済', url: 'https://news.livedoor.com/topics/rss/eco.xml' },
      { source: '東洋経済', url: 'https://toyokeizai.net/list/feed/rss' },
      { source: '日経ビジネス', url: 'https://business.nikkei.com/rss/sns/nb.rdf' },
      { source: '読売 経済', url: 'https://www.bing.com/news/search?q=site%3Ayomiuri.co.jp%2Feconomy&format=rss&cc=jp&setlang=ja' },
      { source: 'ロイター マーケット', url: 'https://www.bing.com/news/search?q=site%3Ajp.reuters.com%2Fmarkets&format=rss&cc=jp&setlang=ja' },
      { source: 'ロイター 経済', url: 'https://www.bing.com/news/search?q=site%3Ajp.reuters.com%2Feconomy&format=rss&cc=jp&setlang=ja' },
      { source: 'NHK ビジネス', url: 'https://www.nhk.or.jp/rss/news/cat7.xml' },
    ],
  },
  {
    slug: 'entertainment',
    name: 'エンタメ',
    feeds: [
      { source: 'livedoor エンタメ', url: 'https://news.livedoor.com/topics/rss/ent.xml' },
      { source: 'NHK エンタメ', url: 'https://www.nhk.or.jp/rss/news/cat5.xml' },
    ],
  },
  {
    slug: 'sports',
    name: 'スポーツ',
    feeds: [
      { source: 'livedoor スポーツ', url: 'https://news.livedoor.com/topics/rss/spo.xml' },
      { source: '読売 スポーツ', url: 'https://www.bing.com/news/search?q=site%3Ayomiuri.co.jp%2Fsports&format=rss&cc=jp&setlang=ja' },
      { source: 'NHK スポーツ', url: 'https://www.nhk.or.jp/rss/news/cat8.xml' },
    ],
  },
  {
    slug: 'it',
    name: 'IT',
    feeds: [
      { source: 'ITmedia', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' },
      { source: 'ITmedia トップ', url: 'https://rss.itmedia.co.jp/rss/2.0/topstory.xml' },
      { source: 'CNET Japan', url: 'https://feeds.japan.cnet.com/rss/cnet/all.rdf' },
      { source: 'Impress Watch', url: 'https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf' },
    ],
  },
  {
    slug: 'science',
    name: '科学',
    feeds: [
      { source: 'NHK 科学', url: 'https://www.nhk.or.jp/rss/news/cat4.xml' },
      { source: 'GIGAZINE', url: 'https://gigazine.net/news/rss_2.0/' },
    ],
  },
  {
    slug: 'life',
    name: 'ライフ',
    feeds: [
      { source: 'livedoor トレンド', url: 'https://news.livedoor.com/topics/rss/trend.xml' },
      { source: 'livedoor 恋愛', url: 'https://news.livedoor.com/topics/rss/love.xml' },
      { source: 'NHK ライフ', url: 'https://www.nhk.or.jp/rss/news/cat3.xml' },
    ],
  },
];

export function findCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
