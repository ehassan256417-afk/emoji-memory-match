// storage.js - localStorage helpers (ES Module)
const PREFIX = 'emj_';

export function saveSettings(name, difficulty, theme) {
  localStorage.setItem(PREFIX + 'playerName', name);
  localStorage.setItem(PREFIX + 'difficulty', difficulty || 'medium');
  localStorage.setItem(PREFIX + 'theme', theme || 'light');
}

export function loadSettings() {
  return {
    playerName: localStorage.getItem(PREFIX + 'playerName') || '',
    difficulty: localStorage.getItem(PREFIX + 'difficulty') || 'medium',
    theme:      localStorage.getItem(PREFIX + 'theme') || 'light',
  };
}

export function saveBestScore(score) {
  localStorage.setItem(PREFIX + 'bestScore', String(score));
}

export function loadBestScore() {
  const stored = localStorage.getItem(PREFIX + 'bestScore');
  return stored !== null ? Number(stored) : null;
}
