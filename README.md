# 🐶 Emoji Memory Match

**Date:** March 2026  
**A small, polished single-page memory match game** built with Bootstrap 5, modern JavaScript, and localStorage.

## Objective
Match all emoji pairs with the fewest moves and fastest time!

## How to Play
- Click two cards to flip them
- Matching pairs stay face up
- Non-matching pairs flip back after 1 second
- Beat your personal best!

## Tech Stack
- HTML5 (semantic)
- Bootstrap 5 (Navbar + Modals)
- Custom CSS with Google Font (`Press Start 2P`)
- ES6 Modules (`game.js`, `storage.js`)
- localStorage for player name + preferences
- Client-side form validation

## Wireframe
![Wireframe](images/wireframe.png)

## Code Example (Shuffle Function)
```js
function createDeck(numPairs) {
  const selected = emojiPool.slice(0, numPairs);
  let newDeck = [];
  selected.forEach((emoji, i) => {
    newDeck.push({ id: i * 2, emoji, matched: false });
    newDeck.push({ id: i * 2 + 1, emoji, matched: false });
  });
  return newDeck.sort(() => Math.random() - 0.5);   // Randomization
}