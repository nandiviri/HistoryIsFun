// World-domination conquest board: a stylized tile board (not a geographic
// map). Continents group the territories; adjacency is data — two
// territories can attack each other only when a link exists between them.
// The server keeps its own copy of the ids/links for validation and rival
// simulation; names and grouping here are display-only.

export type TerritoryDef = { id: string; name: string };
export type ContinentDef = { id: string; name: string; emoji: string; territories: TerritoryDef[] };

export const CONTINENTS: ContinentDef[] = [
  {
    id: "ancient",
    name: "Ancient World",
    emoji: "🏛️",
    territories: [
      { id: "egypt", name: "Egypt" },
      { id: "rome", name: "Rome" },
      { id: "greece", name: "Greece" },
      { id: "mesopotamia", name: "Mesopotamia" },
    ],
  },
  {
    id: "medieval",
    name: "Medieval Realms",
    emoji: "🏰",
    territories: [
      { id: "mongolia", name: "Mongolia" },
      { id: "france", name: "France" },
      { id: "england", name: "England" },
      { id: "arabia", name: "Arabia" },
    ],
  },
  {
    id: "renaissance",
    name: "Renaissance Europe",
    emoji: "🎨",
    territories: [
      { id: "italy", name: "Italy" },
      { id: "spain", name: "Spain" },
      { id: "germany", name: "Germany" },
      { id: "netherlands", name: "Netherlands" },
    ],
  },
  {
    id: "modern",
    name: "Modern World",
    emoji: "🏭",
    territories: [
      { id: "america", name: "America" },
      { id: "mexico", name: "Mexico" },
      { id: "poland", name: "Poland" },
      { id: "japan", name: "Japan" },
    ],
  },
];

export const TERRITORY_NAME: Record<string, string> = Object.fromEntries(
  CONTINENTS.flatMap((c) => c.territories.map((t) => [t.id, t.name])),
);

export const CONTINENT_OF: Record<string, string> = Object.fromEntries(
  CONTINENTS.flatMap((c) => c.territories.map((t) => [t.id, c.name])),
);

const LINKS: [string, string][] = [
  // within-continent rings + diagonals
  ["egypt", "rome"], ["rome", "greece"], ["greece", "mesopotamia"], ["mesopotamia", "egypt"], ["egypt", "greece"],
  ["france", "england"], ["england", "mongolia"], ["mongolia", "arabia"], ["arabia", "france"], ["france", "mongolia"],
  ["italy", "spain"], ["spain", "germany"], ["germany", "netherlands"], ["netherlands", "italy"], ["italy", "germany"],
  ["america", "mexico"], ["mexico", "poland"], ["poland", "japan"], ["japan", "america"], ["america", "poland"],
  // bridges between continents
  ["rome", "italy"], ["greece", "italy"], ["egypt", "arabia"], ["mesopotamia", "arabia"], ["mongolia", "poland"],
  ["france", "spain"], ["england", "netherlands"], ["england", "america"], ["spain", "mexico"], ["japan", "mongolia"],
];

export const ADJACENCY: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const c of CONTINENTS) for (const t of c.territories) map[t.id] = [];
  for (const [a, b] of LINKS) {
    map[a]?.push(b);
    map[b]?.push(a);
  }
  return map;
})();
