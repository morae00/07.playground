import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// Grammar contract (TEC-11): the real engine must keep the preserved game grammar. A failure here means a
// change altered core rules; update the preserved-grammar list and RULES_VERSION together with the code.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { GameEngine } = await import('/tmp/blackline-survivor-p0/App.mjs');

const meta = () => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = () => ({ healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' });

function createEngine(onDraft = () => {}) {
  return new GameEngine(createHeadlessCanvas(1440, 900), meta(), options(), {
    onSnapshot() {},
    onDraft,
    onRoundClear() {},
    onGameOver() {},
  });
}

test('G7: Stage 5 is a mid boss, Stage 10 a chapter boss, the rest survival stages', () => {
  const engine = createEngine();
  try {
    const kinds = [];
    for (let stage = 1; stage <= 10; stage += 1) {
      engine.startRun(1, stage, 1000 + stage);
      kinds.push(engine.kind);
    }
    assert.deepEqual(kinds, ['normal', 'normal', 'normal', 'normal', 'midBoss', 'normal', 'normal', 'normal', 'normal', 'finalBoss']);
  } finally {
    engine.dispose();
  }
});

test('G4: level-up drafts show three cards and boss rewards four', () => {
  const drafts = [];
  const engine = createEngine((draft) => drafts.push(draft));
  try {
    engine.startRun(1, 1, 42);
    engine.openDraft('level', 'resume');
    assert.equal(drafts.at(-1).cards.length, 3);
    engine.completeDraft(drafts.at(-1).cards[0], drafts.at(-1).id);
    engine.openDraft('boss', 'resume');
    assert.equal(drafts.at(-1).cards.length, 4);
  } finally {
    engine.dispose();
  }
});

test('G9/V4: spawned enemies keep their tier radii and the 58/30/12 tier mix', () => {
  const engine = createEngine();
  try {
    engine.startRun(2, 3, 7);
    const counts = { small: 0, medium: 0, large: 0 };
    const radii = { small: new Set(), medium: new Set(), large: new Set() };
    for (let index = 0; index < 6000; index += 1) {
      engine.enemies = [];
      engine.spawnEnemy(1);
      const enemy = engine.enemies[0];
      counts[enemy.tier] += 1;
      radii[enemy.tier].add(enemy.radius);
    }
    assert.deepEqual([...radii.small], [12]);
    assert.deepEqual([...radii.medium], [19]);
    assert.deepEqual([...radii.large], [28]);
    assert.ok(Math.abs(counts.small / 6000 - 0.58) < 0.02, `small share ${counts.small / 6000}`);
    assert.ok(Math.abs(counts.medium / 6000 - 0.30) < 0.02, `medium share ${counts.medium / 6000}`);
    assert.ok(Math.abs(counts.large / 6000 - 0.12) < 0.02, `large share ${counts.large / 6000}`);
  } finally {
    engine.dispose();
  }
});

test('G8/G10: main bosses use radius 54, field bosses radius 38 and appear at the 36% mark', () => {
  const engine = createEngine();
  try {
    engine.startRun(1, 5, 11);
    assert.equal(engine.enemies.find((enemy) => enemy.isBoss).radius, 54);

    engine.startRun(1, 2, 12);
    engine.enemies = [];
    engine.timeLeft = engine.duration * (1 - 0.35);
    engine.spawnEnemies(1 / 60);
    assert.equal(engine.enemies.some((enemy) => enemy.isBoss), false, 'no field boss before 36%');
    engine.timeLeft = engine.duration * (1 - 0.361);
    engine.spawnEnemies(1 / 60);
    const fieldBoss = engine.enemies.find((enemy) => enemy.isBoss);
    assert.ok(fieldBoss, 'a field boss appears once progress passes 36%');
    assert.equal(fieldBoss.radius, 38);
    assert.equal(fieldBoss.boss.role, 'field');
  } finally {
    engine.dispose();
  }
});

test('G14: the same seed gives the same run under both rule sets when replayed', () => {
  for (const ruleSet of ['classic', 'remaster']) {
    const snapshots = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const engine = createEngine();
      try {
        engine.setRuleSet(ruleSet);
        engine.startRun(1, 1, 0x5eed);
        for (let frame = 0; frame < 600; frame += 1) engine.advanceFrame(1 / 60, false);
        snapshots.push(JSON.stringify({ player: engine.player, enemies: engine.enemies.map((enemy) => [enemy.x, enemy.y, enemy.hp]) }));
      } finally {
        engine.dispose();
      }
    }
    assert.equal(snapshots[0], snapshots[1], `${ruleSet} rules must replay identically`);
  }
});

function runSteps({ ruleSet, options: overrides = {}, viewport = [1440, 900], hz = 60, chapter = 1, stage = 5, seed = 99, steps = 1800 }) {
  let pendingDraft = null;
  let executed = 0;
  let captured = null;
  const engine = new GameEngine(createHeadlessCanvas(viewport[0], viewport[1]), meta(), { ...options(), screenShake: true, ...overrides }, {
    onSnapshot() {},
    onDraft(draft) { pendingDraft = draft; },
    onRoundClear() {},
    onGameOver() {},
  });
  const directions = ['d', 's', 'a', 'w'];
  const update = engine.update.bind(engine);
  engine.update = (dt) => {
    engine.keys.clear();
    engine.keys.add(directions[Math.floor(executed / 180) % directions.length]);
    update(dt);
    executed += 1;
    if (executed === steps) captured = JSON.stringify({ player: engine.player, enemies: engine.enemies.map((enemy) => [enemy.tier, enemy.x, enemy.y, enemy.hp]), kills: engine.stageKills });
  };
  try {
    engine.setRuleSet(ruleSet);
    engine.startRun(chapter, stage, seed);
    for (let frame = 0; frame < steps * 4 && !captured && !engine.stageFinished; frame += 1) {
      if (pendingDraft) {
        const draft = pendingDraft;
        pendingDraft = null;
        engine.completeDraft(draft.cards[0], draft.id);
      }
      engine.advanceFrame(1 / hz, true);
    }
    return captured ?? `ended:${executed}:${JSON.stringify(engine.player)}`;
  } finally {
    engine.dispose();
  }
}

test('G14/BUG-08: cosmetic options and frame rate never change a seeded run under remaster rules', () => {
  const reference = runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400 });
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, options: { damageNumbers: false } }), reference, 'damage numbers');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, options: { effects: 0.3 } }), reference, 'effects density');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, options: { screenShake: false, reducedFlash: true } }), reference, 'shake and reduced motion');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, hz: 30 }), reference, '30 Hz frames');
});

test('BUG-08: the gameplay id stream ignores damage numbers and effect density (classic rules still leak)', () => {
  const idsAfter = (ruleSet, overrides) => {
    const engine = new GameEngine(createHeadlessCanvas(1440, 900), meta(), { ...options(), ...overrides }, {
      onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
    });
    try {
      engine.setRuleSet(ruleSet);
      engine.startRun(2, 4, 31337);
      engine.cheatGodMode = true;
      for (let frame = 0; frame < 900; frame += 1) {
        if (engine.activeDraftId !== null) engine.completeDraft({ kind: 'bonus', bonus: 'heal', rarity: 'common', title: '', body: '', levelLine: '' }, engine.activeDraftId);
        engine.advanceFrame(1 / 60, false);
      }
      return engine.idSeed;
    } finally {
      engine.dispose();
    }
  };
  const remaster = idsAfter('remaster', { damageNumbers: true, effects: 1 });
  assert.equal(idsAfter('remaster', { damageNumbers: false, effects: 1 }), remaster);
  assert.equal(idsAfter('remaster', { damageNumbers: true, effects: 0.25 }), remaster);
  assert.notEqual(idsAfter('classic', { damageNumbers: false, effects: 1 }), idsAfter('classic', { damageNumbers: true, effects: 1 }), 'classic rules keep the 0.1.0 coupling for A/B runs');
});

test('BUG-10: the Ink Butcher winds up in place behind a lane telegraph, then dashes exactly along it', () => {
  const engine = createEngine();
  try {
    engine.startRun(1, 5, 505);
    engine.obstacles = [];
    engine.hazards = [];
    const boss = engine.enemies.find((enemy) => enemy.isBoss);
    engine.enemies = [boss];
    engine.cheatGodMode = true;
    boss.x = engine.player.x - 500;
    boss.y = engine.player.y;
    boss.patternTimer = 0;
    boss.patternPhase = 'idle';
    engine.updateEnemies(1 / 60);
    assert.equal(boss.patternPhase, 'warn');
    assert.equal(engine.laneTelegraphs.length, 1, 'the windup shows a lane');
    const lane = engine.laneTelegraphs[0];
    assert.ok(Math.abs(lane.life - 0.62) < 1e-9, 'the lane lasts the whole windup');
    const start = { x: boss.x, y: boss.y };

    engine.player.y += 300;
    let drift = 0;
    for (let step = 0; step < 45 && boss.patternPhase === 'warn'; step += 1) {
      engine.updateEnemies(1 / 60);
      if (boss.patternPhase === 'warn') drift = Math.max(drift, Math.hypot(boss.x - start.x, boss.y - start.y));
    }
    assert.ok(drift < 1e-6, `the boss holds still while winding up (drifted ${drift})`);
    assert.equal(boss.patternPhase, 'dash');
    while (boss.patternPhase === 'dash') engine.updateEnemies(1 / 60);
    const along = Math.hypot(boss.x - lane.x1, boss.y - lane.y1);
    const sideways = Math.abs((lane.y2 - lane.y1) * (boss.x - lane.x1) - (lane.x2 - lane.x1) * (boss.y - lane.y1)) / Math.hypot(lane.x2 - lane.x1, lane.y2 - lane.y1);
    assert.ok(sideways < 2, `the dash stays on the telegraphed line even though the player moved (off by ${sideways})`);
    assert.ok(Math.abs(along - Math.hypot(lane.x2 - lane.x1, lane.y2 - lane.y1)) < boss.radius, 'the dash ends where the lane ends');
  } finally {
    engine.dispose();
  }
});

test('BUG-11: the eclipse wall enters from the view edge, reaches the player anywhere, and leaves one lane open', () => {
  const engine = createEngine();
  try {
    engine.startRun(5, 5, 707);
    const boss = engine.enemies.find((enemy) => enemy.isBoss);
    assert.equal(boss.boss.pattern, 'eclipse');
    engine.enemies = [boss];
    for (const [px, py] of [[3600, 1500], [2100, 2600], [600, 400]]) {
      engine.player.x = px;
      engine.player.y = py;
      engine.bossProjectiles = [];
      engine.pendingHostileShots = [];
      engine.laneTelegraphs = [];
      boss.x = px - 200;
      boss.y = py;
      boss.patternTimer = 0;
      boss.bossPhaseFlash = 0;
      engine.updateBossPattern(boss, 1 / 60);
      assert.equal(engine.pendingHostileShots.length, 6, 'seven lanes minus one safe lane');
      assert.equal(engine.laneTelegraphs.length, 6, 'each lane is telegraphed before the shots fly');
      assert.equal(engine.bossProjectiles.length, 0, 'no shot flies during the 0.6 s lead');
      engine.elapsed += 0.61;
      engine.updateBossProjectiles(0);
      const shots = engine.bossProjectiles.filter((shot) => shot.kind === 'eclipse');
      assert.equal(shots.length, 6);
      for (const shot of shots) {
        const vertical = shot.vx === 0;
        const toPlayer = vertical ? (py - shot.y) / shot.vy : (px - shot.x) / shot.vx;
        assert.ok(toPlayer > 0 && toPlayer < shot.life, `shot from ${shot.x},${shot.y} reaches the player's line within its life at ${px},${py}`);
      }
    }
  } finally {
    engine.dispose();
  }
});

test('BUG-13: a root zone binds once and then lets the player walk out; hazards spawn clear of the start', () => {
  const engine = createEngine();
  try {
    engine.startRun(3, 10, 808);
    engine.enemies = [];
    engine.obstacles = [];
    engine.hazards = [{ id: 1, kind: 'root', x: engine.player.x, y: engine.player.y, radius: 52, life: 7, maxLife: 7, damage: 0, slow: 1, triggered: false }];
    const startX = engine.player.x;
    engine.keys.add('d');
    let rootedSteps = 0;
    for (let step = 0; step < 7 * 60 && engine.player.x - startX < 60; step += 1) {
      engine.updatePlayer(1 / 60);
      if (engine.player.root > 0) rootedSteps += 1;
    }
    assert.ok(engine.player.x - startX >= 60, 'the player leaves the zone before it expires');
    assert.ok(rootedSteps <= Math.ceil(0.65 * 60) + 1, `bound for one short window only (${rootedSteps} steps)`);

    for (let seed = 1; seed <= 25; seed += 1) {
      for (const chapter of [1, 3, 5]) {
        engine.startRun(chapter, 2, seed * 17 + chapter);
        for (const hazard of engine.hazards) {
          if (!Number.isFinite(hazard.life)) {
            const gap = Math.hypot(hazard.x - 2100, hazard.y - 1500) - hazard.radius;
            assert.ok(gap >= 420 - 1e-6, `static ${hazard.kind} hazard reaches ${gap.toFixed(0)} px from the start (Ch${chapter} seed ${seed})`);
          }
        }
      }
    }
  } finally {
    engine.dispose();
  }
});

test('BUG-16: skills do what their cards say, and the mirror clone awakening adds aimed shots and pierce', () => {
  const engine = createEngine();
  try {
    const volley = (rules, awakened) => {
      engine.setRuleSet(rules);
      engine.startRun(3, 2, 909);
      engine.obstacles = [];
      engine.hazards = [];
      engine.enemies = [];
      engine.spawnEnemy(1, 'small');
      const target = engine.enemies[0];
      target.x = engine.player.x + 320;
      target.y = engine.player.y + 40;
      target.hp = target.maxHp = 1e9;
      engine.rebuildEnemyIndex();
      engine.skills = { mirrorClone: { level: 5, awakened } };
      engine.skillCooldowns = {};
      engine.projectiles.length = 0;
      engine.updateMirrorClone(engine.skills.mirrorClone);
      return { shots: engine.projectiles.filter((shot) => shot.skillId === 'mirrorClone'), target, card: engine.makeOffer('mirrorClone', 'awakening').body };
    };

    const plain = volley('remaster', false);
    assert.equal(plain.shots.length, 2, 'two clones, two shots');
    assert.ok(plain.shots.every((shot) => shot.pierce === 3), 'Lv5 pierce is 1 + floor(5 / 2)');
    const reworked = volley('remaster', true);
    assert.equal(reworked.shots.length, 4, 'awakening adds two shots');
    assert.ok(reworked.shots.every((shot) => shot.pierce === 4), 'awakening adds one pierce');
    for (const shot of reworked.shots.slice(2)) {
      const toTarget = Math.atan2(reworked.target.y - shot.y, reworked.target.x - shot.x);
      assert.ok(Math.abs(Math.atan2(shot.vy, shot.vx) - toTarget) < 1e-9, 'the added shots aim at the target');
    }
    assert.match(reworked.card, /사격 \+2발, 관통 \+1/);
    const classic = volley('classic', true);
    assert.equal(classic.shots.length, 2, 'classic rules keep the 0.1.0 awakening');
    assert.match(classic.card, /레일이 없으면 효과가 없습니다/);

    engine.setRuleSet('remaster');
    engine.startRun(3, 2, 910);
    engine.enemies = [];
    engine.spawnEnemy(1, 'small');
    const target = engine.enemies[0];
    engine.obstacles = [];
    target.x = engine.player.x + 300;
    target.y = engine.player.y;
    target.hp = target.maxHp = 1e9;
    engine.rebuildEnemyIndex();
    engine.skills = { railSpear: { level: 3, awakened: false }, voidMine: { level: 3, awakened: false } };
    const railCard = engine.makeOffer('railSpear', 'skill');
    assert.equal(railCard.body, '폭 +12, 피해 +128%');
    engine.skills.railSpear.level = 4;
    engine.skillCooldowns = {};
    engine.beams.length = 0;
    engine.updateRailSpear(engine.skills.railSpear);
    assert.equal(engine.beams.at(-1).width, 18 + 12, 'the Lv4 rail is as wide as its card says');
    assert.equal(engine.makeOffer('railSpear', 'skill').title, '흑선 레일 Lv.5');
    assert.doesNotMatch(engine.makeOffer('railSpear', 'skill').body, /충전/);

    engine.hazards = [];
    engine.updateVoidMine(engine.skills.voidMine);
    assert.equal(engine.hazards.at(-1).pull, 74 + 3 * 14, 'void mine pull matches the +19% per level on its card');

    const overdrive = engine.makeBonusOffers('level').find((offer) => offer.bonus === 'overdrive');
    assert.equal(overdrive.title, '과부하');
    assert.match(overdrive.body, /이번 런이 끝날 때까지/);
  } finally {
    engine.dispose();
  }
});
