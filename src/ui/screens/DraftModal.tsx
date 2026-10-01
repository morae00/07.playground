// Draft modal (UI-01, UI-03): the level-up and boss reward cards, centred for three or four. The kit card shows the
// rarity by shape (frame lines, corner diamonds, knots, foil) and the ribbon repeats it as a count of ◆, so colour
// never carries it alone. A card lists the skill's tags, its level pips, and each number the pick changes; the strip
// under the cards shows the build so far. Picking is guarded for DIALOG_INPUT_GUARD_MS (BUG-05); 1-4, the arrows
// and Enter, and the pad's D-pad and A all pick (App, useGamepadNavigation), and the key line names the device in use.
// A level-up opens with a 0.6 s sequence (FX-05): an ink ring bursts, the banner lands, and the cards turn in 80 ms
// apart. The engine stopped at the step the XP filled, so no simulated time passes (G15); reduced motion skips it.
// Under the SYS-08 experiment, a fusion card shows its two awakened skills, drafts opened together count through one
// screen (the opening plays once), the build strip counts the slots, and tokens redraw the cards or banish one skill.
import type { CSSProperties } from 'react';
import BUILD_DEPTH from '../../content/data/buildDepth';
import { RARITY, SKILLS, SKILL_IDS, type DraftCard, type DraftState, type HudSnapshot, type Rarity, type SkillOffer } from '../../game/GameEngine';
import { MAX_SKILL_LEVEL } from '../../game/grammar';
import { SKILL_LEVEL_STATS } from '../../game/skillNumbers';
import { t, tp, tx } from '../../i18n/strings';
import { glyphs } from '../Glyph';
import { useInputDevice } from '../inputDevice';
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
  const skill = offer.kind === 'skill' || offer.kind === 'awakening' ? offer : undefined;
  const def = skill && SKILLS[skill.skillId];
  const level = skill?.level ?? 0;
  const next = offer.kind === 'skill' ? level + 1 : 0;
  const stats = offer.kind === 'skill' && level > 0 ? SKILL_LEVEL_STATS[offer.skillId] : undefined;
  const after = stats?.(next);
  const tags = def
    ? [t(def.active ? 'tag.active' : 'tag.passive'), ...(offer.kind === 'awakening' ? [t('tag.awakening')] : def.tags.map((tag) => t(`tag.${tag}`)))]
    : [t(offer.kind === 'fusion' ? 'tag.fusion' : 'tag.bonus')];
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
      {offer.kind === 'fusion' ? (
        <span className="fusionArt" aria-hidden="true">
          {BUILD_DEPTH.fusions[offer.fusionId].materials.map((id) => <span className="artTile" data-art={`${id}-awakened`} key={id} />)}
        </span>
      ) : (
        <span
          className="artTile"
          data-art={offer.kind === 'bonus' ? `bonus-${offer.bonus}-${offer.rarity}` : offer.kind === 'awakening' ? `${offer.skillId}-awakened` : offer.skillId}
          aria-hidden="true"
        />
      )}
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

type Build = Pick<HudSnapshot, 'skills' | 'fusions' | 'slots'>;

export function DraftModal({ draft, build, onPick, onReroll, onBanish }: {
  draft: DraftState;
  build: Build;
  onPick: (offer: SkillOffer) => void;
  onReroll: () => void;
  onBanish: (offerId: string) => void;
}) {
  const { skills } = build;
  const owned = SKILL_IDS.filter((id) => skills[id]);
  const device = useInputDevice();
  const depth = draft.depth;
  // A chained or redrawn draft keeps the screen: the opening sequence plays for the first one only.
  const opening = draft.reason === 'level' && !(depth && (depth.redraw || depth.index > 1));
  const slots = build.slots && ([true, false] as const).map((active) => owned.filter((id) => SKILLS[id].active === active).length);
  return (
    <ModalDialog className="draftBox" labelledBy="draft-dialog-title" describedBy="draft-dialog-description draft-dialog-keys" inputGuardMs={DIALOG_INPUT_GUARD_MS}>
      {opening && <i className="draftBurst" aria-hidden="true" />}
      <div className="modalHead">
        <p className={opening ? 'levelBanner' : undefined}>
          {t(draft.reason === 'boss' ? 'draft.kicker.boss' : 'draft.kicker.level')}
          {depth && depth.total > 1 && <span className="draftChain">{t('draft.chain', { index: depth.index, total: depth.total })}</span>}
        </p>
        <h2 id="draft-dialog-title">{tx(draft.title)}</h2>
        <p className="modalLead" id="draft-dialog-description">{t('draft.lead')}</p>
      </div>
      <div className="draftGrid">
        {draft.cards.map((offer, index) => (
          <Card offer={offer} index={index} onPick={onPick} key={offer.offerId} />
        ))}
      </div>
      {depth && depth.tokens > 0 && (
        <div className="draftTokens">
          <span>{t('draft.tokens', { n: depth.tokens })}</span>
          <button className="ghost" type="button" aria-keyshortcuts="R" onClick={onReroll}>{t('draft.reroll')} (R)</button>
          {draft.cards.map((offer) => offer.kind === 'skill' && (
            <button className="ghost" type="button" key={offer.offerId} aria-label={t('draft.banish.label', { skill: t(`skill.${offer.skillId}`) })} onClick={() => onBanish(offer.offerId)}>
              {t('draft.banish')} · {t(`skill.${offer.skillId}`)}
            </button>
          ))}
        </div>
      )}
      <div className="buildStrip">
        <span className="buildLabel">
          {t('draft.build')}
          {slots && <small>{t('draft.slots', { active: slots[0], activeMax: build.slots!.active, passive: slots[1], passiveMax: build.slots!.passive })}</small>}
        </span>
        <ul className="buildSlots">
          {owned.map((id) => (
            <li className="buildSlot" key={id} aria-label={t(skills[id]!.awakened ? 'skill.slot.awakened' : 'skill.slot', { skill: t(`skill.${id}`), level: skills[id]!.level })}>
              <span className="artSlot" data-art={skills[id]!.awakened ? `${id}-awakened` : id} />
              <LevelPips level={skills[id]!.level} />
            </li>
          ))}
          {build.fusions.map((id) => <li className="buildFusion" key={id}>{t(`fusion.${id}`)}</li>)}
          {owned.length === 0 && <li className="emptyText">{t('draft.noSkills')}</li>}
        </ul>
        <span className="buildKeys" id="draft-dialog-keys">
          {device === 'keyboard' ? t('draft.keys.keyboard', { count: draft.cards.length }) : t('draft.keys.pad', glyphs(device))}
        </span>
      </div>
    </ModalDialog>
  );
}
