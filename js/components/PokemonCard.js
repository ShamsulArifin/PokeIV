function PokemonCard({ poke, species, isShiny, is3D, shadowType, onShiny, on3D }) {
  const gs          = goStats(poke);
  const types       = poke.types.map(t => t.type.name);
  const tc          = TYPE_COLORS[types[0]] || 'var(--accent)';
  const shadowColor = shadowType === 'shadow' ? '#7c3aed' : shadowType === 'purified' ? '#0891b2' : null;
  const dispAtk     = shadowType === 'shadow' ? Math.round(gs.atk * 1.2) : gs.atk;
  const dispDef     = shadowType === 'shadow' ? Math.round(gs.def * .8)  : gs.def;
  const maxCP       = calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 50);
  const genus       = species?.genera?.find(g => g.language.name === 'en')?.genus || '';
  const spriteFilter = shadowType === 'purified' ? 'saturate(.25) brightness(1.15)' : undefined;
  const spriteSize  = typeof window !== 'undefined' && window.innerWidth < 480 ? 120 : 156;

  return (
    <div className="card" style={{ overflow: 'hidden', border: `1px solid ${shadowColor ? shadowColor + '44' : tc + '38'}` }}>

      {/* Shadow / Purified banner */}
      {shadowColor && (
        <div style={{ padding: '8px 16px 0' }}>
          <div style={{ padding: '6px 12px', borderRadius: 8, background: shadowColor + '20', border: `1px solid ${shadowColor}38`, color: shadowColor, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{shadowType === 'shadow' ? '👻 Shadow' : '✨ Purified'}</span>
            <span style={{ fontWeight: 400, opacity: .75, fontSize: 11 }}>
              {shadowType === 'shadow' ? '×1.2 ATK / ×0.8 DEF in raids' : 'IV floor +2 when purified'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '16px 16px 4px', background: `linear-gradient(160deg,${tc}18 0%,transparent 70%)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 500, marginBottom: 2 }}>#{padId(poke.id)}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtName(poke.name)}</h2>
            {genus && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{genus}</div>}
            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
              {types.map(t => <TypeBadge key={t} type={t} lg />)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
            <Toggle value={isShiny} onChange={onShiny} label="✨ Shiny" />
            <Toggle value={is3D}    onChange={on3D}    label="🎮 3D" />
          </div>
        </div>

        {/* Sprite */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, position: 'relative' }}>
          {/* Ambient glow behind sprite */}
          <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: shadowType === 'shadow' ? `radial-gradient(circle,${shadowColor}44 0%,transparent 70%)` : tc + '28', filter: 'blur(24px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
          <div style={spriteFilter ? { filter: spriteFilter } : {}}>
            <PokemonImage poke={poke} isShiny={isShiny} is3D={is3D} shadowType={shadowType} size={spriteSize} />
          </div>
        </div>

        {isShiny && (
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,.3)' }}>✨ Shiny</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ padding: '4px 16px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
          {[['Attack', dispAtk, '#f87171'], ['Defense', dispDef, '#60a5fa'], ['HP', gs.hp, '#4ade80']].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '8px 6px', borderRadius: 10, background: c + '14', border: `1px solid ${c}28` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: c, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 2 }}>Max CP · Lv50 · 15/15/15</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-light)', letterSpacing: '-.02em' }}>{maxCP.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
