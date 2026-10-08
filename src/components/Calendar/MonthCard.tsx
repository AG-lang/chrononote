import React from 'react';
import { 
  getDaysInMonth, 
  getFirstDayOfWeek, 
  MONTH_NAMES_ZH, 
  MONTH_NAMES_EN, 
  WEEKDAYS_ZH,
  getTodayDateString,
  formatDate
} from '../../utils/dateUtils';
import { NoteEntry, Topic } from '../../types';

interface MonthCardProps {
  year: number;
  monthIndex: number; // 0-11
  notes: NoteEntry[];
  topicsMap: Map<string, Topic>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const MonthCard: React.FC<MonthCardProps> = ({
  year,
  monthIndex,
  notes,
  topicsMap,
  selectedDate,
  onSelectDate,
}) => {
  const todayStr = getTodayDateString();
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDayOffset = getFirstDayOfWeek(year, monthIndex); // 0 = Mon, 6 = Sun

  // Filter notes belonging to this month
  const monthNotes = notes.filter(n => {
    const [y, m] = n.date.split('-').map(Number);
    return y === year && m === monthIndex + 1;
  });

  // Group notes by date string (YYYY-MM-DD)
  const notesByDate = new Map<string, NoteEntry[]>();
  monthNotes.forEach(note => {
    const arr = notesByDate.get(note.date) || [];
    arr.push(note);
    notesByDate.set(note.date, arr);
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
        <div>
          <h3 className="font-semibold text-sm text-main font-serif tracking-wide">
            {MONTH_NAMES_ZH[monthIndex]}
          </h3>
          <span className="text-[10px] text-muted font-sans uppercase tracking-wider">
            {MONTH_NAMES_EN[monthIndex]}
          </span>
        </div>
        {monthNotes.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20">
            {monthNotes.length} 篇
          </span>
        )}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] text-muted/70 font-medium">
        {WEEKDAYS_ZH.map((w, idx) => (
          <span key={idx} className={idx >= 5 ? 'text-amber-500/80' : ''}>
            {w}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Padding empty slots */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {/* Month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = formatDate(new Date(year, monthIndex, dayNum));
          const dayNotes = notesByDate.get(dateStr) || [];
          const count = dayNotes.length;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          // Unique topic colors for this day
          const topicColors = Array.from(
            new Set(dayNotes.map(n => topicsMap.get(n.topicId)?.color).filter(Boolean))
          ) as string[];

          return (
            <button
              key={dayNum}
              onClick={() => onSelectDate(dateStr)}
              className={`relative h-8 rounded-lg flex flex-col items-center justify-center transition-all group/day
                ${isSelected 
                  ? 'bg-violet-600 text-white font-bold shadow-sm' 
                  : isToday 
                    ? 'ring-1.5 ring-violet-400 text-violet-400 font-bold bg-violet-500/10' 
                    : count > 0 
                      ? 'bg-card-hover text-main hover:bg-violet-600/20' 
                      : 'text-muted/80 hover:bg-card-hover hover:text-main'
                }
              `}
              title={
                count > 0 
                  ? `${dateStr} (${count}篇):\n` + dayNotes.map(n => `• [${topicsMap.get(n.topicId)?.name || '随笔'}] ${n.title}`).join('\n')
                  : dateStr
              }
            >
              <span className="text-xs leading-none">
                {dayNum}
              </span>

              {/* Dots indicator for topics */}
              {topicColors.length > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {topicColors.slice(0, 3).map((col, idx) => (
                    <span
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : col }}
                    />
                  ))}
                  {topicColors.length > 3 && (
                    <span className="w-1 h-1 rounded-full bg-muted" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
