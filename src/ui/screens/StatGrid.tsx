// Stat summary (UI-01): the five core stats, with the rest behind a disclosure.
import type { StatBlock } from '../../game/GameEngine';

export function StatGrid({ stats }: { stats: StatBlock }) {
  const rows = [
    ['공격력', stats.attack.toFixed(1)],
    ['방어력', stats.defense.toFixed(1)],
    ['체력', Math.round(stats.maxHp).toString()],
    ['이동속도', Math.round(stats.moveSpeed).toString()],
    ['치명타', `${Math.round(stats.critChance * 100)}%`],
    ['치명피해', `${Math.round(stats.critDamage * 100)}%`],
    ['보스피해', `${Math.round(stats.bossDamage * 100)}%`],
    ['공격속도', `${Math.round(stats.attackSpeed * 100)}%`],
    ['회복속도', `${stats.hpRegen.toFixed(1)}/s`],
    ['자석', Math.round(stats.magnet).toString()],
  ];
  const renderRows = (items: string[][]) => items.map(([label, value]) => (
        <div className="statCell" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
  ));
  return (
    <div className="statSummary">
      <div className="statGrid coreStats">{renderRows(rows.slice(0, 5))}</div>
      <details className="statDetails">
        <summary>상세 능력치</summary>
        <div className="statGrid">{renderRows(rows.slice(5))}</div>
      </details>
    </div>
  );
}
