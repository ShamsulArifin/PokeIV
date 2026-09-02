// ── Correct CPM values ────────────────────────────────────────────────────
// Whole-level CPMs sourced from Niantic Game Master (levels 1–51).
// Half-levels derived via quadratic mean: sqrt((CPM[L]² + CPM[L+1]²) / 2)
// Reference: https://github.com/16-Observer/PokemonGoCPCalc/blob/main/calc.js
const _WHOLE_CPM = [
  0.09399414, // 1
  0.16639787, // 2
  0.21573247, // 3
  0.25572005, // 4
  0.29024988, // 5
  0.32108760, // 6
  0.34921268, // 7
  0.37523559, // 8
  0.39956728, // 9
  0.42250003, // 10
  0.44310755, // 11
  0.46279839, // 12
  0.48168495, // 13
  0.49984500, // 14
  0.51735985, // 15
  0.53430003, // 16
  0.55070996, // 17
  0.56663001, // 18
  0.58209556, // 19
  0.59740001, // 20
  0.61150000, // 21
  0.62560000, // 22
  0.63970000, // 23
  0.65380000, // 24
  0.66790000, // 25
  0.68066000, // 26
  0.69342000, // 27
  0.70618000, // 28
  0.71894000, // 29
  0.73170000, // 30
  0.73760000, // 31
  0.74350000, // 32
  0.74940000, // 33
  0.75530000, // 34
  0.76120000, // 35
  0.76702000, // 36
  0.77284000, // 37
  0.77866000, // 38
  0.78448000, // 39
  0.79030000, // 40
  0.79440000, // 41
  0.79850000, // 42
  0.80260000, // 43
  0.80670000, // 44
  0.81080000, // 45
  0.81670000, // 46
  0.82260000, // 47
  0.82850000, // 48
  0.83440000, // 49
  0.84030000, // 50
  0.91710000, // 51 — Best Buddy
];

// Build the full CPM map: levels 1, 1.5, 2, … 50.5, 51
const CPM = {};
const LEVELS = [];
for (let i = 0; i < 51; i++) {
  const L = i + 1;
  CPM[L] = _WHOLE_CPM[i];
  LEVELS.push(L);
  if (i < 50) {
    const halfL = L + 0.5;
    // Quadratic mean — the only correct way to derive half-level CPM
    CPM[halfL] = Math.sqrt((_WHOLE_CPM[i] ** 2 + _WHOLE_CPM[i + 1] ** 2) / 2);
    LEVELS.push(halfL);
  }
}
// LEVELS is now [1, 1.5, 2, 2.5, … 50, 50.5, 51] — 101 entries

// ── CP / HP formulas (from Niantic Game Master) ───────────────────────────
// CP = max(10, floor( (baseAtk+atkIV) × √(baseDef+defIV) × √(baseSta+staIV) × CPM² / 10 ))
// HP = max(10, floor( (baseSta+staIV) × CPM ))
//
// IMPORTANT: baseAtk, baseDef, baseSta are the GO-specific base stats
// (from the Game Master / pokemon-go-api), NOT derived from main-game stats.

const calcCP = (baseAtk, baseDef, baseSta, atkIV, defIV, staIV, lv) => {
  const cpm = CPM[lv] || CPM[40];
  return Math.max(10, Math.floor(
    (baseAtk + atkIV) *
    Math.sqrt(baseDef + defIV) *
    Math.sqrt(baseSta + staIV) *
    cpm * cpm /
    10
  ));
};

const calcHP = (baseSta, staIV, lv) =>
  Math.max(10, Math.floor((baseSta + staIV) * (CPM[lv] || CPM[40])));

// ── Quick verification (matches the test vectors from calc.js) ────────────
// calcCP(300, 182, 214, 15, 15, 15, 40) === 4178  ✓  Mewtwo hundo lv40
// calcCP(300, 182, 214, 15, 15, 15, 20) === 2387  ✓  Mewtwo hundo lv20

// ── GO base stats ─────────────────────────────────────────────────────────
// Primary source: pokemon-go-api pokedex (loaded once via fetchList() in api.js).
// The goPokedexByFormId / goPokedexByName maps are populated there.
// getGoStatsFromCache(formId) does a synchronous lookup into those maps.
//
// Fallback: per-pokemon fetch from the pokemon-go-api individual endpoint.
const _goStatsFetchCache = {};

async function fetchGoStatsDirect(name) {
  if (_goStatsFetchCache[name]) return _goStatsFetchCache[name];
  try {
    const id = name.toUpperCase().replace(/-/g, '_');
    const url = `https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex/id/${id}.json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('not found');
    const data = await r.json();
    const entry = Array.isArray(data) ? data[0] : data;
    const s = entry?.stats;
    if (!s) throw new Error('no stats');
    const result = { atk: s.attack, def: s.defense, hp: s.stamina };
    _goStatsFetchCache[name] = result;
    return result;
  } catch {
    return null;
  }
}

// ── Fallback: approximate GO stats from main-game stats (PokeAPI) ─────────
// Used only when pokemon-go-api is unavailable.
// Formula documented at: https://gamepress.gg/pokemongo/pokemon-go-stat-conversion
function goStatsFromMainGame(poke) {
  const s = {};
  poke.stats.forEach(x => { s[x.stat.name] = x.base_stat; });
  const mainAtk  = s['attack']   || 0;
  const mainSpAtk = s['special-attack'] || 0;
  const mainDef  = s['defense']  || 0;
  const mainSpDef = s['special-defense'] || 0;
  const mainSpd  = s['speed']    || 0;
  const mainHp   = s['hp']       || 0;

  // Nerf highest of {Atk, SpAtk}, buff lowest; same for Def/SpDef
  const [hiA, loA] = mainAtk >= mainSpAtk ? [mainAtk, mainSpAtk] : [mainSpAtk, mainAtk];
  const [hiD, loD] = mainDef >= mainSpDef ? [mainDef, mainSpDef] : [mainSpDef, mainDef];

  const goAtk  = Math.round(2 * (7/8 * hiA + 1/8 * loA) + mainSpd / 4);
  const goDef  = Math.round(2 * (7/8 * hiD + 1/8 * loD) + mainSpd / 4);
  const goSta  = Math.floor(mainHp * 1.75 + 50);

  return {
    atk: Math.max(1, goAtk),
    def: Math.max(1, goDef),
    hp:  Math.max(1, goSta),
  };
}

// ── Combined GO stats resolver ────────────────────────────────────────────
// 1. Try in-memory pokedex cache (populated by fetchList → pokemon-go-api).
// 2. Try direct per-pokemon fetch from pokemon-go-api.
// 3. Fall back to main-game stat approximation.
async function resolveGoStats(poke) {
  // poke.formId is set when coming from App.js (hint derived from name)
  if (poke.formId) {
    const cached = getGoStatsFromCache(poke.formId);
    if (cached) return cached;
  }

  // Try by name slug (handles shadow/purified virtual entries)
  const baseName = poke.baseName || poke.name;
  const slugForCache = baseName
    .replace(/-shadow$/, '').replace(/-purified$/, '');

  const bySlug = getGoStatsFromCache(slugForCache);
  if (bySlug) return bySlug;

  // Handle PokeAPI → GO API name mismatches for regional forms
  // PokeAPI: rattata-alolan  →  GO API key: rattata-alola
  // PokeAPI: meowth-galarian →  GO API key: meowth-galar
  const normalized = slugForCache
    .replace(/-alolan$/, '-alola')
    .replace(/-galarian$/, '-galar')
    .replace(/-hisuian$/, '-hisui')
    .replace(/-paldean$/, '-paldea');
  if (normalized !== slugForCache) {
    const byNorm = getGoStatsFromCache(normalized);
    if (byNorm) return byNorm;
  }

  // Direct API fetch as fallback (also tries normalized name)
  const fromApi = await fetchGoStatsDirect(normalized);
  if (fromApi) return fromApi;

  // Last resort: approximate from main-game stats
  return goStatsFromMainGame(poke);
}

// ── String helpers ────────────────────────────────────────────────────────
const cap   = s => s ? s[0].toUpperCase() + s.slice(1) : '';
const padId = id => String(id).padStart(4, '0');
const idFromUrl = url => { const m = url.match(/\/(\d+)\/$/); return m ? parseInt(m[1]) : 0; };

// ── IV % helpers ──────────────────────────────────────────────────────────
const ivPct = (a, d, h) => Math.round((a + d + h) / 45 * 100);

// ── Type weakness calculator ──────────────────────────────────────────────
function typeWeaknesses(types) {
  const eff = {};
  types.forEach(t => Object.entries(TYPE_EFF[t] || {}).forEach(([at, m]) => {
    eff[at] = (eff[at] || 1) * m;
  }));
  const weak = [], resist = [], immune = [];
  Object.entries(eff).forEach(([t, m]) => {
    if (m >= 2) weak.push({t, m});
    else if (m === 0) immune.push({t});
    else if (m < 1)  resist.push({t, m});
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
// Brute-force all IV combos for a given CP (matches reference implementation)
function reverseLookup(goStats, target, opts = {}) {
  const { minIV = 0, pinLevel = null, minLevel = 1, maxLevel = 51 } = opts;
  const rows = [];
  const lvs = pinLevel
    ? [pinLevel]
    : LEVELS.filter(l => l >= minLevel && l <= maxLevel);

  for (const lv of lvs) {
    for (let a = minIV; a <= 15; a++) {
      for (let d = minIV; d <= 15; d++) {
        for (let h = minIV; h <= 15; h++) {
          if (calcCP(goStats.atk, goStats.def, goStats.hp, a, d, h, lv) === target) {
            rows.push({ lv, a, d, h, pct: ivPct(a, d, h) });
          }
        }
      }
    }
  }
  return rows;
}

// ── Form tag helper ───────────────────────────────────────────────────────
function getFormTag(name) {
  if (name.endsWith('-shadow'))   return { tag: 'Shadow',   c: '#7c3aed' };
  if (name.endsWith('-purified')) return { tag: 'Purified', c: '#0891b2' };
  if (name.includes('-alola'))   return { tag: 'Alolan',   c: '#d97706' };
  if (name.includes('-galar'))   return { tag: 'Galarian', c: '#db2777' };
  if (name.includes('-hisui'))   return { tag: 'Hisuian',  c: '#65a30d' };
  if (name.includes('-paldea'))  return { tag: 'Paldean',  c: '#ea580c' };
  if (name.includes('-mega'))    return { tag: 'Mega',     c: '#4f46e5' };
  if (name.includes('-gmax'))    return { tag: 'G-Max',    c: '#dc2626' };
  if (name.includes('-primal'))  return { tag: 'Primal',   c: '#b91c1c' };
  if (name.includes('-origin'))  return { tag: 'Origin',   c: '#7c3aed' };
  if (name.includes('-therian')) return { tag: 'Therian',  c: '#0d9488' };
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
