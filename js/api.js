// ── In-memory cache for all API responses ─────────────────────────────────
const cache = {};

// ── pokemon-go-api base URL ───────────────────────────────────────────────
const GO_API = 'https://pokemon-go-api.github.io/pokemon-go-api/api';

// ── GO Pokédex (full list from pokemon-go-api) ────────────────────────────
// Populated once by fetchList(); keyed by formId for stat lookups.
const goPokedexByFormId = {};   // formId → raw api entry (has .stats, .primaryType, etc.)
const goPokedexByName   = {};   // lowercase slug (for PokeAPI compat) → same entry

// ── Pokémon data (PokeAPI — for evolution chains, sprites, species) ───────
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

// ── Type string from GO API type key ─────────────────────────────────────
// e.g. "POKEMON_TYPE_FIRE" → "fire"
function goTypeToSlug(typeKey) {
  return typeKey.replace('POKEMON_TYPE_', '').toLowerCase();
}

// ── Build a normalized list entry from a GO API entry ────────────────────
// Returns null if the entry should be skipped (temp/event-only forms, etc.)
function buildEntryFromGo(goEntry, overrideName, overrideTag) {
  const formId = goEntry.formId || goEntry.id;
  const dexNr  = goEntry.dexNr;
  const name   = goEntry.names?.English || formId;

  // Derive a slug (lowercase, underscores→dashes) for PokeAPI compat
  const slug = formId.toLowerCase().replace(/_/g, '-');

  // Determine sprite ID: pokemon-go-api provides pm{dexNr}... icons
  // We also map to PokeAPI sprite ID for fallback
  const pokeapiSid = pokeapiSpriteId(slug, dexNr);

  const types = [];
  if (goEntry.primaryType)   types.push(goTypeToSlug(goEntry.primaryType.type));
  if (goEntry.secondaryType) types.push(goTypeToSlug(goEntry.secondaryType.type));

  // Store in lookup maps
  goPokedexByFormId[formId] = goEntry;
  goPokedexByName[slug]     = goEntry;

  return {
    name:     slug,
    id:       dexNr,
    dn:       overrideName || name,
    tag:      overrideTag  || getFormTag(slug),
    sid:      pokeapiSid,          // PokeAPI sprite numeric ID (or slug)
    goImg:    goEntry.assets?.image || null,
    goImgShiny: goEntry.assets?.shinyImage || null,
    types,
    formId,
    virtual:  false,
  };
}

// ── Map GO formId slug to PokeAPI sprite numeric ID ───────────────────────
// For base forms: dex number works. For alt forms: use dex number as fallback
// since we primarily use goImg now. Alt form PokeAPI IDs are inconsistent.
function pokeapiSpriteId(slug, dexNr) {
  // For all forms, return the dex number as the PokeAPI sprite fallback.
  // The primary source is now goImg from the GO API.
  return dexNr;
}

// ── Full Pokémon list from pokemon-go-api ─────────────────────────────────
async function fetchList() {
  if (cache._list) return cache._list;

  let goData;
  try {
    const r = await fetch(`${GO_API}/pokedex.json`);
    if (!r.ok) throw new Error('GO API unavailable');
    goData = await r.json();
  } catch (e) {
    console.warn('pokemon-go-api unavailable, falling back to PokeAPI', e);
    return fetchListFallback();
  }

  const list = [];
  const seenNames = new Set();

  for (const entry of goData) {
    // Skip pure event/costume-only entries that lack stats
    if (!entry.stats) continue;

    // ── Base form ──────────────────────────────────────────────────────
    const base = buildEntryFromGo(entry);
    if (base && !seenNames.has(base.name)) {
      seenNames.add(base.name);
      list.push(base);
    }

    // ── Region forms (Alolan, Galarian, Hisuian, Paldean, etc.) ───────
    if (entry.regionForms && typeof entry.regionForms === 'object' && !Array.isArray(entry.regionForms)) {
      for (const rf of Object.values(entry.regionForms)) {
        if (!rf.stats) continue;
        // regionForms already have dexNr set
        const rfEntry = buildEntryFromGo(rf);
        if (rfEntry && !seenNames.has(rfEntry.name)) {
          seenNames.add(rfEntry.name);
          list.push(rfEntry);
        }
      }
    }

    // ── Mega evolutions ────────────────────────────────────────────────
    if (entry.megaEvolutions && typeof entry.megaEvolutions === 'object') {
      for (const [megaId, megaData] of Object.entries(entry.megaEvolutions)) {
        if (!megaData.stats) continue;
        const megaSlug = megaId.toLowerCase().replace(/_/g, '-');
        const megaName = megaData.names?.English || megaSlug;
        const megaEntry = {
          ...megaData,
          formId: megaId,
          dexNr: entry.dexNr,
          assets: megaData.assets || entry.assets,
        };
        const me = buildEntryFromGo(megaEntry, megaName, { tag: 'Mega', c: '#4f46e5' });
        if (me && !seenNames.has(me.name)) {
          seenNames.add(me.name);
          list.push(me);
        }
      }
    }
  }

  // ── Shadow + Purified virtual entries ─────────────────────────────────
  // Only for Pokémon in SHADOW_IDS that exist in our list as base forms
  const baseById = {};
  list.forEach(p => {
    if (!p.tag && !p.virtual && !String(p.name).includes('-mega') && !String(p.name).includes('-primal')) {
      if (!baseById[p.id] || p.name === String(p.id)) {
        baseById[p.id] = p;
      }
    }
  });

  SHADOW_IDS.forEach(id => {
    const base = baseById[id];
    if (!base) return;

    list.push({
      name:     base.name + '-shadow',
      id,
      dn:       base.dn + ' (Shadow)',
      tag:      { tag: 'Shadow', c: '#7c3aed' },
      sid:      base.sid,
      goImg:    base.goImg,
      goImgShiny: base.goImgShiny,
      types:    base.types,
      formId:   base.formId,
      virtual:  true,
      shadowType: 'shadow',
      baseName: base.name,
    });

    list.push({
      name:     base.name + '-purified',
      id,
      dn:       base.dn + ' (Purified)',
      tag:      { tag: 'Purified', c: '#0891b2' },
      sid:      base.sid,
      goImg:    base.goImg,
      goImgShiny: base.goImgShiny,
      types:    base.types,
      formId:   base.formId,
      virtual:  true,
      shadowType: 'purified',
      baseName: base.name,
    });
  });

  // Sort: by dex number, then base before variants, then shadow/purified last
  list.sort((a, b) => {
    if (a.id !== b.id) return a.id - b.id;
    const aScore = a.virtual ? 2 : (a.tag ? 1 : 0);
    const bScore = b.virtual ? 2 : (b.tag ? 1 : 0);
    return aScore - bScore;
  });

  return (cache._list = list);
}

// ── Fallback: use PokeAPI if pokemon-go-api is unavailable ────────────────
async function fetchListFallback() {
  const r = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000&offset=0');
  const data = await r.json();
  const list = data.results.map(p => {
    const id = idFromUrl(p.url);
    return {
      name: p.name,
      id,
      dn: fmtName(p.name),
      tag: getFormTag(p.name),
      sid: id,
      virtual: false,
    };
  });

  SHADOW_IDS.forEach(id => {
    const base = list.find(p => p.id === id && !p.name.includes('-'));
    if (!base) return;
    list.push({
      name: base.name + '-shadow',   id, dn: fmtName(base.name) + ' (Shadow)',
      tag: { tag: 'Shadow', c: '#7c3aed' }, sid: id, virtual: true,
      shadowType: 'shadow', baseName: base.name,
    });
    list.push({
      name: base.name + '-purified', id, dn: fmtName(base.name) + ' (Purified)',
      tag: { tag: 'Purified', c: '#0891b2' }, sid: id, virtual: true,
      shadowType: 'purified', baseName: base.name,
    });
  });

  return (cache._list = list);
}

// ── GO stats lookup (from the in-memory pokedex populated by fetchList) ───
// Call fetchList() first; after that this is synchronous from cache.
function getGoStatsFromCache(formId) {
  if (!formId) return null;
  const entry = goPokedexByFormId[formId] || goPokedexByFormId[formId.toUpperCase()]
              || goPokedexByName[formId.toLowerCase()];
  if (!entry?.stats) return null;
  return {
    atk: entry.stats.attack,
    def: entry.stats.defense,
    hp:  entry.stats.stamina,
  };
}
