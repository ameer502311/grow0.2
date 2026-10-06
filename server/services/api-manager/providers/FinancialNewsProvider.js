/**
 * GROW 0.2 Financial News Provider Adapter
 * Multi-tier News Aggregator using Public RSS Feeds (Economic Times Markets, LiveMint)
 * and Groq AI LPU Summarization.
 * Priority: 1. Configured News API -> 2. Public RSS -> 3. Cached Offline Backup.
 */

import { BaseProviderAdapter } from './BaseProviderAdapter.js';
import { globalCacheManager } from '../cache/CacheManager.js';
import { DataValidator } from '../validation/DataValidator.js';

export class FinancialNewsProvider extends BaseProviderAdapter {
  constructor() {
    super({
      providerId: 'news_et_markets_rss',
      providerName: 'The Economic Times Markets / LiveMint RSS Feed',
      dataType: 'news',
      authType: 'rss',
      endpoint: 'economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      sourceUrl: 'https://economictimes.indiatimes.com/markets',
      priority: 2
    });
  }

  parseXmlItems(xmlText) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 15) {
      const itemBlock = match[1];

      const getTag = (tag) => {
        const cdataRegex = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
        const cdataMatch = cdataRegex.exec(itemBlock);
        if (cdataMatch) return cdataMatch[1].trim();

        const normalRegex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const normalMatch = normalRegex.exec(itemBlock);
        return normalMatch ? normalMatch[1].trim() : '';
      };

      const title = getTag('title').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
      const link = getTag('link');
      const pubDate = getTag('pubDate');
      let description = getTag('description')
        .replace(/<[^>]+>/g, '') // strip HTML
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .trim();

      if (description.length > 220) {
        description = description.slice(0, 217) + '...';
      }

      if (title && title.length > 5 && link) {
        // Categorize based on headline keywords
        let category = 'Market Update';
        const lower = title.toLowerCase();
        if (lower.includes('gold') || lower.includes('silver') || lower.includes('bullion')) category = 'Commodities';
        else if (lower.includes('rbi') || lower.includes('rate') || lower.includes('inflation')) category = 'Economy';
        else if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('ethereum')) category = 'Crypto';
        else if (lower.includes('nifty') || lower.includes('sensex') || lower.includes('stock')) category = 'Equities';
        else if (lower.includes('tax') || lower.includes('budget') || lower.includes('sip')) category = 'Personal Finance';

        items.push({
          id: `news-${Date.now()}-${items.length}`,
          title,
          summary: description || title,
          category,
          source: 'The Economic Times',
          url: link,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
          ai_analyzed: false
        });
      }
    }

    return items;
  }

  async fetchData() {
    const cacheKey = 'financial_news_headlines';

    // Level 6: Cache hit
    const cached = globalCacheManager.get(cacheKey);
    if (cached) {
      this.freshness = 'cached';
      return cached;
    }

    // Level 1 / Level 2: Public RSS Feeds
    const rssFeeds = [
      'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      'https://www.livemint.com/rss/markets'
    ];

    for (const feedUrl of rssFeeds) {
      try {
        const { response, elapsed } = await this.fetchWithTimeout(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }, 6000);

        if (response.ok) {
          const xmlText = await response.text();
          const items = this.parseXmlItems(xmlText);

          if (items.length > 0) {
            this.recordSuccess(elapsed);
            this.freshness = 'live';
            // Cache for 15 minutes (900 seconds)
            globalCacheManager.set(cacheKey, items, 900, 'news');
            return items;
          }
        }
      } catch (err) {
        console.warn(`⚠️ RSS feed failed (${feedUrl}):`, err.message);
      }
    }

    // Level 6: Offline Cache Backup
    const fallback = globalCacheManager.getLastKnownValid(cacheKey);
    if (fallback && Array.isArray(fallback.value) && fallback.value.length > 0) {
      this.freshness = 'stale';
      return fallback.value;
    }

    // Return empty list if unavailable
    this.recordFailure(new Error('All financial news feeds failed'), 'failed');
    return [];
  }

  /**
   * Use Groq AI to generate a 2-sentence market briefing from latest headlines
   */
  async generateAiMarketBriefing(items) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || !Array.isArray(items) || items.length === 0) {
      return null;
    }

    try {
      const headlines = items.slice(0, 5).map(i => `- ${i.title}`).join('\n');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are Grow 0.2 Market Intelligence. Summarize these financial headlines into 2 crisp sentences for an Indian retail investor. Be objective and educational. Never promise returns.'
            },
            {
              role: 'user',
              content: `Summarize these headlines:\n${headlines}`
            }
          ],
          max_tokens: 150
        })
      });

      if (response.ok) {
        const json = await response.json();
        return {
          briefing: json.choices?.[0]?.message?.content,
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          provider: 'Groq Cloud LPU',
          generatedAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('⚠️ Groq news briefing generation error:', e.message);
    }
    return null;
  }
}

export const financialNewsProvider = new FinancialNewsProvider();
export default financialNewsProvider;
