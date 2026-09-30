// Settings (UI-04): one panel for the menu and the pause hub, grouped as sound, screen, accessibility, and game.
// Every option saves through sanitizeOptions, so an older save loads with the newer options at their defaults (G17).
import type { ChangeEvent, ReactNode } from 'react';
import { DEVELOPER_UI_AVAILABLE } from '../../platform/developerAccess';
import type { GameOptions, PaceMode } from '../../platform/save';

type NumberOption = 'volume' | 'musicVolume' | 'sfxVolume' | 'effects' | 'uiScale' | 'hitReaction';
type SwitchOption = 'damageNumbers' | 'screenShake' | 'reducedFlash' | 'reducedMotion' | 'autoPause';

export function SettingsPanel({ options, setOptions, inRun = false, children }: { options: GameOptions; setOptions: (options: GameOptions) => void; inRun?: boolean; children?: ReactNode }) {
  const slider = (key: NumberOption, label: string, min: number, max: number, step: number) => (
    <label>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={options[key]} onChange={(event: ChangeEvent<HTMLInputElement>) => setOptions({ ...options, [key]: Number(event.target.value) })} />
      <output>{Math.round(options[key] * 100)}%</output>
    </label>
  );
  const toggle = (key: SwitchOption, label: string) => (
    <label className="checkLine">
      <input type="checkbox" checked={options[key]} onChange={(event) => setOptions({ ...options, [key]: event.target.checked })} />
      <span>{label}</span>
    </label>
  );
  return (
    <div className="settingsPanel">
      <fieldset>
        <legend>소리</legend>
        {slider('volume', '전체 볼륨', 0, 1, 0.01)}
        {slider('musicVolume', '음악', 0, 1, 0.01)}
        {slider('sfxVolume', '효과음', 0, 1, 0.01)}
      </fieldset>
      <fieldset>
        <legend>화면</legend>
        <label>
          <span>체력바</span>
          <select value={options.healthBars} onChange={(event) => setOptions({ ...options, healthBars: event.target.value as GameOptions['healthBars'] })}>
            <option value="elite">대형+</option>
            <option value="all">전체</option>
            <option value="off">끄기</option>
          </select>
        </label>
        {slider('effects', '이펙트', 0.25, 1, 0.05)}
        {slider('uiScale', 'HUD 크기', 0.8, 1.3, 0.05)}
        {slider('hitReaction', '타격 반동', 0, 1, 0.05)}
        {toggle('damageNumbers', '데미지 숫자')}
        {toggle('screenShake', '화면 흔들림')}
      </fieldset>
      <fieldset>
        <legend>접근성</legend>
        {toggle('reducedFlash', '섬광 감소')}
        {toggle('reducedMotion', '모션 감소 (시스템 설정과 관계없이)')}
      </fieldset>
      <fieldset>
        <legend>게임</legend>
        <label>
          <span>라운드 길이</span>
          <select value={options.paceMode} onChange={(event) => setOptions({ ...options, paceMode: event.target.value as PaceMode })}>
            <option value="standard">표준</option>
            <option value="practice">연습 (짧은 Stage · 해금 없음 · 보상 30%)</option>
            {DEVELOPER_UI_AVAILABLE && <option value="showcase">쇼케이스</option>}
          </select>
        </label>
        {inRun && <p className="settingsNote">라운드 길이는 다음 런부터 적용됩니다.</p>}
        {toggle('autoPause', '창을 벗어나면 자동 일시정지')}
      </fieldset>
      {children}
    </div>
  );
}
