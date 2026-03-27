export const STORAGE_KEY = 'emojiMemoryGame';

export function loadGameData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : {
    playerName: "Player",
    highScore: { moves: Infinity, time: Infinity },
    preferences: { difficulty: 6, theme: "default" }
  };
}

export function saveGameData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}