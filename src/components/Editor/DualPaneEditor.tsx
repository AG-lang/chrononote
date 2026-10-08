import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NoteEntry, Topic, EditorMode, AiSettings } from '../../types';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownShortcutsModal } from './MarkdownShortcutsModal';
import { ShareCardModal } from './ShareCardModal';
import { AiFormatOptimizerModal } from './AiFormatOptimizerModal';
import { renderMarkdown, calculateStats, insertMarkdownSyntax, fileToBase64 } from '../../utils/markdown';
import { exportNoteToMarkdown, downloadFile } from '../../utils/storage';
import { playTypewriterSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Save,
  Columns,
  Maximize2,
  Eye,
  Share2,
  Download,
  Star,
  Check,
  Tag as TagIcon,
  Smile,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';

interface DualPaneEditorProps {
  note: NoteEntry;
  topics: Topic[];
  onSave: (updatedNote: NoteEntry) => void;
  onBack: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onNavigateToWiki?: (target: string) => void;
  aiSettings?: AiSettings;
}

export const DualPaneEditor: React.FC<DualPaneEditorProps> = ({
  note: initialNote,
  topics,
  onSave,
  onBack,
  soundEnabled = false,
  onToggleSound,
  onNavigateToWiki,
  aiSettings,
}) => {
  const [note, setNote] = useState<NoteEntry>(initialNote);
  const [editorMode, setEditorMode] = useState<EditorMode>('dual');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [isAiOptimizerOpen, setIsAiOptimizerOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  // Synchronized scrolling logic
  const handleEditorScroll = () => {
    if (isSyncingScroll.current || !textareaRef.current || !previewRef.current) return;
    isSyncingScroll.current = true;
    const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
    const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
    previewRef.current.scrollTop = scrollRatio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  const handlePreviewScroll = () => {
    if (isSyncingScroll.current || !textareaRef.current || !previewRef.current) return;
    isSyncingScroll.current = true;
    const { scrollTop, scrollHeight, clientHeight } = previewRef.current;
    const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
    textareaRef.current.scrollTop = scrollRatio * (textareaRef.current.scrollHeight - textareaRef.current.clientHeight);
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      onSave({
        ...note,
        updatedAt: new Date().toISOString(),
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [note, onSave]);

  // Trigger manual save with toast & confetti
  const handleManualSave = useCallback(() => {
    const updated = {
      ...note,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setSaveSuccess(true);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#8b5cf6', '#10b981', '#f59e0b']
    });
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [note, onSave]);

  // Insert markdown syntax helper
  const handleInsertSyntax = (syntax: string) => {
    if (!textareaRef.current) return;
    const { newContent, newCursor } = insertMarkdownSyntax(textareaRef.current, syntax);
    setNote(prev => ({ ...prev, content: newContent }));
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 10);
  };

  // Handle paste for direct image import (Ctrl + V)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const base64 = await fileToBase64(file);
          const textarea = textareaRef.current;
          if (!textarea) return;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          const replacement = `\n![粘贴图片](${base64})\n`;
          const newContent = text.substring(0, start) + replacement + text.substring(end);
          setNote(prev => ({ ...prev, content: newContent }));
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(start + replacement.length, start + replacement.length);
            }
          }, 0);
          return;
        }
      }
    }
  };

  // Handle Wiki-link clicks in preview
  const handlePreviewClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.getAttribute('href')?.startsWith('#wiki:')) {
      e.preventDefault();
      const raw = decodeURIComponent(anchor.getAttribute('href')!.replace('#wiki:', ''));
      onNavigateToWiki?.(raw);
    }
  };

  // Keyboard shortcuts handler inside the editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (soundEnabled) {
      playTypewriterSound(e.key === 'Enter');
    }
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    if (isCtrlOrMeta) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleInsertSyntax('bold');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleInsertSyntax('italic');
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleInsertSyntax('link');
      } else if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        handleInsertSyntax('quote');
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleInsertSyntax('code');
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleInsertSyntax('task');
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleInsertSyntax('bullet');
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleInsertSyntax('number');
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setEditorMode(prev => prev === 'dual' ? 'edit-only' : prev === 'edit-only' ? 'preview-only' : 'dual');
      } else if (e.key === '1') {
        e.preventDefault();
        handleInsertSyntax('h1');
      } else if (e.key === '2') {
        e.preventDefault();
        handleInsertSyntax('h2');
      } else if (e.key === '3') {
        e.preventDefault();
        handleInsertSyntax('h3');
      } else if (e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleInsertSyntax('code');
      } else if (e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleInsertSyntax('strikethrough');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!textareaRef.current) return;
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = textareaRef.current.value;
      const newContent = text.substring(0, start) + '  ' + text.substring(end);
      setNote(prev => ({ ...prev, content: newContent }));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + 2, start + 2);
        }
      }, 0);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = exportNoteToMarkdown(note, topics.find(t => t.id === note.topicId)?.name);
    downloadFile(`${note.date}_${note.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.md`, md);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().replace(/^#/, '');
    if (!note.tags.includes(cleanTag)) {
      setNote(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
    }
    setNewTagInput('');
    setTagInputOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNote(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const activeTopic = topics.find(t => t.id === note.topicId) || topics[0];
  const stats = calculateStats(note.content);
  const htmlOutput = renderMarkdown(note.content);

  const moodList = ['💡', '☕', '🌿', '✨', '🔥', '🎯', '🌧️', '💭'];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-panel border-x border-border max-w-7xl mx-auto shadow-2xl overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="px-5 py-3 border-b border-border bg-panel flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back + Topic Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-card border border-border hover:bg-card-hover text-muted hover:text-main transition-colors flex items-center gap-1 text-xs"
            title="返回日程流"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </button>

          {/* Custom Topic Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTopicMenuOpen(!isTopicMenuOpen)}
              className="bg-card hover:bg-card-hover text-main border border-border rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span
                className="w-2 h-2 rounded-full shadow-xs"
                style={{ backgroundColor: activeTopic.color }}
              />
              <span>{activeTopic.name}</span>
              <ChevronDown className="w-3 h-3 text-muted" />
            </button>

            {isTopicMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTopicMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-40 py-1.5 bg-panel border border-border rounded-xl shadow-2xl z-50 animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] text-muted font-medium border-b border-border/50">
                    选择归属主题
                  </div>
                  {topics.map(t => {
                    const isSelected = t.id === note.topicId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setNote(prev => ({ ...prev, topicId: t.id }));
                          setIsTopicMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between hover:bg-card-hover transition-colors ${
                          isSelected ? 'text-violet-400 font-semibold bg-card' : 'text-main'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          <span>{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Mood Selector */}
          <div className="flex items-center gap-1">
            <div className="relative group">
              <button
                className="px-2 py-1 rounded-lg bg-card border border-border text-xs flex items-center gap-1 hover:bg-card-hover"
                title="选择心境表情"
              >
                <span>{note.mood || '☕'}</span>
              </button>
              <div className="absolute left-0 top-full mt-1.5 p-2 bg-panel border border-border rounded-xl shadow-xl hidden group-hover:flex gap-1 z-50">
                {moodList.map(m => (
                  <button
                    key={m}
                    onClick={() => setNote(prev => ({ ...prev, mood: m }))}
                    className="p-1.5 hover:bg-card-hover rounded text-sm transition-transform hover:scale-125"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Stars */}
            <div className="hidden md:flex items-center gap-0.5 text-xs text-muted ml-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setNote(prev => ({ ...prev, rating: prev.rating === star ? undefined : star }))}
                  className="p-0.5 hover:text-amber-400"
                  title={`${star} 星评级`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      (note.rating || 0) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Dual Pane Mode Toggler & Sound */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
            <button
              onClick={() => setEditorMode('dual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                editorMode === 'dual'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
              title="双栏实时对照 (Ctrl+P)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">双栏对照</span>
            </button>
            <button
              onClick={() => setEditorMode('edit-only')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                editorMode === 'edit-only'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
              title="纯净编辑模式"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">仅编辑</span>
            </button>
            <button
              onClick={() => setEditorMode('preview-only')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                editorMode === 'preview-only'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
              title="沉浸阅读模式"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">仅预览</span>
            </button>
          </div>

          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-violet-600/20 text-violet-400 border-violet-500/30'
                  : 'bg-card text-muted hover:text-main border-border'
              }`}
              title={soundEnabled ? '音效已开启：点击关闭机械打字声' : '音效已关闭：点击开启机械打字声'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* AI Markdown Layout & Formatting Optimizer Button */}
          <button
            type="button"
            onClick={() => setIsAiOptimizerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-violet-600/15 hover:from-violet-600/25 hover:to-indigo-600/25 border border-violet-500/30 text-violet-400 hover:text-violet-300 text-xs font-medium transition-all shadow-xs"
            title="AI Markdown 格式与排版布局审美优化顾问"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">AI 排版优化</span>
          </button>

          <button
            onClick={() => setShowShareCard(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-muted hover:text-violet-400 hover:bg-card-hover text-xs transition-colors"
            title="生成小红书/拍立得分享长图"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">时光卡片</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="p-1.5 rounded-lg bg-card border border-border text-muted hover:text-emerald-400 hover:bg-card-hover text-xs transition-colors"
            title="导出为本地 .md 格式文件"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleManualSave}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-violet-600 hover:bg-violet-500 text-white active:scale-95'
            }`}
            title="手动保存 (Ctrl+S)"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveSuccess ? '已存盘' : '保存'}</span>
          </button>
        </div>
      </div>

      {/* 2. Metadata Bar: Title & Tags */}
      <div className="px-6 py-3 border-b border-border/70 bg-card/40 flex flex-col gap-2">
        <input
          type="text"
          value={note.title}
          onChange={(e) => setNote(prev => ({ ...prev, title: e.target.value }))}
          placeholder="给这篇随笔一个优雅的标题..."
          className="w-full bg-transparent text-lg sm:text-xl font-bold font-serif text-main focus:outline-none placeholder:text-muted/40 tracking-tight"
        />

        {/* Tags */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-muted text-[11px]"
            >
              <TagIcon className="w-2.5 h-2.5 text-muted/70" />
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-400 ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {tagInputOpen ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入标签按回车..."
                className="px-2 py-0.5 rounded bg-panel border border-violet-500/50 text-[11px] text-main focus:outline-none w-28"
                autoFocus
              />
              <button onClick={handleAddTag} className="text-violet-400 hover:text-violet-300 text-xs">✓</button>
              <button onClick={() => setTagInputOpen(false)} className="text-muted text-xs">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setTagInputOpen(true)}
              className="px-2 py-0.5 rounded-md border border-dashed border-border text-muted/70 hover:text-main hover:border-violet-500/50 text-[11px] transition-colors"
            >
              + 标签
            </button>
          )}
        </div>
      </div>

      {/* 3. Markdown Formatting Toolbar */}
      {editorMode !== 'preview-only' && (
        <MarkdownToolbar
          onInsertSyntax={handleInsertSyntax}
          onOpenShortcuts={() => setShowShortcuts(true)}
        />
      )}

      {/* 4. Core Dual Pane Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Code / Source Editor */}
        {(editorMode === 'dual' || editorMode === 'edit-only') && (
          <div
            className={`flex-1 flex flex-col bg-panel border-r border-border transition-all ${
              editorMode === 'edit-only' ? 'max-w-4xl mx-auto border-r-0' : ''
            }`}
          >
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={(e) => setNote(prev => ({ ...prev, content: e.target.value }))}
              onScroll={handleEditorScroll}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="在这里开始书写... 支持纯正 Markdown 语法与快捷键 (截图直接 Ctrl+V 粘贴)"
              className="w-full h-full p-6 bg-transparent text-main font-mono text-sm leading-relaxed resize-none focus:outline-none selection:bg-violet-500/30 overflow-y-auto"
              spellCheck={false}
            />
          </div>
        )}

        {/* Right Pane: Live Typography Preview */}
        {(editorMode === 'dual' || editorMode === 'preview-only') && (
          <div
            ref={previewRef}
            onScroll={handlePreviewScroll}
            onClick={handlePreviewClick}
            className={`flex-1 bg-panel p-6 sm:p-8 overflow-y-auto ${
              editorMode === 'preview-only' ? 'max-w-3xl mx-auto' : ''
            }`}
          >
            <div
              className="markdown-body max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          </div>
        )}
      </div>

      {/* 5. Footer Stats Bar */}
      <div className="px-5 py-2 border-t border-border bg-panel flex items-center justify-between text-[11px] text-muted font-mono">
        <div className="flex items-center gap-3">
          <span>{stats.words} 汉字/词</span>
          <span>·</span>
          <span>{stats.chars} 字符</span>
          <span>·</span>
          <span>预计阅读 {stats.readTimeMin} 分钟</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-muted/60">
            快捷键: Ctrl+B 粗体 · Ctrl+I 斜体 · Ctrl+S 保存 · Ctrl+P 切换模式
          </span>
          <span className="text-violet-400 font-sans font-medium">实时已同步</span>
        </div>
      </div>

      {/* Modals */}
      <MarkdownShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <ShareCardModal
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        note={note}
        topic={activeTopic}
      />

      <AiFormatOptimizerModal
        isOpen={isAiOptimizerOpen}
        onClose={() => setIsAiOptimizerOpen(false)}
        noteTitle={note.title}
        noteContent={note.content}
        aiSettings={aiSettings || { provider: 'ollama', baseUrl: 'http://localhost:11434', model: '' }}
        onApplyOptimization={(optimized) => {
          setNote(prev => ({ ...prev, content: optimized }));
          onSave({ ...note, content: optimized, updatedAt: new Date().toISOString() });
        }}
      />
    </div>
  );
};
