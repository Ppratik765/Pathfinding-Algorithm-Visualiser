import React, { useRef, useState, useEffect } from 'react';
import { Grid } from './components/Grid';
import { Play, RefreshCw, Moon, Sun, BrickWall, Eraser, MousePointer2, Plus, Minus, Info, Box, TreePine, Droplets, Footprints } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeAlgos, setActiveAlgos] = useState(['dijkstra']);
  const [results, setResults] = useState({});
  const [masterGrid, setMasterGrid] = useState(null);
  
  // New States
  const [currentTool, setCurrentTool] = useState('wall'); // wall, mud, forest, water, eraser
  const [mazeType, setMazeType] = useState('prims'); // recursive, prims
  const [is3D, setIs3D] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const gridRefs = useRef({});

  const allAlgorithms = [
      { value: 'dijkstra', label: 'Dijkstra (Weighted)' },
      { value: 'astar', label: 'A* Search (Weighted)' },
      { value: 'greedy', label: 'Greedy Best-First (Weighted)' },
      { value: 'bfs', label: 'BFS (Unweighted)' },
      { value: 'dfs', label: 'DFS (Unweighted)' },
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

  // ... (Keep addAlgorithm, removeAlgorithm, handleAlgoChange, handleFinish, getWinStatus SAME as before)
  const addAlgorithm = () => { if (activeAlgos.length < 4) { const unused = allAlgorithms.find(a => !activeAlgos.includes(a.value)); if (unused) setActiveAlgos([...activeAlgos, unused.value]); }};
  const removeAlgorithm = () => { if (activeAlgos.length > 1) { const newAlgos = [...activeAlgos]; newAlgos.pop(); setActiveAlgos(newAlgos); setResults({}); }};
  const handleAlgoChange = (index, newValue) => { const newAlgos = [...activeAlgos]; newAlgos[index] = newValue; setActiveAlgos(newAlgos); setResults({}); };
  const handleFinish = (algo, time) => { setResults(prev => ({ ...prev, [algo]: time })); };
  const getWinStatus = (algo) => {
      if (activeAlgos.length === 1) return 'unknown';
      const times = Object.values(results);
      if (times.length === 0) return 'unknown';
      const myTime = results[algo];
      if (!myTime) return 'unknown';
      const minTime = Math.min(...times);
      if (times.length === activeAlgos.length) return myTime === minTime ? 'winner' : 'loser';
      return 'unknown';
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden">
      
      {/* Instructions Modal */}
      {showInstructions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full relative border border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowInstructions(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 font-bold">✕</button>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Info className="text-blue-500"/> Project Guide
                  </h2>
                  <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 overflow-y-auto max-h-[60vh] pr-2">
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">1. Moving Start/End</h3>
                          <p>Click and drag the Green (Start) or Red (Target) nodes to move them anywhere.</p>
                      </section>
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">2. Terrain & Weights</h3>
                          <p>Select different brushes to draw terrain. Algorithms like Dijkstra & A* will avoid these if possible.</p>
                          <ul className="list-disc ml-5 mt-1 space-y-1">
                              <li><span className="font-bold">Mud (Brown)</span>: Cost 5</li>
                              <li><span className="font-bold">Forest (Green)</span>: Cost 10</li>
                              <li><span className="font-bold">Water (Blue)</span>: Cost 50</li>
                          </ul>
                      </section>
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">3. Maze Generation</h3>
                          <p>Use the "Random Maze" button.</p>
                          <ul className="list-disc ml-5 mt-1 space-y-1">
                              <li><span className="font-bold">Recursive Division</span>: Blocky, square corridors.</li>
                              <li><span className="font-bold">Prim's Algorithm</span>: Organic, river-like paths.</li>
                          </ul>
                      </section>
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">4. 3D Mode</h3>
                          <p>Toggle "3D View" to tilt the board. Walls will pop up like 3D blocks!</p>
                      </section>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4 px-2">
        <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
            Pathfinding <span className="text-blue-600 dark:text-blue-400">Visualizer</span>
            </h1>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setShowInstructions(true)}
                className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform shadow-sm"
                title="Instructions"
            >
                <Info size={20}/>
            </button>
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition-transform shadow-sm"
            >
                {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-gray-600"/>}
            </button>
        </div>
      </div>

      {/* Tool & Legend Bar */}
      <div className="w-full max-w-5xl mb-4 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-panel p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
         
         {/* Drawing Tools */}
         <div className="flex flex-wrap gap-2 justify-center">
            <ToolButton tool="wall" current={currentTool} set={setCurrentTool} icon={<BrickWall size={14}/>} label="Wall" color="bg-gray-800 text-white dark:bg-white dark:text-black"/>
            <ToolButton tool="mud" current={currentTool} set={setCurrentTool} icon={<Footprints size={14}/>} label="Mud (5)" color="bg-amber-700 text-white"/>
            <ToolButton tool="forest" current={currentTool} set={setCurrentTool} icon={<TreePine size={14}/>} label="Forest (10)" color="bg-emerald-700 text-white"/>
            <ToolButton tool="water" current={currentTool} set={setCurrentTool} icon={<Droplets size={14}/>} label="Water (50)" color="bg-cyan-700 text-white"/>
            <ToolButton tool="eraser" current={currentTool} set={setCurrentTool} icon={<Eraser size={14}/>} label="Eraser" color="bg-gray-200 text-gray-800"/>
         </div>

         {/* Settings */}
         <div className="flex items-center gap-4 border-l border-gray-300 dark:border-gray-600 pl-4">
             <div className="flex flex-col">
                 <label className="text-[10px] text-gray-400 font-bold uppercase">Maze Style</label>
                 <select 
                    value={mazeType} 
                    onChange={(e) => setMazeType(e.target.value)}
                    className="bg-transparent text-sm font-bold focus:outline-none dark:text-gray-200"
                 >
                     <option value="prims">Organic (Prim's)</option>
                     <option value="recursive">Blocky (Recursive)</option>
                 </select>
             </div>

             <button 
                onClick={() => setIs3D(!is3D)}
                className={clsx(
                    "flex flex-col items-center justify-center p-2 rounded-lg transition-all",
                    is3D ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                )}
                title="Toggle 3D View"
             >
                 <Box size={20} />
                 <span className="text-[9px] font-bold uppercase">3D View</span>
             </button>
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
                    className="px-2 py-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none max-w-[100px] sm:max-w-none"
                >
                    {allAlgorithms.map(opt => (
                        (opt.value === currentAlgo || !activeAlgos.includes(opt.value)) && 
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ))}
            <div className="flex flex-col gap-0.5 ml-1">
                <button onClick={addAlgorithm} disabled={activeAlgos.length >= 4} className="p-0.5 bg-gray-200 hover:bg-green-100 text-gray-600 hover:text-green-600 rounded disabled:opacity-30"><Plus size={10} /></button>
                <button onClick={removeAlgorithm} disabled={activeAlgos.length <= 1} className="p-0.5 bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded disabled:opacity-30"><Minus size={10} /></button>
            </div>
        </div>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>
        <button onClick={handleRun} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-transform active:scale-95 text-xs uppercase tracking-wider"><Play size={14} /> Run</button>
        <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-bold text-xs"><RefreshCw size={14} /> Reset</button>
      </div>

      {/* Grids Container */}
      <div className="flex flex-col gap-8 w-full items-center pb-24">
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
                    currentTool={currentTool}
                    mazeType={mazeType}
                    is3D={is3D}
                />
                {index > 0 && (
                     <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none backdrop-blur-sm">Linked to Master</div>
                )}
            </div>
        ))}
      </div>

      {/* Bottom Floating Controls */}
      <div className="fixed bottom-6 flex gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-2 px-4 rounded-full shadow-2xl border border-gray-200 dark:border-gray-600 z-50">
        <button onClick={handleGenerateMaze} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-lg transition-all hover:-translate-y-1"><BrickWall size={14} /> Random Maze</button>
        <button onClick={handleClearWalls} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full font-bold text-xs shadow transition-all"><Eraser size={14} /> Clear Board</button>
      </div>

    </div>
  );
}

const ToolButton = ({ tool, current, set, icon, label, color }) => (
    <button 
        onClick={() => set(tool)}
        className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
            current === tool 
                ? `${color} border-transparent ring-2 ring-offset-1 ring-blue-500 shadow-md transform scale-105` 
                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
        )}
    >
        {icon} <span>{label}</span>
    </button>
);

export default App;
