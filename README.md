# Tetris

A browser-based Tetris game served by a Node.js/Express backend. Built with vanilla HTML, CSS, and JavaScript — no frontend build step or external libraries.

---

## Requirements

- Node.js v18 or newer

---

## Setup & Run

1. **Check Node version**
   ```bash
   node --version
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   You should see: `Tetris running at http://localhost:8081`

4. **Open the game**
   Navigate to [http://localhost:8081](http://localhost:8081) in your browser.

---

## Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move left / right |
| `↑` | Rotate clockwise |
| `Z` | Rotate counter-clockwise |
| `↓` | Soft drop (1 pt/row) |
| `Space` | Hard drop (2 pts/row) |
| `C` / `Shift` | Hold piece |
| `P` | Pause / Resume |

---

## Gameplay

- **Grid:** standard 10 × 20 playfield.
- **Pieces:** all 7 tetrominoes (I, O, T, S, Z, J, L) generated with a 7-bag randomizer — every piece appears exactly once per bag before any repeats.
- **Ghost piece:** a faded preview shows where the active piece will land.
- **Hold slot:** swap the current piece into the hold slot once per piece. The held piece is shown dimmed if hold is unavailable.
- **Next queue:** the next 3 upcoming pieces are previewed on the right panel.

### Scoring

| Lines cleared | Points (× level) |
|---------------|-----------------|
| 1 (Single) | 100 |
| 2 (Double) | 300 |
| 3 (Triple) | 500 |
| 4 (Tetris) | 800 |
| Soft drop | 1 per row |
| Hard drop | 2 per row |

Level increases every 10 lines cleared. Gravity speed increases with each level.

### Lock Delay

A piece locks 500 ms after landing. Moving or rotating while grounded resets the timer (up to 15 resets per piece), allowing last-moment adjustments.

---

## Project Structure

```
tetris/
├── server.js          # Express server — serves public/ on port 8081
├── package.json
├── README.md
└── public/
    ├── index.html     # Game layout: board, hold, next, score panels
    ├── css/
    │   └── style.css  # Dark theme, responsive layout
    └── js/
        ├── main.js        # Entry point — wires DOM to Game
        ├── gameloop.js    # Game state machine, gravity, lock delay, input dispatch
        ├── board.js       # 10×20 grid, collision, line clearing, SRS rotation
        ├── pieces.js      # Tetromino shapes, SRS wall-kick tables, 7-bag randomizer
        ├── input.js       # Keyboard handler with DAS/ARR auto-repeat
        └── renderer.js    # Canvas drawing: board, ghost, active piece, next, hold
```

### Module responsibilities

| Module | Responsibility |
|--------|---------------|
| `gameloop.js` | `requestAnimationFrame` loop, frame-rate-independent timing, game states (`idle` / `playing` / `paused` / `gameover`) |
| `board.js` | Grid state, `isValid()` collision, line clearing, `tryRotate()` with SRS wall kicks |
| `pieces.js` | Piece shape data (4 rotation states per piece), SRS kick tables for JLSTZ and I, `Bag` randomizer |
| `input.js` | Keydown/keyup tracking, one-shot action queue, DAS (133 ms) + ARR (10 ms) auto-repeat for smooth movement |
| `renderer.js` | All canvas drawing — board grid, locked cells, ghost, active piece, mini-piece previews |

---

## Technical Notes

- **60 fps game loop** via `requestAnimationFrame`; delta time is capped at 50 ms to prevent large jumps after tab blur.
- **SRS rotation** (Super Rotation System): each rotation attempt tries up to 5 wall-kick offsets before failing. I-piece uses a separate kick table from the rest.
- **ES modules** (`type="module"` in the script tag) — no bundler needed; the browser resolves imports directly.
- **No frontend dependencies** — Express is the only npm package, used solely to serve static files.
