import type { QuestHint } from './quests';

/**
 * The short card each tab shows the first time it is opened: what the tab is for, the one thing to
 * do first, and the two or three words worth knowing. It closes with "Got it" and comes back from
 * the help button on the tab strip. Tabs with a longer paged guide (Teams, the Market) link to it.
 *
 * The first-encounter cards below do the same for things that arrive by themselves rather than in a
 * tab: the first Drama Drop, the first decision and the first Invitational invite.
 */
export interface IntroTerm {
  term: string;
  icon: string;
  text: string;
}

export interface TabIntro {
  /** The tab it belongs to (`ui/tabs.ts`). */
  id: string;
  title: string;
  icon: string;
  /** What the tab is for, in a sentence or two. */
  lead: string;
  /** The first thing to do here. */
  first: string;
  /** Where "Show me" points for the first step: the same targets the quests light up. */
  hint?: QuestHint;
  terms: IntroTerm[];
  /** A longer paged guide to open from "More" (`ui/guides.ts`, shown by `Guide.svelte`). */
  guide?: string;
}

export const TAB_INTROS: TabIntro[] = [
  {
    id: 'teams',
    title: 'Your teams',
    icon: 'swords',
    lead: 'Each game you play has a team here: its room, its next match and its league. Matches play on their own every few seconds and pay prize money and fans.',
    first: 'Watch a match finish, then click a player to see their gear and stats. Drag a tired player onto the bench to rest them.',
    hint: 'teams',
    terms: [
      { term: 'Season', icon: 'calendar-clock', text: "16 matches in a league tier. Wins raise the team's Elo, and once it is high enough the team moves up to a tougher, richer tier at the end of a season." },
      { term: 'Roles', icon: 'gamepad-2', text: 'Every desk is labelled with its role. A player off their role (marked *) plays a little worse.' },
      { term: 'The bench', icon: 'bed', text: 'Benched players recover energy, illness and injuries faster.' },
    ],
    guide: 'teams',
  },
  {
    id: 'market',
    title: 'The transfer market',
    icon: 'user-plus',
    lead: 'Players you can sign for any of your teams. A fresh batch arrives every few minutes.',
    first: 'Sign a player who fills an empty seat or beats a starter. The strip under each card shows how your win chance would change.',
    hint: 'market',
    terms: [
      { term: 'Signing fee', icon: 'dollar-sign', text: 'Paid once, up front. There are no wages.' },
      { term: 'Cut', icon: 'handshake', text: 'The share of their prize money a player keeps. It never comes out of your bank.' },
      { term: 'Rarity', icon: 'gem', text: 'Rarer players start stronger and can grow further.' },
    ],
    guide: 'market',
  },
  {
    id: 'staff',
    title: 'Staff',
    icon: 'briefcase',
    lead: 'Coaches, chefs, physios and more. Staff work for every team at once.',
    first: 'Hire a Coach. Your first Coach brings a game plan: a list of your next steps on this tab.',
    hint: 'staff',
    terms: [
      { term: 'Every hire helps', icon: 'trending-up', text: 'Each extra hire of a role helps a little less than the last, but none ever stops helping.' },
      { term: 'Tools', icon: 'hammer', text: 'The first hire of several roles brings a tool, like buying ten at once or selling.' },
      { term: 'More roles', icon: 'lock', text: 'New roles unlock as the org grows. The next one says what it needs.' },
    ],
  },
  {
    id: 'house',
    title: 'The house',
    icon: 'house',
    lead: 'Where your players live. Decor keeps them happy and healthy, and each piece works for every player.',
    first: 'Install your first piece of decor. The cheapest one is lit up.',
    hint: 'house',
    terms: [
      { term: 'Moving house', icon: 'landmark', text: 'Earn more this run and the org moves somewhere bigger: new walls in every team room and a rarer set of decor.' },
      { term: 'Morale', icon: 'face-slightly-smiling', text: 'Happy players play better. Several pieces raise it.' },
      { term: 'Recovery', icon: 'heart-pulse', text: 'Other pieces help players get their energy back, or fall ill less often.' },
    ],
  },
  {
    id: 'studio',
    title: 'The studio',
    icon: 'palette',
    lead: 'Draw your own logo and jersey in pixel art, and pick your team colours.',
    first: 'Draw a design, then wear it as your jersey.',
    hint: 'studio',
    terms: [
      { term: 'Designs', icon: 'pencil', text: 'Anything you draw can be your logo, your jersey or, later, a merch product.' },
      { term: 'Team colours', icon: 'paint-bucket', text: 'Your org colours dress every team, unless a team has its own.' },
      { term: 'Merch', icon: 'shirt', text: 'Comes later: sell your designs as products. Designs on the current trend sell best.' },
    ],
  },
  {
    id: 'sponsors',
    title: 'Sponsors',
    icon: 'handshake',
    lead: 'Brands pay to put their name on your org. Every deal adds to all your income while it runs.',
    first: 'Three snack brands are calling first. Compare what each one does, then sign one.',
    hint: 'sponsors',
    terms: [
      { term: 'Slots', icon: 'layers', text: 'You can only carry so many sponsors, and only one brand from each category.' },
      { term: 'Goals', icon: 'target', text: 'Each deal sets a goal. Hit it before the deal ends for a bonus.' },
      { term: 'Perks', icon: 'sparkles', text: 'Some brands bring a perk of their own on top of the money.' },
    ],
  },
  {
    id: 'achievements',
    title: 'Trophies',
    icon: 'trophy',
    lead: 'Every achievement your org earns, and every trophy it wins, on one shelf.',
    first: 'Hover a trophy or an achievement to see what it took.',
    terms: [
      { term: 'Trophy cabinet', icon: 'award', text: 'Achievements fill the cabinet, and the cabinet multiplies all your income. It stays when you sell the org.' },
      { term: 'Trophies', icon: 'trophy', text: 'Won from league titles, Invitationals, sponsor goals and quests. Spend them on operation levels in HQ.' },
    ],
  },
  {
    id: 'legacy',
    title: 'Legacy',
    icon: 'crown',
    lead: 'Your org is worth something now. One day you can sell it, bank legacy points and start again stronger.',
    first: 'Look at what a sale would earn right now. Nothing is forced: keep playing for as long as you like.',
    terms: [
      { term: 'Legacy points', icon: 'gem', text: 'Earned by selling. Spend them in the Legacy tree on upgrades that last for every run.' },
      { term: 'Legacy level', icon: 'trending-up', text: 'Every level adds income, for good.' },
      { term: 'What stays', icon: 'save', text: 'Legacy, trophies and operation levels, your designs and name, achievements and your rival. Cash, operations, teams and staff start again.' },
    ],
  },
];

export const TAB_INTRO_MAP: Map<string, TabIntro> = new Map(TAB_INTROS.map((d) => [d.id, d]));

/** The key in `GameState.guides` that remembers a tab's intro was read. */
export const introKey = (tab: string) => `intro:${tab}`;

/**
 * Set on every org that knows about intro cards. Saves from before them get it on load, with every tab
 * they have already visited marked as read, so a long-running org is not shown eight cards at once.
 */
export const INTROS_KNOWN = 'intros';

export interface EventIntro {
  id: 'drama' | 'choice' | 'invitational';
  title: string;
  icon: string;
  text: string;
  points: string[];
}

/** First-encounter cards, keyed by what they explain. Remembered in `GameState.guides` as `first:<id>`. */
export const EVENT_INTROS: Record<EventIntro['id'], EventIntro> = {
  drama: {
    id: 'drama',
    title: 'Drama Drops',
    icon: 'flame',
    text: 'The red drops are Drama Drops, and they are a gamble. Click one and the story breaks: sometimes it pays well, sometimes it is a scandal that costs income and fans for a while.',
    points: ['Leave it alone and it fades away, costing nothing.', 'The more drama around the org, the more of your Hype Drops turn into Drama Drops. HQ shows the level and how to calm it.'],
  },
  choice: {
    id: 'choice',
    title: 'A decision',
    icon: 'shuffle',
    text: 'Things happen around the org, and some need you to choose. Each option says what it costs and what it does.',
    points: ['You have a couple of minutes to decide.', 'If the time runs out, the option marked "if you wait" is taken for you.'],
  },
  invitational: {
    id: 'invitational',
    title: 'Your first Invitational',
    icon: 'trophy',
    text: 'An Invitational is a three-round bracket your flagship team is invited to: a quarter-final, a semi-final and a grand final.',
    points: ['Each round is harder than the last; the bars show your chance in each.', 'Preparing costs money up front and raises your odds, win or lose.', 'Winners take prize money, fans and trophies. Close the invite to think it over; when its timer runs out, the team plays without preparing.'],
  },
};

/** The key in `GameState.guides` that remembers a first-encounter card was read. */
export const firstKey = (id: EventIntro['id']) => `first:${id}`;
