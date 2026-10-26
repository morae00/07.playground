// Characters (CON-10): the roster in the menu. Each card names the character, its starting weapon and level, its perk,
// and its upgrade; the actions select, unlock with gold, or upgrade with gold. A character whose chapter is cleared
// is unlocked for free; developer access opens them all.
import { t } from '../../i18n/strings';
import { formatPercent } from '../../game/skillNumbers';
import { CHARACTERS, CHARACTER_COSTS, CHARACTER_IDS, CHARACTER_MAX_LEVEL, characterPerk, characterStartLevel } from '../../game/characters';
import { portraitArt } from '../../game/render/assets/slots';
import { chapterFinished, type MetaState, type ProfileData } from '../../platform/save';

export type CharacterAction = 'select' | 'unlock' | 'upgrade';

/** Whether a character can be played: bought, its chapter cleared (a 0.1.0 save's progress counts, UI-15), or developer access. */
export function characterOpen(id: string, profile: ProfileData, meta: MetaState, developerAccess: boolean) {
  const clear = CHARACTERS[id]?.unlock?.clear;
  return developerAccess || profile.characters.unlocked.includes(id) || (clear !== undefined && chapterFinished(profile, meta, clear));
}

function perkText(id: string, level: number) {
  const perk = characterPerk({ id, level })!;
  const value = perk.scale ? formatPercent(perk.scale) : perk.stat === 'critChance' || perk.stat === 'bossDamage' ? formatPercent(perk.add) : String(Number(perk.add.toFixed(2)));
  return t(`character.perk.${perk.stat}` as 'character.perk.attack', { value });
}

export function CharactersView({ profile, meta, developerAccess, onCharacter }: { profile: ProfileData; meta: MetaState; developerAccess: boolean; onCharacter: (action: CharacterAction, id: string) => void }) {
  return (
    <div className="menuSection">
      <h2>{t('character.heading')}</h2>
      <p className="menuNote">{t('character.intro')}</p>
      <div className="characterGrid">
        {CHARACTER_IDS.map((id) => {
          const def = CHARACTERS[id];
          const level = profile.characters.levels[id] ?? 0;
          const open = characterOpen(id, profile, meta, developerAccess);
          const selected = profile.characters.selected === id;
          const cost = level < CHARACTER_MAX_LEVEL ? CHARACTER_COSTS[level] : null;
          return (
            <article className={`characterCard${selected ? ' selected' : ''}${open ? '' : ' locked'}`} data-character={id} key={id}>
              <header>
                <span className="artPortrait characterPortrait" data-art={portraitArt(id, 'calm')} aria-hidden="true" />
                <b>{t(`character.${id}` as 'character.gyeol')}</b>
                <small>{t(`character.${id}.title` as 'character.gyeol.title')}</small>
              </header>
              <p>{t(`character.${id}.line` as 'character.gyeol.line')}</p>
              <div className="characterWeapon">
                <span className="artSlot" data-art={def.weapon} aria-hidden="true" />
                <span>{t('character.weapon', { weapon: t(`skill.${def.weapon}`), level: characterStartLevel(level) })}</span>
              </div>
              <p className="characterPerk">{perkText(id, level)} · {t('character.level', { level, max: CHARACTER_MAX_LEVEL })}</p>
              {open && cost !== null && <small>{t('character.next', { level: characterStartLevel(level + 1), perk: perkText(id, level + 1) })}</small>}
              <div className="characterActions">
                {open ? (
                  <>
                    <button type="button" className={selected ? 'primary' : 'ghost'} aria-pressed={selected} onClick={() => onCharacter('select', id)}>{t(selected ? 'character.selected' : 'character.select')}</button>
                    {cost !== null && <button type="button" className="ghost" aria-disabled={meta.gold < cost} onClick={() => onCharacter('upgrade', id)}>{t('character.upgrade', { n: cost })}</button>}
                  </>
                ) : def.unlock?.gold !== undefined ? (
                  <button type="button" className="ghost" aria-disabled={meta.gold < def.unlock.gold} onClick={() => onCharacter('unlock', id)}>{t('character.unlockGold', { n: def.unlock.gold })}</button>
                ) : (
                  <small>{t('character.unlockClear', { chapter: def.unlock?.clear ?? 0 })}</small>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
