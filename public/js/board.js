import { PIECES, WALL_KICKS_JLSTZ, WALL_KICKS_I, getCells } from './pieces.js';

export const COLS = 10;
export const ROWS = 20;
// Extra hidden rows above the visible board for piece spawning
export const BUFFER_ROWS = 4;
export const TOTAL_ROWS = ROWS + BUFFER_ROWS;

// Scoring table: points awarded per lines cleared (multiplied by level)
const LINE_SCORES = [0, 100, 300, 500, 800];

export class Board {
  constructor() {
    this.reset();
  }

  reset() {
    // grid[r][c] = null or color string
    this.grid = Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
  }

  // Check if cells are valid (within bounds and not colliding)
  isValid(cells) {
    for (const { r, c } of cells) {
      if (c < 0 || c >= COLS) return false;
      if (r >= TOTAL_ROWS) return false;
      // Cells above the top of the buffer are allowed during spawn
      if (r < 0) return false;
      if (this.grid[r][c] !== null) return false;
    }
    return true;
  }

  // Lock a piece onto the grid
  lock(type, cells) {
    const color = PIECES[type].color;
    for (const { r, c } of cells) {
      if (r >= 0 && r < TOTAL_ROWS) {
        this.grid[r][c] = color;
      }
    }
    return this._clearLines();
  }

  _clearLines() {
    const fullRows = [];
    for (let r = 0; r < TOTAL_ROWS; r++) {
      if (this.grid[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }
    if (fullRows.length === 0) return 0;

    // Remove full rows and add empty rows at the top
    for (const r of fullRows) {
      this.grid.splice(r, 1);
      this.grid.unshift(Array(COLS).fill(null));
    }

    const cleared = fullRows.length;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.score += LINE_SCORES[cleared] * this.level;
    return cleared;
  }

  // Calculate ghost piece position: drop as far as possible
  getGhostRow(type, rotation, originRow, originCol) {
    let row = originRow;
    while (true) {
      const next = getCells(type, rotation, row + 1, originCol);
      if (!this.isValid(next)) break;
      row++;
    }
    return row;
  }

  // Attempt to rotate a piece using SRS wall kicks.
  // Returns { rotation, originRow, originCol } on success, or null on failure.
  tryRotate(type, fromRot, originRow, originCol, dir) {
    const toRot = (fromRot + dir + 4) % 4;
    const key = `${fromRot}>${toRot}`;
    const kicks = type === 'I' ? WALL_KICKS_I[key] : WALL_KICKS_JLSTZ[key];

    for (const [dx, dy] of kicks) {
      // SRS uses (col offset, row offset) with y-up convention; our grid is y-down
      const newCol = originCol + dx;
      const newRow = originRow - dy;
      const cells = getCells(type, toRot, newRow, newCol);
      if (this.isValid(cells)) {
        return { rotation: toRot, originRow: newRow, originCol: newCol };
      }
    }
    return null;
  }
}
