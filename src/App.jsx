import React, { useRef, useState, useEffect } from 'react';
import { Grid } from './components/Grid';
import { Play, RefreshCw, SplitSquareVertical, Moon, Sun, BrickWall, Eraser } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [algo1, setAlgo1] = useState('dijkstra');
  const [algo2, setAlgo2] = useState('astar');
  
  // New Algorithm List
  const algorithms = [
      { value: 'dijkstra', label: 'Dijkstra Algorithm' },
      { value: 'astar', label: 'A* Search' },
      { value: 'bfs', label: 'Breadth-First Search (BFS)' },
      { value: 'dfs', label: 'Depth-First Search (DFS)' },
      { value: 'greedy', label: 'Greedy Best-First Search' },
      { value: 'bidirectional', label: 'Bidirectional BFS' },
  ];

  const [masterGrid, setMasterGrid] = useState(null);
  const grid1Ref = useRef();
  const grid2Ref = useRef();

  // Handle Dark Mode Class
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleRun = () => {
    if (grid1Ref.current) grid1Ref.current.animate();
    if (isComparisonMode && grid2Ref.current) grid2Ref.current.animate();
  };

  const handleReset = () => {
    if (grid1Ref.current) grid1Ref.current.reset();
    if (grid2Ref.current) grid2Ref.current.reset();
  };
  
  const handleClearWalls = () => {
     if (grid1Ref.current) grid1Ref.current.clearWalls();
  };

  const handleGenerateMaze = () => {
      // Clear first then gen
      handleClearWalls();
      // Small timeout to let clear state settle
      setTimeout(() => {
          if (grid1Ref.current) grid1Ref.current.generateMaze();
      }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
            Pathfinding <span className="text-blue-600 dark:text-blue-400">Visualizer</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Draw walls, generate mazes, and compare algorithms
            </p>
        </div>
        
        <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition-transform"
        >
            {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-gray-600"/>}
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-dark-panel p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-center mb-6 w-full max-w-5xl z-10 sticky top-2">
        
        {/* Algo 1 Select */}
        <select 
            value={algo1} 
            onChange={(e) => setAlgo1(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
            {algorithms.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>

        {/* Compare Toggle */}
        <button 
          onClick={() => setIsComparisonMode(!isComparisonMode)}
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all",
            isComparisonMode ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          <SplitSquareVertical size={16} />
          {isComparisonMode ? "Disable Compare" : "Compare"}
        </button>

        {isComparisonMode && (
          <select 
                value={algo2} 
                onChange={(e) => setAlgo2(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
                {algorithms.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
        )}

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>

        {/* Action Buttons */}
        <button onClick={handleRun} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-transform active:scale-95 text-sm">
          <Play size={16} /> Run
        </button>

        <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-bold text-sm">
          <RefreshCw size={16} /> Clear Path
        </button>
      </div>

      {/* Main Grid Area - Vertical Stack for Compare */}
      <div className={clsx(
        "flex flex-col gap-6 w-full items-center",
        // No side-by-side logic anymore, strictly vertical as requested
      )}>
        
        {/* Grid 1 */}
        <div className="relative">
           <Grid 
             ref={grid1Ref} 
             algoType={algo1} 
             onGridUpdate={setMasterGrid} 
           />
        </div>

        {/* Grid 2 (Stacked Below) */}
        {isComparisonMode && (
             <div className="relative opacity-90 hover:opacity-100 transition-opacity">
                <Grid 
                  ref={grid2Ref} 
                  algoType={algo2} 
                  isComparison={true}
                  masterGridState={masterGrid}
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                    Comparison View
                </div>
             </div>
        )}
      </div>

      {/* Bottom Maze Controls */}
      <div className="fixed bottom-6 flex gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-3 rounded-full shadow-2xl border border-gray-200 dark:border-gray-600 z-50">
        <button 
            onClick={handleGenerateMaze}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-lg transition-all hover:-translate-y-1"
        >
            <BrickWall size={16} /> Generate Maze
        </button>
        <button 
            onClick={handleClearWalls}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full font-bold text-sm shadow transition-all"
        >
            <Eraser size={16} /> Clear Board
        </button>
      </div>

    </div>
  );
}

export default App;
