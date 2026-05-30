import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '../types/ai';

interface ChatStoreState {
  currentSessionId: string | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  messagesError: string | null;

  setCurrentSessionId: (sessionId: string | null) => void;
  setMessagesLoading: (loading: boolean) => void;
  setMessagesError: (error: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessages: (messages: ChatMessage[]) => void;
  appendOptimisticMessage: (content: string) => string;
  removeMessage: (messageId: string) => void;
  resetChatState: () => void;
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
  currentSessionId: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,

  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),
  setMessagesError: (error) => set({ messagesError: error }),
  setMessages: (messages) => set({ messages }),

  appendMessages: (messages) => set((state) => ({
    messages: [...state.messages, ...messages],
  })),

  appendOptimisticMessage: (content) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sessionId: 'single',
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    return tempId;
  },

  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((item) => item.id !== messageId),
  })),

  resetChatState: () => set({
    currentSessionId: null,
    messages: [],
    messagesLoading: false,
    messagesError: null,
  }),
  }),
  {
    name: 'chat-storage',
    partialize: (state) => ({ 
      currentSessionId: state.currentSessionId,
      messages: state.messages 
    }),
  }
));
