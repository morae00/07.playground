// Save export and import (TEC-15): on the menu's settings tab only, never during a run. Export copies the game's
// entries as one text; import asks twice, then reloads the game at once, so nothing the page holds in memory can
// write over what was just imported.
import { useState } from 'react';
import { t } from '../../i18n/strings';
import { exportSave, importSave } from '../../platform/saveTransfer';

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
      setNote(t('save.copied'));
    } catch {
      setNote(t('save.copyManually'));
    }
  };
  const importNow = () => {
    if (!text.trim()) return setNote(t('save.pasteFirst'));
    if (!armed) {
      setArmed(true);
      return setNote(t('save.confirm'));
    }
    const result = importSave(window.localStorage, text);
    if (result.ok) return window.location.reload();
    setArmed(false);
    setNote(t(`save.refuse.${result.reason}`));
  };
  return (
    <fieldset className="saveTransfer">
      <legend>{t('save.legend')}</legend>
      <textarea
        aria-label={t('save.text')}
        rows={3}
        spellCheck={false}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setArmed(false);
        }}
      />
      <div className="saveTransferActions">
        <button className="ghost" type="button" onClick={() => void exportNow()}>{t('save.export')}</button>
        <button className="ghost" type="button" onClick={importNow}>{t(armed ? 'save.importConfirm' : 'save.import')}</button>
      </div>
      <p className="settingsNote" role="status">{note}</p>
    </fieldset>
  );
}
