import assert from 'node:assert/strict';
import test from 'node:test';
import { SHARED_ENGINE_BUNDLE, resolveEngineBundle } from '../scripts/lib/engine-bundle.mjs';
import { cappedMeta } from '../scripts/lib/headless-engine.mjs';
import CATALOG from '../src/content/data/catalog.ts';
import {
  ARSENAL_PRIORITY, BALANCE_PERSONAS, DEFAULT_FULL_SEEDS, EXTRA_PERSONAS, createFullBalanceReport, parseCharacter, parsePrefer, personasById, preferring, selectBalanceOffer,
} from '../scripts/lib/full-balance-runner.mjs';

test('release balance matrix owns ten unique deterministic seeds', () => {
  assert.equal(DEFAULT_FULL_SEEDS.length, 10);
  assert.equal(new Set(DEFAULT_FULL_SEEDS).size, 10);
});

test('opt-in personas stay out of the default matrix and are picked by id', () => {
  assert.deepEqual(BALANCE_PERSONAS.map((persona) => persona.id), ['striker', 'survivor', 'collector', 'fresh']);
  const novice = EXTRA_PERSONAS.find((persona) => persona.id === 'novice');
  assert.ok(novice && novice.freshMeta && novice.evasive, 'the novice is a new player who steers away from threats');
  assert.deepEqual(personasById(['novice', 'fresh']).map((persona) => persona.id), ['novice', 'fresh']);
  assert.throws(() => personasById(['expert']), /Unknown balance persona/);
});

test('balance personas secure three active skills before specialization', () => {
  const survivor = BALANCE_PERSONAS.find((persona) => persona.id === 'survivor');
  const cards = [
    { kind: 'skill', skillId: 'ironFrame' },
    { kind: 'skill', skillId: 'chainSpark' },
  ];
  assert.equal(selectBalanceOffer(cards, survivor, { skills: { needleStorm: { level: 1 }, frostLine: { level: 1 } } }).skillId, 'chainSpark');
  assert.equal(selectBalanceOffer(cards, survivor, { skills: { needleStorm: { level: 1 }, frostLine: { level: 1 }, orbitScythes: { level: 1 } } }).skillId, 'ironFrame');
});

test('full balance shards merge into canonical stage, persona, and seed order', () => {
  const personas = [{ id: 'first' }, { id: 'second' }];
  const stages = [{ chapter: 1, stage: 1 }];
  const seeds = [17, 1337];
  const scenario = (persona, baseSeed) => ({
    chapter: 1,
    stage: 1,
    persona,
    baseSeed,
    seed: baseSeed,
    kind: 'normal',
    outcome: 'clear',
    elapsed: 10,
    kills: 1,
    coins: 1,
    skillCount: 2,
  });
  const report = createFullBalanceReport({
    scenarios: [scenario('second', 1337), scenario('first', 1337), scenario('second', 17), scenario('first', 17)],
    seeds,
    stages,
    personas,
    maxFrames: 100,
  });

  assert.deepEqual(report.scenarios.map(({ persona, baseSeed }) => [persona, baseSeed]), [
    ['first', 17], ['first', 1337], ['second', 17], ['second', 1337],
  ]);
  assert.deepEqual(report.gates, {
    completeMatrix: true,
    noInvalidOutcomes: true,
    noTimeouts: true,
    buildGrowthObserved: true,
    personaClearsObserved: true,
    stageKindClearsObserved: true,
  });
  assert.equal(report.outliers.length, 4);
  assert.equal(report.outliers[0].elapsed, 10);
});

test('balance tools take either bundle variable and warn before running the shared bundle', () => {
  const warnings = [];
  const warn = (message) => warnings.push(message);
  assert.equal(resolveEngineBundle({ BLACKLINE_TEST_BUNDLE: '/a/testing.mjs' }, warn), '/a/testing.mjs');
  assert.equal(resolveEngineBundle({ BLACKLINE_ENGINE_BUNDLE: '/b/testing.mjs' }, warn), '/b/testing.mjs');
  assert.equal(resolveEngineBundle({ BLACKLINE_TEST_BUNDLE: '/a/testing.mjs', BLACKLINE_ENGINE_BUNDLE: '/a/testing.mjs' }, warn), '/a/testing.mjs');
  assert.equal(warnings.length, 0);
  assert.throws(() => resolveEngineBundle({ BLACKLINE_TEST_BUNDLE: '/a/testing.mjs', BLACKLINE_ENGINE_BUNDLE: '/b/testing.mjs' }, warn), /different bundles/);
  assert.equal(resolveEngineBundle({}, warn), SHARED_ENGINE_BUNDLE);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /WARNING.*SHARED bundle/s);
});

test('the capped account holds every permanent upgrade and every passive point (the maxed persona, infinite max)', () => {
  const meta = cappedMeta();
  assert.deepEqual(meta.upgrades, Object.fromEntries(Object.entries(CATALOG.metaUpgrades).map(([id, { max }]) => [id, max])));
  assert.deepEqual(meta.passives, Object.fromEntries(Object.entries(CATALOG.metaPassives).map(([id, { max }]) => [id, max])));
});

test('balance runs start as a character only when one is named (CON-10)', () => {
  assert.equal(parseCharacter(undefined), null);
  assert.equal(parseCharacter(''), null);
  assert.deepEqual(parseCharacter('gyeol'), { id: 'gyeol', level: 0 });
  assert.deepEqual(parseCharacter('dok:3'), { id: 'dok', level: 3 });
  assert.throws(() => parseCharacter('dok:x'), /Invalid character/);
  const report = (character) => createFullBalanceReport({ scenarios: [], seeds: [17], stages: [], personas: [], maxFrames: 1, character });
  assert.equal('character' in report(null).summary, false, 'a run without a character keeps the summary, and so its fingerprint');
  assert.deepEqual(report({ id: 'gyeol', level: 0 }).summary.character, { id: 'gyeol', level: 0 });
});

test('the armory persona and BALANCE_FULL_PREFER put arsenal weapons into balance runs (SYS-15)', () => {
  assert.equal(ARSENAL_PRIORITY.length, 44);
  assert.deepEqual(ARSENAL_PRIORITY.slice(0, 3), ['sunNeedles', 'seventhSeal', 'judgmentLine'], 'mythic weapons first');
  const [armory] = personasById(['armory']);
  assert.ok(!BALANCE_PERSONAS.includes(armory), 'opt-in only');
  const cards = [{ kind: 'skill', skillId: 'needleStorm' }, { kind: 'skill', skillId: 'inkPots' }, { kind: 'skill', skillId: 'tarJar' }];
  const owned = { skills: { a: {}, b: {}, c: {} } };
  assert.equal(selectBalanceOffer(cards, armory, owned).skillId, 'tarJar', 'the rarer weapon over the common one and the core skill');
  const [striker] = BALANCE_PERSONAS;
  assert.equal(selectBalanceOffer(cards, striker, owned).skillId, 'needleStorm');
  assert.deepEqual(parsePrefer(' inkPots, bossbane ,'), ['inkPots', 'bossbane']);
  assert.equal(parsePrefer(''), null);
  const preferred = preferring(striker, ['inkPots', 'needleStorm']);
  assert.equal(preferred.id, 'striker');
  assert.deepEqual(preferred.skillPriority.slice(0, 3), ['inkPots', 'needleStorm', 'blackSun']);
  assert.equal(preferred.skillPriority.filter((id) => id === 'needleStorm').length, 1);
  assert.equal(selectBalanceOffer(cards, preferred, owned).skillId, 'inkPots');
  assert.equal(preferring(striker, null), striker);
  const summary = (prefer) => createFullBalanceReport({ scenarios: [], seeds: [17], stages: [], personas: [], maxFrames: 1, prefer }).summary;
  assert.equal('prefer' in summary(null), false);
  assert.deepEqual(summary(['inkPots']).prefer, ['inkPots']);
});
