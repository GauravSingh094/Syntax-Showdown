import { create } from 'zustand';

export type DebateMessage = {
  id: string;
  role: 'pro' | 'opponent' | 'judge' | 'system' | 'error' | 'sides' | 'done';
  content: string;
  round: number;
  provider: string;
  timestamp: string;
};

interface DebateState {
  messages: DebateMessage[];
  isDebating: boolean;
  topic: string;
  currentRound: number;
  totalRounds: number;
  addMessage: (msg: DebateMessage) => void;
  setDebating: (status: boolean) => void;
  setTopic: (topic: string) => void;
  setCurrentRound: (r: number) => void;
  setTotalRounds: (r: number) => void;
  clear: () => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  messages: [],
  isDebating: false,
  topic: '',
  currentRound: 0,
  totalRounds: 0,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setDebating: (status) => set({ isDebating: status }),
  setTopic: (topic) => set({ topic }),
  setCurrentRound: (r) => set({ currentRound: r }),
  setTotalRounds: (r) => set({ totalRounds: r }),
  clear: () => set({ messages: [], isDebating: false, topic: '', currentRound: 0, totalRounds: 0 }),
}));
