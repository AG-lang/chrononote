import React, { useRef, useState } from 'react';
import { NoteEntry, Topic } from '../../types';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { toPng } from 'html-to-image';
import { X, Download, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteEntry;
  topic?: Topic;
}

type CardStyle = 'paper' | 'obsidian' | 'sunset' | 'emerald';

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  note,
  topic,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardStyle, setCardStyle] = useState<CardStyle>('obsidian');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2, // High resolution retina rendering
      });
      const link = document.createElement('a');
      link.download = `ChronoNote_${note.date}_${note.title.slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('导出图片失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Plain excerpt for clean card typography
  const excerpt = note.content
    .replace(/^#+\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim()
    .slice(0, 320);

  const styleConfigs = {
    obsidian: {
      bg: 'bg-gradient-to-br from-[#181920] via-[#121318] to-[#0c0d12]',
      border: 'border-[#2d3142]',
      text: 'text-stone-100',
      muted: 'text-stone-400',
      quoteBg: 'bg-white/5',
      accent: '#8b5cf6',
    },
    paper: {
      bg: 'bg-[#faf7ee]',
      border: 'border-[#dfd7c2]',
      text: 'text-stone-850 text-[#292520]',
      muted: 'text-[#6e6659]',
      quoteBg: 'bg-[#f0ebe0]',
      accent: '#b45309',
    },
    sunset: {
      bg: 'bg-gradient-to-br from-[#241712] via-[#1a110d] to-[#120a06]',
      border: 'border-[#4a2e1f]',
      text: 'text-amber-50',
      muted: 'text-amber-200/70',
      quoteBg: 'bg-amber-950/40',
      accent: '#f59e0b',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-[#0e1c18] via-[#091512] to-[#050d0b]',
      border: 'border-[#1f3d34]',
      text: 'text-emerald-50',
      muted: 'text-emerald-200/70',
      quoteBg: 'bg-emerald-950/40',
      accent: '#10b981',
    },
  };

  const curStyle = styleConfigs[cardStyle];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-panel border border-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="font-bold text-sm text-main">生成时光随笔卡片</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-main transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Style Selector */}
        <div className="px-6 py-3 bg-card border-b border-border flex items-center justify-between text-xs">
          <span className="text-muted">视觉质感:</span>
          <div className="flex items-center gap-2">
            {(['obsidian', 'paper', 'sunset', 'emerald'] as CardStyle[]).map(style => (
              <button
                key={style}
                onClick={() => setCardStyle(style)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  cardStyle === style
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-panel text-muted hover:text-main border border-border'
                }`}
              >
                {style === 'obsidian' && '深空墨夜'}
                {style === 'paper' && '暖白宣纸'}
                {style === 'sunset' && '落日余晖'}
                {style === 'emerald' && '静谧松峦'}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-stone-900/40">
          <div
            ref={cardRef}
            className={`w-full max-w-md rounded-2xl p-7 border shadow-2xl transition-all relative ${curStyle.bg} ${curStyle.border}`}
          >
            {/* Top metadata */}
            <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: 'rgba(140, 140, 160, 0.2)' }}>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${topic?.color || '#8b5cf6'}25`,
                    color: topic?.color || '#8b5cf6',
                  }}
                >
                  {topic?.name || '随笔'}
                </span>
                {note.mood && <span className="text-sm">{note.mood}</span>}
              </div>

              <div className="text-[11px] font-mono tracking-wider" style={{ color: curStyle.accent }}>
                {note.date}
              </div>
            </div>

            {/* Note Title */}
            <h2 className={`text-xl font-bold font-serif mb-4 leading-snug tracking-tight ${curStyle.text}`}>
              {note.title || '无题随笔'}
            </h2>

            {/* Body Quote */}
            <div
              className={`p-4 rounded-xl text-xs leading-relaxed font-serif whitespace-pre-wrap mb-6 ${curStyle.quoteBg} ${curStyle.text}`}
              style={{ minHeight: '100px' }}
            >
              {excerpt}
            </div>

            {/* Card Footer: Branding */}
            <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(140, 140, 160, 0.2)' }}>
              <div>
                <div className={`text-[11px] font-serif font-bold ${curStyle.text}`}>
                  ChronoNote 时光墨历
                </div>
                <div className={`text-[10px] ${curStyle.muted}`}>
                  {formatFriendlyDate(note.date)}
                </div>
              </div>

              <div className="w-6 h-6 rounded-full border flex items-center justify-center opacity-60" style={{ borderColor: curStyle.accent }}>
                <span className="text-[9px] font-mono" style={{ color: curStyle.accent }}>印</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-card border-t border-border flex items-center justify-between">
          <button
            onClick={handleCopyContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-panel border border-border hover:bg-card-hover text-muted hover:text-main text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制文字' : '复制正文'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs text-muted hover:text-main transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? '生成中...' : '下载卡片图片'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
