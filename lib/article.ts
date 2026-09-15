import * as cheerio from 'cheerio';

export type Article = {
  title: string;
  url: string;
  host: string;
  paragraphs: string[];
  fetchedAt: string;
};

// 部分一致のクラスセレクタは記事本文を囲むラッパ (例: "l-wrapper gate-ad") を
// 誤って除去してしまうため、明らかに構造タグや広告フレームだけに絞る。
// 見出し一覧や関連記事などの実文らしいノイズは、段落側のフィルタで除外する。
const NOISE_SELECTOR = [
  'script',
  'style',
  'noscript',
  'nav',
  'aside',
  'footer',
  'form',
  'iframe',
  'svg',
  'figure',
  'picture',
  'img',
  '[aria-hidden="true"]',
  '[class*="advertisement" i]',
  '[class*="adsense" i]',
  '[class*="adsbygoogle" i]',
  '[class*="google_ad" i]',
  '[id*="google_ads" i]',
].join(',');

// サイドバーや関連ニュース列を含みやすい main/body は敢えて含めない。
// 見つからない場合は og:description にフォールバックする。
const BODY_CANDIDATES = [
  'article [itemprop="articleBody"]',
  '[itemprop="articleBody"]',
  '.article_body',
  '.article-body',
  '.articleBody',
  '.contentsBody',
  '.body-text',
  '.content--detail-body',
  '#uamods',
  'article',
];

function ldValue(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const parts = v.map(ldValue).filter(Boolean) as string[];
    return parts.length ? parts.join('\n\n') : null;
  }
  if (typeof v === 'object') {
    return ldValue(v['@value'] ?? v['value'] ?? null);
  }
  return null;
}

function isArticleType(t: unknown): boolean {
  if (!t) return false;
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => typeof x === 'string' && /Article/i.test(x));
}

type LdResult = { title: string | null; body: string | null };

function extractJsonLd($: cheerio.CheerioAPI): LdResult {
  const nodes = $('script[type="application/ld+json"]');
  for (let i = 0; i < nodes.length; i++) {
    const raw = nodes.eq(i).contents().text();
    if (!raw) continue;
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const list: any[] = [];
    const push = (x: any) => {
      if (!x) return;
      if (Array.isArray(x)) x.forEach(push);
      else if (x['@graph']) push(x['@graph']);
      else list.push(x);
    };
    push(parsed);
    for (const obj of list) {
      if (!isArticleType(obj?.['@type'])) continue;
      const title = ldValue(obj.headline) ?? ldValue(obj.name);
      const body =
        ldValue(obj.articleBody) ??
        ldValue(obj.description) ??
        ldValue(obj.abstract);
      if (title || body) return { title, body };
    }
  }
  return { title: null, body: null };
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .flatMap((chunk) =>
      chunk
        .split(/\n+/)
        .map((s) => s.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean),
    );
}

// Yahoo!ニュース pickup など、集約系ページで本文の下に付く
// 「関連記事」「Xの投稿」「Yahoo!検索」等の集約ブロックを識別するための境界マーカー。
// 段落中に現れた時点で「そこ以降は本文ではない」として打ち切る。
const BOUNDARY_MARKERS = [
  '出典[：:]', // 出典：<publisher> / 出典:Yahoo!検索 など
  '関連(記事|ニュース|リンク|情報)',
  'こちらもおすすめ',
  'もっと見る',
  'Xの投稿',
  'Yahoo!リアルタイム検索',
  'Yahoo!検索',
  'あわせて読みたい',
  '注目のニュース',
  'ランキング',
  'コメント',
];
const BOUNDARY_RE = new RegExp(`(${BOUNDARY_MARKERS.join('|')})`);

// 記事本文ではない、サイト共通の告知・免責・購読案内などを捨てるためのフィルタ。
// 例: NHK ONE 受信契約案内、有料会員誘導、著作権告知、記事共有のお願い、等。
const JUNK_PARAGRAPH_RE =
  /(NHK ONE|受信契約|放送法に基づき|お問い合わせフォーム|会員登録|有料会員|定期購読|購読プラン|無断転載|無断複製|禁無断|Copyright|©|記事共有や会議資料|注文印刷|ログインしてください|続きは会員登録|トムソン・ロイター|信頼の原則|Reuters Trust Principles|Press Net Japan|旬のニュースを的確に|いち早くお届け|新しいタブで開きます|ソーシャルメディアで共有|印刷用ページ)/;

function truncateAtBoundary(paragraphs: string[]): string[] {
  const out: string[] = [];
  for (const p of paragraphs) {
    const m = p.match(BOUNDARY_RE);
    if (!m) {
      out.push(p);
      continue;
    }
    // マーカー前の実文だけ残す（文全体がマーカーで始まっている場合は捨てる）
    const idx = m.index ?? 0;
    const before = p.slice(0, idx).trim().replace(/[「」『』\s]+$/g, '');
    if (before.length >= 12) out.push(before);
    break;
  }
  return out;
}

export async function fetchArticle(url: string): Promise<Article | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600, tags: ['article'] },
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return null;
    const finalUrl = res.url || url;
    const html = await res.text();
    const $ = cheerio.load(html);

    // JSON-LD をノイズ除去より前に抽出（script タグは後で削除される）
    const ld = extractJsonLd($);

    $(NOISE_SELECTOR).remove();

    const domTitle =
      ($('meta[property="og:title"]').attr('content') ??
        $('title').first().text() ??
        $('h1').first().text() ??
        '')
        .replace(/\s+/g, ' ')
        .trim();
    const rawTitle = (ld.title ?? domTitle).replace(/\s+/g, ' ').trim();
    const title = rawTitle
      .replace(
        /\s*[-|｜\-]\s*(Yahoo!ニュース|Yahoo!.*|NHK.*|ITmedia.*)\s*$/i,
        '',
      )
      .trim();

    const JP_CHAR = /[぀-ヿ㐀-鿿]/g;
    const looksLikeBody = (t: string) =>
      (t.match(JP_CHAR)?.length ?? 0) >= 4;
    const totalChars = (arr: string[]) =>
      arr.reduce((n, s) => n + s.length, 0);

    // 候補1: JSON-LD の articleBody / description
    const ldParas: string[] = [];
    if (ld.body) {
      for (const p of splitParagraphs(ld.body)) {
        if (p.length >= 8 && looksLikeBody(p)) ldParas.push(p);
      }
    }

    // 候補2: DOM から本文抽出。まず厳格セレクタ、次に段落密度スコア方式でルートを推定
    const domParas: string[] = [];
    const collectParas = (root: cheerio.Cheerio<any>) => {
      const out: string[] = [];
      root.find('p, h2, h3, h4, li, blockquote').each((_, el) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        if (
          t.length >= 20 &&
          looksLikeBody(t) &&
          !/^(関連記事|関連ニュース|続きを読む|広告|Sponsored|前の記事|次の記事|もっと見る|一覧|お知らせ|お問い合わせ)/.test(
            t,
          ) &&
          !/\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2}\s*$/.test(t)
        ) {
          out.push(t);
        }
      });
      return out;
    };

    let strictRoot: cheerio.Cheerio<any> | null = null;
    for (const sel of BODY_CANDIDATES) {
      const el = $(sel).first();
      if (el.length && el.text().replace(/\s+/g, '').length > 120) {
        strictRoot = el as cheerio.Cheerio<any>;
        break;
      }
    }
    if (strictRoot) domParas.push(...collectParas(strictRoot));

    // 厳格セレクタで足りない場合、ノイズ除去済みDOMから全 <p> を走査。
    // 実文らしい段落だけを拾い、明らかな見出し一覧やナビはフィルタで除外。
    if (totalChars(domParas) < 300) {
      const globalParas: string[] = [];
      $('p').each((_, el) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        if (
          t.length >= 30 &&
          looksLikeBody(t) &&
          /[。！？」]/.test(t) &&
          !/^(関連記事|関連ニュース|続きを読む|広告|Sponsored|前の記事|次の記事|もっと見る|一覧|お知らせ|お問い合わせ)/.test(
            t,
          )
        ) {
          globalParas.push(t);
        }
      });
      if (totalChars(globalParas) > totalChars(domParas)) {
        domParas.length = 0;
        domParas.push(...globalParas);
      }
    }

    // 情報量が大きい方を採用（DOMが十分に長い場合は DOM を選ぶ）
    let paragraphs: string[] =
      totalChars(domParas) > totalChars(ldParas) ? domParas : ldParas;

    // どちらも空なら og:description / meta description をリード段落として提示
    if (paragraphs.length === 0) {
      const desc =
        $('meta[property="og:description"]').attr('content') ??
        $('meta[name="description"]').attr('content') ??
        '';
      const cleaned = desc.replace(/\s+/g, ' ').trim();
      if (cleaned.length >= 10) paragraphs.push(cleaned);
    }

    // サイト共通の告知・購読案内・著作権表記など、記事本文でないものを除外
    paragraphs = paragraphs.filter((p) => !JUNK_PARAGRAPH_RE.test(p));

    // 集約ブロックの手前で本文を打ち切る
    paragraphs = truncateAtBoundary(paragraphs);

    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const p of paragraphs) {
      const key = p.replace(/\s+/g, '');
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(p);
    }

    let host = '';
    try {
      host = new URL(finalUrl).hostname.replace(/^www\./, '');
    } catch {
      host = '';
    }

    return {
      title: title || '(タイトルなし)',
      url: finalUrl,
      host,
      paragraphs: uniq.slice(0, 200),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function encodeArticleId(url: string): string {
  return Buffer.from(url, 'utf8').toString('base64url');
}

export function decodeArticleId(id: string): string | null {
  try {
    const url = Buffer.from(id, 'base64url').toString('utf8');
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}
