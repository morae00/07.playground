// Run dialogs (UI-01): the loop-fault dialog (TEC-14), and on the menu the suspended-run (UI-13) and save reset
// confirmations. The pause dialog became the pause hub (UI-04, PauseHub.tsx).
import { t } from '../../i18n/strings';
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
        <p>{t('fault.kicker')}</p>
        <h2 id="fault-dialog-title">{t('fault.title')}</h2>
      </div>
      <p id="fault-dialog-description">{t('fault.body')}</p>
      <p className="faultMessage"><code>{message}</code>{count > 1 && <span>{t('fault.count', { n: count })}</span>}</p>
      {copyStatus && <p className="seedStatus" role="status" aria-live="polite">{copyStatus}</p>}
      <div className="modalActions">
        <button className="primary" onClick={onRetry}>{t('fault.retry')}</button>
        <button className="ghost" data-sound="cancel" onClick={onMenu}>{t('common.menu')}</button>
        <button className="ghost" type="button" onClick={onCopyLog}>{t('common.copyLog')}</button>
      </div>
    </ModalDialog>
  );
}

/** UI-13: a suspended run ends only when the player says so, settled for what it reached; a new run or Discard asks first. */
export function SuspendDialog({ discard, gold, xp, onConfirm, onCancel }: { discard: boolean; gold: number; xp: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <ModalDialog className="settlementBox confirmBox" labelledBy="suspend-dialog-title" onEscape={onCancel} inputGuardMs={350}>
      <div className="modalHead">
        <p>{t('resume.title')}</p>
        <h2 id="suspend-dialog-title">{t(discard ? 'resume.discardTitle' : 'resume.replaceTitle')}</h2>
      </div>
      <p>{t(discard ? 'resume.discardBody' : 'resume.replaceBody', { gold, xp })}</p>
      <div className="modalActions">
        <button className="danger" onClick={onConfirm}>{t(discard ? 'resume.discardConfirm' : 'resume.replaceConfirm')}</button>
        <button className="ghost" data-sound="cancel" onClick={onCancel}>{t('common.cancel')}</button>
      </div>
    </ModalDialog>
  );
}

export function ResetDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <ModalDialog className="settlementBox confirmBox" labelledBy="reset-dialog-title" onEscape={onCancel}>
      <div className="modalHead">
        <p>{t('reset.kicker')}</p>
        <h2 id="reset-dialog-title">{t('reset.title')}</h2>
      </div>
      <p>{t('reset.body')}</p>
      <div className="modalActions">
        <button className="danger" onClick={onConfirm}>{t('reset.confirm')}</button>
        <button className="ghost" data-sound="cancel" onClick={onCancel}>{t('common.cancel')}</button>
      </div>
    </ModalDialog>
  );
}
