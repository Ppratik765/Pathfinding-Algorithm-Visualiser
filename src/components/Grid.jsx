import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { RotateCcw } from 'lucide-react';
import { runAlgorithm, generateMazePrims } from '../algorithms';

const ROW_COUNT = 20; 
const COL_COUNT = 45; 

const createNode = (col, row) => {
  return {
    col,
    row,
    isStart: row === 8 && col === 5,
    isFinish: row === 8 && col === 35,
    distance: Infinity,
    g: Infinity, f: Infinity,
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

export const Grid = forwardRef(({ algoType, onFinish, isComparison = false, masterGridState = null, onGridUpdate, winStatus, is3D, tool }, ref) => {
  const [grid, setGrid] = useState(getInitialGrid());
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [showReplay, setShowReplay] = useState(false);
  const [hasRun, setHasRun] = useState(false); // Tracks if algo finished once

  // Dragging State
  const [draggingNode, setDraggingNode] = useState(null); // 'start' or 'finish'

  // Sync with master
  useEffect(() => {
    if (masterGridState && isComparison) {
        // Deep copy grid but reset alg data
        setGrid(masterGridState.map(row => row.map(node => ({
            ...node, 
            distance: Infinity, g: Infinity, f: Infinity, isVisited: false, previousNode: null, nextNode: null
        }))));
    }
  }, [masterGridState, isComparison]);

  const clearVisuals = () => {
      const container = document.getElementById(`grid-container-${algoType}`);
      if(container) {
          container.querySelectorAll('.node-visited').forEach(el => el.classList.remove('node-visited'));
          container.querySelectorAll('.node-path').forEach(el => el.classList.remove('node-path'));
      }
  };

  const softResetGridData = (currentGrid) => {
      for (let row of currentGrid) {
          for (let node of row) {
              node.distance = Infinity;
              node.g = Infinity;
              node.f = Infinity;
              node.isVisited = false;
              node.previousNode = null;
              node.nextNode = null;
          }
      }
  };

  const instantRun = (currentGrid) => {
      // 1. Clear visuals instantly
      clearVisuals();
      softResetGridData(currentGrid);

      // 2. Find start/end
      let startNode, finishNode;
      for(let row of currentGrid) {
          for(let node of row) {
              if(node.isStart) startNode = node;
              if(node.isFinish) finishNode = node;
          }
      }
      
      // 3. Run Algo Sync
      const startTime = performance.now();
      const { visitedNodesInOrder, path } = runAlgorithm(currentGrid, startNode, finishNode, algoType);
      const endTime = performance.now();
      setExecutionTime((endTime - startTime).toFixed(2));

      // 4. Paint Sync (No timeout)
      for (const node of visitedNodesInOrder) {
          const el = document.getElementById(`node-${algoType}-${node.row}-${node.col}`);
          if(el && !node.isStart && !node.isFinish) el.classList.add('node-visited');
      }
      for (const node of path) {
          const el = document.getElementById(`node-${algoType}-${node.row}-${node.col}`);
          if(el && !node.isStart && !node.isFinish) el.classList.add('node-path');
      }
  };

  const animate = () => {
      setHasRun(false);
      clearVisuals();
      softResetGridData(grid);
      
      let startNode, finishNode;
      for(let row of grid) for(let node of row) {
          if(node.isStart) startNode = node;
          if(node.isFinish) finishNode = node;
      }

      const startTime = performance.now();
      const { visitedNodesInOrder, path } = runAlgorithm(grid, startNode, finishNode, algoType);
      const endTime = performance.now();
      const timeTaken = (endTime - startTime).toFixed(2);

      // Visualization Loop
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

  const animatePath = (path, timeTaken) => {
    for (let i = 0; i < path.length; i++) {
      setTimeout(() => {
        const node = path[i];
        const el = document.getElementById(`node-${algoType}-${node.row}-${node.col}`);
        if(el && !node.isStart && !node.isFinish) el.classList.add('node-path');
        if(i === path.length - 1) {
            setExecutionTime(timeTaken);
            setShowReplay(true);
            setHasRun(true); // Enable instant drag
            if(onFinish) onFinish(algoType, parseFloat(timeTaken));
        }
      }, 30 * i);
    }
  };

  useImperativeHandle(ref, () => ({
    animate,
    reset: () => {
        setHasRun(false);
        setExecutionTime(0);
        setShowReplay(false);
        clearVisuals();
        if(!isComparison) setGrid(getInitialGrid());
    },
    clearWalls: () => {
        setHasRun(false);
        setExecutionTime(0);
        setShowReplay(false);
        clearVisuals();
        setGrid(prev => prev.map(row => row.map(n => ({...n, isWall: false, weight: 1}))));
    },
    generateMaze: () => {
        if(isComparison) return;
        setHasRun(false);
        clearVisuals();
        // Use Prims
        const wallNodes = generateMazePrims(getInitialGrid()); 
        
        // Reset grid to clean state then apply walls
        const cleanGrid = getInitialGrid();
        wallNodes.forEach(w => cleanGrid[w.row][w.col].isWall = true);
        
        setGrid(cleanGrid);
        if(onGridUpdate) onGridUpdate(cleanGrid);
    }
  }));

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (row, col) => {
      if(isComparison) return;
      const node = grid[row][col];
      
      // Check if clicking start/finish
      if(node.isStart) {
          setDraggingNode('start');
          setMouseIsPressed(true);
          return;
      }
      if(node.isFinish) {
          setDraggingNode('finish');
          setMouseIsPressed(true);
          return;
      }

      // Normal Draw
      const newGrid = updateGridWithTool(grid, row, col, tool);
      setGrid(newGrid);
      setMouseIsPressed(true);
      if(onGridUpdate) onGridUpdate(newGrid);
  };

  const handleMouseEnter = (row, col) => {
      if (!mouseIsPressed || isComparison) return;

      // Handle Node Dragging
      if (draggingNode) {
          const newGrid = grid.slice();
          // Remove old start/finish
          for(let r=0; r<ROW_COUNT; r++) for(let c=0; c<COL_COUNT; c++) {
              if(draggingNode === 'start') newGrid[r][c].isStart = false;
              if(draggingNode === 'finish') newGrid[r][c].isFinish = false;
          }
          // Set new
          const node = newGrid[row][col];
          if(!node.isWall) { // Don't drag into wall
             if(draggingNode === 'start') node.isStart = true;
             if(draggingNode === 'finish') node.isFinish = true;
          }
          
          setGrid([...newGrid]);
          if(onGridUpdate) onGridUpdate(newGrid);

          // INSTANT RE-RUN LOGIC
          if(hasRun) instantRun(newGrid);
          return;
      }

      // Normal Draw
      const newGrid = updateGridWithTool(grid, row, col, tool);
      setGrid(newGrid);
      if(onGridUpdate) onGridUpdate(newGrid);
  };

  const handleMouseUp = () => {
      setMouseIsPressed(false);
      setDraggingNode(null);
  };

  const updateGridWithTool = (grid, row, col, tool) => {
      const newGrid = grid.slice();
      const node = newGrid[row][col];
      if(node.isStart || node.isFinish) return newGrid;

      // Reset props
      node.isWall = false;
      node.weight = 1;

      if (tool === 'wall') node.isWall = true;
      else if (tool === 'mud') node.weight = 5;
      else if (tool === 'forest') node.weight = 15;
      else if (tool === 'eraser') { /* Already reset above */ }

      return newGrid;
  };

  return (
    <div className={clsx("flex flex-col items-center relative group perspective-container")}>
        {/* Header/Timer Code from previous... */}
        <div className="mb-0.5 flex justify-between w-full px-1 text-[10px] sm:text-xs font-mono font-bold text-gray-600 dark:text-gray-300 leading-tight">
             <span className="uppercase">{algoType}</span>
             <span className={clsx("transition-opacity duration-300", executionTime > 0 ? "opacity-100" : "opacity-0", 
                 winStatus === 'winner' ? 'text-green-600 dark:text-green-400 font-extrabold' : 'text-gray-600 dark:text-gray-400'
             )}>{executionTime}ms</span>
        </div>

        <div 
            id={`grid-container-${algoType}`}
            className={clsx(
                "bg-white dark:bg-dark-panel p-1 rounded shadow-xl leading-[0] relative transition-all duration-500",
                winStatus === 'winner' ? 'ring-4 ring-green-500' : winStatus === 'loser' ? 'ring-4 ring-red-500' : 'border border-gray-200 dark:border-gray-700',
                is3D && "grid-3d"
            )}
        >
            {showReplay && !isComparison && (
                 /* Only show replay button if NOT dragging instant mode */
                 <button onClick={animate} className="absolute inset-0 z-40 flex items-center justify-center bg-black/5 hover:bg-black/10 backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity">
                    <RotateCcw size={32} className="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-full p-2 shadow-xl"/>
                 </button>
            )}

            {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex">
                {row.map((node, nodeIdx) => {
                const { isFinish, isStart, isWall, weight } = node;
                let extraClass = '';
                if (isFinish) extraClass = 'node-end';
                else if (isStart) extraClass = 'node-start';
                else if (isWall) extraClass = is3D ? 'node-wall node-3d-wall' : 'node-wall';
                else if (weight === 5) extraClass = 'node-mud';
                else if (weight === 15) extraClass = 'node-forest';

                return (
                    <div
                        key={nodeIdx}
                        id={`node-${algoType}-${node.row}-${node.col}`}
                        className={clsx(
                            "w-5 h-5 border-[0.5px] border-blue-50/20 inline-block select-none",
                            extraClass
                        )}
                        onMouseDown={() => handleMouseDown(node.row, node.col)}
                        onMouseEnter={() => handleMouseEnter(node.row, node.col)}
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
