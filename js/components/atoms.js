// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 20 : size === 'lg' ? 48 : 32;
  const b = size === 'sm' ? 2 : 3;
  return React.createElement('div', {
    className: 'spin',
    style: { width: s, height: s, borderRadius: '50%', border: `${b}px solid var(--s3)`, borderTopColor: 'var(--accent)' }
  });
}

// ── Pokémon GO–style type SVG icons ──────────────────────────────────────
const TYPE_SVGS = {
  // Normal — plain circle with ring
  normal: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5" fill="rgba(0,0,0,0.18)"/></svg>,

  // Fire — flame silhouette
  fire: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s-1.5 4-3.5 5.5c.2-1.8-.8-3.5-.8-3.5C5.2 6.5 4 10 4 12.5a8 8 0 0 0 16 0c0-4-3.5-7-5-8.5 0 1.5-1 3.5-3 5 1-2.5 0-7 0-7z"/></svg>,

  // Water — teardrop
  water: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 5.5 13.5a6.5 6.5 0 0 0 13 0Z"/></svg>,

  // Grass — three-leaf clover / leaf fan
  grass: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21V11"/><path d="M12 11c0-4-3.5-7-8-6.5 0 4 3 6.5 8 6.5"/><path d="M12 11c0-4 3.5-7 8-6.5 0 4-3 6.5-8 6.5"/><path d="M12 15c-1.5-2-4-3-6-2 1 2.5 3 3.5 6 3"/><path d="M12 15c1.5-2 4-3 6-2-1 2.5-3 3.5-6 3"/></svg>,

  // Electric — lightning bolt
  electric: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3.5 13.5H11l-1 8.5L20.5 10H13Z"/></svg>,

  // Ice — snowflake
  ice: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/><line x1="18.5" y1="5.5" x2="5.5" y2="18.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>,

  // Fighting — clenched fist
  fighting: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10a2 2 0 0 1 2-2h1V7a1.5 1.5 0 0 1 3 0v1h.5a1.5 1.5 0 0 1 1.5 1.5V10a1.5 1.5 0 0 1 1.5 1.5V13a5 5 0 0 1-5 5H9a5 5 0 0 1-4-2l-1-1.5a1.5 1.5 0 0 1 2.5-1.5L7 14V10z"/></svg>,

  // Poison — skull / poison bubble
  poison: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 1 6 6c0 2.2-1 3.8-2.3 5.2l.8 1.8a1 1 0 0 1-.9 1.4H8.4a1 1 0 0 1-.9-1.4l.8-1.8C7 12.8 6 11.2 6 9a6 6 0 0 1 6-6z"/><rect x="9" y="17.5" width="6" height="3.5" rx="1"/><circle cx="9.5" cy="8.5" r="1.2" fill="rgba(0,0,0,0.28)"/><circle cx="14.5" cy="8.5" r="1.2" fill="rgba(0,0,0,0.28)"/></svg>,

  // Ground — mountain / terrain layers
  ground: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 19l5-9 4 6 3-4 4 7H2z"/><path d="M2 21h20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>,

  // Flying — bird wings
  flying: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 10c3-5 8-7 10-7 3.5 0 6 2.5 6 6 0 4-3.5 6.5-7 7.5l-1-2c2.5-1 5-2.5 5-5.5 0-2-1.5-3.5-3.5-3.5-2 0-5.5 2-8.5 5.5L2 10z"/><path d="M7 17c2.5-2 5.5-3.5 8-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,

  // Psychic — eye with starburst / spiral
  psychic: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" opacity="0.2"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2.5" fill="rgba(0,0,0,0.35)"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,

  // Bug — bug silhouette
  bug: <svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="14" rx="4" ry="5"/><path d="M8.5 9c-1-1-2.5-1.5-4.5-.5M15.5 9c1-1 2.5-1.5 4.5-.5"/><path d="M8 14H4M16 14h4"/><path d="M8 17.5L5 20M16 17.5l3 2.5"/><ellipse cx="12" cy="8" rx="2.5" ry="2" fill="currentColor"/></svg>,

  // Rock — jagged boulder
  rock: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 4 3 13l3.5 7h11L21 13l-5-9H8z"/><path d="M8 4l4 5h4l3-5M8 4l-5 9 5 1M21 13l-5-1M7.5 20l4-5M16.5 20l-4-5" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1"/></svg>,

  // Ghost — classic ghost shape
  ghost: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a8 8 0 0 0-8 8v10l2.5-2.5L9 21l2.5-2.5L14 21l2.5-2.5L19 21V11A8 8 0 0 0 12 3z"/><circle cx="9.5" cy="11" r="1.5" fill="rgba(0,0,0,0.32)"/><circle cx="14.5" cy="11" r="1.5" fill="rgba(0,0,0,0.32)"/></svg>,

  // Dragon — dragon head / scale
  dragon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6l4 2-1.5 3.5L10 13l1.5 4.5 4-1.5 1.5-3.5L20 11l-2.5-4.5L14 8l-1.5-3.5-4 1L4 6z"/><path d="M15 15l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>,

  // Dark — crescent moon
  dark: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8z"/></svg>,

  // Steel — shield / hexagon
  steel: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 4 7v6c0 4 3.5 7 8 8 4.5-1 8-4 8-8V7l-8-4z"/><path d="M12 3 4 7v6c0 4 3.5 7 8 8 4.5-1 8-4 8-8V7l-8-4z" fill="rgba(0,0,0,0.12)" transform="translate(1.5,2) scale(0.75)"/></svg>,

  // Fairy — four-pointed star
  fairy: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/><circle cx="7" cy="19" r="1.2"/><circle cx="17" cy="19" r="1.2"/></svg>,
};

// ── TypeBadge — icon + label, GO colour palette ───────────────────────────
function TypeBadge({ type, lg = false }) {
  const c    = TYPE_COLORS[type] || '#888';
  const icon = TYPE_SVGS[type] || null;
  const size = lg ? 18 : 14;
  const pad  = lg ? '4px 10px 4px 7px' : '2px 7px 2px 5px';

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: lg ? 5 : 4,
        padding: pad, borderRadius: 20, flexShrink: 0,
        background: c + '28', border: `1px solid ${c}55`,
        color: c,
      }}>
      {icon && (
        <span style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {React.cloneElement(icon, { style: { width: size, height: size } })}
        </span>
      )}
      <span style={{ fontSize: lg ? 11 : 10, fontWeight: 700, letterSpacing: '.02em', textTransform: 'capitalize', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {cap(type)}
      </span>
    </span>
  );
}

// ── StatBar ───────────────────────────────────────────────────────────────
function StatBar({ label, value, max = 300, auto = false }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = auto
    ? (value >= 200 ? '#4ade80' : value >= 150 ? '#60a5fa' : value >= 100 ? '#a78bfa' : value >= 50 ? '#fbbf24' : '#f87171')
    : 'var(--accent)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ color: 'var(--muted)', fontSize: 12, width: 72, flexShrink: 0, lineHeight: '1.3' }}>{label}</span>
      <div className="sbar" style={{ flex: 1 }}>
        <div className="sbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ color: 'var(--text)', fontSize: 12, width: 28, textAlign: 'right', fontWeight: 600, flexShrink: 0 }}>{value}</span>
    </div>
  );
}

// ── RangeSlider ───────────────────────────────────────────────────────────
function RangeSlider({ label, value, onChange, min = 1, max = 50, step = 0.5, color = 'var(--accent)', showNum = false }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="card3" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
        {showNum ? (
          <input type="number" value={value} min={min} max={max} step={step}
            onChange={e => { const v = parseFloat(e.target.value); if (v >= min && v <= max) onChange(v); }}
            style={{ width: 54, textAlign: 'center', padding: '3px 6px', borderRadius: 6, border: `1px solid ${color}55`, background: color + '18', color, fontWeight: 700, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
        ) : (
          <span style={{ fontWeight: 700, fontSize: 13, padding: '2px 10px', borderRadius: 6, background: color + '18', color, border: `1px solid ${color}44` }}>{value}</span>
        )}
      </div>
      <input type="range" className="slider" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ background: `linear-gradient(90deg,${color} ${pct}%,var(--s3) ${pct}%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--dim)', marginTop: 4 }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ── IVSlider ──────────────────────────────────────────────────────────────
function IVSlider({ label, value, onChange, color }) {
  return (
    <div className="card3" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 2, overflow: 'hidden', flexShrink: 1 }}>
            {[...Array(16)].map((_, i) => (
              <div key={i} onClick={() => onChange(i)}
                style={{ width: 6, height: 12, borderRadius: 3, cursor: 'pointer', flexShrink: 0, background: i <= value ? color : 'var(--s3)', transition: 'background .1s' }} />
            ))}
          </div>
          <input type="number" value={value} min={0} max={15}
            onChange={e => { const v = parseInt(e.target.value); if (v >= 0 && v <= 15) onChange(v); }}
            style={{ width: 38, textAlign: 'center', padding: '3px 4px', borderRadius: 6, border: `1px solid ${color}44`, background: color + '18', color, fontWeight: 700, fontSize: 13, outline: 'none', fontFamily: 'inherit', flexShrink: 0 }} />
        </div>
      </div>
      <input type="range" className="slider" min={0} max={15} step={1} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ background: `linear-gradient(90deg,${color} ${(value / 15) * 100}%,var(--s3) ${(value / 15) * 100}%)` }} />
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <button className={`toggle-pill${value ? ' on' : ''}`} onClick={() => onChange(!value)}>
      {label}
    </button>
  );
}

// ── Pokeball ──────────────────────────────────────────────────────────────
function Pokeball({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: '#e53e3e', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,.45)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: Math.max(2, size / 16), background: 'rgba(0,0,0,.3)', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: size * .28, height: size * .28, borderRadius: '50%', background: '#fff', transform: 'translate(-50%,-50%)', border: `${Math.max(1.5, size / 20)}px solid rgba(0,0,0,.18)` }} />
    </div>
  );
}

// ── PokemonImage ──────────────────────────────────────────────────────────
function PokemonImage({ poke, isShiny, is3D, shadowType, size = 96 }) {
  const [err, setErr]       = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => { setErr(false); setLoaded(false); }, [poke?.id, isShiny, is3D]);

  let src = null;
  if (!err) {
    if (is3D) src = isShiny ? poke?.sprites?.other?.home?.front_shiny : poke?.sprites?.other?.home?.front_default;
    if (!src) src = isShiny ? poke?.sprites?.other?.['official-artwork']?.front_shiny : poke?.sprites?.other?.['official-artwork']?.front_default;
    if (!src) src = isShiny ? poke?.sprites?.front_shiny : poke?.sprites?.front_default;
  }

  const glowCls    = isShiny ? 'glow-shiny' : shadowType === 'shadow' ? 'glow-shadow' : shadowType === 'purified' ? 'glow-purified' : '';
  const imgFilter  = shadowType === 'purified' ? 'saturate(.25) brightness(1.15)' : undefined;

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!loaded && <Spinner size="sm" />}
      {src && (
        <img src={src} alt={poke?.name || ''} width={size} height={size}
          className={`pimg ${glowCls}`}
          style={{ objectFit: 'contain', width: size, height: size, opacity: loaded ? 1 : 0, transition: 'opacity .25s', filter: imgFilter }}
          onLoad={() => setLoaded(true)}
          onError={() => { setErr(true); setLoaded(true); }} />
      )}
      {shadowType === 'shadow' && loaded && src && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none', background: 'linear-gradient(150deg,rgba(88,28,235,.35) 0%,rgba(109,40,217,.2) 55%,transparent 100%)' }} />
      )}
      {(!src || err) && loaded && (
        <svg width={Math.round(size * .4)} height={Math.round(size * .4)} viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </div>
  );
}
