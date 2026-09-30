// Draft modal (UI-01, UI-03): the level-up and boss reward cards, centred for three or four. The kit card shows the
// rarity by shape (frame lines, corner diamonds, knots, foil) and the ribbon repeats it as a count of ◆, so colour
// never carries it alone. A card lists the skill's tags, its level pips, and each number the pick changes; the strip
// under the cards shows the build so far. Picking is guarded for DIALOG_INPUT_GUARD_MS (BUG-05); 1-4, the arrows
// and Enter, and the pad's D-pad and A all pick (App, useGamepadNavigation).
// A level-up opens with a 0.6 s sequence (FX-05): an ink ring bursts, the banner lands, and the cards turn in 80 ms
// apart. The engine stopped at the step the XP filled, so no simulated time passes (G15); reduced motion skips it.
import type { CSSProperties } from 'react';
import { RARITY, SKILLS, SKILL_IDS, type DraftCard, type DraftState, type HudSnapshot, type Rarity, type SkillOffer } from '../../game/GameEngine';
import { MAX_SKILL_LEVEL } from '../../game/grammar';
import { SKILL_LEVEL_STATS } from '../../game/skillNumbers';
import { t, tp, tx } from '../../i18n/strings';
import { ModalDialog } from '../ModalDialog';
import { DIALOG_INPUT_GUARD_MS } from './constants';

const RANKS = Object.keys(RARITY) as Rarity[];

/** Level pips: filled up to `level`, and the levels up to `next` marked as what the pick adds. */
function LevelPips({ level, next = level }: { level: number; next?: number }) {
  return (
    <span className="levelPips" aria-hidden="true">
      {Array.from({ length: MAX_SKILL_LEVEL }, (_, pip) => <i key={pip} className={pip < level ? 'on' : pip < next ? 'next' : undefined} />)}
    </span>
  );
}

function Card({ offer, index, onPick }: { offer: DraftCard; index: number; onPick: (offer: SkillOffer) => void }) {
  const def = offer.kind === 'bonus' ? undefined : SKILLS[offer.skillId];
  const level = offer.kind === 'bonus' ? 0 : offer.level;
  const next = offer.kind === 'skill' ? level + 1 : 0;
  const stats = offer.kind === 'skill' && level > 0 ? SKILL_LEVEL_STATS[offer.skillId] : undefined;
  const after = stats?.(next);
  const tags = def
    ? [t(def.active ? 'tag.active' : 'tag.passive'), ...(offer.kind === 'awakening' ? [t('tag.awakening')] : def.tags.map((tag) => t(`tag.${tag}`)))]
    : [t('tag.bonus')];
  return (
    <button
      className="draftCard"
      data-kind={offer.kind}
      data-rarity={offer.rarity}
      data-sound="none"
      onClick={() => onPick(offer)}
      aria-keyshortcuts={`${index + 1}`}
      style={{ '--card': index } as CSSProperties}
    >
      <b className="cardShortcut" aria-hidden="true">{index + 1}</b>
      <span
        className="artTile"
        data-art={offer.kind === 'bonus' ? `bonus-${offer.bonus}-${offer.rarity}` : offer.kind === 'awakening' ? `${offer.skillId}-awakened` : offer.skillId}
        aria-hidden="true"
      />
      <span className="cardRank">
        {t(`rarity.${offer.rarity}`)} <i aria-hidden="true">{'◆'.repeat(RANKS.indexOf(offer.rarity) + 1)}</i>
      </span>
      <strong className="cardName">{offer.kind === 'skill' ? t(`skill.${offer.skillId}`) : tx(offer.title)}</strong>
      <span className="cardTags">{tags.map((tag) => <i key={tag}>{tag}</i>)}</span>
      <span className="cardLevel">
        {def && <LevelPips level={level} next={next} />}
        {tx(offer.levelLine)}
      </span>
      {stats && after ? (
        <span className="cardDelta">
          {stats(level).map(([label, before], row) => (
            <span key={label}>
              <b>{t(label)}</b>
              <span>{tp(before)} → <em>{tp(after[row][1])}</em></span>
            </span>
          ))}
        </span>
      ) : (
        <span className="cardBody">{tx(offer.body)}</span>
      )}
      {offer.kind === 'skill' && (
        <small className="cardHint">
          {next < MAX_SKILL_LEVEL ? t('draft.hint.awaken', { level: MAX_SKILL_LEVEL }) : t('draft.hint.next')}
        </small>
      )}
    </button>
  );
}

export function DraftModal({ draft, skills, onPick }: { draft: DraftState; skills: HudSnapshot['skills']; onPick: (offer: SkillOffer) => void }) {
  const owned = SKILL_IDS.filter((id) => skills[id]);
  return (
    <ModalDialog className="draftBox" labelledBy="draft-dialog-title" describedBy="draft-dialog-description draft-dialog-keys" inputGuardMs={DIALOG_INPUT_GUARD_MS}>
      {draft.reason === 'level' && <i className="draftBurst" aria-hidden="true" />}
      <div className="modalHead">
        <p className={draft.reason === 'level' ? 'levelBanner' : undefined}>{t(draft.reason === 'boss' ? 'draft.kicker.boss' : 'draft.kicker.level')}</p>
        <h2 id="draft-dialog-title">{tx(draft.title)}</h2>
        <p className="modalLead" id="draft-dialog-description">{t('draft.lead')}</p>
      </div>
      <div className="draftGrid">
        {draft.cards.map((offer, index) => (
          <Card offer={offer} index={index} onPick={onPick} key={offer.offerId} />
        ))}
      </div>
      <div className="buildStrip">
        <span className="buildLabel">{t('draft.build')}</span>
        <ul className="buildSlots">
          {owned.map((id) => (
            <li className="buildSlot" key={id} aria-label={t(skills[id]!.awakened ? 'skill.slot.awakened' : 'skill.slot', { skill: t(`skill.${id}`), level: skills[id]!.level })}>
              <span className="artSlot" data-art={skills[id]!.awakened ? `${id}-awakened` : id} />
              <LevelPips level={skills[id]!.level} />
            </li>
          ))}
          {owned.length === 0 && <li className="emptyText">{t('draft.noSkills')}</li>}
        </ul>
        <span className="buildKeys" id="draft-dialog-keys">{t('draft.keys', { count: draft.cards.length })}</span>
      </div>
    </ModalDialog>
  );
}
