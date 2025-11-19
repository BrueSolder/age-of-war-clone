# Quick Start Guide

## 🎮 How to Play
1. Open `game.html` in your browser
2. That's it! The game loads automatically

## 📁 File Structure (Simple)

```
website/
├── game.html          ← Open this to play!
├── css/styles.css     ← Edit game styles here
└── js/game-core.js    ← All game code here
```

## ✏️ Common Edits

### Change Game Balance
**File:** `js/game-core.js`
- Search for `ageSettings` to modify unit stats
- Search for `INITIAL_GOLD` to change starting resources

### Modify Styling
**File:** `css/styles.css`
- Change colors, sizes, animations
- All CSS is organized by component

### Add New Features
**File:** `js/game-core.js`
- Add new units to `ageSettings`
- Add new defenses to `defenseSettings`
- Modify AI behavior in AI functions

## 🔧 Backups
Your original file is safely backed up:
- `index.html` - Original version
- `index-backup-full.html` - Additional backup

## 📝 Notes
- All game functionality is preserved
- No build tools required
- Works offline
- Compatible with all modern browsers
