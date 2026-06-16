// ═══════════════════════════════════════════════════════════════════════════
// ── 3-Way Comparison ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function buildUndirAdj() {
  const adj = {}, deg = {};
  graph.nodes.forEach(n => { adj[n.id] = new Set(); deg[n.id] = 0; });
  graph.edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    if (s === t) return;
    if (!adj[s].has(t)) { adj[s].add(t); deg[s]++; }
    if (!adj[t].has(s)) { adj[t].add(s); deg[t]++; }
  });
  return { adj, deg };
}

function buildDirAdj() {
  const adj = {};
  graph.nodes.forEach(n => adj[n.id] = []);
  graph.edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    if (s !== t) adj[s].push(t);
  });
  return adj;
}

// Betweenness Centrality — Brandes algorithm, undirected
function computeBC() {
  const { adj } = buildUndirAdj();
  const nodes = graph.nodes;
  const bc = {};
  nodes.forEach(n => bc[n.id] = 0);
  nodes.forEach(src => {
    const stack = [], pred = {}, sigma = {}, dist = {};
    nodes.forEach(n => { pred[n.id] = []; sigma[n.id] = 0; dist[n.id] = -1; });
    sigma[src.id] = 1; dist[src.id] = 0;
    const queue = [src.id]; let qi = 0;
    while (qi < queue.length) {
      const v = queue[qi++]; stack.push(v);
      for (const w of adj[v]) {
        if (dist[w] < 0) { queue.push(w); dist[w] = dist[v] + 1; }
        if (dist[w] === dist[v] + 1) { sigma[w] += sigma[v]; pred[w].push(v); }
      }
    }
    const delta = {};
    nodes.forEach(n => delta[n.id] = 0);
    while (stack.length) {
      const w = stack.pop();
      for (const v of pred[w]) delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      if (w !== src.id) bc[w] += delta[w];
    }
  });
  const N = nodes.length, norm = (N-1)*(N-2)/2;
  nodes.forEach(n => bc[n.id] /= norm);
  return nodes.filter(n => !n.isBasal).map(n => ({ id: n.id, score: bc[n.id] })).sort((a,b) => b.score - a.score);
}

// Collective Influence — l=2 (Morone & Makse 2015)
// ball(v, l=2): nodes at exactly 2 hops (undirected BFS)
function getBall2(nodeId, adj) {
  const d1 = adj[nodeId];
  const ball2 = new Set();
  for (const j of d1) {
    for (const k of adj[j]) {
      if (k !== nodeId && !d1.has(k)) ball2.add(k);
    }
  }
  return ball2;
}
function computeCI() {
  const { adj, deg } = buildUndirAdj();
  return graph.nodes.map(n => {
    const ki = deg[n.id];
    const ball2 = getBall2(n.id, adj);
    const ci = (ki - 1) * [...ball2].reduce((s, j) => s + (deg[j] - 1), 0);
    return { id: n.id, score: ci };
  }).sort((a,b) => b.score - a.score);
}

// Tarjan SCC
function computeSCC() {
  const dirAdj = buildDirAdj();
  const idx = {}, low = {}, onStk = {}, stk = [], sccs = [];
  let cnt = 0;
  function sc(v) {
    idx[v] = low[v] = cnt++; stk.push(v); onStk[v] = true;
    const dfs = [[v, 0]];
    while (dfs.length) {
      const fr = dfs[dfs.length-1], [node] = fr, ch = dirAdj[node];
      if (fr[1] < ch.length) {
        const w = ch[fr[1]++];
        if (!(w in idx)) { idx[w] = low[w] = cnt++; stk.push(w); onStk[w] = true; dfs.push([w, 0]); }
        else if (onStk[w]) low[node] = Math.min(low[node], idx[w]);
      } else {
        dfs.pop();
        if (dfs.length) low[dfs[dfs.length-1][0]] = Math.min(low[dfs[dfs.length-1][0]], low[node]);
        if (low[node] === idx[node]) {
          const scc = []; let w;
          do { w = stk.pop(); onStk[w] = false; scc.push(w); } while (w !== node);
          sccs.push(scc);
        }
      }
    }
  }
  graph.nodes.forEach(n => { if (!(n.id in idx)) sc(n.id); });
  return sccs;
}

// Kosaraju SCC (두 번의 반복 DFS + 전치 그래프)
function computeSCCKosaraju() {
  const dirAdj = buildDirAdj();
  const nodeIds = graph.nodes.map(n => n.id);

  // 전치(역방향) 인접 리스트
  const revAdj = {};
  nodeIds.forEach(id => revAdj[id] = []);
  graph.edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    if (s !== t) revAdj[t].push(s);
  });

  // 1패스: 원래 그래프 DFS → 종료 순서 기록
  const vis1 = new Set(), finishOrder = [];
  nodeIds.forEach(start => {
    if (vis1.has(start)) return;
    const stk = [[start, 0]]; vis1.add(start);
    while (stk.length) {
      const fr = stk[stk.length - 1];
      const [v] = fr, nbrs = dirAdj[v];
      let pushed = false;
      while (fr[1] < nbrs.length) {
        const w = nbrs[fr[1]++];
        if (!vis1.has(w)) { vis1.add(w); stk.push([w, 0]); pushed = true; break; }
      }
      if (!pushed) { stk.pop(); finishOrder.push(v); }
    }
  });

  // 2패스: 전치 그래프를 역 종료 순서로 DFS → 각 트리 = SCC
  const vis2 = new Set(), sccs = [];
  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const start = finishOrder[i];
    if (vis2.has(start)) continue;
    const scc = [], stk = [start];
    while (stk.length) {
      const v = stk.pop();
      if (vis2.has(v)) continue;
      vis2.add(v); scc.push(v);
      for (const w of revAdj[v]) if (!vis2.has(w)) stk.push(w);
    }
    sccs.push(scc);
  }
  return sccs;
}

function computeBridgeNodes(sccs) {
  const n2s = {};
  sccs.forEach((scc, i) => scc.forEach(n => n2s[n] = i));
  const cross = {};
  graph.nodes.forEach(n => cross[n.id] = 0);
  graph.edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    if (s !== t && n2s[s] !== n2s[t]) { cross[s]++; cross[t]++; }
  });
  return graph.nodes.filter(n => !n.isBasal && cross[n.id] > 0)
    .map(n => ({ id: n.id, score: cross[n.id] }))
    .sort((a,b) => b.score - a.score);
}

// ── CI(l=1) ───────────────────────────────────────────────────────────────
// Frontier after 1 BFS hop = direct neighbors = ∂Ball(v,1)
function computeCI1() {
  const { adj, deg } = buildUndirAdj();
  return graph.nodes.map(n => {
    const ki = deg[n.id];
    const frontier = adj[n.id]; // Set of 1-hop neighbors
    const ci = (ki - 1) * [...frontier].reduce((s, j) => s + (deg[j] - 1), 0);
    return { id: n.id, score: ci };
  }).sort((a, b) => b.score - a.score);
}

// ── SCC Fragmentation Score ────────────────────────────────────────────────
// Python: scc_frag_score = fragmentation_gain + largest_scc_loss_ratio
// Uses Kosaraju on G_alg (self-loops already excluded from graph.edges)
function computeSCCFragScore() {
  const nodeIds = graph.nodes.map(n => n.id);

  function kosarajuExclude(excludeId) {
    const idSet = new Set(nodeIds.filter(id => id !== excludeId));
    const adj = {}, revAdj = {};
    idSet.forEach(id => { adj[id] = []; revAdj[id] = []; });
    graph.edges.forEach(e => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      if (!idSet.has(s) || !idSet.has(t) || s === t) return;
      adj[s].push(t);
      revAdj[t].push(s);
    });
    const ids = [...idSet];
    const vis1 = new Set(), finishOrder = [];
    ids.forEach(start => {
      if (vis1.has(start)) return;
      const stk = [[start, 0]]; vis1.add(start);
      while (stk.length) {
        const fr = stk[stk.length - 1], [v] = fr, nbrs = adj[v];
        let pushed = false;
        while (fr[1] < nbrs.length) {
          const w = nbrs[fr[1]++];
          if (!vis1.has(w)) { vis1.add(w); stk.push([w, 0]); pushed = true; break; }
        }
        if (!pushed) { stk.pop(); finishOrder.push(v); }
      }
    });
    const vis2 = new Set(), sccs = [];
    for (let i = finishOrder.length - 1; i >= 0; i--) {
      const start = finishOrder[i];
      if (vis2.has(start)) continue;
      const scc = [], stk = [start];
      while (stk.length) {
        const v = stk.pop();
        if (vis2.has(v)) continue;
        vis2.add(v); scc.push(v);
        for (const w of revAdj[v]) if (!vis2.has(w)) stk.push(w);
      }
      sccs.push(scc);
    }
    return sccs;
  }

  const before = computeSCCKosaraju();
  const nb = before.length;
  const lb = Math.max(...before.map(s => s.length));
  const nodeToScc = {};
  before.forEach(scc => scc.forEach(id => nodeToScc[id] = scc));

  return graph.nodes.map(n => {
    const compV = nodeToScc[n.id] || [n.id];
    const expected_after = compV.length === 1 ? nb - 1 : nb;
    const after = kosarajuExclude(n.id);
    const na = after.length;
    const la = after.length > 0 ? Math.max(...after.map(s => s.length)) : 0;
    const fragmentation_gain = na - expected_after;
    const largest_scc_loss_ratio = lb > 0 ? (lb - la) / lb : 0;
    return { id: n.id, score: fragmentation_gain + largest_scc_loss_ratio };
  }).sort((a, b) => b.score - a.score || a.id - b.id);
}

// ── CoreHD ────────────────────────────────────────────────────────────────
// 반복적 2-core 해체. tie → node id 오름차순. Returns [{id, score}] most-critical first.
function computeCoreHD() {
  // Build undirected adjacency as mutable Map<id, Set<id>>
  const adjMap = new Map();
  graph.nodes.forEach(n => adjMap.set(n.id, new Set()));
  graph.edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    if (s === t) return;
    adjMap.get(s).add(t);
    adjMap.get(t).add(s);
  });

  // Compute coreness (k-core number) via iterative peeling
  function coreNumbers(nodeSet, adj) {
    const deg = new Map();
    nodeSet.forEach(v => deg.set(v, [...adj.get(v)].filter(u => nodeSet.has(u)).length));
    const coreness = new Map();
    const remaining = new Set(nodeSet);
    let k = 1;
    while (remaining.size > 0) {
      let changed = true;
      while (changed) {
        changed = false;
        remaining.forEach(v => {
          if (deg.get(v) < k) {
            coreness.set(v, k - 1);
            remaining.delete(v);
            adj.get(v).forEach(u => { if (remaining.has(u)) deg.set(u, deg.get(u) - 1); });
            changed = true;
          }
        });
      }
      if (remaining.size > 0) k++;
    }
    return coreness;
  }

  const remaining = new Set(graph.nodes.map(n => n.id));
  // Deep-copy adjacency to allow mutation
  const adj = new Map();
  adjMap.forEach((neighbors, id) => adj.set(id, new Set(neighbors)));

  const removalOrder = [];

  while (remaining.size > 0) {
    const coreness = coreNumbers(remaining, adj);
    const in2core = [...remaining].filter(v => (coreness.get(v) || 0) >= 2);

    if (in2core.length === 0) {
      // No 2-core: remove remaining sorted by (-degree in remaining, id)
      const rest = [...remaining].sort((a, b) => {
        const da = [...adj.get(a)].filter(u => remaining.has(u)).length;
        const db = [...adj.get(b)].filter(u => remaining.has(u)).length;
        return db - da || a - b;
      });
      rest.forEach(v => removalOrder.push(v));
      break;
    }

    // Pick victim: highest degree in 2-core subgraph, tie → smallest id
    const victim = in2core.sort((a, b) => {
      const da = [...adj.get(a)].filter(u => in2core.includes(u)).length;
      const db = [...adj.get(b)].filter(u => in2core.includes(u)).length;
      return db - da || a - b;
    })[0];

    removalOrder.push(victim);
    remaining.delete(victim);
    // No need to remove from adj — coreNumbers filters by remaining
  }

  const n = removalOrder.length;
  return removalOrder.map((id, i) => ({ id, score: n - i }));
}

// Build wave states: remove top-5 all at once, then replay cascade step by step
function buildWaveStates(ranking) {
  const directIds = ranking.slice(0, 5).map(r => r.id);
  const directRemoved = new Set(directIds);
  const result = runCascade({ nodes: graph.nodes, edges: graph.edges }, directIds, 0.7);

  const states = [];
  let cumExtinct = new Set();

  result.steps.forEach((step, i) => {
    for (const id of step.ids) cumExtinct.add(id);
    const cascadeExtinct = new Set([...cumExtinct].filter(id => !directRemoved.has(id)));
    states.push({
      directRemoved,
      cascadeExtinct,
      allExtinct: new Set(cumExtinct),
      alive: graph.nodes.length - cumExtinct.size,
      stepLabel: i === 0 ? 'Step 0 — Top 5 removed' : `Cascade step ${i}`,
      newIds: step.ids
    });
  });

  return states;
}

// ExtMap: per step, what's NEWLY extinct
function buildExtMap(states) {
  return states.map((state, i) => {
    const prevAll = i > 0 ? states[i-1].allExtinct : new Set();
    const newDirect  = new Set([...state.directRemoved].filter(id => !prevAll.has(id)));
    const newCascade = new Set([...state.cascadeExtinct].filter(id => !prevAll.has(id)));
    return { newDirect, newCascade };
  });
}
