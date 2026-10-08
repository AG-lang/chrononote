import React, { useState, useMemo } from 'react';
import { NoteEntry, Topic } from '../../types';
import { getDaysInMonth, MONTH_NAMES_ZH, formatDateCN } from '../../utils/dateUtils';
import { 
  Smile, 
  Sparkles, 
  Activity, 
  Flame, 
  Heart, 
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Calendar
} from 'lucide-react';

interface MoodRadarViewProps {
  currentYear: number;
  notes: NoteEntry[];
  topics: Topic[];
  onSelectDate: (date: string) => void;
}

interface MoodConfig {
  emoji: string;
  name: string;
  color: string;
  bgColor: string;
  energy: number; // 1 to 5
}

const MOOD_CONFIGS: Record<string, MoodConfig> = {
  '💡': { emoji: '💡', name: '灵感涌现', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.25)', energy: 5 },
  '☕': { emoji: '☕', name: '从容平和', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.25)', energy: 3 },
  '🔥': { emoji: '🔥', name: '专注激情', color: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.25)', energy: 5 },
  '🌿': { emoji: '🌿', name: '自然舒缓', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.25)', energy: 4 },
  '🌧️': { emoji: '🌧️', name: '沉思内省', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.25)', energy: 2 },
};

export const MoodRadarView: React.FC<MoodRadarViewProps> = ({
  currentYear,
  notes,
  topics,
  onSelectDate,
}) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Filter notes by current year
  const yearNotes = useMemo(() => {
    return notes.filter(n => {
      const [y] = n.date.split('-').map(Number);
      return y === currentYear;
    });
  }, [notes, currentYear]);

  // Group notes by date map
  const dateNotesMap = useMemo(() => {
    const map = new Map<string, NoteEntry[]>();
    yearNotes.forEach(n => {
      const arr = map.get(n.date) || [];
      arr.push(n);
      map.set(n.date, arr);
    });
    return map;
  }, [yearNotes]);

  // Count mood occurrences
  const moodStats = useMemo(() => {
    const counts: Record<string, number> = {
      '💡': 0,
      '☕': 0,
      '🔥': 0,
      '🌿': 0,
      '🌧️': 0,
    };
    let totalWithMood = 0;

    yearNotes.forEach(n => {
      if (n.mood && counts[n.mood] !== undefined) {
        counts[n.mood]++;
        totalWithMood++;
      }
    });

    return { counts, totalWithMood };
  }, [yearNotes]);

  // Monthly energy scores (1-12)
  const monthlyEnergy = useMemo(() => {
    return Array.from({ length: 12 }).map((_, mIdx) => {
      const m = mIdx + 1;
      const monthNotes = yearNotes.filter(n => {
        const [, noteM] = n.date.split('-').map(Number);
        return noteM === m;
      });

      if (monthNotes.length === 0) return { month: m, score: 3.0, count: 0 };

      let totalEnergy = 0;
      let ratedCount = 0;

      monthNotes.forEach(n => {
        const cfg = n.mood ? MOOD_CONFIGS[n.mood] : null;
        if (cfg) {
          totalEnergy += cfg.energy;
          ratedCount++;
        }
      });

      const avg = ratedCount > 0 ? Number((totalEnergy / ratedCount).toFixed(1)) : 3.0;
      return { month: m, score: avg, count: monthNotes.length };
    });
  }, [yearNotes]);

  // Max dominant mood
  const dominantMood = useMemo(() => {
    const sorted = Object.entries(moodStats.counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : '☕';
  }, [moodStats]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dominant Mood Card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10"
            style={{ backgroundColor: MOOD_CONFIGS[dominantMood]?.bgColor || 'rgba(99, 102, 241, 0.2)' }}
          >
            {dominantMood}
          </div>
          <div>
            <span className="text-xs text-muted block font-medium">年度主基调情绪</span>
            <h4 className="text-lg font-bold text-main mt-0.5">
              {MOOD_CONFIGS[dominantMood]?.name || '从容平和'}
            </h4>
            <p className="text-[11px] text-muted font-mono mt-0.5">
              记录频次: {moodStats.counts[dominantMood]} 次 · 占比 {moodStats.totalWithMood > 0 ? Math.round((moodStats.counts[dominantMood] / moodStats.totalWithMood) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Emotion Distribution Bars */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted pb-2 border-b border-border/50">
            <span className="font-medium flex items-center gap-1.5 text-main">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              <span>心境能量分布雷达</span>
            </span>
            <span className="font-mono">已记录 {moodStats.totalWithMood} 次情绪样本</span>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-3">
            {Object.entries(MOOD_CONFIGS).map(([emoji, cfg]) => {
              const count = moodStats.counts[emoji] || 0;
              const percent = moodStats.totalWithMood > 0 
                ? Math.round((count / moodStats.totalWithMood) * 100) 
                : 0;

              return (
                <div key={emoji} className="flex flex-col items-center gap-1 group">
                  <div className="text-xl group-hover:scale-125 transition-transform">
                    {emoji}
                  </div>
                  <span className="text-[11px] text-main font-medium">{cfg.name}</span>
                  <div className="w-full bg-panel rounded-full h-1.5 overflow-hidden border border-border/60">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted font-mono">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 365 Pixel Year Calendar Grid (Year in Pixels) */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between pb-5 border-b border-border/60 gap-3">
          <div>
            <h3 className="text-base font-bold text-main flex items-center gap-2">
              <span>365 像素年历 (Year in Pixels)</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {currentYear} 全景织锦
              </span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              365个小方格凝结一整年的心绪起伏。点击任意像素点即可直接跳转该日工作区。
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-xs">
            {Object.entries(MOOD_CONFIGS).map(([emoji, cfg]) => (
              <div key={emoji} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cfg.color }} />
                <span className="text-muted text-[11px]">{cfg.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-panel border border-border" />
              <span className="text-muted text-[11px]">未记录</span>
            </div>
          </div>
        </div>

        {/* 12 Months x 31 Days Matrix */}
        <div className="overflow-x-auto pt-6 pb-2">
          <div className="min-w-[650px]">
            {/* Header: Months 1-12 */}
            <div className="grid grid-cols-[30px_repeat(12,1fr)] gap-1.5 mb-2 text-center text-xs font-mono text-muted">
              <div>#</div>
              {MONTH_NAMES_ZH.map((mName, mIdx) => (
                <div key={mIdx} className="font-semibold text-main">
                  {mIdx + 1}月
                </div>
              ))}
            </div>

            {/* Rows: Days 1 to 31 */}
            {Array.from({ length: 31 }).map((_, dayIdx) => {
              const dayNum = dayIdx + 1;
              return (
                <div 
                  key={dayNum} 
                  className="grid grid-cols-[30px_repeat(12,1fr)] gap-1.5 items-center mb-1.5"
                >
                  {/* Day number label */}
                  <div className="text-[10px] font-mono text-muted text-right pr-2">
                    {dayNum}
                  </div>

                  {/* 12 Months Cells */}
                  {Array.from({ length: 12 }).map((_, monthIdx) => {
                    const monthNum = monthIdx + 1;
                    const maxDays = getDaysInMonth(currentYear, monthNum);

                    // If day exceeds max days in this month (e.g. Feb 30)
                    if (dayNum > maxDays) {
                      return (
                        <div 
                          key={monthIdx} 
                          className="h-6 rounded-md bg-transparent"
                        />
                      );
                    }

                    const dateStr = `${currentYear}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    const dayNotes = dateNotesMap.get(dateStr) || [];
                    const noteCount = dayNotes.length;
                    
                    // Determine dominant mood for this day
                    const dayMood = dayNotes.find(n => n.mood)?.mood;
                    const moodCfg = dayMood ? MOOD_CONFIGS[dayMood] : null;

                    const hasNotes = noteCount > 0;
                    const cellColor = moodCfg 
                      ? moodCfg.color 
                      : hasNotes 
                        ? '#8b5cf6' 
                        : 'transparent';

                    return (
                      <div
                        key={monthIdx}
                        onClick={() => onSelectDate(dateStr)}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`h-6 rounded-md transition-all cursor-pointer relative group flex items-center justify-center border text-[10px] select-none ${
                          hasNotes
                            ? 'hover:scale-110 shadow-xs border-transparent'
                            : 'bg-panel/40 border-border/40 hover:border-violet-500/50 hover:bg-card'
                        }`}
                        style={{
                          backgroundColor: cellColor !== 'transparent' ? cellColor : undefined,
                          color: hasNotes ? '#ffffff' : undefined,
                        }}
                        title={`${dateStr}: ${hasNotes ? `${noteCount}篇随笔` : '无记录'}`}
                      >
                        {dayMood ? (
                          <span className="text-[10px] leading-none drop-shadow-xs">
                            {dayMood}
                          </span>
                        ) : hasNotes ? (
                          <span className="font-mono text-[9px] font-bold">
                            {noteCount}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hovered Date Preview Banner */}
        {hoveredDate && (
          <div className="mt-4 p-3 bg-panel border border-border rounded-xl flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span className="font-bold text-main font-mono">
                {formatDateCN(hoveredDate)}
              </span>
              {dateNotesMap.get(hoveredDate) ? (
                <span className="text-muted">
                  包含 {dateNotesMap.get(hoveredDate)!.length} 篇随笔: {' '}
                  <span className="text-main font-medium">
                    {dateNotesMap.get(hoveredDate)!.map(n => n.title).join(' · ')}
                  </span>
                </span>
              ) : (
                <span className="text-muted">暂无墨迹，点击即可开始记录随笔</span>
              )}
            </div>

            <button
              onClick={() => onSelectDate(hoveredDate)}
              className="text-violet-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>进入单日流</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Monthly Emotional Energy Curve (月度心境能量趋势) */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-main flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>年度心境能量起伏曲线</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              以五维心流能量（1低落 ~ 5激情/灵感）刻画生命节律
            </p>
          </div>
          <div className="text-xs text-muted font-mono">
            基准能量线: 3.0 (从容平和)
          </div>
        </div>

        {/* SVG Curve Line Chart */}
        <div className="h-44 w-full">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1200 160">
            {/* Guide Grid lines */}
            <line x1="40" y1="30" x2="1160" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <line x1="40" y1="80" x2="1160" y2="80" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <line x1="40" y1="130" x2="1160" y2="130" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

            {/* Smooth SVG Path */}
            {(() => {
              const points = monthlyEnergy.map((item, idx) => {
                const x = 70 + idx * 95;
                // Score 1 (bottom = 140) to 5 (top = 20)
                const y = 140 - ((item.score - 1) / 4) * 120;
                return { x, y, ...item };
              });

              // Create SVG bezier curve
              let d = `M ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const midX = (p0.x + p1.x) / 2;
                d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
              }

              return (
                <>
                  <path
                    d={d}
                    fill="none"
                    stroke="url(#energyGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {points.map((pt, pIdx) => (
                    <g key={pIdx} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="5"
                        className="fill-violet-400 stroke-white stroke-2 group-hover:r-7 transition-all"
                      />
                      <text
                        x={pt.x}
                        y={155}
                        textAnchor="middle"
                        className="text-[11px] fill-current text-muted font-mono"
                      >
                        {pt.month}月
                      </text>
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        className="text-[10px] fill-violet-300 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {pt.score}分
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}

            <defs>
              <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};
