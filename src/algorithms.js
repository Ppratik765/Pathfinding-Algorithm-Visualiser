// src/algorithms.js

// --- HELPER FUNCTIONS ---
const getNeighbors = (node, grid) => {
  const neighbors = [];
  const { row, col } = node;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter((neighbor) => !neighbor.isWall);
};

const getAllNodes = (grid) => {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
};

// --- MAIN RUNNER ---
export const runAlgorithm = (grid, startNode, finishNode, algoType) => {
  switch (algoType) {
    case 'dijkstra':
      return dijkstra(grid, startNode, finishNode);
    case 'astar':
      return astar(grid, startNode, finishNode);
    case 'bfs':
      return bfs(grid, startNode, finishNode);
    case 'dfs':
      return dfs(grid, startNode, finishNode);
    case 'greedy':
      return greedyBestFirst(grid, startNode, finishNode);
    default:
      return dijkstra(grid, startNode, finishNode);
  }
};

// --- ALGORITHMS ---

// 1. Dijkstra (Weighted - guarantees shortest path)
const dijkstra = (grid, startNode, finishNode) => {
  const visitedNodesInOrder = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();
    if (closestNode.isWall) continue;
    if (closestNode.distance === Infinity) return { visitedNodesInOrder, path: [] };
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    if (closestNode === finishNode) return { visitedNodesInOrder, path: getPath(finishNode) };

    updateUnvisitedNeighbors(closestNode, grid);
  }
};

// 2. A* (Weighted + Heuristic - guarantees shortest path & faster)
const astar = (grid, startNode, finishNode) => {
  const visitedNodesInOrder = [];
  startNode.distance = 0;
  startNode.totalDistance = 0; // f = g + h
  const openSet = [startNode];

  while (openSet.length) {
    // Sort by f-score (totalDistance)
    openSet.sort((a, b) => a.totalDistance - b.totalDistance);
    const closestNode = openSet.shift(); // Pop best

    if (closestNode.isWall) continue;
    if (closestNode.isVisited) continue;

    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);

    if (closestNode === finishNode) return { visitedNodesInOrder, path: getPath(finishNode) };

    const neighbors = getNeighbors(closestNode, grid);
    for (const neighbor of neighbors) {
      if (neighbor.isVisited) continue;
      
      const tentativeG = closestNode.distance + 1; // distance between neighbors is 1
      if (tentativeG < neighbor.distance) {
        neighbor.previousNode = closestNode;
        neighbor.distance = tentativeG;
        // h(n) Manhattan distance
        const h = Math.abs(neighbor.row - finishNode.row) + Math.abs(neighbor.col - finishNode.col);
        neighbor.totalDistance = neighbor.distance + h;
        
        if (!openSet.includes(neighbor)) openSet.push(neighbor);
      }
    }
  }
  return { visitedNodesInOrder, path: [] };
};

// 3. BFS (Unweighted - guarantees shortest path)
const bfs = (grid, startNode, finishNode) => {
  const visitedNodesInOrder = [];
  const queue = [startNode];
  startNode.isVisited = true;

  while(queue.length) {
    const currentNode = queue.shift();
    if(currentNode.isWall) continue;

    visitedNodesInOrder.push(currentNode);
    if(currentNode === finishNode) return { visitedNodesInOrder, path: getPath(finishNode) };

    const neighbors = getNeighbors(currentNode, grid);
    for(const neighbor of neighbors) {
        if(!neighbor.isVisited) {
            neighbor.isVisited = true;
            neighbor.previousNode = currentNode;
            queue.push(neighbor);
        }
    }
  }
  return { visitedNodesInOrder, path: [] };
};

// 4. DFS (Unweighted - DOES NOT guarantee shortest path)
const dfs = (grid, startNode, finishNode) => {
  const visitedNodesInOrder = [];
  const stack = [startNode];
  // Note: We don't mark visited immediately on push for DFS to allow exploring paths, 
  // but for simple grid visualization, standard visited check works.
  
  while(stack.length) {
    const currentNode = stack.pop();
    
    if(currentNode.isVisited) continue; 
    if(currentNode.isWall) continue;

    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);

    if(currentNode === finishNode) return { visitedNodesInOrder, path: getPath(finishNode) };

    const neighbors = getNeighbors(currentNode, grid);
    for(const neighbor of neighbors) {
        if(!neighbor.isVisited) {
            neighbor.previousNode = currentNode;
            stack.push(neighbor);
        }
    }
  }
  return { visitedNodesInOrder, path: [] };
};

// 5. Greedy Best-First Search (Heuristic only - fast, no guarantee)
const greedyBestFirst = (grid, startNode, finishNode) => {
    const visitedNodesInOrder = [];
    // Initialize start node
    startNode.distance = 0; // We use distance prop to store 'heuristic' cost here
    const openSet = [startNode];

    while (openSet.length) {
        openSet.sort((a, b) => a.distance - b.distance);
        const closestNode = openSet.shift();

        if (closestNode.isVisited) continue;
        if (closestNode.isWall) continue;

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);

        if (closestNode === finishNode) return { visitedNodesInOrder, path: getPath(finishNode) };

        const neighbors = getNeighbors(closestNode, grid);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                neighbor.previousNode = closestNode;
                // Heuristic only
                const h = Math.abs(neighbor.row - finishNode.row) + Math.abs(neighbor.col - finishNode.col);
                neighbor.distance = h; 
                if(!openSet.includes(neighbor)) openSet.push(neighbor);
            }
        }
    }
    return { visitedNodesInOrder, path: [] };
};

// Helpers for algorithms
const sortNodesByDistance = (unvisitedNodes) => {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
};

const updateUnvisitedNeighbors = (node, grid) => {
  const neighbors = getNeighbors(node, grid);
  for (const neighbor of neighbors) {
    if (neighbor.isVisited) continue;
    const newDist = node.distance + 1;
    if (newDist < neighbor.distance) {
      neighbor.distance = newDist;
      neighbor.previousNode = node;
    }
  }
};

const getPath = (finishNode) => {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
};