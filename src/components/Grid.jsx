import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { RotateCcw } from 'lucide-react';
import { runAlgorithm, generateMazeRecursiveDivision, generateMazePrims } from '../algorithms';

const ROW_COUNT = 20; 
const COL_COUNT = 45; 

const createNode = (col, row, startR, startC, endR, endC) => {
  return {
    col,
    row,
    isStart: row === startR && col === startC,
    isFinish: row === endR && col === endC,
    distance: Infinity,
    g: Infinity, 
    f: Infinity,
    isVisited: false,
    isWall: false,
    weight: 1, // 1 = Normal, 5 = Mud, 10 = Forest, 50 = Water
    previousNode: null,
    nextNode: null,
  };
};

const getInitialGrid = (startR, startC, endR, endC) => {
  const grid = [];
  for (let row = 0; row < ROW_COUNT; row++) {
    const currentRow = [];
    for (let col = 0; col < COL_COUNT; col++) {
      currentRow.push(createNode(col, row, startR, startC, endR, endC));
    }
    grid.push(currentRow);
  }
  return grid;
};

export const Grid = forwardRef(({ algoType, onFinish, isComparison = false, masterGridState = null, onGridUpdate, winStatus, currentTool, is3D, mazeType }, ref) => {
  // Dynamic Start/End Positions
  const [startPos, setStartPos] = useState({ r: 8, c: 5 });
  const [finishPos, setFinishPos] = useState({ r: 8, c: 35 });
  
  const [grid, setGrid] = useState(getInitialGrid(8, 5, 8, 35));
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [dragNode, setDragNode] = useState(null); // 'start' or 'finish'
  const [executionTime, setExecutionTime] = useState(0);
  const [showReplay, setShowReplay] = useState(false);

  // Sync with master grid if in comparison mode
  useEffect(() => {
    if (masterGridState && isComparison) {
        // Deep copy visual state from master, but reset algorithmic state
        const newGrid = masterGridState.map(row => 
            row.map(node => ({
                ...node, 
                distance: Infinity, g: Infinity, f: Infinity,
                isVisited: false, previousNode: null, nextNode: null
            }))
        );
        setGrid(newGrid);
        
        // Sync Start/End positions visually
        // (We find them in the master grid to update local state if needed, 
        // though strictly visual mapping handles it via isStart/isFinish props)
    }
  }, [masterGridState, isComparison]);

  const runAnimation = () => {
      setShowReplay(false);
      const container = document.getElementById(`grid-container-${algoType}`);
      if(container) {
          container.querySelectorAll('.node-visited, .node-path').forEach(el => {
              el.classList.remove('node-visited', 'node-path');
          });
      }

      // Soft reset data
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

      // Find current start/end nodes based on state
      const startNode = grid[startPos.r][startPos.c];
      const finishNode = grid[finishPos.r][finishPos.c];
      
      const startTime = performance.now();
      const { visitedNodesInOrder, path } = runAlgorithm(grid, startNode, finishNode, algoType);
      const endTime = performance.now();
      const timeTaken = (endTime - startTime).toFixed(2);
      
      for (let i = 0; i <= visitedNodesInOrder.length; i++) {
        if (i === visitedNodesInOrder.length) {
          setTimeout(() => animatePath(path, timeTaken), 5 * i);
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
    animate: runAnimation,
    reset: () => {
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) container.querySelectorAll('.node-visited, .node-path').forEach(el => el.classList.remove('node-visited', 'node-path'));
        if(!isComparison) {
            // Keep walls/weights but reset algorithm
            setGrid(prev => prev.map(row => row.map(node => ({...node, distance: Infinity, isVisited: false}))));
        }
    },
    clearWalls: () => {
        setGrid(getInitialGrid(startPos.r, startPos.c, finishPos.r, finishPos.c));
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) container.querySelectorAll('.node-visited, .node-path').forEach(el => el.classList.remove('node-visited', 'node-path'));
    },
    generateMaze() {
        if(isComparison) return;
        setExecutionTime(0);
        setShowReplay(false);
        const container = document.getElementById(`grid-container-${algoType}`);
        if(container) container.querySelectorAll('.node-visited, .node-path').forEach(el => el.classList.remove('node-visited', 'node-path'));

        // Choose Maze Algo
        const mazeFunc = mazeType === 'prims' ? generateMazePrims : generateMazeRecursiveDivision;
        
        const startNode = grid[startPos.r][startPos.c];
        const finishNode = grid[finishPos.r][finishPos.c];
        const wallNodes = mazeFunc(grid, startNode, finishNode);
        
        for(let i = 0; i < wallNodes.length; i++) {
            setTimeout(() => {
                const node = wallNodes[i];
                const newGrid = grid.slice(); // shallow copy
                // Walls overwrite weights
                newGrid[node.row][node.col].isWall = true;
                newGrid[node.row][node.col].weight = 1; 
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

  // --- INTERACTION LOGIC ---

  const handleMouseDown = (row, col) => {
    if(isComparison) return;
    const node = grid[row][col];
    
    // Check if clicking Start or End
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

    // Normal drawing
    const newGrid = applyTool(grid, row, col, currentTool);
    setGrid(newGrid);
    setMouseIsPressed(true);
    if(onGridUpdate) onGridUpdate(newGrid);
  };

  const handleMouseEnter = (row, col) => {
    if (!mouseIsPressed || isComparison) return;

    if (dragNode) {
        // Moving Start/End
        const newGrid = grid.slice();
        const prevR = dragNode === 'start' ? startPos.r : finishPos.r;
        const prevC = dragNode === 'start' ? startPos.c : finishPos.c;

        // Don't overlap start and end
        if (dragNode === 'start' && row === finishPos.r && col === finishPos.c) return;
        if (dragNode === 'finish' && row === startPos.r && col === startPos.c) return;
        if (grid[row][col].isWall) return; // Optional: Can't place start on wall

        // Clear old pos
        newGrid[prevR][prevC][dragNode === 'start' ? 'isStart' : 'isFinish'] = false;
        // Set new pos
        newGrid[row][col][dragNode === 'start' ? 'isStart' : 'isFinish'] = true;
        
        if (dragNode === 'start') setStartPos({r: row, c: col});
        else setFinishPos({r: row, c: col});

        setGrid([...newGrid]);
        if(onGridUpdate) onGridUpdate(newGrid);
    } else {
        // Drawing
        const newGrid = applyTool(grid, row, col, currentTool);
        setGrid(newGrid);
        if(onGridUpdate) onGridUpdate(newGrid);
    }
  };

  const handleMouseUp = () => {
      setMouseIsPressed(false);
      setDragNode(null);
  };

  const applyTool = (grid, row, col, tool) => {
      const newGrid = grid.slice();
      const node = newGrid[row][col];
      if (node.isStart || node.isFinish) return newGrid;

      // Reset
      node.isWall = false;
      node.weight = 1;

      if (tool === 'wall') node.isWall = true;
      else if (tool === 'mud') node.weight = 5;
      else if (tool === 'forest') node.weight = 10;
      else if (tool === 'water') node.weight = 50;
      else if (tool === 'eraser') { /* already reset above */ }
      
      return newGrid;
  };

  const borderClass = winStatus === 'winner' ? 'ring-4 ring-green-500 shadow-green-500/50' 
                   : winStatus === 'loser' ? 'ring-4 ring-red-500 shadow-red-500/50'
                   : 'border border-gray-200 dark:border-gray-700';

  return (
    <div className={clsx("flex flex-col items-center relative group transition-all duration-700", is3D ? "perspective-1000" : "")}>
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
            is3D ? "transform-3d rotate-x-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : ""
        )}
        style={is3D ? { transform: 'rotateX(20deg) scale(0.95)' } : {}}
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
              
              // Dynamic Class Generation
              let cellClass = "w-5 h-5 border-[0.5px] border-blue-50/20 inline-block select-none transition-transform duration-200 ";
              
              if (isStart) cellClass += "node-start ";
              else if (isFinish) cellClass += "node-end ";
              else if (isWall) {
                  cellClass += "node-wall bg-gray-800 dark:bg-white border-gray-900 dark:border-white ";
                  if(is3D) cellClass += "transform translate-z-4 shadow-lg "; // Pop up walls in 3D
              }
              else if (weight === 5) cellClass += "bg-amber-700/50 dark:bg-amber-800/80 "; // Mud
              else if (weight === 10) cellClass += "bg-emerald-700/50 dark:bg-emerald-800/80 "; // Forest
              else if (weight === 50) cellClass += "bg-cyan-700/50 dark:bg-cyan-800/80 "; // Water

              return (
                    <div
                        key={nodeIdx}
                        id={`node-${algoType}-${row}-${col}`}
                        className={cellClass}
                        onMouseDown={() => handleMouseDown(row, col)}
                        onMouseEnter={() => handleMouseEnter(row, col)}
                        onMouseUp={handleMouseUp}
                        // Tooltip for weights
                        title={weight > 1 ? `Cost: ${weight}` : ''}
                    ></div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
