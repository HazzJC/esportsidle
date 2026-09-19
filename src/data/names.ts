export const FIRST_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Kai', 'Mika', 'Luca', 'Noah', 'Aiden', 'Mateo', 'Leo', 'Yuki', 'Hana', 'Min-jun', 'Seo-yeon', 'Wei',
  'Mei', 'Arjun', 'Priya', 'Ravi', 'Aisha', 'Omar', 'Layla', 'Emil', 'Freya', 'Lars', 'Ingrid', 'Mateus', 'Camila', 'Diego',
  'Sofia', 'Lukas', 'Anna', 'Jakub', 'Zofia', 'Ivan', 'Olga', 'Nikolai', 'Elena', 'Kofi', 'Amara', 'Tunde', 'Zara', 'Finn',
  'Maeve', 'Rory', 'Chloe', 'Tom', 'Ellie', 'Jack', 'Grace', 'Oscar', 'Isla', 'Hugo', 'Léa', 'Théo', 'Inès', 'Marco',
  'Giulia', 'Pablo', 'Lucía', 'Kenji', 'Aiko', 'Riku', 'Sora', 'Tae-yang', 'Ji-woo', 'Bao', 'Linh', 'Nattapong', 'Mali',
  'Rafael', 'Beatriz', 'Mehmet', 'Elif', 'Dmitri', 'Katya', 'Vikram', 'Ananya', 'Tariq', 'Noor', 'Jonas', 'Maja', 'Eero',
  'Aino', 'Casey', 'Riley', 'Quinn', 'Skyler', 'Devon', 'Morgan',
];

export const LAST_NAMES = [
  'Smith', 'Kim', 'Park', 'Lee', 'Chen', 'Wang', 'Nakamura', 'Tanaka', 'Sato', 'Nguyen', 'Tran', 'Patel', 'Sharma', 'Khan',
  'Haddad', 'Hansen', 'Larsen', 'Johansson', 'Nielsen', 'Virtanen', 'Novak', 'Kowalski', 'Nowak', 'Ivanov', 'Petrov',
  'Silva', 'Santos', 'Costa', 'García', 'Martínez', 'López', 'Rossi', 'Bianchi', 'Müller', 'Schmidt', 'Weber', 'Dubois',
  'Martin', 'Bernard', 'Okafor', 'Mensah', 'Adeyemi', 'Mwangi', "O'Brien", 'Murphy', 'Walsh', 'Jones', 'Taylor', 'Brown',
  'Wilson', 'Evans', 'Clarke', 'Hughes', 'Yilmaz', 'Kaya', 'Horvat', 'Kovač', 'Popescu', 'Nagy', 'Svoboda', 'Andersson',
  'Berg', 'Dahl', 'Moreau', 'Fontaine', 'Reyes', 'Cruz', 'Morales', 'Takahashi', 'Suzuki', 'Choi', 'Jung', 'Huang', 'Liu',
  'Zhang', 'Singh', 'Gupta', 'Rahman', 'Aziz', 'Castillo', 'Vega', 'Fischer', 'Wagner', 'Bauer', 'Lindqvist',
];

export const TAG_WORDS = [
  'Shadow', 'Zero', 'Nova', 'Blitz', 'Frost', 'Viper', 'Pixel', 'Glitch', 'Echo', 'Rogue', 'Neon', 'Hex', 'Byte', 'Drift',
  'Ghost', 'Lynx', 'Kairo', 'Nyx', 'Onyx', 'Pulse', 'Rift', 'Sable', 'Taz', 'Vex', 'Wraith', 'Zen', 'Ace', 'Bolt', 'Cypher',
  'Dusk', 'Fury', 'Grim', 'Havoc', 'Ion', 'Jinx', 'Karma', 'Loki', 'Mako', 'Nitro', 'Orbit', 'Phantom', 'Quake', 'Razor',
  'Spectre', 'Titan', 'Umbra', 'Volt', 'Warden', 'Xeno', 'Yeti', 'Zephyr', 'Potato', 'Noodle', 'Toaster', 'Crumb', 'Waffle',
  'Pickle', 'Biscuit', 'Muffin', 'Nugget', 'Kitten', 'Goose', 'Llama', 'Panda', 'Moth', 'Bean', 'Sushi', 'Taco', 'Mango',
  'Clutch', 'Flick', 'Tilt', 'Smurf', 'Carry', 'Snipe', 'Rush', 'Peek', 'Lurk', 'Frag', 'Combo', 'Parry', 'Dash', 'Juke',
  'Sniper', 'Blade', 'Storm', 'Hawk', 'Wolf', 'Fox', 'Raven', 'Cobra', 'Mantis', 'Kraken', 'Dragon', 'Phoenix', 'Comet',
];

/**
 * Tags that sound like they belong to a scene, and often to a role inside it: an AWPer reads like an
 * AWPer, an IGL like a shotcaller. They are affectionate riffs on the kinds of handles each scene
 * produces rather than any real player, so the market feels like a real transfer window.
 */
export interface SceneTags {
  /** Fits anyone in this game. */
  any: string[];
  /** Fits one role, by its index in the game's role list. */
  byRole?: string[][];
}

export const SCENE_TAGS: Record<string, SceneTags> = {
  smash: {
    any: ['TomAto', 'HungryBocks', 'Armadillo', 'Leffin', 'MewThree', 'Plopp', 'Zainy', 'AxeBody', 'Wizzrobot', 'CodySchwarm', 'aMSaLad', 'PPMD-ish', 'Lucky7', 'SFAT-free', 'Wobbles'],
  },
  rocket: {
    any: ['Squishee', 'JSTNott', 'Firstchiller', 'Vatiro', 'Zennith'],
    byRole: [
      ['Firstchiller', 'Vatiro', 'Mognus', 'Rizey', 'ApparentlyJack'],
      ['Turboparsa', 'Kaydrop', 'Alph4', 'Metsanaut', 'Scrubkilla'],
      ['Fizzle', 'Chaussette', 'Mistadobalina', 'Netcode', 'Wallride'],
    ],
  },
  counter: {
    any: ['Forzt', 'Ropz2', 'Frozone', 'Magiskb0Y', 'BlameF1'],
    byRole: [
      ['EliJAY', 'NoKo', 'Electr0nic', 'Jame5', 'Rush B'],
      ['ZywOoh', 'Dev0ce', 'sh2ro', 'm0NESY-ish', 'Kenny5'],
      ['Xyp8x', 'Hobbat', 'Flamez', 'Wraithy', 'Lurkstar'],
      ['Krumz', 'Xazt', 'Nafan', 'Smoooya', 'UtilityBill'],
      ['Gla2ve', 'Karrogan', 'FallUN', 'Apex-ish', 'Shotcaller'],
    ],
  },
  lanes: {
    any: ['Poser', 'Chewy', 'Cups', 'Knite', 'Rookee'],
    byRole: [
      ['TheSly', 'Zoos', 'Nagari', 'Bin-ish', 'Wunda'],
      ['Canon', 'Owner', 'Jankos-ish', 'Peanutt', 'Tarzaned'],
      ['Poser', 'Chewy', 'Cups', 'Knite', 'Rookee'],
      ['Rular', 'Gumayoosi', 'Uzee', 'Viperr', 'Jackeylove-ish'],
      ['Kyria', 'Matta', 'Barrel', 'Mingg', 'CoreJJ-ish'],
    ],
  },
  apex: {
    any: ['ImperialPal', 'Genburger', 'Sourdough', 'Hakas', 'Ripz'],
    byRole: [
      ['ImperialPal', 'Genburger', 'Zerg', 'Nafen', 'Ripz'],
      ['Hakas', 'Sourdough', 'Verhulst-ish', 'Scoutt', 'Pathfound'],
      ['Anchorman', 'Fuhhh', 'Gild', 'Sikezz', 'HisWattson-ish'],
    ],
  },
  valorunt: {
    any: ['TenX', 'Aspaz', 'Derky', 'Saucy', 'Alfajam'],
    byRole: [
      ['TenX', 'Aspaz', 'Derky', 'Yayster', 'Jinggg-ish'],
      ['Stix', 'Smashies', 'Sova-ish', 'Kaplan', 'Trentt'],
      ['Marbled', 'Miko', 'Smokey', 'Astr0', 'Viperess'],
      ['Gnats', 'Chronicle-ish', 'Killjoyous', 'Cypherpunk', 'Sentry'],
      ['Lesser', 'Flexeria', 'Sacyy', 'Cryocell-ish', 'Utility'],
    ],
  },
  fortnight: {
    any: ['Booga', 'Mongrel', 'Benjyfishe', 'Clax', 'Agua'],
    byRole: [
      ['Buildzilla', 'Rampz', 'Turtler', '90sKid', 'Coneheadz'],
      ['Booga', 'Mongrel', 'Clax', 'Benjyfishe', 'Mitr0-ish'],
      ['Agua', 'Podsee', 'Kamii', 'Tayson-ish', 'Setty'],
      ['Callout', 'EndZone', 'Rotationz', 'ZoneKing', 'Stormcall'],
    ],
  },
  starcrafty: {
    any: ['Feral', 'Marue', 'Rainor', 'Flush', 'Lyfe', 'Innovashun', 'Dark-ish', 'Herö', 'ByuNn', 'Clemmy'],
  },
  overclock: {
    any: ['Sinatrap', 'Carpp', 'Proffit', 'JJoSnack', 'Viol8t'],
    byRole: [
      ['Mono', 'Gestur', 'Muma-ish', 'Rampart', 'Shieldwall'],
      ['Smirk', 'Mogg', 'Hookshot', 'Choihyobin-ish', 'Pitstop'],
      ['Sinatrap', 'Carpp', 'Proffit', 'Corey-ish', 'Onetap'],
      ['Birdwing', 'Feta', 'Diem-ish', 'Blastoff', 'Flexer'],
      ['JJoSnack', 'Viol8t', 'Twilightt', 'Mercymain', 'Beamer'],
      ['Shu-ish', 'Fielder-ish', 'Lucioball', 'Dropkick', 'Boopist'],
    ],
  },
  hearthstoned: {
    any: ['Thajs', 'Firecat', 'Kibbler', 'Trumpet', 'Rdoh', 'Savjazz', 'Toastyy', 'Lifecoachh', 'Reynadd', 'TopDecker'],
  },
  pong: {
    any: ['Paddington', 'PongDaddy', 'Deuce', 'Spinzone', 'Bouncey', 'Ralleigh', 'Volleyed', 'Smashette'],
  },
  galactic: {
    any: ['Shrud', 'Zeroh', 'Gravitas', 'Orbitr', 'Vaccum'],
    byRole: [
      ['Vanguardian', 'Breacher', 'Frontline', 'Hullbreak', 'Shrud'],
      ['Maverique', 'Barrelroll', 'Afterburn', 'Zeroh', 'Stickdrift'],
      ['Ohmz', 'Sparkplug', 'Ductape', 'Reroute', 'Gravitas'],
      ['Parallax', 'Holdbreath', 'Longshot', 'Orbitr', 'Recoyl'],
      ['Startac', 'Callsign', 'Admiralish', 'Voxcom', 'Vaccum'],
    ],
  },
};

export const TAG_SUFFIXES = ['', '', '', '', '', 'X', 'TV', 'GG', '99', 'EZ', 'Pro', 'Jr', '1337', 'Main', 'Z', 'Prime', 'OP', '7'];

export interface Nation {
  code: string;
  name: string;
}

export const NATIONS: Nation[] = [
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'Mexico' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'TR', name: 'Türkiye' },
  { code: 'IN', name: 'India' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'PH', name: 'Philippines' },
  { code: 'AU', name: 'Australia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
];

export const RIVAL_ORGS = [
  'Natus Vinegar', 'Team Liquidated', 'Cloud Nein', 'Fanatik', 'G3 Esports', '99 Burglars', 'Evil Geese', 'Faze Clam',
  'Sentinull', 'OpTickle Gaming', 'Team Solo Minded', 'Gen.Gee', 'Rogue Waves', 'Vitality Juice', 'Heroic Deeds',
  'Astral Hosts', 'Team Spirit Level', 'Paper Rexes', 'Loud & Clear', 'Karmine Crop', 'Ninjas in Pyjamas',
  'Complexity Theory', 'Echo Chamber', 'Dignitas Maximus', 'Invictus Gamers', 'Royal Neverquit', 'Top Esports Maybe',
  'Spacestation Gamers', 'Oxygen Tanks', 'Guardians of the Lane', 'Boom Boom Esports', 'Encore Esports', 'BIG Small',
  'Sprout Sprouts', 'Apeks Predators', 'Endpoint Down', 'Alliance of Allies', 'Nigma Enigma', 'Beastly Coast',
  'Talon Claws', 'Blacklist Blocklist', 'Xtreme Gamers', 'Wolves of Wall Street', 'The Tilted Towers', 'Lag Legends',
  'Ping Pong Kings', 'Noscope Nomads', 'Respawn Rangers', 'Headshot Heroes', 'Critical Crits', 'Moist Esports',
  'Salt Mines Gaming', 'GG No Re', 'Pentakill Club', 'The Throwers', 'Diff Detected', 'AFK Allstars', 'Final Boss FC',
  'Fnopic', 'Hot Sauce Heroes',
];
