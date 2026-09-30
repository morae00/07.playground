// Pause hub (UI-04): the run stays stopped while it is open. Tabs: the build, the run shop, the settings, and the
// controls. Buying and changing settings happen here, paused, instead of in a drawer during play; a max-health
// upgrade bought here heals over PAUSED_HEAL_SECONDS once the run resumes (G6). Leaving asks for a confirmation.
import type { KeyboardEvent } from 'react';
import { PAUSED_HEAL_SECONDS, RUN_UPGRADES, SKILLS, SKILL_IDS, runUpgradeCost, type HudSnapshot, type RunUpgradeId } from '../../game/GameEngine';
import type { GameOptions } from '../../platform/save';
import { nextRovingId, type RovingKey } from '../inputContracts';
import { ModalDialog } from '../ModalDialog';
import { SettingsPanel } from './SettingsPanel';

export type PauseTab = 'build' | 'shop' | 'settings' | 'controls';

const TABS: ReadonlyArray<readonly [PauseTab, string]> = [['build', '빌드'], ['shop', '강화'], ['settings', '설정'], ['controls', '조작']];

const CONTROLS: ReadonlyArray<readonly [string, string]> = [
  ['이동', 'WASD · 방향키 · 포인터 드래그 · 게임패드 왼쪽 스틱'],
  ['일시정지', 'P · Escape · 게임패드 Start'],
  ['드래프트 선택', '숫자 1–4 · 방향키와 Enter · 게임패드 D-pad와 A'],
  ['게임 속도', 'HUD의 ×1 / ×2 버튼'],
  ['스킬', '모든 스킬은 자동으로 발동합니다'],
];

export type PauseHubProps = {
  snapshot: HudSnapshot;
  tab: PauseTab;
  setTab: (tab: PauseTab) => void;
  confirmingAbandon: boolean;
  onResume: () => void;
  onAskAbandon: () => void;
  onCancelAbandon: () => void;
  onAbandon: () => void;
  onBuyRunUpgrade: (id: RunUpgradeId) => void;
  options: GameOptions;
  setOptions: (options: GameOptions) => void;
  seedCopyStatus: string;
  onCopySeed: () => void;
};

export function PauseHub({ snapshot, tab, setTab, confirmingAbandon, onResume, onAskAbandon, onCancelAbandon, onAbandon, onBuyRunUpgrade, options, setOptions, seedCopyStatus, onCopySeed }: PauseHubProps) {
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = nextRovingId(TABS.map(([id]) => id), tab, event.key as RovingKey);
    setTab(next);
    requestAnimationFrame(() => document.getElementById(`pause-tab-${next}`)?.focus());
  };
  const { stats } = snapshot;
  return (
    <ModalDialog className="settlementBox pauseBox" labelledBy="pause-dialog-title" describedBy="pause-dialog-description" onEscape={confirmingAbandon ? onCancelAbandon : onResume}>
      <div className="modalHead">
        <p>RUN PAUSED</p>
        <h2 id="pause-dialog-title">일시정지</h2>
      </div>
      {confirmingAbandon ? (
        <>
          <p id="pause-dialog-description">
            {snapshot.runMode === 'infinite'
              ? '지금 포기하면 이번 무한 경쟁 기록과 보상이 남지 않습니다. 정말 메뉴로 돌아갈까요?'
              : '지금 포기하면 이번 Stage의 골드와 경험치를 받지 못합니다. 정말 메뉴로 돌아갈까요?'}
          </p>
          <div className="modalActions">
            <button className="primary" data-sound="cancel" onClick={onCancelAbandon}>계속 플레이</button>
            <button className="danger" onClick={onAbandon}>포기하고 메뉴로</button>
          </div>
        </>
      ) : (
        <>
          <p className="modalLead" id="pause-dialog-description">런이 멈춰 있습니다. P, Escape 또는 게임패드 Start로 계속합니다.</p>
          <div className="hubTabs" role="tablist" aria-label="일시정지 메뉴">
            {TABS.map(([id, label]) => (
              <button id={`pause-tab-${id}`} className={tab === id ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={tab === id} aria-controls={`pause-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={onTabKey} key={id}>
                {label}
              </button>
            ))}
          </div>
          <section className="hubPanel" id={`pause-panel-${tab}`} role="tabpanel" aria-labelledby={`pause-tab-${tab}`}>
            {tab === 'build' && (
              <>
                <div className="seedLine">
                  <span>RUN SEED</span>
                  <code>{snapshot.seed}</code>
                  <button className="ghost small" type="button" onClick={onCopySeed}>복사</button>
                </div>
                {seedCopyStatus && <p className="seedStatus" role="status" aria-live="polite">{seedCopyStatus}</p>}
                <ul className="hubSkills">
                  {SKILL_IDS.filter((id) => snapshot.skills[id]).map((id) => (
                    <li key={id}>
                      <span className="artSlot" data-art={snapshot.skills[id]!.awakened ? `${id}-awakened` : id} aria-hidden="true" />
                      <b>{SKILLS[id].name}</b>
                      <span>Lv.{snapshot.skills[id]!.level}{snapshot.skills[id]!.awakened ? ' · 각성' : ''}</span>
                    </li>
                  ))}
                </ul>
                <dl className="hubStats">
                  <div><dt>공격력</dt><dd>{Math.round(stats.attack)}</dd></div>
                  <div><dt>공격속도</dt><dd>×{stats.attackSpeed.toFixed(2)}</dd></div>
                  <div><dt>치명타</dt><dd>{Math.round(stats.critChance * 100)}% · ×{stats.critDamage.toFixed(2)}</dd></div>
                  <div><dt>최대 체력</dt><dd>{Math.round(stats.maxHp)}</dd></div>
                  <div><dt>방어</dt><dd>{stats.defense.toFixed(1)}</dd></div>
                  <div><dt>이동 속도</dt><dd>{Math.round(stats.moveSpeed)}</dd></div>
                </dl>
              </>
            )}
            {tab === 'shop' && (
              <>
                <p className="hubCoins">코인 <b>{snapshot.coins}</b></p>
                <div className="runShop">
                  {(Object.keys(RUN_UPGRADES) as RunUpgradeId[]).map((id) => {
                    const level = snapshot.runUpgrades[id];
                    const cost = runUpgradeCost(id, level);
                    const reason = snapshot.coins < cost ? `코인 ${cost - snapshot.coins}개 부족` : undefined;
                    const reasonId = `run-upgrade-${id}-reason`;
                    return (
                      <button className="shopButton" data-sound="none" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? RUN_UPGRADES[id].line} onClick={() => { if (!reason) onBuyRunUpgrade(id); }} key={id}>
                        <span>{RUN_UPGRADES[id].label} <em>Lv.{level}</em></span>
                        <b>{cost}c · {RUN_UPGRADES[id].line}</b>
                        {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                      </button>
                    );
                  })}
                </div>
                <p className="settingsNote">체력 강화로 늘어난 체력은 재개한 뒤 {PAUSED_HEAL_SECONDS}초에 걸쳐 차오릅니다.</p>
              </>
            )}
            {tab === 'settings' && <SettingsPanel options={options} setOptions={setOptions} inRun />}
            {tab === 'controls' && (
              <dl className="hubControls">
                {CONTROLS.map(([action, keys]) => <div key={action}><dt>{action}</dt><dd>{keys}</dd></div>)}
              </dl>
            )}
          </section>
          <div className="modalActions">
            <button className="primary" onClick={onResume}>계속하기</button>
            <button className="ghost" onClick={onAskAbandon}>Stage 메뉴</button>
          </div>
        </>
      )}
    </ModalDialog>
  );
}
