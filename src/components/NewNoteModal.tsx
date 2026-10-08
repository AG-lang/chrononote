import React, { useState } from 'react';
import { Topic } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { X, Sparkles, BookOpen, Calendar, Edit3 } from 'lucide-react';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  defaultDate?: string;
  defaultTopicId?: string;
  onCreate: (date: string, topicId: string, title: string) => void;
}

export const NewNoteModal: React.FC<NewNoteModalProps> = ({
  isOpen,
  onClose,
  topics,
  defaultDate,
  defaultTopicId,
  onCreate,
}) => {
  const [date, setDate] = useState(defaultDate || getTodayDateString());
  const [topicId, setTopicId] = useState(defaultTopicId || topics[0]?.id || 'reading');
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(date, topicId, title.trim());
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-main font-serif">记录新随笔</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-main hover:bg-card-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-muted block mb-1">随笔标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：读《纳瓦尔宝典》的一点思考..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-main focus:outline-none focus:ring-1 focus:ring-violet-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">记录日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-main focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">归属主题</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-main focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-muted hover:text-main"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all"
            >
              开始书写
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
