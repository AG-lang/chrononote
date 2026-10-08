import React, { useState, useEffect, useRef } from 'react';
import { Topic, NoteEntry } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { playTypewriterSound, playSuccessChime } from '../utils/audio';
import { Zap, X, CornerDownLeft, Maximize2, Tag, Smile } from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  onSaveQuickNote: (note: NoteEntry, openInEditor?: boolean) => void;
}

const MOOD_OPTIONS = [
  { emoji: '💡', label: '灵感火花' },
  { emoji: '☕', label: '从容平和' },
  { emoji: '🔥', label: '专注激情' },
  { emoji: '🌿', label: '自然舒缓' },
  { emoji: '🌧️', label: '沉思内省' },
];

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  topics,
  onSaveQuickNote,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || 'thought');
  const [selectedMood, setSelectedMood] = useState('💡');
  const [tagsInput, setTagsInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setTagsInput('');
      setSelectedMood('💡');
      if (topics.length > 0) {
        // Prefer thought/reading/work or first
        const pref = topics.find(t => t.id === 'thought') || topics[0];
        setSelectedTopicId(pref.id);
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 80);
    }
  }, [isOpen, topics]);

  if (!isOpen) return null;

  const handleSave = (openInEditor = false) => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent) {
      return;
    }

    const todayStr = getTodayDateString();
    const finalTitle = trimmedTitle || (trimmedContent.length > 25 ? `${trimmedContent.substring(0, 25)}...` : trimmedContent) || '随手闪念';
    const finalContent = trimmedContent 
      ? (trimmedTitle ? `# ${trimmedTitle}\n\n> 💡 闪念记录于 ${todayStr}\n\n${trimmedContent}` : trimmedContent)
      : `# ${finalTitle}\n\n> 💡 记录于 ${todayStr}`;

    const tags = tagsInput
      .split(/[,，\s]+/)
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const topicObj = topics.find(t => t.id === selectedTopicId);
    if (topicObj && !tags.includes(topicObj.name)) {
      tags.unshift(topicObj.name);
    }

    const newNote: NoteEntry = {
      id: `quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: todayStr,
      topicId: selectedTopicId,
      title: finalTitle,
      content: finalContent,
      tags: tags.length ? tags : ['闪念'],
      mood: selectedMood,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    playSuccessChime();
    onSaveQuickNote(newNote, openInEditor);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Floating HUD Card */}
      <div 
        className="relative w-full max-w-xl bg-panel/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-5 z-10 transition-all animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-main flex items-center gap-2">
                全局闪念捕捉 (Quick Capture HUD)
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border text-muted">
                  Alt+1
                </span>
              </h3>
              <p className="text-[11px] text-muted">将稍纵即逝的思维火花即时沉淀至今日时间线</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-main hover:bg-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-3 pt-3">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              playTypewriterSound(false);
            }}
            placeholder="闪念标题 (可选，如留空将自动提取首句)..."
            className="w-full px-3 py-2 text-sm bg-card/60 border border-border/70 rounded-xl text-main placeholder-muted/60 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
          />

          {/* Quick Content Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              playTypewriterSound(false);
            }}
            placeholder="此刻脑海中的所思所想、书摘短评、代码架构灵感... (支持 Markdown)"
            rows={4}
            className="w-full px-3 py-2.5 text-sm bg-card/60 border border-border/70 rounded-xl text-main placeholder-muted/60 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors resize-none leading-relaxed"
          />

          {/* Topics Row */}
          <div>
            <label className="text-[11px] text-muted block mb-1.5 font-medium">归属主题</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {topics.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    selectedTopicId === t.id
                      ? 'bg-violet-600/20 text-main border-violet-500 shadow-xs ring-1 ring-violet-500/40'
                      : 'bg-card/40 text-muted border-border/60 hover:text-main hover:bg-card'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood & Tags Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
            {/* Mood selector */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted flex items-center gap-1 mr-1">
                <Smile className="w-3.5 h-3.5" /> 心境:
              </span>
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setSelectedMood(m.emoji)}
                  title={m.label}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                    selectedMood === m.emoji
                      ? 'bg-violet-500/20 border border-violet-500/40 scale-110 shadow-xs'
                      : 'hover:bg-card border border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>

            {/* Tags Input */}
            <div className="flex items-center gap-1.5 flex-1 max-w-[210px]">
              <Tag className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="标签 (空格分隔)"
                className="w-full px-2 py-1 text-xs bg-card/60 border border-border/60 rounded-lg text-main placeholder-muted/50 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/60">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono">Ctrl+Enter</kbd>
              <span>快速归档</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono">Esc</kbd>
              <span>取消</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-3 py-1.5 rounded-xl border border-border text-muted hover:text-main hover:bg-card text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="存入今日并进入双栏Markdown深度写作"
            >
              <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
              <span>深度编辑</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={!title.trim() && !content.trim()}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-violet-600/20 active:scale-95 transition-all"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>收纳存盘</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
