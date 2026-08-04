function DetailPanel({ poke, species }) {
  const gs = goStats(poke);
  const types = poke.types.map(t => t.type.name);
  const { weak, resist, immune } = typeWeaknesses(types);
  const flavor = species?.flavor_text_entries?.find(f => f.language.name === 'en')?.flavor_text?.replace(/\f|\n/g, ' ') || '';
  const S = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 8, display: 'block' };

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {flavor && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, fontStyle: 'italic' }}>"{flavor}"</p>}

      {/* Height / Weight */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['Height', `${(poke.height / 10).toFixed(1)} m`], ['Weight', `${(poke.weight / 10).toFixed(1)} kg`]].map(([l, v]) => (
          <div key={l} className="card2" style={{ padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, fontWeight: 500 }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* GO Stats */}
      <div className="card2" style={{ padding: '14px 16px' }}>
        <span style={S}>Pokémon GO Stats</span>
        <StatBar label="Attack"  value={gs.atk} max={300} auto />
        <StatBar label="Defense" value={gs.def} max={300} auto />
        <StatBar label="HP"      value={gs.hp}  max={500} auto />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {[['Attack', gs.atk, '#f87171'], ['Defense', gs.def, '#60a5fa'], ['HP', gs.hp, '#4ade80']].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: c + '14', border: `1px solid ${c}28` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: c, marginBottom: 1 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type match-ups */}
      <div className="card2" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={S}>Type Match-Ups</span>

        {weak.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f87171', marginBottom: 6 }}>Weak Against</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {weak.map(({ t, m }) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TypeBadge type={t} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>{m}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {resist.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 6 }}>Resistant To</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {resist.map(({ t, m }) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TypeBadge type={t} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>{m}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {immune.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Immune To</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {immune.map(({ t }) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TypeBadge type={t} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>0×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
