import { Board, COLS, ROWS, BUFFER_ROWS } from './board.js';
import { Bag, getCells } from './pieces.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

// Gravity intervals per level (ms per row drop)
function gravityMs(level) {
  // Standard Tetris formula (approximately)
  return Math.max(50, 1000 * Math.pow(0.8 - (level - 1) * 0.007, level - 1));
}

const LOCK_DELAY   = 500;  // ms before a grounded piece locks
const LOCK_RESETS  = 15;   // max number of lock-delay resets per piece

export class Game {
  constructor(boardCanvas, nextCanvases, holdCanvas, uiElements) {
    this.board    = new Board();
    this.bag      = new Bag();
    this.input    = new Input();
    this.renderer = new Renderer(boardCanvas, nextCanvases, holdCanvas);
    this.ui       = uiElements; // { score, level, lines, overlay, overlayTitle, overlayMsg, restartBtn }

    this.state = 'idle'; // idle | playing | paused | gameover
    this._rafId = null;
    this._lastTime = 0;

    this._piece     = null;
    this._holdType  = null;
    this._canHold   = true;
    this._nextPieces = [];

    this._gravityAcc  = 0;
    this._lockAcc     = 0;
    this._lockResets  = 0;
    this._isGrounded  = false;

    this.ui.restartBtn.addEventListener('click', () => this.start());
    window.addEventListener('keydown', e => {
      if (e.code === 'Enter' || e.code === 'Space') {
        if (this.state === 'idle' || this.state === 'gameover') this.start();
      }
    });
  }

  start() {
    this.board.reset();
    this.bag      = new Bag();
    this._holdType  = null;
    this._canHold   = true;
    this._nextPieces = [];
    this.input.clearAll();

    // Pre-fill the next queue with 3 pieces
    for (let i = 0; i < 3; i++) this._nextPieces.push(this.bag.next());

    this._spawnPiece();
    this.state = 'playing';
    this._showOverlay(false);
    this._updateUI();

    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(t => this._loop(t));
  }

  _loop(timestamp) {
    const dt = Math.min(timestamp - this._lastTime, 50); // cap at 50ms to handle tab blur
    this._lastTime = timestamp;

    if (this.state === 'playing') {
      this.input.update(dt);
      this._handleInput();
      this._applyGravity(dt);
      this._applyLockDelay(dt);
    }

    this._render();
    this._rafId = requestAnimationFrame(t => this._loop(t));
  }

  _handleInput() {
    if (this.input.consume('pause')) {
      this._togglePause();
      return;
    }
    if (this.state !== 'playing') return;

    if (this.input.consume('left'))      this._move(-1);
    if (this.input.consume('right'))     this._move(1);
    if (this.input.consume('softDrop'))  this._softDrop();
    if (this.input.consume('hardDrop'))  this._hardDrop();
    if (this.input.consume('rotateCW'))  this._rotate(1);
    if (this.input.consume('rotateCCW')) this._rotate(-1);
    if (this.input.consume('hold'))      this._hold();
  }

  _move(dir) {
    const { type, rotation, row, col } = this._piece;
    const cells = getCells(type, rotation, row, col + dir);
    if (this.board.isValid(cells)) {
      this._piece.col += dir;
      if (this._isGrounded) this._resetLockDelay();
    }
  }

  _softDrop() {
    if (this._tryMoveDown()) {
      this.board.score += 1; // bonus point per soft-drop row
      this._updateUI();
    }
  }

  _hardDrop() {
    const { type, rotation, row, col } = this._piece;
    const ghostRow = this.board.getGhostRow(type, rotation, row, col);
    const dropped = ghostRow - row;
    this._piece.row = ghostRow;
    this.board.score += dropped * 2; // 2 pts per hard-drop row
    this._lock();
  }

  _rotate(dir) {
    const { type, rotation, row, col } = this._piece;
    const result = this.board.tryRotate(type, rotation, row, col, dir);
    if (result) {
      this._piece.rotation = result.rotation;
      this._piece.row      = result.originRow;
      this._piece.col      = result.originCol;
      if (this._isGrounded) this._resetLockDelay();
    }
  }

  _hold() {
    if (!this._canHold) return;
    const currentType = this._piece.type;
    if (this._holdType) {
      this._spawnPiece(this._holdType);
    } else {
      this._spawnPiece();
    }
    this._holdType = currentType;
    this._canHold = false;
  }

  _applyGravity(dt) {
    this._gravityAcc += dt;
    const interval = gravityMs(this.board.level);
    while (this._gravityAcc >= interval) {
      this._gravityAcc -= interval;
      this._tryMoveDown();
    }
  }

  _tryMoveDown() {
    const { type, rotation, row, col } = this._piece;
    const cells = getCells(type, rotation, row + 1, col);
    if (this.board.isValid(cells)) {
      this._piece.row++;
      this._isGrounded = false;
      return true;
    } else {
      this._isGrounded = true;
      return false;
    }
  }

  _applyLockDelay(dt) {
    if (!this._isGrounded) {
      this._lockAcc = 0;
      return;
    }
    this._lockAcc += dt;
    if (this._lockAcc >= LOCK_DELAY) {
      this._lock();
    }
  }

  _resetLockDelay() {
    if (this._lockResets < LOCK_RESETS) {
      this._lockAcc = 0;
      this._lockResets++;
    }
  }

  _lock() {
    const { type, rotation, row, col } = this._piece;
    const cells = getCells(type, rotation, row, col);
    this.board.lock(type, cells);
    this._updateUI();

    // Check for game over: if any locked cell is in the buffer zone
    if (cells.some(cell => cell.r < BUFFER_ROWS)) {
      this._gameOver();
      return;
    }

    this._canHold = true;
    this._spawnPiece();
  }

  _spawnPiece(type) {
    if (!type) {
      type = this._nextPieces.shift();
      this._nextPieces.push(this.bag.next());
    }

    // Standard spawn position: top-center, one row into the buffer
    const col = Math.floor(COLS / 2) - 2;
    const row = BUFFER_ROWS - 1;

    this._piece = { type, rotation: 0, row, col };
    this._isGrounded = false;
    this._lockAcc    = 0;
    this._lockResets = 0;
    this._gravityAcc = 0;

    // Immediate game-over check on spawn collision
    if (!this.board.isValid(getCells(type, 0, row, col))) {
      this._gameOver();
    }
  }

  _togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this._showOverlay(true, 'PAUSED', 'Press P to resume');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this._showOverlay(false);
      this._lastTime = performance.now(); // avoid large dt on resume
    }
  }

  _gameOver() {
    this.state = 'gameover';
    this._showOverlay(true, 'GAME OVER', `Final score: ${this.board.score}`);
  }

  _showOverlay(visible, title = 'TETRIS', msg = 'Press Enter or Space to start') {
    const el = this.ui.overlay;
    el.style.display = visible ? 'flex' : 'none';
    this.ui.overlayTitle.textContent = title;
    this.ui.overlayMsg.textContent   = msg;
    this.ui.restartBtn.textContent   = this.state === 'gameover' ? 'Play Again' : 'Start';
  }

  _updateUI() {
    this.ui.score.textContent = this.board.score.toLocaleString();
    this.ui.level.textContent = this.board.level;
    this.ui.lines.textContent = this.board.lines;
  }

  _render() {
    this.renderer.drawBoard(this.board, this.state === 'playing' || this.state === 'paused' ? this._piece : null);
    this.renderer.drawNext(this._nextPieces);
    this.renderer.drawHold(this._holdType, this._canHold);
  }
}
