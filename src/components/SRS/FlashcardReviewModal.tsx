import React, { useState, useEffect, useMemo } from 'react';
import { NoteEntry, Topic, FlashcardItem } from '../../types';
import { playFlipCardSound, playSuccessChime, playTypewriterSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Brain, 
  X, 
  RotateCw, 
  CheckCircle2, 
  BookOpen, 
  Flame, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface FlashcardReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteEntry[];
  topics: Topic[];
  onOpenNoteInEditor: (note: NoteEntry) => void;
}

const STORAGE_KEY = 'chrononote_srs_cards_v1';

/**
 * SuperMemo SM-2 Interval Calculation
 */
function calculateSM2(quality: number, n: number, EF: number, I: number) {
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEF = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newN = n;

  if (quality < 3) {
    // Failed recall: reset
    newN = 0;
    newInterval = 1;
  } else {
    // Successful recall
    if (newN === 0) {
      newInterval = 1;
    } else if (newN === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(I * newEF);
    }
    newN = newN + 1;
  }

  return { interval: newInterval, EF: newEF, repetition: newN };
}

export const FlashcardReviewModal: React.FC<FlashcardReviewModalProps> = ({
  isOpen,
  onClose,
  notes,
  topics,
  onOpenNoteInEditor,
}) => {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Extract / Load Cards
  useEffect(() => {
    if (!isOpen) return;

    // Load persisted card review states
    let savedState: Record<string, Partial<FlashcardItem>> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedState = JSON.parse(raw);
    } catch {}

    const extracted: FlashcardItem[] = [];

    // Scan notes for quotes, QA patterns, or reading notes
    notes.forEach(note => {
      const topicObj = topics.find(t => t.id === note.topicId);
      const isReading = note.topicId === 'reading' || note.tags.some(t => t.includes('书') || t.includes('阅读'));
      
      // 1. Check for blockquotes: > "quote"
      const quoteMatches = note.content.match(/>\s*([^\n]+)/g);
      if (quoteMatches && quoteMatches.length > 0) {
        quoteMatches.slice(0, 2).forEach((quoteLine, qIdx) => {
          const cleanQuote = quoteLine.replace(/^>\s*/, '').replace(/[*_`]/g, '').trim();
          if (cleanQuote.length > 10) {
            const cardId = `card_quote_${note.id}_${qIdx}`;
            const state = savedState[cardId] || {};
            extracted.push({
              id: cardId,
              noteId: note.id,
              noteTitle: note.title,
              date: note.date,
              topicId: note.topicId,
              question: `“${cleanQuote}”`,
              answer: `【原著思考与反思】\n${note.title}\n\n${note.content.replace(quoteLine, '').replace(/[#*`>~-]/g, '').trim().substring(0, 150)}...`,
              type: 'quote',
              interval: state.interval || 1,
              repetitions: state.repetitions || 0,
              easeFactor: state.easeFactor || 2.5,
              nextReviewDate: state.nextReviewDate || note.date,
              lastReviewedAt: state.lastReviewedAt,
            });
          }
        });
      }

      // 2. Check for explicit Q: ... A: ... pattern
      const qaMatch = note.content.match(/(?:Q|问)[:：]([\s\S]*?)(?:A|答)[:：]([\s\S]*?)(?=(?:Q|问)|$)/i);
      if (qaMatch) {
        const q = qaMatch[1]?.trim();
        const a = qaMatch[2]?.trim();
        if (q && a) {
          const cardId = `card_qa_${note.id}`;
          const state = savedState[cardId] || {};
          extracted.push({
            id: cardId,
            noteId: note.id,
            noteTitle: note.title,
            date: note.date,
            topicId: note.topicId,
            question: q,
            answer: a,
            type: 'qa',
            interval: state.interval || 1,
            repetitions: state.repetitions || 0,
            easeFactor: state.easeFactor || 2.5,
            nextReviewDate: state.nextReviewDate || note.date,
            lastReviewedAt: state.lastReviewedAt,
          });
        }
      }

      // 3. Concept / Takeaway card for reading notes or pinned notes
      if (isReading || note.pinned) {
        const cardId = `card_concept_${note.id}`;
        if (!extracted.some(c => c.id === cardId)) {
          const state = savedState[cardId] || {};
          const lines = note.content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
          const excerpt = lines.slice(0, 4).join('\n').replace(/[#*`>~-]/g, '').trim();

          extracted.push({
            id: cardId,
            noteId: note.id,
            noteTitle: note.title,
            date: note.date,
            topicId: note.topicId,
            question: `核心概念探索：\n《${note.title}》的核心洞见是什么？`,
            answer: excerpt || note.title,
            type: 'concept',
            interval: state.interval || 1,
            repetitions: state.repetitions || 0,
            easeFactor: state.easeFactor || 2.5,
            nextReviewDate: state.nextReviewDate || note.date,
            lastReviewedAt: state.lastReviewedAt,
          });
        }
      }
    });

    // Shuffle cards for fresh review sequence
    const shuffled = [...extracted].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setIsCompleted(false);
  }, [isOpen, notes, topics]);

  // Flip card handler
  const handleFlip = () => {
    playFlipCardSound();
    setIsFlipped(prev => !prev);
  };

  // Grade review rating
  const handleRate = (quality: number) => {
    if (!currentCard) return;

    playTypewriterSound(true);

    const { interval, EF, repetition } = calculateSM2(
      quality,
      currentCard.repetitions,
      currentCard.easeFactor,
      currentCard.interval
    );

    // Persist new state
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};
      state[currentCard.id] = {
        interval,
        repetitions: repetition,
        easeFactor: EF,
        lastReviewedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}

    setReviewedCount(prev => prev + 1);

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      playSuccessChime();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  // Global keydown (Space to flip, 1-3 to rate, Esc to close)
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(3);
        if (e.key === '3') handleRate(5);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isFlipped, isCompleted, currentIndex, cards]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const topicObj = currentCard ? topics.find(t => t.id === currentCard.topicId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl bg-panel border border-border rounded-2xl shadow-2xl p-6 z-10 animate-scale-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-main flex items-center gap-2">
                <span>今日温故 · 间隔记忆闪卡</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  SM-2 记忆算法
                </span>
              </h2>
              <p className="text-xs text-muted">温故而知新，沉淀书摘与核心心智模型</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cards.length > 0 && !isCompleted && (
              <span className="text-xs font-mono text-muted bg-card px-2.5 py-1 rounded-lg border border-border">
                {currentIndex + 1} / {cards.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-card transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {cards.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-muted/40 mx-auto" />
            <h3 className="text-base font-semibold text-main">暂无待温故的书摘与闪卡</h3>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              在日常随笔中使用引用语法（如 <code>&gt; 引用格言</code>）或在【读书思考】主题下撰写感悟，系统将自动提炼智能闪卡。
            </p>
          </div>
        ) : isCompleted ? (
          /* Completion Screen */
          <div className="py-12 text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-main">
              今日温故已达成！
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              您已完成了本次全部 {reviewedCount} 张闪卡的记忆复盘。根据人类遗忘曲线规律，系统将在最佳记忆临界点再次安排温故。
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-600/30 transition-all"
              >
                完成温故
              </button>
            </div>
          </div>
        ) : (
          /* Flip Card View */
          <div className="py-5 flex flex-col items-center">
            {/* 3D Flip Card Container */}
            <div
              onClick={handleFlip}
              className="w-full min-h-[260px] cursor-pointer rounded-2xl p-6 border transition-all duration-300 relative select-none flex flex-col justify-between group shadow-lg bg-card hover:border-violet-500/50"
              style={{
                borderColor: isFlipped ? (topicObj?.color || '#a855f7') + '80' : undefined,
              }}
            >
              {/* Card Top Pill */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: topicObj?.color || '#8b5cf6' }}
                  />
                  <span className="font-semibold text-main">
                    {topicObj?.name || '读书'}
                  </span>
                  <span className="text-muted/60">·</span>
                  <span className="text-muted font-mono">{currentCard.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted group-hover:text-violet-400 transition-colors text-[11px]">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? '反思解析 (正面)' : '点击翻面'}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="py-6 my-auto text-center px-4">
                {!isFlipped ? (
                  /* Front: Question / Quote */
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-base sm:text-lg font-serif font-medium text-main leading-relaxed tracking-wide">
                      {currentCard.question}
                    </p>
                    <p className="text-[11px] text-muted font-mono">
                      — 来自《{currentCard.noteTitle}》
                    </p>
                  </div>
                ) : (
                  /* Back: Answer / Deep Reflection */
                  <div className="space-y-3 text-left animate-fade-in bg-panel/70 p-4 rounded-xl border border-border/60">
                    <div className="text-xs font-semibold text-violet-400 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>深思与笔记沉淀</span>
                    </div>
                    <p className="text-xs sm:text-sm text-main/90 font-serif leading-relaxed whitespace-pre-wrap">
                      {currentCard.answer}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Bottom Bar */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted">
                <span className="font-mono">
                  快捷键: <kbd className="px-1.5 py-0.5 rounded bg-panel border border-border text-[10px]">Space</kbd> 翻转
                </span>
                {currentCard.noteId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const found = notes.find(n => n.id === currentCard.noteId);
                      if (found) {
                        onClose();
                        onOpenNoteInEditor(found);
                      }
                    }}
                    className="hover:text-violet-400 flex items-center gap-1 transition-colors"
                  >
                    <span>查阅原篇随笔</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Rating Buttons (Shown when flipped) */}
            <div className="w-full pt-5 flex items-center justify-between gap-3">
              {!isFlipped ? (
                <button
                  onClick={handleFlip}
                  className="w-full py-2.5 rounded-xl bg-card hover:bg-card-hover border border-border text-main font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <RotateCw className="w-4 h-4 text-violet-400" />
                  <span>翻转卡片 (按空格键)</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-3 w-full">
                  <button
                    onClick={() => handleRate(1)}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex flex-col items-center gap-0.5 transition-all shadow-xs"
                    title="快捷键 1: 模糊或未记清，1天后重新复习"
                  >
                    <div className="flex items-center gap-1">
                      <span>生疏</span>
                      <kbd className="text-[10px] opacity-60">1</kbd>
                    </div>
                    <span className="text-[10px] font-normal text-muted">1 天后重现</span>
                  </button>

                  <button
                    onClick={() => handleRate(3)}
                    className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex flex-col items-center gap-0.5 transition-all shadow-xs"
                    title="快捷键 2: 回想良好，按标准周期递增"
                  >
                    <div className="flex items-center gap-1">
                      <span>良好</span>
                      <kbd className="text-[10px] opacity-60">2</kbd>
                    </div>
                    <span className="text-[10px] font-normal text-muted">3-6 天后</span>
                  </button>

                  <button
                    onClick={() => handleRate(5)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex flex-col items-center gap-0.5 transition-all shadow-xs"
                    title="快捷键 3: 牢固掌握，进入长期记忆池"
                  >
                    <div className="flex items-center gap-1">
                      <span>熟练</span>
                      <kbd className="text-[10px] opacity-60">3</kbd>
                    </div>
                    <span className="text-[10px] font-normal text-muted">7+ 天后巩固</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
