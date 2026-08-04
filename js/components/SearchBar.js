function SearchBar({ onSelect, placeholder = 'Search by name or #…' }) {
  const [q, setQ]       = React.useState('');
  const [all, setAll]   = React.useState([]);
  const [res, setRes]   = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => { fetchList().then(setAll).catch(() => {}); }, []);

  React.useEffect(() => {
    if (!q.trim()) { setRes([]); setOpen(false); return; }
    const lq = q.toLowerCase().trim();
    const f = all.filter(p =>
      p.name.includes(lq) || p.dn.toLowerCase().includes(lq) || String(p.id).startsWith(lq)
    ).slice(0, 14);
    setRes(f);
    setOpen(f.length > 0);
  }, [q, all]);

  React.useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick   = p => { setQ(''); setOpen(false); onSelect(p.name); };
  const submit = e => { e.preventDefault(); if (q.trim()) { onSelect(q.trim().toLowerCase()); setQ(''); setOpen(false); } };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={submit} style={{ position: 'relative' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input className="inp" value={q} onChange={e => setQ(e.target.value)}
          onFocus={() => res.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{ paddingLeft: 36, paddingRight: 12 }} />
      </form>

      {open && (
        <div className="search-dd fade-in">
          {res.map(p => (
            <button key={p.name} onClick={() => pick(p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              {/* Sprite thumbnail */}
              <div style={{
                position: 'relative', width: 32, height: 32, flexShrink: 0,
                background: p.shadowType === 'shadow' ? 'rgba(88,28,235,.25)' : p.shadowType === 'purified' ? 'rgba(8,145,178,.15)' : 'var(--s3)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: p.shadowType === 'shadow' ? '0 0 8px rgba(124,58,237,.5)' : 'none',
              }}>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.sid || p.id}.png`}
                  width="28" height="28"
                  style={{ objectFit: 'contain', filter: p.shadowType === 'purified' ? 'saturate(.25) brightness(1.1)' : '' }}
                  alt="" />
              </div>
              {/* Name + tag */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.dn}</div>
                {p.tag && <div style={{ fontSize: 11, fontWeight: 600, color: p.tag.c, marginTop: 1 }}>{p.tag.tag}</div>}
              </div>
              <span style={{ color: 'var(--dim)', fontSize: 11, flexShrink: 0 }}>#{padId(p.id)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
