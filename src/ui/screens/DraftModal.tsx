// Draft modal (UI-01): the level-up and boss reward cards. Picking is guarded for DIALOG_INPUT_GUARD_MS (BUG-05).
import { RARITY, SKILLS, type DraftState, type SkillOffer } from '../../game/GameEngine';
import { ModalDialog } from '../ModalDialog';
import { DIALOG_INPUT_GUARD_MS } from './constants';

export function DraftModal({ draft, onPick }: { draft: DraftState; onPick: (offer: SkillOffer) => void }) {
  return (
    <ModalDialog className="draftBox" labelledBy="draft-dialog-title" describedBy="draft-dialog-description" inputGuardMs={DIALOG_INPUT_GUARD_MS}>
      <p className="srOnly" id="draft-dialog-description">계속하려면 보상 하나를 반드시 선택해야 합니다. 숫자키, 방향키와 Enter, 또는 게임패드 A로 고릅니다.</p>
      <div className="modalHead">
        <p>{draft.reason === 'boss' ? '확정 보상' : '랜덤 스킬'}</p>
        <h2 id="draft-dialog-title">{draft.title}</h2>
      </div>
      <div className="draftGrid">
        {draft.cards.map((offer, index) => {
          const activeLine = offer.kind === 'bonus' ? 'BONUS' : SKILLS[offer.skillId].active ? 'ACTIVE' : 'PASSIVE';
          return (
            <button
              className={`draftCard ${RARITY[offer.rarity].className} ${offer.kind === 'awakening' ? 'awakening' : ''}`}
              data-sound="none"
              onClick={() => onPick(offer)}
              aria-keyshortcuts={`${index + 1}`}
              key={offer.kind === 'bonus' ? `${offer.kind}-${offer.bonus}` : `${offer.kind}-${offer.skillId}`}
            >
              <b className="cardShortcut" aria-hidden="true">{index + 1}</b>
              <span>{RARITY[offer.rarity].label}</span>
              <h3>{offer.title}</h3>
              <p>{offer.body}</p>
              <em>{offer.levelLine}</em>
              <strong>{activeLine}</strong>
            </button>
          );
        })}
      </div>
    </ModalDialog>
  );
}
