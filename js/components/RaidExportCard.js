// ── RaidExportCard ────────────────────────────────────────────────────────
// Renders a LeekDuck-style raid info card onto a <canvas> and lets the user
// download it as a PNG.
//
// Props:
//   poke      – PokeAPI response object
//   species   – PokeAPI species response (may be null)
//   gs        – GO stats { atk, def, hp }
//   shadowType – null | 'shadow' | 'purified'
//   onClose   – callback to close the modal

// ── Canvas constants ──────────────────────────────────────────────────────
const CW  = 1080;   // card width  (px)
const CH  = 1080;   // card height (px)
const PAD = 44;     // outer padding

// ── Helpers ───────────────────────────────────────────────────────────────

// Load an image cross-origin, return a Promise<HTMLImageElement>
function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

// Round-rectangle path helper
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + h,     r);
  ctx.arcTo(x + w, y + h, x,     y + h,     r);
  ctx.arcTo(x,     y + h, x,     y,         r);
  ctx.arcTo(x,     y,     x + w, y,         r);
  ctx.closePath();
}

// Hex with alpha suffix  e.g. hexA('#ff0000', 0.3) → 'rgba(255,0,0,0.3)'
function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Draw text with optional max-width truncation
function txt(ctx, text, x, y, opts = {}) {
  const { font, fill, align = 'left', max } = opts;
  if (font)  ctx.font      = font;
  if (fill)  ctx.fillStyle = fill;
  if (align) ctx.textAlign = align;
  const s = String(text);
  if (max) {
    ctx.fillText(s, x, y, max);
  } else {
    ctx.fillText(s, x, y);
  }
}

// ── Image pre-loader ──────────────────────────────────────────────────────
// Loads all required images in parallel; returns a map  key → HTMLImageElement
async function loadAllImages(poke, counters) {
  const jobs = {};

  // Main Pokémon sprites
  const mainSrc  = poke.sprites?.other?.home?.front_default
                || poke.sprites?.other?.['official-artwork']?.front_default
                || poke.sprites?.front_default || '';
  const shinySrc = poke.sprites?.other?.home?.front_shiny
                || poke.sprites?.other?.['official-artwork']?.front_shiny
                || poke.sprites?.front_shiny || '';

  if (mainSrc)  jobs.main  = loadImg(mainSrc);
  if (shinySrc) jobs.shiny = loadImg(shinySrc);

  // Type icons (dittobase CDN)
  const types = (poke.types || []).map(t => t.type.name);
  for (const t of types) {
    jobs[`type_${t}`] = loadImg(`https://assets.dittobase.com/go/types/${t}.png`);
  }

  // Weakness icons
  const allTypes = Object.keys(TYPE_COLORS);
  for (const t of allTypes) {
    if (!jobs[`type_${t}`]) {
      jobs[`type_${t}`] = loadImg(`https://assets.dittobase.com/go/types/${t}.png`);
    }
  }

  // Counter sprites (top 6)
  for (const c of counters.slice(0, 6)) {
    jobs[`ctr_${c.name}`] = fetchPoke(c.name)
      .then(p => {
        const src = p.sprites?.other?.home?.front_default
                 || p.sprites?.front_default || '';
        return src ? loadImg(src) : null;
      })
      .catch(() => null);
  }

  const keys   = Object.keys(jobs);
  const values = await Promise.allSettled(keys.map(k => jobs[k]));
  const imgs   = {};
  keys.forEach((k, i) => {
    if (values[i].status === 'fulfilled') imgs[k] = values[i].value;
  });
  return imgs;
}

// ── Main draw function ────────────────────────────────────────────────────
async function drawRaidCard(canvas, poke, species, gs, shadowType) {
  const ctx = canvas.getContext('2d');
  canvas.width  = CW;
  canvas.height = CH;

  const types      = (poke.types || []).map(t => t.type.name);
  const primaryCol = TYPE_COLORS[types[0]] || '#6c6ef5';
  const secondCol  = types[1] ? TYPE_COLORS[types[1]] : primaryCol;

  // GO stats (shadow-adjusted)
  const atkStat = (shadowType === 'shadow')   ? Math.round(gs.atk * 1.2)
                : (shadowType === 'purified') ? gs.atk : gs.atk;
  const defStat = (shadowType === 'shadow')   ? Math.round(gs.def * 0.8)
                : (shadowType === 'purified') ? gs.def : gs.def;
  const hpStat  = gs.hp;

  // CP ranges (raid: lv20/lv25, floor 10/10/10)
  const cpMin   = calcCP(gs.atk, gs.def, gs.hp, 10, 10, 10, 20);
  const cpMax   = calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 20);
  const cpBMin  = calcCP(gs.atk, gs.def, gs.hp, 10, 10, 10, 25);
  const cpBMax  = calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 25);

  // Weather boosts
  const weatherLabels = weatherForTypes(types);

  // Weaknesses (≥2×)
  const { weak } = typeWeaknesses(types);
  const weakTypes = weak.sort((a,b) => b.m - a.m).map(w => w.t);

  // Counters
  const counters = scoredCounters(types).slice(0, 6);

  // GO API entry for moves — quickMoves/cinematicMoves are OBJECTS keyed by move ID
  // goPokedexByFormId is populated by fetchList(); fetch directly if missing.
  let goEntry = goPokedexByFormId[poke.formId]
             || goPokedexByFormId[(poke.formId||'').toUpperCase()]
             || goPokedexByName[poke.name]
             || null;

  if (!goEntry) {
    // Direct fetch fallback
    try {
      const fid = (poke.formId || poke.name).toUpperCase().replace(/-/g, '_');
      const r = await fetch(`https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex/id/${fid}.json`);
      if (r.ok) {
        const data = await r.json();
        goEntry = Array.isArray(data) ? data[0] : data;
      }
    } catch { /* leave goEntry null */ }
  }

  // Convert object → array, fall back gracefully if missing
  const toMoveArray = obj => obj ? Object.values(obj) : [];

  const fastMoves   = toMoveArray(goEntry?.quickMoves).slice(0, 4).map(m => ({
    name: m.names?.English || m.id || '?',
    type: goTypeToSlug(m.type?.type || ''),
  }));
  const chargeMoves = toMoveArray(goEntry?.cinematicMoves).slice(0, 4).map(m => ({
    name: m.names?.English || m.id || '?',
    type: goTypeToSlug(m.type?.type || ''),
  }));

  // Pre-load images
  const imgs = await loadAllImages(poke, counters);

  // ── Background ───────────────────────────────────────────────────────
  // Dark gradient base
  const bgGrad = ctx.createLinearGradient(0, 0, CW, CH);
  bgGrad.addColorStop(0,   '#1a1a2e');
  bgGrad.addColorStop(0.5, '#16213e');
  bgGrad.addColorStop(1,   '#0f3460');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CW, CH);

  // Type-coloured diagonal overlay
  const overlayGrad = ctx.createLinearGradient(CW * 0.3, 0, CW, CH * 0.6);
  overlayGrad.addColorStop(0, hexA(primaryCol, 0));
  overlayGrad.addColorStop(0.5, hexA(primaryCol, 0.12));
  overlayGrad.addColorStop(1, hexA(secondCol, 0.22));
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, CW, CH);

  // Subtle noise-like texture via semi-transparent dots
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i = 0; i < CW; i += 4) {
    for (let j = 0; j < CH; j += 4) {
      if (Math.random() > 0.7) ctx.fillRect(i, j, 1, 1);
    }
  }

  // ── Top section divider line ──────────────────────────────────────────
  const MAIN_SPLIT_Y = 490;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, MAIN_SPLIT_Y);
  ctx.lineTo(CW - PAD, MAIN_SPLIT_Y);
  ctx.stroke();

  // ── Pokémon name & dex number ─────────────────────────────────────────
  const displayName = fmtName(poke.name);
  const dexStr      = `No${poke.id}`;

  ctx.textBaseline = 'alphabetic';

  // Dex number (small, muted)
  txt(ctx, dexStr, PAD, PAD + 50, {
    font:  `700 38px 'Inter', sans-serif`,
    fill:  'rgba(255,255,255,0.55)',
    align: 'left',
  });

  // Name (large, white)
  txt(ctx, displayName, PAD + 120, PAD + 56, {
    font:  `800 64px 'Inter', sans-serif`,
    fill:  '#ffffff',
    align: 'left',
    max:   540,
  });

  // Shadow/Purified label
  if (shadowType) {
    const shadowCol = shadowType === 'shadow' ? '#c084fc' : '#22d3ee';
    const shadowLbl = shadowType === 'shadow' ? '✦ Shadow' : '✦ Purified';
    txt(ctx, shadowLbl, PAD + 122, PAD + 92, {
      font:  `700 22px 'Inter', sans-serif`,
      fill:  shadowCol,
      align: 'left',
    });
  }

  // ── Type badges ───────────────────────────────────────────────────────
  const TYPE_Y = PAD + 120;
  let typeX = PAD;
  ctx.textBaseline = 'middle';

  for (const typeName of types) {
    const col    = TYPE_COLORS[typeName] || '#888';
    const label  = cap(typeName);
    ctx.font     = '700 22px Inter, sans-serif';
    const tw     = ctx.measureText(label).width;
    const bw     = tw + 52;   // icon 26 + gap 6 + text + padding 20
    const bh     = 38;

    // Badge background
    rrect(ctx, typeX, TYPE_Y, bw, bh, 19);
    ctx.fillStyle   = hexA(col, 0.2);
    ctx.fill();
    ctx.strokeStyle = hexA(col, 0.55);
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Type icon
    const typeImg = imgs[`type_${typeName}`];
    if (typeImg) {
      ctx.drawImage(typeImg, typeX + 10, TYPE_Y + 6, 26, 26);
    }

    // Label
    txt(ctx, label, typeX + 44, TYPE_Y + bh / 2, {
      font:  '700 22px Inter, sans-serif',
      fill:  col,
      align: 'left',
    });

    typeX += bw + 10;
  }
  ctx.textBaseline = 'alphabetic';

  // ── GO Stats bars ─────────────────────────────────────────────────────
  const STATS_Y = TYPE_Y + 62;
  const BAR_X   = PAD + 90;
  const BAR_W   = 340;
  const BAR_H   = 22;
  const BAR_GAP = 36;

  const statRows = [
    { label: 'HP',  value: hpStat,  color: '#4ade80', max: 500 },
    { label: 'ATK', value: atkStat, color: '#f87171', max: 400 },
    { label: 'DEF', value: defStat, color: '#60a5fa', max: 400 },
  ];

  ctx.textBaseline = 'middle';
  statRows.forEach(({ label, value, color, max }, i) => {
    const y   = STATS_Y + i * BAR_GAP;
    const pct = Math.min(1, value / max);

    // Label
    txt(ctx, label, PAD, y + BAR_H / 2, {
      font:  '800 28px Inter, sans-serif',
      fill:  '#ffffff',
      align: 'left',
    });

    // Bar bg
    rrect(ctx, BAR_X, y, BAR_W, BAR_H, 11);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();

    // Bar fill
    rrect(ctx, BAR_X, y, Math.max(BAR_H, BAR_W * pct), BAR_H, 11);
    ctx.fillStyle = color;
    ctx.fill();

    // Value inside bar
    txt(ctx, String(value), BAR_X + 12, y + BAR_H / 2, {
      font:  '700 18px Inter, sans-serif',
      fill:  '#000000',
      align: 'left',
    });
  });
  ctx.textBaseline = 'alphabetic';

  // ── CP / Weather info ─────────────────────────────────────────────────
  const INFO_Y = STATS_Y + statRows.length * BAR_GAP + 18;
  ctx.textBaseline = 'alphabetic';
  ctx.font      = '700 26px Inter, sans-serif';

  const renderInfoLine = (label, value, y, valueColor = '#ffffff') => {
    txt(ctx, label, PAD, y, { font: '600 24px Inter, sans-serif', fill: 'rgba(255,255,255,0.7)', align: 'left' });
    txt(ctx, value, PAD + ctx.measureText(label).width + 10, y, { font: '800 24px Inter, sans-serif', fill: valueColor, align: 'left' });
  };

  renderInfoLine('Catch CP:',   `${cpMin.toLocaleString()} – ${cpMax.toLocaleString()}`,   INFO_Y);
  renderInfoLine('Boosted CP:', `${cpBMin.toLocaleString()} – ${cpBMax.toLocaleString()}`, INFO_Y + 36);

  // Weather line
  if (weatherLabels.length > 0) {
    txt(ctx, 'Boosted By:', PAD, INFO_Y + 72, { font: '600 24px Inter, sans-serif', fill: 'rgba(255,255,255,0.7)', align: 'left' });
    txt(ctx, weatherLabels.join('  '), PAD + ctx.measureText('Boosted By:').width + 10, INFO_Y + 72, {
      font: '700 22px Inter, sans-serif', fill: '#93c5fd', align: 'left', max: 360,
    });
  }

  // ── Weak to ───────────────────────────────────────────────────────────
  const WEAK_Y = INFO_Y + 116;
  txt(ctx, 'Weak to:', PAD, WEAK_Y, { font: '600 24px Inter, sans-serif', fill: 'rgba(255,255,255,0.7)', align: 'left' });

  let wx = PAD + ctx.measureText('Weak to:').width + 12;
  ctx.textBaseline = 'middle';
  for (const wt of weakTypes.slice(0, 10)) {
    const wImg = imgs[`type_${wt}`];
    if (wImg && wx + 38 < 680) {
      ctx.drawImage(wImg, wx, WEAK_Y - 18, 34, 34);
      wx += 40;
    }
  }
  ctx.textBaseline = 'alphabetic';

  // ── Main Pokémon sprite (right side) ──────────────────────────────────
  if (imgs.main) {
    const SPRITE_SIZE = 450;
    const sx = CW - PAD - SPRITE_SIZE + 20;
    const sy = PAD - 10;
    // Soft type-coloured glow behind sprite
    const grd = ctx.createRadialGradient(sx + SPRITE_SIZE/2, sy + SPRITE_SIZE/2, 60, sx + SPRITE_SIZE/2, sy + SPRITE_SIZE/2, 220);
    grd.addColorStop(0,   hexA(primaryCol, 0.35));
    grd.addColorStop(0.6, hexA(primaryCol, 0.12));
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(sx, sy, SPRITE_SIZE, SPRITE_SIZE);
    ctx.drawImage(imgs.main, sx, sy, SPRITE_SIZE, SPRITE_SIZE);
  }

  // ── Bottom half: Moves + Weaknesses + Shiny ───────────────────────────
  const BOT_Y  = MAIN_SPLIT_Y + 24;
  const COL1_X = PAD;
  const COL2_X = PAD + 240;
  const COL3_X = PAD + 500;
  const COL4_X = PAD + 730;

  // Section header helper
  const sectionHeader = (label, x, y) => {
    txt(ctx, label, x, y, { font: '800 26px Inter, sans-serif', fill: '#ffffff', align: 'left' });
  };

  // ── Fast Moves ────────────────────────────────────────────────────────
  sectionHeader('Fast Moves', COL1_X, BOT_Y + 26);
  ctx.textBaseline = 'middle';
  fastMoves.forEach((m, i) => {
    const iy = BOT_Y + 55 + i * 42;
    const mCol = TYPE_COLORS[m.type] || '#888';
    const typeImg = imgs[`type_${m.type}`];
    if (typeImg) ctx.drawImage(typeImg, COL1_X, iy - 13, 26, 26);
    txt(ctx, m.name, COL1_X + 34, iy, {
      font: '600 20px Inter, sans-serif',
      fill: '#f0f0f6',
      align: 'left',
    });
  });
  if (fastMoves.length === 0) {
    ctx.textBaseline = 'middle';
    txt(ctx, '—', COL1_X + 14, BOT_Y + 68, { font: '600 20px Inter, sans-serif', fill: 'rgba(255,255,255,0.3)', align: 'left' });
  }

  // ── Charge Moves ──────────────────────────────────────────────────────
  sectionHeader('Charge Moves', COL2_X, BOT_Y + 26);
  ctx.textBaseline = 'middle';
  chargeMoves.forEach((m, i) => {
    const iy = BOT_Y + 55 + i * 42;
    const mCol = TYPE_COLORS[m.type] || '#888';
    const typeImg = imgs[`type_${m.type}`];
    if (typeImg) ctx.drawImage(typeImg, COL2_X, iy - 13, 26, 26);
    txt(ctx, m.name, COL2_X + 34, iy, {
      font: '600 20px Inter, sans-serif',
      fill: '#f0f0f6',
      align: 'left',
    });
  });
  if (chargeMoves.length === 0) {
    ctx.textBaseline = 'middle';
    txt(ctx, '—', COL2_X + 14, BOT_Y + 68, { font: '600 20px Inter, sans-serif', fill: 'rgba(255,255,255,0.3)', align: 'left' });
  }

  // ── Shiny sprite ──────────────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic';
  sectionHeader('Shiny', COL4_X, BOT_Y + 26);
  if (imgs.shiny) {
    const ss = 200;
    ctx.drawImage(imgs.shiny, COL4_X, BOT_Y + 32, ss, ss);
  } else {
    txt(ctx, 'N/A', COL4_X + 30, BOT_Y + 120, { font: '600 20px Inter, sans-serif', fill: 'rgba(255,255,255,0.3)', align: 'left' });
  }

  // ── Weak type circles (bottom area, next to moves) ────────────────────
  // (already drawn in top half)

  // ── Counters section ──────────────────────────────────────────────────
  const CTR_Y  = MAIN_SPLIT_Y + 310;
  const CTR_X  = PAD;
  const CTR_IW = (CW - PAD * 2 - 50) / 6;   // width per counter cell

  // Section bg
  rrect(ctx, PAD - 10, CTR_Y - 10, CW - PAD * 2 + 20, CH - CTR_Y - PAD + 10, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  txt(ctx, 'Top Counters', PAD, CTR_Y + 26, {
    font:  '800 28px Inter, sans-serif',
    fill:  '#ffffff',
    align: 'left',
  });

  ctx.textBaseline = 'middle';
  for (let ci = 0; ci < Math.min(counters.length, 6); ci++) {
    const c    = counters[ci];
    const cx   = CTR_X + ci * CTR_IW;
    const imgSize = 110;

    // Counter sprite
    const cImg = imgs[`ctr_${c.name}`];
    if (cImg) {
      ctx.drawImage(cImg, cx + (CTR_IW - imgSize) / 2, CTR_Y + 40, imgSize, imgSize);
    }

    // Counter name
    txt(ctx, fmtName(c.name), cx + CTR_IW / 2, CTR_Y + 162, {
      font:  '700 18px Inter, sans-serif',
      fill:  '#f0f0f6',
      align: 'center',
      max:   CTR_IW - 4,
    });

    // Effectiveness badge
    const effLabel = c.eff >= 3.9 ? '4×' : c.eff >= 2.5 ? '2.56×' : c.eff >= 1.95 ? '2×' : '1.6×';
    const effColor = c.eff >= 3.9 ? '#f87171' : c.eff >= 2.5 ? '#fb923c' : c.eff >= 1.95 ? '#fbbf24' : '#a3e635';
    txt(ctx, effLabel, cx + CTR_IW / 2, CTR_Y + 186, {
      font:  '700 16px Inter, sans-serif',
      fill:  effColor,
      align: 'center',
    });

    // Best move type icon
    const bmImg = imgs[`type_${c.bestMoveType}`];
    if (bmImg) {
      ctx.drawImage(bmImg, cx + CTR_IW / 2 - 12, CTR_Y + 196, 24, 24);
    }
  }
  ctx.textBaseline = 'alphabetic';

  // ── Footer ────────────────────────────────────────────────────────────
  const FOOT_Y = CH - 26;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, CH - 50, CW, 50);

  txt(ctx, 'GO Dex', PAD, FOOT_Y, {
    font:  '700 22px Inter, sans-serif',
    fill:  'rgba(255,255,255,0.5)',
    align: 'left',
  });
  txt(ctx, 'Data: PokéAPI · pokemon-go-api · LeekDuck / ScrapedDuck', CW / 2, FOOT_Y, {
    font:  '500 18px Inter, sans-serif',
    fill:  'rgba(255,255,255,0.35)',
    align: 'center',
  });
  txt(ctx, 'Not affiliated with Niantic or Nintendo', CW - PAD, FOOT_Y, {
    font:  '500 16px Inter, sans-serif',
    fill:  'rgba(255,255,255,0.25)',
    align: 'right',
  });
}

// ── React component ───────────────────────────────────────────────────────
function RaidExportCard({ poke, species, gs, shadowType, onClose }) {
  const canvasRef   = React.useRef(null);
  const [status, setStatus] = React.useState('rendering'); // rendering | done | error
  const [dataUrl,  setDataUrl]  = React.useState(null);

  React.useEffect(() => {
    if (!poke || !gs || !canvasRef.current) return;
    setStatus('rendering');
    setDataUrl(null);

    drawRaidCard(canvasRef.current, poke, species, gs, shadowType)
      .then(() => {
        try {
          const url = canvasRef.current.toDataURL('image/png');
          setDataUrl(url);
          setStatus('done');
        } catch (e) {
          console.error('toDataURL failed (possible CORS):', e);
          setStatus('done'); // canvas still visible even if download blocked
        }
      })
      .catch(err => {
        console.error('Raid card render error:', err);
        setStatus('error');
      });
  }, [poke?.name, gs, shadowType]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href     = dataUrl;
    a.download = `${fmtName(poke.name).replace(/\s+/g, '_')}_raid_card.png`;
    a.click();
  };

  return (
    // Modal backdrop
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--border2)',
        padding: '20px', maxWidth: 700, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 32px 80px rgba(0,0,0,.8)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Raid Card Export</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{fmtName(poke.name)}</div>
          </div>
          <button className="btn" style={{ padding: '6px 12px' }} onClick={onClose}>✕ Close</button>
        </div>

        {/* Status */}
        {status === 'rendering' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 13 }}>
            <Spinner /> Loading sprites &amp; building card…
          </div>
        )}
        {status === 'error' && (
          <div style={{ color: '#f87171', fontSize: 13 }}>
            ⚠️ Failed to render the card. Check console for details.
          </div>
        )}

        {/* Canvas preview */}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {dataUrl ? (
            <button className="btn primary" style={{ gap: 8 }} onClick={download}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PNG
            </button>
          ) : (
            <button className="btn" disabled style={{ opacity: 0.4 }}>
              Download PNG
            </button>
          )}
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        {/* Attribution note */}
        <p style={{ fontSize: 11, color: 'var(--dim)', textAlign: 'center', margin: 0 }}>
          Data from PokéAPI, pokemon-go-api &amp; LeekDuck/ScrapedDuck · Not affiliated with Niantic or Nintendo
        </p>
      </div>
    </div>
  );
}
