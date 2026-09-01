// ── RaidExportCard ────────────────────────────────────────────────────────
// Renders a LeekDuck-style raid info card onto a <canvas>.
// Canvas is 1080 × 1200 px.

const CW  = 1080;
const CH  = 1220;
const PAD = 48;

// ── Canvas helpers ────────────────────────────────────────────────────────

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`load fail: ${src}`));
    img.src = src;
  });
}

function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function hexA(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// Safe text draw — always sets font/fill/align before drawing
function drawTxt(ctx, text, x, y, { font, fill, align = 'left', maxW } = {}) {
  if (font)  ctx.font      = font;
  if (fill)  ctx.fillStyle = fill;
  ctx.textAlign = align;
  if (maxW) ctx.fillText(String(text), x, y, maxW);
  else      ctx.fillText(String(text), x, y);
}

// ── Image loader ──────────────────────────────────────────────────────────
async function loadAllImages(poke, moves, counters) {
  const jobs = {};

  // Main & shiny sprites
  const mainSrc  = poke.sprites?.other?.home?.front_default
                || poke.sprites?.other?.['official-artwork']?.front_default
                || poke.sprites?.front_default || '';
  const shinySrc = poke.sprites?.other?.home?.front_shiny
                || poke.sprites?.other?.['official-artwork']?.front_shiny
                || poke.sprites?.front_shiny || '';
  if (mainSrc)  jobs.main  = loadImg(mainSrc);
  if (shinySrc) jobs.shiny = loadImg(shinySrc);

  // ALL type icons upfront (used for badges, weaknesses, move types)
  for (const t of Object.keys(TYPE_COLORS)) {
    jobs[`ti_${t}`] = loadImg(`https://assets.dittobase.com/go/types/${t}.png`);
  }

  // Counter sprites
  for (const c of counters) {
    jobs[`ctr_${c.name}`] = fetchPoke(c.name)
      .then(p => {
        const src = p.sprites?.other?.home?.front_default || p.sprites?.front_default || '';
        return src ? loadImg(src) : null;
      })
      .catch(() => null);
  }

  const keys   = Object.keys(jobs);
  const settled = await Promise.allSettled(keys.map(k => jobs[k]));
  const imgs   = {};
  keys.forEach((k, i) => {
    if (settled[i].status === 'fulfilled' && settled[i].value) {
      imgs[k] = settled[i].value;
    }
  });
  return imgs;
}

// ── Main draw ─────────────────────────────────────────────────────────────
async function drawRaidCard(canvas, poke, species, gs, shadowType) {
  const ctx = canvas.getContext('2d');
  canvas.width  = CW;
  canvas.height = CH;

  const types      = (poke.types || []).map(t => t.type.name);
  const primaryCol = TYPE_COLORS[types[0]] || '#6c6ef5';
  const secondCol  = TYPE_COLORS[types[1]] || primaryCol;

  // Stats (shadow-adjusted)
  const atkStat = shadowType === 'shadow' ? Math.round(gs.atk * 1.2) : gs.atk;
  const defStat = shadowType === 'shadow' ? Math.round(gs.def * 0.8) : gs.def;
  const hpStat  = gs.hp;

  // CP ranges
  const cpMin  = calcCP(gs.atk, gs.def, gs.hp, 10, 10, 10, 20);
  const cpMax  = calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 20);
  const cpBMin = calcCP(gs.atk, gs.def, gs.hp, 10, 10, 10, 25);
  const cpBMax = calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 25);

  // Weather
  const weatherLabels = weatherForTypes(types);

  // Weaknesses sorted by multiplier desc
  const { weak } = typeWeaknesses(types);
  const weakTypes = weak.sort((a, b) => b.m - a.m).map(w => w.t);

  // Counters
  const counters = scoredCounters(types).slice(0, 6);

  // ── GO entry + moves ─────────────────────────────────────────────────
  let goEntry = goPokedexByFormId[poke.formId]
             || goPokedexByFormId[(poke.formId || '').toUpperCase()]
             || goPokedexByName[poke.name]
             || null;

  if (!goEntry) {
    try {
      const fid = ((poke.formId || poke.name) + '').toUpperCase().replace(/-/g, '_');
      const r   = await fetch(`https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex/id/${fid}.json`);
      if (r.ok) { const d = await r.json(); goEntry = Array.isArray(d) ? d[0] : d; }
    } catch { /* ignore */ }
  }

  const toArr = obj => (obj && typeof obj === 'object' && !Array.isArray(obj))
    ? Object.values(obj) : (Array.isArray(obj) ? obj : []);

  const fastMoves   = toArr(goEntry?.quickMoves).slice(0, 4).map(m => ({
    name: m.names?.English || m.id || '?',
    type: goTypeToSlug(m.type?.type || ''),
  }));
  const chargeMoves = toArr(goEntry?.cinematicMoves).slice(0, 4).map(m => ({
    name: m.names?.English || m.id || '?',
    type: goTypeToSlug(m.type?.type || ''),
  }));

  // ── Load images ───────────────────────────────────────────────────────
  const imgs = await loadAllImages(poke, [...fastMoves, ...chargeMoves], counters);

  // ══════════════════════ DRAW ══════════════════════════════════════════

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, CW, CH);
  bgGrad.addColorStop(0,   '#18182a');
  bgGrad.addColorStop(0.5, '#141428');
  bgGrad.addColorStop(1,   '#0e1a30');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CW, CH);

  // Type colour overlay (top-right)
  const ovGrad = ctx.createRadialGradient(CW * 0.85, CH * 0.15, 0, CW * 0.85, CH * 0.15, 500);
  ovGrad.addColorStop(0,   hexA(primaryCol, 0.28));
  ovGrad.addColorStop(0.5, hexA(secondCol,  0.12));
  ovGrad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = ovGrad;
  ctx.fillRect(0, 0, CW, CH);

  // ── SECTION A: top half (split at y=520) ─────────────────────────────
  const SPLIT = 520;
  const LEFT_W = 560;   // text column
  const RIGHT_X = LEFT_W + 20;
  const RIGHT_W = CW - RIGHT_X - PAD;

  // ─ Dex number + Name ─────────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic';
  drawTxt(ctx, `No${poke.id}`, PAD, PAD + 52, {
    font:  '700 40px Inter, sans-serif',
    fill:  'rgba(255,255,255,0.5)',
    align: 'left',
  });

  const displayName = fmtName(poke.name);
  // Measure name to pick font size that fits LEFT_W
  ctx.font = '800 68px Inter, sans-serif';
  let nameFont = '800 68px Inter, sans-serif';
  if (ctx.measureText(displayName).width > LEFT_W - 140) nameFont = '800 52px Inter, sans-serif';
  if (ctx.measureText(displayName).width > LEFT_W - 100) nameFont = '800 44px Inter, sans-serif';

  drawTxt(ctx, displayName, PAD + 128, PAD + 58, {
    font:  nameFont,
    fill:  '#ffffff',
    align: 'left',
    maxW:  LEFT_W - 140,
  });

  if (shadowType) {
    const sc = shadowType === 'shadow' ? '#c084fc' : '#22d3ee';
    drawTxt(ctx, shadowType === 'shadow' ? '✦ Shadow' : '✦ Purified', PAD + 130, PAD + 90, {
      font: '600 22px Inter, sans-serif', fill: sc, align: 'left',
    });
  }

  // ─ Type badges ────────────────────────────────────────────────────────
  const TYPE_Y = PAD + 116;
  let tx = PAD;
  const BADGE_H = 40;
  const ICON_S  = 28;

  for (const typeName of types) {
    const col = TYPE_COLORS[typeName] || '#888';
    ctx.font  = '700 22px Inter, sans-serif';
    const lw  = ctx.measureText(cap(typeName)).width;
    const bw  = ICON_S + 8 + lw + 22;   // [pad8] [icon28] [gap8] [text] [pad14]

    rrect(ctx, tx, TYPE_Y, bw, BADGE_H, 20);
    ctx.fillStyle   = hexA(col, 0.22);
    ctx.fill();
    ctx.strokeStyle = hexA(col, 0.6);
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    const timg = imgs[`ti_${typeName}`];
    if (timg) ctx.drawImage(timg, tx + 8, TYPE_Y + (BADGE_H - ICON_S) / 2, ICON_S, ICON_S);

    ctx.textBaseline = 'middle';
    drawTxt(ctx, cap(typeName), tx + 8 + ICON_S + 8, TYPE_Y + BADGE_H / 2, {
      font: '700 22px Inter, sans-serif', fill: col, align: 'left',
    });
    ctx.textBaseline = 'alphabetic';

    tx += bw + 10;
  }

  // ─ Stats bars ─────────────────────────────────────────────────────────
  const BAR_START_Y = TYPE_Y + BADGE_H + 20;
  const BAR_X      = PAD + 78;
  const BAR_W      = 380;
  const BAR_H      = 24;
  const BAR_GAP    = 38;
  const STAT_FONT  = '800 26px Inter, sans-serif';
  const VAL_MAX    = { HP: 500, ATK: 450, DEF: 450 };

  const statRows = [
    { label: 'HP',  value: hpStat,  color: '#4ade80' },
    { label: 'ATK', value: atkStat, color: '#f87171' },
    { label: 'DEF', value: defStat, color: '#60a5fa' },
  ];

  statRows.forEach(({ label, value, color }, i) => {
    const y   = BAR_START_Y + i * BAR_GAP;
    const pct = Math.min(1, value / VAL_MAX[label]);

    ctx.textBaseline = 'middle';
    drawTxt(ctx, label, PAD, y + BAR_H / 2, { font: STAT_FONT, fill: '#ffffff', align: 'left' });

    // Track bg
    rrect(ctx, BAR_X, y, BAR_W, BAR_H, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();

    // Track fill
    const fillW = Math.max(BAR_H, BAR_W * pct);
    rrect(ctx, BAR_X, y, fillW, BAR_H, 12);
    ctx.fillStyle = color; ctx.fill();

    // Value label
    drawTxt(ctx, String(value), BAR_X + 10, y + BAR_H / 2, {
      font: '700 17px Inter, sans-serif', fill: '#000', align: 'left',
    });
    ctx.textBaseline = 'alphabetic';
  });

  // ─ CP / Weather / Weaknesses ──────────────────────────────────────────
  const INFO_START_Y = BAR_START_Y + statRows.length * BAR_GAP + 22;
  const LINE_H = 38;

  // Helper: label + bold value on same line
  const infoLine = (label, value, y, valCol = '#fff') => {
    ctx.textBaseline = 'alphabetic';
    ctx.font = '600 23px Inter, sans-serif';
    const lw = ctx.measureText(label).width;
    drawTxt(ctx, label, PAD, y, { font: '600 23px Inter, sans-serif', fill: 'rgba(255,255,255,0.65)', align: 'left' });
    drawTxt(ctx, value, PAD + lw + 8, y, { font: '700 23px Inter, sans-serif', fill: valCol, align: 'left' });
  };

  infoLine('Catch CP:',   `${cpMin.toLocaleString()} – ${cpMax.toLocaleString()}`,   INFO_START_Y);
  infoLine('Boosted CP:', `${cpBMin.toLocaleString()} – ${cpBMax.toLocaleString()}`, INFO_START_Y + LINE_H);

  if (weatherLabels.length > 0) {
    ctx.font = '600 23px Inter, sans-serif';
    const lw = ctx.measureText('Boosted By:').width;
    drawTxt(ctx, 'Boosted By:', PAD, INFO_START_Y + LINE_H * 2, {
      font: '600 23px Inter, sans-serif', fill: 'rgba(255,255,255,0.65)', align: 'left',
    });
    drawTxt(ctx, weatherLabels.join('  '), PAD + lw + 8, INFO_START_Y + LINE_H * 2, {
      font: '600 21px Inter, sans-serif', fill: '#93c5fd', align: 'left',
      maxW: LEFT_W - lw - 16,
    });
  }

  // Weak to
  const WEAK_Y = INFO_START_Y + LINE_H * (weatherLabels.length > 0 ? 3 : 2) + 4;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 23px Inter, sans-serif';
  const wLabelW = ctx.measureText('Weak to:').width;
  drawTxt(ctx, 'Weak to:', PAD, WEAK_Y + 22, { font: '600 23px Inter, sans-serif', fill: 'rgba(255,255,255,0.65)', align: 'left' });

  let wx = PAD + wLabelW + 10;
  const WICON = 34;
  for (const wt of weakTypes.slice(0, 12)) {
    if (wx + WICON > LEFT_W) break;
    const wi = imgs[`ti_${wt}`];
    if (wi) ctx.drawImage(wi, wx, WEAK_Y + 4, WICON, WICON);
    wx += WICON + 6;
  }

  // ─ Main Pokémon sprite (right column) ────────────────────────────────
  const SPR_SIZE = 460;
  const SPR_X    = RIGHT_X;
  const SPR_Y    = PAD - 20;

  // Glow
  const grd = ctx.createRadialGradient(
    SPR_X + SPR_SIZE / 2, SPR_Y + SPR_SIZE / 2, 40,
    SPR_X + SPR_SIZE / 2, SPR_Y + SPR_SIZE / 2, 230,
  );
  grd.addColorStop(0,   hexA(primaryCol, 0.40));
  grd.addColorStop(0.6, hexA(primaryCol, 0.14));
  grd.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(SPR_X, SPR_Y, SPR_SIZE, SPR_SIZE);

  if (imgs.main) ctx.drawImage(imgs.main, SPR_X, SPR_Y, SPR_SIZE, SPR_SIZE);

  // ── Divider ───────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, SPLIT); ctx.lineTo(CW - PAD, SPLIT);
  ctx.stroke();

  // ══════════════════════ SECTION B: moves + shiny ══════════════════════
  const B_Y    = SPLIT + 30;
  const COL1_X = PAD;           // fast moves  (x=48)
  const COL2_X = PAD + 270;     // charge moves (x=318)
  const COL3_X = PAD + 560;     // shiny        (x=608)

  const MHEAD_FONT  = '800 24px Inter, sans-serif';
  const MNAME_FONT  = '600 19px Inter, sans-serif';
  const MICON_S     = 26;
  const MROW_H      = 38;

  // Section headers
  ctx.textBaseline = 'alphabetic';
  drawTxt(ctx, 'Fast Moves',   COL1_X, B_Y + 24, { font: MHEAD_FONT, fill: '#fff', align: 'left' });
  drawTxt(ctx, 'Charge Moves', COL2_X, B_Y + 24, { font: MHEAD_FONT, fill: '#fff', align: 'left' });
  drawTxt(ctx, 'Shiny',        COL3_X, B_Y + 24, { font: MHEAD_FONT, fill: '#fff', align: 'left' });

  const drawMoveList = (moves, baseX, baseY) => {
    if (moves.length === 0) {
      ctx.textBaseline = 'alphabetic';
      drawTxt(ctx, '—', baseX + 8, baseY + 22, { font: MNAME_FONT, fill: 'rgba(255,255,255,0.3)', align: 'left' });
      return;
    }
    moves.forEach((m, i) => {
      const ry  = baseY + i * MROW_H;
      const mi  = imgs[`ti_${m.type}`];
      if (mi) {
        ctx.drawImage(mi, baseX, ry, MICON_S, MICON_S);
      }
      ctx.textBaseline = 'middle';
      drawTxt(ctx, m.name, baseX + MICON_S + 8, ry + MICON_S / 2, {
        font: MNAME_FONT, fill: '#f0f0f6', align: 'left',
        maxW: 200,
      });
      ctx.textBaseline = 'alphabetic';
    });
  };

  drawMoveList(fastMoves,   COL1_X, B_Y + 38);
  drawMoveList(chargeMoves, COL2_X, B_Y + 38);

  // Shiny sprite
  if (imgs.shiny) {
    ctx.drawImage(imgs.shiny, COL3_X, B_Y + 28, 230, 230);
  } else {
    ctx.textBaseline = 'alphabetic';
    drawTxt(ctx, 'N/A', COL3_X + 40, B_Y + 120, { font: '600 20px Inter, sans-serif', fill: 'rgba(255,255,255,0.3)', align: 'left' });
  }

  // ── Divider 2 ─────────────────────────────────────────────────────────
  const SPLIT2 = B_Y + 270;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, SPLIT2); ctx.lineTo(CW - PAD, SPLIT2);
  ctx.stroke();

  // ══════════════════════ SECTION C: counters ═══════════════════════════
  const C_Y   = SPLIT2 + 16;
  const CTR_W = (CW - PAD * 2) / 6;

  ctx.textBaseline = 'alphabetic';
  drawTxt(ctx, 'Top Counters', PAD, C_Y + 28, { font: '800 26px Inter, sans-serif', fill: '#fff', align: 'left' });

  const C_IMG_Y  = C_Y + 40;
  const C_IMG_S  = 120;
  const C_NAME_Y = C_IMG_Y + C_IMG_S + 8;
  const C_EFF_Y  = C_NAME_Y + 22;
  const C_ICON_Y = C_EFF_Y + 18;

  for (let ci = 0; ci < counters.length; ci++) {
    const c   = counters[ci];
    const cx  = PAD + ci * CTR_W;
    const mid = cx + CTR_W / 2;

    // Sprite
    const cImg = imgs[`ctr_${c.name}`];
    if (cImg) {
      ctx.drawImage(cImg, cx + (CTR_W - C_IMG_S) / 2, C_IMG_Y, C_IMG_S, C_IMG_S);
    }

    // Name
    ctx.textBaseline = 'alphabetic';
    drawTxt(ctx, fmtName(c.name), mid, C_NAME_Y, {
      font: '700 17px Inter, sans-serif', fill: '#f0f0f6', align: 'center', maxW: CTR_W - 6,
    });

    // Effectiveness
    const effLabel = c.eff >= 3.9 ? '4×' : c.eff >= 2.5 ? '2.56×' : c.eff >= 1.95 ? '2×' : '1.6×';
    const effColor = c.eff >= 3.9 ? '#f87171' : c.eff >= 2.5 ? '#fb923c' : c.eff >= 1.95 ? '#fbbf24' : '#a3e635';
    drawTxt(ctx, effLabel, mid, C_EFF_Y, {
      font: '700 15px Inter, sans-serif', fill: effColor, align: 'center',
    });

    // Best type icon
    const bImg = imgs[`ti_${c.bestMoveType}`];
    if (bImg) ctx.drawImage(bImg, mid - 12, C_ICON_Y, 24, 24);
  }

  // ── Footer ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, CH - 46, CW, 46);

  ctx.textBaseline = 'middle';
  const FY = CH - 23;
  drawTxt(ctx, 'GO Dex',                                          PAD,     FY, { font: '700 18px Inter, sans-serif',  fill: 'rgba(255,255,255,0.5)',  align: 'left'   });
  drawTxt(ctx, 'Data: PokéAPI · pokemon-go-api · LeekDuck / ScrapedDuck', CW / 2, FY, { font: '500 15px Inter, sans-serif',  fill: 'rgba(255,255,255,0.3)',  align: 'center' });
  drawTxt(ctx, 'Not affiliated with Niantic or Nintendo',         CW-PAD, FY, { font: '500 13px Inter, sans-serif',  fill: 'rgba(255,255,255,0.2)',  align: 'right'  });
  ctx.textBaseline = 'alphabetic';
}

// ── React modal component ─────────────────────────────────────────────────
function RaidExportCard({ poke, species, gs, shadowType, onClose }) {
  const canvasRef  = React.useRef(null);
  const [status,  setStatus]  = React.useState('rendering');
  const [dataUrl, setDataUrl] = React.useState(null);

  React.useEffect(() => {
    if (!poke || !gs || !canvasRef.current) return;
    setStatus('rendering');
    setDataUrl(null);

    drawRaidCard(canvasRef.current, poke, species, gs, shadowType)
      .then(() => {
        try {
          setDataUrl(canvasRef.current.toDataURL('image/png'));
          setStatus('done');
        } catch {
          setStatus('done'); // canvas visible but download may be blocked by CORS
        }
      })
      .catch(err => { console.error(err); setStatus('error'); });
  }, [poke?.name, gs, shadowType]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href     = dataUrl;
    a.download = `${fmtName(poke.name).replace(/\s+/g,'_')}_raid_card.png`;
    a.click();
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
    >
      <div style={{
        background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--border2)',
        padding: 20, maxWidth: 720, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: '0 32px 80px rgba(0,0,0,.9)',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Raid Card Export</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{fmtName(poke.name)}</div>
          </div>
          <button className="btn" onClick={onClose}>✕ Close</button>
        </div>

        {/* Loading state */}
        {status === 'rendering' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 13 }}>
            <Spinner /> Loading sprites &amp; building card…
          </div>
        )}
        {status === 'error' && (
          <div style={{ color: '#f87171', fontSize: 13 }}>⚠️ Failed to render. Check console.</div>
        )}

        {/* Canvas preview */}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', lineHeight: 0 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className={`btn${dataUrl ? ' primary' : ''}`}
            disabled={!dataUrl}
            style={!dataUrl ? { opacity: 0.4 } : {}}
            onClick={download}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PNG
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--dim)', textAlign: 'center', margin: 0 }}>
          Data from PokéAPI · pokemon-go-api · LeekDuck / ScrapedDuck · Not affiliated with Niantic or Nintendo
        </p>
      </div>
    </div>
  );
}
