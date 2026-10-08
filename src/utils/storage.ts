import { Topic, NoteEntry, AppTheme, AppSettings } from '../types';
import { DEFAULT_TOPICS, INITIAL_SAMPLE_NOTES } from './defaultData';

const NOTES_STORAGE_KEY = 'chrononote_entries_v1';
const TOPICS_STORAGE_KEY = 'chrononote_topics_v1';
const THEME_STORAGE_KEY = 'chrononote_theme_v1';
const SETTINGS_STORAGE_KEY = 'chrononote_settings_v1';

export const DEFAULT_TEMPLATES: Record<string, string> = {
  reading: `# 《书名》读书精炼与心得

> 作者：[作者名] · 出版年份：[年份] · 推荐星级：⭐⭐⭐⭐⭐

---

### 一、 核心心智模型 / 认知颠覆
1. 
2. 

### 二、 精彩金句摘录
> 

### 三、 个人生活与工作行动启发
- [ ] 
- [ ] 
`,
  journal: `# 岁月日记 · 记录今日温度

### 一、 今日心境与气象
- 心情印记：☕ 沉静与专注
- 值得珍藏的瞬间：

### 二、 生活琐屑与小确幸
1. 
2. 

### 三、 睡前感恩与晚安
`,
  thought: `### 灵感火花闪念

> 灵感往往诞生于两个毫不相关的概念碰撞之时。

- **核心概念**：
- **可能延伸的应用场景**：
- **下一步验证实验**：
`,
  review: `# 周度 / 阶段精进复盘

### 一、 本阶段目标执行情况
- [x] 已达成：
- [ ] 延迟/搁置：

### 二、 认知偏差与阻碍分析

### 三、 下一阶段三件最重要的事情 (Top 3)
1. 
2. 
3. 
`,
  movie: `# 《作品名》光影鉴赏

- **导演/创作者**：
- **艺术标签**：#电影 #镜头美学 #叙事
- **个人评分**：9.2 / 10

### 一、 触动心弦的桥段或台词

### 二、 镜头语言与深层意象
`,
  work: `# 深度工作与架构方案

### 目标与背景问题

### 关键架构决策与取舍 (Trade-offs)

### 行动清单
- [ ] 
`
};

export const DEFAULT_SETTINGS: AppSettings = {
  customVaultPath: '',
  pinCode: '',
  isLockEnabled: false,
  aiConfig: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: '',
  },
  templates: DEFAULT_TEMPLATES,
  soundEnabled: false,
  soundType: 'typewriter',
  whiteNoise: 'none',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      aiConfig: { ...DEFAULT_SETTINGS.aiConfig, ...(parsed.aiConfig || {}) },
      templates: { ...DEFAULT_TEMPLATES, ...(parsed.templates || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadNotes(): NoteEntry[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      saveNotes(INITIAL_SAMPLE_NOTES);
      return INITIAL_SAMPLE_NOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load notes from localStorage', e);
    return INITIAL_SAMPLE_NOTES;
  }
}

export function saveNotes(notes: NoteEntry[]): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes to localStorage', e);
  }
}

export function loadTopics(): Topic[] {
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!raw) {
      saveTopics(DEFAULT_TOPICS);
      return DEFAULT_TOPICS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load topics from localStorage', e);
    return DEFAULT_TOPICS;
  }
}

export function saveTopics(topics: Topic[]): void {
  try {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  } catch (e) {
    console.error('Failed to save topics to localStorage', e);
  }
}

export function loadTheme(): AppTheme {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme;
    if (t && ['obsidian', 'paper', 'forest', 'amber'].includes(t)) {
      return t;
    }
  } catch {}
  return 'obsidian';
}

export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
}

/**
 * Convert NoteEntry to standard Markdown with YAML frontmatter
 */
export function exportNoteToMarkdown(note: NoteEntry, topicName?: string): string {
  const frontmatter = [
    '---',
    `id: "${note.id}"`,
    `title: "${(note.title || '无标题').replace(/"/g, '\\"')}"`,
    `date: "${note.date}"`,
    `topic: "${topicName || note.topicId}"`,
    `tags: [${(note.tags || []).map(t => `"${t}"`).join(', ')}]`,
    note.mood ? `mood: "${note.mood}"` : null,
    note.rating ? `rating: ${note.rating}` : null,
    `createdAt: "${note.createdAt}"`,
    `updatedAt: "${note.updatedAt}"`,
    '---',
    '',
    note.content
  ].filter(Boolean).join('\n');

  return frontmatter;
}

/**
 * Sync all notes to a local folder via Electron IPC
 */
export async function syncNotesToLocalDisk(
  folderPath: string,
  notes: NoteEntry[],
  topics: Topic[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  if (!window.electronAPI?.saveMarkdownFiles) {
    return { success: false, error: '当前环境不支持直接访问本地文件系统（请在桌面客户端运行）' };
  }

  const topicsMap = new Map(topics.map(t => [t.id, t.name]));
  const files = notes.map(note => {
    const [year, month] = note.date.split('-');
    const safeTitle = (note.title || 'untitled').replace(/[\\/:*?"<>|]/g, '_').slice(0, 30);
    const filename = `${note.date}_${safeTitle}.md`;
    const content = exportNoteToMarkdown(note, topicsMap.get(note.topicId));
    return {
      subDir: `${year}/${month}`,
      filename,
      content,
    };
  });

  return await window.electronAPI.saveMarkdownFiles({ folderPath, files });
}

/**
 * Trigger file download in browser
 */
export function downloadFile(filename: string, content: string, mime = 'text/markdown;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
