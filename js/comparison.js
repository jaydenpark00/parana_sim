// ── Comparison state ───────────────────────────────────────────────────────
let cmpWave = 0, cmpPlayInterval = null, cmpInitialized = false, cmpNodePos = null;
let bcRanking, ciRanking, sccRanking;
let bcStates,   ciStates,   sccStates;
let bcExtMap,   ciExtMap,   sccExtMap;

function initComparison() {
  if (cmpInitialized) return;
  cmpInitialized = true;
  bcRanking  = computeBC();
  ciRanking  = computeCI();
  sccRanking = computeBridgeNodes(computeSCC());
  bcStates   = buildWaveStates(bcRanking);
  ciStates   = buildWaveStates(ciRanking);
  sccStates  = buildWaveStates(sccRanking);
  bcExtMap   = buildExtMap(bcStates);
  ciExtMap   = buildExtMap(ciStates);
  sccExtMap  = buildExtMap(sccStates);
  computeCmpPositions();
  // Set slider max — includes final summary wave
  const maxStep = getMaxStep();
  const slider = document.getElementById('wave-slider');
  slider.max = maxStep;
  document.getElementById('wave-label').textContent = `0 / ${maxStep}`;
  setWave(0);
}

function computeCmpPositions() {
  const nodesCopy = graph.nodes.map(n => ({ ...n, x: undefined, y: undefined }));
  const edgesCopy = graph.edges.map(e => ({ ...e }));
  const sim = d3.forceSimulation(nodesCopy)
    .force('link',      d3.forceLink(edgesCopy).id(d => d.id).distance(55).strength(0.5))
    .force('charge',    d3.forceManyBody().strength(-350))
    .force('collision', d3.forceCollide(10))
    .force('center',    d3.forceCenter(0, 0))
    .stop();
  for (let i = 0; i < 500; i++) sim.tick();
  const xs = nodesCopy.map(n => n.x), ys = nodesCopy.map(n => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = maxX - minX || 1, rY = maxY - minY || 1, pad = 0.07;
  cmpNodePos = {};
  nodesCopy.forEach(n => {
    cmpNodePos[n.id] = {
      x: pad + (n.x - minX) / rX * (1 - 2*pad),
      y: pad + (n.y - minY) / rY * (1 - 2*pad)
    };
  });
}

function cmpNodeColor(nodeId, states, extMap, wave) {
  // Final summary wave — 2 colors only: survived vs extinct
  if (wave >= states.length) {
    const final = states[states.length - 1];
    return final.allExtinct.has(nodeId) ? '#455a64' : '#26c6da';
  }

  const safeWave = Math.min(wave, states.length - 1);
  const state = states[safeWave];
  if (state.directRemoved.has(nodeId)) return '#ef5350'; // direct removal
  if (!state.allExtinct.has(nodeId)) return '#26c6da';   // alive
  let extStep = -1;
  for (let w = 0; w < states.length; w++) {
    if (states[w].cascadeExtinct.has(nodeId)) { extStep = w; break; }
  }
  if (extStep === safeWave) return '#ff7043'; // newly cascade extinct
  return '#455a64';                            // previously extinct
}

function drawCmpPanel(prefix, states, extMap, ranking) {
  const container = document.getElementById(prefix + '-graph-container');
  if (!container || !cmpNodePos) return;
  const W = container.clientWidth  || 500;
  const H = container.clientHeight || 200;
  const svg = d3.select('#' + prefix + '-svg').attr('viewBox', `0 0 ${W} ${H}`);
  svg.selectAll('*').remove();

  const px = id => cmpNodePos[id].x * W;
  const py = id => cmpNodePos[id].y * H;

  // Edges
  svg.append('g').selectAll('line').data(graph.edges).join('line')
    .attr('stroke', 'rgba(161,212,148,0.08)').attr('stroke-width', 0.4)
    .attr('x1', e => { const s = typeof e.source==='object'?e.source.id:e.source; return px(s); })
    .attr('y1', e => { const s = typeof e.source==='object'?e.source.id:e.source; return py(s); })
    .attr('x2', e => { const t = typeof e.target==='object'?e.target.id:e.target; return px(t); })
    .attr('y2', e => { const t = typeof e.target==='object'?e.target.id:e.target; return py(t); });

  // Nodes
  svg.append('g').selectAll('circle').data(graph.nodes).join('circle')
    .attr('r', 4)
    .attr('fill', d => cmpNodeColor(d.id, states, extMap, cmpWave))
    .attr('cx', d => px(d.id)).attr('cy', d => py(d.id))
    .attr('stroke','rgba(0,0,0,0.2)').attr('stroke-width', 0.5)
    .append('title').text(d => d.name);

  // ── Alive count ──────────────────────────────────────────────
  const isFinal = cmpWave >= states.length;
  const safeWave = Math.min(cmpWave, states.length - 1);
  const state = states[safeWave];
  const survived = graph.nodes.length - state.allExtinct.size;
  document.getElementById(prefix + '-alive').textContent = isFinal ? survived : state.alive;

  // ── Extinction log ───────────────────────────────────────────
  const logEl = document.getElementById(prefix + '-ext-log');
  const displayWave = isFinal ? states.length - 1 : safeWave;
  let logHtml = '';

  for (let w = 0; w <= displayWave; w++) {
    const s = states[w];
    const isCurrent = (w === safeWave) && !isFinal;
    const rowBg = isCurrent
      ? 'background:rgba(161,212,148,0.07);border-left:2px solid #a1d494;'
      : 'border-left:2px solid transparent;';

    if (w === 0) {
      // Direct removal step
      const names = [...s.directRemoved].map(id => shortName(SPECIES_NAMES[id]));
      logHtml += `<div style="${rowBg} padding:4px 6px;border-radius:3px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="background:#ef5350;color:#fff;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;white-space:nowrap">STEP 0 · 직접 제거</span>
          <span style="color:#ef5350;font-size:11px;font-weight:700">−${names.length}종</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;">
          ${names.map(n => `<span style="background:rgba(239,83,80,0.15);color:#ef5350;font-size:9px;padding:1px 5px;border-radius:3px;">${n}</span>`).join('')}
        </div>
      </div>`;
    } else {
      // Cascade step
      const cascadeIds = s.newIds.filter(id => !s.directRemoved.has(id));
      if (cascadeIds.length === 0) continue;
      const names = cascadeIds.map(id => shortName(SPECIES_NAMES[id]));
      const color = isCurrent ? '#ff7043' : '#607d8b';
      const chipBg = isCurrent ? 'rgba(255,112,67,0.15)' : 'rgba(96,125,139,0.15)';
      logHtml += `<div style="${rowBg} padding:4px 6px;border-radius:3px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="background:${isCurrent?'#ff7043':'#455a64'};color:#fff;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;white-space:nowrap">STEP ${w} · 연쇄 멸종</span>
          <span style="color:${color};font-size:11px;font-weight:700">−${names.length}종</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;">
          ${names.map(n => `<span style="background:${chipBg};color:${color};font-size:9px;padding:1px 5px;border-radius:3px;">${n}</span>`).join('')}
        </div>
      </div>`;
    }
  }

  if (isFinal) {
    const extCount = state.allExtinct.size;
    logHtml += `<div style="padding:5px 6px;border-radius:3px;background:rgba(38,198,218,0.05);border-left:2px solid #26c6da;margin-top:2px;">
      <span style="color:#26c6da;font-size:10px;font-weight:600;">■ 최종 생존 ${survived}종 &nbsp;·&nbsp; </span>
      <span style="color:#455a64;font-size:10px;font-weight:600;">■ 총 멸종 ${extCount}종 (${Math.round(extCount/graph.nodes.length*100)}%)</span>
    </div>`;
  } else if (safeWave === 0 || states.slice(1, safeWave + 1).every(s => s.newIds.filter(id => !s.directRemoved.has(id)).length === 0)) {
    // no cascade yet — show placeholder
  }

  logEl.innerHTML = logHtml || '<p style="color:#42493e;font-size:10px;padding:4px 0;">cascade 없음</p>';

  // ── Ranking chips ─────────────────────────────────────────────
  const rankEl = document.getElementById(prefix + '-ranking-bar');
  rankEl.innerHTML = ranking.slice(0, 5).map((r, i) => {
    const gone = state.allExtinct.has(r.id);
    const bg = gone
      ? 'background:rgba(69,90,100,0.3);color:#607d8b;text-decoration:line-through;'
      : 'background:rgba(239,83,80,0.12);color:#ef5350;';
    return `<span style="${bg} font-size:9px;padding:2px 6px;border-radius:4px;white-space:nowrap;font-weight:500">${i+1}. ${shortName(SPECIES_NAMES[r.id])}</span>`;
  }).join('');
}

function renderAllPanels() {
  if (!cmpInitialized) return;
  const maxStep = getMaxStep();
  document.getElementById('wave-label').textContent = `${cmpWave} / ${maxStep}`;
  document.getElementById('wave-slider').value = cmpWave;
  drawCmpPanel('bc',  bcStates,  bcExtMap,  bcRanking);
  drawCmpPanel('ci',  ciStates,  ciExtMap,  ciRanking);
  drawCmpPanel('scc', sccStates, sccExtMap, sccRanking);
}

function getMaxStep() {
  if (!cmpInitialized) return 0;
  // +1 for the final summary wave (survived/extinct only)
  return Math.max(bcStates.length, ciStates.length, sccStates.length);
}
function setWave(w) { cmpWave = Math.max(0, Math.min(getMaxStep(), w)); renderAllPanels(); }
function cmpReset()    { setWave(0); }
function cmpStepPrev() { setWave(cmpWave - 1); }
function cmpStepNext() { setWave(cmpWave + 1); }
function cmpEnd()      { setWave(getMaxStep()); }

function cmpTogglePlay() {
  const icon = document.querySelector('#cmp-play-btn .material-symbols-outlined');
  if (cmpPlayInterval) {
    clearInterval(cmpPlayInterval); cmpPlayInterval = null; icon.textContent = 'play_arrow';
  } else {
    icon.textContent = 'pause';
    cmpPlayInterval = setInterval(() => {
      if (cmpWave >= getMaxStep()) { clearInterval(cmpPlayInterval); cmpPlayInterval = null; icon.textContent = 'play_arrow'; return; }
      setWave(cm