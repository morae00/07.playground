// Play options (UI-01): health bars, volume, effects, accessibility, and pace. The run drawer shows it today; the
// shared settings screen (UI-04) takes it over for the menu and the pause hub.
import { DEVELOPER_UI_AVAILABLE } from '../../platform/developerAccess';
import type { GameOptions, PaceMode } from '../../platform/save';

export function OptionsPanel({ options, setOptions }: { options: GameOptions; setOptions: (options: GameOptions) => void }) {
  return (
    <section className="panelBlock compactOptions drawerPanel" id="drawer-panel-options" role="tabpanel" aria-labelledby="drawer-tab-options" tabIndex={0}>
      <h2>플레이 옵션</h2>
      <label>
        <span>체력바</span>
        <select value={options.healthBars} onChange={(event) => setOptions({ ...options, healthBars: event.target.value as GameOptions['healthBars'] })}>
          <option value="elite">대형+</option>
          <option value="all">전체</option>
          <option value="off">끄기</option>
        </select>
      </label>
      <label>
        <span>전체 볼륨</span>
        <input type="range" min="0" max="1" step="0.01" value={options.volume} onChange={(event) => setOptions({ ...options, volume: Number(event.target.value) })} />
      </label>
      <label>
        <span>효과음</span>
        <input type="range" min="0" max="1" step="0.01" value={options.sfxVolume} onChange={(event) => setOptions({ ...options, sfxVolume: Number(event.target.value) })} />
      </label>
      <label>
        <span>이펙트</span>
        <input type="range" min="0.25" max="1" step="0.05" value={options.effects} onChange={(event) => setOptions({ ...options, effects: Number(event.target.value) })} />
      </label>
      <label className="checkLine">
        <input type="checkbox" checked={options.damageNumbers} onChange={(event) => setOptions({ ...options, damageNumbers: event.target.checked })} />
        <span>데미지 숫자</span>
      </label>
      <label className="checkLine">
        <input type="checkbox" checked={options.screenShake} onChange={(event) => setOptions({ ...options, screenShake: event.target.checked })} />
        <span>화면 흔들림</span>
      </label>
      <label className="checkLine">
        <input type="checkbox" checked={options.reducedFlash} onChange={(event) => setOptions({ ...options, reducedFlash: event.target.checked })} />
        <span>섬광 감소</span>
      </label>
      <label className="checkLine">
        <input type="checkbox" checked={options.autoPause} onChange={(event) => setOptions({ ...options, autoPause: event.target.checked })} />
        <span>창을 벗어나면 자동 일시정지</span>
      </label>
      <label>
        <span>라운드 길이</span>
        <select value={options.paceMode} onChange={(event) => setOptions({ ...options, paceMode: event.target.value as PaceMode })}>
          <option value="standard">표준</option>
          <option value="practice">연습 (짧은 Stage · 해금 없음 · 보상 30%)</option>
          {DEVELOPER_UI_AVAILABLE && <option value="showcase">쇼케이스</option>}
        </select>
      </label>
    </section>
  );
}
