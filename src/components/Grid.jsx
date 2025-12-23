import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { RotateCcw } from 'lucide-react';
import { runAlgorithm, generateMazeRecursiveDivision } from '../algorithms';

const ROW_COUNT = 20; 
const COL_COUNT = 45; 

// WEIGHT_COST: 1 is normal, 5 is mud
const MUD_WEIGHT = 5;

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
    weight: 1, // Default weight
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
  const [dragNode, setDragNode] = useState(null); // 'start' or 'finish'
  const [executionTime, setExecutionTime] = useState(0);
  const [showReplay, setShowReplay] = useState(false);

  // Sync with master grid if in comparison mode
  useEffect(() => {
    if (masterGridState && isComparison) {
        // Deep copy visual state from master but reset algorithms
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
          const visited = container.querySelectorAll('.node-visited');
          const paths = container.querySelectorAll('.node-path');
          visited.forEach(el => el.classList.remove('node-visited'));
          paths.forEach(el => el.classList.remove('node-path'));
      }

      // Soft Reset
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
            const visited = container.querySelectorAll('.node-visited');
            const paths = container.querySelectorAll('.node-path');
            visited.forEach(el => el.classList.remove('node-visited'));
            paths.forEach(el => el.classList.remove('node-path'));
        }
        if(!isComparison) {
            setGrid(getInitialGrid()); 
        }
    },
    clearWalls: () => {
        // Keeps start/end where they are, but removes walls/weights
        const { start, finish } = findStartFinish(grid);
        const newGrid = getInitialGrid().map(row => 
            row.map(node => {
                // Restore current start/end positions
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
        
        // Clear visuals
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

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (row, col) => {
    if(isComparison) return;
    const node = grid[row][col];
    
    // Check if dragging start/end
    if (node.isStart) {
        setDragNode('start');
        setMouseIsPressed(true);
        return;
    }
    if (node.isFinish) {
        setDragNode('finish');
        setMouseIsPressed(true);
        return;
    }

    // Normal Draw
    const newGrid = toggleNode(grid, row, col, drawMode);
    setGrid(newGrid);
    setMouseIsPressed(true);
    if(onGridUpdate) onGridUpdate(newGrid);
  };

  const handleMouseEnter = (row, col) => {
    if (!mouseIsPressed || isComparison) return;
    
    // Handle Dragging Nodes
    if (dragNode) {
        const newGrid = moveSpecialNode(grid, row, col, dragNode);
        setGrid(newGrid);
        if(onGridUpdate) onGridUpdate(newGrid);
        return;
    }

    // Handle Drawing
    const newGrid = toggleNode(grid, row, col, drawMode);
    setGrid(newGrid);
    if(onGridUpdate) onGridUpdate(newGrid);
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
    setDragNode(null);
  };

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
        // 3D Tilt Applied Here
        className={clsx(
            "bg-white dark:bg-dark-panel p-1 rounded shadow-xl leading-[0] relative transition-all duration-500", 
            borderClass,
            is3D && "transform rotate-x-12 scale-95 shadow-2xl"
        )}
        style={is3D ? { transform: 'rotateX(25deg) scale(0.9)', transformStyle: 'preserve-3d' } : {}}
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
              const { row, col, isFinish, isStart, isWall, weight } = node;
              
              let extraClass = '';
              if (isStart) extraClass = 'node-start cursor-grab active:cursor-grabbing z-20 scale-110';
              else if (isFinish) extraClass = 'node-end cursor-grab active:cursor-grabbing z-20 scale-110';
              else if (isWall) {
                  extraClass = 'node-wall bg-gray-800 dark:bg-white border-gray-900 dark:border-white';
                  if(is3D) extraClass += ' shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transform translate-z-4'; // Pop up effect
              }
              else if (weight > 1) {
                  // MUD visual
                  extraClass = 'bg-weight dark:bg-amber-900 border-amber-800 opacity-90';
                  // Optional: Add an icon via background-image in CSS, but color is enough
              }

              return (
                    <div
                        key={nodeIdx}
                        id={`node-${algoType}-${row}-${col}`}
                        className={clsx(
                            "w-5 h-5 border-[0.5px] border-blue-50/20 inline-block select-none relative transition-transform", 
                            extraClass
                        )}
                        onMouseDown={() => handleMouseDown(row, col)}
                        onMouseEnter={() => handleMouseEnter(row, col)}
                        onMouseUp={handleMouseUp}
                    >
                        {weight > 1 && !isStart && !isFinish && !isWall && (
                            <div className="w-full h-full flex items-center justify-center opacity-30 text-[8px]">
                                ⨉
                            </div>
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
  
  if (mode === 'wall') {
      newNode.isWall = !newNode.isWall;
      newNode.weight = 1; // Wall overrides weight
  } else if (mode === 'weight') {
      newNode.isWall = false; // Weight overrides wall
      newNode.weight = newNode.weight === 1 ? MUD_WEIGHT : 1;
  }
  
  newGrid[row][col] = newNode;
  return newGrid;
};

// Helper: Move Start or Finish
const moveSpecialNode = (grid, row, col, type) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    
    if (node.isWall) return newGrid; // Can't drag onto wall
    if (type === 'start' && node.isFinish) return newGrid;
    if (type === 'finish' && node.isStart) return newGrid;

    // Remove old special node
    const currentGrid = newGrid.map(r => r.map(n => {
        if (type === 'start' && n.isStart) return { ...n, isStart: false };
        if (type === 'finish' && n.isFinish) return { ...n, isFinish: false };
        return n;
    }));

    // Set new special node
    currentGrid[row][col] = {
        ...currentGrid[row][col],
        isStart: type === 'start',
        isFinish: type === 'finish'
    };

    return currentGrid;
};
