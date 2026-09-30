// Run dialogs (UI-01): the loop-fault dialog (TEC-14) and the save reset confirmation on the menu. The pause
// dialog became the pause hub (UI-04, PauseHub.tsx).
import { ModalDialog } from '../ModalDialog';

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
