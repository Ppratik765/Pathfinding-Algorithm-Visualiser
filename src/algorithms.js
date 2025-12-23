// src/algorithms.js

/* ================= HELPER FUNCTIONS ================= */

const getNeighbors = (node, grid, allowDiagonals = false) => {
  const neighbors = [];
  const { row, col } = node;
  // Up, Down, Left, Right
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter((neighbor) => !neighbor.isWall);
};

// Manhattan distance (heuristic)
const manhattanDistance = (nodeA, nodeB) => {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
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

// Backtracks from the finishNode to find the path
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

export const runAlgorithm = (grid, startNode, finishNode, algoType) => {
  switch (algoType) {
    case 'dijkstra':
      return dijkstra(grid, startNode, finishNode);
    case 'astar':
      return aStar(grid, startNode, finishNode);
    case 'bfs':
      return bfs(grid, startNode, finishNode);
    case 'dfs':
      return dfs(grid, startNode, finishNode);
    case 'greedy':
      return greedyBestFirst(grid, startNode, finishNode);
    case 'bidirectional': // Bidirectional BFS
      return bidirectionalBFS(grid, startNode, finishNode);
    default:
      return dijkstra(grid, startNode, finishNode);
  }
};

// --- Dijkstra ---
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

    const neighbors = getNeighbors(closestNode, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited) {
        const newDist = closestNode.distance + 1;
        if (newDist < neighbor.distance) {
          neighbor.distance = newDist;
          neighbor.previousNode = closestNode;
        }
      }
    }
  }
}

// --- A* Search ---
function aStar(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  startNode.g = 0;
  startNode.f = manhattanDistance(startNode, finishNode); // f = g + h

  // Open set
  let openSet = [startNode];

  while (openSet.length) {
    // Sort by F score
    openSet.sort((a, b) => a.f - b.f);
    const closestNode = openSet.shift();

    if (closestNode.isWall) continue;
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);

    if (closestNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };

    const neighbors = getNeighbors(closestNode, grid);
    for (const neighbor of neighbors) {
      if (neighbor.isVisited) continue;

      const tentativeG = closestNode.g + 1;
      
      // If neighbor is not in openSet or we found a better path
      let inOpenSet = openSet.includes(neighbor);
      if (!inOpenSet || tentativeG < neighbor.g) {
        neighbor.g = tentativeG;
        neighbor.h = neighbor.h || manhattanDistance(neighbor, finishNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.previousNode = closestNode;
        if (!inOpenSet) openSet.push(neighbor);
      }
    }
  }
  return { visitedNodesInOrder, path: [] };
}

// --- BFS (Breadth-First Search) ---
function bfs(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  const queue = [startNode];
  startNode.isVisited = true;

  while (queue.length) {
    const currentNode = queue.shift();
    if (currentNode.isWall) continue; // Should catch this before adding, but safety check

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

// --- DFS (Depth-First Search) ---
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
    // Push neighbors to stack (reverse order to prioritize one direction generally, optional)
    for (const neighbor of neighbors) {
        if(!neighbor.isVisited) {
             neighbor.previousNode = currentNode;
             stack.push(neighbor);
        }
    }
  }
  return { visitedNodesInOrder, path: [] };
}

// --- Greedy Best-First Search ---
function greedyBestFirst(grid, startNode, finishNode) {
    const visitedNodesInOrder = [];
    // Priority queue based on Heuristic only
    startNode.distance = manhattanDistance(startNode, finishNode);
    let openSet = [startNode];

    while(openSet.length) {
        openSet.sort((a,b) => a.distance - b.distance);
        const currentNode = openSet.shift();

        if (currentNode.isWall) continue;
        if (currentNode.isVisited) continue;

        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);

        if (currentNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };

        const neighbors = getNeighbors(currentNode, grid);
        for(const neighbor of neighbors) {
            if(!neighbor.isVisited) {
                neighbor.distance = manhattanDistance(neighbor, finishNode);
                neighbor.previousNode = currentNode;
                openSet.push(neighbor);
            }
        }
    }
    return { visitedNodesInOrder, path: [] };
}

// --- Bidirectional BFS ---
function bidirectionalBFS(grid, startNode, finishNode) {
    const visitedNodesInOrder = [];
    
    // Sets to track visited for both sides
    const startQueue = [startNode];
    const endQueue = [finishNode];
    
    const startVisited = new Set();
    const endVisited = new Set();
    
    startVisited.add(startNode);
    endVisited.add(finishNode);
    
    // We need to store where we came from to reconstruct path
    // We reuse the node properties, but we need to be careful not to overwrite
    // We will use 'previousNode' for forward search and 'nextNode' (custom prop) for backward
    startNode.previousNode = null;
    finishNode.nextNode = null; // Custom property for backward path

    while (startQueue.length > 0 && endQueue.length > 0) {
        // --- Forward Step ---
        if(startQueue.length > 0) {
            const currStart = startQueue.shift();
            visitedNodesInOrder.push(currStart);
            currStart.isVisited = true; // Visual feedback

            const neighbors = getNeighbors(currStart, grid);
            for(const n of neighbors) {
                if(!startVisited.has(n)) {
                    if(endVisited.has(n)) {
                        // Intersection found!
                        return mergeBidirectionalPath(currStart, n, visitedNodesInOrder);
                    }
                    n.previousNode = currStart;
                    startVisited.add(n);
                    startQueue.push(n);
                }
            }
        }

        // --- Backward Step ---
        if(endQueue.length > 0) {
            const currEnd = endQueue.shift();
            visitedNodesInOrder.push(currEnd); // Add to visual list
            currEnd.isVisited = true; 

            const neighbors = getNeighbors(currEnd, grid);
            for(const n of neighbors) {
                if(!endVisited.has(n)) {
                     if(startVisited.has(n)) {
                        // Intersection found!
                        return mergeBidirectionalPath(n, currEnd, visitedNodesInOrder);
                     }
                     n.nextNode = currEnd; // Points towards the end
                     endVisited.add(n);
                     endQueue.push(n);
                }
            }
        }
    }
    return { visitedNodesInOrder, path: [] };
}

function mergeBidirectionalPath(meetNodeStartSide, meetNodeEndSide, visitedNodes) {
    // Reconstruct path: Start -> ... -> meetNodeStartSide -> meetNodeEndSide -> ... -> End
    const path = [];
    
    // 1. Trace back from meetNodeStartSide to start
    let curr = meetNodeStartSide;
    while(curr !== null) {
        path.unshift(curr);
        curr = curr.previousNode;
    }

    // 2. Trace forward from meetNodeEndSide to end
    curr = meetNodeEndSide;
    while(curr !== null) {
        path.push(curr);
        curr = curr.nextNode;
    }
    
    return { visitedNodesInOrder: visitedNodes, path };
}


/* ================= MAZE GENERATION (Recursive Division) ================= */

export const generateMazeRecursiveDivision = (grid, startNode, finishNode) => {
    // Reset walls first
    for(let row of grid) {
        for(let node of row) {
            node.isWall = false;
        }
    }
    
    // Add outer walls
    const walls = [];
    const height = grid.length;
    const width = grid[0].length;

    for (let r = 0; r < height; r++) {
        if(r === 0 || r === height - 1) {
            for(let c = 0; c < width; c++) walls.push(grid[r][c]);
        } else {
             walls.push(grid[r][0]);
             walls.push(grid[r][width - 1]);
        }
    }

    // Recursive function
    addInnerWalls(true, 1, width - 2, 1, height - 2, grid, walls, startNode, finishNode);
    
    return walls; // Returns array of nodes to turn into walls
};

function addInnerWalls(h, minX, maxX, minY, maxY, grid, walls, startNode, finishNode) {
    if (h) {
        if (maxX - minX < 2) return;
        const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY; // Random row
        // Make sure we don't block start/end or create closed loops inappropriately
        // Simple simplified version:
        addHWall(minX, maxX, y, grid, walls, startNode, finishNode);
        addInnerWalls(!h, minX, maxX, minY, y - 1, grid, walls, startNode, finishNode);
        addInnerWalls(!h, minX, maxX, y + 1, maxY, grid, walls, startNode, finishNode);
    } else {
        if (maxY - minY < 2) return;
        const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX; // Random col
        addVWall(minY, maxY, x, grid, walls, startNode, finishNode);
        addInnerWalls(!h, minX, x - 1, minY, maxY, grid, walls, startNode, finishNode);
        addInnerWalls(!h, x + 1, maxX, minY, maxY, grid, walls, startNode, finishNode);
    }
}

function addHWall(minX, maxX, y, grid, walls, startNode, finishNode) {
    const hole = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    for (let i = minX; i <= maxX; i++) {
        if (i !== hole) {
            const node = grid[y][i];
            if (!node.isStart && !node.isFinish) walls.push(node);
        }
    }
}

function addVWall(minY, maxY, x, grid, walls, startNode, finishNode) {
    const hole = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
    for (let i = minY; i <= maxY; i++) {
        if (i !== hole) {
             const node = grid[i][x];
             if (!node.isStart && !node.isFinish) walls.push(node);
        }
    }
}
