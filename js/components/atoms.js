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
// Inline SVG paths from partywhale/pokemon-type-icons (MIT).
// Inlined to avoid CORS issues with raw.githubusercontent.com when the app
// is served from file:// or a different origin.
const TYPE_ICONS = {
  bug:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 12.5a1 1 0 0 0-1-1h-1.09A8 8 0 0 0 13 4.07V3h1a1 1 0 0 0 0-2H10a1 1 0 0 0 0 2h1v1.07A8 8 0 0 0 5.09 11.5H4a1 1 0 0 0 0 2h1.09A8 8 0 0 0 11 19.93V22h-1a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-1v-2.07A8 8 0 0 0 18.91 13.5H20a1 1 0 0 0 1-1zM12 18a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/></svg>`,
  dark:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 4.9-14.37A6 6 0 0 0 12 18a6.07 6.07 0 0 0 1.81-.28A8 8 0 0 1 12 20z"/></svg>`,
  dragon:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M20.5 9.5l-2-2L17 9l2 2zM18 3l-2 2 1.5 1.5L19 5zM3.5 9.5l2-2L7 9l-2 2zM6 3l2 2L6.5 6.5 5 5zm6 1a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8zm0 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6zm0-10a4 4 0 0 0-4 4h2a2 2 0 0 1 2-2z"/></svg>`,
  electric: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.64.19-.31.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C14.96 13.58 13 17 11 21z"/></svg>`,
  fairy:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>`,
  fighting: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3A7.3 7.3 0 0 0 18.49 13v-2a5.34 5.34 0 0 1-4.2-2.1l-1-1.4c-.4-.5-.9-.8-1.5-.8-.3 0-.5.1-.8.1L6.49 9v4h2V10.3l1.8-.7-1.6 8.1-4.3-.9-.4 2 6.3 1.5z"/></svg>`,
  fire:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`,
  flying:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>`,
  ghost:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C7.03 2 3 6.03 3 11v9l3-3 3 3 3-3 3 3 3-3v-9c0-4.97-4.03-9-9-9zm-1 9H9V9h2v2zm4 0h-2V9h2v2z"/></svg>`,
  grass:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 5-4 12-4 12-4S17 0 8 4c0 0 5-4 9-2A21 21 0 0 0 8 8c5-3 12-3 12-3s-3 7-11 7a9.59 9.59 0 0 1-2-.22L6 13.22A16 16 0 0 1 17 8z"/></svg>`,
  ground:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm3-10H9v2h6v-2zm0 4H9v2h6v-2z"/></svg>`,
  ice:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M22 11h-4.17l2.24-2.24-1.41-1.42L15 11h-2V9l3.66-3.66-1.42-1.41L13 6.17V2h-2v4.17L8.76 3.93 7.34 5.34 11 9v2H9L5.34 7.34 3.93 8.76 6.17 11H2v2h4.17l-2.24 2.24 1.41 1.42L9 13h2v2l-3.66 3.66 1.42 1.41L11 17.83V22h2v-4.17l2.24 2.24 1.42-1.41L13 15v-2h2l3.66 3.66 1.41-1.42L17.83 13H22v-2z"/></svg>`,
  normal:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle fill="currentColor" cx="12" cy="12" r="9"/></svg>`,
  poison:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C9.88 2 8.12 3.76 8.12 5.88c0 1.28.65 2.41 1.63 3.1A6.97 6.97 0 0 0 5 15.88C5 19.25 7.69 22 11 22h2c3.31 0 6-2.75 6-6.12a6.97 6.97 0 0 0-4.75-6.9c.98-.69 1.63-1.82 1.63-3.1C15.88 3.76 14.12 2 12 2zm0 2c1.04 0 1.88.84 1.88 1.88S13.04 7.75 12 7.75 10.12 6.92 10.12 5.88 10.96 4 12 4zm0 6c2.76 0 5 2.19 5 4.88S14.76 20 12 20s-5-2.19-5-4.88S9.24 10 12 10z"/></svg>`,
  psychic:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V15h-2v1.93A8 8 0 0 1 4.07 9H6v2h2V9h8v2h2V9h1.93A8 8 0 0 1 13 16.93z"/></svg>`,
  rock:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 5H7L3 12l4 7h10l4-7z"/></svg>`,
  steel:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 4 6v6c0 5.25 3.41 10.15 8 11.38C16.59 22.15 20 17.25 20 12V6l-8-4zm0 4.25 5 2.5V12c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V8.75l5-2.5z"/></svg>`,
  water:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-5.33 4.55-8 8.48-8 11.8C4 17.78 7.58 22 12 22s8-4.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>`,
};

function TypeBadge({ type, lg = false }) {
  const c    = TYPE_COLORS[type] || '#888';
  const size = lg ? 18 : 14;
  const pad  = lg ? '4px 10px 4px 7px' : '2px 7px 2px 5px';
  const svg  = TYPE_ICONS[type];

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: lg ? 5 : 4,
      padding: pad, borderRadius: 20, flexShrink: 0,
      background: c + '28', border: `1px solid ${c}55`, color: c,
    }}>
      {svg ? (
        <span
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: size, height: size, color: c }}
          dangerouslySetInnerHTML={{ __html: svg.replace('<svg ', `<svg width="${size}" height="${size}" `) }}
        />
      ) : null}
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
