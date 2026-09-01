// ── MovesPanel ─────────────────────────────────────────────────────────────
// Shows all fast + charge moves for a Pokémon GO Pokémon, with DPS / DPE,
// energy, and legacy (Elite TM) badges.
//
// Data source: pokemon-go-api (goPokedexByName / goPokedexByFormId)
// Fields used per move:
//   names.English    – display name
//   type.type        – "POKEMON_TYPE_FIRE" etc → goTypeToSlug()
//   combat.power     – in-battle damage
//   combat.energy    – energy gained (fast, positive) or cost (charge, negative)
//   combat.turns     – turns for fast moves (1 turn = 0.5 s)
//   power            – gym/raid power (shown as secondary reference)
//   energy           – gym/raid energy
//   durationMs       – animation duration (ms)

// ── DPS helpers ──────────────────────────────────────────────────────────

// Fast move: damage per second using combat values (1 turn = 0.5 s)
function fastDPS(move) {
  const turns = move.combat?.turns;
  const power = move.combat?.power;
  if (!turns || !power) return null;
  return +(power / (turns * 0.5)).toFixed(2);
}

// Fast move: energy per second
function fastEPS(move) {
  const turns = move.combat?.turns;
  const energy = move.combat?.energy;
  if (!turns || energy == null) return null;
  return +(energy / (turns * 0.5)).toFixed(2);
}

// Charge move: damage per energy (DPE)
function chargeDPE(move) {
  const power  = move.combat?.power;
  const energy = move.combat?.energy;   // negative = cost
  if (!power || !energy) return null;
  return +(power / Math.abs(energy)).toFixed(2);
}

// Charge move: duration in seconds from durationMs
function chargeDuration(move) {
  if (!move.durationMs) return null;
  return +(move.durationMs / 1000).toFixed(1);
}

// Convert object-or-array move map to array
function toMoveArr(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return Object.values(obj);
}

// ── MoveRow ────────────────────────────────────────────────────────────────
function MoveRow({ move, isLegacy, isFast }) {
  const typeName = goTypeToSlug(move.type?.type || '');
  const col      = TYPE_COLORS[typeName] || '#888';
  const name     = move.names?.English || move.id || '?';

  // Stat values
  const dps     = isFast ? fastDPS(move)    : null;
  const eps     = isFast ? fastEPS(move)    : null;
  const dpe     = isFast ? null             : chargeDPE(move);
  const pwr     = move.combat?.power       ?? null;
  const nrg     = move.combat?.energy      ?? null;   // + for fast, - for charge
  const dur     = isFast
    ? (move.combat?.turns ? (move.combat.turns * 0.5).toFixed(1) + 's' : null)
    : (chargeDuration(move) ? chargeDuration(move) + 's' : null);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px',
      borderRadius: 10,
      background: 'var(--s2)',
      border: `1px solid var(--border)`,
      transition: 'background .12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--s2)'}
    >
      {/* Type icon */}
      <img
        src={`https://assets.dittobase.com/go/types/${typeName}.png`}
        alt={typeName}
        style={{ width: 22, height: 22, flexShrink: 0, objectFit: 'contain' }}
      />

      {/* Name + legacy badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{name}</span>
          {isLegacy && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px',
              borderRadius: 5, background: '#f59e0b22',
              border: '1px solid #f59e0b55', color: '#fbbf24',
              letterSpacing: '.04em', lineHeight: 1,
            }}>LEGACY</span>
          )}
        </div>
        {/* Type badge */}
        <div style={{ marginTop: 3 }}>
          <TypeBadge type={typeName} />
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isFast ? 'repeat(4, auto)' : 'repeat(3, auto)',
        gap: '2px 14px',
        textAlign: 'right', flexShrink: 0,
      }}>
        {/* Power */}
        <StatCell label="PWR" value={pwr} color="#f87171" />
        {/* Energy */}
        <StatCell
          label={isFast ? 'ENG' : 'COST'}
          value={nrg != null ? (isFast ? `+${nrg}` : `${nrg}`) : null}
          color={isFast ? '#4ade80' : '#fb923c'}
        />
        {/* Duration */}
        {dur && <StatCell label="DUR" value={dur} color="var(--muted)" />}
        {/* DPS or DPE */}
        {isFast && dps != null && <StatCell label="DPS" value={dps} color="#a78bfa" highlight />}
        {!isFast && dpe != null && <StatCell label="DPE" value={dpe} color="#a78bfa" highlight />}
      </div>
    </div>
  );
}

function StatCell({ label, value, color, highlight }) {
  if (value == null) return <div />;
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', letterSpacing: '.06em', marginBottom: 1 }}>{label}</div>
      <div style={{
        fontSize: highlight ? 13 : 12,
        fontWeight: highlight ? 800 : 600,
        color: color || 'var(--text)',
      }}>{value}</div>
    </div>
  );
}

// ── MovesPanel ─────────────────────────────────────────────────────────────
function MovesPanel({ poke }) {
  const [goEntry, setGoEntry] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!poke) return;
    setLoading(true);
    setGoEntry(null);

    // 1. Try in-memory maps (populated by fetchList on DexGrid mount)
    const formIdKey = poke.name.toUpperCase().replace(/-/g, '_');
    let entry = goPokedexByName[poke.name]
             || goPokedexByFormId[formIdKey]
             || null;

    if (entry) {
      setGoEntry(entry);
      setLoading(false);
      return;
    }

    // 2. Ensure fetchList has run, then re-check maps
    fetchList().then(() => {
      const found = goPokedexByName[poke.name]
                 || goPokedexByFormId[formIdKey]
                 || null;
      if (found) {
        setGoEntry(found);
        setLoading(false);
        return;
      }

      // 3. Last resort: fetch by dex number (only reliable for base forms)
      fetch(`https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex/id/${poke.id}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) setGoEntry(Array.isArray(d) ? d[0] : d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [poke?.name]);

  if (!poke) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spinner />
      </div>
    );
  }

  if (!goEntry) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>
        Move data not available for this Pokémon.
      </div>
    );
  }

  const fastMoves       = toMoveArr(goEntry.quickMoves).sort((a, b) => (fastDPS(b) || 0) - (fastDPS(a) || 0));
  const chargeMoves     = toMoveArr(goEntry.cinematicMoves).sort((a, b) => (chargeDPE(b) || 0) - (chargeDPE(a) || 0));
  const eliteFast       = toMoveArr(goEntry.eliteQuickMoves);
  const eliteCharge     = toMoveArr(goEntry.eliteCinematicMoves);

  const allFast   = [...fastMoves,   ...eliteFast];
  const allCharge = [...chargeMoves, ...eliteCharge];

  const eliteFastIds   = new Set(eliteFast.map(m => m.id));
  const eliteChargeIds = new Set(eliteCharge.map(m => m.id));

  const S = {
    fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.07em',
    color: 'var(--muted)', marginBottom: 8, display: 'block',
  };

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, color: 'var(--dim)' }}>
        <span><span style={{ color: '#a78bfa', fontWeight: 700 }}>DPS</span> = Damage/sec (fast)</span>
        <span><span style={{ color: '#a78bfa', fontWeight: 700 }}>DPE</span> = Damage/energy (charge)</span>
        <span><span style={{ color: '#4ade80', fontWeight: 700 }}>ENG</span> = Energy gained</span>
        <span><span style={{ color: '#fb923c', fontWeight: 700 }}>COST</span> = Energy cost</span>
        <span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
            background: '#f59e0b22', border: '1px solid #f59e0b55', color: '#fbbf24',
          }}>LEGACY</span>
          {' '}= Elite TM required
        </span>
      </div>

      {/* Fast Moves */}
      <div>
        <span style={S}>Fast Moves</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allFast.length === 0
            ? <div style={{ color: 'var(--dim)', fontSize: 13 }}>No fast moves found.</div>
            : allFast.map(m => (
                <MoveRow key={m.id} move={m} isFast isLegacy={eliteFastIds.has(m.id)} />
              ))
          }
        </div>
      </div>

      {/* Charge Moves */}
      <div>
        <span style={S}>Charge Moves</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allCharge.length === 0
            ? <div style={{ color: 'var(--dim)', fontSize: 13 }}>No charge moves found.</div>
            : allCharge.map(m => (
                <MoveRow key={m.id} move={m} isFast={false} isLegacy={eliteChargeIds.has(m.id)} />
              ))
          }
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--dim)', margin: 0 }}>
        Combat values from{' '}
        <a href="https://pokemon-go-api.github.io/pokemon-go-api/" target="_blank" rel="noopener"
          style={{ color: 'var(--accent-light)' }}>pokemon-go-api</a>.
        {' '}DPS uses in-battle values (1 turn = 0.5 s). DPE = damage ÷ energy cost.
        Sorted by DPS / DPE descending.
      </p>
    </div>
  );
}
