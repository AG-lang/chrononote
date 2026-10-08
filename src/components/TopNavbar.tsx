import React, { useState } from 'react';
import { 
  Calendar, 
  Layers, 
  BarChart3, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Palette, 
  Download,
  BookOpen,
  Search,
  Image as ImageIcon,
  Settings,
  Lock,
  Printer,
  Network,
  Zap,
  Brain,
  Timer
} from 'lucide-react';
import { ViewMode, AppTheme } from '../types';
import { getTodayDateString } from '../utils/dateUtils';

interface TopNavbarProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenNewNote: () => void;
  onExportAll: () => void;
  onOpenSearch: () => void;
  onOpenAiDigest: () => void;
  onOpenMemoir: () => void;
  onOpenSettings: () => void;
  onOpenQuickCapture?: () => void;
  onOpenSRS?: () => void;
  onOpenPomodoro?: () => void;
  isLockEnabled?: boolean;
  onLockScreen?: () => void;
}


export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentYear,
  onYearChange,
  viewMode,
  onViewModeChange,
  selectedDate,
  onSelectDate,
  currentTheme,
  onThemeChange,
  onOpenNewNote,
  onExportAll,
  onOpenSearch,
  onOpenAiDigest,
  onOpenMemoir,
  onOpenSettings,
  onOpenQuickCapture,
  onOpenSRS,
  onOpenPomodoro,
  isLockEnabled,
  onLockScreen,
}) => {
  const today = getTodayDateString();
  const isViewingToday = selectedDate === today && viewMode === 'day';
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const themeOptions: { id: AppTheme; label: string; icon: string; dot: string }[] = [
    { id: 'obsidian', label: '深空墨夜', icon: '🌙', dot: '#8b5cf6' },
    { id: 'paper', label: '暖白纸韵', icon: '📜', dot: '#b45309' },
    { id: 'forest', label: '晨雾青峦', icon: '🌲', dot: '#10b981' },
    { id: 'amber', label: '落日琥珀', icon: '🍂', dot: '#f59e0b' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-panel/90 border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Title (Clean & Minimalist) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#111318] rounded-[10px] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-wide text-main font-sans">
              ChronoNote
            </h1>
            <span className="text-xs text-muted/70 font-medium border-l border-border/80 pl-2 hidden sm:inline">
              时光墨历
            </span>
          </div>
        </div>

        {/* Center: Year Switcher & Primary Nav Tabs */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Year navigator */}
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => onYearChange(currentYear - 1)}
              className="p-1.5 rounded-md hover:bg-card-hover text-muted hover:text-main transition-colors"
              title="前一年"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs sm:text-sm font-semibold text-main tracking-wider font-mono">
              {currentYear}
            </span>
            <button
              onClick={() => onYearChange(currentYear + 1)}
              className="p-1.5 rounded-md hover:bg-card-hover text-muted hover:text-main transition-colors"
              title="后一年"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Return to Today */}
          <button
            onClick={() => {
              const now = new Date();
              onYearChange(now.getFullYear());
              onSelectDate(today);
              onViewModeChange('day');
            }}
            className={`px-2.5 py-1.5 text-xs rounded-lg font-medium border transition-all ${
              isViewingToday
                ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                : 'bg-card text-muted hover:text-main border-border hover:bg-card-hover'
            }`}
          >
            今日
          </button>

          {/* View mode switcher */}
          <nav className="flex items-center bg-card border border-border rounded-lg p-0.5 overflow-x-auto">
            <button
              onClick={() => onViewModeChange('year')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'year'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-card-hover'
              }`}
              title="12个月全景"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden md:inline">12月全景</span>
            </button>

            <button
              onClick={() => onViewModeChange('day')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-card-hover'
              }`}
              title="单日流"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">单日流</span>
            </button>

            <button
              onClick={() => onViewModeChange('topicLens')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'topicLens'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-card-hover'
              }`}
              title="主题透视"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">主题透视</span>
            </button>

            <button
              onClick={() => onViewModeChange('gallery')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-card-hover'
              }`}
              title="画廊漫游模式"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">画廊漫游</span>
            </button>

            <button
              onClick={() => onViewModeChange('graph')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-card-hover'
              }`}
              title="时空星云关系图谱"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">星云图谱</span>
            </button>

            <button
              onClick={() => onViewModeChange('stats')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'stats'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-card-hover'
              }`}
              title="年度印记"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">年度印记</span>
            </button>
          </nav>
        </div>

        {/* Right: Actions, AI, Search, Theme & New Note */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Capture (Alt + 1) */}
          {onOpenQuickCapture && (
            <button
              onClick={onOpenQuickCapture}
              className="p-2 rounded-lg bg-card border border-border text-muted hover:text-amber-400 hover:bg-card-hover transition-colors flex items-center gap-1 text-xs"
              title="全局闪念输入窗 (Alt+1 / 点击开启)"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="hidden 2xl:inline text-[11px] font-medium">闪念</span>
            </button>
          )}

          {/* SRS Spaced Repetition (温故闪卡) */}
          {onOpenSRS && (
            <button
              onClick={onOpenSRS}
              className="p-2 rounded-lg bg-card border border-border text-muted hover:text-violet-400 hover:bg-card-hover transition-colors flex items-center gap-1 text-xs"
              title="今日温故 · 读书闪卡 (SM-2记忆算法)"
            >
              <Brain className="w-4 h-4 text-violet-400" />
              <span className="hidden 2xl:inline text-[11px] font-medium">温故</span>
            </button>
          )}

          {/* Zen Pomodoro Timer */}
          {onOpenPomodoro && (
            <button
              onClick={onOpenPomodoro}
              className="p-2 rounded-lg bg-card border border-border text-muted hover:text-emerald-400 hover:bg-card-hover transition-colors flex items-center gap-1 text-xs"
              title="禅意番茄钟与心流足迹打卡"
            >
              <Timer className="w-4 h-4 text-emerald-400" />
              <span className="hidden 2xl:inline text-[11px] font-medium">专注</span>
            </button>
          )}

          {/* Spotlight Search (Ctrl + K) */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-main hover:bg-card-hover transition-colors flex items-center gap-1 text-xs"
            title="全局搜索 (Ctrl + K)"
          >
            <Search className="w-4 h-4 text-violet-400" />
            <kbd className="hidden xl:inline text-[10px] text-muted/60 font-mono">Ctrl+K</kbd>
          </button>

          {/* AI Digest Trigger */}
          <button
            onClick={onOpenAiDigest}
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-violet-400 hover:bg-card-hover transition-colors"
            title="AI 思考小结与复盘提炼"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>

          {/* Memoir Book Print */}
          <button
            onClick={onOpenMemoir}
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-main hover:bg-card-hover transition-colors hidden sm:flex items-center"
            title="年度文集回忆录排版导出"
          >
            <Printer className="w-4 h-4" />
          </button>


          {/* Theme switcher */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="p-2 rounded-lg bg-card border border-border text-muted hover:text-main transition-colors flex items-center gap-1.5 text-xs shadow-xs"
              title="切换视觉主题"
            >
              <Palette className="w-4 h-4" />
            </button>

            {isThemeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-40 py-1.5 bg-panel border border-border rounded-xl shadow-2xl z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[11px] font-medium text-muted border-b border-border/50">
                    界面美学质感
                  </div>
                  {themeOptions.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onThemeChange(t.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-card-hover transition-colors ${
                        currentTheme === t.id ? 'text-violet-400 font-semibold bg-card' : 'text-main'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-xs"
                        style={{ backgroundColor: t.dot }}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Settings modal button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-main transition-colors"
            title="偏好设置 (本地存储文件夹/密码锁/音效)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick Lock button (if lock enabled) */}
          {isLockEnabled && onLockScreen && (
            <button
              onClick={onLockScreen}
              className="p-2 rounded-lg bg-card border border-border text-muted hover:text-rose-400 transition-colors"
              title="立即锁定私密空间"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Backup/Export all */}
          <button
            onClick={onExportAll}
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-main transition-colors hidden md:flex items-center"
            title="备份导出全部笔记 (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* New note button */}
          <button
            onClick={onOpenNewNote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-violet-600/20 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">记录随笔</span>
          </button>
        </div>
      </div>
    </header>
  );
};
