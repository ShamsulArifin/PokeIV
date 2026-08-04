function CounterRow({ c, rank }) {
  const [poke, setPoke] = React.useState(null);
  React.useEffect(() => { fetchPoke(c.name).then(setPoke).catch(() => {}); }, [c.name]);

  const effLabel = c.eff >= 3.9 ? '4×' : c.eff >= 2.5 ? '2.56×' : c.eff >= 1.95 ? '2×' : '1.6×';
  const effColor = c.eff >= 3.9 ? '#f87171' : c.eff >= 2.5 ? '#fb923c' : c.eff >= 1.95 ? '#fbbf24' : '#a3e635';
  const sprite   = poke?.sprites?.other?.home?.front_default || poke?.sprites?.front_default || '';

  return (
    <div className="card3 fade-in" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, color: 'var(--dim)', width: 18, textAlign: 'right', flexShrink: 0 }}>#{rank}</span>
      <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {poke
          ? <img src={sprite} width="40" height="40" style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.5))' }} alt={c.name} />
          : <Spinner size="sm" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtName(c.name)}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
          {c.types.map(t => <TypeBadge key={t} type={t} />)}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: effColor, marginBottom: 3 }}>{effLabel}</div>
        <TypeBadge type={c.bestMoveType} />
      </div>
    </div>
  );
}

function RaidCounters({ poke }) {
  const types    = poke?.types?.map(t => t.type.name) || [];
  const counters = React.useMemo(() => scoredCounters(types), [types.join(',')]);

  if (!poke) return null;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Defender types */}
      <div className="card3" style={{ padding: '12px 14px', borderColor: 'rgba(91,94,244,.25)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 }}>Defending types</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {types.map(t => <TypeBadge key={t} type={t} lg />)}
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>
        Top {counters.length} Counters
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {counters.length === 0
          ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>No strong counters found.</div>
          : counters.map((c, i) => <CounterRow key={c.name} c={c} rank={i + 1} />)}
      </div>

      {/* Effectiveness legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[['4×', '#f87171'], ['2.56×', '#fb923c'], ['2×', '#fbbf24'], ['1.6×', '#a3e635']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c + '55', border: `1px solid ${c}` }} />
            {l}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--dim)' }}>Based on type effectiveness of best STAB move type.</p>
    </div>
  );
}
