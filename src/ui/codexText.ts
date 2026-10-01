// Codex text (CON-07): the entries' names and lines, lore draft data outside the app JS (TEC-05) like the boss titles,
// fetched once when the codex opens. Without it the codex still lists every entry by its game name.
export type CodexText = {
  skills: Record<string, string>;
  enemies: Record<string, string>;
  roles: Record<string, string>;
  terrain: Record<string, { name: string; line: string }>;
  chapters: Record<string, string>;
};

export const CODEX_TEXT_URL = 'assets/content/codex.json';

const EMPTY: CodexText = { skills: {}, enemies: {}, roles: {}, terrain: {}, chapters: {} };
let text: Promise<CodexText> | undefined;

export function loadCodexText(): Promise<CodexText> {
  text ??= fetch(CODEX_TEXT_URL)
    .then((response) => (response.ok ? response.json() : EMPTY))
    .then((data: Partial<CodexText>) => ({ ...EMPTY, ...data }), () => EMPTY);
  return text;
}
