import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Render Markdown content to safe HTML with Wiki-Links support
 */
export function renderMarkdown(content: string): string {
  try {
    let parsed = marked.parse(content || '') as string;
    
    // Convert Wiki-links [[target]] to clickable capsules
    parsed = parsed.replace(/\[\[(.*?)\]\]/g, (_, target) => {
      const trimmed = target.trim();
      return `<a href="#wiki:${encodeURIComponent(trimmed)}" class="wiki-link inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors cursor-pointer text-xs font-mono font-medium no-underline shadow-xs">🔗 ${trimmed}</a>`;
    });

    return parsed;
  } catch (err) {
    console.error('Markdown parse error:', err);
    return `<p class="text-rose-500">渲染失败: ${String(err)}</p>`;
  }
}

/**
 * Read an image file to Base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Count Chinese characters and English words accurately
 */
export function calculateStats(text: string): { words: number; chars: number; readTimeMin: number } {
  if (!text) return { words: 0, chars: 0, readTimeMin: 0 };
  
  // Clean markdown syntax for counting
  const clean = text.replace(/```[\s\S]*?```/g, '')
                    .replace(/[#*`_~>\-[\]()]/g, '')
                    .trim();

  // Match Chinese characters
  const chineseChars = clean.match(/[\u4e00-\u9fa5]/g) || [];
  // Match English words
  const words = clean.match(/[a-zA-Z0-9_-]+/g) || [];

  const totalWords = chineseChars.length + words.length;
  const chars = text.length;
  const readTimeMin = Math.max(1, Math.ceil(totalWords / 300));

  return {
    words: totalWords,
    chars,
    readTimeMin
  };
}

/**
 * Helper to insert or wrap markdown syntax into textarea
 */
export function insertMarkdownSyntax(
  textarea: HTMLTextAreaElement,
  syntaxType: string
): { newContent: string; newCursor: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);

  let replacement = '';
  let cursorOffset = 0;

  switch (syntaxType) {
    case 'bold':
      replacement = `**${selected || '加粗文本'}**`;
      cursorOffset = selected ? replacement.length : 2;
      break;

    case 'italic':
      replacement = `*${selected || '斜体文本'}*`;
      cursorOffset = selected ? replacement.length : 1;
      break;

    case 'strikethrough':
      replacement = `~~${selected || '删除线文本'}~~`;
      cursorOffset = selected ? replacement.length : 2;
      break;

    case 'h1':
      replacement = `\n# ${selected || '一级标题'}\n`;
      cursorOffset = replacement.length - 1;
      break;

    case 'h2':
      replacement = `\n## ${selected || '二级标题'}\n`;
      cursorOffset = replacement.length - 1;
      break;

    case 'h3':
      replacement = `\n### ${selected || '三级标题'}\n`;
      cursorOffset = replacement.length - 1;
      break;

    case 'quote':
      replacement = `\n> ${selected || '引用内容'}\n`;
      cursorOffset = replacement.length - 1;
      break;

    case 'code':
      if (selected.includes('\n') || !selected) {
        replacement = `\n\`\`\`javascript\n${selected || '// 编写代码'}\n\`\`\`\n`;
        cursorOffset = selected ? replacement.length : 17;
      } else {
        replacement = `\`${selected}\``;
        cursorOffset = replacement.length;
      }
      break;

    case 'link':
      replacement = `[${selected || '链接描述'}](https://example.com)`;
      cursorOffset = selected ? replacement.length - 1 : 1;
      break;

    case 'image':
      replacement = `![${selected || '图片描述'}](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800)`;
      cursorOffset = replacement.length;
      break;

    case 'wikilink':
      replacement = `[[${selected || '2026-10-08'}]]`;
      cursorOffset = replacement.length;
      break;

    case 'bullet':
      replacement = `\n- ${selected || '列表项'}\n`;
      cursorOffset = replacement.length - 1;
      break;

    case 'number':
      replacement = `\n1. ${selected || '列表项'}\n`;
      cursorOffset = replacement.length - 1;
      break;

    case 'task':
      replacement = `\n- [ ] ${selected || '待办任务'}\n`;
      cursorOffset = replacement.length - 1;
      break;

    case 'table':
      replacement = `\n| 标题 1 | 标题 2 | 标题 3 |\n| :--- | :--- | :--- |\n| 内容 A | 内容 B | 内容 C |\n| 内容 D | 内容 E | 内容 F |\n`;
      cursorOffset = replacement.length;
      break;

    case 'hr':
      replacement = `\n\n---\n\n`;
      cursorOffset = replacement.length;
      break;

    case 'math':
      replacement = `\n$$\n${selected || 'E = mc^2'}\n$$\n`;
      cursorOffset = replacement.length - 4;
      break;

    default:
      return { newContent: text, newCursor: start };
  }

  const newContent = text.substring(0, start) + replacement + text.substring(end);
  const newCursor = start + cursorOffset;

  return { newContent, newCursor };
}
