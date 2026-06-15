function buildGraph() {
  const nodes = SPECIES_NAMES.map((name, i) => ({
    id: i, name,
    isBasal: false,
    initialPreyWeight: 0,
    inDeg: 0, outDeg: 0,
    x: null, y: null
  }));
  const edges = RAW_EDGES.map(([s, t, w]) => ({ source: s, target: t, weight: w }));
  edges.forEach(e => { nodes[e.target].inDeg++; nodes[e.source].outDeg++; nodes[e.target].initialPreyWeight += e.weight; });
  // Add self-loop weights to initialPreyWeight for WTECM diet ratio (G_wtecm includes self-loops)
  if (typeof SELF_LOOP_WEIGHTS !== 'undefined') {
    Object.entries(SELF_LOOP_WEIGHTS).forEach(([id, w]) => { nodes[+id].initialPreyWeight += w; });
  }
  nodes.forEach(n => { n.isBasal = n.inDeg === 0; });
  return { nodes, edges };
}

function runCascade(graph, initialIds, threshold) {
  const extinct = new Set(initialIds);
  let newlyExtinct = new Set(initialIds);
  const steps = [{ step: 0, ids: [...initialIds] }];
  while (newlyExtinct.size > 0) {
    const next = new Set();
    graph.nodes.forEach(n => {
      if (extinct.has(n.id) || n.isBasal || n.initialPreyWeight === 0) return;
      // Sum remaining prey weights (excluding extinct prey)
      let rem = graph.edges
        .filter(e => {
          const tgt = typeof e.target === 'object' ? e.target.id : e.target;
          const src = typeof e.source === 'object' ? e.source.id : e.source;
          return tgt === n.id && !extinct.has(src);
        })
        .reduce((s, e) => s + e.weight, 0);
      // Self-loop: node eats itself — always available while alive
      if (typeof SELF_LOOP_WEIGHTS !== 'undefined' && SELF_LOOP_WEIGHTS[n.id]) {
        rem += SELF_LOOP_WEIGHTS[n.id];
      }
      // Python semantics: extinct when loss_ratio >= theta
      // loss_ratio = (initial - rem) / initial >= theta  ↔  rem/initial < (1-theta)
      if (rem / n.initialPreyWeight < (1 - threshold)) next.add(n.id);
    });
    newlyExtinct = new Set([...next].filter(id => !extinct.has(id)));
    if (newlyExtinct.size > 0) {
      steps.push({ step: steps.length, ids: [...newlyExtinct] });
      for (const id of newlyExtinct) extinct.add(id);
    }
  }
  return { steps, extinct: [...extinct] };
}
