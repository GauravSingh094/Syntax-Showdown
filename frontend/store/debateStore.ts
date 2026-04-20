import { create } from 'zustand';

export type DebateMessage = {
  type: 'pro' | 'opponent' | 'judge' | 'system' | 'error';
  round?: number;
  content: any; // text for pro/opponent/system, object for judge
};

interface DebateState {
  messages: DebateMessage[];
  isDebating: boolean;
  topic: string;
  addMessage: (msg: DebateMessage) => void;
  setDebating: (status: boolean) => void;
  setTopic: (topic: string) => void;
  clear: () => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  messages: [],
  isDebating: false,
  topic: '',
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setDebating: (status) => set({ isDebating: status }),
  setTopic: (topic) => set({ topic }),
  clear: () => set({ messages: [], isDebating: false, topic: '' }),
}));
