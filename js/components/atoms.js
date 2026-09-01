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
// Pokémon GO style type icons — silhouettes matching the in-game type badges
const TYPE_ICONS = {
  // Bug: beetle/bug silhouette
  bug:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M384 240c0-8.8-7.2-16-16-16h-29.5c-3.3-29.5-16.8-55.9-37-75.6l20.8-20.8c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0l-24.5 24.5C264.1 126.3 252.3 124 240 124s-24.1 2.3-35.2 5.5L180.3 105c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l20.8 20.8c-20.2 19.7-33.7 46.1-37 75.6H112c-8.8 0-16 7.2-16 16s7.2 16 16 16h27.5c1.3 10.3 4 20.2 7.8 29.4l-24 13.9c-7.7 4.4-10.3 14.2-5.9 21.9s14.2 10.3 21.9 5.9l22.7-13.1c13.8 20 33.7 35.3 56.9 43.2 3.7 1.3 7.5 2.3 11.4 3.1L217 451.7c-1.6 8.6 4 17 12.6 18.7s17-4 18.7-12.6l11.5-60.5c2.8.2 5.5.3 8.3.3s5.5-.1 8.3-.3l11.5 60.5c1.6 8.6 10.1 14.2 18.7 12.6s14.2-10.1 12.6-18.7L305.7 360c3.9-.8 7.7-1.8 11.4-3.1 23.2-7.9 43.1-23.2 56.9-43.2l22.7 13.1c7.7 4.4 17.5 1.8 21.9-5.9s1.8-17.5-5.9-21.9l-24-13.9c3.8-9.2 6.5-19.1 7.8-29.4H384c8.8 0 16-7.2 16-16zM240 156c46.4 0 84 37.6 84 84v4c0 46.4-37.6 84-84 84s-84-37.6-84-84v-4c0-46.4 37.6-84 84-84zM144 80c0-26.5 21.5-48 48-48s48 21.5 48 48-21.5 48-48 48-48-21.5-48-48zm144 0c0-26.5 21.5-48 48-48s48 21.5 48 48-21.5 48-48 48-48-21.5-48-48z"/></svg>`,
  // Dark: crescent moon
  dark:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z"/></svg>`,
  // Dragon: dragon wing/fang
  dragon:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M223.9 289.4l-14.2 14.2c-5.6 5.6-5.6 14.7 0 20.3l78.2 78.2 14.2-14.2c5.6-5.6 5.6-14.7 0-20.3l-78.2-78.2zm237-218.3L380.3 140c-21.3-19.5-47.6-31.3-75.3-33.1V64H256v54.1c-3 .4-5.9.9-8.8 1.5l-18.6-56-48.3 16.1 19.2 57.6c-5.4 3.3-10.6 7-15.6 11.1L131.7 112 96 147.6l52.4 35.7c-8.3 13.3-14.5 27.8-18.5 43.1L64 224v50.4l68.9-2.8c1.1 15.3 4.7 30 10.5 43.7L96 352l35.6 35.6 46.6-46.6c9.1 7.1 19.2 13.1 30 17.9l-19.6 58.8 48.3 16.1 20.3-60.8c6 .5 12.1.8 18.2.8 2.8 0 5.5-.1 8.2-.2V432h48.8v-56.9c28.5-4 55.2-15.4 77-33.7l51.8 51.8L496 357.5l-51-51c14.1-22.3 22.7-47.8 24.3-74.5H512V184h-42.1c-2.3-18.3-7.8-35.7-16-51.5l66.6-45.4L484.9 71.1zm-189 324.2c-79.5 0-143.9-64.4-143.9-143.9S193.5 108 273 108s143.9 64.4 143.9 143.9S352.5 395.3 273 395.3zm0-255.9c-61.8 0-112 50.2-112 112s50.2 112 112 112 112-50.2 112-112-50.2-112-112-112z"/></svg>`,
  // Electric: lightning bolt
  electric: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M296 32l-128 256h112l-80 192 272-320H344z"/></svg>`,
  // Fairy: sparkle/star
  fairy:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 32l46.9 144.6H448l-122.7 89.1 46.9 144.4L256 320.8l-116.2 89.3 46.9-144.4L64 176.6h145.1z"/></svg>`,
  // Fighting: fist
  fighting: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M192 160c0-17.7-14.3-32-32-32H96c-17.7 0-32 14.3-32 32v64h128v-64zm-32 96H64v64c0 17.7 14.3 32 32 32h64v-96zm192-96H256c-17.7 0-32 14.3-32 32v64h128v-64zm-32 96H224v96h96c17.7 0 32-14.3 32-32v-64zm64-128v-16c0-17.7-14.3-32-32-32H352c-17.7 0-32 14.3-32 32v16h16v112h64V128zm-16 144V160h32v112h-32zM64 352v32c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64v-32H64z"/></svg>`,
  // Fire: flame
  fire:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M216 23.9c0 0-48 112-48 184 0 56.6 29.4 100 80 118.6V224s-24.6-23.8-24.6-72c0-68.5 48-96 48-96s48 27.5 48 96c0 48.2-24 72-24 72v102.6c51.2-18.5 81-62 81-118.6C376 136.1 328 24 328 24 296 8 276 0 256 0c-20 0-40 8-40 23.9z"/></svg>`,
  // Flying: bird/wing
  flying:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M351.7 160H208c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h87.9c-2.6 3-5 6.1-7.2 9.4L192 336h-53.3c-9.1 0-17.6 4.8-22.4 12.8L64 448h64l58.5-87.8C195 352 204 352 208 352h167.4c31.7 0 60.1-18.6 74-48l50-108.4c3.2-6.9 2.5-15-1.9-21.2s-11.5-9.9-18.9-9.9H381.7c-11.5-24.8-36.7-32-30-4z"/></svg>`,
  // Ghost: ghost silhouette
  ghost:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M192 0C85.96 0 0 85.96 0 192v320l96-64 64 64 64-64 64 64 64-64 96 64V192C448 85.96 362.04 0 256 0H192zm-48 256c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm96 0c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z"/></svg>`,
  // Grass: leaf
  grass:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M272 96c-78.6 0-145.1 51.5-167.7 122.5c33.6-17 71.5-26.5 111.7-26.5h88c8.8 0 16 7.2 16 16s-7.2 16-16 16H288 216c-49.2 0-95.4 15.3-133.7 41.4l-28.4 19.2-43.6-65.4 28.4-19.2C86.7 177.8 133.5 160 184 160c24.5-65.4 85.6-112 158-112c11.1 0 22 .9 32.6 2.7 10.8 1.8 18.2 11.7 16.5 22.5S379.7 91.5 369 89.8C337.5 84.7 305 85.7 272 96zm-64 128a192 192 0 1 1 0 384 192 192 0 1 1 0-384z"/></svg>`,
  // Ground: mountain/terrain
  ground:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M346.3 271.8l-60.1-71.5c-4.5-5.4-11.1-8.3-18.2-8.3s-13.7 3-18.2 8.3L128 288l-22.5-26.8C100 255.7 93.3 252 86 252s-14 3.7-19.5 9.2L0 320v96c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64v-32L346.3 271.8zM432 256a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>`,
  // Ice: snowflake
  ice:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M224 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32 384a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM32 224a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm416 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM86.6 54.6a32 32 0 1 1 45.3 45.3A32 32 0 1 1 86.6 54.6zm292.9 338.5a32 32 0 1 1 45.3 45.3 32 32 0 1 1 -45.3-45.3zM54.6 379.5a32 32 0 1 1 45.3-45.3 32 32 0 1 1 -45.3 45.3zm338.5-292.9a32 32 0 1 1 45.3-45.3 32 32 0 1 1 -45.3 45.3zM272 136V256l88 50.9-16 27.7L256 283V136h16zM232 136H256V283l-88 50.6-16-27.7L240 256V136h-8z"/></svg>`,
  // Normal: circle/star
  normal:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384a128 128 0 1 1 0 256 128 128 0 1 1 0-256z"/></svg>`,
  // Poison: skull/biohazard drop
  poison:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 0C148.5 0 62 78.1 51.2 179.8c-1.1 10.1 1.9 20.2 8.5 28 6.5 7.8 15.9 12.2 25.9 12.2h16c17.2 0 31.2-13.2 32-30.4C140.1 130.4 193.7 80 256 80s115.9 50.4 122.4 109.6c.8 17.2 14.8 30.4 32 30.4h16c10 0 19.4-4.4 25.9-12.2 6.6-7.8 9.6-17.9 8.5-28C450 78.1 363.5 0 256 0zm32 476.5V320H224v156.5c-20.8-3.1-40.6-8.8-59.2-16.7L128 416l-32 32c-22.3-18.4-41.2-40.3-55.7-64.9L80 352l-22.3-43.5C45.1 283.4 40 258.4 40 232v-8H0c0 154.3 126.3 280 280.3 280 .6 0 1.1 0 1.7 0L256 480l16 16c-1.3.2-2.7.5-4 .7 .7-.1 .9-.2-.8-.2H256 288v-20 .5z"/></svg>`,
  // Psychic: eye/starburst
  psychic:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>`,
  // Rock: diamond/gem shape
  rock:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M156.3 208L32 400l224 112L480 400 355.7 208H156.3zM311.7 128H264.3l-64 64h175.4l-64-64zM288 0L192 96H384L288 0z"/></svg>`,
  // Steel: cog/shield
  steel:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.7 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z"/></svg>`,
  // Water: water drop
  water:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M192 512C86 512 0 426 0 320C0 228.8 130.2 57.7 166.6 11.7C172.6 4.2 181.5 0 191 0h1.4c9.5 0 18.4 4.2 24.4 11.7C253.8 57.7 384 228.8 384 320c0 106-86 192-192 192z"/></svg>`,
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
