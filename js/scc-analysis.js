// ═══════════════════════════════════════════════════════════════════════════
// ── SCC Analysis ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const SCC_PALETTE = ['#ef5350','#26c6da','#ffa726','#ab47bc','#66bb6a','#ff7043','#42a5f5','#ec407a','#8d6e63','#ffca28'];
let sccAnalysisInit = false;

function initSccAnalysis() {
  if (sccAnalysisInit) return;
  sccAnalysisInit = true;
  runSccAnalysis();
}

function runSccAnalysis() {
  const tarjanSccs    = computeSCC();
  const kosarajuSccs  = computeSCCKosaraju();
  const bridgeNodes   = computeBridgeNodes(tarjanSccs);

  // SCC 색상 맵 — 비자명(크기>1) SCC에 팔레트 색 할당
  const sccColorMap = {};
  let palIdx = 0;
  tarjanSccs.forEach(scc => {
    if (scc.length > 1) {
      const c = SCC_PALETTE[palIdx++ % SCC_PALETTE.length];
      scc.forEach(nid => sccColorMap[nid] = c);
    }
  });
  const sccMeta       = buildSccMeta(tarjanSccs, sccColorMap);
  const bridgeDetails = buildBridgeDetails(tarjanSccs, bridgeNodes, sccMeta);
  const bridgeSet     = new Set(bridgeDetails.map(b => b.id));

  // 헤더 통계 업데이트
  const nonTrivial = tarjanSccs.filter(s => s.length > 1);
  const maxSize    = Math.max(...tarjanSccs.map(s => s.length));
  document.getElementById('scc-total').textContent      = tarjanSccs.length;
  document.getElementById('scc-nontrivial').textContent = nonTrivial.length;
  document.getElementById('scc-maxsize').textContent    = maxSize;
  document.getElementById('scc-bridge').textContent     = bridgeDetails.length;

  renderSccMeaning(tarjanSccs, kosarajuSccs, bridgeDetails);
  renderBridgeRanking(bridgeDetails, sccMeta);

  // 두 알고리즘 SCC 목록 렌더링
  renderSccList('tarjan-scc-list',   tarjanSccs,   bridgeSet, sccMeta, 'tarjan');
  renderSccList('kosaraju-scc-list', kosarajuSccs, bridgeSet, sccMeta, 'kosaraju');

  // 네트워크 그래프
  drawSccAnalysisNetwork(tarjanSccs, bridgeSet, sccMeta, bridgeDetails);
}

function sccKey(scc) {
  return [...scc].sort((a, b) => a - b).join('-');
}

function sccSignature(sccs) {
  return sccs.map(sccKey).sort().join('|');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function buildSccMeta(sccs, sccColorMap) {
  const nodeToScc = {};
  const keyToMeta = {};
  let groupLabelIndex = 0;

  const groups = sccs.map((scc, index) => {
    const isNonTrivial = scc.length > 1;
    const color = isNonTrivial ? (sccColorMap[scc[0]] || SCC_PALETTE[index % SCC_PALETTE.length]) : '#5b9bd5';
    const label = isNonTrivial ? `그룹 ${String.fromCharCode(65 + groupLabelIndex++)}` : `단일 ${index + 1}`;
    const meta = {
      index,
      key: sccKey(scc),
      label,
      color,
      nodes: [...scc],
      isNonTrivial
    };
    scc.forEach(nid => nodeToScc[nid] = index);
    keyToMeta[meta.key] = meta;
    return meta;
  });

  return { groups, nodeToScc, keyToMeta };
}

function buildBridgeDetails(sccs, bridgeNodes, sccMeta) {
  const detailById = {};
  bridgeNodes.forEach(b => {
    detailById[b.id] = {
      id: b.id,
      score: b.score,
      incoming: 0,
      outgoing: 0,
      touches: new Set(),
      group: sccMeta.nodeToScc[b.id]
    };
  });

  graph.edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    const sourceScc = sccMeta.nodeToScc[s];
    const targetScc = sccMeta.nodeToScc[t];
    if (sourceScc === targetScc) return;

    if (detailById[s]) {
      detailById[s].outgoing++;
      detailById[s].touches.add(targetScc);
    }
    if (detailById[t]) {
      detailById[t].incoming++;
      detailById[t].touches.add(sourceScc);
    }
  });

  return Object.values(detailById)
    .map(d => ({ ...d, touches: [...d.touches].sort((a, b) => a - b) }))
    .sort((a, b) => b.score - a.score || SPECIES_NAMES[a.id].localeCompare(SPECIES_NAMES[b.id]));
}

function renderSccMeaning(tarjanSccs, kosarajuSccs, bridgeDetails) {
  const sameResult = sccSignature(tarjanSccs) === sccSignature(kosarajuSccs);
  const strongest = bridgeDetails[0];
  const strongestName = strongest ? shortName(SPECIES_NAMES[strongest.id]) : '없음';
  const strongestScore = strongest ? `${strongest.score}개 연결` : 'SCC 간 연결 없음';
  const el = document.getElementById('scc-meaning-panel');
  if (!el) return;

  el.innerHTML = `
    <div class="flex items-start gap-2">
      <span class="w-2 h-2 rounded-full bg-primary mt-1.5 flex-none"></span>
      <p><strong class="text-on-surface">SCC</strong>는 서로 유향 경로로 오갈 수 있는 종 묶음입니다. 같은 버블 안의 노드는 순환 먹이 연결 안에 있습니다.</p>
    </div>
    <div class="flex items-start gap-2">
      <span class="w-2 h-2 rounded-full bg-[#ff7043] mt-1.5 flex-none"></span>
      <p><strong class="text-on-surface">브리지 노드</strong>는 자기 SCC 밖으로 연결을 만들거나 받는 종입니다. 제거되면 SCC 사이 흐름을 끊을 가능성이 큽니다.</p>
    </div>
    <div class="flex items-start gap-2">
      <span class="w-2 h-2 rounded-full bg-[#26c6da] mt-1.5 flex-none"></span>
      <p>Tarjan/Kosaraju는 <strong class="text-on-surface">${sameResult ? '같은 SCC 묶음' : '서로 다른 묶음'}</strong>을 냅니다. 화면의 차이는 주로 발견 순서입니다.</p>
    </div>
    <div class="mt-2 px-2 py-1.5 rounded bg-surface-container-highest/70 border border-outline-variant/20">
      <span class="text-[10px] text-on-surface-variant">최상위 브리지</span>
      <p class="text-[12px] text-primary font-bold">${strongestName} <span class="text-[10px] text-on-surface-variant font-normal">· ${strongestScore}</span></p>
    </div>`;
}

function renderBridgeRanking(bridgeDetails, sccMeta) {
  const el = document.getElementById('bridge-rank-list');
  if (!el) return;

  if (bridgeDetails.length === 0) {
    el.innerHTML = '<div class="text-[11px] text-on-surface-variant italic px-1 py-2">SCC 간 연결을 담당하는 브리지 노드가 없습니다.</div>';
    return;
  }

  const maxScore = Math.max(...bridgeDetails.map(b => b.score), 1);
  el.innerHTML = bridgeDetails.slice(0, 8).map((b, i) => {
    const group = sccMeta.groups[b.group];
    const touches = b.touches.slice(0, 4).map(idx => {
      const touched = sccMeta.groups[idx];
      return `<span class="text-[9px] px-1 py-0.5 rounded" style="background:${touched.color}22;color:${touched.color};border:1px solid ${touched.color}44">${touched.label}</span>`;
    }).join('');
    const barWidth = Math.max(12, Math.round((b.score / maxScore) * 100));

    return `
      <button class="w-full text-left rounded bg-surface-container/60 hover:bg-surface-container-highest transition-colors border border-outline-variant/10 px-2 py-1.5"
        onclick="showInfo(${b.id})" title="${escapeHtml(SPECIES_NAMES[b.id])}">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold text-primary w-5">#${i + 1}</span>
          <span class="w-2.5 h-2.5 rounded-full flex-none" style="background:${group.color}"></span>
          <span class="text-[11px] text-on-surface font-bold truncate">${shortName(SPECIES_NAMES[b.id])}</span>
          <span class="ml-auto text-[10px] text-[#ff7043] font-bold">${b.score}</span>
        </div>
        <div class="mt-1 h-1 rounded bg-surface-container-highest overflow-hidden">
          <div class="h-full rounded bg-[#ff7043]" style="width:${barWidth}%"></div>
        </div>
        <div class="mt-1 flex items-center gap-1 flex-wrap text-[9px] text-on-surface-variant">
          <span>${group.label}</span>
          <span>out ${b.outgoing}</span>
          <span>in ${b.incoming}</span>
          ${touches}
        </div>
      </button>`;
  }).join('');
}

function renderSccList(containerId, sccs, bridgeSet, sccMeta, algo) {
  const nonTrivial = sccs.filter(s => s.length > 1);
  const trivial    = sccs.filter(s => s.length === 1);
  let html = '';

  // ① 비자명 SCC
  if (nonTrivial.length === 0) {
    html += `<div class="px-4 py-3 text-[11px] text-on-surface-variant italic">비자명 SCC 없음 — 모든 종이 유향 사이클 밖에 있습니다</div>`;
  } else {
    nonTrivial.forEach((scc, i) => {
      const discNum = sccs.indexOf(scc) + 1;
      const meta    = sccMeta.keyToMeta[sccKey(scc)];
      const color   = meta?.color || '#5b9bd5';
      html += `
        <div class="px-4 py-2.5 border-b border-outline-variant/10">
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="w-2.5 h-2.5 rounded-full flex-none" style="background:${color}"></span>
            <span class="font-label-md text-label-md text-on-surface font-bold">${meta?.label || `SCC #${discNum}`}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-label-md" style="background:${color}22;color:${color};border:1px solid ${color}44">${scc.length}종</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-error/10 text-error font-label-md">비자명</span>
            <span class="text-[9px] text-on-surface-variant opacity-60 ml-auto">발견 ${discNum}번째</span>
          </div>
          <div class="flex flex-wrap gap-1">
            ${scc.map(nid => {
              const isBridge = bridgeSet.has(nid);
              return `<span class="text-[9px] px-1.5 py-0.5 rounded cursor-default" title="${SPECIES_NAMES[nid]}"
                style="background:${isBridge?'rgba(255,112,67,0.15)':'rgba(255,255,255,0.05)'};
                       color:${isBridge?'#ff7043':'rgba(207,230,242,0.7)'};
                       border:1px solid ${isBridge?'rgba(255,112,67,0.3)':'rgba(140,147,135,0.15)'}"
              >${shortName(SPECIES_NAMES[nid])}${isBridge?' B':''}</span>`;
            }).join('')}
          </div>
        </div>`;
    });
  }

  // ② 자명 SCC (사이클 없는 단일 노드) — 접어서 표시
  if (trivial.length > 0) {
    html += `
      <div class="px-4 py-2.5 border-b border-outline-variant/10">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="font-label-md text-label-md text-on-surface-variant">자명 SCC (크기 1)</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-md">${trivial.length}개</span>
          <span class="text-[9px] text-on-surface-variant opacity-50 ml-auto">발견 ${algo==='tarjan'?nonTrivial.length+1:1}~${sccs.length}번째</span>
        </div>
        <div class="flex flex-wrap gap-1">
          ${trivial.map(scc => {
            const nid = scc[0];
            const disc = sccs.indexOf(scc) + 1;
            const isBridge = bridgeSet.has(nid);
            return `<span class="text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant"
              title="#${disc} ${SPECIES_NAMES[nid]}">${shortName(SPECIES_NAMES[nid])}${isBridge?' B':''}</span>`;
          }).join('')}
        </div>
      </div>`;
  }

  // ③ 알고리즘별 요약 노트
  const note = algo === 'tarjan'
    ? 'Tarjan은 DFS 스택에서 SCC를 확정하므로 싱크 SCC가 먼저 보입니다. 색상과 그룹명이 실제 묶음입니다.'
    : 'Kosaraju는 전치 그래프 DFS 순서라 발견 순서가 다릅니다. Tarjan과 같은 색/그룹명이면 같은 SCC입니다.';
  html += `<div class="px-4 py-3 text-[10px] text-on-surface-variant opacity-60 italic border-t border-outline-variant/10">${note}</div>`;

  document.getElementById(containerId).innerHTML = html;
}

function buildCondensedSccGraph(sccMeta, bridgeDetails) {
  const bridgeById = {};
  bridgeDetails.forEach(b => bridgeById[b.id] = b);

  const nodes = sccMeta.groups.map(group => {
    const bridgeMembers = group.nodes.filter(id => bridgeById[id]);
    const isBasal = group.nodes.every(id => graph.nodes[id].isBasal);
    const topBridge = bridgeMembers
      .map(id => bridgeById[id])
      .sort((a, b) => b.score - a.score)[0];

    return {
      id: group.index,
      label: group.label,
      color: group.color,
      size: group.nodes.length,
      nodes: group.nodes,
      isNonTrivial: group.isNonTrivial,
      isBasal,
      bridgeCount: bridgeMembers.length,
      topBridge,
      inCount: 0,
      outCount: 0
    };
  });

  const edgeMap = new Map();
  graph.edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    const source = sccMeta.nodeToScc[s];
    const target = sccMeta.nodeToScc[t];
    if (source === target) return;

    const key = `${source}->${target}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, { source, target, count: 0, weight: 0, sourceNodes: new Set(), targetNodes: new Set() });
    }
    const edge = edgeMap.get(key);
    edge.count++;
    edge.weight += e.weight || 0;
    edge.sourceNodes.add(s);
    edge.targetNodes.add(t);
  });

  const links = [...edgeMap.values()].map(edge => ({
    ...edge,
    sourceNodes: [...edge.sourceNodes],
    targetNodes: [...edge.targetNodes]
  }));

  const nodeById = {};
  nodes.forEach(node => nodeById[node.id] = node);
  links.forEach(link => {
    nodeById[link.source].outCount += link.count;
    nodeById[link.target].inCount += link.count;
  });
  nodes.forEach(node => {
    node.zone = getSccZoneId(node);
  });

  return { nodes, links };
}

function getSccZoneId(node) {
  if (node.isNonTrivial) return 'cycle';
  if (node.inCount === 0) return 'input';
  if (node.outCount === 0) return 'sink';
  return 'bridge';
}

function getSccZones(W, H) {
  const top = 48;
  const bottom = 24;
  const gap = 8;
  const left = 12;
  const right = 12;
  const usableW = W - left - right - gap * 3;
  const widths = [0.22, 0.24, 0.34, 0.20];
  const defs = [
    { id: 'input', label: '기초 입력', caption: '외부에서 들어오는 에너지/자원', color: '#4caf50' },
    { id: 'cycle', label: '순환 SCC', caption: '서로 되먹임되는 핵심 묶음', color: '#26c6da' },
    { id: 'bridge', label: '브리지 / 전달', caption: 'SCC 사이 흐름을 잇는 노드', color: '#ff7043' },
    { id: 'sink', label: '종착 소비자', caption: '더 위로 거의 전달되지 않음', color: '#ef5350' }
  ];

  let x = left;
  return defs.map((zone, i) => {
    const w = usableW * widths[i];
    const out = { ...zone, x0: x, x1: x + w, y0: top, y1: H - bottom };
    x += w + gap;
    return out;
  });
}

function sccComponentRadius(d) {
  if (d.isNonTrivial) return Math.min(58, 30 + d.size * 4);
  if (d.bridgeCount > 0) return 10 + Math.min(d.bridgeCount, 3) * 2;
  return d.isBasal ? 9 : 7;
}

function initializeZonedPositions(nodes, zones) {
  const zoneById = {};
  zones.forEach(zone => zoneById[zone.id] = zone);

  zones.forEach(zone => {
    const zoneNodes = nodes
      .filter(node => node.zone === zone.id)
      .sort((a, b) =>
        Number(b.isNonTrivial) - Number(a.isNonTrivial) ||
        b.size - a.size ||
        b.bridgeCount - a.bridgeCount ||
        (b.inCount + b.outCount) - (a.inCount + a.outCount)
      );

    if (zoneNodes.length === 0) return;

    const zoneW = zone.x1 - zone.x0;
    const zoneH = zone.y1 - zone.y0;
    const cols = zone.id === 'bridge'
      ? Math.min(3, Math.ceil(zoneNodes.length / 9))
      : (zoneNodes.length > 8 ? 2 : 1);
    const rows = Math.ceil(zoneNodes.length / cols);

    zoneNodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const colJitter = rows > 1 && row % 2 === 1 && cols > 1 ? zoneW / (cols + 1) * 0.12 : 0;
      node.x = zone.x0 + zoneW * (col + 1) / (cols + 1) + colJitter;
      node.y = zone.y0 + zoneH * (row + 1) / (rows + 1);
    });
  });
}

function drawSccAnalysisNetwork(sccs, bridgeSet, sccMeta, bridgeDetails) {
  const container = document.getElementById('scc-net-container');
  const svgEl     = document.getElementById('scc-net-svg');
  if (!container || !svgEl) return;

  const W = container.clientWidth  || 400;
  const H = container.clientHeight || 400;
  const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
  svg.selectAll('*').remove();

  const defs = svg.append('defs');
  defs.append('marker')
    .attr('id', 'scc-cross-arrow')
    .attr('viewBox', '0 -4 8 8')
    .attr('refX', 7)
    .attr('refY', 0)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4')
    .attr('fill', '#ff7043')
    .attr('opacity', 0.85);

  const condensed = buildCondensedSccGraph(sccMeta, bridgeDetails);
  const nodes = condensed.nodes.map(d => ({ ...d }));
  const links = condensed.links.map(d => ({ ...d }));
  const nodeById = {};
  nodes.forEach(node => nodeById[node.id] = node);
  const linkPriority = link => {
    const source = nodeById[link.source];
    const target = nodeById[link.target];
    const touchesGroup = source?.isNonTrivial || target?.isNonTrivial ? 7 : 0;
    const bridgeWeight = Math.min((source?.bridgeCount || 0) + (target?.bridgeCount || 0), 7);
    return link.count * 4 + touchesGroup + bridgeWeight;
  };
  const displayedLinks = [...links]
    .sort((a, b) => linkPriority(b) - linkPriority(a))
    .slice(0, Math.min(38, links.length));
  const topBridgeNodeIds = new Set(bridgeDetails.slice(0, 8).map(b => b.id));
  const maxLinkCount = Math.max(...displayedLinks.map(l => l.count), 1);
  const zones = getSccZones(W, H);

  initializeZonedPositions(nodes, zones);

  displayedLinks.forEach(link => {
    link.source = nodeById[link.source];
    link.target = nodeById[link.target];
  });

  const zoneLayer = svg.append('g').attr('class', 'scc-zone-layer');
  zoneLayer.selectAll('rect')
    .data(zones)
    .join('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('rx', 8)
    .attr('fill', d => d.color)
    .attr('fill-opacity', 0.045)
    .attr('stroke', d => d.color)
    .attr('stroke-opacity', 0.16)
    .attr('stroke-width', 1);

  zoneLayer.selectAll('text.zone-title')
    .data(zones)
    .join('text')
    .attr('class', 'zone-title')
    .attr('x', d => d.x0 + 10)
    .attr('y', d => d.y0 + 18)
    .attr('fill', d => d.color)
    .attr('font-size', '10px')
    .attr('font-weight', 800)
    .text(d => `${d.label} · ${nodes.filter(n => n.zone === d.id).length}`);

  zoneLayer.selectAll('text.zone-caption')
    .data(zones)
    .join('text')
    .attr('class', 'zone-caption')
    .attr('x', d => d.x0 + 10)
    .attr('y', d => d.y0 + 33)
    .attr('fill', 'rgba(207,230,242,0.48)')
    .attr('font-size', '8px')
    .text(d => d.caption);

  svg.append('text')
    .attr('x', 14)
    .attr('y', 24)
    .attr('fill', 'rgba(207,230,242,0.72)')
    .attr('font-size', '10px')
    .attr('font-weight', 600)
    .text(`SCC 구역 지도: 주요 연결 ${displayedLinks.length}/${links.length}개 표시, 왼쪽에서 오른쪽으로 먹이 흐름을 요약`);

  function linkPath(d) {
    const source = d.source;
    const target = d.target;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.hypot(dx, dy) || 1;
    const sr = sccComponentRadius(source) + 5;
    const tr = sccComponentRadius(target) + 8;
    const x1 = source.x + dx / len * sr;
    const y1 = source.y + dy / len * sr;
    const x2 = target.x - dx / len * tr;
    const y2 = target.y - dy / len * tr;
    const curve = Math.min(54, len * 0.13);
    const mx = (x1 + x2) / 2 - dy / len * curve;
    const my = (y1 + y2) / 2 + dx / len * curve;
    return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
  }

  const edgeLayer = svg.append('g').attr('class', 'scc-condensed-links');
  edgeLayer.selectAll('path')
    .data(displayedLinks)
    .join('path')
    .attr('d', linkPath)
    .attr('fill', 'none')
    .attr('stroke', '#ff7043')
    .attr('stroke-opacity', d => 0.16 + 0.34 * (d.count / maxLinkCount))
    .attr('stroke-width', d => 0.8 + Math.sqrt(d.count) * 0.9)
    .attr('marker-end', 'url(#scc-cross-arrow)');

  edgeLayer.selectAll('text')
    .data(displayedLinks.filter(d => d.count >= 3).slice(0, 12))
    .join('text')
    .attr('x', d => (d.source.x + d.target.x) / 2)
    .attr('y', d => (d.source.y + d.target.y) / 2)
    .attr('fill', 'rgba(255,176,120,0.72)')
    .attr('font-size', '8px')
    .attr('text-anchor', 'middle')
    .attr('paint-order', 'stroke')
    .attr('stroke', '#001018')
    .attr('stroke-width', 3)
    .attr('pointer-events', 'none')
    .text(d => d.count);

  const nodeG = svg.append('g').selectAll('g')
    .data(nodes)
    .join('g')
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('cursor', d => d.size === 1 ? 'pointer' : 'default')
    .on('click', (e, d) => { if (d.size === 1) showInfo(d.nodes[0]); });

  nodeG.filter(d => d.bridgeCount > 0)
    .append('circle')
    .attr('r', d => sccComponentRadius(d) + 6)
    .attr('fill', 'rgba(255,112,67,0.08)')
    .attr('stroke', '#ff7043')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3,2')
    .attr('opacity', 0.8);

  nodeG.append('circle')
    .attr('r', d => sccComponentRadius(d))
    .attr('fill', d => d.isNonTrivial ? d.color : (d.isBasal ? '#4caf50' : '#5b9bd5'))
    .attr('fill-opacity', d => d.isNonTrivial ? 0.24 : 0.92)
    .attr('stroke', d => d.bridgeCount > 0 ? '#ff7043' : d.color)
    .attr('stroke-width', d => d.isNonTrivial ? 2.2 : 1.3);

  nodeG.filter(d => d.isNonTrivial)
    .append('circle')
    .attr('r', d => sccComponentRadius(d) - 7)
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-opacity', 0.38)
    .attr('stroke-width', 1);

  const memberDots = nodeG.filter(d => d.isNonTrivial)
    .selectAll('circle.member-dot')
    .data(d => d.nodes.map((id, i) => ({ id, i, total: d.nodes.length, parent: d })))
    .join('circle')
    .attr('class', 'member-dot')
    .attr('r', 3.2)
    .attr('cx', d => Math.cos(-Math.PI / 2 + (Math.PI * 2 * d.i) / d.total) * (sccComponentRadius(d.parent) - 13))
    .attr('cy', d => Math.sin(-Math.PI / 2 + (Math.PI * 2 * d.i) / d.total) * (sccComponentRadius(d.parent) - 13))
    .attr('fill', d => bridgeSet.has(d.id) ? '#ff7043' : d.parent.color)
    .attr('stroke', '#001018')
    .attr('stroke-width', 1);
  memberDots.append('title')
    .text(d => SPECIES_NAMES[d.id]);

  const bridgeBadge = nodeG.filter(d => d.bridgeCount > 0)
    .append('g')
    .attr('transform', d => {
      const r = sccComponentRadius(d);
      return `translate(${r - 1},${-r - 3})`;
    })
    .attr('pointer-events', 'none');
  bridgeBadge.append('circle')
    .attr('r', 6)
    .attr('fill', '#ff7043')
    .attr('stroke', '#001018')
    .attr('stroke-width', 1);
  bridgeBadge.append('text')
    .attr('dy', '0.32em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#001018')
    .attr('font-size', '7px')
    .attr('font-weight', 800)
    .text('B');

  nodeG.append('text')
    .attr('dy', d => d.isNonTrivial ? -4 : -(sccComponentRadius(d) + 5))
    .attr('text-anchor', 'middle')
    .attr('fill', d => d.isNonTrivial ? d.color : 'rgba(207,230,242,0.74)')
    .attr('font-size', d => d.isNonTrivial ? '12px' : '8px')
    .attr('font-weight', d => d.isNonTrivial ? 800 : 600)
    .attr('paint-order', 'stroke')
    .attr('stroke', '#001018')
    .attr('stroke-width', 3)
    .attr('pointer-events', 'none')
    .text(d => {
      if (d.isNonTrivial) return d.label;
      const onlyNode = d.nodes[0];
      if (topBridgeNodeIds.has(onlyNode) || d.isBasal) return shortName(SPECIES_NAMES[onlyNode]);
      return '';
    });

  nodeG.filter(d => d.isNonTrivial)
    .append('text')
    .attr('dy', 11)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(207,230,242,0.72)')
    .attr('font-size', '9px')
    .attr('font-weight', 600)
    .attr('paint-order', 'stroke')
    .attr('stroke', '#001018')
    .attr('stroke-width', 3)
    .attr('pointer-events', 'none')
    .text(d => `${d.size}종 · B ${d.bridgeCount}`);

  nodeG.append('title')
    .text(d => {
      const members = d.nodes.map(id => SPECIES_NAMES[id]).join('\n');
      const bridgeText = d.bridgeCount > 0 ? `\nBridge nodes: ${d.bridgeCount}` : '';
      return `${d.label} (${d.size}종)${bridgeText}\n${members}`;
    });
}
