import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  FileCode,
  Link,
  Image,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Minus,
  Sigma,
  HelpCircle,
} from 'lucide-react';

interface MarkdownToolbarProps {
  onInsertSyntax: (syntax: string) => void;
  onOpenShortcuts: () => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onInsertSyntax,
  onOpenShortcuts,
}) => {
  const tools = [
    { id: 'bold', label: '加粗 (Ctrl+B)', icon: <Bold className="w-3.5 h-3.5" /> },
    { id: 'italic', label: '斜体 (Ctrl+I)', icon: <Italic className="w-3.5 h-3.5" /> },
    { id: 'strikethrough', label: '删除线 (Ctrl+Shift+X)', icon: <Strikethrough className="w-3.5 h-3.5" /> },
    { divider: true },
    { id: 'h1', label: '一级标题 (Ctrl+1)', icon: <Heading1 className="w-3.5 h-3.5" /> },
    { id: 'h2', label: '二级标题 (Ctrl+2)', icon: <Heading2 className="w-3.5 h-3.5" /> },
    { id: 'h3', label: '三级标题 (Ctrl+3)', icon: <Heading3 className="w-3.5 h-3.5" /> },
    { divider: true },
    { id: 'quote', label: '引用块 (Ctrl+Q)', icon: <Quote className="w-3.5 h-3.5" /> },
    { id: 'code', label: '行内代码 (Ctrl+E)', icon: <Code className="w-3.5 h-3.5" /> },
    { id: 'code', label: '代码块 (Ctrl+Shift+C)', icon: <FileCode className="w-3.5 h-3.5" /> },
    { id: 'math', label: '数学公式 ($$)', icon: <Sigma className="w-3.5 h-3.5" /> },
    { divider: true },
    { id: 'bullet', label: '无序列表 (Ctrl+L)', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'number', label: '有序列表 (Ctrl+O)', icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { id: 'task', label: '待办清单 (Ctrl+T)', icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { divider: true },
    { id: 'link', label: '插入链接 (Ctrl+K)', icon: <Link className="w-3.5 h-3.5" /> },
    { id: 'image', label: '插入图片 (Ctrl+Shift+I)', icon: <Image className="w-3.5 h-3.5" /> },
    { id: 'table', label: '表格', icon: <Table className="w-3.5 h-3.5" /> },
    { id: 'hr', label: '分割线', icon: <Minus className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-3 py-1.5 bg-panel border-b border-border text-muted">
      {tools.map((item, idx) => {
        if (item.divider) {
          return <div key={`div-${idx}`} className="w-[1px] h-4 bg-border mx-1" />;
        }
        return (
          <button
            key={`${item.id || 'divider'}-${idx}`}
            type="button"
            onClick={() => onInsertSyntax(item.id!)}
            className="p-1.5 rounded-md hover:bg-card-hover hover:text-main transition-colors text-xs"
            title={item.label}
          >
            {item.icon}
          </button>
        );
      })}

      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-md hover:bg-card-hover hover:text-violet-400 transition-colors flex items-center gap-1 text-[11px]"
          title="查看所有快捷键 (Ctrl+/)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">快捷键</span>
        </button>
      </div>
    </div>
  );
};
