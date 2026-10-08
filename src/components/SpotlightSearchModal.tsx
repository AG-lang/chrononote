import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NoteEntry, Topic } from '../types';
import { NoteSearchEngine, SearchResultItem } from '../utils/searchIndex';
import { 
  Search, 
  X, 
  Calendar, 
  Tag, 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  Pin, 
  SlidersHorizontal,
  Flame,
  Filter
} from 'lucide-react';

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteEntry[];
  topics: Topic[];
  onSelectNote: (note: NoteEntry) => void;
}

const HISTORY_KEY = 'chrononote_recent_searches_v1';

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  isOpen,
  onClose,
  notes,
  topics,
  onSelectNote,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilterTag, setActiveFilterTag] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const topicsMap = useMemo(() => new Map<string, Topic>(topics.map(t => [t.id, t])), [topics]);

  // Maintain inverted search index instance
  const searchEngine = useMemo(() => {
    return new NoteSearchEngine(notes, topics);
  }, [notes, topics]);

  // Load recent searches on open
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) setRecentSearches(JSON.parse(raw));
      } catch {}

      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery('');
      setSelectedIndex(0);
      setActiveFilterTag('all');
    }
  }, [isOpen]);

  // Execute Search via Inverted Index
  const searchResults: SearchResultItem[] = useMemo(() => {
    let effectiveQuery = query.trim();
    if (activeFilterTag === 'pinned') {
      effectiveQuery = effectiveQuery ? `${effectiveQuery} is:pinned` : 'is:pinned';
    } else if (activeFilterTag === 'reading') {
      effectiveQuery = effectiveQuery ? `${effectiveQuery} topic:读书` : 'topic:读书';
    } else if (activeFilterTag.startsWith('mood:')) {
      effectiveQuery = effectiveQuery ? `${effectiveQuery} ${activeFilterTag}` : activeFilterTag;
    }

    return searchEngine.search(effectiveQuery);
  }, [query, activeFilterTag, searchEngine]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 6);
    setRecentSearches(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleSelect = (item: SearchResultItem) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    onSelectNote(item.note);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, Math.max(0, searchResults.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-panel/95 backdrop-blur-xl border border-border/90 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onKeyDown={handleKeyDown}
      >
        {/* Top Input Bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card/60">
          <div className="w-8 h-8 rounded-lg bg-violet-600/15 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="全文索引检索：输入关键词、tag:标签、topic:主题、mood:💡 或 &quot;精确短语&quot;..."
            className="w-full bg-transparent text-sm text-main focus:outline-none placeholder:text-muted/50 font-sans"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="p-1 text-muted hover:text-main rounded-md hover:bg-card text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="px-2 py-0.5 rounded-md bg-card border border-border text-[10px] text-muted font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Quick Filter Chips Bar */}
        <div className="px-4 py-2 border-b border-border/50 bg-card/30 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] text-muted flex items-center gap-1 mr-1 shrink-0 font-medium">
            <Filter className="w-3 h-3 text-violet-400" /> 过滤:
          </span>

          <button
            onClick={() => setActiveFilterTag('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeFilterTag === 'all'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-card text-muted hover:text-main'
            }`}
          >
            全部
          </button>

          <button
            onClick={() => setActiveFilterTag(activeFilterTag === 'pinned' ? 'all' : 'pinned')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeFilterTag === 'pinned'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-card text-muted hover:text-main'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>置顶随笔</span>
          </button>

          <button
            onClick={() => setActiveFilterTag(activeFilterTag === 'reading' ? 'all' : 'reading')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeFilterTag === 'reading'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-card text-muted hover:text-main'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>读书思考</span>
          </button>

          <button
            onClick={() => setActiveFilterTag(activeFilterTag === 'mood:💡' ? 'all' : 'mood:💡')}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeFilterTag === 'mood:💡'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-card text-muted hover:text-main'
            }`}
          >
            💡 灵感
          </button>

          <button
            onClick={() => setActiveFilterTag(activeFilterTag === 'mood:🔥' ? 'all' : 'mood:🔥')}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeFilterTag === 'mood:🔥'
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                : 'bg-card text-muted hover:text-main'
            }`}
          >
            🔥 专注
          </button>
        </div>

        {/* Recent Search History (shown when input is empty) */}
        {!query && recentSearches.length > 0 && (
          <div className="px-4 py-2 border-b border-border/40 bg-panel flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] text-muted flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" /> 最近搜索:
              </span>
              {recentSearches.map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-2 py-0.5 rounded-md bg-card hover:bg-card-hover text-main text-[11px] border border-border/60 transition-colors shrink-0"
                >
                  {term}
                </button>
              ))}
            </div>
            <button
              onClick={clearRecentSearches}
              className="text-[10px] text-muted/70 hover:text-rose-400 shrink-0 ml-2"
            >
              清除历史
            </button>
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-border/30 flex-1">
          {searchResults.length > 0 ? (
            searchResults.map((item, index) => {
              const { note, score, snippets } = item;
              const topic = topicsMap.get(note.topicId);
              const isSelected = index === selectedIndex;
              const defaultExcerpt = note.content
                .replace(/^#+\s+/gm, '')
                .replace(/```[\s\S]*?```/g, '')
                .trim()
                .slice(0, 110);

              return (
                <div
                  key={note.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-card border border-violet-500/50 shadow-md ring-1 ring-violet-500/20' : 'hover:bg-card/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Topic, Date, Mood & Score */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: topic?.color || '#8b5cf6' }}
                      />
                      <span className="text-[11px] font-semibold text-main">
                        {topic?.name || '随笔'}
                      </span>
                      <span className="text-[11px] text-muted/70 font-mono">
                        · {note.date}
                      </span>
                      {note.mood && (
                        <span className="text-xs px-1 py-0.2 rounded bg-card border border-border/50">
                          {note.mood}
                        </span>
                      )}
                      {note.pinned && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5" /> 置顶
                        </span>
                      )}

                      {/* Relevance Score Badge */}
                      {query && (
                        <span className="text-[9px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.2 rounded border border-violet-500/20 ml-auto">
                          匹配度 {score}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-main truncate font-serif mb-1 tracking-wide">
                      {note.title || '无标题随笔'}
                    </h4>

                    {/* Content Snippet with Highlight */}
                    {snippets.length > 0 ? (
                      <p 
                        className="text-xs text-muted/90 leading-relaxed font-sans bg-panel/50 p-1.5 rounded-lg border border-border/40"
                        dangerouslySetInnerHTML={{ __html: snippets[0].snippetHtml }}
                      />
                    ) : (
                      <p className="text-xs text-muted leading-relaxed line-clamp-2 font-sans">
                        {defaultExcerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {note.tags.map(t => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-panel border border-border/60 text-muted/80 font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-violet-400 shrink-0 self-center animate-pulse" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-14 text-center space-y-2 text-muted">
              <Search className="w-8 h-8 text-muted/30 mx-auto" />
              <p className="text-xs font-medium text-main">
                未检索到与 “{query}” 相关的随笔内容
              </p>
              <p className="text-[11px] text-muted/70 max-w-sm mx-auto">
                可尝试简化关键词，或使用 <code>tag:标签名</code>、<code>topic:主题名</code> 进行多维过滤。
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts & Index Status */}
        <div className="px-4 py-2.5 bg-card/70 border-t border-border flex items-center justify-between text-[11px] text-muted font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ 切换选择</span>
            <span>↵ 确认打开</span>
            <span>ESC 关闭</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>已索引 {notes.length} 篇 · 匹配 {searchResults.length} 条</span>
          </div>
        </div>
      </div>
    </div>
  );
};
