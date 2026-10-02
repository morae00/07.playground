// Window mode setting (TEC-09): window or full screen, in the desktop app only. The desktop app keeps the mode
// itself, so this mirrors it live, whether it changes here, in the menu (Ctrl+Cmd+F), or with the green button.
import { useEffect, useState } from 'react';
import { t } from '../../i18n/strings';
import { desktopWindow } from '../../platform/desktopWindow';

export function WindowModeSetting() {
  const bridge = desktopWindow();
  const [fullScreen, setFullScreen] = useState<boolean | null>(null);

  useEffect(() => {
    if (!bridge) return undefined;
    let live = true;
    void bridge.fullScreen().then((on) => { if (live) setFullScreen(on); }, () => undefined);
    const stop = bridge.onFullScreen((on) => setFullScreen(on));
    return () => {
      live = false;
      stop();
    };
  }, [bridge]);

  if (!bridge || fullScreen === null) return null;
  return (
    <>
      <label>
        <span>{t('settings.windowMode')}</span>
        <select value={fullScreen ? 'fullScreen' : 'window'} onChange={(event) => { void bridge.setFullScreen(event.target.value === 'fullScreen'); }}>
          <option value="window">{t('settings.windowMode.window')}</option>
          <option value="fullScreen">{t('settings.windowMode.fullScreen')}</option>
        </select>
      </label>
      <p className="settingsNote">{t('settings.windowMode.note')}</p>
    </>
  );
}
