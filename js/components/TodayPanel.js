// ── TodayPanel ─────────────────────────────────────────────────────────────
// Displays today's raid bosses and field research tasks from ScrapedDuck
// Data source: https://github.com/bigfoott/ScrapedDuck
// Credit: ScrapedDuck by bigfoott & LeekDuck.com

const SCRAPED_DUCK_BASE = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data';

const RAID_TIER_ORDER = ['Mega', 'Tier 5', 'Tier 3', 'Tier 1'];

const TIER_STYLE = {
  'Mega':   { bg: '#7c3aed22', border: '#7c3aed66', label: '#c4b5fd', icon: '✦' },
  'Tier 5': { bg: '#be123c22', border: '#be123c66', label: '#fda4af', icon: '⬟' },
  'Tier 3': { bg: '#b4520922', border: '#b4520966', label: '#fdba74', icon: '◆' },
  'Tier 1': { bg: '#0f766e22', border: '#0f766e66', label: '#5eead4', icon: '◇' },
};

const RESEARCH_TYPE_LABELS = {
  catch:    '🎯 Catch',
  throw:    '⬆️ Throw',
  battle:   '⚔️ Battle',
  explore:  '🗺️ Explore',
  training: '🏋️ Train',
  rocket:   '🚀 Rocket',
  buddy:    '🤝 Buddy',
  ar:       '📷 AR',
  event:    '🌟 Event',
  sponsored:'💼 Sponsored',
};

// ── Normalize a ScrapedDuck boss name → PokéAPI slug ──────────────────────
// Examples:
//   "Shadow Giratina (Altered)"  → "giratina-altered"
//   "Alolan Marowak"             → "marowak-alolan"
//   "Mega Charizard X"           → "charizard-mega-x"
//   "Primal Kyogre"              → "kyogre-primal"
//   "Galarian Zapdos"            → "zapdos-galarian"
//   "Hisuian Typhlosion"         → "typhlosion-hisuian"
//   "Rayquaza"                   → "rayquaza"
function raidNameToSlug(name) {
  if (!name) return '';

  // Strip shadow/purified prefix — PokéAPI doesn't have shadow forms
  let s = name.replace(/^(Shadow|Purified)\s+/i, '').trim();

  // Extract parenthesised form suffix: "Giratina (Altered)" → base="Giratina" suffix="altered"
  const parenMatch = s.match(/^(.+?)\s*\(([^)]+)\)$/);
  let base = parenMatch ? parenMatch[1].trim() : s;
  const parenSuffix = parenMatch ? parenMatch[2].toLowerCase().replace(/\s+/g, '-') : null;

  // Regional/form prefixes that PokéAPI appends as suffixes
  const REGIONAL = ['alolan', 'galarian', 'hisuian', 'paldean'];

  const words = base.split(/\s+/);
  const firstWord = words[0].toLowerCase();

  let slug;

  if (REGIONAL.includes(firstWord)) {
    // "Alolan Marowak" → "marowak-alolan"
    // "Paldean Tauros" → "tauros-paldea" (PokeAPI uses "paldea" not "paldean")
    const suffix = firstWord === 'paldean' ? 'paldea' : firstWord;
    const rest = words.slice(1).join('-').toLowerCase();
    slug = `${rest}-${suffix}`;
  } else if (firstWord === 'mega') {
    // "Mega Charizard X" → "charizard-mega-x"
    // "Mega Lopunny"     → "lopunny-mega"
    const rest = words.slice(1);
    const poke = rest[0].toLowerCase();
    const extra = rest.slice(1).map(w => w.toLowerCase());
    slug = extra.length > 0 ? `${poke}-mega-${extra.join('-')}` : `${poke}-mega`;
  } else if (firstWord === 'primal') {
    // "Primal Kyogre" → "kyogre-primal"
    slug = `${words.slice(1).join('-').toLowerCase()}-primal`;
  } else {
    slug = words.join('-').toLowerCase();
  }

  // Append paren suffix if present and not already in slug
  if (parenSuffix && !slug.includes(parenSuffix)) {
    slug = `${slug}-${parenSuffix}`;
  }

  // PokeAPI-specific form suffix corrections
  slug = slug
    .replace(/-rapid-strike$/, '-rapid-strike-style')
    .replace(/-single-strike$/, '-single-strike-style')
    .replace(/-hero-of-many-battles$/, '')       // Zacian/Zamazenta base form
    .replace(/--+/g, '-');                        // collapse any double-dashes

  return slug;
}

function ShinyBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '.04em',
      padding: '2px 5px', borderRadius: 5,
      background: '#f59e0b22', border: '1px solid #f59e0b55',
      color: '#fbbf24', lineHeight: 1,
    }}>✨ SHINY</span>
  );
}

function CPRange({ cp, boosted }) {
  if (!cp) return null;
  return (
    <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{cp.min}–{cp.max}</span>
      <span style={{ color: 'var(--dim)' }}> CP</span>
      {boosted && (
        <span style={{ marginLeft: 6, color: '#93c5fd' }}>
          · <span style={{ fontWeight: 600 }}>{boosted.min}–{boosted.max}</span>
          <span style={{ color: 'var(--dim)' }}> ☁️boosted</span>
        </span>
      )}
    </div>
  );
}

// ── Raid Boss Card ──────────────────────────────────────────────────────────
function RaidBossCard({ boss, onSelect }) {
  const ts = TIER_STYLE[boss.tier] || TIER_STYLE['Tier 1'];

  return (
    <div
      className="today-card"
      style={{ background: ts.bg, borderColor: ts.border }}
      onClick={() => onSelect && onSelect(raidNameToSlug(boss.name))}
      title={`View ${boss.name}`}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={boss.image}
          alt={boss.name}
          style={{ width: 72, height: 72, objectFit: 'contain', display: 'block' }}
          onError={e => { e.target.style.opacity = 0.3; }}
        />
        {boss.canBeShiny && (
          <span style={{
            position: 'absolute', bottom: 0, right: -2,
            fontSize: 14, lineHeight: 1, filter: 'drop-shadow(0 0 4px #f59e0b)',
          }}>✨</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{boss.name}</span>
          {boss.canBeShiny && <ShinyBadge />}
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
          {(boss.types || []).map(t => (
            <TypeBadge key={t.name} type={t.name} />
          ))}
        </div>

        <CPRange cp={boss.combatPower?.normal} boosted={boss.combatPower?.boosted} />

        {boss.boostedWeather?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {boss.boostedWeather.map(w => (
              <span key={w.name} style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 6,
                background: 'var(--s3)', border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}>{w.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Raid Tier Group ─────────────────────────────────────────────────────────
function RaidTierGroup({ tier, bosses, onSelect }) {
  const ts = TIER_STYLE[tier] || TIER_STYLE['Tier 1'];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        paddingBottom: 8, borderBottom: `1px solid var(--border)`,
      }}>
        <span style={{
          fontSize: 13, fontWeight: 800, color: ts.label,
          textTransform: 'uppercase', letterSpacing: '.06em',
        }}>{ts.icon} {tier}</span>
        <span style={{
          fontSize: 11, color: 'var(--dim)', fontWeight: 500,
        }}>{bosses.length} boss{bosses.length !== 1 ? 'es' : ''}</span>
      </div>
      <div className="today-grid">
        {bosses.map(b => (
          <RaidBossCard key={b.name} boss={b} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// ── Research Task Card ──────────────────────────────────────────────────────
function ResearchCard({ task, onSelect }) {
  const typeLabel = RESEARCH_TYPE_LABELS[task.type] || task.type;

  return (
    <div className="today-card research-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
            background: 'var(--s3)', border: '1px solid var(--border2)',
            color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{typeLabel}</span>
          <span
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}
            dangerouslySetInnerHTML={{ __html: task.text }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          {(task.rewards || []).map((r, i) => (
            <div
              key={i}
              className="research-reward"
              onClick={() => r.name && onSelect && onSelect(r.name)}
              title={r.name ? `View ${r.name}` : undefined}
              style={{ cursor: r.name ? 'pointer' : 'default' }}
            >
              <img
                src={r.image}
                alt={r.name || 'reward'}
                style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }}
                onError={e => { e.target.style.opacity = 0.3; }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                  {r.name || '—'}
                </div>
                {r.canBeShiny && (
                  <div style={{ fontSize: 9, color: '#fbbf24' }}>✨</div>
                )}
                {r.combatPower && (
                  <div style={{ fontSize: 9, color: 'var(--dim)' }}>
                    {r.combatPower.min}–{r.combatPower.max}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main TodayPanel ─────────────────────────────────────────────────────────
function TodayPanel({ onSelectPoke }) {
  const [activeTab, setActiveTab] = React.useState('raids');
  const [raids, setRaids]         = React.useState(null);
  const [research, setResearch]   = React.useState(null);
  const [raidErr, setRaidErr]     = React.useState(null);
  const [resErr, setResErr]       = React.useState(null);
  const [raidLoad, setRaidLoad]   = React.useState(false);
  const [resLoad, setResLoad]     = React.useState(false);

  // Fetch raids — cache-bust so GitHub CDN always returns latest data
  React.useEffect(() => {
    if (raids || raidErr) return;
    setRaidLoad(true);
    const bust = `?t=${Math.floor(Date.now() / 60000)}`; // changes every minute
    fetch(`${SCRAPED_DUCK_BASE}/raids.json${bust}`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(data => { setRaids(data); setRaidLoad(false); })
      .catch(() => { setRaidErr('Could not load raid data.'); setRaidLoad(false); });
  }, []);

  // Fetch research — cache-bust so GitHub CDN always returns latest data
  React.useEffect(() => {
    if (research || resErr) return;
    setResLoad(true);
    const bust = `?t=${Math.floor(Date.now() / 60000)}`;
    fetch(`${SCRAPED_DUCK_BASE}/research.json${bust}`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(data => { setResearch(data); setResLoad(false); })
      .catch(() => { setResErr('Could not load research data.'); setResLoad(false); });
  }, []);

  // Group raids by tier
  const raidsByTier = React.useMemo(() => {
    if (!raids) return {};
    const groups = {};
    raids.forEach(b => {
      if (!groups[b.tier]) groups[b.tier] = [];
      groups[b.tier].push(b);
    });
    return groups;
  }, [raids]);

  const todayTabs = [
    {
      id: 'raids',
      label: 'Raid Bosses',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
      count: raids?.length,
    },
    {
      id: 'research',
      label: 'Field Research',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      count: research?.length,
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 40px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>
            Today in Pokémon GO
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Current raid bosses &amp; field research tasks · Data via{' '}
            <a href="https://leekduck.com" target="_blank" rel="noopener"
              style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>LeekDuck.com</a>
            {' &amp; '}
            <a href="https://github.com/bigfoott/ScrapedDuck" target="_blank" rel="noopener"
              style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>ScrapedDuck</a>
          </p>
        </div>
        <button
          className="btn"
          style={{ flexShrink: 0, gap: 6, fontSize: 12 }}
          disabled={raidLoad || resLoad}
          onClick={() => { setRaids(null); setResearch(null); setRaidErr(null); setResErr(null); }}
          title="Refresh data"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Tab switcher */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="tab-bar">
          {todayTabs.map(t => (
            <button
              key={t.id}
              className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
              style={activeTab === t.id ? { borderBottomColor: 'var(--accent)' } : {}}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count != null && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px',
                  borderRadius: 10, background: 'var(--s3)',
                  color: 'var(--muted)', lineHeight: 1.4,
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '18px 16px' }}>

          {/* ── Raids tab ── */}
          {activeTab === 'raids' && (
            <>
              {raidLoad && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', gap: 12, flexDirection: 'column', alignItems: 'center' }}>
                  <Spinner size="lg" />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading raid bosses…</span>
                </div>
              )}
              {raidErr && <ErrorBox msg={raidErr} />}
              {raids && !raidLoad && (
                <div>
                  {RAID_TIER_ORDER.filter(tier => raidsByTier[tier]?.length > 0).map(tier => (
                    <RaidTierGroup
                      key={tier}
                      tier={tier}
                      bosses={raidsByTier[tier]}
                      onSelect={onSelectPoke}
                    />
                  ))}
                  {/* any tiers not in our predefined order */}
                  {Object.keys(raidsByTier)
                    .filter(tier => !RAID_TIER_ORDER.includes(tier))
                    .map(tier => (
                      <RaidTierGroup key={tier} tier={tier} bosses={raidsByTier[tier]} onSelect={onSelectPoke} />
                    ))
                  }
                </div>
              )}
            </>
          )}

          {/* ── Research tab ── */}
          {activeTab === 'research' && (
            <>
              {resLoad && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', gap: 12, flexDirection: 'column', alignItems: 'center' }}>
                  <Spinner size="lg" />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading research tasks…</span>
                </div>
              )}
              {resErr && <ErrorBox msg={resErr} />}
              {research && !resLoad && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {research.map((task, i) => (
                    <ResearchCard key={i} task={task} onSelect={onSelectPoke} />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}

// ── Shared error box ────────────────────────────────────────────────────────
function ErrorBox({ msg }) {
  return (
    <div style={{
      padding: '24px', textAlign: 'center',
      color: '#f87171', fontSize: 13, fontWeight: 500,
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
      {msg}
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
        Check your internet connection or try refreshing.
      </div>
    </div>
  );
}
