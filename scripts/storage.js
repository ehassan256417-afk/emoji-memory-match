/**
 * storage.js — ES Module for persisting game data
 * Uses localStorage to save/load player settings and best scores.
 * All keys are prefixed with 'emj_' to avoid naming collisions.
 */

const PREFIX = 'emj_';

// ─── SAVE SETTINGS ─────────────────────────────────────────────────────────
/**
 * saveSettings(name, difficulty, theme)
 * Persists player name, difficulty, and theme preference to localStorage.
 * Called on settings form submit.
 */
export function saveSettings(name, difficulty, theme) {
  localStorage.setItem(PREFIX + 'playerName', name);
  localStorage.setItem(PREFIX + 'difficulty', difficulty || 'medium');
  localStorage.setItem(PREFIX + 'theme', theme || 'light');
}

// ─── LOAD SETTINGS ─────────────────────────────────────────────────────────
/**
 * loadSettings()
 * Returns an object with the current player settings.
 * Falls back to defaults if nothing is saved yet.
 */
export function loadSettings() {
  return {
    playerName: localStorage.getItem(PREFIX + 'playerName') || '',
    difficulty: localStorage.getItem(PREFIX + 'difficulty') || 'medium',
    theme:      localStorage.getItem(PREFIX + 'theme')      || 'light',
  };
}

// ─── SAVE BEST SCORE ───────────────────────────────────────────────────────
/**
 * saveBestScore(score)
 * Stores the player's all-time best score in localStorage.
 */
export function saveBestScore(score) {
  localStorage.setItem(PREFIX + 'bestScore', String(score));
}

// ─── LOAD BEST SCORE ───────────────────────────────────────────────────────
/**
 * loadBestScore()
 * Returns the stored best score as a number, or null if none exists.
 */
export function loadBestScore() {
  const stored = localStorage.getItem(PREFIX + 'bestScore');
  return stored !== null ? Number(stored) : null;
}

// ─── CLEAR ALL ─────────────────────────────────────────────────────────────
/**
 * clearAll()
 * Removes all game-related keys from localStorage.
 * Available for the easter egg / dev use.
 */
export function clearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
