import React, { useRef, useState, useEffect } from 'react';
import { Grid } from './components/Grid';
import { Play, RefreshCw, Moon, Sun, BrickWall, Eraser, MousePointer2, Plus, Minus } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeAlgos, setActiveAlgos] = useState(['dijkstra']);
  const [results, setResults] = useState({});
  const [masterGrid, setMasterGrid] = useState(null);
  
  const gridRefs = useRef({});

  const allAlgorithms = [
      { value: 'dijkstra', label: 'Dijkstra Algorithm' },
      { value: 'Astar', label: 'A* Search' },
      { value: 'bfs', label: 'Breadth-First Search (BFS)' },
      { value: 'dfs', label: 'Depth-First Search (DFS)' },
      { value: 'greedy', label: 'Greedy Best-First Search' },
      { value: 'bidirectional', label: 'Bidirectional BFS' },
  ];

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleRun = () => {
    setResults({});
    activeAlgos.forEach(algo => {
        if(gridRefs.current[algo]) gridRefs.current[algo].animate();
    });
  };

  const handleReset = () => {
    setResults({});
    activeAlgos.forEach(algo => {
        if(gridRefs.current[algo]) gridRefs.current[algo].reset();
    });
  };
  
  const handleClearWalls = () => {
     const masterAlgo = activeAlgos[0];
     if (gridRefs.current[masterAlgo]) gridRefs.current[masterAlgo].clearWalls();
  };

  const handleGenerateMaze = () => {
      handleClearWalls();
      setTimeout(() => {
          const masterAlgo = activeAlgos[0];
          if (gridRefs.current[masterAlgo]) gridRefs.current[masterAlgo].generateMaze();
      }, 100);
  };

  const addAlgorithm = () => {
      if (activeAlgos.length >= 4) return;
      const unused = allAlgorithms.find(a => !activeAlgos.includes(a.value));
      if (unused) {
          setActiveAlgos([...activeAlgos, unused.value]);
      }
  };

  const removeAlgorithm = () => {
      if (activeAlgos.length > 1) {
          const newAlgos = [...activeAlgos];
          newAlgos.pop();
          setActiveAlgos(newAlgos);
          setResults({});
      }
  };

  const handleAlgoChange = (index, newValue) => {
      const newAlgos = [...activeAlgos];
      newAlgos[index] = newValue;
      setActiveAlgos(newAlgos);
      setResults({});
  };

  const handleFinish = (algo, time) => {
      setResults(prev => ({ ...prev, [algo]: time }));
  };

  const getWinStatus = (algo) => {
      if (activeAlgos.length === 1) return 'unknown';
      const times = Object.values(results);
      if (times.length === 0) return 'unknown';
      const myTime = results[algo];
      if (!myTime) return 'unknown';

      const minTime = Math.min(...times);
      if (times.length === activeAlgos.length) {
          return myTime === minTime ? 'winner' : 'loser';
      }
      return 'unknown';
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4">
        <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
            Pathfinding <span className="text-blue-600 dark:text-blue-400">Visualizer</span>
            </h1>
        </div>
        
        <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition-transform shadow-sm"
        >
            {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-gray-600"/>}
        </button>
      </div>

      {/* Instructions & Legend */}
      <div className="w-full max-w-4xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-panel p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
         <div className="flex flex-col gap-1">
            <h3 className="font-bold flex items-center gap-2 text-xs uppercase text-gray-400">
                <MousePointer2 size={14} /> Instructions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Draw walls. Use <span className="font-bold">+ / -</span> to compare algorithms.
            </p>
         </div>

         {/* LEGEND */}
         <div className="flex flex-wrap gap-3 text-xs font-medium">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm"></div> <span>Start</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 border border-red-600 rounded-full"></div> <span>Target</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-800 dark:bg-gray-400 border border-gray-900 dark:border-gray-500 rounded-sm"></div> <span>Wall</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 border border-blue-600 rounded-sm"></div> <span>Visited</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 border border-yellow-500 rounded-sm"></div> <span>Path</span>
            </div>
         </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-dark-panel p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center justify-center mb-6 w-full max-w-4xl z-10 sticky top-2">
        <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            {activeAlgos.map((currentAlgo, idx) => (
                <select 
                    key={idx}
                    value={currentAlgo} 
                    onChange={(e) => handleAlgoChange(idx, e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {allAlgorithms.map(opt => (
                        (opt.value === currentAlgo || !activeAlgos.includes(opt.value)) && 
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ))}
            
            <div className="flex flex-col gap-0.5 ml-1">
                <button onClick={addAlgorithm} disabled={activeAlgos.length >= 4} className="p-0.5 bg-gray-200 hover:bg-green-100 text-gray-600 hover:text-green-600 rounded disabled:opacity-30">
                    <Plus size={10} />
                </button>
                <button onClick={removeAlgorithm} disabled={activeAlgos.length <= 1} className="p-0.5 bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded disabled:opacity-30">
                    <Minus size={10} />
                </button>
            </div>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>

        <button onClick={handleRun} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-transform active:scale-95 text-xs uppercase tracking-wider">
          <Play size={14} /> Run
        </button>

        <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-bold text-xs">
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Grids Container */}
      <div className="flex flex-col gap-4 w-full items-center pb-24">
        {activeAlgos.map((algo, index) => (
            <div key={algo} className={clsx("relative transition-all duration-500", index > 0 && "opacity-90 hover:opacity-100")}>
                <Grid 
                    ref={el => gridRefs.current[algo] = el}
                    algoType={algo}
                    isComparison={index > 0}
                    masterGridState={index > 0 ? masterGrid : null}
                    onGridUpdate={index === 0 ? setMasterGrid : undefined}
                    onFinish={handleFinish}
                    winStatus={getWinStatus(algo)}
                />
                {index > 0 && (
                     <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none backdrop-blur-sm">
                        Linked to Master
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* Bottom Floating Controls */}
      <div className="fixed bottom-6 flex gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-2 px-4 rounded-full shadow-2xl border border-gray-200 dark:border-gray-600 z-50">
        <button 
            onClick={handleGenerateMaze}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-lg transition-all hover:-translate-y-1"
        >
            <BrickWall size={14} /> Random Maze
        </button>
        <button 
            onClick={handleClearWalls}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full font-bold text-xs shadow transition-all"
        >
            <Eraser size={14} /> Clear Board
        </button>
      </div>

    </div>
  );
}

export default App;
