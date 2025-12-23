import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { RotateCcw } from 'lucide-react';
import { runAlgorithm, generateMazeRecursiveDivision } from '../algorithms';

const START_NODE_ROW = 8;
const START_NODE_COL = 5;
const FINISH_NODE_ROW = 8;
const FINISH_NODE_COL = 35;
const ROW_COUNT = 20; 
const COL_COUNT = 45; 

const createNode = (col, row) => {
  return {
    col,
    row,
    isStart: row === START_NODE_ROW && col === START_NODE_COL,
    isFinish: row === FINISH_NODE_ROW && col === FINISH_NODE_COL,
    distance: Infinity,
    g: Infinity, 
    f: Infinity,
    isVisited: false,
    isWall: false,
    previousNode: null,
    nextNode: null,
  };
};

const getInitialGrid = () => {
  const grid = [];
  for (let row = 0; row < ROW_COUNT; row++) {
    const currentRow = [];
    for (let col = 0; col < COL_COUNT; col++) {
      currentRow.push(createNode(col, row));
    }
    grid.push(currentRow);
  }
  return grid;
};

export const Grid = forwardRef(({ algoType, onFinish, isComparison = false, masterGridState = null, onGridUpdate, winStatus }, ref) => {
  const [grid, setGrid] = useState(getInitialGrid());
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [showReplay, setShowReplay] = useState(false);

  // Sync with master grid if in comparison mode
  useEffect(() => {
    if (masterGridState && isComparison) {
        const newGrid = masterGridState.map(row => 
            row.map(node => ({
                ...node, 
                distance: Infinity, g: Infinity, f: Infinity,
                isVisited: false, previousNode: null, nextNode: null
            }))
        );
        setGrid(newGrid);
    }
  }, [masterGridState, isComparison]);

  const runAnimation = () => {
      setShowReplay(false);
      
      // 1. Clear Visual Classes
      const container = document.getElementById(`grid-container-${algoType}`);
      if(container) {
          const visited = container.querySelectorAll('.node-visited');
          const paths = container.querySelectorAll('.node-path');
          visited.forEach(el => el.classList.remove('node-visited'));
          paths.forEach(el => el.classList.remove('node-path'));
      }

      // 2. CRITICAL FIX: Soft Reset Data Structure
      // We must reset the algorithm properties (visited, distance) on the existing grid objects
      // so the algorithm can run again without needing a full React state reset.
      for (let row of grid) {
          for (let node of row) {
              node.distance = Infinity;
              node.g = Infinity;
              node.f = Infinity;
              node.isVisited = false;
              node.previousNode = null;
              node.nextNode = null;
              // Note: We DO NOT reset isWall, isStart, or isFinish
          }
      }

      const startNode = grid[START_NODE_ROW][START_NODE_COL];
      const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
      
      const startTime = performance.now();
      const { visitedNodesInOrder, path } = runAlgorithm(grid, startNode, finishNode, algoType);
      const endTime = performance.now();
      
      const timeTaken = (endTime - startTime).toFixed(2);
      
      for (let i = 0; i <= visitedNodesInOrder.length; i++) {
        if (i === visitedNodesInOrder.length) {
          setTimeout(() => {
            animatePath(path, timeTaken);
          }, 5 * i);
          return;
        }
        setTimeout(() => {
          const node = visitedNodesInOrder[i];
          const el = document.getElementById(`node-${algoType}-${node.row}-${node.col}`);
          if(el && !node.isStart && !node.isFinish) el.classList.add('node-visited');
        }, 5 * i);
      }
  };

  useImperativeHandle(ref, () => ({
    animate() {
      runAnimation();
    },
    reset: () => {
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) {
            const visited = container.querySelectorAll('.node-visited');
            const paths = container.querySelectorAll('.node-path');
            visited.forEach(el => el.classList.remove('node-visited'));
            paths.forEach(el => el.classList.remove('node-path'));
        }
        if(!isComparison) {
            setGrid(getInitialGrid()); // Full reset for master
        }
    },
    clearWalls: () => {
        setGrid(getInitialGrid());
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) {
            const visited = container.querySelectorAll('.node-visited');
            const paths = container.querySelectorAll('.node-path');
            visited.forEach(el => el.classList.remove('node-visited'));
            paths.forEach(el => el.classList.remove('node-path'));
        }
    },
    generateMaze() {
        if(isComparison) return;
        setExecutionTime(0);
        setShowReplay(false);
        
        // Clear visuals
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) {
            const visited = container.querySelectorAll('.node-visited');
            const paths = container.querySelectorAll('.node-path');
            visited.forEach(el => el.classList.remove('node-visited'));
            paths.forEach(el => el.classList.remove('node-path'));
        }

        const startNode = grid[START_NODE_ROW][START_NODE_COL];
        const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
        const wallNodes = generateMazeRecursiveDivision(getInitialGrid(), startNode, finishNode);
        
        for(let i = 0; i < wallNodes.length; i++) {
            setTimeout(() => {
                const node = wallNodes[i];
                const newGrid = grid.slice();
                newGrid[node.row][node.col].isWall = true;
                setGrid([...newGrid]);
                if(onGridUpdate) onGridUpdate(newGrid);
            }, 5 * i);
        }
    },
  }));

  const animatePath = (nodesInShortestPathOrder, timeTaken) => {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        const el = document.getElementById(`node-${algoType}-${node.row}-${node.col}`);
        if(el && !node.isStart && !node.isFinish) el.classList.add('node-path');
        
        if(i === nodesInShortestPathOrder.length - 1) {
            setExecutionTime(timeTaken);
            setShowReplay(true);
            if(onFinish) onFinish(algoType, parseFloat(timeTaken));
        }
      }, 30 * i);
    }
  };

  const handleMouseDown = (row, col) => {
    if(isComparison) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);
    setGrid(newGrid);
    setMouseIsPressed(true);
    if(onGridUpdate) onGridUpdate(newGrid);
  };
  const handleMouseEnter = (row, col) => {
    if (!mouseIsPressed || isComparison) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);
    setGrid(newGrid);
    if(onGridUpdate) onGridUpdate(newGrid);
  };
  const handleMouseUp = () => setMouseIsPressed(false);

  const borderClass = winStatus === 'winner' ? 'ring-4 ring-green-500 shadow-green-500/50' 
                   : winStatus === 'loser' ? 'ring-4 ring-red-500 shadow-red-500/50'
                   : 'border border-gray-200 dark:border-gray-700';

  return (
    <div className="flex flex-col items-center relative group">
       {/* Timer moved slightly up with mb-0.5 and tight line-height */}
       <div className="mb-0.5 flex justify-between w-full px-1 text-[10px] sm:text-xs font-mono font-bold text-gray-600 dark:text-gray-300 leading-tight">
         <span className="uppercase">{algoType}</span>
         <span className={clsx("transition-opacity duration-300", executionTime > 0 ? "opacity-100" : "opacity-0", 
             winStatus === 'winner' ? 'text-green-600 dark:text-green-400 font-extrabold' : 'text-gray-600 dark:text-gray-400'
         )}>
            {executionTime}ms
         </span>
      </div>

      <div 
        id={`grid-container-${algoType}`}
        className={clsx("bg-white dark:bg-dark-panel p-1 rounded shadow-xl leading-[0] relative transition-all duration-500", borderClass)}
      >
        {showReplay && (
            <button onClick={runAnimation} className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 hover:bg-black/20 backdrop-blur-[1px] transition-all opacity-0 hover:opacity-100 group-hover:opacity-100">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-2xl transform hover:scale-110 transition-transform">
                    <RotateCcw size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
            </button>
        )}

        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((node, nodeIdx) => {
              const { row, col, isFinish, isStart, isWall } = node;
              const wallClass = isWall ? 'node-wall bg-gray-800 dark:bg-white border-gray-900 dark:border-white' : '';
              return (
                    <div
                        key={nodeIdx}
                        id={`node-${algoType}-${row}-${col}`}
                        className={clsx(
                            "w-5 h-5 border-[0.5px] border-blue-50/20 inline-block select-none", 
                            isFinish ? 'node-end' : isStart ? 'node-start' : wallClass
                        )}
                        onMouseDown={() => handleMouseDown(row, col)}
                        onMouseEnter={() => handleMouseEnter(row, col)}
                        onMouseUp={handleMouseUp}
                    ></div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

const getNewGridWithWallToggled = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if(node.isStart || node.isFinish) return newGrid;
  const newNode = { ...node, isWall: !node.isWall };
  newGrid[row][col] = newNode;
  return newGrid;
};
