import React from 'react';
import { NoteEntry, Topic } from '../../types';
import { calculateStats } from '../../utils/markdown';
import { 
  Edit3, 
  Trash2, 
  Share2, 
  Download, 
  Pin, 
  Star, 
  Tag as TagIcon,
  Clock
} from 'lucide-react';
import { exportNoteToMarkdown, downloadFile } from '../../utils/storage';

interface NoteCardProps {
  note: NoteEntry;
  topic?: Topic;
  onEdit: (note: NoteEntry) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenShareCard: (note: NoteEntry) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  topic,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenShareCard,
}) => {
  const stats = calculateStats(note.content);
  const topicColor = topic?.color || '#8b5cf6';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const md = exportNoteToMarkdown(note, topic?.name);
    downloadFile(`${note.date}_${topic?.id || 'note'}_${note.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.md`, md);
  };

  // Extract a preview snippet (strip headings/code)
  const snippet = note.content
    .replace(/^#+\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '[代码块]')
    .replace(/>\s+/g, '')
    .trim()
    .slice(0, 160);

  return (
    <div
      onClick={() => onEdit(note)}
      className="bg-card border border-border hover:border-violet-500/50 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative flex flex-col justify-between"
    >
      <div>
        {/* Card Top: Topic Pill + Mood + Rating + Pin */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${topicColor}15`,
                color: topicColor,
                borderColor: `${topicColor}30`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: topicColor }} />
              {topic?.name || '随笔'}
            </span>

            {note.mood && (
              <span className="text-sm px-1.5 py-0.5 rounded-md bg-white/5 border border-border" title="心境状态">
                {note.mood}
              </span>
            )}

            {note.rating && (
              <div className="flex items-center text-amber-400 text-xs gap-0.5">
                {Array.from({ length: note.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
              }}
              className={`p-1.5 rounded-lg hover:bg-card-hover transition-colors ${
                note.pinned ? 'text-amber-400 opacity-100' : 'text-muted'
              }`}
              title={note.pinned ? '取消置顶' : '置顶随笔'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenShareCard(note);
              }}
              className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-violet-400 transition-colors"
              title="生成分享卡片"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-emerald-400 transition-colors"
              title="下载 .md 文件"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('确定要删除这篇随笔吗？')) {
                  onDelete(note.id);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-rose-400 transition-colors"
              title="删除随笔"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-main mb-2 font-serif group-hover:text-violet-400 transition-colors leading-snug">
          {note.title || '无标题随笔'}
        </h3>

        {/* Content Snippet */}
        <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-4 font-sans">
          {snippet || '暂无详细内容...'}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-card-hover text-muted border border-border"
              >
                <TagIcon className="w-2.5 h-2.5 text-muted/70" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted border-t border-border/50 pt-3 mt-1 font-mono">
        <div className="flex items-center gap-2">
          <span>{stats.words} 字</span>
          <span>·</span>
          <span>约 {stats.readTimeMin} 分钟阅读</span>
        </div>

        <div className="flex items-center gap-1 text-muted/70">
          <Clock className="w-3 h-3" />
          <span>{note.updatedAt ? new Date(note.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>
    </div>
  );
};
