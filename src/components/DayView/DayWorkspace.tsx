import React from 'react';
import { NoteEntry, Topic } from '../../types';
import { NoteCard } from './NoteCard';
import { formatFriendlyDate, parseDate, formatDate, getTodayDateString } from '../../utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Sparkles, 
  BookOpen,
  ArrowLeft,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DayWorkspaceProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onBackToYear: () => void;
  notes: NoteEntry[];
  topics: Topic[];
  onOpenEditor: (note: NoteEntry) => void;
  onCreateNewNoteWithTopic: (topicId: string) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenShareCard: (note: NoteEntry) => void;
}

export const DayWorkspace: React.FC<DayWorkspaceProps> = ({
  selectedDate,
  onSelectDate,
  onBackToYear,
  notes,
  topics,
  onOpenEditor,
  onCreateNewNoteWithTopic,
  onDeleteNote,
  onTogglePin,
  onOpenShareCard,
}) => {
  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  // Filter notes for this date
  const dayNotes = notes
    .filter(n => n.date === selectedDate)
    .sort((a, b) => {
      // Pinned notes first, then latest created
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Feature 1: "On This Day" (那年今日) - query past years with same MM-DD
  const [selectedY, selectedM, selectedD] = selectedDate.split('-');
  const sameDayPastNotes = notes.filter(n => {
    const [y, m, d] = n.date.split('-');
    return m === selectedM && d === selectedD && y !== selectedY;
  });

  const topicsMap = new Map<string, Topic>(topics.map(t => [t.id, t]));

  // Previous and next day handlers
  const handlePrevDay = () => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(formatDate(d));
  };

  const handleNextDay = () => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(formatDate(d));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Date Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Back & Date Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToYear}
              className="p-2 rounded-xl bg-panel border border-border hover:bg-card-hover text-muted hover:text-main transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="返回12个月全景"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">12月全景</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-main tracking-tight">
                  {formatFriendlyDate(selectedDate)}
                </h2>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    今日
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5 font-mono">
                {selectedDate} · 本日已沉淀 {dayNotes.length} 篇随笔
              </p>
            </div>
          </div>

          {/* Right: Date Step Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handlePrevDay}
              className="px-3 py-1.5 rounded-xl bg-panel border border-border hover:bg-card-hover text-muted hover:text-main transition-colors flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>前一天</span>
            </button>

            <button
              onClick={() => onSelectDate(todayStr)}
              className="px-3 py-1.5 rounded-xl bg-panel border border-border hover:bg-card-hover text-muted hover:text-main transition-colors text-xs font-medium"
            >
              回到今天
            </button>

            <button
              onClick={handleNextDay}
              className="px-3 py-1.5 rounded-xl bg-panel border border-border hover:bg-card-hover text-muted hover:text-main transition-colors flex items-center gap-1 text-xs"
            >
              <span>后一天</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Topic Chips - Directly create notes under a topic */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <div className="text-xs font-medium text-muted mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>在今天快速记录主题随笔 (多篇自由并存)：</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => onCreateNewNoteWithTopic(t.id)}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${t.color}10`,
                  color: t.color,
                  borderColor: `${t.color}30`,
                }}
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 1: "On This Day" (那年今日) */}
      {sameDayPastNotes.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-amber-500/10 border border-amber-500/25 space-y-2 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>那年今日 · 穿越岁月的对话</span>
            </div>
            <span className="font-mono text-[11px] opacity-80">在往年同日共找到 {sameDayPastNotes.length} 篇随笔</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {sameDayPastNotes.map(pn => (
              <div
                key={pn.id}
                onClick={() => onOpenEditor(pn)}
                className="p-3 rounded-xl bg-card border border-border hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between group/pn"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] text-muted font-mono flex items-center gap-1">
                    <span>{pn.date}</span>
                    <span>·</span>
                    <span className="text-amber-400/90 font-medium">[{topicsMap.get(pn.topicId)?.name || '随笔'}]</span>
                  </div>
                  <div className="text-xs font-bold text-main truncate font-serif mt-0.5 group-hover/pn:text-amber-400 transition-colors">
                    {pn.title}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted group-hover/pn:text-amber-400 group-hover/pn:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Stream for this Day */}
      {dayNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dayNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              topic={topicsMap.get(note.topicId)}
              onEdit={onOpenEditor}
              onDelete={onDeleteNote}
              onTogglePin={onTogglePin}
              onOpenShareCard={onOpenShareCard}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-card border border-border/80 border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 opacity-80" />
          </div>

          <h3 className="text-lg font-bold text-main font-serif mb-2">
            这一天还是一张素白宣纸
          </h3>

          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed mb-6 font-sans">
            “生活是琐碎的，唯有记录赋予其形状与光彩。”<br/>
            你可以记录一本好书的顿悟、生活里的一杯咖啡，或脑海中倏忽而过的灵感火花。
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onCreateNewNoteWithTopic('reading')}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>写一篇读书心得</span>
            </button>

            <button
              onClick={() => onCreateNewNoteWithTopic('journal')}
              className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-card-hover text-main text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>记录今日日常</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
