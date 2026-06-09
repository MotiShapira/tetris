import { COLS, ROWS, BUFFER_ROWS, TOTAL_ROWS } from './board.js';
import { PIECES, getCells } from './pieces.js';

const CELL = 30; // px per cell
const MINI_CELL = 20;

export class Renderer {
  constructor(boardCanvas, nextCanvases, holdCanvas) {
    this.boardCtx = boardCanvas.getContext('2d');
    this.nextCtxs = nextCanvases.map(c => c.getContext('2d'));
    this.holdCtx = holdCanvas.getContext('2d');

    boardCanvas.width  = COLS * CELL;
    boardCanvas.height = ROWS * CELL;
  }

  drawBoard(board, activePiece) {
    const ctx = this.boardCtx;
    const W = COLS * CELL;
    const H = ROWS * CELL;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
    }

    // Draw locked cells (only visible rows, offset by buffer)
    for (let r = BUFFER_ROWS; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board.grid[r][c];
        if (color) {
          this._drawCell(ctx, c, r - BUFFER_ROWS, color, CELL);
        }
      }
    }

    if (!activePiece) return;
    const { type, rotation, row, col } = activePiece;

    // Draw ghost piece
    const ghostRow = board.getGhostRow(type, rotation, row, col);
    const ghostCells = getCells(type, rotation, ghostRow, col);
    ctx.globalAlpha = 0.25;
    for (const { r, c } of ghostCells) {
      const visR = r - BUFFER_ROWS;
      if (visR >= 0) this._drawCell(ctx, c, visR, PIECES[type].color, CELL);
    }
    ctx.globalAlpha = 1;

    // Draw active piece
    const activeCells = getCells(type, rotation, row, col);
    for (const { r, c } of activeCells) {
      const visR = r - BUFFER_ROWS;
      if (visR >= 0) this._drawCell(ctx, c, visR, PIECES[type].color, CELL);
    }
  }

  drawNext(nextPieces) {
    this.nextCtxs.forEach((ctx, i) => {
      const type = nextPieces[i];
      this._drawMiniPiece(ctx, type);
    });
  }

  drawHold(holdType, canHold) {
    this._drawMiniPiece(this.holdCtx, holdType, canHold ? 1 : 0.4);
  }

  _drawMiniPiece(ctx, type, alpha = 1) {
    const size = ctx.canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, size, size);

    if (!type) return;

    const grid = PIECES[type].rotations[0];
    const color = PIECES[type].color;

    // Find bounding box of the piece
    let minR = 4, maxR = 0, minC = 4, maxC = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c]) {
          minR = Math.min(minR, r); maxR = Math.max(maxR, r);
          minC = Math.min(minC, c); maxC = Math.max(maxC, c);
        }
      }
    }

    const pieceW = (maxC - minC + 1) * MINI_CELL;
    const pieceH = (maxR - minR + 1) * MINI_CELL;
    const offX = Math.floor((size - pieceW) / 2);
    const offY = Math.floor((size - pieceH) / 2);

    ctx.globalAlpha = alpha;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c]) {
          this._drawCell(ctx, c - minC, r - minR, color, MINI_CELL, offX, offY);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawCell(ctx, c, r, color, size, offX = 0, offY = 0) {
    const x = offX + c * size;
    const y = offY + r * size;
    const pad = 1;

    // Fill
    ctx.fillStyle = color;
    ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);

    // Highlight (top-left edge)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + pad, y + pad, size - pad * 2, 3);
    ctx.fillRect(x + pad, y + pad, 3, size - pad * 2);

    // Shadow (bottom-right edge)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + pad, y + size - pad - 3, size - pad * 2, 3);
    ctx.fillRect(x + size - pad - 3, y + pad, 3, size - pad * 2);
  }
}
