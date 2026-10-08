import React, { useState } from 'react';
import { NoteEntry, Topic } from '../types';
import { renderMarkdown, calculateStats } from '../utils/markdown';
import { MONTH_NAMES_ZH, formatFriendlyDate } from '../utils/dateUtils';
import { Printer, X, BookOpen, Download, Sparkles } from 'lucide-react';

interface MemoirExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  notes: NoteEntry[];
  topics: Topic[];
}

export const MemoirExportModal: React.FC<MemoirExportModalProps> = ({
  isOpen,
  onClose,
  currentYear,
  notes,
  topics,
}) => {
  const [authorName, setAuthorName] = useState('时光墨客');
  const [customTitle, setCustomTitle] = useState(`${currentYear} 年度时光手记与读书文集`);

  if (!isOpen) return null;

  const yearNotes = notes
    .filter(n => {
      const [y] = n.date.split('-').map(Number);
      return y === currentYear;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalWords = yearNotes.reduce((acc, n) => acc + calculateStats(n.content).words, 0);
  const topicsMap = new Map<string, Topic>(topics.map(t => [t.id, t]));

  // Group notes by month (0-11)
  const notesByMonth = Array.from({ length: 12 }).map((_, mIndex) => {
    return {
      monthIndex: mIndex,
      monthName: MONTH_NAMES_ZH[mIndex],
      notes: yearNotes.filter(n => {
        const [, m] = n.date.split('-').map(Number);
        return m === mIndex + 1;
      }),
    };
  }).filter(m => m.notes.length > 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0 print:z-[9999]">
      <div className="bg-panel border border-border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:w-full print:rounded-none print:border-none print:shadow-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 print:hidden">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-sm text-main font-serif">年度文集回忆录排版预览</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>打印或保存为 PDF (Ctrl+P)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-card-hover text-muted hover:text-main"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customization Row (Hidden on print) */}
        <div className="px-6 py-3 bg-card border-b border-border flex items-center gap-4 text-xs print:hidden">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-muted shrink-0">文集书名:</span>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-panel border border-border text-main text-xs flex-1 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted shrink-0">作者署名:</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-panel border border-border text-main text-xs w-32 focus:outline-none"
            />
          </div>
        </div>

        {/* Book Preview Area */}
        <div className="p-8 sm:p-14 overflow-y-auto flex-1 space-y-12 bg-white text-stone-900 print:p-0 print:space-y-8 font-serif leading-relaxed">
          {/* Cover Page */}
          <div className="min-h-[600px] flex flex-col justify-between p-12 border-4 border-double border-stone-200 rounded-3xl bg-stone-50/50 print:border-none print:min-h-screen print:page-break-after-always">
            <div className="text-right text-xs text-stone-400 font-mono tracking-widest">
              CHRONONOTE MEMOIR · {currentYear}
            </div>

            <div className="text-center my-auto space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono tracking-widest bg-stone-200 text-stone-700">
                时光回忆录 · 个人年度文集
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 tracking-tight">
                {customTitle}
              </h1>
              <p className="text-sm text-stone-500 max-w-md mx-auto italic font-serif">
                “文字是时间的琥珀，将逝去的光阴与思想凝结为永恒。”
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 pt-6 text-xs text-stone-500 font-mono">
              <div>作者：{authorName}</div>
              <div>共辑录 {yearNotes.length} 篇随笔 · 累计 {totalWords} 字</div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200 print:bg-transparent print:border-none print:page-break-after-always">
            <h2 className="text-xl font-bold mb-6 text-center border-b pb-3 font-serif">
              目 录 (Table of Contents)
            </h2>
            <div className="space-y-4 text-xs font-serif">
              {notesByMonth.map(m => (
                <div key={m.monthIndex} className="space-y-1">
                  <div className="font-bold text-stone-800 flex items-center justify-between border-b border-dashed border-stone-300 pb-1">
                    <span>{m.monthName} ({m.notes.length}篇)</span>
                  </div>
                  <div className="pl-4 space-y-1 text-stone-600">
                    {m.notes.map(n => (
                      <div key={n.id} className="flex justify-between">
                        <span>• {n.date} · 《{n.title}》</span>
                        <span className="text-stone-400 font-mono">[{topicsMap.get(n.topicId)?.name || '随笔'}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapters and Articles */}
          {notesByMonth.map(m => (
            <div key={m.monthIndex} className="space-y-10 print:page-break-before-always">
              {/* Monthly Chapter Header */}
              <div className="text-center py-6 border-y-2 border-stone-300">
                <span className="text-xs uppercase tracking-widest text-stone-400 font-sans">Chapter</span>
                <h2 className="text-2xl font-bold text-stone-900 font-serif mt-1">
                  {m.monthName}
                </h2>
              </div>

              {/* Notes List */}
              <div className="space-y-12">
                {m.notes.map(note => {
                  const topic = topicsMap.get(note.topicId);
                  return (
                    <article key={note.id} className="border-b border-stone-200 pb-8 last:border-b-0 space-y-3 print:page-break-inside-avoid">
                      <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                        <span>{formatFriendlyDate(note.date)}</span>
                        <span className="px-2 py-0.5 rounded bg-stone-100 border text-stone-700">
                          {topic?.name || '随笔'} {note.mood || ''}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-stone-900 font-serif leading-snug">
                        {note.title}
                      </h3>

                      <div
                        className="markdown-body max-w-none text-sm leading-relaxed text-stone-800 font-serif pt-2"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                      />
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
