// ── View Toggle ───────────────────────────────────────────────────────────
function showView(v) {
  const mainEl     = document.getElementById('main-view');
  const cmpEl      = document.getElementById('compare-view');
  const analysisEl = document.getElementById('analysis-view');
  const navM   = document.getElementById('nav-main');
  const navC   = document.getElementById('nav-compare');
  const navA   = document.getElementById('nav-analysis');
  const active   = 'flex items-center gap-base px-gutter py-base bg-surface-container-highest text-primary border-l-4 border-primary';
  const inactive = 'flex items-center gap-base px-gutter py-base text-on-surface-variant hover:bg-surface-container-high transition-colors';

  mainEl.classList.add('hidden');
  cmpEl.classList.add('hidden');
  analysisEl.classList.add('hidden');
  navM.className = inactive; navC.className = inactive; navA.className = inactive;

  if (v === 'main') {
    mainEl.classList.remove('hidden'); navM.className = active;
  } else if (v === 'compare') {
    cmpEl.classList.remove('hidden'); navC.className = active;
    initComparison();
  } else if (v === 'analysis') {
    analysisEl.classList.remove('hidden'); navA.className = active;
    initSccAnalysis();
  }
}
