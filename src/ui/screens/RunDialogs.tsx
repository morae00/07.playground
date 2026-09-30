// Run dialogs (UI-01): the pause dialog with its abandon confirmation, the loop-fault dialog (TEC-14), and the
// save reset confirmation on the menu.
import { ModalDialog } from '../ModalDialog';

export type PauseDialogProps = {
  infinite: boolean;
  seed: number | undefined;
  confirmingAbandon: boolean;
  onResume: () => void;
  onAskAbandon: () => void;
  onCancelAbandon: () => void;
  onAbandon: () => void;
};

export function PauseDialog({ infinite, seed, confirmingAbandon, onResume, onAskAbandon, onCancelAbandon, onAbandon }: PauseDialogProps) {
  return (
    <ModalDialog className="settlementBox pauseBox" labelledBy="pause-dialog-title" describedBy="pause-dialog-description" onEscape={onResume}>
      <div className="modalHead">
        <p>RUN PAUSED</p>
        <h2 id="pause-dialog-title">일시정지</h2>
      </div>
      {confirmingAbandon ? (
        <>
          <p id="pause-dialog-description">
            {infinite
              ? '지금 포기하면 이번 무한 경쟁 기록과 보상이 남지 않습니다. 정말 메뉴로 돌아갈까요?'
              : '지금 포기하면 이번 Stage의 골드와 경험치를 받지 못합니다. 정말 메뉴로 돌아갈까요?'}
          </p>
          <div className="modalActions">
            <button className="primary" data-sound="cancel" onClick={onCancelAbandon}>계속 플레이</button>
            <button className="danger" onClick={onAbandon}>포기하고 메뉴로</button>
          </div>
        </>
      ) : (
        <>
          <p id="pause-dialog-description">현재 Run은 멈춰 있습니다. P, Escape 또는 게임패드 Start로 계속할 수 있습니다.</p>
          <div className="pauseSeed"><span>RUN SEED</span><code>{seed}</code></div>
          <div className="modalActions">
            <button className="primary" onClick={onResume}>계속하기</button>
            <button className="ghost" onClick={onAskAbandon}>Stage 메뉴</button>
          </div>
        </>
      )}
    </ModalDialog>
  );
}

export type FaultDialogProps = {
  message: string;
  count: number;
  copyStatus: string;
  onRetry: () => void;
  onMenu: () => void;
  onCopyLog: () => void;
};

/** A frame threw: the run waits paused behind this dialog (TEC-14). */
export function FaultDialog({ message, count, copyStatus, onRetry, onMenu, onCopyLog }: FaultDialogProps) {
  return (
    <ModalDialog className="settlementBox faultBox" labelledBy="fault-dialog-title" describedBy="fault-dialog-description">
      <div className="modalHead">
        <p>RUN INTERRUPTED</p>
        <h2 id="fault-dialog-title">오류로 Run을 멈췄습니다</h2>
      </div>
      <p id="fault-dialog-description">게임 진행 중 오류가 나서 자동으로 일시정지했습니다. 이어서 시도하면 일시정지 화면으로 돌아가고, 메뉴로 가면 이번 Stage의 보상은 받지 못합니다.</p>
      <p className="faultMessage"><code>{message}</code>{count > 1 && <span> · {count}번째</span>}</p>
      {copyStatus && <p className="seedStatus" role="status" aria-live="polite">{copyStatus}</p>}
      <div className="modalActions">
        <button className="primary" onClick={onRetry}>이어서 시도</button>
        <button className="ghost" data-sound="cancel" onClick={onMenu}>메뉴로</button>
        <button className="ghost" type="button" onClick={onCopyLog}>로그 복사</button>
      </div>
    </ModalDialog>
  );
}

export function ResetDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <ModalDialog className="settlementBox confirmBox" labelledBy="reset-dialog-title" onEscape={onCancel}>
      <div className="modalHead">
        <p>LOCAL SAVE RESET</p>
        <h2 id="reset-dialog-title">진행 데이터를 초기화할까요?</h2>
      </div>
      <p>골드, 외부 레벨, 영구 강화, Stage 해금 진행도가 기본 상태로 돌아갑니다.</p>
      <div className="modalActions">
        <button className="danger" onClick={onConfirm}>초기화</button>
        <button className="ghost" data-sound="cancel" onClick={onCancel}>취소</button>
      </div>
    </ModalDialog>
  );
}
