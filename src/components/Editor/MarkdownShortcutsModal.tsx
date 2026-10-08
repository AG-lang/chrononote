import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface MarkdownShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarkdownShortcutsModal: React.FC<MarkdownShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + B', desc: '粗体文本 (**bold**)' },
    { key: 'Ctrl + I', desc: '斜体文本 (*italic*)' },
    { key: 'Ctrl + Shift + X', desc: '删除线 (~~strike~~)' },
    { key: 'Ctrl + 1 / 2 / 3', desc: '一级 / 二级 / 三级标题' },
    { key: 'Ctrl + Q', desc: '引用文本块 (> quote)' },
    { key: 'Ctrl + E', desc: '行内代码 (`code`)' },
    { key: 'Ctrl + Shift + C', desc: '代码块 (```code```)' },
    { key: 'Ctrl + K', desc: '插入超链接 [title](url)' },
    { key: 'Ctrl + T', desc: '待办任务复选框 (- [ ] todo)' },
    { key: 'Ctrl + L', desc: '无序列表项 (- item)' },
    { key: 'Ctrl + O', desc: '有序列表项 (1. item)' },
    { key: 'Tab', desc: '增加两个空格缩进' },
    { key: 'Shift + Tab', desc: '减少缩进' },
    { key: 'Ctrl + S', desc: '立即保存当前笔记' },
    { key: 'Ctrl + P', desc: '循环切换编辑/预览/双栏模式' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-main">快捷键速查表</h3>
              <p className="text-xs text-muted">支持 Windows (Ctrl) 与 macOS (Cmd) 快捷键体系</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-main transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/50 text-xs"
            >
              <span className="text-muted font-sans">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-panel border border-border font-mono text-[11px] font-semibold text-main shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-card/50 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
