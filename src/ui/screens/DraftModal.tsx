// Draft modal (UI-01, UI-03): the level-up and boss reward cards, centred for three or four. The kit card shows the
// rarity by shape (frame lines, corner diamonds, knots, foil) and the ribbon repeats it as a count of ◆, so colour
// never carries it alone. A card lists the skill's tags, its level pips, and each number the pick changes; the strip
// under the cards shows the build so far. Picking is guarded for DIALOG_INPUT_GUARD_MS (BUG-05); 1-4, the arrows
// and Enter, and the pad's D-pad and A all pick (App, useGamepadNavigation).
import { RARITY, SKILLS, SKILL_IDS, type DraftCard, type DraftState, type HudSnapshot, type Rarity, type SkillOffer } from '../../game/GameEngine';
import { MAX_SKILL_LEVEL } from '../../game/grammar';
import { SKILL_LEVEL_STATS } from '../../game/skillNumbers';
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
  const tags = def ? [def.active ? '액티브' : '패시브', ...(offer.kind === 'awakening' ? ['각성'] : def.tags)] : ['보너스'];
  return (
    <button
      className="draftCard"
      data-kind={offer.kind}
      data-rarity={offer.rarity}
      data-sound="none"
      onClick={() => onPick(offer)}
      aria-keyshortcuts={`${index + 1}`}
    >
      <b className="cardShortcut" aria-hidden="true">{index + 1}</b>
      <span
        className="artTile"
        data-art={offer.kind === 'bonus' ? `bonus-${offer.bonus}-${offer.rarity}` : offer.kind === 'awakening' ? `${offer.skillId}-awakened` : offer.skillId}
        aria-hidden="true"
      />
      <span className="cardRank">
        {RARITY[offer.rarity].label} <i aria-hidden="true">{'◆'.repeat(RANKS.indexOf(offer.rarity) + 1)}</i>
      </span>
      <strong className="cardName">{offer.kind === 'skill' ? def!.name : offer.title}</strong>
      <span className="cardTags">{tags.map((tag) => <i key={tag}>{tag}</i>)}</span>
      <span className="cardLevel">
        {def && <LevelPips level={level} next={next} />}
        {offer.levelLine}
      </span>
      {stats && after ? (
        <span className="cardDelta">
          {stats(level).map(([label, before], row) => (
            <span key={label}>
              <b>{label}</b>
              <span>{before} → <em>{after[row][1]}</em></span>
            </span>
          ))}
        </span>
      ) : (
        <span className="cardBody">{offer.body}</span>
      )}
      {offer.kind === 'skill' && (
        <small className="cardHint">
          {next < MAX_SKILL_LEVEL ? `★ Lv.${MAX_SKILL_LEVEL} 달성 시 각성` : '★ 다음 드래프트 첫 칸에 각성 카드'}
        </small>
      )}
    </button>
  );
}

export function DraftModal({ draft, skills, onPick }: { draft: DraftState; skills: HudSnapshot['skills']; onPick: (offer: SkillOffer) => void }) {
  const owned = SKILL_IDS.filter((id) => skills[id]);
  return (
    <ModalDialog className="draftBox" labelledBy="draft-dialog-title" describedBy="draft-dialog-description draft-dialog-keys" inputGuardMs={DIALOG_INPUT_GUARD_MS}>
      <div className="modalHead">
        <p>{draft.reason === 'boss' ? '확정 보상' : '레벨 업!'}</p>
        <h2 id="draft-dialog-title">{draft.title}</h2>
        <p className="modalLead" id="draft-dialog-description">보상 하나를 고르세요. 고를 때까지 전투는 멈춰 있습니다.</p>
      </div>
      <div className="draftGrid">
        {draft.cards.map((offer, index) => (
          <Card offer={offer} index={index} onPick={onPick} key={offer.offerId} />
        ))}
      </div>
      <div className="buildStrip">
        <span className="buildLabel">현재 빌드</span>
        <ul className="buildSlots">
          {owned.map((id) => (
            <li className="buildSlot" key={id} aria-label={`${SKILLS[id].name} Lv.${skills[id]!.level}${skills[id]!.awakened ? ' 각성' : ''}`}>
              <span className="artSlot" data-art={skills[id]!.awakened ? `${id}-awakened` : id} />
              <LevelPips level={skills[id]!.level} />
            </li>
          ))}
          {owned.length === 0 && <li className="emptyText">아직 스킬이 없습니다</li>}
        </ul>
        <span className="buildKeys" id="draft-dialog-keys">숫자 1–{draft.cards.length} 선택 · 방향키 이동 · Enter 또는 패드 A 확정</span>
      </div>
    </ModalDialog>
  );
}
