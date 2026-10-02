// Developer panel (UI-04): the cheat codes, in developer builds only. It floats under the HUD chips and leaves the
// run going, as the run drawer used to; every other drawer tab moved into the pause hub. Call sites test
// DEVELOPER_UI_AVAILABLE themselves, so shipped builds drop the panel.
import { useState } from 'react';
import { clearDevRunLog, devRunCoinShare, readDevRunLog } from '../../platform/devRunLog';
export type DevPanelProps = {
  cheatCode: string;
  setCheatCode: (code: string) => void;
  cheatMessage: string;
  onApplyCheat: () => void;
};

export function DevPanel({ cheatCode, setCheatCode, cheatMessage, onApplyCheat }: DevPanelProps) {
  return (
    <aside className="devPanel" id="dev-panel" aria-label="개발 도구">
      <h2>개발 도구</h2>
      <div className="cheatRow">
        <input aria-label="Cheat code" value={cheatCode} onChange={(event) => setCheatCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onApplyCheat(); }} placeholder="CODE" />
        <button className="ghost small" onClick={onApplyCheat}>입력</button>
      </div>
      {cheatMessage && <div className="emptyText" role="status" aria-live="polite" aria-atomic="true">{cheatMessage}</div>}
    </aside>
  );
}

const devStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** D-07: the developer run log for playtests: how many runs it holds, their median coin balance share, copy, and clear. */
export function DevRunLog() {
  const [entries, setEntries] = useState(() => readDevRunLog(devStorage()));
  const [status, setStatus] = useState('');
  const share = devRunCoinShare(entries);
  const copy = async () => {
    const latest = readDevRunLog(devStorage());
    setEntries(latest);
    try {
      await navigator.clipboard.writeText(JSON.stringify(latest, null, 1));
      setStatus('런 기록 복사함');
    } catch {
      setStatus('런 기록 복사 실패 (클립보드 없음)');
    }
  };
  return (
    <div className="cheatRow devRunLog">
      <span>런 기록 {entries.length}건 · 잔액 비율 중앙값 {share === null ? '-' : `${Math.round(share * 100)}%`}</span>
      <button className="ghost small" type="button" onClick={() => void copy()}>런 기록 복사</button>
      <button className="ghost small" type="button" onClick={() => { clearDevRunLog(devStorage()); setEntries([]); setStatus('런 기록 지움'); }}>런 기록 지우기</button>
      {status && <span role="status">{status}</span>}
    </div>
  );
}
