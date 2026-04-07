import { saveSettings, loadSettings, saveBestScore, loadBestScore } from './storage.js';

// DOM references
const gameBoard    = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('scoreDisplay');
const attemptsDisplay = document.getElementById('attemptsDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const playerDisplay = document.getElementById('playerDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const resetBtn     = document.getElementById('resetBtn');
const settingsForm = document.getElementById('settingsForm');
const statusMsg    = document.getElementById('statusMessage');
const progressBar  = document.getElementById('progressBar');
const progressBarWrapper = document.getElementById('progressBarWrapper');
const playAgainBtn = document.getElementById('playAgainBtn');

// Emoji data pool (array of objects -> drives DOM rendering)
const EMOJI_POOL = [
  { emoji: '😀', label: 'grinning face' }, { emoji: '🎉', label: 'party popper' },
  { emoji: '🍎', label: 'red apple' },     { emoji: '⚽', label: 'soccer ball' },
  { emoji: '🚗', label: 'red car' },       { emoji: '🐶', label: 'dog face' },
  { emoji: '🌟', label: 'glowing star' },  { emoji: '🦋', label: 'butterfly' },
  { emoji: '🍕', label: 'pizza' },         { emoji: '🎸', label: 'guitar' },
  { emoji: '🌈', label: 'rainbow' },       { emoji: '🦁', label: 'lion face' },
];

const DIFFICULTY = { easy: { pairs: 4 }, medium: { pairs: 8 }, hard: { pairs: 12 } };

// Game state
let score = 0, attempts = 0, matchedPairs = 0, totalPairs = 0;
let firstCard = null, secondCard = null, isLocked = false;
let timerInterval = null, elapsedSeconds = 0, gameStarted = false;

// Fisher-Yates shuffle - returns a new shuffled copy each game
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderBoard() {
  gameBoard.innerHTML = '';
  const { difficulty } = loadSettings();
  const { pairs } = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  totalPairs = pairs;
  matchedPairs = 0;

  const selected = shuffle(EMOJI_POOL).slice(0, pairs);
  const deck = shuffle([...selected, ...selected]);
  deck.forEach((card, i) => {
    const btn = document.createElement('button');
    btn.className = 'memory-card';
    btn.dataset.emoji = card.emoji;
    btn.dataset.label = card.label;
    btn.setAttribute('aria-label', `Hidden card ${i + 1}. Click to reveal.`);
    btn.setAttribute('aria-pressed', 'false');
    btn.tabIndex = 0;
    btn.innerHTML = `<span class="card-face card-back" aria-hidden="true">?</span>
                     <span class="card-face card-front" aria-hidden="true">${card.emoji}</span>`;
    btn.addEventListener('click', flipCard);
    gameBoard.appendChild(btn);
  });
  updateProgress();
}

function flipCard(e) {
  const card = e.currentTarget;
  if (isLocked || card === firstCard || card.classList.contains('is-matched') || card.classList.contains('is-flipped')) return;

  if (!gameStarted) {
    gameStarted = true;
    timerInterval = setInterval(() => { timerDisplay.textContent = 'Time: ' + (++elapsedSeconds) + 's'; }, 1000);
    statusMsg.textContent = 'Good luck! Match all the pairs.';
  }

  card.classList.add('is-flipped');
  card.setAttribute('aria-label', card.dataset.label + ' card revealed.');
  card.setAttribute('aria-pressed', 'true');

  if (!firstCard) { firstCard = card; return; }

  secondCard = card;
  attempts++;
  attemptsDisplay.textContent = 'Attempts: ' + attempts;
  isLocked = true;

  if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
    [firstCard, secondCard].forEach(c => {
      c.classList.add('is-matched');
      c.setAttribute('aria-label', c.dataset.label + ' - matched!');
      c.disabled = true;
    });
    score += Math.max(10, 50 - attempts);
    matchedPairs++;
    scoreDisplay.textContent = 'Score: ' + score;
    updateProgress();
    firstCard = secondCard = null;
    isLocked = false;
    if (matchedPairs === totalPairs) winGame();
  } else {
    setTimeout(() => {
      [firstCard, secondCard].forEach(c => {
        c.classList.remove('is-flipped');
        c.setAttribute('aria-label', 'Hidden card. Click to reveal.');
        c.setAttribute('aria-pressed', 'false');
      });
      firstCard = secondCard = null;
      isLocked = false;
    }, 1000);
  }
}

function updateProgress() {
  const pct = totalPairs > 0 ? Math.round((matchedPairs / totalPairs) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressBarWrapper.setAttribute('aria-valuenow', pct);
}

function winGame() {
  clearInterval(timerInterval);
  statusMsg.textContent = 'You won! All pairs matched!';
  const best = loadBestScore();
  if (best === null || score > best) {
    saveBestScore(score);
    highScoreDisplay.textContent = 'Best: ' + score;
  }
  document.getElementById('winStats').textContent = `Score: ${score} | Attempts: ${attempts} | Time: ${elapsedSeconds}s`;
  // Bootstrap Modal triggered via JS so we can call it programmatically on win
  new bootstrap.Modal(document.getElementById('winModal')).show();
}

function resetGame() {
  clearInterval(timerInterval);
  score = attempts = matchedPairs = elapsedSeconds = 0;
  firstCard = secondCard = null;
  isLocked = gameStarted = false;
  scoreDisplay.textContent = 'Score: 0';
  attemptsDisplay.textContent = 'Attempts: 0';
  timerDisplay.textContent = 'Time: 0s';
  playerDisplay.textContent = 'Player: ' + (loadSettings().playerName || '-');
  renderBoard();
  statusMsg.textContent = 'Cards shuffled! Click any card to start.';
}

function applySettings() {
  const s = loadSettings();
  document.body.dataset.theme = s.theme || 'light';
  playerDisplay.textContent = 'Player: ' + (s.playerName || '-');
  const d = document.getElementById('difficultySelect');
  const t = document.getElementById('themeSelect');
  const n = document.getElementById('playerName');
  if (d) d.value = s.difficulty;
  if (t) t.value = s.theme;
  if (n) n.value = s.playerName;
  highScoreDisplay.textContent = 'Best: ' + (loadBestScore() ?? '-');
}

// Settings form with Constraint Validation API
settingsForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!settingsForm.checkValidity()) { settingsForm.classList.add('was-validated'); return; }
  saveSettings(
    document.getElementById('playerName').value.trim(),
    document.getElementById('difficultySelect').value,
    document.getElementById('themeSelect').value
  );
  applySettings();
  settingsForm.classList.remove('was-validated');
  statusMsg.textContent = 'Settings saved! Click Play / Reset to start a new game.';
});

resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', () => {
  bootstrap.Modal.getInstance(document.getElementById('winModal'))?.hide();
  setTimeout(resetGame, 300);
});

// Easter Egg - type unlockSecret() in the browser console!
console.log('%c🃏 Emoji Memory Match Easter Egg! Type unlockSecret() to unlock a rainbow theme!', 'color:#6f42c1;font-weight:bold;');
window.unlockSecret = () => {
  document.body.classList.toggle('theme-rainbow');
  statusMsg.textContent = 'Rainbow theme toggled! 🌈';
  console.log('%c🌈 Rainbow theme toggled!', 'color:#fd7e14;');
};

// Init
applySettings();
statusMsg.textContent = 'Enter your name above and click Play / Reset to start!';
