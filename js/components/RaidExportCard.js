// ── RaidExportCard ────────────────────────────────────────────────────────
// Renders a LeekDuck-style raid info card onto a <canvas> and downloads it.
// 1080 × 1260 px

const CARD_W = 1080;
const CARD_H = 1260;
const P      = 44;   // outer padding

// Type icon URL proxied through weserv.nl for CORS-safe canvas drawing
const RC_TYPE_ICON = t => `https://images.weserv.nl/?url=assets.dittobase.com/go/types/${t}.png`;

// ═══════════════════════════ CANVAS HELPERS ═══════════════════════════════

function rc_loadImg(src) {
  return new Promise(res => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = () => res(null);   // never reject
    img.src = src;
  });
}

function rc_rrect(ctx, x, y, w, h, r) {
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

function rc_hexA(hex, a) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Draw text — font/fill/align set atomically so state never leaks
function rc_txt(ctx, text, x, y, font, fill, align = 'left', maxW) {
  ctx.font         = font;
  ctx.fillStyle    = fill;
  ctx.textAlign    = align;
  ctx.textBaseline = 'alphabetic';
  if (maxW !== undefined) ctx.fillText(String(text), x, y, maxW);
  else                    ctx.fillText(String(text), x, y);
}

// Draw text vertically centred in a row
function rc_txtMid(ctx, text, x, midY, font, fill, align = 'left', maxW) {
  ctx.font         = font;
  ctx.fillStyle    = fill;
  ctx.textAlign    = align;
  ctx.textBaseline = 'middle';
  if (maxW !== undefined) ctx.fillText(String(text), x, midY, maxW);
  else                    ctx.fillText(String(text), x, midY);
  ctx.textBaseline = 'alphabetic';
}

// ── Type badge drawn using real dittobase icon (CORS-proxied) ─────────────
// imgs must contain `ti_{typeName}` loaded via RC_TYPE_ICON
function rc_typePill(ctx, typeName, x, y, imgs) {
  const col  = TYPE_COLORS[typeName] || '#888';
  const FONT = '700 21px Inter, sans-serif';
  ctx.font   = FONT;
  const lw   = ctx.measureText(cap(typeName)).width;
  const ICON = 26;
  const bw   = 10 + ICON + 8 + lw + 12;
  const bh   = 38;

  // Pill background
  rc_rrect(ctx, x, y, bw, bh, 19);
  ctx.fillStyle   = rc_hexA(col, 0.22);
  ctx.fill();
  ctx.strokeStyle = rc_hexA(col, 0.7);
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Icon
  const tImg = imgs?.[`ti_${typeName}`];
  if (tImg) {
    ctx.drawImage(tImg, x + 10, y + (bh - ICON) / 2, ICON, ICON);
  } else {
    // Fallback: coloured dot
    ctx.beginPath();
    ctx.arc(x + 10 + ICON / 2, y + bh / 2, ICON / 2, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
  }

  // Label
  rc_txtMid(ctx, cap(typeName), x + 10 + ICON + 8, y + bh / 2, FONT, col);
  return bw;
}

// ── Inline type icon for move list / weakness row ─────────────────────────
// Draws the real dittobase icon at (x, midY-r) with size 2r
function rc_typeIcon(ctx, typeName, x, midY, r, imgs) {
  const col  = TYPE_COLORS[typeName] || '#888';
  const tImg = imgs?.[`ti_${typeName}`];
  const d    = r * 2;
  if (tImg) {
    ctx.drawImage(tImg, x, midY - r, d, d);
  } else {
    // Fallback circle
    ctx.beginPath();
    ctx.arc(x + r, midY, r, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5; ctx.stroke();
    rc_txtMid(ctx, (typeName||'').slice(0,2).toUpperCase(),
      x + r, midY, `700 ${Math.round(r * 0.9)}px Inter, sans-serif`, '#fff', 'center');
  }
}

// ═══════════════════════════ IMAGE LOADER ═════════════════════════════════

async function rc_loadImages(poke, counters, goEntry) {
  const jobs = {};

  // ── Pokémon sprites ─────────────────────────────────────────────────────
  // Prefer PokeAPI official artwork (high-res, CORS-safe) for the main card sprite.
  // GO assets are lower-res icons. Fall through the chain until we find something.
  const mainSrc =
       poke.sprites?.other?.['official-artwork']?.front_default
    || poke.sprites?.other?.home?.front_default
    || goEntry?.assets?.image
    || poke.sprites?.front_default || '';

  const shinySrc =
       poke.sprites?.other?.['official-artwork']?.front_shiny
    || poke.sprites?.other?.home?.front_shiny
    || goEntry?.assets?.shinyImage
    || poke.sprites?.front_shiny || '';

  if (mainSrc)  jobs.main  = rc_loadImg(mainSrc);
  if (shinySrc) jobs.shiny = rc_loadImg(shinySrc);

  // ── Type icons (proxied through weserv.nl for CORS) ─────────────────────
  for (const t of Object.keys(TYPE_COLORS)) {
    jobs[`ti_${t}`] = rc_loadImg(RC_TYPE_ICON(t));
  }

  // ── Counter sprites (PokeAPI HOME sprites — CORS via GitHub CDN) ──────────
  for (const c of counters) {
    jobs[`ctr_${c.name}`] = fetchPoke(c.name)
      .then(p => {
        const s = p.sprites?.other?.home?.front_default
               || p.sprites?.other?.['official-artwork']?.front_default
               || p.sprites?.front_default || '';
        return s ? rc_loadImg(s) : null;
      })
      .catch(() => null);
  }

  const keys    = Object.keys(jobs);
  const settled = await Promise.allSettled(keys.map(k => jobs[k]));
  const imgs    = {};
  keys.forEach((k, i) => {
    if (settled[i].status === 'fulfilled') imgs[k] = settled[i].value;
  });
  return imgs;
}

// ═══════════════════════════ MAIN DRAW ═══════════════════════════════════

async function rc_draw(canvas, poke, species, gs, shadowType) {
  const ctx = canvas.getContext('2d');
  canvas.width  = CARD_W;
  canvas.height = CARD_H;

  const types      = (poke.types || []).map(t => t.type.name);
  const primaryCol = TYPE_COLORS[types[0]] || '#6c6ef5';
  const secondCol  = TYPE_COLORS[types[1]] || primaryCol;

  // Stats (shadow-adjusted)
  const atkStat = shadowType === 'shadow' ? Math.round(gs.atk * 1.2) : gs.atk;
  const defStat = shadowType === 'shadow' ? Math.round(gs.def * 0.8) : gs.def;
  const hpStat  = gs.hp;

  // CP
  const cpMin  = calcCP(gs.atk, gs.def, gs.hp, 10, 10, 10, 20);
  const cpMax  = calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 20);
  const cpBMin = calcCP(gs.atk, gs.def, gs.hp, 10, 10, 10, 25);
  const cpBMax = calcCP(gs.atk, gs.def, gs.hp, 15, 15, 15, 25);

  // Weather
  const weatherLabels = weatherForTypes(types);

  // Weaknesses
  const { weak } = typeWeaknesses(types);
  const weakTypes = [...weak].sort((a, b) => b.m - a.m).map(w => w.t);

  // Counters
  const counters = scoredCounters(types).slice(0, 6);

  // ── GO entry (for moves) ──────────────────────────────────────────────
  // poke.name is the PokeAPI slug (e.g. "mewtwo") → maps to goPokedexByName exactly.
  // Ensure fetchList has run so goPokedexByName is populated.
  if (typeof fetchList === 'function') {
    try { await fetchList(); } catch { /* already cached or unavailable */ }
  }

  let goEntry = goPokedexByName[poke.name]
             || goPokedexByFormId[poke.name.toUpperCase().replace(/-/g, '_')]
             || null;

  // Direct API fallback if still missing
  if (!goEntry) {
    try {
      const fid = poke.name.toUpperCase().replace(/-/g, '_');
      const r   = await fetch(`https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex/id/${fid}.json`);
      if (r.ok) { const d = await r.json(); goEntry = Array.isArray(d) ? d[0] : d; }
    } catch { /* leave null */ }
  }

  // Moves — quickMoves and cinematicMoves are objects keyed by move ID
  const toArr = obj =>
    obj && !Array.isArray(obj) ? Object.values(obj) : (obj || []);

  const fastMoves   = toArr(goEntry?.quickMoves).slice(0, 4).map(m => ({
    name: m.names?.English || (m.id || '').replace(/_FAST$/, '').replace(/_/g, ' ') || '?',
    type: goTypeToSlug(m.type?.type || ''),
  }));
  const chargeMoves = toArr(goEntry?.cinematicMoves).slice(0, 4).map(m => ({
    name: m.names?.English || (m.id || '').replace(/_/g, ' ') || '?',
    type: goTypeToSlug(m.type?.type || ''),
  }));

  // ── Load images ───────────────────────────────────────────────────────
  const imgs = await rc_loadImages(poke, counters, goEntry);

  // ════════════════════════ RENDER ════════════════════════════════════

  // ── Background ────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0,   '#1b1b2e');
  bg.addColorStop(1,   '#111122');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Type colour splash top-right
  const splash = ctx.createRadialGradient(CARD_W * 0.82, 0, 0, CARD_W * 0.82, 0, 600);
  splash.addColorStop(0,   rc_hexA(primaryCol, 0.45));
  splash.addColorStop(0.5, rc_hexA(secondCol,  0.18));
  splash.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = splash;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ────────────────────────────────────────────────────────────────────
  // SECTION 1 — top block  (y: 0 → 520)
  //   Left col  x: 44   → 580   (text + stats)
  //   Right col x: 580  → 1036  (main sprite)
  // ────────────────────────────────────────────────────────────────────
  const S1_H    = 520;
  const LEFT_X  = P;
  const LEFT_W  = 530;
  const RIGHT_X = 590;
  const RIGHT_W = CARD_W - RIGHT_X - P;

  // Dex number (small, above name)
  rc_txt(ctx, `No. ${poke.id}`, LEFT_X, P + 36,
    '600 28px Inter, sans-serif', 'rgba(255,255,255,0.45)');

  // Name
  const dispName = fmtName(poke.name);
  ctx.font = '800 72px Inter, sans-serif';
  let nameFont = '800 72px Inter, sans-serif';
  while (ctx.measureText(dispName).width > LEFT_W && parseInt(nameFont) > 36) {
    const sz = parseInt(nameFont) - 4;
    nameFont = `800 ${sz}px Inter, sans-serif`;
    ctx.font = nameFont;
  }
  rc_txt(ctx, dispName, LEFT_X, P + 104, nameFont, '#ffffff', 'left', LEFT_W);

  // Shadow / Purified tag
  if (shadowType) {
    const sc  = shadowType === 'shadow' ? '#c084fc' : '#22d3ee';
    const lbl = shadowType === 'shadow' ? '✦ Shadow' : '✦ Purified';
    rc_txt(ctx, lbl, LEFT_X + 4, P + 138, '600 22px Inter, sans-serif', sc);
  }

  // Type pills
  let tx = LEFT_X;
  const TYPE_ROW_Y = P + 158;
  for (const t of types) {
    const bw = rc_typePill(ctx, t, tx, TYPE_ROW_Y, imgs);
    tx += bw + 10;
  }

  // ── Stat bars ─────────────────────────────────────────────────────────
  const BAR_START = TYPE_ROW_Y + 56;
  const BAR_H     = 26;
  const BAR_GAP   = 42;
  const BAR_X     = LEFT_X + 84;
  const BAR_W     = 390;
  const statRows  = [
    { lbl: 'HP',  val: hpStat,  col: '#4ade80', max: 500 },
    { lbl: 'ATK', val: atkStat, col: '#f87171', max: 400 },
    { lbl: 'DEF', val: defStat, col: '#60a5fa', max: 400 },
  ];

  statRows.forEach(({ lbl, val, col, max }, i) => {
    const y = BAR_START + i * BAR_GAP;
    // Label
    rc_txtMid(ctx, lbl, LEFT_X, y + BAR_H / 2, '800 26px Inter, sans-serif', '#fff');
    // Track
    rc_rrect(ctx, BAR_X, y, BAR_W, BAR_H, 13);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
    // Fill
    const fw = Math.max(BAR_H, BAR_W * Math.min(1, val / max));
    rc_rrect(ctx, BAR_X, y, fw, BAR_H, 13);
    ctx.fillStyle = col; ctx.fill();
    // Value
    rc_txtMid(ctx, String(val), BAR_X + 10, y + BAR_H / 2,
      '700 17px Inter, sans-serif', '#000');
  });

  // ── CP / weather / weaknesses ─────────────────────────────────────────
  let IY = BAR_START + statRows.length * BAR_GAP + 24;
  const IL = 36;   // line height

  const infoRow = (label, value, valCol = '#fff') => {
    ctx.font = '600 22px Inter, sans-serif';
    const lw = ctx.measureText(label).width;
    rc_txt(ctx, label, LEFT_X, IY, '600 22px Inter, sans-serif', 'rgba(255,255,255,0.6)');
    rc_txt(ctx, value, LEFT_X + lw + 8, IY, '700 22px Inter, sans-serif', valCol, 'left', LEFT_W - lw - 8);
    IY += IL;
  };

  infoRow('Catch CP:', `${cpMin.toLocaleString()} – ${cpMax.toLocaleString()}`);
  infoRow('Boosted CP:', `${cpBMin.toLocaleString()} – ${cpBMax.toLocaleString()}`);
  if (weatherLabels.length > 0) {
    infoRow('Boosted By:', weatherLabels.join('  '), '#93c5fd');
  }

  // Weak to: (dots on same row)
  rc_txt(ctx, 'Weak to:', LEFT_X, IY, '600 22px Inter, sans-serif', 'rgba(255,255,255,0.6)');
  ctx.font = '600 22px Inter, sans-serif';
  const wlw = ctx.measureText('Weak to:').width;
  let wx = LEFT_X + wlw + 14;
  const DOT_R  = 17;
  const DOT_SP = DOT_R * 2 + 6;
  for (const wt of weakTypes) {
    if (wx + DOT_R * 2 > LEFT_X + LEFT_W) break;
    rc_typeIcon(ctx, wt, wx, IY - DOT_R + 4, DOT_R, imgs);
    wx += DOT_SP;
  }
  IY += IL;

  // ── Main sprite ───────────────────────────────────────────────────────
  if (imgs.main) {
    const SS  = 430;
    const sx  = RIGHT_X + (RIGHT_W - SS) / 2;
    const sy  = P - 10;
    // Glow
    const gl = ctx.createRadialGradient(sx + SS/2, sy + SS/2, 30, sx + SS/2, sy + SS/2, 220);
    gl.addColorStop(0,   rc_hexA(primaryCol, 0.50));
    gl.addColorStop(0.6, rc_hexA(primaryCol, 0.18));
    gl.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gl; ctx.fillRect(sx, sy, SS, SS);
    ctx.drawImage(imgs.main, sx, sy, SS, SS);
  }

  // ── Divider ───────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(P, S1_H); ctx.lineTo(CARD_W - P, S1_H); ctx.stroke();

  // ────────────────────────────────────────────────────────────────────
  // SECTION 2 — moves + shiny  (y: 520 → 790)
  //   Col A Fast Moves   x: 44
  //   Col B Charge Moves x: 380
  //   Col C Shiny        x: 720
  // ────────────────────────────────────────────────────────────────────
  const S2_Y   = S1_H + 28;
  const MCOL_A = P;
  const MCOL_B = 380;
  const MCOL_C = 720;

  const HEAD_FONT = '800 24px Inter, sans-serif';
  const MOVE_FONT = '600 20px Inter, sans-serif';
  const MOVE_H    = 42;   // row height per move

  rc_txt(ctx, 'Fast Moves',   MCOL_A, S2_Y + 24, HEAD_FONT, '#fff');
  rc_txt(ctx, 'Charge Moves', MCOL_B, S2_Y + 24, HEAD_FONT, '#fff');
  rc_txt(ctx, 'Shiny',        MCOL_C, S2_Y + 24, HEAD_FONT, '#fff');

  const drawMoves = (list, colX, startY) => {
    if (list.length === 0) {
      rc_txt(ctx, '—', colX + 8, startY + 22, MOVE_FONT, 'rgba(255,255,255,0.3)');
      return;
    }
    list.forEach((m, i) => {
      const rowMidY = startY + i * MOVE_H + MOVE_H / 2;
      // Real type icon
      rc_typeIcon(ctx, m.type, colX, rowMidY, 16, imgs);
      // Move name
      rc_txtMid(ctx, m.name, colX + 42, rowMidY, MOVE_FONT, '#f0f0f6', 'left', 290);
    });
  };

  drawMoves(fastMoves,   MCOL_A, S2_Y + 34);
  drawMoves(chargeMoves, MCOL_B, S2_Y + 34);

  // Shiny sprite
  if (imgs.shiny) {
    ctx.drawImage(imgs.shiny, MCOL_C, S2_Y + 28, 230, 230);
  } else {
    rc_txt(ctx, 'N/A', MCOL_C + 50, S2_Y + 100, MOVE_FONT, 'rgba(255,255,255,0.3)');
  }

  // ── Divider 2 ─────────────────────────────────────────────────────────
  const S3_TOP = S2_Y + 280;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(P, S3_TOP); ctx.lineTo(CARD_W - P, S3_TOP); ctx.stroke();

  // ────────────────────────────────────────────────────────────────────
  // SECTION 3 — counters  (y: S3_TOP → CH - footer)
  // ────────────────────────────────────────────────────────────────────
  const C_Y   = S3_TOP + 16;
  const C_IW  = (CARD_W - P * 2) / 6;

  rc_txt(ctx, 'Top Counters', P, C_Y + 28, '800 26px Inter, sans-serif', '#fff');

  const CI_Y  = C_Y + 44;   // sprite top
  const CI_S  = 120;        // sprite size
  const CN_Y  = CI_Y + CI_S + 14;   // name y
  const CE_Y  = CN_Y + 24;          // eff label y
  const CD_Y  = CE_Y + 20;          // type dot centre y

  for (let ci = 0; ci < counters.length; ci++) {
    const c   = counters[ci];
    const cx  = P + ci * C_IW;
    const mid = cx + C_IW / 2;

    // Sprite
    const cImg = imgs[`ctr_${c.name}`];
    if (cImg) ctx.drawImage(cImg, cx + (C_IW - CI_S) / 2, CI_Y, CI_S, CI_S);

    // Name
    rc_txt(ctx, fmtName(c.name), mid, CN_Y, '700 17px Inter, sans-serif', '#f0f0f6', 'center', C_IW - 8);

    // Effectiveness
    const effL = c.eff >= 3.9 ? '4×' : c.eff >= 2.5 ? '2.56×' : c.eff >= 1.95 ? '2×' : '1.6×';
    const effC = c.eff >= 3.9 ? '#f87171' : c.eff >= 2.5 ? '#fb923c' : c.eff >= 1.95 ? '#fbbf24' : '#a3e635';
    rc_txt(ctx, effL, mid, CE_Y, '700 15px Inter, sans-serif', effC, 'center');

    // Best move type icon
    rc_typeIcon(ctx, c.bestMoveType, mid - 14, CD_Y + 12, 14, imgs);
  }

  // ── Footer ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, CARD_H - 46, CARD_W, 46);

  const FMY = CARD_H - 23;
  rc_txtMid(ctx, 'GO Dex',
    P, FMY, '700 18px Inter, sans-serif', 'rgba(255,255,255,0.5)');
  rc_txtMid(ctx, 'Data: PokéAPI · pokemon-go-api · LeekDuck / ScrapedDuck',
    CARD_W / 2, FMY, '500 15px Inter, sans-serif', 'rgba(255,255,255,0.3)', 'center');
  rc_txtMid(ctx, 'Not affiliated with Niantic or Nintendo',
    CARD_W - P, FMY, '500 13px Inter, sans-serif', 'rgba(255,255,255,0.2)', 'right');
}

// ═══════════════════════════ REACT MODAL ═════════════════════════════════

function RaidExportCard({ poke, species, gs, shadowType, onClose }) {
  const canvasRef = React.useRef(null);
  const [status,  setStatus]  = React.useState('rendering');
  const [dataUrl, setDataUrl] = React.useState(null);

  React.useEffect(() => {
    if (!poke || !gs || !canvasRef.current) return;
    setStatus('rendering');
    setDataUrl(null);

    rc_draw(canvasRef.current, poke, species, gs, shadowType)
      .then(() => {
        try {
          setDataUrl(canvasRef.current.toDataURL('image/png'));
        } catch { /* CORS tainted canvas — preview still works */ }
        setStatus('done');
      })
      .catch(err => { console.error('Raid card error:', err); setStatus('error'); });
  }, [poke?.name, gs, shadowType]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href     = dataUrl;
    a.download = `${fmtName(poke.name).replace(/\s+/g, '_')}_raid_card.png`;
    a.click();
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
    >
      <div style={{
        background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--border2)',
        padding: 20, maxWidth: 720, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: '0 32px 80px rgba(0,0,0,.95)',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Raid Card Export</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{fmtName(poke.name)}</div>
          </div>
          <button className="btn" onClick={onClose}>✕ Close</button>
        </div>

        {/* Status */}
        {status === 'rendering' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 13 }}>
            <Spinner /> Loading sprites &amp; building card…
          </div>
        )}
        {status === 'error' && (
          <div style={{ color: '#f87171', fontSize: 13 }}>⚠️ Failed to render. Check console.</div>
        )}

        {/* Canvas preview */}
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', lineHeight: 0 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        {/* Download */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className={`btn${dataUrl ? ' primary' : ''}`}
            disabled={!dataUrl}
            style={!dataUrl ? { opacity: 0.4 } : {}}
            onClick={download}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PNG
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--dim)', textAlign: 'center', margin: 0 }}>
          Data: PokéAPI · pokemon-go-api · LeekDuck / ScrapedDuck · Not affiliated with Niantic or Nintendo
        </p>
      </div>
    </div>
  );
}
