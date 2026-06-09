// Tetromino definitions using SRS (Super Rotation System)
// Each piece has 4 rotation states, each state is a 4x4 bitmask array.

export const PIECES = {
  I: {
    color: '#00f0f0',
    // SRS I-piece rotation states
    rotations: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ],
  },
  O: {
    color: '#f0f000',
    rotations: [
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    ],
  },
  T: {
    color: '#a000f0',
    rotations: [
      [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
  },
  S: {
    color: '#00f000',
    rotations: [
      [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
      [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
  },
  Z: {
    color: '#f00000',
    rotations: [
      [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
    ],
  },
  J: {
    color: '#0000f0',
    rotations: [
      [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
    ],
  },
  L: {
    color: '#f0a000',
    rotations: [
      [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
      [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
  },
};

export const PIECE_NAMES = Object.keys(PIECES);

// SRS wall kick data for J, L, S, T, Z pieces
// Index: [fromRotation * 4 + toRotation] => array of (dx, dy) offsets to try
export const WALL_KICKS_JLSTZ = {
  '0>1': [ [0,0], [-1,0], [-1,1], [0,-2], [-1,-2] ],
  '1>0': [ [0,0], [1,0],  [1,-1], [0,2],  [1,2]   ],
  '1>2': [ [0,0], [1,0],  [1,-1], [0,2],  [1,2]   ],
  '2>1': [ [0,0], [-1,0], [-1,1], [0,-2], [-1,-2] ],
  '2>3': [ [0,0], [1,0],  [1,1],  [0,-2], [1,-2]  ],
  '3>2': [ [0,0], [-1,0], [-1,-1],[0,2],  [-1,2]  ],
  '3>0': [ [0,0], [-1,0], [-1,-1],[0,2],  [-1,2]  ],
  '0>3': [ [0,0], [1,0],  [1,1],  [0,-2], [1,-2]  ],
};

// SRS wall kick data for the I piece (different offsets)
export const WALL_KICKS_I = {
  '0>1': [ [0,0], [-2,0], [1,0],  [-2,-1], [1,2]  ],
  '1>0': [ [0,0], [2,0],  [-1,0], [2,1],   [-1,-2] ],
  '1>2': [ [0,0], [-1,0], [2,0],  [-1,2],  [2,-1] ],
  '2>1': [ [0,0], [1,0],  [-2,0], [1,-2],  [-2,1] ],
  '2>3': [ [0,0], [2,0],  [-1,0], [2,1],   [-1,-2] ],
  '3>2': [ [0,0], [-2,0], [1,0],  [-2,-1], [1,2]  ],
  '3>0': [ [0,0], [1,0],  [-2,0], [1,-2],  [-2,1] ],
  '0>3': [ [0,0], [-1,0], [2,0],  [-1,2],  [2,-1] ],
};

// 7-bag randomizer: shuffles all 7 pieces, then repeats
export class Bag {
  constructor() {
    this._bag = [];
  }

  _refill() {
    this._bag = [...PIECE_NAMES];
    for (let i = this._bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._bag[i], this._bag[j]] = [this._bag[j], this._bag[i]];
    }
  }

  next() {
    if (this._bag.length === 0) this._refill();
    return this._bag.pop();
  }

  peek(count) {
    // Ensure we have enough pieces buffered to peek
    while (this._bag.length < count) {
      const extra = [...PIECE_NAMES];
      for (let i = extra.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [extra[i], extra[j]] = [extra[j], extra[i]];
      }
      this._bag = [...extra, ...this._bag];
    }
    // _bag is popped from the end, so the next pieces are at the end
    return this._bag.slice(-count).reverse();
  }
}

// Returns cells [{r, c}] occupied by a piece given type, rotation, origin (boardRow, boardCol)
export function getCells(type, rotation, originRow, originCol) {
  const grid = PIECES[type].rotations[rotation];
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c]) {
        cells.push({ r: originRow + r, c: originCol + c });
      }
    }
  }
  return cells;
}
