// ── EvoNode ───────────────────────────────────────────────────────────────
function EvoNode({ name, isShiny, is3D, onSelect, isActive }) {
  const [poke, setPoke] = React.useState(null);
  React.useEffect(() => { fetchPoke(name).then(setPoke).catch(() => {}); }, [name]);

  return (
    <button onClick={() => onSelect(name)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 6px', borderRadius: 10, border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`, background: isActive ? 'rgba(91,94,244,.1)' : 'transparent', cursor: 'pointer', transition: 'all .15s', minWidth: 64 }}
      onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--s2)')}
      onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}>
      {poke
        ? <PokemonImage poke={poke} isShiny={isShiny} is3D={is3D} size={56} />
        : <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="sm" /></div>}
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', maxWidth: 68, textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-word' }}>{cap(name)}</span>
      {poke && <span style={{ fontSize: 10, color: 'var(--dim)' }}>#{padId(poke.id)}</span>}
    </button>
  );
}

// ── EvoArrow ──────────────────────────────────────────────────────────────
function EvoArrow({ detail }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4px', minWidth: 44, flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      {detail && <span style={{ fontSize: 10, color: 'var(--dim)', textAlign: 'center', marginTop: 2, maxWidth: 44, lineHeight: 1.3 }}>{detail}</span>}
    </div>
  );
}

// ── parseEvo ──────────────────────────────────────────────────────────────
function parseEvo(chain) {
  const stages = [];
  const walk = (node, s) => {
    if (!stages[s]) stages[s] = [];
    const det = node.evolution_details?.[0];
    let req = '';
    if (det) {
      if      (det.min_level)               req = `Lv.${det.min_level}`;
      else if (det.item)                    req = cap(det.item.name.replace(/-/g, ' '));
      else if (det.held_item)               req = cap(det.held_item.name.replace(/-/g, ' '));
      else if (det.trigger?.name === 'trade') req = 'Trade';
      else if (det.min_happiness)           req = `Happy(${det.min_happiness})`;
      else                                  req = cap((det.trigger?.name || '').replace(/-/g, ' '));
    }
    stages[s].push({ name: node.species.name, req });
    node.evolves_to.forEach(n => walk(n, s + 1));
  };
  walk(chain, 0);
  return stages;
}

// ── EvoChain ──────────────────────────────────────────────────────────────
function EvoChain({ speciesName, isShiny, is3D, onSelect, activeName }) {
  const [stages, setStages]   = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!speciesName) return;
    setLoading(true); setStages(null);
    fetchSpecies(speciesName)
      .then(sp => sp ? fetchEvoChain(sp.evolution_chain.url) : null)
      .then(chain => { if (chain) setStages(parseEvo(chain.chain)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [speciesName]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>;
  if (!stages)  return null;
  if (stages.length <= 1 && stages[0]?.length <= 1)
    return <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>No evolutions</div>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', overflowX: 'auto' }}>
      {stages.map((stage, si) => (
        <React.Fragment key={si}>
          {si > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {stage.some(n => n.req)
                ? stage.map(n => n.req && <EvoArrow key={n.name} detail={n.req} />)
                : <EvoArrow detail="" />}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stage.map(n => (
              <EvoNode key={n.name} name={n.name} isShiny={isShiny} is3D={is3D} onSelect={onSelect} isActive={n.name === activeName} />
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
