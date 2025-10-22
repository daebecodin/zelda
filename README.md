# 🗡️ Zelda JS
A Legend of Zelda-inspired dungeon crawler game built with vanilla JavaScript, HTML, and CSS.

Click here to deploy your project for free: [DEPLOY!](https://bit.ly/sevalla-deploy)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🎮 About

This is a browser-based recreation of classic Zelda dungeon gameplay featuring Link as he navigates through rooms filled with enemies. Battle slicers and skeletors as you progress through multiple levels!

## ✨ Features

- **Classic dungeon exploration** with walls, doors, and decorative elements
- **Two enemy types:**
  - **Slicers** - horizontal moving enemies
  - **Skeletors** - vertical moving enemies with random direction changes
- **Combat system** with directional attacks
- **Multi-level progression** - defeat all enemies to advance
- **Score tracking** system
- **Smooth animations** using requestAnimationFrame
- **Collision detection** for walls, enemies, and attacks
- **Retro pixel art** sprites and tileset

## 🎯 How to Play

### Controls
- **Arrow Keys** - Move Link in four directions
- **Spacebar** - Attack in the direction Link is facing

### Objective
- Navigate through dungeon rooms
- Defeat all enemies in each level
- Use doors or stairs to progress to the next level
- Avoid enemy contact or it's game over!

### Game Mechanics
- You must defeat all enemies before you can exit through doors or stairs
- Attacking spawns a "kaboom" effect in the direction you're facing
- Enemies move in patterns - slicers horizontally, skeletors vertically
- Your score increases with each enemy defeated

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools or dependencies required!

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kubowania/zelda-js.git
```

2. Navigate to the project directory:
```bash
cd zelda-js
```

3. Open `index.html` in your browser:
```bash
open index.html
```

Or simply double-click the `index.html` file.

Click here to deploy your project for free: [DEPLOY!](https://bit.ly/sevalla-deploy)

## 📁 Project Structure

```
zelda-js/
├── index.html          # Main HTML file
├── app.js              # Game logic and mechanics
├── style.css           # Styling and animations
├── images/             # Sprite assets
│   ├── Link sprites (4 directions)
│   ├── Wall and corner tiles
│   ├── Enemy sprites
│   ├── Environmental objects
│   └── Background tileset
└── README.md
```

## 🛠️ Technical Details

### Technologies Used
- **Vanilla JavaScript** (ES6+)
- **HTML5**
- **CSS3** with animations
- **DOM manipulation** for dynamic game elements

### Key Features Implementation
- Grid-based movement system (10x9 grid)
- Character-based map encoding for level design
- Delta-time based enemy movement for smooth animation
- Collision detection using grid position checking
- Event-driven player controls

### Map Encoding
The game uses a character-based encoding system for level design:
- `y,w,x,z` = Corner walls
- `a,b` = Side walls
- `c,d` = Top/bottom walls
- `)` = Lanterns
- `(` = Fire pots
- `%` = Left door
- `^` = Top door
- `$` = Stairs
- `*` = Slicer enemy
- `}` = Skeletor enemy
- ` ` (space) = Walkable area

## 🎨 Customization

You can easily customize the game by:
- **Adding new levels** - Edit the `maps` array in `app.js`
- **Adjusting difficulty** - Modify enemy speed values
- **Changing sprites** - Replace image files in the `images/` folder
- **Adding new enemy types** - Extend the enemy creation functions

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

- This project is [MIT](LICENSE) licensed.
- This project is licensed under the Hippocratic License 3.0 with the AI Training Addendum. You may not use this code, documentation, or any associated materials to train, fine-tune, evaluate, or improve artificial intelligence or machine learning models without explicit written permission from the author. See [LICENSE](https://firstdonoharm.dev/) for full terms.


## 👤 Author

**Ania Kubów**
- GitHub: [@kubowania](https://github.com/kubowania)

## 🙏 Acknowledgments

- Inspired by The Legend of Zelda (Nintendo)
- Sprites and assets are used for educational purposes

## AI Training Exclusion
This repository and its contents may not be used for training artificial intelligence or machine learning models.

---

**Note:** This is a fan-made educational project and is not affiliated with or endorsed by Nintendo.


