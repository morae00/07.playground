// Boss title cards (FX-05): each boss's title and one line, from the lore bible's draft tables (docs/lore §4). The
// text is data outside the app JS (TEC-05), fetched once when the first boss appears; the card shows the name alone
// if the file cannot be read.
export type BossTitle = { name: string; title: string; line: string };

export const BOSS_TITLES_URL = 'assets/content/boss-titles.json';

let titles: Promise<Record<string, BossTitle>> | undefined;

export function loadBossTitles(): Promise<Record<string, BossTitle>> {
  titles ??= fetch(BOSS_TITLES_URL)
    .then((response) => (response.ok ? response.json() : {}))
    .then((data: { bosses?: Record<string, BossTitle> }) => data.bosses ?? {}, () => ({}));
  return titles;
}

// Landmark name cards (CON-03): the name and one line of a St3 or St7 landmark, from the lore bible's draft table
// (docs/lore §5.1), shown as the stage begins. Data outside the app JS like the boss titles; no card if it cannot load.
export type LandmarkTitle = { name: string; line: string };

export const LANDMARK_TITLES_URL = 'assets/content/landmark-titles.json';

let landmarks: Promise<Record<string, LandmarkTitle>> | undefined;

export function loadLandmarkTitles(): Promise<Record<string, LandmarkTitle>> {
  landmarks ??= fetch(LANDMARK_TITLES_URL)
    .then((response) => (response.ok ? response.json() : {}))
    .then((data: { landmarks?: Record<string, LandmarkTitle> }) => data.landmarks ?? {}, () => ({}));
  return landmarks;
}
