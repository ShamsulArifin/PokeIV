function DexGrid({ onSelect, activeName }) {
  const [all, setAll]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');
  const [gen, setGen]       = React.useState('all');
  const [form, setForm]     = React.useState('all');
  const [page, setPage]     = React.useState(0);
  const PER = 48;

  React.useEffect(() => {
    fetchList().then(l => { setAll(l); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = React.useMemo(() => {
    let l = all;
    if (filter.trim()) {
      const lq = filter.toLowerCase().trim();
      l = l.filter(p => p.name.includes(lq) || p.dn.toLowerCase().includes(lq) || String(p.id).startsWith(lq));
    }
    if (gen !== 'all') {
      const g = GENS.find(x => x.label === gen);
      if (g) l = l.filter(p => p.id >= g.min && p.id <= g.max);
    }
    if      (form === 'base')     l = l.filter(p => !p.virtual && !p.tag);
    else if (form === 'shadow')   l = l.filter(p => p.shadowType === 'shadow');
    else if (form === 'purified') l = l.filter(p => p.shadowType === 'purified');
    else if (form === 'alolan')   l = l.filter(p => p.name.includes('-alola'));
    else if (form === 'galarian') l = l.filter(p => p.name.includes('-galar'));
    else if (form === 'hisuian')  l = l.filter(p => p.name.includes('-hisui'));
    else if (form === 'mega')     l = l.filter(p => p.name.includes('-mega') || p.name.includes('-primal'));
    else if (form === 'forms')    l = l.filter(p => p.tag && !p.virtual);
    return l;
  }, [all, filter, gen, form]);

  React.useEffect(() => setPage(0), [filter, gen, form]);

  const pages   = Math.ceil(filtered.length / PER);
  const visible = filtered.slice(page * PER, (page + 1) * PER);

  const formBtns = [
    { id: 'all',      l: 'All' },
    { id: 'base',     l: 'Base' },
    { id: 'alolan',   l: 'Alolan',   c: '#d97706' },
    { id: 'galarian', l: 'Galarian',  c: '#db2777' },
    { id: 'hisuian',  l: 'Hisuian',   c: '#65a30d' },
    { id: 'mega',     l: 'Mega',      c: '#4f46e5' },
    { id: 'forms',    l: 'Forms',     c: '#7c3aed' },
    { id: 'shadow',   l: 'Shadow',    c: '#7c3aed' },
    { id: 'purified', l: 'Purified',  c: '#0891b2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Filter input */}
      <div style={{ position: 'relative' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input className="inp" value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter…"
          style={{ paddingLeft: 30, paddingRight: filter ? 28 : 12, fontSize: 13 }} />
        {filter && (
          <button onClick={() => setFilter('')}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 }}>✕</button>
        )}
      </div>

      {/* Generation tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <button className={`btn${gen === 'all' ? ' active-blue' : ''}`} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => setGen('all')}>All</button>
        {GENS.map(g => (
          <button key={g.label} className={`btn${gen === g.label ? ' active-blue' : ''}`} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => setGen(g.label)}>{g.label}</button>
        ))}
      </div>

      {/* Form filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {formBtns.map(f => (
          <button key={f.id} onClick={() => setForm(f.id)}
            style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${form === f.id ? (f.c || 'var(--accent)') : 'var(--border2)'}`, background: form === f.id ? (f.c || 'var(--accent)') + '22' : 'transparent', color: form === f.id ? (f.c || 'var(--accent-light)') : 'var(--muted)', transition: 'all .15s' }}>
            {f.l}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--dim)' }}>{filtered.length.toLocaleString()} Pokémon</div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
      ) : (
        <>
          <div className="dex-grid" style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 2 }}>
            {visible.map(p => (
              <button key={p.name} onClick={() => onSelect(p.name)}
                className={`dex-card${activeName === p.name ? ' sel' : ''}`}>
                <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={p.goImg || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.sid || p.id}.png`}
                    onError={e => { if (p.goImg && e.target.src !== `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`) e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`; }}
                    width="48" height="48" loading="lazy" alt={p.dn}
                    style={{ objectFit: 'contain', filter: p.shadowType === 'purified' ? 'saturate(.25) brightness(1.1)' : '' }} />
                  {p.shadowType === 'shadow' && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'linear-gradient(150deg,rgba(88,28,235,.38) 0%,rgba(109,40,217,.22) 55%,transparent 100%)', pointerEvents: 'none' }} />
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3, textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%' }}>{p.dn}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--dim)' }}>#{padId(p.id)}</span>
                  {p.tag && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10, background: p.tag.c + '28', color: p.tag.c }}>{p.tag.tag}</span>
                  )}
                </div>
              </button>
            ))}
            {visible.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: 32, textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>No Pokémon found</div>
            )}
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <button className="btn" style={{ padding: '5px 12px', fontSize: 12 }} disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Prev</button>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{page + 1} / {pages}</span>
              <button className="btn" style={{ padding: '5px 12px', fontSize: 12 }} disabled={page === pages - 1} onClick={() => setPage(p => Math.min(pages - 1, p + 1))}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
