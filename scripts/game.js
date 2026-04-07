/**
 * game.js — Main game module for Emoji Memory Match
 * Imports: storage.js (ES Module)
 * Responsibilities: render board, handle game logic, manage state
 *
 * Easter Egg hint: Open the browser console and type: unlockSecret()
 * This triggers a rainbow theme animation!
 */

import { saveSettings, loadSettings, saveBestScore, loadBestScore } from './storage.js';

// ─── DOM REFERENCES ────────────────────────────────────────────────────────
const gameBoard      = document.getElementById('gameBoard');
const scoreDisplay   = document.getElementById('scoreDisplay');
const attemptsDisplay = document.getElementById('attemptsDisplay');
const timerDisplay   = document.getElementById('timerDisplay');
const playerDisplay  = document.getElementById('playerDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const resetBtn       = document.getElementById('resetBtn');
const settingsForm   = document.getElementById('settingsForm');
const statusMessage  = document.getElementById('statusMessage');
const progressBar    = document.getElementById('progressBar');
const progressBarWrapper = document.getElementById('progressBarWrapper');
const playAgainBtn   = document.getElementById('playAgainBtn');

// ─── DATA: All available emoji cards (array of objects used for DOM templating) ──
const EMOJI_POOL = [
  { emoji: '😀', label: 'grinning face' },
  { emoji: '🎉', label: 'party popper' },
  { emoji: '🍎', label: 'red apple' },
  { emoji: '⚽', label: 'soccer ball' },
  { emoji: '🚗', label: 'red car' },
  { emoji: '🐶', label: 'dog face' },
  { emoji: '🌟', label: 'glowing star' },
  { emoji: '🦋', label: 'butterfly' },
  { emoji: '🍕', label: 'pizza' },
  { emoji: '🎸', label: 'guitar' },
  { emoji: '🌈', label: 'rainbow' },
  { emoji: '🦁', label: 'lion face' },
];

// ─── GAME STATE ─────────────────────────────────────────────────────────────
let score         = 0;
let attempts      = 0;
let matchedPairs  = 0;
let totalPairs    = 0;
let firstCard     = null;
let secondCard    = null;
let isLocked      = false;   // prevents flipping during mismatch delay
let timerInterval = null;
let elapsedSeconds = 0;
let gameStarted   = false;
let currentDifficulty = 'medium';

// ─── DIFFICULTY SETTINGS ────────────────────────────────────────────────────
const DIFFICULTY = {
  easy:   { pairs: 4 },
  medium: { pairs: 8 },
  hard:   { pairs: 12 },
};

// ─── SHUFFLE (Fisher-Yates) ─────────────────────────────────────────────────
/**
 * shuffle(array) — Fisher-Yates algorithm
 * Returns a NEW shuffled copy; does not mutate original.
 * Used to randomize the card order each new game.
 */
function shuffle(array) {
  const arr = [...array]; // copy to avoid mutating EMOJI_POOL
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── RENDER BOARD ───────────────────────────────────────────────────────────
/**
 * renderBoard() — Builds the game grid from shuffled EMOJI_POOL data.
 * Uses the data array (EMOJI_POOL) to generate DOM elements dynamically.
 * Each card is accessible: role="button", aria-label, keyboard support.
 */
function renderBoard() {
  gameBoard.innerHTML = '';
  const settings   = loadSettings();
  currentDifficulty = settings.difficulty || 'medium';
  const { pairs }  = DIFFICULTY[currentDifficulty] || DIFFICULTY.medium;
  totalPairs       = pairs;
  matchedPairs     = 0;

  // Pick the first N emojis and duplicate for pairs
  const selected = shuffle(EMOJI_POOL).slice(0, pairs);
  const deck     = shuffle([...selected, ...selected]); // duplicate & re-shuffle

  deck.forEach((card, index) => {
    const col = document.createElement('div');
    col.className = 'card-col';

    const cardEl = document.createElement('button');
    cardEl.className     = 'memory-card';
    cardEl.dataset.emoji = card.emoji;
    cardEl.dataset.label = card.label;
    cardEl.setAttribute('role', 'button');
    cardEl.setAttribute('aria-label', 'Hidden card ' + (index + 1) + '. Click to reveal.');
    cardEl.setAttribute('aria-pressed', 'false');
    cardEl.tabIndex = 0;

    // Front face (back of card — hidden state)
    const front = document.createElement('span');
    front.className     = 'card-face card-back';
    front.setAttribute('aria-hidden', 'true');
    front.textContent   = '?';

    // Back face (emoji face — revealed state)
    const back  = document.createElement('span');
    back.className      = 'card-face card-front';
    back.setAttribute('aria-hidden', 'true');
    back.textContent    = card.emoji;

    cardEl.appendChild(front);
    cardEl.appendChild(back);
    cardEl.addEventListener('click', flipCard);
    col.appendChild(cardEl);
    gameBoard.appendChild(col);
  });

  updateProgress();
}

// ─── FLIP CARD ──────────────────────────────────────────────────────────────
function flipCard(e) {
  const card = e.currentTarget;
  if (isLocked) return;
  if (card === firstCard) return;
  if (card.classList.contains('is-matched')) return;
  if (card.classList.contains('is-flipped')) return;

  // Start timer on first flip
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
    setStatus('Good luck! Match all the pairs.');
  }

  card.classList.add('is-flipped');
  card.setAttribute('aria-label', card.dataset.label + ' card revealed.');
  card.setAttribute('aria-pressed', 'true');

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  attempts++;
  attemptsDisplay.textContent = 'Attempts: ' + attempts;
  isLocked = true;

  if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
    // MATCH!
    matchPair();
  } else {
    // MISMATCH — flip back
    setTimeout(unmatchPair, 1000);
  }
}

// ─── MATCH PAIR ─────────────────────────────────────────────────────────────
function matchPair() {
  firstCard.classList.add('is-matched');
  secondCard.classList.add('is-matched');
  firstCard.setAttribute('aria-label', firstCard.dataset.label + ' — matched!');
  secondCard.setAttribute('aria-label', secondCard.dataset.label + ' — matched!');
  firstCard.disabled = true;
  secondCard.disabled = true;

  score += Math.max(10, 50 - attempts); // score formula: reward fewer attempts
  matchedPairs++;
  scoreDisplay.textContent = 'Score: ' + score;
  updateProgress();

  firstCard = null;
  secondCard = null;
  isLocked = false;

  if (matchedPairs === totalPairs) {
    winGame();
  }
}

// ─── UNMATCH PAIR ────────────────────────────────────────────────────────────
function unmatchPair() {
  firstCard.classList.remove('is-flipped');
  secondCard.classList.remove('is-flipped');
  firstCard.setAttribute('aria-label', 'Hidden card. Click to reveal.');
  secondCard.setAttribute('aria-label', 'Hidden card. Click to reveal.');
  firstCard.setAttribute('aria-pressed', 'false');
  secondCard.setAttribute('aria-pressed', 'false');
  firstCard  = null;
  secondCard = null;
  isLocked   = false;
}

// ─── TIMER ──────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    timerDisplay.textContent = 'Time: ' + elapsedSeconds + 's';
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// ─── PROGRESS BAR ───────────────────────────────────────────────────────────
function updateProgress() {
  const pct = totalPairs > 0 ? Math.round((matchedPairs / totalPairs) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressBarWrapper.setAttribute('aria-valuenow', pct);
}

// ─── WIN GAME ───────────────────────────────────────────────────────────────
function winGame() {
  stopTimer();
  setStatus('You won! All pairs matched!');

  // Save best score
  const best = loadBestScore();
  if (best === null || score > best) {
    saveBestScore(score);
    highScoreDisplay.textContent = 'Best: ' + score;
  }

  // Show win modal
  const winStatsEl = document.getElementById('winStats');
  winStatsEl.textContent =
    'Score: ' + score + ' | Attempts: ' + attempts + ' | Time: ' + elapsedSeconds + 's';

  // Bootstrap modal via JS (we need JS init here because we want to trigger it programmatically)
  const winModalEl = document.getElementById('winModal');
  const winModal   = new bootstrap.Modal(winModalEl);
  winModal.show();
}

// ─── STATUS MESSAGE ──────────────────────────────────────────────────────────
function setStatus(msg) {
  statusMessage.textContent = msg;
}

// ─── RESET GAME ─────────────────────────────────────────────────────────────
function resetGame() {
  stopTimer();
  score         = 0;
  attempts      = 0;
  matchedPairs  = 0;
  firstCard     = null;
  secondCard    = null;
  isLocked      = false;
  gameStarted   = false;
  elapsedSeconds = 0;

  scoreDisplay.textContent    = 'Score: 0';
  attemptsDisplay.textContent = 'Attempts: 0';
  timerDisplay.textContent    = 'Time: 0s';

  const settings = loadSettings();
  playerDisplay.textContent = 'Player: ' + (settings.playerName || '—');

  renderBoard();
  setStatus('Cards shuffled! Click any card to start.');
}

// ─── APPLY SETTINGS ─────────────────────────────────────────────────────────
function applySettings() {
  const settings = loadSettings();
  // Theme
  document.body.dataset.theme = settings.theme || 'light';
  // Player name
  playerDisplay.textContent = 'Player: ' + (settings.playerName || '—');
  // Difficulty selector
  const diffEl = document.getElementById('difficultySelect');
  if (diffEl && settings.difficulty) diffEl.value = settings.difficulty;
  // Theme selector
  const themeEl = document.getElementById('themeSelect');
  if (themeEl && settings.theme) themeEl.value = settings.theme;
  // Player name field
  const nameEl = document.getElementById('playerName');
  if (nameEl && settings.playerName) nameEl.value = settings.playerName;
  // Best score
  const best = loadBestScore();
  highScoreDisplay.textContent = 'Best: ' + (best !== null ? best : '—');
}

// ─── SETTINGS FORM ──────────────────────────────────────────────────────────
settingsForm.addEventListener('submit', e => {
  e.preventDefault();

  // Constraint Validation API
  if (!settingsForm.checkValidity()) {
    settingsForm.classList.add('was-validated');
    return;
  }

  const name       = document.getElementById('playerName').value.trim();
  const difficulty = document.getElementById('difficultySelect').value;
  const theme      = document.getElementById('themeSelect').value;

  saveSettings(name, difficulty, theme);
  applySettings();
  settingsForm.classList.remove('was-validated');
  setStatus('Settings saved! Click Play / Reset to start a new game.');
});

// ─── EVENT LISTENERS ────────────────────────────────────────────────────────
resetBtn.addEventListener('click', resetGame);

// Play Again button in win modal
if (playAgainBtn) {
  playAgainBtn.addEventListener('click', () => {
    // Close the modal
    const winModalEl = document.getElementById('winModal');
    const winModal   = bootstrap.Modal.getInstance(winModalEl);
    if (winModal) winModal.hide();
    setTimeout(resetGame, 300);
  });
}

// ─── EASTER EGG ─────────────────────────────────────────────────────────────
// Console hint — type unlockSecret() in the browser console to activate!
console.log('%c🃏 Emoji Memory Match Easter Egg!', 'font-size:16px; color:#6f42c1; font-weight:bold;');
console.log('%cType unlockSecret() in the console to unlock a rainbow theme!', 'color:#6c757d;');

window.unlockSecret = function() {
  document.body.classList.toggle('theme-rainbow');
  console.log('%c🌈 Rainbow theme toggled!', 'font-size:14px; color:#fd7e14;');
  // Also load some sample demo data for fun
  const settings = loadSettings();
  if (!settings.playerName) {
    document.getElementById('playerName').value = 'Rainbow Player';
    setStatus('Rainbow theme unlocked! Your name has been set to Rainbow Player 🌈');
  } else {
    setStatus('Rainbow theme toggled! 🌈');
  }
};

// ─── INIT ────────────────────────────────────────────────────────────────────
applySettings();
setStatus('Enter your name above and click Play / Reset to start!');
