function CPCalc({ poke, gs }) {
  const [tab, setTab]   = React.useState('calc');
  const [lv, setLv]     = React.useState(40);
  const [aIV, setAIV]   = React.useState(15);
  const [dIV, setDIV]   = React.useState(15);
  const [hIV, setHIV]   = React.useState(15);
  const [cpIn, setCpIn] = React.useState('');
  const [lvIn, setLvIn] = React.useState('');
  const [res, setRes]   = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  // Reset results when Pokémon or stats change
  React.useEffect(() => { setRes(null); setCpIn(''); setLvIn(''); }, [poke?.id]);

  const cp    = React.useMemo(() => gs ? calcCP(gs.atk, gs.def, gs.hp, aIV, dIV, hIV, lv) : null, [gs, lv, aIV, dIV, hIV]);
  const hp    = React.useMemo(() => gs ? calcHP(gs.hp, hIV, lv) : null, [gs, hIV, lv]);
  const maxCP = React.useMemo(() => gs ? calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 50) : null, [gs]);
  const pct   = (maxCP && cp) ? Math.min(100, (cp / maxCP) * 100) : 0;

  const ivColour = p => p === 100 ? '#fbbf24' : p >= 98 ? '#4ade80' : p >= 93 ? '#60a5fa' : p >= 82 ? '#a78bfa' : 'var(--muted)';

  const doLookup = () => {
    const t = parseInt(cpIn);
    if (!gs || !t || t < 10) return;
    setBusy(true); setRes(null);
    setTimeout(() => {
      let r = reverseLookup(gs, t, {
        pinLevel: lvIn ? parseFloat(lvIn) : null,
      });
      r.sort((a, b) => b.pct - a.pct || b.lv - a.lv);
      setRes(r); setBusy(false);
    }, 10);
  };

  if (!poke) return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>Select a Pokémon first</div>
  );

  if (!gs) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
  );

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Mode toggle */}
      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border2)' }}>
        {[['calc', '⚡ Calculate'], ['lookup', '🔍 CP → IVs']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', border: 'none', cursor: 'pointer', transition: 'background .15s, color .15s', background: tab === id ? 'var(--s3)' : 'transparent', color: tab === id ? 'var(--text)' : 'var(--muted)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Calculate mode ── */}
      {tab === 'calc' && (<>
        <div className="card2" style={{ padding: '20px 16px', textAlign: 'center', borderColor: 'rgba(99,102,241,.25)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>Combat Power</div>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em', color: 'var(--text)' }}>{cp?.toLocaleString()}</div>
          <div style={{ height: 5, borderRadius: 99, background: 'var(--s3)', margin: '12px auto', maxWidth: 240, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,var(--accent),#a78bfa)', width: `${pct}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>{pct.toFixed(1)}% of max {maxCP?.toLocaleString()}</div>
        </div>

        {/* Effective stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[['Attack', gs.atk + aIV, '#f87171'], ['Defense', gs.def + dIV, '#60a5fa'], ['HP', hp, '#4ade80']].map(([l, v, c]) => (
            <div key={l} className="card3" style={{ padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: c, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{v}</div>
            </div>
          ))}
        </div>

        <RangeSlider label="Level" value={lv} onChange={setLv} min={1} max={51} step={0.5} color="var(--accent)" showNum />
        <IVSlider label="Attack IV"  value={aIV} onChange={setAIV} color="#f87171" />
        <IVSlider label="Defense IV" value={dIV} onChange={setDIV} color="#60a5fa" />
        <IVSlider label="HP IV"      value={hIV} onChange={setHIV} color="#4ade80" />

        {/* GO base stats reference */}
        <div className="card3" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--dim)', marginBottom: 6 }}>GO Base Stats</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
            <span>ATK <strong style={{ color: '#f87171' }}>{gs.atk}</strong></span>
            <span>DEF <strong style={{ color: '#60a5fa' }}>{gs.def}</strong></span>
            <span>STA <strong style={{ color: '#4ade80' }}>{gs.hp}</strong></span>
          </div>
        </div>
      </>)}

      {/* ── CP → IVs lookup mode ── */}
      {tab === 'lookup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Enter the CP you observed to find every IV combination that produces it.
          </p>

          <div className="card2" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>CP Value</label>
                <input className="inp" type="number" value={cpIn} onChange={e => setCpIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLookup()} placeholder="e.g. 2387" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Level (optional — pins the search)</label>
                <input className="inp" type="number" value={lvIn} onChange={e => setLvIn(e.target.value)} placeholder="e.g. 20 for raid, 25 for weather" min="1" max="51" step="0.5" />
              </div>
            </div>
            <button className="btn primary" onClick={doLookup} disabled={!cpIn || busy}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}>
              {busy ? 'Searching…' : 'Find IV Combinations'}
            </button>
          </div>

          {busy && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>}

          {res !== null && !busy && (
            <div className="card2" style={{ overflow: 'hidden' }}>
              {res.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No combinations found for CP {cpIn}{lvIn ? ` at level ${lvIn}` : ''}.<br />
                  <span style={{ fontSize: 12, color: 'var(--dim)' }}>Try removing the level filter, or check that the CP is correct.</span>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--s3)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>CP {cpIn} → {res.length} result{res.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>by IV%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="tbl" style={{ fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--s3)' }}>
                          {['Lv', 'IV%', 'ATK', 'DEF', 'HP', 'HP (in-game)'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {res.map((r, i) => {
                          const isH = r.a === 15 && r.d === 15 && r.h === 15;
                          return (
                            <tr key={i} style={{ borderTop: '1px solid var(--border)', background: isH ? 'rgba(251,191,36,.07)' : '' }}>
                              <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--muted)' }}>{r.lv}</td>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: ivColour(r.pct) }}>{isH ? '⭐' : ''}{r.pct}%</td>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: r.a === 15 ? '#f87171' : r.a >= 13 ? '#fca5a5' : 'var(--muted)' }}>{r.a}</td>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: r.d === 15 ? '#60a5fa' : r.d >= 13 ? '#93c5fd' : 'var(--muted)' }}>{r.d}</td>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: r.h === 15 ? '#4ade80' : r.h >= 13 ? '#86efac' : 'var(--muted)' }}>{r.h}</td>
                              <td style={{ padding: '7px 10px', color: '#4ade80', fontWeight: 600 }}>{calcHP(gs.hp, r.h, r.lv)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
