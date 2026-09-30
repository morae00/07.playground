// Pause hub (UI-04): the run stays stopped while it is open. Tabs: the build, the run shop, the settings, and the
// controls. Buying and changing settings happen here, paused, instead of in a drawer during play; a max-health
// upgrade bought here heals over PAUSED_HEAL_SECONDS once the run resumes (G6). Leaving asks for a confirmation.
import type { KeyboardEvent } from 'react';
import { PAUSED_HEAL_SECONDS, RUN_UPGRADES, SKILL_IDS, runUpgradeCost, type HudSnapshot, type RunUpgradeId } from '../../game/GameEngine';
import { t } from '../../i18n/strings';
import type { GameOptions } from '../../platform/save';
import { nextRovingId, type RovingKey } from '../inputContracts';
import { ModalDialog } from '../ModalDialog';
import { SettingsPanel } from './SettingsPanel';

export type PauseTab = 'build' | 'shop' | 'settings' | 'controls';

const TABS: readonly PauseTab[] = ['build', 'shop', 'settings', 'controls'];

const CONTROLS = ['move', 'pause', 'draft', 'speed', 'skills'] as const;

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
    const next = nextRovingId(TABS, tab, event.key as RovingKey);
    setTab(next);
    requestAnimationFrame(() => document.getElementById(`pause-tab-${next}`)?.focus());
  };
  const { stats } = snapshot;
  return (
    <ModalDialog className="settlementBox pauseBox" labelledBy="pause-dialog-title" describedBy="pause-dialog-description" onEscape={confirmingAbandon ? onCancelAbandon : onResume}>
      <div className="modalHead">
        <p>{t('pause.kicker')}</p>
        <h2 id="pause-dialog-title">{t('pause.title')}</h2>
      </div>
      {confirmingAbandon ? (
        <>
          <p id="pause-dialog-description">
            {t(snapshot.runMode === 'infinite' ? 'pause.abandon.infinite' : 'pause.abandon.campaign')}
          </p>
          <div className="modalActions">
            <button className="primary" data-sound="cancel" onClick={onCancelAbandon}>{t('pause.keepPlaying')}</button>
            <button className="danger" onClick={onAbandon}>{t('pause.abandon')}</button>
          </div>
        </>
      ) : (
        <>
          <p className="modalLead" id="pause-dialog-description">{t('pause.lead')}</p>
          <div className="hubTabs" role="tablist" aria-label={t('pause.tabs')}>
            {TABS.map((id) => (
              <button id={`pause-tab-${id}`} className={tab === id ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={tab === id} aria-controls={`pause-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={onTabKey} key={id}>
                {t(`pause.tab.${id}`)}
              </button>
            ))}
          </div>
          <section className="hubPanel" id={`pause-panel-${tab}`} role="tabpanel" aria-labelledby={`pause-tab-${tab}`}>
            {tab === 'build' && (
              <>
                <div className="seedLine">
                  <span>{t('pause.seed')}</span>
                  <code>{snapshot.seed}</code>
                  <button className="ghost small" type="button" onClick={onCopySeed}>{t('pause.copy')}</button>
                </div>
                {seedCopyStatus && <p className="seedStatus" role="status" aria-live="polite">{seedCopyStatus}</p>}
                <ul className="hubSkills">
                  {SKILL_IDS.filter((id) => snapshot.skills[id]).map((id) => (
                    <li key={id}>
                      <span className="artSlot" data-art={snapshot.skills[id]!.awakened ? `${id}-awakened` : id} aria-hidden="true" />
                      <b>{t(`skill.${id}`)}</b>
                      <span>{t(snapshot.skills[id]!.awakened ? 'pause.skillLevel.awakened' : 'pause.skillLevel', { level: snapshot.skills[id]!.level })}</span>
                    </li>
                  ))}
                </ul>
                <dl className="hubStats">
                  <div><dt>{t('stats.attack')}</dt><dd>{Math.round(stats.attack)}</dd></div>
                  <div><dt>{t('stats.attackSpeed')}</dt><dd>×{stats.attackSpeed.toFixed(2)}</dd></div>
                  <div><dt>{t('stats.crit')}</dt><dd>{Math.round(stats.critChance * 100)}% · ×{stats.critDamage.toFixed(2)}</dd></div>
                  <div><dt>{t('stats.maxHp')}</dt><dd>{Math.round(stats.maxHp)}</dd></div>
                  <div><dt>{t('stats.defense')}</dt><dd>{stats.defense.toFixed(1)}</dd></div>
                  <div><dt>{t('stats.moveSpeed')}</dt><dd>{Math.round(stats.moveSpeed)}</dd></div>
                </dl>
              </>
            )}
            {tab === 'shop' && (
              <>
                <p className="hubCoins">{t('pause.coins')} <b>{snapshot.coins}</b></p>
                <div className="runShop">
                  {(Object.keys(RUN_UPGRADES) as RunUpgradeId[]).map((id) => {
                    const level = snapshot.runUpgrades[id];
                    const cost = runUpgradeCost(id, level);
                    const reason = snapshot.coins < cost ? t('pause.coinsShort', { n: cost - snapshot.coins }) : undefined;
                    const reasonId = `run-upgrade-${id}-reason`;
                    return (
                      <button className="shopButton" data-sound="none" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? RUN_UPGRADES[id].line} onClick={() => { if (!reason) onBuyRunUpgrade(id); }} key={id}>
                        <span>{t(`runUpgrade.${id}`)} <em>Lv.{level}</em></span>
                        <b>{t('price.coins', { n: cost })} · {RUN_UPGRADES[id].line}</b>
                        {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                      </button>
                    );
                  })}
                </div>
                <p className="settingsNote">{t('pause.healNote', { seconds: PAUSED_HEAL_SECONDS })}</p>
              </>
            )}
            {tab === 'settings' && <SettingsPanel options={options} setOptions={setOptions} inRun />}
            {tab === 'controls' && (
              <dl className="hubControls">
                {CONTROLS.map((action) => <div key={action}><dt>{t(`controls.${action}`)}</dt><dd>{t(`controls.${action}.keys`)}</dd></div>)}
              </dl>
            )}
          </section>
          <div className="modalActions">
            <button className="primary" onClick={onResume}>{t('pause.resume')}</button>
            <button className="ghost" onClick={onAskAbandon}>{t('pause.stageMenu')}</button>
          </div>
        </>
      )}
    </ModalDialog>
  );
}
