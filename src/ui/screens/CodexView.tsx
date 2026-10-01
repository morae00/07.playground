// Codex (CON-07): every skill, enemy, boss, terrain kind, and chapter, found in play, and the career totals. An entry
// not found yet shows as an ink silhouette with how to find it; a found one shows its art, its name, and its line from
// the lore drafts (src/ui/codexText.ts). The codex is the manual too: skill entries carry their summary (UI-09).
import { useEffect, useState } from 'react';
import CODEX from '../../content/data/codex';
import { SKILLS } from '../../game/GameEngine';
import { BOSS_SLOTS } from '../../game/render/assets/slots';
import type { ChapterId } from '../../content/schema';
import { formatCount, t } from '../../i18n/strings';
import type { CareerStats, ProfileData } from '../../platform/save';
import { loadBossTitles, type BossTitle } from '../bossTitles';
import { loadCodexText, type CodexText } from '../codexText';

type Part = keyof ProfileData['codex'];
const PARTS: readonly Part[] = ['skills', 'enemies', 'bosses', 'terrain', 'chapters'];

/** The entry's art: the HUD skill slot, the enemy icon, the boss portrait (a disc with its chapter where the kit has none), the terrain icon, or the chapter's landmark. */
function Art({ part, id }: { part: Part; id: string }) {
  if (part === 'skills') return <span className="artSlot" data-art={id} />;
  if (part === 'enemies') return <span className="artEnemy" data-art={id} />;
  if (part === 'terrain') return <span className="artTerrain" data-art={id} />;
  if (part === 'chapters') return <span className="artChapter" data-art={`chapter-${id}`} />;
  return id in BOSS_SLOTS ? <span className="artPortrait" data-art={id} /> : <span className="codexDisc">{bossChapter(id)}</span>;
}

const bossChapter = (id: string) => (id.startsWith('field-') ? CODEX.bosses.indexOf(id) / 3 + 1 : Number(id[1]));

function entryName(part: Part, id: string, text: CodexText | null) {
  if (part === 'skills') return t(`skill.${id as keyof typeof SKILLS}`);
  if (part === 'enemies') return text?.enemies[id] ?? t(`role.${id.split('-')[1] as 'stalker'}`);
  if (part === 'bosses') return t(`boss.${id}` as Parameters<typeof t>[0]);
  if (part === 'terrain') return text?.terrain[id]?.name ?? id;
  return t(`chapter.${id as unknown as ChapterId}`);
}

function EntryDetail({ part, id, text, bossTitles }: { part: Part; id: string; text: CodexText | null; bossTitles: Record<string, BossTitle> }) {
  const lines: string[] = [];
  let kicker = '';
  if (part === 'skills') {
    const def = SKILLS[id as keyof typeof SKILLS];
    kicker = `${t(def.active ? 'tag.active' : 'tag.passive')} · ${t(`rarity.${def.rarity}`)} · ${t('codex.fromChapter', { n: def.chapterMin })}`;
    if (text?.skills[id]) lines.push(text.skills[id]);
    lines.push(t(`skill.${id as keyof typeof SKILLS}.summary`));
  } else if (part === 'enemies') {
    const [chapter, role] = id.split('-');
    kicker = `${t(`chapter.${chapter as unknown as ChapterId}`)} · ${t(`role.${role as 'stalker'}`)}`;
    if (text?.roles[role]) lines.push(text.roles[role]);
  } else if (part === 'bosses') {
    const title = bossTitles[id];
    kicker = `${t(`chapter.${String(bossChapter(id)) as unknown as ChapterId}`)}${title ? ` · ${title.title}` : ''}`;
    if (title) lines.push(title.line);
  } else if (part === 'terrain') {
    if (text?.terrain[id]) lines.push(text.terrain[id].line);
  } else if (text?.chapters[id]) {
    lines.push(text.chapters[id]);
  }
  return (
    <>
      <span className="codexArt"><Art part={part} id={id} /></span>
      <h3>{entryName(part, id, text)}</h3>
      {kicker && <p className="eyebrow">{kicker}</p>}
      {lines.map((line) => <p key={line}>{line}</p>)}
    </>
  );
}

export function CodexView({ codex, stats }: { codex: ProfileData['codex']; stats: CareerStats }) {
  const [part, setPart] = useState<Part>('skills');
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState<CodexText | null>(null);
  const [bossTitles, setBossTitles] = useState<Record<string, BossTitle>>({});
  useEffect(() => {
    let live = true;
    void loadCodexText().then((loaded) => { if (live) setText(loaded); });
    void loadBossTitles().then((loaded) => { if (live) setBossTitles(loaded); });
    return () => { live = false; };
  }, []);
  const found = new Set(codex[part]);
  const shown = selected && found.has(selected) ? selected : null;
  return (
    <section className="codexView" aria-labelledby="codex-title">
      <header className="codexHead">
        <h2 id="codex-title">{t('codex.title')}</h2>
        <dl className="careerStats" aria-label={t('codex.stats')}>
          <div><dt>{t('codex.stats.runs')}</dt><dd>{formatCount(stats.runs)}</dd></div>
          <div><dt>{t('codex.stats.clears')}</dt><dd>{formatCount(stats.clears)}</dd></div>
          <div><dt>{t('codex.stats.kills')}</dt><dd>{formatCount(stats.kills)}</dd></div>
          <div><dt>{t('codex.stats.bosses')}</dt><dd>{formatCount(stats.bossKills)}</dd></div>
          <div><dt>{t('codex.stats.time')}</dt><dd>{t('codex.stats.timeValue', { h: Math.floor(stats.playSeconds / 3600), m: Math.floor((stats.playSeconds % 3600) / 60) })}</dd></div>
        </dl>
      </header>
      <div className="codexParts" role="group" aria-label={t('codex.parts')}>
        {PARTS.map((item) => (
          <button
            className={item === part ? 'ghost small active' : 'ghost small'}
            type="button"
            aria-pressed={item === part}
            key={item}
            onClick={() => { setPart(item); setSelected(null); }}
          >
            {t(`codex.part.${item}`)} <small>{t('codex.count', { found: codex[item].filter((id) => (CODEX[item] as readonly string[]).includes(id)).length, total: CODEX[item].length })}</small>
          </button>
        ))}
      </div>
      <div className="codexBody">
        <ul className="codexGrid">
          {CODEX[part].map((id) => {
            const known = found.has(id);
            return (
              <li key={id}>
                <button
                  className={['codexEntry', known ? 'found' : 'unknown', shown === id ? 'selected' : ''].filter(Boolean).join(' ')}
                  type="button"
                  aria-pressed={shown === id}
                  onClick={() => setSelected(id)}
                >
                  <Art part={part} id={id} />
                  <span>{known ? entryName(part, id, text) : t('codex.unknown')}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <aside className="codexDetail" aria-live="polite">
          {shown
            ? <EntryDetail part={part} id={shown} text={text} bossTitles={bossTitles} />
            : <p className="emptyText">{selected ? t(`codex.hint.${part}`) : t('codex.pick')}</p>}
        </aside>
      </div>
    </section>
  );
}
