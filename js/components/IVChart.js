function IVChart({ poke, gs }) {
  const [lv, setLv]     = React.useState(40);
  const [minCP, setMin] = React.useState('');
  const [maxCP, setMax] = React.useState('');
  const [ivf, setIvf]   = React.useState('all');
  const [sort, setSort] = React.useState('iv');
  const [top, setTop]   = React.useState(50);

  // Reset pagination when Pokémon changes
  React.useEffect(() => { setTop(50); setMin(''); setMax(''); setIvf('all'); }, [poke?.id]);

  // Build all 4096 IV rows whenever gs or level changes
  const allRows = React.useMemo(() => {
    if (!gs) return [];
    const rows = [];
    for (let a = 15; a >= 0; a--)
      for (let d = 15; d >= 0; d--)
        for (let h = 15; h >= 0; h--)
          rows.push({
            a, d, h,
            cp: calcCP(gs.atk, gs.def, gs.hp, a, d, h, lv),
            hp: calcHP(gs.hp, h, lv),
            pct: ivPct(a, d, h),
          });
    return rows;
  }, [gs, lv]);

  const rows = React.useMemo(() => {
    let r = allRows;
    const lo = parseInt(minCP) || 0, hi = parseInt(maxCP) || Infinity;
    if (lo || hi < Infinity) r = r.filter(x => x.cp >= lo && x.cp <= hi);
    if      (ivf === 'hundo') r = r.filter(x => x.a === 15 && x.d === 15 && x.h === 15);
    else if (ivf === 'lucky') r = r.filter(x => x.a >= 12 && x.d >= 12 && x.h >= 12);
    else if (ivf === '98')    r = r.filter(x => x.pct >= 98);
    else if (ivf === '82')    r = r.filter(x => x.pct >= 82);
    const km = { iv: 'pct', cp: 'cp', atk: 'a', def: 'd', hp: 'h' };
    r = [...r].sort((a, b) => b[km[sort] || 'pct'] - a[km[sort] || 'pct']);
    return r.slice(0, top);
  }, [allRows, minCP, maxCP, ivf, sort, top]);

  const maxCP50   = gs ? calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 50) : 0;
  const ivStyle   = p => p === 100 ? '#fbbf24' : p >= 98 ? '#4ade80' : p >= 93 ? '#60a5fa' : p >= 82 ? '#a78bfa' : 'var(--muted)';
  const ivBg      = p => p === 100 ? 'rgba(251,191,36,.12)' : p >= 98 ? 'rgba(74,222,128,.08)' : p >= 93 ? 'rgba(96,165,250,.08)' : p >= 82 ? 'rgba(167,139,250,.06)' : '';

  if (!poke) return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>Select a Pokémon first</div>;
  if (!gs)   return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RangeSlider label="Level" value={lv} onChange={setLv} min={1} max={51} step={0.5} color="var(--accent)" showNum />

      {/* CP range filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="inp" type="number" value={minCP} onChange={e => setMin(e.target.value)} placeholder="Min CP" style={{ flex: 1, minWidth: 0, maxWidth: 110 }} />
        <span style={{ color: 'var(--dim)', fontSize: 13 }}>–</span>
        <input className="inp" type="number" value={maxCP} onChange={e => setMax(e.target.value)} placeholder="Max CP" style={{ flex: 1, minWidth: 0, maxWidth: 110 }} />
        {(minCP || maxCP) && <button className="btn" style={{ padding: '7px 10px', fontSize: 12 }} onClick={() => { setMin(''); setMax(''); }}>✕</button>}
        <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 'auto' }}>Max: {maxCP50.toLocaleString()}</span>
      </div>

      {/* IV tier pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[['All', 'all', 'var(--muted)'], ['⭐ Hundo', 'hundo', '#fbbf24'], ['Lucky (12+)', 'lucky', '#4ade80'], ['≥98%', '98', '#60a5fa'], ['≥82%', '82', '#a78bfa']].map(([l, v, c]) => (
          <button key={v} onClick={() => setIvf(v)}
            style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${ivf === v ? c : 'var(--border2)'}`, background: ivf === v ? c + '22' : 'transparent', color: ivf === v ? c : 'var(--muted)', transition: 'all .15s' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--dim)' }}>Sort by</span>
        {[['IV%', 'iv'], ['CP', 'cp'], ['ATK', 'atk'], ['DEF', 'def'], ['HP', 'hp']].map(([l, v]) => (
          <button key={v} className={`btn${sort === v ? ' active-blue' : ''}`} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setSort(v)}>{l}</button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 'auto' }}>{rows.length} of {allRows.length.toLocaleString()}</span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[['100%', '#fbbf24'], ['98%+', '#4ade80'], ['93%+', '#60a5fa'], ['82%+', '#a78bfa'], ['Lower', 'var(--dim)']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c.startsWith('var') ? 'var(--s3)' : c + '55', border: `1px solid ${c}` }} />
            {l}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card2" style={{ overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="tbl" style={{ fontSize: 12, minWidth: 300 }}>
            <thead>
              <tr style={{ background: 'var(--s3)' }}>
                {['#', 'IV%', 'ATK', 'DEF', 'HP', 'CP', 'HP'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isH = row.a === 15 && row.d === 15 && row.h === 15;
                return (
                  <tr key={`${row.a}-${row.d}-${row.h}`} style={{ borderTop: '1px solid var(--border)', background: ivBg(row.pct) }}>
                    <td style={{ padding: '6px 10px', color: 'var(--dim)' }}>{i + 1}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: ivStyle(row.pct) }}>{isH ? '⭐' : ''}{row.pct}%</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: row.a === 15 ? '#f87171' : row.a >= 13 ? '#fca5a5' : 'var(--muted)' }}>{row.a}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: row.d === 15 ? '#60a5fa' : row.d >= 13 ? '#93c5fd' : 'var(--muted)' }}>{row.d}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: row.h === 15 ? '#4ade80' : row.h >= 13 ? '#86efac' : 'var(--muted)' }}>{row.h}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text)' }}>{row.cp.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', color: '#4ade80', fontWeight: 600 }}>{row.hp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>No results</div>}
        </div>
      </div>

      {top < allRows.length && (
        <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: 13 }} onClick={() => setTop(t => t + 100)}>
          Show more ({allRows.length - top} remaining)
        </button>
      )}
    </div>
  );
}
