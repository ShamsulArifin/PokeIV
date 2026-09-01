// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 20 : size === 'lg' ? 48 : 32;
  const b = size === 'sm' ? 2 : 3;
  return React.createElement('div', {
    className: 'spin',
    style: { width: s, height: s, borderRadius: '50%', border: `${b}px solid var(--s3)`, borderTopColor: 'var(--accent)' }
  });
}

// ── TypeBadge ─────────────────────────────────────────────────────────────
// Uses partywhale/pokemon-type-icons (MIT) from raw GitHub CDN.
// The SVGs are black-on-white; we tint them to the type colour via CSS filter.
const TYPE_ICON_BASE = 'https://raw.githubusercontent.com/partywhale/pokemon-type-icons/main/icons/';

function TypeBadge({ type, lg = false }) {
  const c   = TYPE_COLORS[type] || '#888';
  const size = lg ? 18 : 14;
  const pad  = lg ? '4px 10px 4px 7px' : '2px 7px 2px 5px';

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: lg ? 5 : 4,
        padding: pad, borderRadius: 20, flexShrink: 0,
        background: c + '28', border: `1px solid ${c}55`, color: c,
      }}>
      <img
        src={`${TYPE_ICON_BASE}${type}.svg`}
        alt={type}
        width={size}
        height={size}
        style={{
          display: 'block', flexShrink: 0,
          // invert black icon to white, then shift hue to the type colour
          filter: 'brightness(0) saturate(100%) invert(1)',
          opacity: 0.9,
        }}
      />
      <span style={{
        fontSize: lg ? 11 : 10, fontWeight: 700,
        letterSpacing: '.02em', textTransform: 'capitalize',
        lineHeight: 1, whiteSpace: 'nowrap',
      }}>
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

  const glowCls   = isShiny ? 'glow-shiny' : shadowType === 'shadow' ? 'glow-shadow' : shadowType === 'purified' ? 'glow-purified' : '';
  const imgFilter = shadowType === 'purified' ? 'saturate(.25) brightness(1.15)' : undefined;

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
