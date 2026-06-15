// ── State ──────────────────────────────────────────────────────────────────
let graph = buildGraph();
let simulation = null;

// ── D3 Graph ──────────────────────────────────────────────────────────────
const container = document.getElementById('graph-container');
const svg = d3.select('#graph-svg');

let width, height;
function resize() {
  width = container.clientWidth;
  height = container.clientHeight;
  svg.attr('viewBox', `0 0 ${width} ${height}`);
}
resize();
window.addEventListener('resize', () => { resize(); if (simulation) simulation.force('center', d3.forceCenter(width/2, height/2)); });

// Defs: arrowhead
svg.append('defs').append('marker')
  .attr('id','arrow').attr('viewBox','0 -4 8 8').attr('refX',14).attr('refY',0)
  .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
  .append('path').attr('d','M0,-4L8,0L0,4').attr('fill','rgba(161,212,148,0.3)');

const linkLayer = svg.append('g').attr('class','links');
const nodeLayer = svg.append('g').attr('class','nodes');

function initGraph() {
  resize();
  linkLayer.selectAll('*').remove();
  nodeLayer.selectAll('*').remove();

  const edgesCopy = graph.edges.map(e => ({ ...e }));

  simulation = d3.forceSimulation(graph.nodes)
    .force('link', d3.forceLink(edgesCopy).id(d => d.id).distance(100).strength(0.4))
    .force('charge', d3.forceManyBody().strength(-600))
    .force('collision', d3.forceCollide(22))
    .force('center', d3.forceCenter(width / 2, height / 2));

  const link = linkLayer.selectAll('line')
    .data(edgesCopy).join('line')
    .attr('class','link-line')
    .attr('stroke','rgba(161,212,148,0.25)')
    .attr('stroke-width', d => Math.max(0.5, d.weight * 2))
    .attr('marker-end','url(#arrow)');

  const node = nodeLayer.selectAll('g')
    .data(graph.nodes).join('g')
    .attr('class','node-g')
    .call(d3.drag()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }))
    .on('click', (event, d) => { showInfo(d.id); });

  node.append('circle')
    .attr('class','node-circle')
    .attr('r', d => d.isBasal ? 7 : 5 + Math.min(d.outDeg, 14))
    .attr('fill', d => nodeColor(d.id))
    .attr('stroke', d => d.isBasal ? 'rgba(76,175,80,0.6)' : 'rgba(91,155,213,0.4)');

  node.append('text')
    .attr('dy', d => -(d.isBasal ? 10 : 7 + Math.min(d.outDeg, 14)))
    .attr('text-anchor','middle')
    .attr('fill','rgba(207,230,242,0.7)')
    .attr('font-size','8px')
    .attr('pointer-events','none')
    .text(d => shortName(d.name));

  simulation.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

}

function nodeColor(id) {
  const n = graph.nodes[id];
  if (n.isBasal) return '#4caf50';
  return '#5b9bd5';
}

function shortName(name) {
  const p = name.split(' ');
  if (p.length === 1 || name.startsWith('Other') || name.startsWith('Aquatic')) return name.length > 12 ? name.slice(0,10)+'…' : name;
  return p[0][0] + '. ' + p.slice(1).join(' ');
}

// ── Graph View Reset ──────────────────────────────────────────────────────
function resetGraphView() {
  if (simulation) {
    graph.nodes.forEach(n => { n.fx = null; n.fy = null; });
    simulation.alpha(0.5).restart();
  }
}

// ── Info Panel ──────────────────────────────────────────────────────────────
let _showInfoToken = 0; // guard against stale async responses from rapid clicks

async function showInfo(id) {
  const token = ++_showInfoToken;
  const n = graph.nodes[id];
  const badge = document.getElementById('info-badge');
  badge.textContent = n.isBasal ? '기초 생산자' : '소비자';
  badge.className = `text-[10px] px-2 py-0.5 rounded ${n.isBasal ? 'bg-[#4caf50]/20 text-[#4caf50]' : 'bg-[#5b9bd5]/20 text-[#5b9bd5]'}`;

  const preys = graph.edges
    .filter(e => (typeof e.target === 'object' ? e.target.id : e.target) === id)
    .map(e => ({ id: typeof e.source === 'object' ? e.source.id : e.source, weight: e.weight }))
    .sort((a, b) => b.weight - a.weight);
  const preds = graph.edges
    .filter(e => (typeof e.source === 'object' ? e.source.id : e.source) === id)
    .map(e => ({ id: typeof e.target === 'object' ? e.target.id : e.target, weight: e.weight }))
    .sort((a, b) => b.weight - a.weight);

  function weightBars(items, color) {
    const maxW = Math.max(...items.map(i => i.weight), 0.01);
    return items.map(item => `
      <div class="flex items-center gap-2 py-[3px]">
        <span class="text-[10px] text-on-surface-variant w-[88px] shrink-0 truncate">${shortName(SPECIES_NAMES[item.id])}</span>
        <div class="flex-1 h-[5px] bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all" style="width:${(item.weight/maxW*100).toFixed(0)}%;background:${color}99"></div>
        </div>
        <span class="text-[9px] text-on-surface-variant/60 w-[26px] text-right shrink-0">${item.weight.toFixed(2)}</span>
      </div>`).join('');
  }

  const wikiTitle = WIKI_TITLES[id];
  const wikiUrl = `https://en.wikipedia.org/wiki/${wikiTitle}`;

  // Render immediately with image placeholder
  document.getElementById('info-panel').innerHTML = `
    <div class="space-y-3">
      <div class="flex flex-col gap-2">
        <div id="wiki-img-wrap" class="w-full h-[160px] rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/20">
          <span class="material-symbols-outlined text-on-surface-variant text-[40px] opacity-40" style="animation:pulse 1.5s infinite">image</span>
        </div>
        <div>
          <p class="text-primary font-bold text-[13px] italic leading-tight">${n.name}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <a href="${wikiUrl}" target="_blank" class="text-[10px] text-on-surface-variant hover:text-primary transition-colors">Wikipedia ↗</a>
            <span id="iucn-badge"></span>
          </div>
          <p id="wiki-desc" class="text-[11px] text-on-surface-variant leading-relaxed mt-1 opacity-40">불러오는 중…</p>
          <div class="flex gap-3 mt-1 text-[11px] text-on-surface-variant">
            <span>유입: <strong class="text-on-surface">${n.inDeg}</strong></span>
            <span>유출: <strong class="text-on-surface">${n.outDeg}</strong></span>
            <span>${n.isBasal ? '<span class="text-[#4caf50]">기초 생산자</span>' : ''}</span>
          </div>
        </div>
      </div>
      ${!n.isBasal ? `<div><p class="text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider">먹이 (${preys.length}종)</p>${weightBars(preys, '#5b9bd5')}</div>` : ''}
      ${preds.length ? `<div><p class="text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider">포식자 (${preds.length}종)</p>${weightBars(preds, '#e57373')}</div>` : ''}
    </div>`;

  const wrap = document.getElementById('wiki-img-wrap');
  if (!wrap) return;

  function setImg(src, source) {
    wrap.innerHTML = `
      <div class="relative w-full h-full">
        <img src="${src}" alt="${n.name}" class="w-full h-full object-cover"
          onerror="this.closest('.relative').innerHTML=getFallbackSVG(${id})" />
        <span class="absolute bottom-1 right-1 text-[9px] bg-black/50 text-white/60 px-1 rounded">${source}</span>
      </div>`;
  }

  const iucnMap = {
    'least concern':        ['LC · 관심대상', '#4caf50'],
    'near threatened':      ['NT · 준위협',   '#8bc34a'],
    'vulnerable':           ['VU · 취약',     '#ffc107'],
    'endangered':           ['EN · 위기',     '#ff9800'],
    'critically endangered':['CR · 위급',     '#f44336'],
    'extinct in the wild':  ['EW · 야생절멸', '#9c27b0'],
    'extinct':              ['EX · 절멸',     '#9e9e9e'],
    'data deficient':       ['DD · 정보부족', '#9e9e9e'],
  };

  const [wData, iData] = await Promise.all([
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`).then(r => r.json()).catch(() => null),
    fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(n.name)}&per_page=1&rank=species`).then(r => r.json()).catch(() => null),
  ]);

  // Abort if user clicked another species while fetching
  if (token !== _showInfoToken) return;

  // Description — SPECIES_DESC_KO 사용
  const descEl = document.getElementById('wiki-desc');
  if (descEl) {
    descEl.textContent = SPECIES_DESC_KO[id];
    descEl.classList.remove('opacity-40');
  }

  // IUCN
  const iucnEl = document.getElementById('iucn-badge');
  if (iucnEl) {
    const statusName = iData?.results?.[0]?.conservation_status?.status_name?.toLowerCase();
    if (statusName && iucnMap[statusName]) {
      const [label, color] = iucnMap[statusName];
      iucnEl.innerHTML = `<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded" style="color:${color};background:${color}22">${label}</span>`;
    }
  }

  // Image
  if (wData?.thumbnail?.source) { setImg(wData.thumbnail.source, 'Wikipedia'); return; }
  const photo = iData?.results?.[0]?.default_photo?.medium_url;
  if (photo) { setImg(photo, 'iNaturalist'); return; }
  wrap.innerHTML = getFallbackSVG(id);
}

function getFallbackSVG(id) {
  const n = graph.nodes[id];
  const name = n.name.toLowerCase();
  let icon = 'set_meal'; // fish default
  if (name.includes('insect')) icon = 'pest_control';
  else if (name.includes('zooplankton') || name.includes('phytoplankton')) icon = 'water_drop';
  else if (name.includes('benthos') || name.includes('detritus')) icon = 'compost';
  else if (name.includes('macrophyte') || name.includes('periphyton')) icon = 'energy_savings_leaf';
  else if (name.includes('omnivore') || name.includes('piscivore') || name.includes('insectivore')) icon = 'category';
  return `<div class="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface-container-highest">
    <span class="material-symbols-outlined text-on-surface-variant text-[48px] opacity-30">${icon}</span>
    <span class="text-[9px] text-on-surface-variant opacity-40">no image</span>
  </div>`;
}

