import React, { useState, useEffect, useRef } from 'react';
import { Topic, NoteEntry } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';
import { playZenBellSound, playSuccessChime, setAmbientSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Minimize2, 
  Maximize2, 
  X, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Flame, 
  CheckCircle2, 
  Sparkles,
  PenTool
} from 'lucide-react';

interface ZenPomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  notes: NoteEntry[];
  onLogFocusSession: (entry: NoteEntry) => void;
}

type ModeType = 'work' | 'shortBreak' | 'longBreak';

const PRESET_MODES: Record<ModeType, { name: string; minutes: number; label: string }> = {
  work: { name: '深度心流', minutes: 25, label: '专注投入' },
  shortBreak: { name: '灵感漫步', minutes: 5, label: '小憩片刻' },
  longBreak: { name: '长休蓄能', minutes: 15, label: '深度休整' },
};

export const ZenPomodoroModal: React.FC<ZenPomodoroModalProps> = ({
  isOpen,
  onClose,
  topics,
  notes,
  onLogFocusSession,
}) => {
  const [mode, setMode] = useState<ModeType>('work');
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Focus Task Details
  const [taskTitle, setTaskTitle] = useState<string>('深度心流与思考');
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    topics.find(t => t.id === 'work' || t.id === 'reading')?.id || topics[0]?.id || 'work'
  );

  // Ambient sound
  const [activeSound, setActiveSound] = useState<'none' | 'rain' | 'fire'>('none');

  // Completed session dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState<boolean>(false);
  const startTimeRef = useRef<Date | null>(null);

  const totalTime = customMinutes * 60;
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // Custom duration setter
  const handleSetCustomMinutes = (mins: number) => {
    const clamped = Math.max(1, Math.min(180, mins));
    setCustomMinutes(clamped);
    setIsRunning(false);
    setTimeLeft(clamped * 60);
    startTimeRef.current = null;
  };

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Completed!
      setIsRunning(false);
      playZenBellSound();
      setShowCompletionDialog(true);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Handle ambient sound change
  const handleToggleAmbient = (sound: 'none' | 'rain' | 'fire') => {
    const next = activeSound === sound ? 'none' : sound;
    setActiveSound(next);
    setAmbientSound(next);
  };

  const handleStartPause = () => {
    if (!isRunning && !startTimeRef.current) {
      startTimeRef.current = new Date();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(customMinutes * 60);
    startTimeRef.current = null;
  };

  const handleSwitchMode = (newMode: ModeType) => {
    setIsRunning(false);
    setMode(newMode);
    const mins = PRESET_MODES[newMode].minutes;
    setCustomMinutes(mins);
    setTimeLeft(mins * 60);
    startTimeRef.current = null;
  };

  // Log focus footprint to today's note
  const handleConfirmLog = () => {
    const todayStr = getTodayDateString();
    const now = new Date();
    const durationMin = customMinutes;
    const timeFormatted = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // Look for existing note for today with selected topic
    const existing = notes.find(n => n.date === todayStr && n.topicId === selectedTopicId);
    const logMarkdown = `\n\n> ⏱️ **${timeFormatted} 心流足迹** (${durationMin}分钟) · ${taskTitle || '深度专注'}\n> ${taskNotes ? `心流回顾: ${taskNotes}` : '状态饱满，深度沉浸完成既定目标。'}`;

    if (existing) {
      const updated: NoteEntry = {
        ...existing,
        content: existing.content + logMarkdown,
        updatedAt: new Date().toISOString(),
      };
      onLogFocusSession(updated);
    } else {
      const topicObj = topics.find(t => t.id === selectedTopicId);
      const newEntry: NoteEntry = {
        id: `focus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: todayStr,
        topicId: selectedTopicId,
        title: `${topicObj?.name || '深度工作'}心流手记`,
        content: `# 今日心流足迹\n\n> 记录于 ${todayStr}${logMarkdown}`,
        tags: [topicObj?.name || '深度工作', '番茄钟', '心流'],
        mood: '🔥',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onLogFocusSession(newEntry);
    }

    playSuccessChime();
    setShowCompletionDialog(false);
    handleReset();
    if (mode === 'work') {
      handleSwitchMode('shortBreak');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Minimized Floating Pill Mode
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-panel/95 backdrop-blur-xl border border-violet-500/40 rounded-full shadow-2xl p-2 pl-4 flex items-center gap-3 animate-scale-up">
        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
        <div className="font-mono text-sm font-bold text-main">
          {formatTime(timeLeft)}
        </div>
        <div className="text-[11px] text-muted max-w-[120px] truncate hidden sm:block">
          {taskTitle}
        </div>
        <button
          onClick={handleStartPause}
          className="p-1.5 rounded-full bg-card hover:bg-card-hover text-main transition-colors"
          title={isRunning ? '暂停' : '继续'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded-full bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors"
          title="展开面板"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Circular Progress SVG params
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-lg bg-panel border border-border rounded-3xl shadow-2xl p-6 sm:p-8 z-10 animate-scale-up flex flex-col items-center">
        {/* Top Actions */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-main">禅意番茄钟 · 心流足迹</h2>
              <p className="text-[11px] text-muted">沉浸专注心流，让每段时光都有迹可循</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-card transition-colors"
              title="最小化为桌面悬浮药丸"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-card transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-card border border-border p-1 rounded-xl mt-5 mb-2 gap-1 shadow-xs">
          {(Object.keys(PRESET_MODES) as ModeType[]).map(mKey => (
            <button
              key={mKey}
              onClick={() => handleSwitchMode(mKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === mKey
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-panel'
              }`}
            >
              {PRESET_MODES[mKey].name}
            </button>
          ))}
        </div>

        {/* Custom Duration Stepper & Quick Chips */}
        <div className="flex items-center gap-1.5 mb-3 bg-card/60 p-1.5 rounded-xl border border-border/60 text-xs">
          <button
            type="button"
            onClick={() => handleSetCustomMinutes(customMinutes - 5)}
            className="px-2 py-0.5 rounded-md text-muted hover:text-main hover:bg-card border border-border/40 font-mono text-[11px]"
            title="减少 5 分钟"
          >
            -5m
          </button>

          <div className="flex items-center gap-0.5 px-2 font-mono text-main font-semibold text-xs">
            <span>{customMinutes}</span>
            <span className="text-[10px] text-muted font-normal">分</span>
          </div>

          <button
            type="button"
            onClick={() => handleSetCustomMinutes(customMinutes + 5)}
            className="px-2 py-0.5 rounded-md text-muted hover:text-main hover:bg-card border border-border/40 font-mono text-[11px]"
            title="增加 5 分钟"
          >
            +5m
          </button>

          <div className="h-3 w-px bg-border/60 mx-1" />

          {[15, 25, 45, 60, 90].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => handleSetCustomMinutes(m)}
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                customMinutes === m
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-card'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Circular SVG Ring & Time Display */}
        <div className="relative w-64 h-64 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
            {/* Background Circle */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              className="text-card stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="url(#pomodoroGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-linear"
            />
            <defs>
              <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Countdown Text */}
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-main tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-muted mt-1.5 font-medium flex items-center gap-1">
              {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              {PRESET_MODES[mode].label}
            </span>
          </div>
        </div>

        {/* Task Focus Input */}
        <div className="w-full max-w-sm mt-3 mb-5">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="正在专注的目标事项..."
            className="w-full px-3.5 py-2 text-xs bg-card border border-border rounded-xl text-center text-main placeholder-muted/60 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Controls: Play/Pause, Reset, Ambient Sound */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 rounded-full bg-card hover:bg-card-hover border border-border text-muted hover:text-main transition-colors shadow-xs"
            title="重置计时"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleStartPause}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-violet-600/30 active:scale-95 transition-all flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>暂歇心流</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>开启专注</span>
              </>
            )}
          </button>

          {/* Procedural White Noise Toggle */}
          <div className="flex items-center bg-card border border-border rounded-full p-1 shadow-xs">
            <button
              onClick={() => handleToggleAmbient('rain')}
              className={`p-2 rounded-full transition-colors ${
                activeSound === 'rain' ? 'bg-violet-600 text-white' : 'text-muted hover:text-main'
              }`}
              title="雨声助眠与白噪音"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleToggleAmbient('fire')}
              className={`p-2 rounded-full transition-colors ${
                activeSound === 'fire' ? 'bg-amber-600 text-white' : 'text-muted hover:text-main'
              }`}
              title="炉火柴音壁炉"
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
            {activeSound !== 'none' && (
              <button
                onClick={() => handleToggleAmbient('none')}
                className="p-2 rounded-full text-muted hover:text-main"
                title="静音"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Prompt */}
        <div className="mt-6 pt-3 border-t border-border/40 w-full text-center">
          <button
            onClick={() => setShowCompletionDialog(true)}
            className="text-[11px] text-muted hover:text-violet-400 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <PenTool className="w-3 h-3" />
            <span>手动将当前专注足迹打卡记录至今日</span>
          </button>
        </div>

        {/* Completion & Logging Dialog Modal */}
        {showCompletionDialog && (
          <div className="absolute inset-0 bg-panel/98 backdrop-blur-xl rounded-3xl p-6 sm:p-8 z-30 flex flex-col justify-between animate-fade-in border border-violet-500/40 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-main">
                    心流达成！沉淀专注足迹
                  </h3>
                  <p className="text-xs text-muted">
                    本次已完成 {PRESET_MODES[mode].minutes} 分钟深度专注
                  </p>
                </div>
              </div>

              {/* Task reflection input */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-muted block mb-1">事项主题</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-card border border-border rounded-xl text-main"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">心流简记 / 灵感收获 (可选)</label>
                  <textarea
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder="简要记下一两句刚才专注思考的突破口或关键结论..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-card border border-border rounded-xl text-main resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">归属今日笔记主题</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-card border border-border rounded-xl text-main"
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowCompletionDialog(false);
                  handleReset();
                }}
                className="px-4 py-2 rounded-xl text-xs text-muted hover:text-main hover:bg-card transition-colors"
              >
                暂不打卡
              </button>
              <button
                onClick={handleConfirmLog}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md shadow-violet-600/30 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>存入今日随笔时间线</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
