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
  const N = nodes.length, norm = (N-1)*(N-2);
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
      alive: 40 - cumExtinct.size,
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
