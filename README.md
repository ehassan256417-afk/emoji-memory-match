# 🐶 Emoji Memory Match

**Date:** March 26, 2026  
**Game Objective:** Match all emoji pairs as quickly as possible with the fewest moves.

## Brief Rules
- Click two cards to flip them  
- Matching pairs stay open  
- Non-matching pairs flip back after 1 second  
- First click starts the timer  

## Tech Used
- Semantic HTML5 + Bootstrap 5 (Navbar + Modals)  
- Custom CSS with Google Font (`Press Start 2P`)  
- ES Modules (`game.js`, `storage.js`)  
- localStorage for player name, difficulty & high score  
- Client-side validation using Constraint Validation API  

## Wireframe
![Wireframe](images/wireframe.png)

## Code Snippet Explanation
```js
// From scripts/game.js - Randomization requirement
function createDeck(numPairs) {
  const selected = emojiPool.slice(0, numPairs);
  let newDeck = [];
  selected.forEach((emoji, i) => {
    newDeck.push({ id: i * 2, emoji, matched: false });
    newDeck.push({ id: i * 2 + 1, emoji, matched: false });
  });
  return newDeck.sort(() => Math.random() - 0.5); // Fisher-Yates style shuffle
}