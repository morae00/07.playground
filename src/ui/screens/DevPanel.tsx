// Developer panel (UI-04): the cheat codes, in developer builds only. It floats under the HUD chips and leaves the
// run going, as the run drawer used to; every other drawer tab moved into the pause hub. Call sites test
// DEVELOPER_UI_AVAILABLE themselves, so shipped builds drop the panel.
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
