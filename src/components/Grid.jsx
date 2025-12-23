import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { Node } from './Node';
import { runAlgorithm, generateMazeRecursiveDivision } from '../algorithms';

const START_NODE_ROW = 5;
const START_NODE_COL = 5;
const FINISH_NODE_ROW = 5;
const FINISH_NODE_COL = 25;

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
    nextNode: null, // For bidirectional
  };
};

const getInitialGrid = (rows = 15, cols = 40) => {
  const grid = [];
  for (let row = 0; row < rows; row++) {
    const currentRow = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push(createNode(col, row));
    }
    grid.push(currentRow);
  }
  return grid;
};

export const Grid = forwardRef(({ algoType, onFinish, isComparison = false, masterGridState = null, onGridUpdate }, ref) => {
  const [grid, setGrid] = useState(getInitialGrid());
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

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

  const resetVisuals = () => {
    // Clear DOM classes manually
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        const suffix = isComparison ? '-comp' : '';
        const element = document.getElementById(`node-${row}-${col}${suffix}`);
        if(element) {
            // Keep wall/start/end classes, remove visited/path
            element.classList.remove('node-visited', 'node-path');
        }
      }
    }
    
    if(!isComparison) {
       // Reset state values
       setGrid(prev => prev.map(row => row.map(node => ({
           ...node, 
           distance: Infinity, g: Infinity, f: Infinity,
           isVisited: false, previousNode: null, nextNode: null
       }))));
    }
    setExecutionTime(0);
  };

  useImperativeHandle(ref, () => ({
    animate() {
      resetVisuals();
      const startNode = grid[START_NODE_ROW][START_NODE_COL];
      const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
      
      const startTime = performance.now();
      const { visitedNodesInOrder, path } = runAlgorithm(grid, startNode, finishNode, algoType);
      const endTime = performance.now();
      
      const timeTaken = (endTime - startTime).toFixed(2);
      
      // Animate Visited
      for (let i = 0; i <= visitedNodesInOrder.length; i++) {
        if (i === visitedNodesInOrder.length) {
          setTimeout(() => {
            animatePath(path, timeTaken);
          }, 10 * i);
          return;
        }
        setTimeout(() => {
          const node = visitedNodesInOrder[i];
          const suffix = isComparison ? '-comp' : '';
          const el = document.getElementById(`node-${node.row}-${node.col}${suffix}`);
          if(el && !node.isStart && !node.isFinish) el.classList.add('node-visited');
        }, 10 * i);
      }
    },
    reset: resetVisuals,
    generateMaze() {
        if(isComparison) return; // Only master can gen maze
        resetVisuals();
        const startNode = grid[START_NODE_ROW][START_NODE_COL];
        const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
        const wallNodes = generateMazeRecursiveDivision(grid, startNode, finishNode);
        
        // Animate Walls
        for(let i = 0; i < wallNodes.length; i++) {
            setTimeout(() => {
                const node = wallNodes[i];
                const newGrid = grid.slice();
                newGrid[node.row][node.col].isWall = true;
                setGrid([...newGrid]); // Trigger re-render to show wall
                if(onGridUpdate) onGridUpdate(newGrid);
            }, 10 * i);
        }
    },
    clearWalls() {
        const newGrid = getInitialGrid();
        setGrid(newGrid);
        if(onGridUpdate) onGridUpdate(newGrid);
        resetVisuals();
    }
  }));

  const animatePath = (nodesInShortestPathOrder, timeTaken) => {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        const suffix = isComparison ? '-comp' : '';
        const el = document.getElementById(`node-${node.row}-${node.col}${suffix}`);
        if(el && !node.isStart && !node.isFinish) el.classList.add('node-path');
        
        if(i === nodesInShortestPathOrder.length - 1 && onFinish) {
            onFinish(parseFloat(timeTaken));
            setExecutionTime(timeTaken);
        }
      }, 40 * i);
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

  return (
    <div className="flex flex-col items-center">
       <div className="mb-1 flex justify-between w-full px-2 text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
         <span className="uppercase">{algoType}</span>
         {executionTime > 0 && <span className="text-green-600 dark:text-green-400">Time: {executionTime}ms</span>}
      </div>
      {/* GAP REMOVED: 
        We use flex-wrap with no gap. 
        Each node is a block. 
        Leading-none ensures no line-height gaps.
      */}
      <div className="bg-white dark:bg-dark-panel p-1 rounded shadow-xl border border-gray-200 dark:border-gray-700 leading-[0]">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((node, nodeIdx) => {
              const { row, col, isFinish, isStart, isWall } = node;
              const suffix = isComparison ? '-comp' : '';
              return (
                    <div
                        key={nodeIdx}
                        id={`node-${row}-${col}${suffix}`}
                        className={clsx(
                            "w-6 h-6 border-[0.5px] border-blue-50/20 inline-block select-none", // Reduced border width
                            isFinish ? 'node-end' : isStart ? 'node-start' : isWall ? 'node-wall' : ''
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
