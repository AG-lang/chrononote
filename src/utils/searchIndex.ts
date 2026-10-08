import { NoteEntry, Topic } from '../types';

export interface SearchMatchSnippet {
  field: 'title' | 'content' | 'tag' | 'topic';
  snippetHtml: string;
}

export interface SearchResultItem {
  note: NoteEntry;
  score: number;
  matchedTokens: string[];
  snippets: SearchMatchSnippet[];
}

export interface ParsedSearchQuery {
  raw: string;
  terms: string[];
  phrases: string[];
  tagFilter?: string;
  topicFilter?: string;
  moodFilter?: string;
  dateFilter?: string;
  onlyPinned?: boolean;
}

/**
 * Tokenize Chinese and English text into uni-grams, bi-grams and words
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  const clean = text.toLowerCase();
  const tokens = new Set<string>();

  // 1. Match English words & alphanumeric tokens
  const words = clean.match(/[a-z0-9_-]+/g) || [];
  words.forEach(w => {
    if (w.length >= 1) tokens.add(w);
  });

  // 2. Match Chinese characters & generate 1-gram and 2-gram
  const chineseChunks = clean.match(/[\u4e00-\u9fa5]+/g) || [];
  chineseChunks.forEach(chunk => {
    // 1-gram
    for (let i = 0; i < chunk.length; i++) {
      tokens.add(chunk[i]);
    }
    // 2-gram (bi-grams for accurate phrase matching)
    for (let i = 0; i < chunk.length - 1; i++) {
      tokens.add(chunk.substring(i, i + 2));
    }
    // full chunk if short
    if (chunk.length <= 6) {
      tokens.add(chunk);
    }
  });

  return Array.from(tokens);
}

/**
 * Parse special query operators like tag:..., topic:..., mood:..., "quotes"
 */
export function parseQuery(queryStr: string): ParsedSearchQuery {
  let text = queryStr.trim();
  const result: ParsedSearchQuery = {
    raw: queryStr,
    terms: [],
    phrases: [],
  };

  if (!text) return result;

  // Extract quoted exact phrases: "hello world" or “设计思考”
  const phraseMatches = text.match(/["“](.*?)["”]/g);
  if (phraseMatches) {
    phraseMatches.forEach(p => {
      const cleanPhrase = p.replace(/["“”]/g, '').trim().toLowerCase();
      if (cleanPhrase) result.phrases.push(cleanPhrase);
      text = text.replace(p, ' ');
    });
  }

  // Extract filters
  const tokens = text.split(/\s+/).filter(Boolean);
  const remainingTokens: string[] = [];

  tokens.forEach(tok => {
    const lower = tok.toLowerCase();
    if (lower.startsWith('tag:') || lower.startsWith('#')) {
      result.tagFilter = lower.replace(/^(tag:|#)/, '').trim();
    } else if (lower.startsWith('topic:') || lower.startsWith('@')) {
      result.topicFilter = lower.replace(/^(topic:|@)/, '').trim();
    } else if (lower.startsWith('mood:')) {
      result.moodFilter = lower.replace(/^mood:/, '').trim();
    } else if (lower.startsWith('date:') || lower.startsWith('year:')) {
      result.dateFilter = lower.replace(/^(date:|year:)/, '').trim();
    } else if (lower === 'is:pinned' || lower === 'pinned:true') {
      result.onlyPinned = true;
    } else {
      remainingTokens.push(tok);
    }
  });

  result.terms = remainingTokens;
  return result;
}

/**
 * High Performance Inverted Search Index
 */
export class NoteSearchEngine {
  // Inverted index: token -> Map<noteId, termFrequency>
  private index: Map<string, Map<string, number>> = new Map();
  private notesMap: Map<string, NoteEntry> = new Map();
  private topicsMap: Map<string, Topic> = new Map();

  constructor(notes: NoteEntry[] = [], topics: Topic[] = []) {
    this.rebuild(notes, topics);
  }

  public rebuild(notes: NoteEntry[], topics: Topic[]): void {
    this.index.clear();
    this.notesMap.clear();
    this.topicsMap.clear();

    topics.forEach(t => this.topicsMap.set(t.id, t));
    notes.forEach(n => this.notesMap.set(n.id, n));

    // Build inverted index
    notes.forEach(note => {
      this.indexNote(note);
    });
  }

  private indexNote(note: NoteEntry): void {
    const topic = this.topicsMap.get(note.topicId);
    const id = note.id;

    // Weight factors
    const indexField = (text: string, weight: number) => {
      const tokens = tokenizeText(text);
      tokens.forEach(tok => {
        let entry = this.index.get(tok);
        if (!entry) {
          entry = new Map<string, number>();
          this.index.set(tok, entry);
        }
        const currentScore = entry.get(id) || 0;
        entry.set(id, currentScore + weight);
      });
    };

    // Title has highest weight (10x)
    indexField(note.title || '', 10);
    // Tags have high weight (6x)
    (note.tags || []).forEach(t => indexField(t, 6));
    // Topic name (5x)
    if (topic) indexField(topic.name, 5);
    // Content body (1x)
    indexField(note.content || '', 1);
  }

  /**
   * Search notes with relevance scoring, filtering, and highlight snippets
   */
  public search(queryStr: string): SearchResultItem[] {
    const trimmed = queryStr.trim();
    if (!trimmed) {
      // Empty query returns all notes ordered by pinned and date
      return Array.from(this.notesMap.values())
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .map(note => ({
          note,
          score: note.pinned ? 50 : 10,
          matchedTokens: [],
          snippets: [],
        }));
    }

    const parsed = parseQuery(trimmed);
    const scoreMap = new Map<string, number>();
    const matchedTokensMap = new Map<string, Set<string>>();

    // 1. Process terms through inverted index
    const searchTokens: string[] = [];
    parsed.terms.forEach(t => {
      searchTokens.push(...tokenizeText(t));
    });

    if (searchTokens.length === 0 && (parsed.tagFilter || parsed.topicFilter || parsed.moodFilter || parsed.dateFilter)) {
      // Query has only filter operators
      this.notesMap.forEach((_, id) => {
        scoreMap.set(id, 10);
      });
    } else {
      searchTokens.forEach(tok => {
        const postingList = this.index.get(tok);
        if (postingList) {
          postingList.forEach((termScore, noteId) => {
            const current = scoreMap.get(noteId) || 0;
            scoreMap.set(noteId, current + termScore);

            let tokSet = matchedTokensMap.get(noteId);
            if (!tokSet) {
              tokSet = new Set();
              matchedTokensMap.set(noteId, tokSet);
            }
            tokSet.add(tok);
          });
        }
      });
    }

    // 2. Filter, Boost and Validate
    const results: SearchResultItem[] = [];

    scoreMap.forEach((baseScore, noteId) => {
      const note = this.notesMap.get(noteId);
      if (!note) return;
      const topic = this.topicsMap.get(note.topicId);

      // Filters Check
      if (parsed.onlyPinned && !note.pinned) return;

      if (parsed.tagFilter) {
        const hasTag = (note.tags || []).some(t => 
          t.toLowerCase().includes(parsed.tagFilter!.toLowerCase())
        );
        if (!hasTag) return;
      }

      if (parsed.topicFilter) {
        const topicName = (topic?.name || '').toLowerCase();
        if (!topicName.includes(parsed.topicFilter.toLowerCase())) return;
      }

      if (parsed.moodFilter) {
        if (!note.mood || !note.mood.includes(parsed.moodFilter)) return;
      }

      if (parsed.dateFilter) {
        if (!note.date.includes(parsed.dateFilter)) return;
      }

      // Exact Phrase Checking
      if (parsed.phrases.length > 0) {
        const fullContent = `${note.title}\n${note.content}`.toLowerCase();
        const matchesAllPhrases = parsed.phrases.every(p => fullContent.includes(p));
        if (!matchesAllPhrases) return;
      }

      let finalScore = baseScore;

      // Exact title match bonus
      if (parsed.raw && note.title.toLowerCase().includes(parsed.raw.toLowerCase())) {
        finalScore += 40;
      }

      // Pinned bonus
      if (note.pinned) {
        finalScore += 15;
      }

      // Recency bonus (within last 30 days)
      const noteTime = new Date(note.date).getTime();
      const now = Date.now();
      const daysDiff = (now - noteTime) / (1000 * 60 * 60 * 24);
      if (daysDiff >= 0 && daysDiff < 30) {
        finalScore += Math.max(0, 10 - daysDiff * 0.3);
      }

      // Snippet generation
      const matchedTokens = Array.from(matchedTokensMap.get(noteId) || []);
      const snippets = this.generateSnippets(note, parsed.terms.concat(parsed.phrases));

      results.push({
        note,
        score: Math.round(finalScore * 10) / 10,
        matchedTokens,
        snippets,
      });
    });

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate contextual snippet window around matching keyword
   */
  private generateSnippets(note: NoteEntry, searchTerms: string[]): SearchMatchSnippet[] {
    const snippets: SearchMatchSnippet[] = [];
    if (!searchTerms.length) return snippets;

    const content = note.content
      .replace(/^#+\s+/gm, '')
      .replace(/```[\s\S]*?```/g, ' [代码] ')
      .trim();

    for (const term of searchTerms) {
      if (!term || term.length < 1) continue;
      const lowerContent = content.toLowerCase();
      const index = lowerContent.indexOf(term.toLowerCase());

      if (index !== -1) {
        const start = Math.max(0, index - 35);
        const end = Math.min(content.length, index + term.length + 55);
        let excerpt = content.substring(start, end);

        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';

        // Highlight matched keyword with <mark>
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const highlighted = excerpt.replace(regex, '<mark class="bg-amber-400/30 text-amber-300 font-semibold px-1 rounded">$1</mark>');

        snippets.push({
          field: 'content',
          snippetHtml: highlighted,
        });
        break; // Keep best snippet
      }
    }

    return snippets;
  }
}
