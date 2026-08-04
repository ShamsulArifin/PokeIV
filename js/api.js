// ── In-memory cache for all API responses ─────────────────────────────────
const cache = {};

// ── Pokémon data ──────────────────────────────────────────────────────────
const fetchPoke = async k => {
  k = String(k).toLowerCase();
  if (cache[k]) return cache[k];
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${k}`);
  if (!r.ok) throw new Error(`Pokemon not found: ${k}`);
  return (cache[k] = await r.json());
};

// ── Species data (flavor text, genera, evolution chain URL) ───────────────
const fetchSpecies = async k => {
  const ck = `sp_${k}`;
  if (cache[ck]) return cache[ck];
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${k}`);
  if (!r.ok) return null;
  return (cache[ck] = await r.json());
};

// ── Evolution chain ───────────────────────────────────────────────────────
const fetchEvoChain = async url => {
  if (cache[url]) return cache[url];
  const r = await fetch(url);
  if (!r.ok) return null;
  return (cache[url] = await r.json());
};

// ── Full Pokémon list (base + shadow/purified virtual entries) ────────────
async function fetchList() {
  if (cache._list) return cache._list;

  const r = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000&offset=0');
  const data = await r.json();

  // Base list from PokeAPI
  const list = data.results.map(p => {
    const id = idFromUrl(p.url);
    return {
      name: p.name,
      id,
      dn: fmtName(p.name),
      tag: getFormTag(p.name),
      sid: id,         // sprite ID (same as id for base forms)
      virtual: false,
    };
  });

  // Inject Shadow + Purified virtual entries for eligible Pokémon
  SHADOW_IDS.forEach(id => {
    const base = list.find(p => p.id === id && !p.name.includes('-'));
    if (!base) return;

    list.push({
      name: base.name + '-shadow',
      id,
      dn: fmtName(base.name) + ' (Shadow)',
      tag: { tag: 'Shadow', c: '#7c3aed' },
      sid: id,
      virtual: true,
      shadowType: 'shadow',
      baseName: base.name,
    });

    list.push({
      name: base.name + '-purified',
      id,
      dn: fmtName(base.name) + ' (Purified)',
      tag: { tag: 'Purified', c: '#0891b2' },
      sid: id,
      virtual: true,
      shadowType: 'purified',
      baseName: base.name,
    });
  });

  return (cache._list = list);
}
