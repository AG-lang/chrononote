import React, { useState } from 'react';
import { NoteEntry, Topic } from '../../types';
import { calculateStats } from '../../utils/markdown';
import { MONTH_NAMES_ZH } from '../../utils/dateUtils';
import { MoodRadarView } from '../Mood/MoodRadarView';
import { BarChart3, BookOpen, Flame, Award, Heart, Sparkles, Smile, Layers } from 'lucide-react';

interface StatsViewProps {
  currentYear: number;
  notes: NoteEntry[];
  topics: Topic[];
  onSelectDate?: (date: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  currentYear,
  notes,
  topics,
  onSelectDate,
}) => {
  const [subTab, setSubTab] = useState<'pixels' | 'metrics'>('pixels');

  const yearNotes = notes.filter(n => {
    const [y] = n.date.split('-').map(Number);
    return y === currentYear;
  });

  const totalWords = yearNotes.reduce((acc, n) => acc + calculateStats(n.content).words, 0);
  const activeDays = new Set(yearNotes.map(n => n.date)).size;
  const avgWords = yearNotes.length ? Math.round(totalWords / yearNotes.length) : 0;

  // Monthly breakdown counts
  const monthlyCounts = Array.from({ length: 12 }).map((_, mIndex) => {
    return yearNotes.filter(n => {
      const [, m] = n.date.split('-').map(Number);
      return m === mIndex + 1;
    }).length;
  });

  const maxMonthCount = Math.max(...monthlyCounts, 1);

  // Topic breakdown
  const topicCounts = topics.map(t => {
    const count = yearNotes.filter(n => n.topicId === t.id).length;
    const words = yearNotes.filter(n => n.topicId === t.id).reduce((acc, n) => acc + calculateStats(n.content).words, 0);
    return {
      topic: t,
      count,
      words,
      percentage: yearNotes.length ? Math.round((count / yearNotes.length) * 100) : 0,
    };
  }).filter(tc => tc.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Title & SubTab Switcher */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-main">
              {currentYear} 年度时光印记与复盘
            </h2>
            <p className="text-xs text-muted mt-1 font-sans">
              以数字丈量思想的轨迹，以情绪织锦沉淀生命的厚度
            </p>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center bg-panel border border-border p-1 rounded-xl shadow-xs">
          <button
            onClick={() => setSubTab('pixels')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'pixels'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-muted hover:text-main'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>365像素年历 & 情绪晴雨表</span>
          </button>
          <button
            onClick={() => setSubTab('metrics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'metrics'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-muted hover:text-main'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>年度统计指标</span>
          </button>
        </div>
      </div>

      {subTab === 'pixels' ? (
        <MoodRadarView
          currentYear={currentYear}
          notes={notes}
          topics={topics}
          onSelectDate={(date) => {
            if (onSelectDate) onSelectDate(date);
          }}
        />
      ) : (
        <>
          {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-muted flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            <span>年度随笔</span>
          </div>
          <div className="text-2xl font-bold font-mono text-main">
            {yearNotes.length} <span className="text-xs font-normal text-muted">篇</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-muted flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>字数沉淀</span>
          </div>
          <div className="text-2xl font-bold font-mono text-main">
            {totalWords > 10000 ? `${(totalWords / 10000).toFixed(1)}万` : totalWords} <span className="text-xs font-normal text-muted">字</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-muted flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>专注天数</span>
          </div>
          <div className="text-2xl font-bold font-mono text-main">
            {activeDays} <span className="text-xs font-normal text-muted">天</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-muted flex items-center gap-1.5 mb-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>篇均字数</span>
          </div>
          <div className="text-2xl font-bold font-mono text-main">
            {avgWords} <span className="text-xs font-normal text-muted">字/篇</span>
          </div>
        </div>
      </div>

      {/* Monthly Activity Bars */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-main mb-6 font-serif">12个月写作频率分布</h3>
        <div className="grid grid-cols-12 gap-2 items-end h-40 pt-6">
          {monthlyCounts.map((count, idx) => {
            const heightPercent = Math.max(8, Math.round((count / maxMonthCount) * 100));
            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </span>
                <div
                  className="w-full rounded-t-lg bg-violet-600/30 group-hover:bg-violet-500 transition-all cursor-pointer relative"
                  style={{ height: `${heightPercent}%` }}
                  title={`${MONTH_NAMES_ZH[idx]}: ${count}篇`}
                />
                <span className="text-[10px] text-muted/70 font-mono">
                  {idx + 1}月
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic Distribution */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-main mb-4 font-serif">主题精力倾斜比例</h3>
        {topicCounts.length > 0 ? (
          <div className="space-y-3.5">
            {topicCounts.map(({ topic, count, words, percentage }) => (
              <div key={topic.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topic.color }} />
                    <span className="text-main">{topic.name}</span>
                  </div>
                  <div className="text-muted font-mono">
                    {count} 篇 ({words}字) · <span className="text-main font-semibold">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-panel overflow-hidden border border-border/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: topic.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted text-center py-6">本年度暂无主题数据记录</p>
        )}
      </div>
        </>
      )}
    </div>
  );
};

