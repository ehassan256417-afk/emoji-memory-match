import { saveSettings, loadSettings } from './storage.js';

const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('scoreDisplay');
const playerDisplay = document.getElementById('playerDisplay');
const resetBtn = document.getElementById('resetBtn');
const settingsForm = document.getElementById('settingsForm');

let score = 0;
let firstCard = null;
let secondCard = null;

// Emoji pairs
const cards = [
    {emoji: '😀'}, {emoji: '😀'},
    {emoji: '🎉'}, {emoji: '🎉'},
    {emoji: '🍎'}, {emoji: '🍎'},
    {emoji: '⚽'}, {emoji: '⚽'},
    {emoji: '🚗'}, {emoji: '🚗'},
    {emoji: '🐶'}, {emoji: '🐶'}
];

// Shuffle array
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Render the board
function renderBoard() {
    gameBoard.innerHTML = '';
    shuffle(cards).forEach((card, index) => {
        const div = document.createElement('div');
        div.className = 'col-3 card text-center py-4 fs-1';
        div.dataset.index = index;
        div.dataset.emoji = card.emoji;
        div.textContent = '❓';
        div.addEventListener('click', flipCard);
        gameBoard.appendChild(div);
    });
}

// Flip logic
function flipCard(e) {
    const card = e.currentTarget;
    if (card === firstCard || card.classList.contains('matched')) return;

    card.textContent = card.dataset.emoji;

    if (!firstCard) {
        firstCard = card;
        return;
    }
    secondCard = card;

    if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
    } else {
        setTimeout(() => {
            firstCard.textContent = '❓';
            secondCard.textContent = '❓';
        }, 1000);
    }
    firstCard = null;
    secondCard = null;
}

// Reset game
function resetGame() {
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    renderBoard();
}

// Settings
function applySettings() {
    const settings = loadSettings();
    playerDisplay.textContent = `Player: ${settings.playerName || '-'}`;
    document.body.dataset.theme = settings.theme;
}

// Form validation
settingsForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!settingsForm.checkValidity()) {
        settingsForm.classList.add('was-validated');
        return;
    }
    const name = document.getElementById('playerName').value;
    const theme = document.getElementById('themeSelect').value;
    saveSettings(name, theme);
    applySettings();
});

resetBtn.addEventListener('click', resetGame);

// Init
applySettings();
resetGame();

// Easter egg
console.log("Hint: Try flipping the '🚗' card first for a fun surprise!");
