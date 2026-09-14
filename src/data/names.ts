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
