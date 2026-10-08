import React, { useState, useEffect } from 'react';
import { NoteEntry, Topic } from '../../types';
import { renderMarkdown, calculateStats } from '../../utils/markdown';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Share2, 
  Calendar, 
  Star,
  Tag as TagIcon
} from 'lucide-react';

interface CardGalleryViewProps {
  notes: NoteEntry[];
  topics: Topic[];
  onOpenEditor: (note: NoteEntry) => void;
  onOpenShareCard: (note: NoteEntry) => void;
}

export const CardGalleryView: React.FC<CardGalleryViewProps> = ({
  notes,
  topics,
  onOpenEditor,
  onOpenShareCard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');

  const topicsMap = new Map<string, Topic>(topics.map(t => [t.id, t]));

  const filteredNotes = notes.filter(n => {
    if (selectedTopicFilter === 'all') return true;
    return n.topicId === selectedTopicFilter;
  });

  const currentNote = filteredNotes[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedTopicFilter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(filteredNotes.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filteredNotes.length]);

  if (filteredNotes.length === 0) {
    return (
      <div className="py-20 text-center text-muted text-sm">
        当前分类下暂无可供漫游浏览的随笔卡片
      </div>
    );
  }

  const topic = currentNote ? topicsMap.get(currentNote.topicId) : undefined;
  const stats = currentNote ? calculateStats(currentNote.content) : { words: 0, readTimeMin: 0 };
  const htmlContent = currentNote ? renderMarkdown(currentNote.content) : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedTopicFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedTopicFilter === 'all'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-panel text-muted hover:text-main border border-border'
            }`}
          >
            全部随笔 ({notes.length})
          </button>
          {topics.map(t => {
            const count = notes.filter(n => n.topicId === t.id).length;
            if (count === 0) return null;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopicFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedTopicFilter === t.id
                    ? 'text-white shadow-xs'
                    : 'bg-panel text-muted hover:text-main border border-border'
                }`}
                style={{
                  backgroundColor: selectedTopicFilter === t.id ? t.color : undefined,
                  borderColor: selectedTopicFilter === t.id ? t.color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedTopicFilter === t.id ? '#fff' : t.color }}
                />
                <span>{t.name}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-muted font-mono flex items-center gap-2">
          <span>{currentIndex + 1} / {filteredNotes.length}</span>
          <span className="text-muted/50 hidden sm:inline">(可用键盘左右方向键切换)</span>
        </div>
      </div>

      {/* Main Large Card Container */}
      {currentNote && (
        <div className="relative">
          {/* Card Frame */}
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-2xl transition-all relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: `${topic?.color || '#8b5cf6'}18`,
                      color: topic?.color || '#8b5cf6',
                      borderColor: `${topic?.color || '#8b5cf6'}35`,
                    }}
                  >
                    {topic?.name || '随笔'}
                  </span>
                  {currentNote.mood && <span className="text-base">{currentNote.mood}</span>}
                  {currentNote.rating && (
                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: currentNote.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatFriendlyDate(currentNote.date)}</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-main mb-6 leading-tight">
                {currentNote.title || '无题随笔'}
              </h2>

              {/* Body */}
              <div
                className="markdown-body max-w-none text-sm sm:text-base leading-relaxed font-serif"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* Tags */}
              {currentNote.tags && currentNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-border/40">
                  {currentNote.tags.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-panel border border-border text-muted"
                    >
                      <TagIcon className="w-3 h-3 text-muted/60" />
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="flex items-center justify-between pt-8 border-t border-border/60 mt-8 text-xs text-muted font-mono">
              <div>
                <span>{stats.words} 汉字/词</span> · <span>约 {stats.readTimeMin} 分钟阅读</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenShareCard(currentNote)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-panel border border-border hover:bg-card-hover text-muted hover:text-violet-400 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>生成卡片</span>
                </button>

                <button
                  onClick={() => onOpenEditor(currentNote)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>沉浸编辑</span>
                </button>
              </div>
            </div>
          </div>

          {/* Floating Navigation Arrows */}
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-panel border border-border shadow-xl flex items-center justify-center text-muted hover:text-main disabled:opacity-20 hover:scale-110 active:scale-95 transition-all z-10"
            title="前一篇 (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentIndex(prev => Math.min(filteredNotes.length - 1, prev + 1))}
            disabled={currentIndex === filteredNotes.length - 1}
            className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-panel border border-border shadow-xl flex items-center justify-center text-muted hover:text-main disabled:opacity-20 hover:scale-110 active:scale-95 transition-all z-10"
            title="后一篇 (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
