import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { RotateCcw, Trees, Waves } from 'lucide-react'; // Added Icons
import { runAlgorithm, generateMazeRecursiveDivision } from '../algorithms';

const ROW_COUNT = 20; 
const COL_COUNT = 45; 

// WEIGHT COSTS
const COST_FOREST = 3;
const COST_MUD = 5;
const COST_WATER = 10;

const createNode = (col, row, startRow = 8, startCol = 5, finishRow = 8, finishCol = 35) => {
  return {
    col,
    row,
    isStart: row === startRow && col === startCol,
    isFinish: row === finishRow && col === finishCol,
    distance: Infinity,
    g: Infinity, 
    f: Infinity,
    isVisited: false,
    isWall: false,
    weight: 1, 
    terrainType: 'none', // 'none', 'forest', 'mud', 'water'
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

export const Grid = forwardRef(({ algoType, onFinish, isComparison = false, masterGridState = null, onGridUpdate, winStatus, drawMode, is3D }, ref) => {
  const [grid, setGrid] = useState(getInitialGrid());
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [dragNode, setDragNode] = useState(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [showReplay, setShowReplay] = useState(false);

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

  const findStartFinish = (currentGrid) => {
      let start, finish;
      for (let r of currentGrid) {
          for (let n of r) {
              if (n.isStart) start = n;
              if (n.isFinish) finish = n;
          }
      }
      return { start, finish };
  };

  const runAnimation = () => {
      setShowReplay(false);
      const container = document.getElementById(`grid-container-${algoType}`);
      if(container) {
          container.querySelectorAll('.node-visited, .node-path').forEach(el => 
            el.classList.remove('node-visited', 'node-path')
          );
      }

      for (let row of grid) {
          for (let node of row) {
              node.distance = Infinity;
              node.g = Infinity;
              node.f = Infinity;
              node.isVisited = false;
              node.previousNode = null;
              node.nextNode = null;
          }
      }

      const { start, finish } = findStartFinish(grid);
      if (!start || !finish) return;

      const startTime = performance.now();
      const { visitedNodesInOrder, path } = runAlgorithm(grid, start, finish, algoType);
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
    animate() { runAnimation(); },
    reset: () => {
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) {
             container.querySelectorAll('.node-visited, .node-path').forEach(el => 
                el.classList.remove('node-visited', 'node-path')
            );
        }
        if(!isComparison) setGrid(getInitialGrid()); 
    },
    clearWalls: () => {
        const { start, finish } = findStartFinish(grid);
        const newGrid = getInitialGrid().map(row => 
            row.map(node => {
                const isS = node.row === start.row && node.col === start.col;
                const isF = node.row === finish.row && node.col === finish.col;
                return { ...node, isStart: isS, isFinish: isF };
            })
        );
        setGrid(newGrid);
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) {
             container.querySelectorAll('.node-visited, .node-path').forEach(el => 
                el.classList.remove('node-visited', 'node-path')
            );
        }
        if(onGridUpdate) onGridUpdate(newGrid);
    },
    generateMaze() {
        if(isComparison) return;
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) {
             container.querySelectorAll('.node-visited, .node-path').forEach(el => 
                el.classList.remove('node-visited', 'node-path')
            );
        }

        const { start, finish } = findStartFinish(grid);
        const wallNodes = generateMazeRecursiveDivision(grid, start, finish);
        
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
    const node = grid[row][col];
    if (node.isStart) { setDragNode('start'); setMouseIsPressed(true); return; }
    if (node.isFinish) { setDragNode('finish'); setMouseIsPressed(true); return; }

    const newGrid = toggleNode(grid, row, col, drawMode);
    setGrid(newGrid);
    setMouseIsPressed(true);
    if(onGridUpdate) onGridUpdate(newGrid);
  };

  const handleMouseEnter = (row, col) => {
    if (!mouseIsPressed || isComparison) return;
    if (dragNode) {
        const newGrid = moveSpecialNode(grid, row, col, dragNode);
        setGrid(newGrid);
        if(onGridUpdate) onGridUpdate(newGrid);
        return;
    }
    const newGrid = toggleNode(grid, row, col, drawMode);
    setGrid(newGrid);
    if(onGridUpdate) onGridUpdate(newGrid);
  };

  const handleMouseUp = () => { setMouseIsPressed(false); setDragNode(null); };

  const borderClass = winStatus === 'winner' ? 'ring-4 ring-green-500 shadow-green-500/50' 
                   : winStatus === 'loser' ? 'ring-4 ring-red-500 shadow-red-500/50'
                   : 'border border-gray-200 dark:border-gray-700';

  return (
    <div className="flex flex-col items-center relative group" style={{ perspective: '1000px' }}>
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
        className={clsx(
            "bg-white dark:bg-dark-panel p-1 rounded shadow-xl leading-[0] relative transition-all duration-500", 
            borderClass,
            is3D && "transform rotate-x-12 scale-95 shadow-2xl"
        )}
        style={is3D ? { transform: 'rotateX(25deg) scale(0.9)', transformStyle: 'preserve-3d' } : {}}
      >
        {/* Replay Button - Z-Index 100 to stay on top */}
        {showReplay && (
            <button onClick={runAnimation} className="absolute inset-0 z-[100] flex items-center justify-center bg-black/10 hover:bg-black/20 backdrop-blur-[1px] transition-all opacity-0 hover:opacity-100 group-hover:opacity-100">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-2xl transform hover:scale-110 transition-transform">
                    <RotateCcw size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
            </button>
        )}

        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((node, nodeIdx) => {
              const { row, col, isFinish, isStart, isWall, weight, terrainType } = node;
              
              let extraClass = '';
              let innerContent = null;

              if (isStart) extraClass = 'node-start cursor-grab active:cursor-grabbing z-50 scale-110';
              else if (isFinish) extraClass = 'node-end cursor-grab active:cursor-grabbing z-50 scale-110';
              else if (isWall) {
                  extraClass = 'node-wall bg-gray-800 dark:bg-white border-gray-900 dark:border-white z-10';
                  if(is3D) extraClass += ' shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transform translate-z-4'; 
              }
              else if (terrainType === 'mud') {
                  extraClass = 'bg-mud dark:bg-amber-900 border-amber-800 opacity-90';
              }
              else if (terrainType === 'forest') {
                  extraClass = 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800';
                  innerContent = <Trees size={14} className="text-forest dark:text-green-400 opacity-80" />;
              }
              else if (terrainType === 'water') {
                  extraClass = 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800';
                  innerContent = <Waves size={14} className="text-water dark:text-blue-400 opacity-80" />;
              }

              return (
                    <div
                        key={nodeIdx}
                        id={`node-${algoType}-${row}-${col}`}
                        className={clsx(
                            "w-5 h-5 border-[0.5px] border-blue-50/20 inline-flex items-center justify-center select-none relative transition-transform", 
                            extraClass
                        )}
                        onMouseDown={() => handleMouseDown(row, col)}
                        onMouseEnter={() => handleMouseEnter(row, col)}
                        onMouseUp={handleMouseUp}
                    >
                       {/* Render Icon if Forest or Water */}
                       {!isStart && !isFinish && !isWall && innerContent}
                       
                       {/* Cross for mud if no specific icon */}
                       {terrainType === 'mud' && !isStart && !isFinish && (
                            <div className="w-full h-full flex items-center justify-center opacity-30 text-[8px] text-white">⨉</div>
                       )}
                    </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

// Helper: Toggle Wall or Weight
const toggleNode = (grid, row, col, mode) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if(node.isStart || node.isFinish) return newGrid;
  
  const newNode = { ...node };
  
  // Logic: Clicking the same thing removes it
  if (mode === 'wall') {
      newNode.isWall = !newNode.isWall;
      newNode.terrainType = 'none';
      newNode.weight = 1;
  } else {
      // It's a terrain tool
      newNode.isWall = false;
      if (newNode.terrainType === mode) {
          // Toggle off
          newNode.terrainType = 'none';
          newNode.weight = 1;
      } else {
          newNode.terrainType = mode;
          if(mode === 'mud') newNode.weight = COST_MUD;
          if(mode === 'forest') newNode.weight = COST_FOREST;
          if(mode === 'water') newNode.weight = COST_WATER;
      }
  }
  
  newGrid[row][col] = newNode;
  return newGrid;
};

// Helper: Move Start or Finish
const moveSpecialNode = (grid, row, col, type) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (node.isWall) return newGrid; 
    if (type === 'start' && node.isFinish) return newGrid;
    if (type === 'finish' && node.isStart) return newGrid;

    const currentGrid = newGrid.map(r => r.map(n => {
        if (type === 'start' && n.isStart) return { ...n, isStart: false };
        if (type === 'finish' && n.isFinish) return { ...n, isFinish: false };
        return n;
    }));

    currentGrid[row][col] = {
        ...currentGrid[row][col],
        isStart: type === 'start',
        isFinish: type === 'finish'
    };

    return currentGrid;
};
