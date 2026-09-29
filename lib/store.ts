import { create } from 'zustand';
import { ActiveView, ApiSettings, Character, UserPersona } from '@/types';
import { DEFAULT_SETTINGS, db } from './db';

interface AppState {
  // Navigation & Modals
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isCharacterModalOpen: boolean;
  setIsCharacterModalOpen: (open: boolean) => void;
  isPersonaModalOpen: boolean;
  setIsPersonaModalOpen: (open: boolean) => void;
  isScenarioDrawerOpen: boolean;
  setIsScenarioDrawerOpen: (open: boolean) => void;
  isMemoryDrawerOpen: boolean;
  setIsMemoryDrawerOpen: (open: boolean) => void;
  isRelationshipDrawerOpen: boolean;
  setIsRelationshipDrawerOpen: (open: boolean) => void;
  isAuthorsNoteDrawerOpen: boolean;
  setIsAuthorsNoteDrawerOpen: (open: boolean) => void;
  pinMemoryModalData: { messageContent: string; role?: 'user' | 'assistant' | 'system' } | null;
  setPinMemoryModalData: (data: { messageContent: string; role?: 'user' | 'assistant' | 'system' } | null) => void;

  // Selected Entities
  selectedCharacterId: string | null;
  setSelectedCharacterId: (id: string | null) => void;
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  selectedPersonaId: string | null;
  setSelectedPersonaId: (id: string | null) => void;

  // Edit states
  editingCharacter: Character | null;
  setEditingCharacter: (char: Character | null) => void;
  editingPersona: UserPersona | null;
  setEditingPersona: (persona: UserPersona | null) => void;

  // Settings
  settings: ApiSettings;
  setSettings: (settings: ApiSettings) => void;
  updateSettings: (partial: Partial<ApiSettings>) => Promise<void>;

  // Generation & Streaming
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  activeStreamingMessage: string;
  setActiveStreamingMessage: (text: string) => void;
  abortController: AbortController | null;
  setAbortController: (ac: AbortController | null) => void;
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  activeView: 'gallery',
  setActiveView: (view) => set({ activeView: view }),
  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isCharacterModalOpen: false,
  setIsCharacterModalOpen: (open) => set({ isCharacterModalOpen: open }),
  isPersonaModalOpen: false,
  setIsPersonaModalOpen: (open) => set({ isPersonaModalOpen: open }),
  isScenarioDrawerOpen: false,
  setIsScenarioDrawerOpen: (open) => set({ isScenarioDrawerOpen: open }),
  isMemoryDrawerOpen: false,
  setIsMemoryDrawerOpen: (open) => set({ isMemoryDrawerOpen: open }),
  isRelationshipDrawerOpen: false,
  setIsRelationshipDrawerOpen: (open) => set({ isRelationshipDrawerOpen: open }),
  isAuthorsNoteDrawerOpen: false,
  setIsAuthorsNoteDrawerOpen: (open) => set({ isAuthorsNoteDrawerOpen: open }),
  pinMemoryModalData: null,
  setPinMemoryModalData: (data) => set({ pinMemoryModalData: data }),

  selectedCharacterId: null,
  setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
  selectedSessionId: null,
  setSelectedSessionId: (id) => set({ selectedSessionId: id }),
  selectedPersonaId: null,
  setSelectedPersonaId: (id) => set({ selectedPersonaId: id }),

  editingCharacter: null,
  setEditingCharacter: (char) => set({ editingCharacter: char }),
  editingPersona: null,
  setEditingPersona: (persona) => set({ editingPersona: persona }),

  settings: DEFAULT_SETTINGS,
  setSettings: (settings) => set({ settings }),
  updateSettings: async (partial) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    set({ settings: updated });
    try {
      await db.settings.put({ id: 'global', ...updated });
    } catch (e) {
      console.error('Error saving settings to db:', e);
    }
  },

  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  activeStreamingMessage: '',
  setActiveStreamingMessage: (text) => set({ activeStreamingMessage: text }),
  abortController: null,
  setAbortController: (ac) => set({ abortController: ac }),
}));
