import { loadGameData, saveGameData } from './storage.js';

const emojiPool = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🐸','🐵'];

let deck = [];
let flippedCards = [];
let moves = 0;
let time = 0;
let timerInterval = null;
let matches = 0;
let totalPairs = 6;
let gameStarted = false;

const boardEl       = document.getElementById('gameBoard');
const movesDisplay  = document.getElementById('movesDisplay');
const timerDisplay  = document.getElementById('timerDisplay');
const progressBar   = document.getElementById('progressBar');
const progressText  = document.getElementById('progressText');
const playerDisplay = document.getElementById('playerDisplay');
const resetBtn      = document.getElementById('resetBtn');

let currentData = loadGameData();

// Easter Egg
console.log('%c🎮 Easter Egg: Type unlockSecret() in the console!', 'color: #0d6efd; font-size: 14px;');
window.unlockSecret = () => {
    document.documentElement.classList.add('dark');
    console.log('🌟 Secret dark theme activated!');
};

// Create shuffled deck
function createDeck(numPairs) {
    const selected = emojiPool.slice(0, numPairs);
    let newDeck = [];
    selected.forEach((emoji, i) => {
          newDeck.push({ id: i * 2,     emoji, matched: false });
          newDeck.push({ id: i * 2 + 1, emoji, matched: false });
    });
    // Fisher-Yates style shuffle
  return newDeck.sort(() => Math.random() - 0.5);
}

// Render the board
function renderBoard() {
    boardEl.innerHTML = '';
    deck.forEach((card, index) => {
          const cardEl = document.createElement('div');
          cardEl.className = 'memory-card';
          cardEl.dataset.index = index;
          cardEl.setAttribute('role', 'button');
          cardEl.setAttribute('tabindex', '0');
          cardEl.setAttribute('aria-label', `Card ${index + 1}, face down`);
          cardEl.innerHTML = `
                <div class="inner">
                        <div class="front">❓</div>
                                <div class="back">${card.emoji}</div>
                                      </div>
                                          `;
          cardEl.addEventListener('click', () => handleCardClick(cardEl, index));
          // Keyboard support so cards are operable without a mouse
                     cardEl.addEventListener('keydown', (e) => {
                             if (e.key === 'Enter' || e.key === ' ') {
                                       e.preventDefault();
                                       handleCardClick(cardEl, index);
                             }
                     });
          boardEl.appendChild(cardEl);
    });
}

function handleCardClick(cardEl, index) {
    if (!gameStarted) {
          startTimer();
          gameStarted = true;
    }
    if (flippedCards.length >= 2 || cardEl.classList.contains('flipped') || deck[index].matched) {
          return;
    }
    cardEl.classList.add('flipped');
    cardEl.setAttribute('aria-label', `Card ${index + 1}, ${deck[index].emoji}`);
    flippedCards.push({ el: cardEl, index });

  if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkForMatch();
  }
}

function checkForMatch() {
    const [first, second] = flippedCards;
    const card1 = deck[first.index];
    const card2 = deck[second.index];

  if (card1.emoji === card2.emoji) {
        card1.matched = true;
        card2.matched = true;
        first.el.classList.add('matched');
        second.el.classList.add('matched');
        first.el.setAttribute('aria-label', `Card ${first.index + 1}, ${card1.emoji}, matched`);
        second.el.setAttribute('aria-label', `Card ${second.index + 1}, ${card2.emoji}, matched`);
        matches++;
        updateProgress();
        if (matches === totalPairs) {
                setTimeout(endGame, 600);
        }
        flippedCards = [];
  } else {
        setTimeout(() => {
                first.el.classList.remove('flipped');
                second.el.classList.remove('flipped');
                first.el.setAttribute('aria-label', `Card ${first.index + 1}, face down`);
                second.el.setAttribute('aria-label', `Card ${second.index + 1}, face down`);
                flippedCards = [];
        }, 1000);
  }
}

function updateProgress() {
    const percent = Math.round((matches / totalPairs) * 100);
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
    progressText.textContent = `${matches} / ${totalPairs} matched`;
}

function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
          time++;
          const min = Math.floor(time / 60).toString().padStart(2, '0');
          const sec = (time % 60).toString().padStart(2, '0');
          timerDisplay.textContent = `${min}:${sec}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function endGame() {
    stopTimer();
    const finalTime = time;
    const finalMoves = moves;

  // Show win modal instead of alert() for accessibility
  document.getElementById('winMessage').textContent =
        `🎉 ${currentData.playerName} — ${finalMoves} moves in ${finalTime}s!`;

  let hsMsg = '';
    if (finalMoves < (currentData.highScore?.moves || Infinity)) {
          currentData.highScore = { moves: finalMoves, time: finalTime };
          saveGameData(currentData);
          hsMsg = '🏆 New High Score!';
    }
    document.getElementById('winHighScore').textContent = hsMsg;

  const winModalEl = document.getElementById('winModal');
    const winModal = new bootstrap.Modal(winModalEl);
    winModal.show();
}

function resetGame() {
    stopTimer();
    time        = 0;
    moves       = 0;
    matches     = 0;
    flippedCards = [];
    gameStarted = false;
    totalPairs  = parseInt(currentData.preferences?.difficulty || 6);
    deck        = createDeck(totalPairs);

  movesDisplay.textContent = '0';
    timerDisplay.textContent = '00:00';
    progressBar.style.width  = '0%';
    progressBar.setAttribute('aria-valuenow', 0);
    progressText.textContent = `0 / ${totalPairs} matched`;
    renderBoard();
}

// Play Again button inside win modal
document.getElementById('winPlayAgainBtn').addEventListener('click', resetGame);

// Settings Form
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
    document.getElementById('playerNameInput').value  = currentData.playerName || 'Player';
    document.getElementById('difficultyInput').value  = currentData.preferences?.difficulty || 6;

  settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!settingsForm.checkValidity()) {
                settingsForm.classList.add('was-validated');
                return;
        }
        currentData.playerName = document.getElementById('playerNameInput').value.trim();
        currentData.preferences = currentData.preferences || {};
        currentData.preferences.difficulty = parseInt(document.getElementById('difficultyInput').value);
        saveGameData(currentData);
        playerDisplay.textContent = currentData.playerName;
        bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
        resetGame();
  });
}

playerDisplay.textContent = currentData.playerName || 'Player';
resetGame();

// Reset button in navbar
resetBtn.addEventListener('click', resetGame);
