/**
 * Puzzle utility functions for the sliding puzzle game.
 * Handles puzzle generation, scrambling, validation, and solving.
 */

/**
 * Generate a solved puzzle state for a given grid size.
 * Tiles are numbered 1...(N*N-1), with 0 representing the empty space (bottom-right).
 */
export function generateSolvedState(gridSize: number): number[][] {
  const state: number[][] = [];
  let counter = 1;
  for (let row = 0; row < gridSize; row++) {
    const rowArr: number[] = [];
    for (let col = 0; col < gridSize; col++) {
      if (row === gridSize - 1 && col === gridSize - 1) {
        rowArr.push(0); // empty space
      } else {
        rowArr.push(counter++);
      }
    }
    state.push(rowArr);
  }
  return state;
}

/**
 * Find the position of the empty tile (0) in the puzzle state.
 */
export function findEmptyPosition(state: number[][]): [number, number] {
  for (let row = 0; row < state.length; row++) {
    for (let col = 0; col < state[row].length; col++) {
      if (state[row][col] === 0) {
        return [row, col];
      }
    }
  }
  throw new Error('Empty position not found');
}

/**
 * Get valid moves (adjacent positions to the empty tile).
 */
export function getValidMoves(state: number[][]): [number, number][] {
  const [emptyRow, emptyCol] = findEmptyPosition(state);
  const gridSize = state.length;
  const moves: [number, number][] = [];

  const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    const newRow = emptyRow + dr;
    const newCol = emptyCol + dc;
    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      moves.push([newRow, newCol]);
    }
  }
  return moves;
}

/**
 * Apply a move: swap the tile at (tileRow, tileCol) with the empty space.
 * Returns a new state (does not mutate input).
 */
export function applyMove(
  state: number[][],
  tileRow: number,
  tileCol: number,
): number[][] | null {
  const [emptyRow, emptyCol] = findEmptyPosition(state);

  // Check if the tile is adjacent to the empty space
  const rowDiff = Math.abs(tileRow - emptyRow);
  const colDiff = Math.abs(tileCol - emptyCol);
  if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
    return null; // Invalid move
  }

  // Deep copy and swap
  const newState = state.map((row) => [...row]);
  newState[emptyRow][emptyCol] = newState[tileRow][tileCol];
  newState[tileRow][tileCol] = 0;
  return newState;
}

/**
 * Check if the puzzle is solved.
 */
export function isSolved(state: number[][], solvedState: number[][]): boolean {
  for (let row = 0; row < state.length; row++) {
    for (let col = 0; col < state[row].length; col++) {
      if (state[row][col] !== solvedState[row][col]) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Scramble a solved puzzle by making random valid moves.
 * This guarantees the puzzle is always solvable.
 */
export function scramblePuzzle(solvedState: number[][], moves: number = 200): number[][] {
  let state = solvedState.map((row) => [...row]);
  let lastEmpty: [number, number] = findEmptyPosition(state);

  for (let i = 0; i < moves; i++) {
    const validMoves = getValidMoves(state);
    // Filter out the move that would undo the previous move
    const filteredMoves = validMoves.filter(
      ([r, c]) => !(r === lastEmpty[0] && c === lastEmpty[1]),
    );
    const movesToUse = filteredMoves.length > 0 ? filteredMoves : validMoves;
    const randomMove = movesToUse[Math.floor(Math.random() * movesToUse.length)];

    lastEmpty = findEmptyPosition(state);
    const newState = applyMove(state, randomMove[0], randomMove[1]);
    if (newState) {
      state = newState;
    }
  }

  // Ensure it's not already solved
  if (isSolved(state, solvedState)) {
    return scramblePuzzle(solvedState, moves);
  }

  return state;
}
