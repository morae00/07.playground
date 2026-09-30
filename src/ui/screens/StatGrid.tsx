// Stat summary (UI-01): the five core stats, with the rest behind a disclosure.
import type { StatBlock } from '../../game/GameEngine';
import { t } from '../../i18n/strings';
import type { StringKey } from '../../i18n/text';

export function StatGrid({ stats }: { stats: StatBlock }) {
  const rows: (readonly [StringKey, string])[] = [
    ['stats.attack', stats.attack.toFixed(1)],
    ['stats.defense', stats.defense.toFixed(1)],
    ['stats.maxHp', Math.round(stats.maxHp).toString()],
    ['stats.moveSpeed', Math.round(stats.moveSpeed).toString()],
    ['stats.crit', `${Math.round(stats.critChance * 100)}%`],
    ['stats.critDamage', `${Math.round(stats.critDamage * 100)}%`],
    ['stats.bossDamage', `${Math.round(stats.bossDamage * 100)}%`],
    ['stats.attackSpeed', `${Math.round(stats.attackSpeed * 100)}%`],
    ['stats.regen', `${stats.hpRegen.toFixed(1)}/s`],
    ['stats.magnet', Math.round(stats.magnet).toString()],
  ];
  const renderRows = (items: typeof rows) => items.map(([label, value]) => (
        <div className="statCell" key={label}>
          <span>{t(label)}</span>
          <strong>{value}</strong>
        </div>
  ));
  return (
    <div className="statSummary">
      <div className="statGrid coreStats">{renderRows(rows.slice(0, 5))}</div>
      <details className="statDetails">
        <summary>{t('stats.more')}</summary>
        <div className="statGrid">{renderRows(rows.slice(5))}</div>
      </details>
    </div>
  );
}
