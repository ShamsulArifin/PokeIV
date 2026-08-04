// ── CP / HP formulas ──────────────────────────────────────────────────────
const calcCP = (a, d, h, aIV, dIV, hIV, lv) =>
  Math.max(10, Math.floor((a+aIV) * Math.pow(d+dIV, .5) * Math.pow(h+hIV, .5) * (CPM[lv]||.79)**2 / 10));

const calcHP = (h, hIV, lv) =>
  Math.max(10, Math.floor((h+hIV) * (CPM[lv]||.79)));

// ── String helpers ────────────────────────────────────────────────────────
const cap   = s => s ? s[0].toUpperCase() + s.slice(1) : '';
const padId = id => String(id).padStart(4, '0');
const idFromUrl = url => { const m = url.match(/\/(\d+)\/$/); return m ? parseInt(m[1]) : 0; };

// ── Pokémon GO stat conversion ────────────────────────────────────────────
function goStats(poke) {
  const s = {};
  poke.stats.forEach(x => s[x.stat.name] = x.base_stat);
  return {
    atk: Math.max(1, Math.round((s.attack + s['special-attack']) * .875 + s.speed * .125)),
    def: Math.max(1, Math.round((s.defense + s['special-defense']) * .875 + s.speed * .125)),
    hp:  Math.max(1, Math.floor(s.hp * 1.75 + 50)),
    raw: s,
  };
}

// ── Type weakness calculator ──────────────────────────────────────────────
function typeWeaknesses(types) {
  const eff = {};
  types.forEach(t => Object.entries(TYPE_EFF[t] || {}).forEach(([at, m]) => {
    eff[at] = (eff[at] || 1) * m;
  }));
  const weak = [], resist = [], immune = [];
  Object.entries(eff).forEach(([t, m]) => {
    if (m >= 2)  weak.push({t, m});
    else if (m === 0) immune.push({t});
    else if (m < 1)   resist.push({t, m});
  });
  return { weak, resist, immune };
}

// ── Weather boost lookup ──────────────────────────────────────────────────
function weatherForTypes(types) {
  return Object.values(WEATHER)
    .filter(w => types.some(t => w.types.includes(t)))
    .map(w => w.label);
}

// ── Counter scoring ───────────────────────────────────────────────────────
function typeEffVs(attackType, defTypes) {
  let m = 1;
  defTypes.forEach(dt => { m *= (TYPE_EFF[dt] || {})[attackType] ?? 1; });
  return m;
}

function scoredCounters(defTypes) {
  const seen = new Set(), out = [];
  for (const c of COUNTERS) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    let best = 0, bestT = '';
    for (const t of [c.move, ...c.types]) {
      if (!t) continue;
      const e = typeEffVs(t, defTypes);
      if (e > best) { best = e; bestT = t; }
    }
    if (best >= 1.6) out.push({ ...c, eff: best, bestMoveType: bestT });
  }
  out.sort((a, b) => b.eff - a.eff);
  return out.slice(0, 10);
}

// ── Reverse CP lookup ─────────────────────────────────────────────────────
// Given a target CP and a Pokémon's GO stats, find every (level, IVs) combo.
function reverseLookup(gs, target) {
  const rows = [];
  const lvs = Object.keys(CPM).map(Number).sort((a, b) => a - b);
  for (const lv of lvs) {
    for (let a = 0; a <= 15; a++) {
      for (let d = 0; d <= 15; d++) {
        for (let h = 0; h <= 15; h++) {
          if (calcCP(gs.atk, gs.def, gs.hp, a, d, h, lv) === target) {
            rows.push({ lv, a, d, h, pct: Math.round(((a+d+h)/45)*100) });
          }
        }
      }
    }
  }
  return rows;
}

// ── Form tag helper ───────────────────────────────────────────────────────
function getFormTag(name) {
  if (name.endsWith('-shadow'))   return { tag:'Shadow',    c:'#7c3aed' };
  if (name.endsWith('-purified')) return { tag:'Purified',  c:'#0891b2' };
  if (name.includes('-alola'))   return { tag:'Alolan',    c:'#d97706' };
  if (name.includes('-galar'))   return { tag:'Galarian',  c:'#db2777' };
  if (name.includes('-hisui'))   return { tag:'Hisuian',   c:'#65a30d' };
  if (name.includes('-paldea'))  return { tag:'Paldean',   c:'#ea580c' };
  if (name.includes('-mega'))    return { tag:'Mega',      c:'#4f46e5' };
  if (name.includes('-gmax'))    return { tag:'G-Max',     c:'#dc2626' };
  if (name.includes('-primal'))  return { tag:'Primal',    c:'#b91c1c' };
  if (name.includes('-origin'))  return { tag:'Origin',    c:'#7c3aed' };
  if (name.includes('-therian')) return { tag:'Therian',   c:'#0d9488' };
  return null;
}

// ── Display name formatter ────────────────────────────────────────────────
function fmtName(name) {
  return name
    .replace(/-mega-([xy])$/, (_, c) => ` Mega ${c.toUpperCase()}`)
    .replace(/-mega$/,    ' Mega')
    .replace(/-gmax$/,    ' G-Max')
    .replace(/-alola$/,   ' (Alolan)')
    .replace(/-galar$/,   ' (Galarian)')
    .replace(/-hisui$/,   ' (Hisuian)')
    .replace(/-paldea$/,  ' (Paldean)')
    .replace(/-primal$/,  ' (Primal)')
    .replace(/-origin$/,  ' (Origin)')
    .replace(/-therian$/, ' (Therian)')
    .split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
