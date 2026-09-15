import Parser from 'rss-parser';
import { CATEGORIES, type Category } from './sources';

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  isoDate: string;
  pubDateText: string;
  contentSnippet: string;
  category: string;
};

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; PersonalNewsReader/1.0; +https://example.local)',
  },
});

// Bing News RSS のリンクは apiclick.aspx?url=<encoded> のリダイレクト形式。
// クリック追跡ではなく直接の記事URLに正規化する。
function normalizeLink(raw: string): string {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (u.hostname.endsWith('bing.com') && u.pathname.includes('apiclick')) {
      const real = u.searchParams.get('url');
      if (real) return real;
    }
  } catch {
    /* ignore */
  }
  return raw;
}

function formatJst(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '';
  }
}

async function fetchFeed(
  url: string,
  source: string,
  categorySlug: string,
): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600, tags: ['news', `news:${categorySlug}`] },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PersonalNewsReader/1.0; +https://example.local)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const feed = await parser.parseString(xml);
    return (feed.items ?? []).map((it: any) => {
      const iso = it.isoDate ?? it.pubDate ?? new Date().toISOString();
      // Bing News RSS のタイトルは末尾に " - 配信元名" が付くため除去
      const rawTitle = (it.title ?? '').trim();
      const cleanTitle = rawTitle.replace(/\s*[-–—]\s*[^\-–—]+$/u, (m: string) => {
        // 配信元名っぽい末尾のみ削る（20文字以下 & 「新聞/ニュース/PRESS」等含む）
        const tail = m.replace(/^\s*[-–—]\s*/, '');
        if (
          tail.length <= 22 &&
          /(新聞|ニュース|Newspicks|PRESS|Online|MAGAZINE|ジャーナル|通信|放送|Web|Yahoo)/i.test(
            tail,
          )
        ) {
          return '';
        }
        return m;
      });
      return {
        title: cleanTitle,
        link: normalizeLink(it.link ?? ''),
        source,
        isoDate: iso,
        pubDateText: formatJst(iso),
        contentSnippet: (it.contentSnippet ?? it.summary ?? '').trim(),
        category: categorySlug,
      } satisfies NewsItem;
    });
  } catch {
    return [];
  }
}

// カテゴリごとに「明らかに別ジャンル」な記事タイトルを排除するための正規表現。
// 各社のカテゴリ分類ミスや汎用RSSの混入を後段で弾く。
const SPORTS_KW =
  /(サッカー|プロ野球|MLB|大リーグ|Jリーグ|WBC|NPB|ゴルフ|テニス|ボクシング|オリンピック|大相撲|相撲|大関|横綱|関脇|力士|巨人|阪神|中日|広島東洋|楽天|ソフトバンク|ヤクルト|DeNA|ロッテ|オリックス|バスケ|バレー|マラソン|陸上|水泳|F1|ラグビー|フィギュア|柔道|剣道|空手|卓球)/;
const POLITICS_KW =
  /(首相|総理|外相|外務大臣|防衛相|防衛大臣|財務相|財務大臣|大臣|国会|参院|衆院|閣議|内閣|自民党|立憲|公明党|維新の会|共産党|総裁選|党首|選挙|議員|裁判所|判決|逮捕|議会|条例|市長|知事|区議)/;
const ECON_KW =
  /(株価|為替|GDP|CPI|決算|関税|軽減税率|物価|小売価格|小売売上|食肉|豚肉|牛肉|卵の価格|食料品|景気|貿易|輸出|輸入|投資家|中央銀行|日銀|FRB|ECB|円相場|円安|円高|金利|地価|市況|税収|税制|IPO|上場|買収|M&A|カルテル|談合|不正会計|リコール|新興企業|スタートアップ|マーケット)/;
const ENT_KW =
  /(コンサート|新曲|映画公開|楽曲|アルバム|ドラマ|アニメ|漫画|VTuber|Vtuber|お笑い|バラエティ|離婚|不倫|熱愛|結婚|グラビア|アイドル|舞台挨拶|エンタメ)/;
const DISASTER_KW = /(地震速報|震度\d|台風\d号|噴火|津波)/;

const CATEGORY_REJECT: Record<string, RegExp> = {
  domestic: new RegExp(
    `${SPORTS_KW.source}|${ENT_KW.source}|(オリコン)`,
  ),
  world: new RegExp(
    `${SPORTS_KW.source}|${ENT_KW.source}|(オリコン)`,
  ),
  business: new RegExp(
    `${SPORTS_KW.source}|${ENT_KW.source}|${DISASTER_KW.source}`,
  ),
  entertainment: new RegExp(
    `${ECON_KW.source}|${POLITICS_KW.source}|${DISASTER_KW.source}|${SPORTS_KW.source}`,
  ),
  sports: new RegExp(
    `${ECON_KW.source}|${POLITICS_KW.source}|${ENT_KW.source}|${DISASTER_KW.source}`,
  ),
  it: new RegExp(
    `${SPORTS_KW.source}|${ENT_KW.source}|${POLITICS_KW.source}|${DISASTER_KW.source}`,
  ),
  science: new RegExp(
    `${SPORTS_KW.source}|${ENT_KW.source}|${POLITICS_KW.source}|${ECON_KW.source}|${DISASTER_KW.source}|(ラーメン|カフェ|グルメ|レストラン)`,
  ),
  life: new RegExp(
    `${ECON_KW.source}|${POLITICS_KW.source}|${SPORTS_KW.source}|${DISASTER_KW.source}|(AI|ChatGPT|Google|Apple|Microsoft|GPU|CPU|クラウド)`,
  ),
};

// 科学は「科学らしい語」を含む記事のみを許可（他は範囲が広くノイズだらけになるため）
const CATEGORY_ALLOW: Record<string, RegExp> = {
  science:
    /(研究|発見|観測|宇宙|天文|天体|惑星|銀河|太陽|月面|火星|木星|ブラックホール|生物|DNA|遺伝子?|ゲノム|ワクチン|治療|医療|医学|臨床|治験|新薬|抗がん|感染|ウイルス|細菌|微生物|実験|科学者|論文|JAXA|NASA|ノーベル|量子|物理|化学|薬品|薬剤|気候変動|温暖化|地質|化石|恐竜|進化|脳|細胞|ロケット|人工衛星|望遠鏡|農業|養殖|再生医療|iPS|エネルギー|再生可能|太陽光|風力|発明|技術革新|イノベーション|新技術)/,
};

function matchesCategory(item: NewsItem, slug: string): boolean {
  const allow = CATEGORY_ALLOW[slug];
  if (allow && !allow.test(item.title)) return false;
  const reject = CATEGORY_REJECT[slug];
  if (reject && reject.test(item.title)) return false;
  return true;
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    const key = it.link || `${it.source}::${it.title}`;
    const titleKey = it.title;
    if (seen.has(key) || seen.has(titleKey)) continue;
    seen.add(key);
    seen.add(titleKey);
    out.push(it);
  }
  return out;
}

export async function getCategoryNews(category: Category): Promise<NewsItem[]> {
  const results = await Promise.all(
    category.feeds.map((f) => fetchFeed(f.url, f.source, category.slug)),
  );
  const perSourceCap = 15;
  const merged: NewsItem[] = [];
  for (const feedItems of results) {
    // カテゴリと明らかに違うジャンルの記事はソース段階で落とす
    const filtered = feedItems.filter((it) =>
      matchesCategory(it, category.slug),
    );
    const sorted = [...filtered].sort((a, b) =>
      a.isoDate < b.isoDate ? 1 : -1,
    );
    merged.push(...sorted.slice(0, perSourceCap));
  }
  const unique = dedupe(merged);
  unique.sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));
  return unique.slice(0, 80);
}

export async function getTopNews(): Promise<NewsItem[]> {
  const top = CATEGORIES.find((c) => c.slug === 'top');
  if (!top) return [];
  return getCategoryNews(top);
}

export async function getSidebarByCategory(): Promise<
  { category: Category; items: NewsItem[] }[]
> {
  const results = await Promise.all(
    CATEGORIES.filter((c) => c.slug !== 'top').map(async (c) => ({
      category: c,
      items: (await getCategoryNews(c)).slice(0, 5),
    })),
  );
  return results;
}
