function ComparePanel({ isShiny, is3D }) {
  const [pokeA, setPokeA] = React.useState(null);
  const [pokeB, setPokeB] = React.useState(null);
  const [gsA,   setGsA]   = React.useState(null);
  const [gsB,   setGsB]   = React.useState(null);
  const [ldA,   setLdA]   = React.useState(false);
  const [ldB,   setLdB]   = React.useState(false);

  const loadPoke = async (name, setPoke, setGs, setLd) => {
    setLd(true); setPoke(null); setGs(null);
    try {
      let api = name.toLowerCase();
      const p = await fetchPoke(api);
      setPoke(p);
      const formIdHint = api.toUpperCase().replace(/-/g, '_');
      const s = await resolveGoStats({ ...p, formId: formIdHint, baseName: api });
      setGs(s);
    } catch {
      setPoke(null); setGs(null);
    } finally { setLd(false); }
  };

  const sA   = gsA;
  const sB   = gsB;
  const maxA = sA ? calcCP(sA.atk, sA.def, sA.hp, 15, 15, 15, 50) : 0;
  const maxB = sB ? calcCP(sB.atk, sB.def, sB.hp, 15, 15, 15, 50) : 0;

  // Render a mirrored stat bar for one comparison row
  const bar = (vA, vB, label) => {
    const mx = Math.max(vA || 0, vB || 0, 1);
    const pA = ((vA || 0) / mx) * 100;
    const pB = ((vB || 0) / mx) * 100;
    const w  = vA > vB ? 'A' : vA < vB ? 'B' : null;
    return (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, width: 32, textAlign: 'right', color: w === 'A' ? '#818cf8' : 'var(--dim)', flexShrink: 0 }}>{(vA || 0).toLocaleString()}</span>
        <div style={{ flex: 1, display: 'flex', gap: 3, minWidth: 0, alignItems: 'center' }}>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--s3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, marginLeft: 'auto', width: `${pA}%`, background: w === 'A' ? 'var(--accent)' : 'var(--s3)', transition: 'width .6s' }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--dim)', width: 52, textAlign: 'center', flexShrink: 0, lineHeight: 1.2 }}>{label}</span>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--s3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${pB}%`, background: w === 'B' ? '#db2777' : 'var(--s3)', transition: 'width .6s' }} />
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, width: 32, color: w === 'B' ? '#f472b6' : 'var(--dim)', flexShrink: 0 }}>{(vB || 0).toLocaleString()}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* A/B selector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { poke: pokeA, setPoke: setPokeA, setGs: setGsA, ld: ldA, setLd: setLdA, stats: sA, maxCP: maxA, slot: 'A' },
          { poke: pokeB, setPoke: setPokeB, setGs: setGsB, ld: ldB, setLd: setLdB, stats: sB, maxCP: maxB, slot: 'B' },
        ].map(({ poke, setPoke, setGs, ld, setLd, stats, maxCP, slot }) => (
          <div key={slot} className="card2" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SearchBar onSelect={n => loadPoke(n, setPoke, setGs, setLd)} placeholder={`Pokémon ${slot}…`} />

            {ld && <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner /></div>}

            {poke && !ld && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <PokemonImage poke={poke} isShiny={isShiny} is3D={is3D} size={88} />
                <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{fmtName(poke.name)}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>#{padId(poke.id)}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {poke.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} />)}
                </div>
                <div className="card3" style={{ width: '100%', padding: '8px', textAlign: 'center', marginTop: 2 }}>
                  <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 2 }}>Max CP (Lv50)</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-light)' }}>
                    {stats ? maxCP.toLocaleString() : <Spinner size="sm" />}
                  </div>
                </div>
              </div>
            )}

            {!poke && !ld && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', color: 'var(--dim)', gap: 6 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{ fontSize: 12 }}>Select Pokémon {slot}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stat comparison bars */}
      {pokeA && pokeB && (
        <div className="card2" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 10 }}>Stat Comparison</div>
          {bar(sA?.atk,  sB?.atk,  'Attack')}
          {bar(sA?.def,  sB?.def,  'Defense')}
          {bar(sA?.hp,   sB?.hp,   'HP')}
          {bar(maxA,     maxB,     'Max CP')}
        </div>
      )}
    </div>
  );
}
