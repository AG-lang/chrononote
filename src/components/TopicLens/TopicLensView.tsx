import React, { useState } from 'react';
import { NoteEntry, Topic } from '../../types';
import { NoteCard } from '../DayView/NoteCard';
import { Plus, BookOpen, Layers, Sparkles, Filter, Hash } from 'lucide-react';
import { getTodayDateString } from '../../utils/dateUtils';

interface TopicLensViewProps {
  currentYear: number;
  notes: NoteEntry[];
  topics: Topic[];
  onOpenEditor: (note: NoteEntry) => void;
  onCreateNewNoteWithTopic: (topicId: string) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenShareCard: (note: NoteEntry) => void;
  onAddCustomTopic: (newTopic: Topic) => void;
}

export const TopicLensView: React.FC<TopicLensViewProps> = ({
  currentYear,
  notes,
  topics,
  onOpenEditor,
  onCreateNewNoteWithTopic,
  onDeleteNote,
  onTogglePin,
  onOpenShareCard,
  onAddCustomTopic,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || 'reading');
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicColor, setNewTopicColor] = useState('#8b5cf6');

  // Filter notes belonging to this topic and current year
  const filteredNotes = notes
    .filter(n => {
      const [y] = n.date.split('-').map(Number);
      return y === currentYear && n.topicId === selectedTopicId;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const newTopic: Topic = {
      id: `custom_${Date.now()}`,
      name: newTopicName.trim(),
      icon: 'Tag',
      color: newTopicColor,
      isCustom: true,
    };
    onAddCustomTopic(newTopic);
    setSelectedTopicId(newTopic.id);
    setNewTopicName('');
    setShowAddTopicModal(false);
  };

  const presetColors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Topic Pills Nav */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2">
          {topics.map(t => {
            const count = notes.filter(n => n.topicId === t.id && n.date.startsWith(String(currentYear))).length;
            const isSelected = selectedTopicId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-panel text-muted hover:text-main border border-border'
                }`}
                style={{
                  backgroundColor: isSelected ? t.color : undefined,
                  borderColor: isSelected ? t.color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : t.color }}
                />
                <span>{t.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-white' : 'bg-card text-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Add custom topic button */}
          <button
            onClick={() => setShowAddTopicModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-panel border border-dashed border-border text-muted hover:text-main hover:border-violet-500/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建主题</span>
          </button>
        </div>

        <button
          onClick={() => onCreateNewNoteWithTopic(selectedTopicId)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition-all self-start md:self-auto"
          style={{ backgroundColor: currentTopic?.color || '#8b5cf6' }}
        >
          <Plus className="w-4 h-4" />
          <span>写一篇【{currentTopic?.name}】</span>
        </button>
      </div>

      {/* 2. Topic Banner */}
      <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentTopic?.color }}
            />
            <h2 className="text-xl font-bold font-serif text-main">
              {currentTopic?.name} · {currentYear} 年度全景时间线
            </h2>
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            {currentTopic?.description || '按主题沉淀聚合的所有思考卡片'} · 累计收录 {filteredNotes.length} 篇
          </p>
        </div>
      </div>

      {/* 3. Notes Stream */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              topic={currentTopic}
              onEdit={onOpenEditor}
              onDelete={onDeleteNote}
              onTogglePin={onTogglePin}
              onOpenShareCard={onOpenShareCard}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-main font-serif mb-1">
            暂无【{currentTopic?.name}】相关记录
          </h3>
          <p className="text-xs text-muted mb-4">
            点击下方按钮，立即在此主题下沉淀你的第一条心得或随笔。
          </p>
          <button
            onClick={() => onCreateNewNoteWithTopic(selectedTopicId)}
            className="px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
            style={{ backgroundColor: currentTopic?.color || '#8b5cf6' }}
          >
            <Plus className="w-4 h-4" />
            <span>记录随笔</span>
          </button>
        </div>
      )}

      {/* Create Topic Modal */}
      {showAddTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateTopic}
            className="bg-panel border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-main mb-4 font-serif">新建专属主题</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">主题名称</label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="如：咖啡研究、英语学习、投资复盘"
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-main focus:outline-none focus:ring-1 focus:ring-violet-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1.5">主题标志色彩</label>
                <div className="flex items-center gap-2">
                  {presetColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTopicColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newTopicColor === c ? 'scale-125 ring-2 ring-white/60' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowAddTopicModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-muted hover:text-main"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-sm transition-all"
              >
                创建主题
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
