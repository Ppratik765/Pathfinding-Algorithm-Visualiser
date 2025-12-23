/* src/algorithms.js */

/* ================= HELPER FUNCTIONS ================= */

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
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
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

export const runAlgorithm = (grid, startNode, finishNode, algoType) => {
  switch (algoType) {
    case 'dijkstra': return dijkstra(grid, startNode, finishNode);
    case 'astar': return aStar(grid, startNode, finishNode);
    case 'bfs': return bfs(grid, startNode, finishNode);
    case 'dfs': return dfs(grid, startNode, finishNode);
    case 'greedy': return greedyBestFirst(grid, startNode, finishNode);
    case 'bidirectional': return bidirectionalBFS(grid, startNode, finishNode);
    default: return dijkstra(grid, startNode, finishNode);
  }
};

// --- Weighted Algorithms (Dijkstra, A*, Greedy) ---

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
        // WEIGHT LOGIC: Normal = 1, Mud = 5, Forest = 10, Water = 50
        const distanceToAdd = neighbor.weight || 1; 
        const newDist = closestNode.distance + distanceToAdd;
        if (newDist < neighbor.distance) {
          neighbor.distance = newDist;
          neighbor.previousNode = closestNode;
        }
      }
    }
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

    const neighbors = getNeighbors(closestNode, grid);
    for (const neighbor of neighbors) {
      if (neighbor.isVisited) continue;
      
      const distanceToAdd = neighbor.weight || 1;
      const tentativeG = closestNode.g + distanceToAdd;
      
      let inOpenSet = openSet.includes(neighbor);
      if (!inOpenSet || tentativeG < neighbor.g) {
        neighbor.g = tentativeG;
        neighbor.h = neighbor.h || manhattanDistance(neighbor, finishNode); // Manhattan H
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.previousNode = closestNode;
        if (!inOpenSet) openSet.push(neighbor);
      }
    }
  }
  return { visitedNodesInOrder, path: [] };
}

function greedyBestFirst(grid, startNode, finishNode) {
    const visitedNodesInOrder = [];
    startNode.distance = manhattanDistance(startNode, finishNode);
    let openSet = [startNode];

    while(openSet.length) {
        openSet.sort((a,b) => a.distance - b.distance); // Only heuristic matters for Greedy
        const currentNode = openSet.shift();

        if (currentNode.isWall) continue;
        if (currentNode.isVisited) continue;

        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);

        if (currentNode === finishNode) return { visitedNodesInOrder, path: getNodesInShortestPathOrder(finishNode) };

        const neighbors = getNeighbors(currentNode, grid);
        for(const neighbor of neighbors) {
            if(!neighbor.isVisited) {
                // Greedy ignores edge weights for movement cost, but we still track it
                neighbor.distance = manhattanDistance(neighbor, finishNode); 
                neighbor.previousNode = currentNode;
                openSet.push(neighbor);
            }
        }
    }
    return { visitedNodesInOrder, path: [] };
}

// --- Unweighted Algorithms (BFS, DFS, Bidirectional) ---
// Note: BFS/DFS technically ignore weights, they just count steps (edges).
// This highlights why Dijkstra/A* are better for weighted graphs.

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
    // Unweighted Bidirectional
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
    while(curr !== null) {
        path.unshift(curr);
        curr = curr.previousNode;
    }
    curr = meetNodeEndSide;
    while(curr !== null) {
        path.push(curr);
        curr = curr.nextNode;
    }
    return { visitedNodesInOrder: visitedNodes, path };
}

/* ================= MAZE GENERATION ================= */

// 1. Recursive Division (Blocky) - KEPT SAME
export const generateMazeRecursiveDivision = (grid, startNode, finishNode) => {
    // 1. Fill Grid with Walls
    const walls = [];
    // Reset weights before maze gen
    for(let r=0; r<grid.length; r++) for(let c=0; c<grid[0].length; c++) grid[r][c].weight = 1;
    
    return computeWallsRecursive(grid, startNode, finishNode);
};

function computeWallsRecursive(grid, startNode, finishNode) {
    const height = grid.length;
    const width = grid[0].length;
    const mazeWalls = [];
    const visited = new Set();
    const stack = [];
    
    // DFS for recursive division shape
    let current = startNode;
    visited.add(`${current.row}-${current.col}`);
    stack.push(current);

    const emptySpaces = new Set();
    emptySpaces.add(`${startNode.row}-${startNode.col}`);
    emptySpaces.add(`${finishNode.row}-${finishNode.col}`);

    while (stack.length) {
        const curr = stack.pop();
        const { row, col } = curr;
        // Jump 2 to create walls between
        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);

        for (const [dr, dc] of dirs) {
            const nr = row + dr;
            const nc = col + dc;
            const midR = row + (dr/2);
            const midC = col + (dc/2);

            if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited.has(`${nr}-${nc}`)) {
                visited.add(`${nr}-${nc}`);
                visited.add(`${midR}-${midC}`);
                emptySpaces.add(`${nr}-${nc}`);
                emptySpaces.add(`${midR}-${midC}`);
                stack.push(grid[nr][nc]);
                stack.push(curr); 
            }
        }
    }

    for(let r = 0; r < height; r++) {
        for(let c = 0; c < width; c++) {
            if(!emptySpaces.has(`${r}-${c}`)) {
                const node = grid[r][c];
                if(!node.isStart && !node.isFinish) {
                    if (Math.random() > 0.1) mazeWalls.push(node); // 10% loops
                }
            }
        }
    }
    return mazeWalls;
}


// 2. Randomized Prim's (Organic/River-like) - NEW!
export const generateMazePrims = (grid, startNode, finishNode) => {
    const walls = [];
    const height = grid.length;
    const width = grid[0].length;
    
    // 1. Reset grid: Everything is a wall initially logic (conceptually)
    // We will return a list of nodes that should remain walls.
    // Prim's grows from a start node.
    
    const visited = new Set();
    const frontier = []; // "Walls" to consider opening
    const pathSet = new Set(); // Nodes that are effectively "Open" (white)

    // Helper to add frontier
    const addFrontier = (r, c) => {
        if(r>=0 && r<height && c>=0 && c<width && !pathSet.has(`${r}-${c}`)) {
            frontier.push({r, c});
        }
    }

    // Start with Start Node
    const startId = `${startNode.row}-${startNode.col}`;
    pathSet.add(startId);
    
    // Add neighbors of start to frontier (Distance 2)
    [[0, -2], [0, 2], [-2, 0], [2, 0]].forEach(([dr, dc]) => {
         addFrontier(startNode.row + dr, startNode.col + dc);
    });

    while (frontier.length > 0) {
        // Pick random frontier node
        const randIdx = Math.floor(Math.random() * frontier.length);
        const {r, c} = frontier[randIdx];
        frontier.splice(randIdx, 1); // remove

        if (pathSet.has(`${r}-${c}`)) continue;

        // Find neighbors of this frontier node that are ALREADY in the path
        const neighborsInPath = [];
        [[0, -2], [0, 2], [-2, 0], [2, 0]].forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < height && nc >= 0 && nc < width && pathSet.has(`${nr}-${nc}`)) {
                neighborsInPath.push({nr, nc, dr, dc});
            }
        });

        if (neighborsInPath.length > 0) {
            // Connect to one random neighbor
            const connection = neighborsInPath[Math.floor(Math.random() * neighborsInPath.length)];
            
            // Mark frontier as path
            pathSet.add(`${r}-${c}`);
            
            // Mark the wall IN BETWEEN as path
            const wallR = r + (connection.dr / 2) * -1; // vector math logic reversed
            const wallC = c + (connection.dc / 2) * -1;
            pathSet.add(`${wallR}-${wallC}`);

            // Add new frontiers from this node
            [[0, -2], [0, 2], [-2, 0], [2, 0]].forEach(([dr, dc]) => {
                 addFrontier(r + dr, c + dc);
            });
        }
    }

    // Ensure Finish Node is reachable (Prim's creates a Spanning Tree, so it should be, 
    // but we need to ensure the specific cell is marked open if our grid logic missed it)
    pathSet.add(`${finishNode.row}-${finishNode.col}`);

    // Convert everything NOT in pathSet to a wall
    const resultWalls = [];
    for(let r = 0; r < height; r++) {
        for(let c = 0; c < width; c++) {
            if(!pathSet.has(`${r}-${c}`)) {
                const node = grid[r][c];
                if (!node.isStart && !node.isFinish) {
                     // Add loops (10% chance to remove wall)
                     if(Math.random() > 0.1) resultWalls.push(node);
                }
            }
        }
    }
    return resultWalls;
};
