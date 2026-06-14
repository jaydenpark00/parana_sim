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
      const rem = graph.edges
        .filter(e => {
          const tgt = typeof e.target === 'object' ? e.target.id : e.target;
          const src = typeof e.source === 'object' ? e.source.id : e.source;
          return tgt === n.id && !extinct.has(src);
        })
        .reduce((s, e) => s + e.weight, 0);
      if (rem / n.initialPreyWeight < threshold) next.add(n.id);
    });
    newlyExtinct = new Set([...next].filter(id => !extinct.has(id)));
    if (newlyExtinct.size > 0) {
      steps.push({ step: steps.length, ids: [...newlyExtinct] });
      for (const id of newlyExtinct) extinct.add(id);
    }
  }
  return { steps, extinct: [...extinct] };
}
