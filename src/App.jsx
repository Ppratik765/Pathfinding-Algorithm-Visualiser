// src/App.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Grid } from './components/Grid';
import { Play, RefreshCw, SplitSquareHorizontal, MousePointer2, Moon, Sun, Grid3X3 } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [algo1, setAlgo1] = useState('dijkstra');
  const [algo2, setAlgo2] = useState('astar');
  const [winner, setWinner] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [masterGrid, setMasterGrid] = useState(null);

  const grid1Ref = useRef();
  const grid2Ref = useRef();

  // Dark Mode Toggle Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleRun = () => {
    setWinner(null);
    if (grid1Ref.current) grid1Ref.current.animate();
    if (isComparisonMode && grid2Ref.current) grid2Ref.current.animate();
  };

  const handleReset = () => {
    setWinner(null);
    if (grid1Ref.current) grid1Ref.current.reset();
    if (grid2Ref.current) grid2Ref.current.reset();
    window.location.reload(); 
  };

  const handleGenerateMaze = () => {
     if (grid1Ref.current) grid1Ref.current.generateMaze();
     // Reset visuals but keep walls
     setWinner(null);
  };

  const handleFinish = (id, time) => {
    if(!isComparisonMode) return;
    setWinner(prev => {
        if(!prev) return { id, time };
        if(time < prev.time) return { id, time };
        return prev;
    });
  };

  const AlgorithmSelect = ({ value, onChange, color }) => (
    <select 
        value={value} 
        onChange={onChange}
        className={`px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 transition-colors`}
    >
        <option value="dijkstra">Dijkstra's Algorithm</option>
        <option value="astar">A* Search</option>
        <option value="bfs">Breadth-First Search (BFS)</option>
        <option value="dfs">Depth-First Search (DFS)</option>
        <option value="greedy">Greedy Best-First</option>
        {/* Placeholder for complex ones if you add them later */}
        <option value="bidirectional" disabled>Bidirectional (Coming Soon)</option>
    </select>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Header with Dark Mode Toggle */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">
            Path<span className="text-blue-600">Viz</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Interactive Algorithm Visualizer</p>
        </div>
        
        <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
            {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-gray-600"/>}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center mb-6 w-full max-w-4xl justify-center z-10">
        
        <button 
          onClick={() => setIsComparisonMode(!isComparisonMode)}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm",
            isComparisonMode 
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          <SplitSquareHorizontal size={18} />
          {isComparisonMode ? "Disable Compare" : "Compare"}
        </button>

        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden md:block"></div>

        <AlgorithmSelect value={algo1} onChange={(e) => setAlgo1(e.target.value)} color="blue" />

        {isComparisonMode && (
          <>
            <span className="text-gray-400 font-bold text-sm">VS</span>
            <AlgorithmSelect value={algo2} onChange={(e) => setAlgo2(e.target.value)} color="purple" />
          </>
        )}

        <button 
          onClick={handleRun}
          className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-transform active:scale-95"
        >
          <Play size={18} /> Run
        </button>

        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-bold transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Grids Container */}
      <div className={clsx(
        "flex gap-4 items-start w-full transition-all duration-500",
        isComparisonMode ? "justify-center" : "justify-center"
      )}>
        
        {/* Grid 1 */}
        <div className={clsx(
            "relative transition-all duration-300 rounded-xl p-1",
            winner && winner.id === 1 ? "ring-4 ring-green-400 shadow-2xl scale-105" : "",
            winner && winner.id === 2 ? "opacity-50 blur-sm" : ""
        )}>
           <Grid 
             ref={grid1Ref} 
             algoType={algo1} 
             onGridUpdate={setMasterGrid} 
             onFinish={(time) => handleFinish(1, time)}
           />
        </div>

        {/* Grid 2 */}
        {isComparisonMode && (
             <div className={clsx(
                "relative transition-all duration-300 rounded-xl p-1",
                winner && winner.id === 2 ? "ring-4 ring-green-400 shadow-2xl scale-105" : "",
                winner && winner.id === 1 ? "opacity-50 blur-sm" : ""
            )}>
                <Grid 
                  ref={grid2Ref} 
                  algoType={algo2} 
                  isComparison={true}
                  masterGridState={masterGrid} 
                  onFinish={(time) => handleFinish(2, time)}
                />
                 {/* Overlay */}
                 <div className="absolute inset-0 z-10 cursor-not-allowed bg-transparent"></div>
             </div>
        )}

      </div>
      
      {/* Footer Controls (Maze) */}
      <div className="mt-8 flex gap-4">
        <button 
            onClick={handleGenerateMaze}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white dark:bg-gray-700 rounded-full shadow-lg hover:scale-105 transition-all"
        >
            <Grid3X3 size={20} /> Generate Random Maze
        </button>
      </div>

    </div>
  );
}

export default App;