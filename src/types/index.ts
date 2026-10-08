export interface Topic {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  isCustom?: boolean;
}

export interface NoteEntry {
  id: string;
  date: string; // YYYY-MM-DD
  topicId: string;
  title: string;
  content: string;
  tags: string[];
  mood?: string;
  rating?: number; // 1-5
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export type ViewMode = 'year' | 'day' | 'topicLens' | 'stats' | 'gallery' | 'graph';

export type EditorMode = 'dual' | 'edit-only' | 'preview-only';

export type AppTheme = 'obsidian' | 'paper' | 'forest' | 'amber';

export type MoodType = 'calm' | 'inspired' | 'passionate' | 'cozy' | 'gloomy';

export interface MoodPreset {
  id: MoodType;
  emoji: string;
  label: string;
  color: string;
  energy: number; // 1 to 5
}

export interface FlashcardItem {
  id: string;
  noteId: string;
  noteTitle: string;
  date: string;
  topicId: string;
  question: string;
  answer: string;
  sourceSnippet?: string;
  type?: 'quote' | 'qa' | 'concept';
  interval: number; // in days
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt?: string;
}

export interface FocusSession {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  topicId: string;
  taskTitle: string;
  notes?: string;
}


export interface CalendarDayStats {
  date: string;
  count: number;
  topics: string[];
}

export interface AiSettings {
  provider: 'ollama' | 'openai';
  baseUrl: string;
  apiKey?: string;
  model: string;
}

export interface AppSettings {
  customVaultPath?: string;
  pinCode?: string;
  isLockEnabled?: boolean;
  aiConfig: AiSettings;
  templates: Record<string, string>;
  soundEnabled: boolean;
  soundType: 'typewriter' | 'keyboard';
  whiteNoise: 'none' | 'rain' | 'fire';
}

declare global {
  interface Window {
    electronAPI?: {
      selectDirectory: () => Promise<string | null>;
      saveMarkdownFiles: (params: {
        folderPath: string;
        files: { filename: string; content: string; subDir?: string }[];
      }) => Promise<{ success: boolean; count?: number; error?: string }>;
      readMarkdownFiles: (params: { folderPath: string }) => Promise<{ success: boolean }>;
      onTriggerQuickCapture?: (callback: () => void) => () => void;
    };
  }
}
