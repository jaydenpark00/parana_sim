// ── WTECM Cascade Simulation ─────────────────────────────────────────────
let wtecmInitialized = false;
let wtecmSim = null;
let wtecmTheta = 0.7;
let wtecmWave = 0;
let wtecmStates = null;
let wtecmSelectedIds = new Set(); // up to 5
let wtecmPlayInterval = null;
let wtecmNodeSel = null;
let wtecmLinkSel = null;

function initWtecmSim() {
  if (wtecmInitialized) return;
  wtecmInitialized = true;
  buildWtecmD3();
}

function buildWtecmD3() {
  const container = document.getElementById('wtecm-graph-container');
  const svg = d3.select('#wtecm-svg');
  let W = container.clientWidth  || 700;
  let H = container.clientHeight || 500;
  svg.attr('viewBox', `0 0 ${W} ${H}`);

  // Arrowhead
  svg.append('defs').append('marker')
    .attr('id', 'wtecm-arrow').attr('viewBox', '0 -4 8 8').attr('refX', 14).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
    .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', 'rgba(161,212,148,0.25)');

  const edgesCopy = graph.edges.map(e => ({ ...e }));

  // Zoom container — all layers go inside this g
  const zoomG = svg.append('g').attr('class', 'wtecm-zoom-g');
  const linkLayer = zoomG.append('g').attr('class', 'wtecm-links');
  const nodeLayer = zoomG.append('g').attr('class', 'wtecm-nodes');

  // D3 zoom: scroll=zoom, drag on background=pan, initial 1.2x center
  const zoom = d3.zoom()
    .scaleExtent([0.2, 8])
    .on('zoom', event => zoomG.attr('transform', event.transform));
  svg.call(zoom);
  // Apply initial 1.2x centered zoom
  svg.call(zoom.transform, d3.zoomIdentity.scale(1.2).translate(-W / 12, -H / 12));

  // Force simulation
  wtecmSim = d3.forceSimulation(graph.nodes)
    .force('link',      d3.forceLink(edgesCopy).id(d => d.id).distance(80).strength(0.4))
    .force('charge',    d3.forceManyBody().strength(-500))
    .force('collision', d3.forceCollide(18))
    .force('center',    d3.forceCenter(W / 2, H / 2));

  // Edges
  wtecmLinkSel = linkLayer.selectAll('line')
    .data(edgesCopy).join('line')
    .attr('stroke', 'rgba(161,212,148,0.15)')
    .attr('stroke-width', 0.8)
    .attr('marker-end', 'url(#wtecm-arrow)');

  // Nodes (circle + label)
  const nodeG = nodeLayer.selectAll('g')
    .data(graph.nodes, d => d.id).join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (event, d) => { if (!event.active) wtecmSim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end',   (event, d) => { if (!event.active) wtecmSim.alphaTarget(0); d.fx = null; d.fy = null; }))
    .on('click', (event, d) => wtecmToggleNode(d.id));

  nodeG.append('circle')
    .attr('class', 'wtecm-circle')
    .attr('r', d => d.isBasal ? 7 : 5 + Math.min(d.outDeg, 12))
    .attr('fill', d => wtecmNodeColor(d.id))
    .attr('stroke', 'rgba(0,0,0,0.25)')
    .attr('stroke-width', 0.8);

  nodeG.append('text')
    .attr('dy', d => -(d.isBasal ? 11 : 7 + Math.min(d.outDeg, 12)))
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(207,230,242,0.7)')
    .attr('font-size', '8px')
    .attr('pointer-events', 'none')
    .text(d => shortName(d.name));

  wtecmNodeSel = nodeG;

  wtecmSim.on('tick', () => {
    wtecmLinkSel
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    wtecmNodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Resize
  window.addEventListener('resize', () => {
    W = container.clientWidth  || 700;
    H = container.clientHeight || 500;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    wtecmSim.force('center', d3.forceCenter(W / 2, H / 2)).alpha(0.3).restart();
  });
}

function wtecmNodeColor(nodeId) {
  if (!wtecmStates) {
    if (wtecmSelectedIds.has(nodeId)) return '#ef5350';
    return graph.nodes[nodeId]?.isBasal ? '#4caf50' : '#26c6da';
  }
  return cmpNodeColor(nodeId, wtecmStates, null, wtecmWave);
}

function updateWtecmColors() {
  if (!wtecmNodeSel) return;
  wtecmNodeSel.select('.wtecm-circle')
    .transition().duration(400)
    .attr('fill', d => wtecmNodeColor(d.id))
    .attr('stroke', d => wtecmSelectedIds.has(d.id) ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)')
    .attr('stroke-width', d => wtecmSelectedIds.has(d.id) ? 2 : 0.8);
}

function wtecmUpdateSelectedUI() {
  const count = wtecmSelectedIds.size;
  const countEl = document.getElementById('wtecm-select-count');
  if (countEl) countEl.textContent = `${count} / 5`;

  const chipsEl = document.getElementById('wtecm-selected-chips');
  if (!chipsEl) return;

  if (count === 0) {
    chipsEl.innerHTML = '<span style="color:#42493e;font-size:10px;line-height:22px;">종을 클릭하세요</span>';
    return;
  }

  chipsEl.innerHTML = [...wtecmSelectedIds].map(id => `
    <span style="display:inline-flex;align-items:center;gap:2px;background:rgba(239,83,80,0.15);border:1px solid rgba(239,83,80,0.35);color:#ef5350;font-size:10px;padding:2px 3px 2px 7px;border-radius:4px;line-height:1.4;">
      ${shortName(SPECIES_NAMES[id])}
      <button onclick="wtecmToggleNode(${id})" style="display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(239,83,80,0.7);padding:0;margin:0;background:none;border:none;line-height:1;" title="해제">
        <span class="material-symbols-outlined" style="font-size:13px;">close</span>
      </button>
    </span>
  `).join('');
}

function wtecmToggleNode(nodeId) {
  if (wtecmSelectedIds.has(nodeId)) {
    wtecmSelectedIds.delete(nodeId);
  } else {
    if (wtecmSelectedIds.size >= 5) return; // max 5
    wtecmSelectedIds.add(nodeId);
  }

  wtecmUpdateSelectedUI();

  if (wtecmSelectedIds.size === 0) {
    wtecmStates = null;
    wtecmWave = 0;
    document.getElementById('wtecm-slider').max = 0;
    document.getElementById('wtecm-slider').value = 0;
    document.getElementById('wtecm-wave-label').textContent = '— / —';
    document.getElementById('wtecm-alive').textContent = graph.nodes.length;
    document.getElementById('wtecm-extinct-count').textContent = '0';
    document.getElementById('wtecm-ext-log').innerHTML =
      '<p style="color:#42493e;font-size:10px;padding:4px 0;">종을 선택하면 cascade가 시작됩니다</p>';
    updateWtecmColors();
    return;
  }

  const selectedList = [...wtecmSelectedIds];
  const directRemoved = new Set(selectedList);
  const result = runCascade({ nodes: graph.nodes, edges: graph.edges }, selectedList, wtecmTheta);

  wtecmStates = [];
  let cumExtinct = new Set();
  result.steps.forEach((step) => {
    for (const id of step.ids) cumExtinct.add(id);
    const cascadeExtinct = new Set([...cumExtinct].filter(id => !directRemoved.has(id)));
    wtecmStates.push({
      directRemoved,
      cascadeExtinct,
      allExtinct: new Set(cumExtinct),
      alive: graph.nodes.length - cumExtinct.size,
      newIds: step.ids
    });
  });

  document.getElementById('wtecm-slider').max = wtecmStates.length;
  setWtecmWave(0);
}

function setWtecmTheta(val) {
  wtecmTheta = val;
  document.getElementById('wtecm-theta-label').textContent = val.toFixed(1);
  if (wtecmSelectedIds.size > 0) {
    // re-run cascade with current selection
    const selectedList = [...wtecmSelectedIds];
    const directRemoved = new Set(selectedList);
    const result = runCascade({ nodes: graph.nodes, edges: graph.edges }, selectedList, wtecmTheta);
    wtecmStates = [];
    let cumExtinct = new Set();
    result.steps.forEach((step) => {
      for (const id of step.ids) cumExtinct.add(id);
      const cascadeExtinct = new Set([...cumExtinct].filter(id => !directRemoved.has(id)));
      wtecmStates.push({ directRemoved, cascadeExtinct, allExtinct: new Set(cumExtinct), alive: graph.nodes.length - cumExtinct.size, newIds: step.ids });
    });
    document.getElementById('wtecm-slider').max = wtecmStates.length;
    setWtecmWave(0);
  }
}

function setWtecmWave(w) {
  if (!wtecmStates) return;
  wtecmWave = Math.max(0, Math.min(wtecmStates.length, w));
  document.getElementById('wtecm-slider').value = wtecmWave;
  document.getElementById('wtecm-wave-label').textContent = `${wtecmWave} / ${wtecmStates.length}`;

  const isFinal = wtecmWave >= wtecmStates.length;
  const safeWave = Math.min(wtecmWave, wtecmStates.length - 1);
  const state = wtecmStates[safeWave];
  const survived = graph.nodes.length - state.allExtinct.size;

  document.getElementById('wtecm-alive').textContent = isFinal ? survived : state.alive;
  document.getElementById('wtecm-extinct-count').textContent = state.allExtinct.size;

  updateWtecmColors();
  renderWtecmLog(isFinal, safeWave, state);
}

function renderWtecmLog(isFinal, safeWave, state) {
  const logEl = document.getElementById('wtecm-ext-log');
  const displayWave = isFinal ? wtecmStates.length - 1 : safeWave;
  let logHtml = '';

  for (let w = 0; w <= displayWave; w++) {
    const s = wtecmStates[w];
    const isCurrent = (w === safeWave) && !isFinal;
    const rowBg = isCurrent
      ? 'background:rgba(161,212,148,0.07);border-left:2px solid #a1d494;'
      : 'border-left:2px solid transparent;';

    if (w === 0) {
      const names = [...s.directRemoved].map(id => shortName(SPECIES_NAMES[id]));
      logHtml += `<div style="${rowBg} padding:4px 6px;border-radius:3px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="background:#ef5350;color:#fff;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;white-space:nowrap">STEP 0 · 초기 제거</span>
          <span style="color:#ef5350;font-size:11px;font-weight:700">−${names.length}종</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;">
          ${names.map(n => `<span style="background:rgba(239,83,80,0.15);color:#ef5350;font-size:9px;padding:1px 5px;border-radius:3px;">${n}</span>`).join('')}
        </div>
      </div>`;
    } else {
      const cascadeIds = s.newIds.filter(id => !s.directRemoved.has(id));
      if (cascadeIds.length === 0) continue;
      const names = cascadeIds.map(id => shortName(SPECIES_NAMES[id]));
      const color = isCurrent ? '#ff7043' : '#607d8b';
      const chipBg = isCurrent ? 'rgba(255,112,67,0.15)' : 'rgba(96,125,139,0.15)';
      logHtml += `<div style="${rowBg} padding:4px 6px;border-radius:3px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="background:${isCurrent ? '#ff7043' : '#455a64'};color:#fff;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;white-space:nowrap">STEP ${w} · 연쇄 멸종</span>
          <span style="color:${color};font-size:11px;font-weight:700">−${names.length}종</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;">
          ${names.map(n => `<span style="background:${chipBg};color:${color};font-size:9px;padding:1px 5px;border-radius:3px;">${n}</span>`).join('')}
        </div>
      </div>`;
    }
  }

  if (isFinal) {
    const survived = graph.nodes.length - state.allExtinct.size;
    const extCount = state.allExtinct.size;
    logHtml += `<div style="padding:5px 6px;border-radius:3px;background:rgba(38,198,218,0.05);border-left:2px solid #26c6da;margin-top:2px;">
      <span style="color:#26c6da;font-size:10px;font-weight:600;">■ 최종 생존 ${survived}종 &nbsp;·&nbsp; </span>
      <span style="color:#455a64;font-size:10px;font-weight:600;">■ 총 멸종 ${extCount}종 (${Math.round(extCount / graph.nodes.length * 100)}%)</span>
    </div>`;
  }

  logEl.innerHTML = logHtml || '<p style="color:#42493e;font-size:10px;padding:4px 0;">cascade 없음</p>';
  logEl.scrollTop = logEl.scrollHeight;
}

function wtecmClearSelection() {
  wtecmSelectedIds.clear();
  wtecmStates = null;
  wtecmWave = 0;
  document.getElementById('wtecm-slider').max = 0;
  document.getElementById('wtecm-slider').value = 0;
  document.getElementById('wtecm-wave-label').textContent = '— / —';
  document.getElementById('wtecm-alive').textContent = graph.nodes.length;
  document.getElementById('wtecm-extinct-count').textContent = '0';
  document.getElementById('wtecm-ext-log').innerHTML =
    '<p style="color:#42493e;font-size:10px;padding:4px 0;">종을 선택하면 cascade가 시작됩니다</p>';
  wtecmUpdateSelectedUI();
  updateWtecmColors();
}

// Also reset when wtecmToggleNode empties selection (handled inside wtecmToggleNode already)
function wtecmReset()    { wtecmClearSelection(); }
function wtecmStepPrev() { setWtecmWave(wtecmWave - 1); }
function wtecmStepNext() { setWtecmWave(wtecmWave + 1); }
function wtecmEnd()      { if (wtecmStates) setWtecmWave(wtecmStates.length); }

function wtecmTogglePlay() {
  const icon = document.querySelector('#wtecm-play-btn .material-symbols-outlined');
  if (wtecmPlayInterval) {
    clearInterval(wtecmPlayInterval); wtecmPlayInterval = null; icon.textContent = 'play_arrow';
  } else {
    if (!wtecmStates) return;
    icon.textContent = 'pause';
    wtecmPlayInterval = setInterval(() => {
      if (wtecmWave >= wtecmStates.length) {
        clearInterval(wtecmPlayInterval); wtecmPlayInterval = null; icon.textContent = 'play_arrow'; return;
      }
      setWtecmWave(wtecmWave + 1);
    }, 900);
  }
}
