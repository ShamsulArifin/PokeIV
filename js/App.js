function App() {
  const [poke, setPoke]       = React.useState(null);
  const [species, setSpecies] = React.useState(null);
  const [gs, setGs]           = React.useState(null);   // GO base stats {atk,def,hp}
  const [shadow, setShadow]   = React.useState(null);   // null | 'shadow' | 'purified'
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState(null);
  const [isShiny, setIsShiny] = React.useState(false);
  const [is3D, setIs3D]       = React.useState(true);
  const [tab, setTab]         = React.useState('info');
  const [mode, setMode]       = React.useState('dex');
  const [showDex, setShowDex] = React.useState(false);

  const typeColor = poke ? (TYPE_COLORS[poke.types[0].type.name] || 'var(--accent)') : 'var(--accent)';

  // ── Load a Pokémon ───────────────────────────────────────────────────────
  const load = React.useCallback(async nameOrId => {
    setLoading(true); setError(null); setIsShiny(false);
    let api = String(nameOrId).toLowerCase(), sh = null;
    if (api.endsWith('-shadow'))   { sh = 'shadow';   api = api.replace(/-shadow$/, ''); }
    if (api.endsWith('-purified')) { sh = 'purified'; api = api.replace(/-purified$/, ''); }
    try {
      const p = await fetchPoke(api);
      setPoke(p); setShadow(sh); setTab('info'); setGs(null);

      // Fetch GO stats and species in parallel.
      // Pass formId hint for the GO stats lookup (populated by fetchList → pokemon-go-api).
      const formIdHint = api.toUpperCase().replace(/-/g, '_');
      const [sp, goStatsResult] = await Promise.all([
        fetchSpecies(p.species?.name || p.name).catch(() => null),
        resolveGoStats({ ...p, formId: formIdHint, baseName: api }),
      ]);
      setSpecies(sp);
      setGs(goStatsResult);
    } catch {
      setError(`"${nameOrId}" not found. Try a name like "pikachu" or a number.`);
      setPoke(null); setSpecies(null); setShadow(null); setGs(null);
    } finally { setLoading(false); }
  }, []);

  // Default to Mewtwo on first load
  React.useEffect(() => { load('mewtwo'); }, []);

  // ── Tab definitions (SVG icons + labels) ─────────────────────────────────
  const TABS = [
    { id: 'info',     label: 'Info',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
    { id: 'cp',       label: 'CP Calc',  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { id: 'iv',       label: 'IV Chart', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id: 'raid',     label: 'Raid IVs', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { id: 'counters', label: 'Counters', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    { id: 'evo',      label: 'Evolution',icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ background: 'var(--s1)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 16px' }}>

          {/* Mobile layout */}
          <div className="header-mobile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Pokeball size={28} />
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-.02em', flex: 1 }}>GO Dex</span>
              <button className={`btn${mode === 'dex' ? ' active-blue' : ''}`} style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setMode('dex')}>Dex</button>
              <button className={`btn${mode === 'compare' ? ' active-pink' : ''}`} style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setMode('compare')}>Compare</button>
              <button className={`btn${mode === 'today' ? ' active-blue' : ''}`} style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setMode('today')}>Today</button>
            </div>
            <SearchBar onSelect={load} />
          </div>

          {/* Desktop layout */}
          <div className="header-desktop">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Pokeball size={30} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-.02em', lineHeight: 1.1 }}>Pokémon GO</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 1 }}>Dex &amp; CP Calc</div>
              </div>
            </div>
            <div style={{ flex: 1, maxWidth: 440 }}><SearchBar onSelect={load} /></div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className={`btn${mode === 'dex' ? ' active-blue' : ''}`} onClick={() => setMode('dex')}>Dex</button>
              <button className={`btn${mode === 'compare' ? ' active-pink' : ''}`} onClick={() => setMode('compare')}>Compare</button>
              <button className={`btn${mode === 'today' ? ' active-blue' : ''}`} onClick={() => setMode('today')}>Today</button>
            </div>
          </div>

        </div>
      </header>

      {/* ── Content ───────────────────────────────────── */}
      {mode === 'today' ? (

        <TodayPanel onSelectPoke={name => { load(name); setMode('dex'); }} />

      ) : mode === 'compare' ? (

        <main style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px 32px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>Compare</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Side-by-side GO stats and max CP</p>
          </div>
          <ComparePanel isShiny={isShiny} is3D={is3D} />
        </main>

      ) : (

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 16px 32px' }}>
          <div className="layout-main">

            {/* ── Pokédex sidebar ── */}
            <div className="dex-sidebar">
              <div className="card" style={{ padding: '14px' }}>
                <button onClick={() => setShowDex(!showDex)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 0, fontFamily: 'inherit', marginBottom: showDex ? 12 : 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)' }}>Pokédex</span>
                  <span className="dex-toggle-hint-mobile" style={{ fontSize: 11, color: 'var(--muted)', padding: '3px 9px', borderRadius: 6, background: 'var(--s2)', border: '1px solid var(--border2)' }}>{showDex ? 'Hide ▲' : 'Browse ▼'}</span>
                  <span className="dex-toggle-hint-desktop" style={{ fontSize: 11, color: 'var(--dim)' }}>scroll to browse</span>
                </button>
                <div style={{ display: showDex ? 'block' : 'none' }} className="dex-always-show">
                  <DexGrid onSelect={n => { load(n); setShowDex(false); }} activeName={poke?.name} />
                </div>
              </div>
            </div>

            {/* ── Detail panel ── */}
            <div className="detail-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {loading && (
                <div className="card" style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Spinner size="lg" />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</span>
                </div>
              )}

              {error && !loading && (
                <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🙁</div>
                  <div style={{ fontWeight: 600, color: '#f87171', fontSize: 14, marginBottom: 6 }}>{error}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Try "charizard", "rayquaza", or a Pokédex number</div>
                </div>
              )}

              {poke && !loading && (<>
                <PokemonCard poke={poke} species={species} isShiny={isShiny} is3D={is3D} shadowType={shadow} gs={gs} onShiny={setIsShiny} on3D={setIs3D} />

                <div className="card" style={{ overflow: 'hidden' }}>
                  {/* Tab bar */}
                  <div className="tab-bar">
                    {TABS.map(t => (
                      <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`}
                        style={tab === t.id ? { borderBottomColor: typeColor } : {}}
                        onClick={() => setTab(t.id)}>
                        {t.icon}
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ padding: '16px 14px' }}>
                    {tab === 'info'     && <DetailPanel  poke={poke} species={species} gs={gs} />}
                    {tab === 'cp'       && <CPCalc        poke={poke} gs={gs} />}
                    {tab === 'iv'       && <IVChart       poke={poke} gs={gs} />}
                    {tab === 'raid'     && <RaidIVChart   poke={poke} gs={gs} />}
                    {tab === 'counters' && <RaidCounters  poke={poke} />}
                    {tab === 'evo'      && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 12 }}>Evolution Chain</div>
                        <EvoChain speciesName={poke.species?.name || poke.name} isShiny={isShiny} is3D={is3D} onSelect={load} activeName={poke.name} />
                      </div>
                    )}
                  </div>
                </div>
              </>)}

              {!poke && !loading && !error && (
                <div className="card" style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                  <Pokeball size={48} />
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Pokémon GO Dex</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 280, lineHeight: 1.6, margin: '0 auto' }}>Search for any Pokémon above, or tap Browse to open the Pokédex.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      )}

      <footer style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--dim)', fontSize: 11, borderTop: '1px solid var(--border)', marginTop: 4 }}>
        Data from <a href="https://pokeapi.co" target="_blank" rel="noopener" style={{ color: 'var(--accent-light)' }}>PokéAPI</a>
        {' · '}GO stats from <a href="https://pokemon-go-api.github.io/pokemon-go-api/" target="_blank" rel="noopener" style={{ color: 'var(--accent-light)' }}>pokemon-go-api</a>
        {' · '}Not affiliated with Niantic or Nintendo
      </footer>
    </div>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
