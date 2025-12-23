import React, { useRef, useState, useEffect } from 'react';
import { Grid } from './components/Grid';
import { Play, RefreshCw, Moon, Sun, BrickWall, Eraser, Info, Plus, Minus, Box, Trees, Droplets } from 'lucide-react';
import { clsx } from 'clsx';

// Pseudo-Code Data
const PSEUDO_CODE = {
  dijkstra: [
    "Dijkstra(Graph, Start, End):",
    "  create priority_queue Q",
    "  Start.distance = 0",
    "  Q.push(Start)",
    "  while Q is not empty:",
    "    current = Q.pop()",
    "    if current == End: return path",
    "    for neighbor in current.neighbors:",
    "      newDist = current.dist + neighbor.weight", // Highlight logic for weights
    "      if newDist < neighbor.dist:",
    "        neighbor.dist = newDist",
    "        neighbor.prev = current",
    "        Q.push(neighbor)"
  ],
  bfs: [
    "BFS(Graph, Start, End):",
    "  create queue Q",
    "  Q.push(Start)",
    "  mark Start as visited",
    "  while Q is not empty:",
    "    current = Q.pop()",
    "    if current == End: return path",
    "    for neighbor in current.neighbors:",
    "      if neighbor not visited:",
    "        mark visited",
    "        Q.push(neighbor)"
  ],
  astar: [
    "A*(Graph, Start, End):",
    "  openSet = {Start}",
    "  Start.g = 0, Start.f = h(Start, End)",
    "  while openSet not empty:",
    "    current = node in openSet with lowest f",
    "    if current == End: return path",
    "    for neighbor in neighbors:",
    "      tempG = current.g + neighbor.weight",
    "      if tempG < neighbor.g:",
    "        neighbor.g = tempG",
    "        neighbor.f = tempG + h(neighbor, End)",
    "        if neighbor not in openSet: add it"
  ]
};

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeAlgos, setActiveAlgos] = useState(['dijkstra']);
  const [results, setResults] = useState({});
  const [masterGrid, setMasterGrid] = useState(null);
  
  // New States
  const [tool, setTool] = useState('wall'); // wall, mud, forest, eraser
  const [is3D, setIs3D] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const gridRefs = useRef({});

  const allAlgorithms = [
      { value: 'dijkstra', label: 'Dijkstra (Weighted)' },
      { value: 'astar', label: 'A* Search (Weighted)' },
      { value: 'greedy', label: 'Greedy Best-First (Weighted)' },
      { value: 'bfs', label: 'BFS (Unweighted)' },
      { value: 'dfs', label: 'DFS (Unweighted)' },
      { value: 'bidirectional', label: 'Bidirectional (Unweighted)' },
  ];

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleRun = () => {
    setResults({});
    activeAlgos.forEach(algo => { if(gridRefs.current[algo]) gridRefs.current[algo].animate(); });
  };
  const handleReset = () => {
    setResults({});
    activeAlgos.forEach(algo => { if(gridRefs.current[algo]) gridRefs.current[algo].reset(); });
  };
  const handleClear = () => {
     if(gridRefs.current[activeAlgos[0]]) gridRefs.current[activeAlgos[0]].clearWalls();
  };
  const handleMaze = () => {
     handleClear();
     setTimeout(() => {
        if(gridRefs.current[activeAlgos[0]]) gridRefs.current[activeAlgos[0]].generateMaze();
     }, 100);
  };

  const addAlgorithm = () => { if(activeAlgos.length < 4) setActiveAlgos([...activeAlgos, allAlgorithms.find(a=>!activeAlgos.includes(a.value)).value]); };
  const removeAlgorithm = () => { if(activeAlgos.length > 1) { const n=[...activeAlgos]; n.pop(); setActiveAlgos(n); setResults({}); }};
  const getWinStatus = (algo) => {
      if (activeAlgos.length === 1) return 'unknown';
      const times = Object.values(results);
      if (times.length !== activeAlgos.length) return 'unknown';
      const min = Math.min(...times);
      return results[algo] === min ? 'winner' : 'loser';
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Pathfinding <span className="text-blue-600 dark:text-blue-400">Pro</span></h1>
        <div className="flex gap-2">
            <button onClick={() => setShowInstructions(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Info size={20}/></button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}</button>
        </div>
      </div>

      {/* Main Layout: Grid Left, Code Panel Right (lg screens) */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
          
          {/* LEFT: Controls & Grid */}
          <div className="flex-1 flex flex-col items-center">
              
              {/* TOOLBAR */}
              <div className="bg-white dark:bg-dark-panel p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-center mb-6 w-full sticky top-2 z-50">
                {/* Algorithms */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {activeAlgos.map((cur, i) => (
                        <select key={i} value={cur} onChange={(e)=>{const n=[...activeAlgos]; n[i]=e.target.value; setActiveAlgos(n); setResults({})}} className="w-24 px-1 py-1 text-xs bg-white dark:bg-gray-700 rounded border-none outline-none">
                            {allAlgorithms.map(a=>( (a.value===cur || !activeAlgos.includes(a.value)) && <option key={a.value} value={a.value}>{a.label}</option>))}
                        </select>
                    ))}
                    <div className="flex flex-col"><button onClick={addAlgorithm} className="h-full px-1 hover:text-green-500"><Plus size={10}/></button><button onClick={removeAlgorithm} className="h-full px-1 hover:text-red-500"><Minus size={10}/></button></div>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                {/* Drawing Tools */}
                <div className="flex gap-1">
                    <button onClick={()=>setTool('wall')} title="Wall" className={clsx("p-2 rounded-lg transition-all", tool==='wall' ? "bg-gray-800 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700")}><BrickWall size={18}/></button>
                    <button onClick={()=>setTool('mud')} title="Mud (Cost 5)" className={clsx("p-2 rounded-lg transition-all", tool==='mud' ? "bg-amber-700 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700 text-amber-700")}><Droplets size={18}/></button>
                    <button onClick={()=>setTool('forest')} title="Forest (Cost 15)" className={clsx("p-2 rounded-lg transition-all", tool==='forest' ? "bg-green-700 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700 text-green-700")}><Trees size={18}/></button>
                    <button onClick={()=>setTool('eraser')} title="Eraser" className={clsx("p-2 rounded-lg transition-all", tool==='eraser' ? "bg-blue-600 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700")}><Eraser size={18}/></button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                {/* 3D Toggle */}
                <button onClick={()=>setIs3D(!is3D)} className={clsx("p-2 rounded-lg font-bold text-xs flex items-center gap-1", is3D ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800")}>
                    <Box size={16}/> 3D
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                <button onClick={handleRun} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"><Play size={16}/> RUN</button>
                <button onClick={handleReset} className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-bold text-xs"><RefreshCw size={16}/></button>
              </div>

              {/* GRIDS */}
              <div className="flex flex-col gap-6 w-full items-center pb-24">
                {activeAlgos.map((algo, index) => (
                    <div key={algo} className={clsx("relative transition-opacity", index > 0 && "opacity-90")}>
                        <Grid 
                            ref={el => gridRefs.current[algo] = el}
                            algoType={algo}
                            isComparison={index > 0}
                            masterGridState={index > 0 ? masterGrid : null}
                            onGridUpdate={index === 0 ? setMasterGrid : undefined}
                            onFinish={(alg, t) => setResults(p => ({...p, [alg]: t}))}
                            winStatus={getWinStatus(algo)}
                            is3D={is3D}
                            tool={tool}
                        />
                        {index===0 && <button onClick={handleMaze} className="absolute -bottom-8 left-0 text-xs font-bold text-indigo-500 hover:underline">Generate Organic Maze</button>}
                        {index===0 && <button onClick={handleClear} className="absolute -bottom-8 right-0 text-xs font-bold text-red-500 hover:underline">Clear Board</button>}
                    </div>
                ))}
              </div>
          </div>

          {/* RIGHT: Code Panel (Hidden on mobile) */}
          <div className="hidden lg:block w-80 bg-gray-900 text-gray-300 p-4 rounded-xl h-fit sticky top-24 font-mono text-xs shadow-2xl border border-gray-700">
              <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><span className="text-green-400">{`>`}</span> Algorithm Logic</h3>
              <div className="space-y-1">
                 {(PSEUDO_CODE[activeAlgos[0]] || ["Select an algorithm to view logic"]).map((line, i) => (
                     <div key={i} className={clsx("pl-2 border-l-2 border-transparent", line.includes("weight") && activeAlgos[0] !== 'bfs' ? "bg-yellow-900/30 text-yellow-200 border-yellow-500" : "")}>
                         {line}
                     </div>
                 ))}
              </div>
              <div className="mt-6 text-[10px] text-gray-500">
                  * Note: BFS/DFS are unweighted and will ignore Mud/Forest costs.
              </div>
          </div>

      </div>

      {/* Instructions Modal */}
      {showInstructions && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-gray-700 relative">
                  <button onClick={()=>setShowInstructions(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                  <h2 className="text-2xl font-bold mb-4">How to Use</h2>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                      <li><strong>🖱️ Drag Nodes:</strong> Move Start (Green) or End (Red) nodes even after the algorithm finishes for real-time updates!</li>
                      <li><strong>🌲 Terrain:</strong> Select <strong>Mud</strong> (Cost 5) or <strong>Forest</strong> (Cost 15). Watch how Dijkstra avoids them while BFS gets stuck!</li>
                      <li><strong>🧊 3D Mode:</strong> Click "3D" to see walls rise from the board.</li>
                      <li><strong>⚡ Comparison:</strong> Use the <strong>+</strong> button to add more algorithms side-by-side.</li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                      <button onClick={()=>setShowInstructions(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Got it!</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;
