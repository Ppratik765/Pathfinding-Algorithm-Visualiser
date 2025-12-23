// src/components/Grid.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { Node } from './Node';
import { runAlgorithm } from '../algorithms';

const START_ROW = 5;
const START_COL = 5;
const FINISH_ROW = 10;
const FINISH_COL = 35;

const createNode = (col, row) => ({
  col,
  row,
  isStart: row === START_ROW && col === START_COL,
  isFinish: row === FINISH_ROW && col === FINISH_COL,
  distance: Infinity,
  totalDistance: Infinity, // For A*
  isVisited: false,
  isWall: false,
  previousNode: null,
});

const getInitialGrid = (rows = 20, cols = 50) => {
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

  // Sync with master grid
  useEffect(() => {
    if (masterGridState && isComparison) {
        const newGrid = masterGridState.map(row => 
            row.map(node => ({
                ...node, 
                distance: Infinity, 
                totalDistance: Infinity,
                isVisited: false, 
                previousNode: null
            }))
        );
        setGrid(newGrid);
    }
  }, [masterGridState, isComparison]);

  const resetVisuals = () => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        const suffix = isComparison ? '-comp' : '';
        const element = document.getElementById(`node-${row}-${col}${suffix}`);
        if(element) {
            element.className = element.className
                .replace('node-visited', '')
                .replace('node-path', '');
        }
      }
    }
    if(!isComparison) {
       const newGrid = grid.map(row => row.map(node => ({
           ...node, 
           distance: Infinity, 
           totalDistance: Infinity,
           isVisited: false, 
           previousNode: null
       })));
       setGrid(newGrid);
    }
    setExecutionTime(0);
  };

  useImperativeHandle(ref, () => ({
    animate() {
      resetVisuals();
      const startNode = grid[START_ROW][START_COL];
      const finishNode = grid[FINISH_ROW][FINISH_COL];
      
      const startTime = performance.now();
      const { visitedNodesInOrder, path } = runAlgorithm(grid, startNode, finishNode, algoType);
      const endTime = performance.now();
      const timeTaken = (endTime - startTime).toFixed(2);
      
      // Speed up animation if in comparison mode to keep it snappy
      const speed = isComparison ? 5 : 10;

      for (let i = 0; i <= visitedNodesInOrder.length; i++) {
        if (i === visitedNodesInOrder.length) {
          setTimeout(() => {
            animatePath(path, timeTaken);
          }, speed * i);
          return;
        }
        setTimeout(() => {
          const node = visitedNodesInOrder[i];
          const suffix = isComparison ? '-comp' : '';
          const el = document.getElementById(`node-${node.row}-${node.col}${suffix}`);
          if(el && !node.isStart && !node.isFinish) el.classList.add('node-visited');
        }, speed * i);
      }
    },
    reset: resetVisuals,
    // MAZE GENERATOR
    generateMaze() {
        const newGrid = getInitialGrid().map(row => row.map(node => ({...node})));
        // Simple Random Maze logic
        for(let row=0; row<newGrid.length; row++){
            for(let col=0; col<newGrid[0].length; col++){
                if(newGrid[row][col].isStart || newGrid[row][col].isFinish) continue;
                // 30% chance of wall
                if(Math.random() < 0.3) {
                    newGrid[row][col].isWall = true;
                }
            }
        }
        setGrid(newGrid);
        if(onGridUpdate) onGridUpdate(newGrid);
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
      <div className="mb-2 flex justify-between w-full px-4 text-sm font-mono font-bold text-gray-600 dark:text-gray-300">
         <span className="uppercase">{algoType}</span>
         {executionTime > 0 && <span className="text-green-600 dark:text-green-400">{executionTime}ms</span>}
      </div>
      
      {/* Container: Gap-0 for no spaces */}
      <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((node, nodeIdx) => {
              const { row, col, isFinish, isStart, isWall } = node;
              return (
                <div key={nodeIdx} id={isComparison ? `wrapper-${row}-${col}-comp` : `wrapper-${row}-${col}`}>
                    <Node
                        row={row}
                        col={col}
                        isStart={isStart}
                        isFinish={isFinish}
                        isWall={isWall}
                        isCompact={isComparison} // Pass isComparison to shrink nodes
                        onMouseDown={handleMouseDown}
                        onMouseEnter={handleMouseEnter}
                        onMouseUp={handleMouseUp}
                    />
                </div>
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
  const newNode = {
    ...node,
    isWall: !node.isWall,
  };
  newGrid[row][col] = newNode;
  return newGrid;
};