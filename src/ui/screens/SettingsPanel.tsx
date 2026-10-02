// Settings (UI-04): one panel for the menu and the pause hub, grouped as sound, screen, accessibility, game, and
// assists (SYS-07).
// Every option saves through sanitizeOptions, so an older save loads with the newer options at their defaults (G17).
import type { ChangeEvent, ReactNode } from 'react';
import { t } from '../../i18n/strings';
import type { StringKey } from '../../i18n/text';
import { DEVELOPER_UI_AVAILABLE } from '../../platform/developerAccess';
import type { GameOptions, PaceMode } from '../../platform/save';
import { MoveKeysSetting } from './MoveKeysSetting';

type NumberOption = 'volume' | 'musicVolume' | 'sfxVolume' | 'effects' | 'uiScale' | 'hitReaction' | 'assistDamage' | 'assistEnemySpeed';
type SwitchOption = 'damageNumbers' | 'screenShake' | 'reducedFlash' | 'reducedMotion' | 'autoPause' | 'assistSlowGame';

export function SettingsPanel({ options, setOptions, inRun = false, children }: { options: GameOptions; setOptions: (options: GameOptions) => void; inRun?: boolean; children?: ReactNode }) {
  const slider = (key: NumberOption, label: StringKey, min: number, max: number, step: number) => (
    <label>
      <span>{t(label)}</span>
      <input type="range" min={min} max={max} step={step} value={options[key]} onChange={(event: ChangeEvent<HTMLInputElement>) => setOptions({ ...options, [key]: Number(event.target.value) })} />
      <output>{Math.round(options[key] * 100)}%</output>
    </label>
  );
  const toggle = (key: SwitchOption, label: StringKey) => (
    <label className="checkLine">
      <input type="checkbox" checked={options[key]} onChange={(event) => setOptions({ ...options, [key]: event.target.checked })} />
      <span>{t(label)}</span>
    </label>
  );
  return (
    <div className="settingsPanel">
      <fieldset>
        <legend>{t('settings.sound')}</legend>
        {slider('volume', 'settings.volume', 0, 1, 0.01)}
        {slider('musicVolume', 'settings.music', 0, 1, 0.01)}
        {slider('sfxVolume', 'settings.sfx', 0, 1, 0.01)}
      </fieldset>
      <fieldset>
        <legend>{t('settings.screen')}</legend>
        <label>
          <span>{t('settings.healthBars')}</span>
          <select value={options.healthBars} onChange={(event) => setOptions({ ...options, healthBars: event.target.value as GameOptions['healthBars'] })}>
            <option value="elite">{t('settings.healthBars.elite')}</option>
            <option value="all">{t('settings.healthBars.all')}</option>
            <option value="off">{t('settings.healthBars.off')}</option>
          </select>
        </label>
        {slider('effects', 'settings.effects', 0.25, 1, 0.05)}
        {slider('uiScale', 'settings.uiScale', 0.8, 1.3, 0.05)}
        {slider('hitReaction', 'settings.hitReaction', 0, 1, 0.05)}
        {toggle('damageNumbers', 'settings.damageNumbers')}
        {toggle('screenShake', 'settings.screenShake')}
      </fieldset>
      <fieldset>
        <legend>{t('settings.access')}</legend>
        {toggle('reducedFlash', 'settings.reducedFlash')}
        {toggle('reducedMotion', 'settings.reducedMotion')}
        <MoveKeysSetting keys={options.moveKeys} onChange={(moveKeys) => setOptions({ ...options, moveKeys })} />
      </fieldset>
      <fieldset>
        <legend>{t('settings.game')}</legend>
        <label>
          <span>{t('settings.pace')}</span>
          <select value={options.paceMode} onChange={(event) => setOptions({ ...options, paceMode: event.target.value as PaceMode })}>
            <option value="standard">{t('settings.pace.standard')}</option>
            <option value="practice">{t('settings.pace.practice')}</option>
            {DEVELOPER_UI_AVAILABLE && <option value="showcase">쇼케이스</option>}
          </select>
        </label>
        {inRun && <p className="settingsNote">{t('settings.pace.note')}</p>}
        {toggle('autoPause', 'settings.autoPause')}
      </fieldset>
      <fieldset>
        <legend>{t('settings.assist')}</legend>
        {slider('assistDamage', 'settings.assistDamage', 0.5, 1, 0.05)}
        {slider('assistEnemySpeed', 'settings.assistEnemySpeed', 0.8, 1, 0.05)}
        {toggle('assistSlowGame', 'settings.assistSlowGame')}
        <p className="settingsNote">{t('settings.assistNote')}</p>
      </fieldset>
      {children}
    </div>
  );
}
