// src/algorithms.js

// --- HELPERS ---
const getNeighbors = (node, grid) => {
  const neighbors = [];
  const { row, col } = node;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter((neighbor) => !neighbor.isWall);
};

const manhattanDistance = (nodeA, nodeB) => {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

const getAllNodes = (grid) => {
  const nodes = [];
  for (const row of grid) for (const node of row) nodes.push(node);
  return nodes;
};

export const getNodesInShortestPathOrder = (finishNode) => {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
};

/* ================= ALGORITHMS ================= */
// Note: BFS and DFS ignore weights by definition (unweighted graphs).
// Dijkstra, A*, and Greedy will use node.weight.

export const runAlgorithm = (grid, startNode, finishNode, algoType) => {
  switch (algoType) {
    case 'dijkstra': return dijkstra(grid, startNode, finishNode);
    case 'astar': return aStar(grid, startNode, finishNode);
    case 'bfs': return bfs(grid, startNode, finishNode); // Unweighted
    case 'dfs': return dfs(grid, startNode, finishNode); // Unweighted
    case 'greedy': return greedyBestFirst(grid, startNode, finishNode);
    case 'bidirectional': return bidirectionalBFS(grid, startNode, finishNode); // Unweighted
    default: return dijkstra(grid, startNode, finishNode);
  }
};

function dijkstra(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length) {
    unvisitedNodes.sort((a, b) => a.distance - b.distance);
    const closestNode = unvisitedNodes.shift();

    if (closestNode.isWall) continue;
    if (closestNode.distance === Infinity) return { visitedNodesInOrder, path: [] };

    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);

    if (closestNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };

    updateUnvisitedNeighbors(closestNode, grid, finishNode, 'dijkstra');
  }
}

function aStar(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  startNode.g = 0;
  startNode.f = manhattanDistance(startNode, finishNode);
  let openSet = [startNode];

  while (openSet.length) {
    openSet.sort((a, b) => a.f - b.f);
    const closestNode = openSet.shift();

    if (closestNode.isWall) continue;
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);

    if (closestNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };

    updateUnvisitedNeighbors(closestNode, grid, finishNode, 'astar', openSet);
  }
  return { visitedNodesInOrder, path: [] };
}

function greedyBestFirst(grid, startNode, finishNode) {
    const visitedNodesInOrder = [];
    startNode.distance = manhattanDistance(startNode, finishNode); // Use distance prop for priority
    let openSet = [startNode];

    while(openSet.length) {
        openSet.sort((a,b) => a.distance - b.distance);
        const currentNode = openSet.shift();

        if (currentNode.isWall) continue;
        if (currentNode.isVisited) continue; // Greedy can revisit but simple version doesn't needs to

        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);

        if (currentNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };

        updateUnvisitedNeighbors(currentNode, grid, finishNode, 'greedy', openSet);
    }
    return { visitedNodesInOrder, path: [] };
}

// Unified Neighbor Updater for Weighted Algos
function updateUnvisitedNeighbors(node, grid, finishNode, algo, openSet = []) {
    const neighbors = getNeighbors(node, grid);
    for (const neighbor of neighbors) {
        if (neighbor.isVisited) continue;

        // COST LOGIC:
        // Basic movement cost is 1.
        // If the neighbor is "Mud" (weight 5), cost is 5.
        // If "Forest" (weight 10), cost is 10.
        // BFS/DFS/Bidirectional will ignore this and assume 1.
        const moveCost = neighbor.weight; 

        if (algo === 'dijkstra') {
            const newDist = node.distance + moveCost;
            if (newDist < neighbor.distance) {
                neighbor.distance = newDist;
                neighbor.previousNode = node;
            }
        } else if (algo === 'astar') {
            const tentativeG = node.g + moveCost;
            // Check if better path
            let inOpenSet = openSet.includes(neighbor);
            if (!inOpenSet || tentativeG < neighbor.g) {
                neighbor.g = tentativeG;
                neighbor.h = neighbor.h || manhattanDistance(neighbor, finishNode);
                neighbor.f = neighbor.g + neighbor.h; // A* = g + h
                neighbor.previousNode = node;
                if (!inOpenSet) openSet.push(neighbor);
            }
        } else if (algo === 'greedy') {
            // Greedy ignores weight cost (g), only cares about heuristic (h)
            // But we add it to visited logic
            if(!openSet.includes(neighbor)) {
                neighbor.distance = manhattanDistance(neighbor, finishNode);
                neighbor.previousNode = node;
                openSet.push(neighbor);
            }
        }
    }
}

// --- UNWEIGHTED ALGOS (BFS, DFS, Bidirectional) ---
// (Copy previous BFS, DFS, Bidirectional code here exactly as before. 
//  They do NOT use the `weight` property, ensuring they fail to handle mud properly - which is the goal!)
function bfs(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  const queue = [startNode];
  startNode.isVisited = true;
  while (queue.length) {
    const currentNode = queue.shift();
    if (currentNode.isWall) continue;
    visitedNodesInOrder.push(currentNode);
    if (currentNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };
    const neighbors = getNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited) {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        queue.push(neighbor);
      }
    }
  }
  return { visitedNodesInOrder, path: [] };
}

function dfs(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  const stack = [startNode];
  while (stack.length) {
    const currentNode = stack.pop();
    if (currentNode.isVisited || currentNode.isWall) continue;
    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);
    if (currentNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };
    const neighbors = getNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
        if(!neighbor.isVisited) {
             neighbor.previousNode = currentNode;
             stack.push(neighbor);
        }
    }
  }
  return { visitedNodesInOrder, path: [] };
}

function bidirectionalBFS(grid, startNode, finishNode) {
    const visitedNodesInOrder = [];
    const startQueue = [startNode];
    const endQueue = [finishNode];
    const startVisited = new Set();
    const endVisited = new Set();
    startVisited.add(startNode);
    endVisited.add(finishNode);
    startNode.previousNode = null;
    finishNode.nextNode = null;

    while (startQueue.length > 0 && endQueue.length > 0) {
        if(startQueue.length > 0) {
            const currStart = startQueue.shift();
            visitedNodesInOrder.push(currStart);
            currStart.isVisited = true;
            const neighbors = getNeighbors(currStart, grid);
            for(const n of neighbors) {
                if(!startVisited.has(n)) {
                    if(endVisited.has(n)) return mergeBidirectionalPath(currStart, n, visitedNodesInOrder);
                    n.previousNode = currStart;
                    startVisited.add(n);
                    startQueue.push(n);
                }
            }
        }
        if(endQueue.length > 0) {
            const currEnd = endQueue.shift();
            visitedNodesInOrder.push(currEnd);
            currEnd.isVisited = true; 
            const neighbors = getNeighbors(currEnd, grid);
            for(const n of neighbors) {
                if(!endVisited.has(n)) {
                     if(startVisited.has(n)) return mergeBidirectionalPath(n, currEnd, visitedNodesInOrder);
                     n.nextNode = currEnd;
                     endVisited.add(n);
                     endQueue.push(n);
                }
            }
        }
    }
    return { visitedNodesInOrder, path: [] };
}
function mergeBidirectionalPath(meetNodeStartSide, meetNodeEndSide, visitedNodes) {
    const path = [];
    let curr = meetNodeStartSide;
    while(curr !== null) { path.unshift(curr); curr = curr.previousNode; }
    curr = meetNodeEndSide;
    while(curr !== null) { path.push(curr); curr = curr.nextNode; }
    return { visitedNodesInOrder: visitedNodes, path };
}

/* ================= MAZE GENERATION: RANDOMIZED PRIM'S (Organic) ================= */
export const generateMazePrims = (grid) => {
    // 1. Reset Board to Walls
    for(let row of grid) for(let node of row) node.isWall = true;

    // 2. Pick random start
    const startRow = Math.floor(Math.random() * grid.length);
    const startCol = Math.floor(Math.random() * grid[0].length);
    const startNode = grid[startRow][startCol];
    startNode.isWall = false;

    // 3. Add neighbors to frontier
    const frontier = [];
    const addFrontier = (node) => {
        const neighbors = [
            node.row > 1 ? grid[node.row-2][node.col] : null,
            node.row < grid.length-2 ? grid[node.row+2][node.col] : null,
            node.col > 1 ? grid[node.row][node.col-2] : null,
            node.col < grid[0].length-2 ? grid[node.row][node.col+2] : null,
        ];
        neighbors.forEach(n => {
            if(n && n.isWall && !frontier.includes(n)) frontier.push(n);
        });
    };
    addFrontier(startNode);

    // 4. Loop
    while(frontier.length) {
        // Pick random frontier node
        const randIdx = Math.floor(Math.random() * frontier.length);
        const current = frontier[randIdx];
        frontier.splice(randIdx, 1);

        // Find neighbors that are already part of the maze (not walls)
        const neighbors = [
            current.row > 1 ? grid[current.row-2][current.col] : null,
            current.row < grid.length-2 ? grid[current.row+2][current.col] : null,
            current.col > 1 ? grid[current.row][current.col-2] : null,
            current.col < grid[0].length-2 ? grid[current.row][current.col+2] : null,
        ].filter(n => n && !n.isWall);

        if(neighbors.length) {
            const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            // Carve path
            current.isWall = false;
            // Carve wall between
            const midRow = current.row + (neighbor.row - current.row)/2;
            const midCol = current.col + (neighbor.col - current.col)/2;
            grid[midRow][midCol].isWall = false;
            
            addFrontier(current);
        }
    }
    
    // Return walls list (which is everything still true)
    const walls = [];
    for(let row of grid) for(let node of row) if(node.isWall) walls.push(node);
    return walls;
};
