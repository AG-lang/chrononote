import React, { useState, useEffect, useCallback } from 'react';
import { NoteEntry, Topic, ViewMode, AppTheme, AppSettings, AiSettings } from './types';
import { 
  loadNotes, 
  saveNotes, 
  loadTopics, 
  saveTopics, 
  loadTheme, 
  saveTheme, 
  loadSettings,
  saveSettings,
  downloadFile 
} from './utils/storage';
import { getTodayDateString, parseDate } from './utils/dateUtils';
import { setAmbientSound } from './utils/audio';
import { TopNavbar } from './components/TopNavbar';
import { YearView } from './components/Calendar/YearView';
import { DayWorkspace } from './components/DayView/DayWorkspace';
import { DualPaneEditor } from './components/Editor/DualPaneEditor';
import { TopicLensView } from './components/TopicLens/TopicLensView';
import { CardGalleryView } from './components/Gallery/CardGalleryView';
import { StatsView } from './components/Stats/StatsView';
import { ConstellationGraphView } from './components/Graph/ConstellationGraphView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { FlashcardReviewModal } from './components/SRS/FlashcardReviewModal';
import { ZenPomodoroModal } from './components/Pomodoro/ZenPomodoroModal';
import { NewNoteModal } from './components/NewNoteModal';
import { ShareCardModal } from './components/Editor/ShareCardModal';
import { SpotlightSearchModal } from './components/SpotlightSearchModal';
import { SettingsModal } from './components/SettingsModal';
import { AiDigestModal } from './components/AiDigestModal';
import { MemoirExportModal } from './components/MemoirExportModal';
import { LockScreen } from './components/LockScreen';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<NoteEntry[]>(() => loadNotes());
  const [topics, setTopics] = useState<Topic[]>(() => loadTopics());
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  
  // Privacy Lock State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = loadSettings();
    return Boolean(s.isLockEnabled && s.pinCode);
  });

  const todayStr = getTodayDateString();
  const todayDate = parseDate(todayStr);

  const [currentYear, setCurrentYear] = useState<number>(todayDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<ViewMode>('year');

  const [activeEditingNote, setActiveEditingNote] = useState<NoteEntry | null>(null);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [shareCardNote, setShareCardNote] = useState<NoteEntry | null>(null);

  // Global Modals
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiDigestOpen, setIsAiDigestOpen] = useState(false);
  const [isMemoirOpen, setIsMemoirOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSRSOpen, setIsSRSOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);


  // Apply theme to document body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    if (theme === 'paper') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Initial ambient sound
  useEffect(() => {
    if (settings.whiteNoise && settings.whiteNoise !== 'none') {
      setAmbientSound(settings.whiteNoise);
    }
  }, [settings.whiteNoise]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: next };
    setSettings(updated);
    saveSettings(updated);
  };

  // Persist notes and topics
  const handleUpdateNotes = useCallback((newNotes: NoteEntry[]) => {
    setNotes(newNotes);
    saveNotes(newNotes);
  }, []);

  const handleUpdateTopics = useCallback((newTopics: Topic[]) => {
    setTopics(newTopics);
    saveTopics(newTopics);
  }, []);

  // Save or update an existing note
  const handleSaveNote = useCallback((updatedNote: NoteEntry) => {
    setNotes(prev => {
      const exists = prev.some(n => n.id === updatedNote.id);
      const next = exists
        ? prev.map(n => n.id === updatedNote.id ? updatedNote : n)
        : [updatedNote, ...prev];
      saveNotes(next);
      return next;
    });
    setActiveEditingNote(updatedNote);
  }, []);

  // Delete a note
  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      saveNotes(next);
      return next;
    });
    if (activeEditingNote?.id === id) {
      setActiveEditingNote(null);
    }
  }, [activeEditingNote]);

  // Toggle pin
  const handleTogglePin = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
      saveNotes(next);
      return next;
    });
  }, []);

  // Create a new note directly under a topic using Smart Templates
  const handleCreateNewNoteWithTopic = useCallback((topicId: string) => {
    const topicObj = topics.find(t => t.id === topicId);
    const template = settings.templates[topicId] || `# ${topicObj?.name || '随笔'}感悟\n\n> 记录于 ${selectedDate}\n\n在这里写下你的核心思考...`;
    
    const newNote: NoteEntry = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: selectedDate,
      topicId,
      title: `${topicObj?.name || '随笔'}手记`,
      content: template,
      tags: [topicObj?.name || '随笔'],
      mood: '💡',
      rating: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes(prev => {
      const next = [newNote, ...prev];
      saveNotes(next);
      return next;
    });
    setActiveEditingNote(newNote);
  }, [selectedDate, topics, settings.templates]);

  // Create note from modal
  const handleCreateFromModal = (date: string, topicId: string, title: string) => {
    const topicObj = topics.find(t => t.id === topicId);
    const template = settings.templates[topicId] || `# ${title || topicObj?.name || '随笔'}\n\n> 记录于 ${date}\n\n在这里写下你的核心思考...`;
    
    const newNote: NoteEntry = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      topicId,
      title: title || `${topicObj?.name || '随笔'}手记`,
      content: template,
      tags: [topicObj?.name || '随笔'],
      mood: '☕',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedDate(date);
    const [y] = date.split('-').map(Number);
    setCurrentYear(y);

    setNotes(prev => {
      const next = [newNote, ...prev];
      saveNotes(next);
      return next;
    });
    setActiveEditingNote(newNote);
  };

  // Add custom topic
  const handleAddCustomTopic = (newTopic: Topic) => {
    const next = [...topics, newTopic];
    handleUpdateTopics(next);
  };

  // Wiki-link navigation handler
  const handleNavigateToWiki = (target: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(target)) {
      // Date link [[YYYY-MM-DD]]
      setSelectedDate(target);
      const [y] = target.split('-').map(Number);
      setCurrentYear(y);
      setViewMode('day');
      setActiveEditingNote(null);
      return;
    }
    // Match by note title
    const found = notes.find(n => n.title.toLowerCase().includes(target.toLowerCase()));
    if (found) {
      setActiveEditingNote(found);
      return;
    }
    // Match by topic
    const foundTopic = topics.find(t => t.name.toLowerCase().includes(target.toLowerCase()));
    if (foundTopic) {
      setViewMode('topicLens');
      setActiveEditingNote(null);
    }
  };

  // Export all notes as JSON backup
  const handleExportAll = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      topics,
      settings,
    };
    downloadFile(
      `ChronoNote_Backup_${getTodayDateString()}.json`,
      JSON.stringify(backupData, null, 2),
      'application/json;charset=utf-8'
    );
  };

  // Global keydown (Ctrl+K for search, Alt+1 or Ctrl+Shift+N for quick capture, Ctrl+N for new note)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      } else if (
        (e.altKey && (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1')) || 
        (isCtrl && e.shiftKey && e.key.toLowerCase() === 'n')
      ) {
        e.preventDefault();
        setIsQuickCaptureOpen(prev => !prev);
      } else if (isCtrl && e.key.toLowerCase() === 'n' && !activeEditingNote) {
        e.preventDefault();
        setIsNewNoteModalOpen(true);
      }
    };

    // Use capturing phase (true) so Alt+1 works globally even within inputs/textareas
    window.addEventListener('keydown', handleGlobalKey, true);
    return () => window.removeEventListener('keydown', handleGlobalKey, true);
  }, [activeEditingNote]);

  // IPC listener for OS-wide system global shortcut Alt+1 from Electron
  useEffect(() => {
    if (window.electronAPI?.onTriggerQuickCapture) {
      const cleanup = window.electronAPI.onTriggerQuickCapture(() => {
        setIsQuickCaptureOpen(true);
      });
      return cleanup;
    }
  }, []);

  // Privacy Lock Screen
  if (isLocked && settings.pinCode) {
    return (
      <LockScreen
        pinCode={settings.pinCode}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-app text-main transition-colors duration-200">
      {/* Top Navigation */}
      <TopNavbar
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        viewMode={viewMode}
        onViewModeChange={(m) => {
          setViewMode(m);
          setActiveEditingNote(null);
        }}
        selectedDate={selectedDate}
        onSelectDate={(d) => {
          setSelectedDate(d);
          const [y] = d.split('-').map(Number);
          setCurrentYear(y);
        }}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        onOpenNewNote={() => setIsNewNoteModalOpen(true)}
        onExportAll={handleExportAll}
        onOpenSearch={() => setIsSpotlightOpen(true)}
        onOpenAiDigest={() => setIsAiDigestOpen(true)}
        onOpenMemoir={() => setIsMemoirOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenSRS={() => setIsSRSOpen(true)}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
        isLockEnabled={Boolean(settings.isLockEnabled && settings.pinCode)}
        onLockScreen={() => setIsLocked(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeEditingNote ? (
          /* Dual Pane Markdown Editor */
          <DualPaneEditor
            note={activeEditingNote}
            topics={topics}
            onSave={handleSaveNote}
            onBack={() => setActiveEditingNote(null)}
            soundEnabled={settings.soundEnabled}
            onToggleSound={handleToggleSound}
            onNavigateToWiki={handleNavigateToWiki}
            aiSettings={settings.aiConfig}
          />
        ) : (
          <>
            {viewMode === 'year' && (
              <YearView
                currentYear={currentYear}
                notes={notes}
                topics={topics}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setViewMode('day');
                }}
              />
            )}

            {viewMode === 'day' && (
              <DayWorkspace
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onBackToYear={() => setViewMode('year')}
                notes={notes}
                topics={topics}
                onOpenEditor={(note) => setActiveEditingNote(note)}
                onCreateNewNoteWithTopic={handleCreateNewNoteWithTopic}
                onDeleteNote={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onOpenShareCard={(note) => setShareCardNote(note)}
              />
            )}

            {viewMode === 'topicLens' && (
              <TopicLensView
                currentYear={currentYear}
                notes={notes}
                topics={topics}
                onOpenEditor={(note) => setActiveEditingNote(note)}
                onCreateNewNoteWithTopic={handleCreateNewNoteWithTopic}
                onDeleteNote={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onOpenShareCard={(note) => setShareCardNote(note)}
                onAddCustomTopic={handleAddCustomTopic}
              />
            )}

            {viewMode === 'gallery' && (
              <CardGalleryView
                notes={notes}
                topics={topics}
                onOpenEditor={(note) => setActiveEditingNote(note)}
                onOpenShareCard={(note) => setShareCardNote(note)}
              />
            )}

            {viewMode === 'graph' && (
              <ConstellationGraphView
                notes={notes}
                topics={topics}
                currentYear={currentYear}
                onOpenEditor={(note) => setActiveEditingNote(note)}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setViewMode('day');
                }}
              />
            )}

            {viewMode === 'stats' && (
              <StatsView
                currentYear={currentYear}
                notes={notes}
                topics={topics}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setViewMode('day');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        topics={topics}
        onSaveQuickNote={(note, openInEditor) => {
          handleSaveNote(note);
          if (openInEditor) {
            setActiveEditingNote(note);
          }
        }}
      />

      <FlashcardReviewModal
        isOpen={isSRSOpen}
        onClose={() => setIsSRSOpen(false)}
        notes={notes}
        topics={topics}
        onOpenNoteInEditor={(note) => {
          setIsSRSOpen(false);
          setActiveEditingNote(note);
        }}
      />

      <ZenPomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        topics={topics}
        notes={notes}
        onLogFocusSession={(entry) => {
          handleSaveNote(entry);
        }}
      />

      <SpotlightSearchModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        notes={notes}
        topics={topics}
        onSelectNote={(note) => setActiveEditingNote(note)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        topics={topics}
        notes={notes}
      />

      <AiDigestModal
        isOpen={isAiDigestOpen}
        onClose={() => setIsAiDigestOpen(false)}
        notes={notes}
        topics={topics}
        aiSettings={settings.aiConfig}
        onUpdateAiSettings={(newAi) => {
          handleUpdateSettings({ ...settings, aiConfig: newAi });
        }}
        onSaveAsNote={(date, topicId, title, content) => {
          handleCreateFromModal(date, topicId, title);
        }}
      />

      <MemoirExportModal
        isOpen={isMemoirOpen}
        onClose={() => setIsMemoirOpen(false)}
        currentYear={currentYear}
        notes={notes}
        topics={topics}
      />

      <NewNoteModal
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        topics={topics}
        defaultDate={selectedDate}
        onCreate={handleCreateFromModal}
      />

      {shareCardNote && (
        <ShareCardModal
          isOpen={Boolean(shareCardNote)}
          onClose={() => setShareCardNote(null)}
          note={shareCardNote}
          topic={topics.find(t => t.id === shareCardNote.topicId)}
        />
      )}
    </div>
  );
};

export default App;
