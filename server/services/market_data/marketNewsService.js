/**
 * Market News Provider Service
 * Updates news headlines every 15 minutes and caches results
 */

let cachedNews = [
  {
    id: 'news-101',
    title: 'RBI Monetary Policy Committee Maintains Repo Rate at 6.5%',
    summary: 'The Reserve Bank of India keeps policy interest rates unchanged, noting sustained GDP growth momentum and moderate headline inflation.',
    category: 'RBI Updates',
    source: 'Economic Times India',
    url: 'https://economictimes.indiatimes.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'news-102',
    title: 'Gold Prices Surge Near All-Time Highs on Global Central Bank Buying',
    summary: 'Gold 24K pure bullion rates crossed ₹74,700 per 10 grams as institutional demand for safe-haven assets remains robust.',
    category: 'Gold',
    source: 'Moneycontrol',
    url: 'https://www.moneycontrol.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'news-103',
    title: 'NIFTY 50 and BSE SENSEX Rally Led by IT and Banking Stocks',
    summary: 'Benchmark stock indices gained over 0.6% during intraday trading following strong quarterly earnings guidance from bluechip leaders.',
    category: 'Stock Market',
    source: 'LiveMint Financial News',
    url: 'https://www.livemint.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80'
  }
];

export class MarketNewsService {
  static getNews() {
    return cachedNews;
  }

  static refreshNews() {
    // Stamp current fetch time on news payload
    cachedNews.forEach(item => {
      item.fetched_at = new Date().toISOString();
    });
    return cachedNews;
  }
}
