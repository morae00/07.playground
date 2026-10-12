// Test bundle entry (TEC-07): the engine plus test-only probe, replay harness, and input adapter.
// The app entry never imports this file, so production bundles do not ship the probe.
export { GameEngine, SKILLS, SKILL_IDS, suspendedRunReward } from '../game/GameEngine';
export { default as BUILD_DEPTH } from '../content/data/buildDepth';
export { default as BOSS_TOUGHNESS } from '../content/data/bossToughness';
export { default as HORDE } from '../content/data/horde';
export { default as BOMBERS } from '../content/data/bombers';
export { ProbedGameEngine } from '../game/engine/probe';
export { createEngineHarness, replaySnapshot } from '../game/engine/harness';
export * from '../game/engine/replay';
export { ENGINE_ACTIONS, ENGINE_CONTRACT_VERSION } from '../game/engine/contracts';
export { InputAdapter, KEYBOARD_ACTIONS } from '../ui/inputAdapter';
export { SpriteAtlas } from '../game/render/assets/spriteAtlas';
export { ATLAS_MANIFEST } from '../game/render/assets/atlasManifest.generated';
export { DISABLED_SLOTS } from '../game/render/assets/slots';
export { OBSTACLE_CATALOGUE } from '../game/obstacleCatalogue';
export { INFINITE_ROTATION, byMinute, dailySeed, infiniteDifficultyAt, infiniteKillScore, weeklySeed } from '../game/infiniteMode';
export { settlementNotes } from '../ui/settlementNotes';
export { installStrings, t, tp, tx } from '../i18n/strings';
export { STAGE_PATH, chapterCleared, passiveEffect, smoothPath, stageBoss, stageRewardFloor, stageStatus, upgradeEffect } from '../ui/menuStage';
export { WORLD_LAYERS, XRAY_COVERAGE } from '../game/render/worldRenderer';
