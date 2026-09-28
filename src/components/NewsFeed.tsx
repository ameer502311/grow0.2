import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Newspaper, ExternalLink, Filter, Clock, X } from 'lucide-react';

interface NewsFeedProps {
  onExit?: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ onExit }) => {
  const { news } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL', 'Stock Market', 'Gold', 'Crypto', 'Business', 'RBI Updates', 'Tax News'
  ];

  const filteredNews = news.filter(n => selectedCategory === 'ALL' || n.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Daily Financial News & Market Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Curated headlines covering Indian & global stock markets, RBI policy, crypto, tax tips & bullion prices.</p>
        </div>

        {onExit && (
          <button 
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="Exit to Dashboard"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNews.map((item) => (
          <div key={item.id} className="glass-panel glass-card-hover rounded-3xl p-5 bg-slate-900/60 border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="px-2 py-0.5 rounded font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.category}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.publishedAt}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white leading-snug">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.summary}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
              <span className="text-slate-500 font-semibold">{item.source}</span>
              <a 
                href={item.url} 
                onClick={(e) => e.preventDefault()}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Read Full Article <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
