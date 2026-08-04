// ── CP Multipliers (Pokémon GO, Levels 1–50 including half-levels) ─────────
const CPM = {1:.094,1.5:.135137432,2:.16639787,2.5:.192650919,3:.21573247,3.5:.236572661,4:.25572005,4.5:.273530381,5:.29024988,5.5:.306057377,6:.3210876,6.5:.335445036,7:.34921268,7.5:.362457751,8:.37523559,8.5:.387592406,9:.39956728,9.5:.411193551,10:.42250001,10.5:.432926419,11:.44310755,11.5:.453059958,12:.46279839,12.5:.472336083,13:.48168495,13.5:.491008727,14:.49985844,14.5:.508701765,15:.51739395,15.5:.525942511,16:.53435433,16.5:.542635767,17:.55079269,17.5:.558691524,18:.56651357,18.5:.574305815,19:.58200572,19.5:.589887037,20:.59740001,20.5:.604818814,21:.61215729,21.5:.619399365,22:.62656069,22.5:.633644533,23:.64065295,23.5:.647576426,24:.65443563,24.5:.661214806,25:.667934,25.5:.674577537,26:.68116492,26.5:.687680648,27:.69414365,27.5:.700538717,28:.70688421,28.5:.713164996,29:.71939909,29.5:.725571552,30:.7317,30.5:.734741009,31:.73776948,31.5:.740785574,32:.74378943,32.5:.746781211,33:.74976104,33.5:.752729087,34:.75568551,34.5:.758630378,35:.76156384,35.5:.764486065,36:.76739717,36.5:.770297266,37:.7731865,37.5:.776064962,38:.77893275,38.5:.781790423,39:.78463697,39.5:.787473168,40:.79030001,40.5:.792803968,41:.79530001,41.5:.797803921,42:.80030001,42.5:.802803876,43:.80530001,43.5:.807803833,44:.81030001,44.5:.812803791,45:.81530001,45.5:.817803750,46:.82030001,46.5:.822803710,47:.82530001,47.5:.827803671,48:.83030001,48.5:.832803633,49:.83530001,49.5:.837803596,50:.84029999};

// ── Type display colors ───────────────────────────────────────────────────
const TYPE_COLORS = {
  normal:'#A8A878',  fire:'#F08030',    water:'#6890F0',  electric:'#F8D030',
  grass:'#78C850',   ice:'#98D8D8',     fighting:'#C03028',poison:'#A040A0',
  ground:'#E0C068',  flying:'#A890F0',  psychic:'#F85888',bug:'#A8B820',
  rock:'#B8A038',    ghost:'#705898',   dragon:'#7038F8', dark:'#705848',
  steel:'#B8B8D0',   fairy:'#EE99AC',
};

// ── Type effectiveness (defender's type → attacker type: multiplier) ──────
const TYPE_EFF = {
  normal:   {fighting:2, ghost:0},
  fire:     {water:2, ground:2, rock:2, fire:.5, grass:.5, ice:.5, bug:.5, steel:.5, fairy:.5},
  water:    {electric:2, grass:2, fire:.5, water:.5, ice:.5, steel:.5},
  electric: {ground:2, electric:.5, flying:.5, steel:.5},
  grass:    {fire:2, ice:2, poison:2, flying:2, bug:2, water:.5, electric:.5, grass:.5, ground:.5},
  ice:      {fire:2, fighting:2, rock:2, steel:2, ice:.5},
  fighting: {flying:2, psychic:2, fairy:2, bug:.5, rock:.5, dark:.5},
  poison:   {ground:2, psychic:2, fighting:.5, poison:.5, bug:.5, grass:.5, fairy:.5},
  ground:   {water:2, grass:2, ice:2, electric:0, poison:.5, rock:.5, steel:.5},
  flying:   {electric:2, ice:2, rock:2, fighting:.5, bug:.5, grass:.5, ground:0},
  psychic:  {bug:2, ghost:2, dark:2, fighting:.5, psychic:.5},
  bug:      {fire:2, flying:2, rock:2, fighting:.5, ground:.5, grass:.5},
  rock:     {water:2, grass:2, fighting:2, ground:2, steel:2, normal:.5, fire:.5, poison:.5, flying:.5},
  ghost:    {ghost:2, dark:2, normal:0, fighting:0, poison:.5, bug:.5},
  dragon:   {ice:2, dragon:2, fairy:2, fire:.5, water:.5, electric:.5, grass:.5},
  dark:     {fighting:2, bug:2, fairy:2, ghost:.5, dark:.5, psychic:0},
  steel:    {fire:2, fighting:2, ground:2, normal:.5, grass:.5, ice:.5, flying:.5, psychic:.5, bug:.5, rock:.5, dragon:.5, steel:.5, fairy:.5, poison:0},
  fairy:    {poison:2, steel:2, fighting:.5, bug:.5, dark:.5, dragon:0},
};

// ── Raid / encounter definitions ──────────────────────────────────────────
const ENC = {
  raid:       { label:'Raid',         lv:20, blv:25, fl:10, boosted:true  },
  shadowRaid: { label:'Shadow Raid',  lv:8,  blv:13, fl:6,  boosted:true  },
  research:   { label:'Research',     lv:15, blv:null, fl:10, boosted:false },
  egg:        { label:'Egg',          lv:20, blv:null, fl:10, boosted:false },
  wild:       { label:'Wild',         lv:1,  blv:null, fl:0,  boosted:false },
  lucky:      { label:'Lucky Trade',  lv:1,  blv:null, fl:12, boosted:false },
};

// ── Weather boosts by type ────────────────────────────────────────────────
const WEATHER = {
  sunny:       { label:'☀️ Sunny',       types:['fire','grass','ground']   },
  rainy:       { label:'🌧 Rainy',        types:['water','electric','bug']  },
  partlyCloudy:{ label:'⛅ Partly Cloudy',types:['normal','rock']           },
  cloudy:      { label:'☁️ Cloudy',       types:['fairy','fighting','poison']},
  windy:       { label:'💨 Windy',        types:['dragon','flying','psychic']},
  snowy:       { label:'❄️ Snow',         types:['ice','steel']             },
  foggy:       { label:'🌫 Foggy',        types:['dark','ghost']            },
};

// ── Top raid attackers for counter calculation ────────────────────────────
const COUNTERS = [
  {name:'mewtwo',      types:['psychic'],         move:'psychic'},
  {name:'rayquaza',    types:['dragon','flying'],  move:'dragon'},
  {name:'garchomp',    types:['dragon','ground'],  move:'dragon'},
  {name:'dragonite',   types:['dragon','flying'],  move:'dragon'},
  {name:'salamence',   types:['dragon','flying'],  move:'dragon'},
  {name:'dialga',      types:['steel','dragon'],   move:'dragon'},
  {name:'palkia',      types:['water','dragon'],   move:'dragon'},
  {name:'zekrom',      types:['dragon','electric'],move:'electric'},
  {name:'reshiram',    types:['dragon','fire'],    move:'fire'},
  {name:'kyurem',      types:['dragon','ice'],     move:'ice'},
  {name:'tyranitar',   types:['rock','dark'],      move:'rock'},
  {name:'rampardos',   types:['rock'],             move:'rock'},
  {name:'rhyperior',   types:['ground','rock'],    move:'rock'},
  {name:'terrakion',   types:['rock','fighting'],  move:'rock'},
  {name:'nihilego',    types:['rock','poison'],    move:'rock'},
  {name:'machamp',     types:['fighting'],         move:'fighting'},
  {name:'lucario',     types:['fighting','steel'], move:'fighting'},
  {name:'conkeldurr',  types:['fighting'],         move:'fighting'},
  {name:'keldeo',      types:['water','fighting'], move:'fighting'},
  {name:'blaziken',    types:['fire','fighting'],  move:'fighting'},
  {name:'chandelure',  types:['ghost','fire'],     move:'ghost'},
  {name:'gengar',      types:['ghost','poison'],   move:'ghost'},
  {name:'giratina-origin',types:['ghost','dragon'],move:'ghost'},
  {name:'darkrai',     types:['dark'],             move:'dark'},
  {name:'weavile',     types:['dark','ice'],       move:'dark'},
  {name:'hydreigon',   types:['dark','dragon'],    move:'dark'},
  {name:'yveltal',     types:['dark','flying'],    move:'dark'},
  {name:'kyogre',      types:['water'],            move:'water'},
  {name:'swampert',    types:['water','ground'],   move:'water'},
  {name:'greninja',    types:['water','dark'],     move:'water'},
  {name:'raikou',      types:['electric'],         move:'electric'},
  {name:'electivire',  types:['electric'],         move:'electric'},
  {name:'zapdos',      types:['electric','flying'],move:'electric'},
  {name:'moltres',     types:['fire','flying'],    move:'fire'},
  {name:'charizard',   types:['fire','flying'],    move:'fire'},
  {name:'entei',       types:['fire'],             move:'fire'},
  {name:'mamoswine',   types:['ice','ground'],     move:'ice'},
  {name:'glaceon',     types:['ice'],              move:'ice'},
  {name:'articuno',    types:['ice','flying'],     move:'ice'},
  {name:'roserade',    types:['grass','poison'],   move:'grass'},
  {name:'tangrowth',   types:['grass'],            move:'grass'},
  {name:'venusaur',    types:['grass','poison'],   move:'grass'},
  {name:'excadrill',   types:['ground','steel'],   move:'ground'},
  {name:'groudon',     types:['ground'],           move:'ground'},
  {name:'landorus-therian',types:['ground','flying'],move:'ground'},
  {name:'metagross',   types:['steel','psychic'],  move:'steel'},
  {name:'melmetal',    types:['steel'],            move:'steel'},
  {name:'genesect',    types:['bug','steel'],      move:'bug'},
  {name:'scizor',      types:['bug','steel'],      move:'bug'},
  {name:'alakazam',    types:['psychic'],          move:'psychic'},
  {name:'espeon',      types:['psychic'],          move:'psychic'},
  {name:'latios',      types:['dragon','psychic'], move:'psychic'},
  {name:'togekiss',    types:['fairy','flying'],   move:'fairy'},
  {name:'gardevoir',   types:['psychic','fairy'],  move:'fairy'},
  {name:'sylveon',     types:['fairy'],            move:'fairy'},
  {name:'xerneas',     types:['fairy'],            move:'fairy'},
];

// ── Generation ranges ─────────────────────────────────────────────────────
const GENS = [
  {label:'Gen I',    min:1,    max:151},
  {label:'Gen II',   min:152,  max:251},
  {label:'Gen III',  min:252,  max:386},
  {label:'Gen IV',   min:387,  max:493},
  {label:'Gen V',    min:494,  max:649},
  {label:'Gen VI',   min:650,  max:721},
  {label:'Gen VII',  min:722,  max:809},
  {label:'Gen VIII', min:810,  max:905},
  {label:'Gen IX',   min:906,  max:1025},
  {label:'Forms',    min:1026, max:99999},
];

// ── Shadow Pokémon IDs ────────────────────────────────────────────────────
// ── Shadow Pokémon IDs ─────────────────────────────────────────────────────
// Only Pokémon that have actually appeared as Shadow in Pokémon GO
// (Team GO Rocket encounters, Shadow Raids Tier 3 & Tier 5)
const SHADOW_IDS = [
  // ── Gen 1 — Rocket grunts / leaders ─────────────────────────────────
  1,2,3,4,5,6,7,8,9,
  25,27,28,37,38,41,42,50,51,52,53,54,55,
  58,59,66,67,68,72,73,74,75,76,
  77,78,79,80,81,82,88,89,93,94,
  100,101,109,110,111,112,113,114,115,
  116,117,118,119,120,121,122,123,
  126,127,128,130,131,137,138,139,140,141,142,143,
  147,148,149,
  // ── Gen 1 Tier 5 Shadow raids ────────────────────────────────────────
  144,145,146,150,

  // ── Gen 2 — Rocket grunts / leaders ─────────────────────────────────
  152,153,154,155,156,157,158,159,160,
  161,162,163,164,165,166,167,168,169,
  170,171,172,173,174,175,176,177,178,179,180,181,182,
  183,184,185,186,187,188,189,190,191,192,193,194,195,
  196,197,198,199,200,201,202,203,204,205,206,207,208,
  209,210,211,212,213,214,215,216,217,218,219,220,221,
  222,223,224,225,226,227,228,229,230,231,232,
  233,234,235,236,237,238,239,240,241,242,
  246,247,248,
  // ── Gen 2 Tier 5 Shadow raids ────────────────────────────────────────
  243,244,245,249,250,

  // ── Gen 3 — Rocket grunts / Shadow raids ────────────────────────────
  252,253,254,255,256,257,258,259,260,
  261,262,270,271,272,273,274,275,
  280,281,282,296,297,299,302,303,
  304,305,306,309,310,328,329,330,333,334,
  349,350,351,353,354,355,356,359,361,362,
  363,364,365,371,372,373,
  // ── Gen 3 Tier 5 Shadow raids ────────────────────────────────────────
  377,378,379,380,381,382,383,384,386,

  // ── Gen 4 — Rocket grunts / Shadow raids ────────────────────────────
  387,388,389,390,391,392,393,394,395,
  396,397,398,401,402,403,404,405,
  406,407,408,409,410,411,418,419,420,421,
  422,423,425,426,427,428,431,432,
  434,435,436,437,438,439,440,441,442,
  443,444,445,447,448,449,450,451,452,
  453,454,455,456,457,458,459,460,461,
  462,463,464,465,466,467,468,469,470,471,472,473,474,475,
  476,477,478,
  // ── Gen 4 Tier 5 Shadow raids ────────────────────────────────────────
  483,484,487,488,491,

  // ── Gen 5 — Rocket grunts / Shadow raids ────────────────────────────
  495,496,497,498,499,500,501,502,503,
  504,505,509,510,511,512,513,514,515,516,
  519,520,521,522,523,527,528,529,530,
  531,532,533,534,535,536,537,538,539,
  540,541,542,543,544,545,546,547,548,549,
  551,552,553,554,555,557,558,559,560,561,562,563,
  564,565,566,567,570,571,572,573,574,575,576,
  577,578,579,580,581,588,589,590,591,
  592,593,595,596,597,598,599,600,601,
  602,603,604,610,611,612,613,614,616,617,618,
  619,620,621,624,625,627,628,629,630,633,634,635,
  // ── Gen 5 Tier 5 Shadow raids ────────────────────────────────────────
  638,639,640,641,642,643,644,645,646,647,648,649,

  // ── Gen 6 — Rocket grunts / Shadow raids ────────────────────────────
  650,651,652,653,654,655,656,657,658,
  659,660,661,662,663,667,668,669,670,671,
  674,675,677,678,679,680,681,682,683,684,685,
  686,687,690,691,694,695,698,699,
  700,701,704,705,706,707,708,709,710,711,714,715,
  // ── Gen 6 Tier 5 Shadow raids ────────────────────────────────────────
  716,717,

  // ── Gen 7 — Rocket grunts / Shadow raids ────────────────────────────
  722,723,724,725,726,727,728,729,730,
  734,735,736,737,738,742,743,744,745,
  747,748,749,750,751,752,753,754,755,756,757,758,
  761,762,763,769,770,771,774,775,
  776,777,778,782,783,784,
  // ── Gen 7 Tier 5 Shadow raids ────────────────────────────────────────
  785,786,787,788,800,

  // ── Gen 8 — Rocket grunts / Shadow raids ────────────────────────────
  810,811,812,813,814,815,816,817,818,
  819,820,821,822,823,827,828,829,830,
  831,832,833,834,835,836,837,838,839,840,841,842,
  843,844,845,848,849,850,851,852,853,856,857,858,
  859,860,861,865,866,867,868,869,870,872,873,875,876,877,
  878,879,
  // ── Gen 8 Tier 5 Shadow raids ────────────────────────────────────────
  888,889,
];

