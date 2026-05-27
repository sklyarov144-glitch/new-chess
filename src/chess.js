const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const WHITE = 'w';
const BLACK = 'b';
const FILES = 'abcdefgh';

export const boardThemes = {
  royal: { name: 'Royal Gold' },
  neon: { name: 'Neon Cyber' },
  glass: { name: 'Frozen Glass' }
};

export const pieceSets = {
  classic: {
    name: 'Classic Unicode',
    white: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    black: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  },
  glyph: {
    name: 'Runic Glyphs',
    white: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
    black: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }
  },
  minimal: {
    name: 'Minimal Dots',
    white: { k: '○', q: '◇', r: '□', b: '△', n: '◁', p: '·' },
    black: { k: '●', q: '◆', r: '■', b: '▲', n: '▶', p: '•' }
  }
};

export const puzzles = [
  {
    title: 'Мат в один ход',
    fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
    solution: 'a1a8',
    reward: 60,
    hint: 'Ладья может атаковать короля по открытой линии с края доски.'
  },
  {
    title: 'Выиграй ферзя',
    fen: '4k3/8/8/3q4/8/4N3/8/4K3 w - - 0 1',
    solution: 'e3d5',
    reward: 45,
    hint: 'Конь может забрать самую ценную фигуру.'
  },
  {
    title: 'Спаси короля',
    fen: '4k3/8/8/8/8/8/5q2/4K2R w - - 0 1',
    solution: 'e1f2',
    reward: 40,
    hint: 'Король должен уйти из-под атаки ферзя.'
  }
];

export class ChessGame {
  constructor() {
    this.reset();
  }

  reset(fen = 'start') {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.turn = WHITE;
    this.history = [];
    this.castling = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassant = null;
    this.halfmove = 0;
    this.fullmove = 1;
    if (fen === 'start') this.loadFen('rnqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNQKBNR w KQkq - 0 1'.replace('rnqkbnr', 'rnbqkbnr').replace('RNQKBNR', 'RNBQKBNR'));
    else this.loadFen(fen);
  }

  loadFen(fen) {
    const [placement, turn, castling = '-', enPassant = '-', half = '0', full = '1'] = fen.split(' ');
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    placement.split('/').forEach((rank, r) => {
      let c = 0;
      for (const char of rank) {
        if (/\d/.test(char)) c += Number(char);
        else {
          const color = char === char.toUpperCase() ? WHITE : BLACK;
          this.board[r][c] = { color, type: char.toLowerCase(), moved: false };
          c += 1;
        }
      }
    });
    this.turn = turn || WHITE;
    this.castling = {
      wK: castling.includes('K'),
      wQ: castling.includes('Q'),
      bK: castling.includes('k'),
      bQ: castling.includes('q')
    };
    this.enPassant = enPassant === '-' ? null : this.squareToCoords(enPassant);
    this.halfmove = Number(half);
    this.fullmove = Number(full);
    this.history = [];
  }

  clone() {
    const copy = new ChessGame();
    copy.board = this.board.map(row => row.map(piece => piece ? { ...piece } : null));
    copy.turn = this.turn;
    copy.castling = { ...this.castling };
    copy.enPassant = this.enPassant ? { ...this.enPassant } : null;
    copy.halfmove = this.halfmove;
    copy.fullmove = this.fullmove;
    copy.history = this.history.map(item => JSON.parse(JSON.stringify(item)));
    return copy;
  }

  squareToCoords(square) {
    return { row: 8 - Number(square[1]), col: FILES.indexOf(square[0]) };
  }

  coordsToSquare(row, col) {
    return `${FILES[col]}${8 - row}`;
  }

  getPiece(row, col) {
    if (!this.inBounds(row, col)) return null;
    return this.board[row][col];
  }

  inBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  isEnemy(row, col, color) {
    const piece = this.getPiece(row, col);
    return piece && piece.color !== color;
  }

  isEmpty(row, col) {
    return this.inBounds(row, col) && !this.board[row][col];
  }

  makeMove(from, to, promotion = 'q') {
    const move = this.legalMoves().find(candidate =>
      candidate.from.row === from.row && candidate.from.col === from.col &&
      candidate.to.row === to.row && candidate.to.col === to.col
    );
    if (!move) return null;
    this.applyMove(move, promotion, true);
    return move;
  }

  applyMove(move, promotion = 'q', storeHistory = false) {
    const snapshot = storeHistory ? this.snapshot() : null;
    const piece = this.board[move.from.row][move.from.col];
    const captured = this.board[move.to.row][move.to.col];

    this.board[move.from.row][move.from.col] = null;

    if (move.enPassantCapture) {
      this.board[move.from.row][move.to.col] = null;
    }

    if (move.castle) {
      const rookFromCol = move.to.col === 6 ? 7 : 0;
      const rookToCol = move.to.col === 6 ? 5 : 3;
      this.board[move.to.row][rookToCol] = this.board[move.to.row][rookFromCol];
      this.board[move.to.row][rookFromCol] = null;
      if (this.board[move.to.row][rookToCol]) this.board[move.to.row][rookToCol].moved = true;
    }

    const newPiece = { ...piece, moved: true };
    if (newPiece.type === 'p' && (move.to.row === 0 || move.to.row === 7)) newPiece.type = promotion;
    this.board[move.to.row][move.to.col] = newPiece;

    this.updateCastling(piece, move);
    this.enPassant = null;
    if (piece.type === 'p' && Math.abs(move.to.row - move.from.row) === 2) {
      this.enPassant = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
    }

    this.halfmove = piece.type === 'p' || captured ? 0 : this.halfmove + 1;
    if (this.turn === BLACK) this.fullmove += 1;
    this.turn = this.turn === WHITE ? BLACK : WHITE;

    if (snapshot) this.history.push(snapshot);
  }

  updateCastling(piece, move) {
    if (piece.type === 'k') {
      this.castling[`${piece.color}K`] = false;
      this.castling[`${piece.color}Q`] = false;
    }
    if (piece.type === 'r') {
      if (piece.color === WHITE && move.from.row === 7 && move.from.col === 0) this.castling.wQ = false;
      if (piece.color === WHITE && move.from.row === 7 && move.from.col === 7) this.castling.wK = false;
      if (piece.color === BLACK && move.from.row === 0 && move.from.col === 0) this.castling.bQ = false;
      if (piece.color === BLACK && move.from.row === 0 && move.from.col === 7) this.castling.bK = false;
    }
  }

  snapshot() {
    return {
      board: this.board.map(row => row.map(piece => piece ? { ...piece } : null)),
      turn: this.turn,
      castling: { ...this.castling },
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      halfmove: this.halfmove,
      fullmove: this.fullmove
    };
  }

  undo() {
    const previous = this.history.pop();
    if (!previous) return false;
    Object.assign(this, previous);
    return true;
  }

  pseudoMovesFor(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece) return [];
    const moves = [];
    const add = (toRow, toCol, extra = {}) => {
      if (!this.inBounds(toRow, toCol)) return;
      const target = this.getPiece(toRow, toCol);
      if (!target || target.color !== piece.color) moves.push({ from: { row, col }, to: { row: toRow, col: toCol }, ...extra });
    };

    if (piece.type === 'p') {
      const direction = piece.color === WHITE ? -1 : 1;
      const startRow = piece.color === WHITE ? 6 : 1;
      if (this.isEmpty(row + direction, col)) {
        add(row + direction, col);
        if (row === startRow && this.isEmpty(row + direction * 2, col)) add(row + direction * 2, col);
      }
      [-1, 1].forEach(dc => {
        const targetRow = row + direction;
        const targetCol = col + dc;
        if (this.isEnemy(targetRow, targetCol, piece.color)) add(targetRow, targetCol);
        if (this.enPassant && this.enPassant.row === targetRow && this.enPassant.col === targetCol) {
          add(targetRow, targetCol, { enPassantCapture: true });
        }
      });
    }

    if (piece.type === 'n') {
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => add(row + dr, col + dc));
    }

    if (['b', 'r', 'q'].includes(piece.type)) {
      const directions = [];
      if (['b', 'q'].includes(piece.type)) directions.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (['r', 'q'].includes(piece.type)) directions.push([-1,0],[1,0],[0,-1],[0,1]);
      directions.forEach(([dr, dc]) => {
        let r = row + dr;
        let c = col + dc;
        while (this.inBounds(r, c)) {
          if (this.isEmpty(r, c)) add(r, c);
          else {
            if (this.isEnemy(r, c, piece.color)) add(r, c);
            break;
          }
          r += dr;
          c += dc;
        }
      });
    }

    if (piece.type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr || dc) add(row + dr, col + dc);
        }
      }
      const homeRow = piece.color === WHITE ? 7 : 0;
      if (row === homeRow && col === 4 && !this.inCheck(piece.color)) {
        const keyPrefix = piece.color;
        if (this.castling[`${keyPrefix}K`] && this.isEmpty(homeRow, 5) && this.isEmpty(homeRow, 6) && !this.squareAttacked(homeRow, 5, this.opposite(piece.color)) && !this.squareAttacked(homeRow, 6, this.opposite(piece.color))) {
          add(homeRow, 6, { castle: true });
        }
        if (this.castling[`${keyPrefix}Q`] && this.isEmpty(homeRow, 3) && this.isEmpty(homeRow, 2) && this.isEmpty(homeRow, 1) && !this.squareAttacked(homeRow, 3, this.opposite(piece.color)) && !this.squareAttacked(homeRow, 2, this.opposite(piece.color))) {
          add(homeRow, 2, { castle: true });
        }
      }
    }

    return moves;
  }

  legalMoves(color = this.turn) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== color) continue;
        this.pseudoMovesFor(row, col).forEach(move => {
          const clone = this.clone();
          clone.applyMove(move, 'q', false);
          if (!clone.inCheck(color)) moves.push(move);
        });
      }
    }
    return moves;
  }

  inCheck(color) {
    const king = this.findKing(color);
    if (!king) return false;
    return this.squareAttacked(king.row, king.col, this.opposite(color));
  }

  squareAttacked(row, col, byColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (!piece || piece.color !== byColor) continue;
        if (this.attacksSquare(r, c, row, col)) return true;
      }
    }
    return false;
  }

  attacksSquare(fromRow, fromCol, targetRow, targetCol) {
    const piece = this.getPiece(fromRow, fromCol);
    if (!piece) return false;
    const dr = targetRow - fromRow;
    const dc = targetCol - fromCol;

    if (piece.type === 'p') {
      const direction = piece.color === WHITE ? -1 : 1;
      return dr === direction && Math.abs(dc) === 1;
    }
    if (piece.type === 'n') return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    if (piece.type === 'k') return Math.max(Math.abs(dr), Math.abs(dc)) === 1;
    if (piece.type === 'b') return Math.abs(dr) === Math.abs(dc) && this.clearPath(fromRow, fromCol, targetRow, targetCol);
    if (piece.type === 'r') return (dr === 0 || dc === 0) && this.clearPath(fromRow, fromCol, targetRow, targetCol);
    if (piece.type === 'q') return (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) && this.clearPath(fromRow, fromCol, targetRow, targetCol);
    return false;
  }

  clearPath(fromRow, fromCol, targetRow, targetCol) {
    const stepRow = Math.sign(targetRow - fromRow);
    const stepCol = Math.sign(targetCol - fromCol);
    let row = fromRow + stepRow;
    let col = fromCol + stepCol;
    while (row !== targetRow || col !== targetCol) {
      if (this.getPiece(row, col)) return false;
      row += stepRow;
      col += stepCol;
    }
    return true;
  }

  findKing(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (piece?.type === 'k' && piece.color === color) return { row, col };
      }
    }
    return null;
  }

  opposite(color) {
    return color === WHITE ? BLACK : WHITE;
  }

  moveToNotation(move) {
    return `${this.coordsToSquare(move.from.row, move.from.col)}${this.coordsToSquare(move.to.row, move.to.col)}`;
  }

  status() {
    const moves = this.legalMoves();
    if (!moves.length && this.inCheck(this.turn)) return { over: true, text: this.turn === WHITE ? 'Мат. Черные выиграли.' : 'Мат. Белые выиграли.' };
    if (!moves.length) return { over: true, text: 'Пат. Ничья.' };
    if (this.inCheck(this.turn)) return { over: false, text: this.turn === WHITE ? 'Белые под шахом.' : 'Черные под шахом.' };
    return { over: false, text: this.turn === WHITE ? 'Ход белых.' : 'Ход черных.' };
  }

  bestMove(color = this.turn, depth = 2) {
    const moves = this.legalMoves(color);
    if (!moves.length) return null;
    let best = null;
    let bestScore = color === WHITE ? -Infinity : Infinity;
    for (const move of moves) {
      const clone = this.clone();
      clone.applyMove(move, 'q', false);
      const score = clone.minimax(depth - 1, -Infinity, Infinity, clone.turn === WHITE);
      if (color === WHITE ? score > bestScore : score < bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best || moves[Math.floor(Math.random() * moves.length)];
  }

  minimax(depth, alpha, beta, maximizingWhite) {
    const moves = this.legalMoves();
    if (depth === 0 || !moves.length) return this.evaluate();

    if (maximizingWhite) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const clone = this.clone();
        clone.applyMove(move, 'q', false);
        const score = clone.minimax(depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxEval;
    }

    let minEval = Infinity;
    for (const move of moves) {
      const clone = this.clone();
      clone.applyMove(move, 'q', false);
      const score = clone.minimax(depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }

  evaluate() {
    let score = 0;
    for (const row of this.board) {
      for (const piece of row) {
        if (!piece) continue;
        const value = PIECE_VALUES[piece.type] || 0;
        score += piece.color === WHITE ? value : -value;
      }
    }
    return score;
  }
}
