// Save export and import (TEC-15): on the menu's settings tab only, never during a run. Export copies the game's
// entries as one text; import asks twice, then reloads the game at once, so nothing the page holds in memory can
// write over what was just imported.
import { useState } from 'react';
import { exportSave, importSave, type ImportRefusal } from '../../platform/saveTransfer';

const REFUSAL: Record<ImportRefusal, string> = {
  format: '내보낸 세이브 글이 아닙니다. 처음부터 끝까지 그대로 붙여 넣어 주세요.',
  save: '세이브가 없거나 손상되어 가져오지 않았습니다. 지금 데이터는 그대로입니다.',
  future: '더 새 버전에서 내보낸 세이브입니다. 게임을 업데이트한 뒤 가져와 주세요.',
  storage: '저장하지 못했습니다. 지금 데이터는 그대로입니다.',
};

export function SaveTransfer() {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [armed, setArmed] = useState(false);
  const exportNow = async () => {
    const data = exportSave(window.localStorage);
    setText(data);
    setArmed(false);
    try {
      await navigator.clipboard.writeText(data);
      setNote('클립보드에 복사했습니다. 메모장 같은 곳에 붙여 넣어 보관하세요.');
    } catch {
      setNote('위 글 전체를 복사해 보관하세요.');
    }
  };
  const importNow = () => {
    if (!text.trim()) return setNote('내보낸 세이브 글을 먼저 붙여 넣어 주세요.');
    if (!armed) {
      setArmed(true);
      return setNote('지금 진행 상황을 이 세이브로 덮어씁니다. 한 번 더 누르면 가져옵니다.');
    }
    const result = importSave(window.localStorage, text);
    if (result.ok) return window.location.reload();
    setArmed(false);
    setNote(REFUSAL[result.reason]);
  };
  return (
    <fieldset className="saveTransfer">
      <legend>세이브</legend>
      <textarea
        aria-label="세이브 글 (내보내기 결과, 또는 가져올 글)"
        rows={3}
        spellCheck={false}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setArmed(false);
        }}
      />
      <div className="saveTransferActions">
        <button className="ghost" type="button" onClick={() => void exportNow()}>내보내기</button>
        <button className="ghost" type="button" onClick={importNow}>{armed ? '덮어쓰고 가져오기' : '가져오기'}</button>
      </div>
      <p className="settingsNote" role="status">{note}</p>
    </fieldset>
  );
}
