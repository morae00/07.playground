// Run drawer (UI-01): the build, the run shop, the play options, and the developer cheats, one tab each. The pause
// hub (UI-04) replaces it. Developer-only parts test DEVELOPER_UI_AVAILABLE themselves, so shipped builds drop them.
import type { KeyboardEvent } from 'react';
import { DEVELOPER_UI_AVAILABLE } from '../../platform/developerAccess';
import { RARITY, RUN_UPGRADES, SKILLS, SKILL_IDS, runUpgradeCost, type HudSnapshot, type RunUpgradeId } from '../../game/GameEngine';
import type { GameOptions } from '../../platform/save';
import { OptionsPanel } from './OptionsPanel';

export type DrawerTab = 'skills' | 'upgrades' | 'options' | 'cheats';

export type RunDrawerProps = {
  snapshot: HudSnapshot;
  developerAccess: boolean;
  drawerTab: DrawerTab;
  setDrawerTab: (tab: DrawerTab) => void;
  onTabKey: (event: KeyboardEvent<HTMLButtonElement>) => void;
  seedCopyStatus: string;
  onCopySeed: () => void;
  onBuyRunUpgrade: (id: RunUpgradeId) => void;
  options: GameOptions;
  setOptions: (options: GameOptions) => void;
  cheatCode: string;
  setCheatCode: (code: string) => void;
  cheatMessage: string;
  onApplyCheat: () => void;
};

export function RunDrawer({ snapshot, developerAccess, drawerTab, setDrawerTab, onTabKey, seedCopyStatus, onCopySeed, onBuyRunUpgrade, options, setOptions, cheatCode, setCheatCode, cheatMessage, onApplyCheat }: RunDrawerProps) {
  return (
    <aside className="sidePanel" id="run-drawer" aria-label="런 정보 패널">
      <nav className="drawerTabs" role="tablist" aria-label="런 패널 보기">
        {([
          ['skills', '빌드'],
          ['upgrades', '강화'],
          ['options', '옵션'],
          ...(DEVELOPER_UI_AVAILABLE && developerAccess ? [['cheats', '개발'] as const] : []),
        ] as const).map(([id, label]) => (
          <button
            id={`drawer-tab-${id}`}
            className={drawerTab === id ? 'drawerTab active' : 'drawerTab'}
            role="tab"
            aria-selected={drawerTab === id}
            aria-controls={`drawer-panel-${id}`}
            onClick={() => setDrawerTab(id)}
            tabIndex={drawerTab === id ? 0 : -1}
            onKeyDown={onTabKey}
            key={id}
          >
            {label}
          </button>
        ))}
      </nav>

      {drawerTab === 'skills' && <section className="panelBlock drawerPanel" id="drawer-panel-skills" role="tabpanel" aria-labelledby="drawer-tab-skills" tabIndex={0}>
        <h2>현재 빌드</h2>
        <div className="seedLine">
          <span>RUN SEED</span>
          <code>{snapshot.seed}</code>
          <button className="ghost small" type="button" onClick={onCopySeed}>복사</button>
        </div>
        {seedCopyStatus && <p className="seedStatus" role="status" aria-live="polite">{seedCopyStatus}</p>}
        <div className="skillList">
          {SKILL_IDS.filter((id) => snapshot.skills[id]).map((id) => {
            const state = snapshot.skills[id]!;
            const def = SKILLS[id];
            return (
              <div className={`skillPill ${RARITY[def.rarity].className}`} key={id}>
                <span>{def.shortName}</span>
                <b>Lv.{state.level}{state.awakened ? 'A' : ''}</b>
              </div>
            );
          })}
          {SKILL_IDS.every((id) => !snapshot.skills[id]) && <div className="emptyText">첫 레벨업 대기</div>}
        </div>
      </section>}

      {drawerTab === 'upgrades' && <section className="panelBlock drawerPanel" id="drawer-panel-upgrades" role="tabpanel" aria-labelledby="drawer-tab-upgrades" tabIndex={0}>
        <h2>런 강화</h2>
        <div className="runShop">
          {(Object.keys(RUN_UPGRADES) as RunUpgradeId[]).map((id) => {
            const level = snapshot.runUpgrades[id];
            const cost = runUpgradeCost(id, level);
            const reason = snapshot.coins < cost ? `코인 ${cost - snapshot.coins}개 부족` : undefined;
            const reasonId = `run-upgrade-${id}-reason`;
            return (
              <button className="shopButton" data-sound="none" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? RUN_UPGRADES[id].line} onClick={() => { if (!reason) onBuyRunUpgrade(id); }} key={id}>
                <span>{RUN_UPGRADES[id].label} <em>Lv.{level}</em></span>
                <b>{cost}c</b>
                {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
              </button>
            );
          })}
        </div>
      </section>}

      {drawerTab === 'options' && <OptionsPanel options={options} setOptions={setOptions} />}

      {DEVELOPER_UI_AVAILABLE && drawerTab === 'cheats' && developerAccess && <section className="panelBlock cheatBlock drawerPanel" id="drawer-panel-cheats" role="tabpanel" aria-labelledby="drawer-tab-cheats" tabIndex={0}>
        <h2>개발 도구</h2>
        <div className="cheatRow">
          <input aria-label="Cheat code" value={cheatCode} onChange={(event) => setCheatCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onApplyCheat(); }} placeholder="CODE" />
          <button className="ghost small" onClick={onApplyCheat}>입력</button>
        </div>
        {cheatMessage && <div className="emptyText" role="status" aria-live="polite" aria-atomic="true">{cheatMessage}</div>}
      </section>}
    </aside>
  );
}
