function RaidIVChart({ poke, gs }) {
  const types    = poke?.types?.map(t => t.type.name) || [];
  const weathers = React.useMemo(() => weatherForTypes(types), [types.join(',')]);

  const [encKey, setEncKey] = React.useState('raid');
  const [minCP, setMin]     = React.useState('');
  const [maxCP, setMax]     = React.useState('');
  const [ivf, setIvf]       = React.useState('all');
  const [sort, setSort]     = React.useState('iv');
  const [top, setTop]       = React.useState(50);

  const enc = ENC[encKey];

  const allRows = React.useMemo(() => {
    if (!gs) return [];
    const rows = [];
    for (let a = 15; a >= enc.fl; a--)
      for (let d = 15; d >= enc.fl; d--)
        for (let h = 15; h >= enc.fl; h--)
          rows.push({ a, d, h, cpN: calcCP(gs.atk, gs.def, gs.hp, a, d, h, enc.lv), cpB: enc.boosted ? calcCP(gs.atk, gs.def, gs.hp, a, d, h, enc.blv) : null, hpN: calcHP(gs.hp, h, enc.lv), pct: ivPct(a, d, h) });
    return rows;
  }, [gs, encKey]);

  const rows = React.useMemo(() => {
    let r = allRows;
    const lo = parseInt(minCP) || 0, hi = parseInt(maxCP) || Infinity;
    if (lo || hi < Infinity) r = r.filter(x => (enc.boosted ? [x.cpN, x.cpB] : [x.cpN]).some(v => v >= lo && v <= hi));
    if      (ivf === 'hundo') r = r.filter(x => x.a === 15 && x.d === 15 && x.h === 15);
    else if (ivf === 'lucky') r = r.filter(x => x.a >= 12 && x.d >= 12 && x.h >= 12);
    else if (ivf === '98')    r = r.filter(x => x.pct >= 98);
    const km = { iv: 'pct', cp: 'cpN', atk: 'a', def: 'd', hp: 'h' };
    r = [...r].sort((a, b) => b[km[sort] || 'pct'] - a[km[sort] || 'pct']);
    return r.slice(0, top);
  }, [allRows, minCP, maxCP, ivf, sort, top]);

  const ivStyle = p => p === 100 ? '#fbbf24' : p >= 98 ? '#4ade80' : p >= 93 ? '#60a5fa' : p >= 82 ? '#a78bfa' : 'var(--muted)';
  const ivBg    = p => p === 100 ? 'rgba(251,191,36,.12)' : p >= 98 ? 'rgba(74,222,128,.08)' : p >= 93 ? 'rgba(96,165,250,.08)' : p >= 82 ? 'rgba(167,139,250,.06)' : '';
  const hundoN  = gs ? calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, enc.lv) : 0;
  const hundoB  = gs && enc.boosted ? calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, enc.blv) : 0;

  if (!poke) return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>Select a Pokémon first</div>;
  if (!gs)   return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Encounter type selector */}
      <div className="card2" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 8 }}>Encounter Type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(ENC).map(([k, e]) => (
            <button key={k} className={`btn${encKey === k ? ' active-blue' : ''}`} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => { setEncKey(k); setTop(50); }}>{e.label}</button>
          ))}
        </div>
      </div>

      {/* Hundo CP reference cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="card2" style={{ padding: '12px', textAlign: 'center', borderColor: 'rgba(251,191,36,.25)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>⭐ Hundo · Lv{enc.lv}</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{hundoN.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>15/15/15</div>
        </div>
        {enc.boosted ? (
          <div className="card2" style={{ padding: '12px', textAlign: 'center', borderColor: 'rgba(91,94,244,.3)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 4 }}>🌤 Boosted · Lv{enc.blv}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{hundoB.toLocaleString()}</div>
            {weathers.length > 0 && <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{weathers.join(' · ')}</div>}
          </div>
        ) : (
          <div className="card2" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>IV Floor</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{enc.fl}/{enc.fl}/{enc.fl}</div>
            <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>Catch Lv{enc.lv}</div>
          </div>
        )}
      </div>

      {/* Weather boost info */}
      {enc.boosted && weathers.length > 0 && (
        <div className="card3" style={{ padding: '10px 12px', borderColor: 'rgba(56,189,248,.2)', background: 'rgba(56,189,248,.05)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>Weather boost active:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {weathers.map((w, i) => (
              <span key={i} style={{ fontSize: 11, color: '#7dd3fc', background: 'rgba(56,189,248,.1)', padding: '3px 8px', borderRadius: 8 }}>{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Info strip */}
      <div style={{ fontSize: 11, color: 'var(--dim)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>Floor: <strong style={{ color: 'var(--text)' }}>{enc.fl}/{enc.fl}/{enc.fl}</strong></span>
        <span>Level: <strong style={{ color: 'var(--text)' }}>{enc.lv}{enc.boosted ? ` / ${enc.blv} boosted` : ''}</strong></span>
        <span>{allRows.length.toLocaleString()} combos</span>
      </div>

      {/* CP range filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="inp" type="number" value={minCP} onChange={e => setMin(e.target.value)} placeholder="Min CP" style={{ flex: 1, minWidth: 0, maxWidth: 110 }} />
        <span style={{ color: 'var(--dim)' }}>–</span>
        <input className="inp" type="number" value={maxCP} onChange={e => setMax(e.target.value)} placeholder="Max CP" style={{ flex: 1, minWidth: 0, maxWidth: 110 }} />
        {(minCP || maxCP) && <button className="btn" style={{ padding: '7px 10px', fontSize: 12 }} onClick={() => { setMin(''); setMax(''); }}>✕</button>}
        <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 'auto' }}>{rows.length} results</span>
      </div>

      {/* IV filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[['All', 'all', 'var(--muted)'], ['⭐ Hundo', 'hundo', '#fbbf24'], ['Lucky (12+)', 'lucky', '#4ade80'], ['≥98%', '98', '#60a5fa']].map(([l, v, c]) => (
          <button key={v} onClick={() => setIvf(v)}
            style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${ivf === v ? c : 'var(--border2)'}`, background: ivf === v ? c + '22' : 'transparent', color: ivf === v ? c : 'var(--muted)', transition: 'all .15s' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--dim)' }}>Sort</span>
        {[['IV%', 'iv'], ['CP', 'cp'], ['ATK', 'atk'], ['DEF', 'def'], ['HP', 'hp']].map(([l, v]) => (
          <button key={v} className={`btn${sort === v ? ' active-blue' : ''}`} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setSort(v)}>{l}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card2" style={{ overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="tbl" style={{ fontSize: 12, minWidth: enc.boosted ? 360 : 300 }}>
            <thead>
              <tr style={{ background: 'var(--s3)' }}>
                <th style={{ padding: '8px', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>#</th>
                <th style={{ padding: '8px', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>IV%</th>
                <th style={{ padding: '8px', fontWeight: 600, color: '#f87171', fontSize: 11 }}>ATK</th>
                <th style={{ padding: '8px', fontWeight: 600, color: '#60a5fa', fontSize: 11 }}>DEF</th>
                <th style={{ padding: '8px', fontWeight: 600, color: '#4ade80', fontSize: 11 }}>HP</th>
                <th style={{ padding: '8px', fontWeight: 600, color: 'var(--text)', fontSize: 11 }}>CP (Lv{enc.lv})</th>
                {enc.boosted && <th style={{ padding: '8px', fontWeight: 600, color: 'var(--accent-light)', fontSize: 11 }}>CP (Lv{enc.blv} 🌤)</th>}
                <th style={{ padding: '8px', fontWeight: 600, color: '#4ade80', fontSize: 11 }}>HP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.a}-${row.d}-${row.h}`} style={{ borderTop: '1px solid var(--border)', background: ivBg(row.pct) }}>
                  <td style={{ padding: '6px 8px', color: 'var(--dim)' }}>{i + 1}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: ivStyle(row.pct) }}>{row.a === 15 && row.d === 15 && row.h === 15 ? '⭐' : ''}{row.pct}%</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: row.a === 15 ? '#f87171' : row.a >= 13 ? '#fca5a5' : 'var(--muted)' }}>{row.a}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: row.d === 15 ? '#60a5fa' : row.d >= 13 ? '#93c5fd' : 'var(--muted)' }}>{row.d}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: row.h === 15 ? '#4ade80' : row.h >= 13 ? '#86efac' : 'var(--muted)' }}>{row.h}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--text)' }}>{row.cpN.toLocaleString()}</td>
                  {enc.boosted && <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--accent-light)' }}>{row.cpB?.toLocaleString()}</td>}
                  <td style={{ padding: '6px 8px', color: '#4ade80', fontWeight: 600 }}>{row.hpN}</td>
                </tr>
              ))}
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
