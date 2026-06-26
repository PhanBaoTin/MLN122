import { useEffect, useState } from 'react';
import { sliceImage } from '../../utils/puzzle';

interface PuzzleBoardProps {
  puzzleState: number[][]; // N x N array containing tile numbers (0 = empty)
  imageUrl: string;
  gridSize: number;
  onTileClick: (row: number, col: number) => void;
  canMove: boolean; // Is it the player's turn to move? (Unlocked by answering question)
  isCompleted: boolean;
}

export default function PuzzleBoard({
  puzzleState,
  imageUrl,
  gridSize,
  onTileClick,
  canMove,
  isCompleted
}: PuzzleBoardProps) {
  const [tiles, setTiles] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("IMAGE URL =", imageUrl);
    if (imageUrl && gridSize) {
      setLoading(true);
      // Pre-slice image
      sliceImage(imageUrl, gridSize)
        .then(tileMap => {
          setTiles(tileMap);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to slice image", err);
          setLoading(false);
        });
    }
  }, [imageUrl, gridSize]);

  if (loading) {
    return (
      <div className="w-full aspect-square bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-2xl shadow-indigo-900/20">
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: '2px',
          padding: '2px'
        }}
      >
        {puzzleState.map((row, rIdx) =>
          row.map((tileNumber, cIdx) => {
            const isTarget = canMove && isAdjacentToEmpty(puzzleState, rIdx, cIdx);

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`relative w-full h-full rounded-sm overflow-hidden transition-all duration-300 ${tileNumber === 0 ? 'bg-slate-900/80 shadow-inner' : 'bg-slate-700 shadow-md'
                  } ${isTarget ? 'cursor-pointer hover:brightness-110 hover:scale-[0.98]' : ''} ${tileNumber === 0 ? 'opacity-0' : 'opacity-100'
                  }`}
                onClick={() => {
                  if (canMove && !isCompleted && tileNumber !== 0) {
                    onTileClick(rIdx, cIdx);
                  }
                }}
              >
                {tileNumber !== 0 && tiles.has(tileNumber) && (
                  <>
                    <img
                      src={tiles.get(tileNumber)}
                      alt={`Tile ${tileNumber}`}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      draggable={false}
                    />
                    {isTarget && (
                      <div className="absolute inset-0 ring-4 ring-inset ring-indigo-500/50 animate-pulse"></div>
                    )}
                  </>
                )}
                {/* For debugging or accessibility, you can optionally show the number */}
                {/* {tileNumber !== 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-xl drop-shadow-md pointer-events-none">
                    {tileNumber}
                  </div>
                )} */}
              </div>
            );
          })
        )}
      </div>

      {isCompleted && (
        <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-fade-in">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-emerald-500/50 shadow-2xl shadow-emerald-900/50 transform scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-emerald-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-white text-center">Puzzle Solved!</h3>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to check if a tile is adjacent to the empty space (0)
function isAdjacentToEmpty(state: number[][], r: number, c: number): boolean {
  for (let row = 0; row < state.length; row++) {
    for (let col = 0; col < state[row].length; col++) {
      if (state[row][col] === 0) {
        const rowDiff = Math.abs(r - row);
        const colDiff = Math.abs(c - col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
      }
    }
  }
  return false;
}
