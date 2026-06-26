import { create } from 'zustand';

interface PlayerState {
  playerId: string | null;
  playerName: string | null;
  challengeId: string | null;
  sessionId: string | null;
  setPlayerInfo: (playerId: string, playerName: string, challengeId: string, sessionId: string) => void;
  clearPlayerInfo: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  playerId: localStorage.getItem('playerId'),
  playerName: localStorage.getItem('playerName'),
  challengeId: localStorage.getItem('challengeId'),
  sessionId: localStorage.getItem('sessionId'),
  setPlayerInfo: (playerId, playerName, challengeId, sessionId) => {
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('challengeId', challengeId);
    localStorage.setItem('sessionId', sessionId);
    set({ playerId, playerName, challengeId, sessionId });
  },

  clearPlayerInfo: () => {
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    localStorage.removeItem('challengeId');
    localStorage.removeItem('sessionId');
    set({ playerId: null, playerName: null, challengeId: null, sessionId: null });
  },
}));
