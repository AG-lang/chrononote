import React from 'react';
import { NoteEntry, Topic } from '../../types';
import { MonthCard } from './MonthCard';
import { calculateStats } from '../../utils/markdown';
import { Flame, BookOpen, Calendar, Edit3 } from 'lucide-react';

interface YearViewProps {
  currentYear: number;
  notes: NoteEntry[];
  topics: Topic[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const YearView: React.FC<YearViewProps> = ({
  currentYear,
  notes,
  topics,
  selectedDate,
  onSelectDate,
}) => {
  const topicsMap = new Map<string, Topic>(topics.map(t => [t.id, t]));

  // Filter notes for current year
  const yearNotes = notes.filter(n => {
    const [y] = n.date.split('-').map(Number);
    return y === currentYear;
  });

  // Calculate stats for current year
  const activeDaysSet = new Set(yearNotes.map(n => n.date));
  const totalWords = yearNotes.reduce((acc, cur) => acc + calculateStats(cur.content).words, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Year Overview Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted">年度随笔总篇数</div>
            <div className="text-xl font-bold font-mono text-main">{yearNotes.length} <span className="text-xs font-normal text-muted">篇</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted">记录打卡天数</div>
            <div className="text-xl font-bold font-mono text-main">{activeDaysSet.size} <span className="text-xs font-normal text-muted">天</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted">年度沉淀字数</div>
            <div className="text-xl font-bold font-mono text-main">
              {totalWords > 10000 ? `${(totalWords / 10000).toFixed(1)}万` : totalWords} <span className="text-xs font-normal text-muted">字</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted">当前主题库</div>
            <div className="text-xl font-bold font-mono text-main">{topics.length} <span className="text-xs font-normal text-muted">类</span></div>
          </div>
        </div>
      </div>

      {/* Topic Colors Legend */}
      <div className="bg-card/60 border border-border rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-muted text-[11px] flex items-center gap-1.5 font-medium">
          <span>主题色彩图例:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {topics.map(t => (
            <div key={t.id} className="flex items-center gap-1.5 text-muted hover:text-main transition-colors">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: t.color }}
              />
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 12-Month Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, mIndex) => (
          <MonthCard
            key={mIndex}
            year={currentYear}
            monthIndex={mIndex}
            notes={notes}
            topicsMap={topicsMap}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
};
