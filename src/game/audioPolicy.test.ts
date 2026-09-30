import assert from 'node:assert/strict';
import test from 'node:test';
import { CUES, HIT_CUES, LIMITER, LIMITER_MAKEUP, MAX_VOICES, VoiceLedger, mixLevels, type CueId } from './audioPolicy.ts';

test('impact audio separates light, heavy, and critical cues', () => {
  const [light, heavy, critical] = (['light', 'heavy', 'critical'] as const).map((tier) => CUES[HIT_CUES[tier]].synth);
  assert.ok(light.frequency > heavy.frequency);
  assert.ok(heavy.frequency > critical.frequency);
  assert.ok(light.duration < heavy.duration);
  assert.ok(heavy.duration < critical.duration);
  assert.ok(light.gain < heavy.gain);
  assert.ok(heavy.gain < critical.gain);
});

test('every cue has a bus, a voice limit, a spacing, and a synth fallback; ambience beds loop samples only', () => {
  for (const [id, spec] of Object.entries(CUES)) {
    assert.ok(['music', 'sfx', 'ui', 'ambience'].includes(spec.bus), id);
    assert.ok(spec.maxVoices >= 1 && spec.maxVoices <= MAX_VOICES, id);
    assert.ok(spec.spacing >= 0 && spec.priority >= 1, id);
    // AUD-04: a bed plays only as a loop through AudioMixer.ambience, so a synth blip would never stand in for it.
    if (spec.bus === 'ambience') assert.equal(spec.synth.gain, 0, id);
    else assert.ok(spec.synth.frequency > 0 && spec.synth.duration > 0 && spec.synth.gain > 0, id);
  }
});

test('mix levels contain invalid or excessive volume inputs, and ui and ambience follow effects and music', () => {
  assert.deepEqual(mixLevels({ volume: -1, musicVolume: Number.NaN, sfxVolume: 2 }), { master: 0, music: 0, sfx: 1, ui: 1, ambience: 0 });
  assert.deepEqual(mixLevels({ volume: 0.32, musicVolume: 0.8, sfxVolume: 0.5 }), { master: 0.32, music: 0.8, sfx: 0.5, ui: 0.5, ambience: 0.8 });
});

test('the master gain takes the limiter makeup gain back out', () => {
  // curve(0 dBFS) = threshold + (0 - threshold) / ratio; makeup = (1 / curve)^0.6.
  const curve = 10 ** ((LIMITER.threshold + -LIMITER.threshold / LIMITER.ratio) / 20);
  assert.ok(Math.abs(LIMITER_MAKEUP - (1 / curve) ** 0.6) < 1e-12);
  assert.ok(LIMITER_MAKEUP > 1 && LIMITER_MAKEUP < 1.3);
});

test('a cue waits out its group spacing: hits share one', () => {
  const ledger = new VoiceLedger();
  assert.ok(ledger.request('hit.critical', 0, 0.065));
  assert.equal(ledger.request('hit.light', 0.03, 0.028), null, 'a light hit 30 ms after a critical one waits');
  assert.ok(ledger.request('hit.light', 0.056, 0.028), 'and plays once the 55 ms critical spacing is over');
  assert.ok(ledger.request('enemy.kill', 0.056, 0.045), 'other cues are not held back');
  assert.equal(ledger.counts.spaced, 1);
});

test('thirty kills in one frame start one kill voice', () => {
  const ledger = new VoiceLedger();
  const admitted = Array.from({ length: 30 }, () => ledger.request('enemy.kill', 1, 0.045)).filter(Boolean);
  assert.equal(admitted.length, 1);
  assert.equal(ledger.counts.spaced, 29);
});

test('a cue at its voice limit replaces its oldest voice', () => {
  const ledger = new VoiceLedger();
  const first = ledger.request('boss.enraged', 0, 5);
  const second = ledger.request('boss.enraged', 1, 5);
  assert.equal(second?.cut?.id, first?.voice.id);
  assert.equal(ledger.voices.length, 1);
  assert.equal(ledger.counts.stolen, 1);
});

test('when every voice is busy a cue takes the oldest lowest-priority voice, or stays silent', () => {
  const ledger = new VoiceLedger(3);
  const cast = ledger.request('cast.fanKnives', 0, 5);
  ledger.request('cast.chainSpark', 0, 5);
  ledger.request('player.hurt', 0, 5);
  const stinger = ledger.request('boss.kill', 0.1, 5);
  assert.equal(stinger?.cut?.id, cast?.voice.id, 'the oldest priority-1 cast gives way');
  const full = new VoiceLedger(2);
  full.request('boss.kill', 0, 5);
  full.request('boss.enraged', 0, 5);
  assert.equal(full.request('cast.fanKnives', 0.1, 5), null, 'a cast never cuts a boss stinger');
  assert.equal(full.counts.dropped, 1);
});

test('finished voices free their slots on the audio clock', () => {
  const ledger = new VoiceLedger(2);
  ledger.request('cast.fanKnives', 0, 0.035);
  ledger.request('cast.chainSpark', 0, 0.035);
  ledger.expire(0.035);
  assert.equal(ledger.voices.length, 0);
  const cues: CueId[] = ['enemy.kill', 'player.hurt'];
  for (const cue of cues) assert.ok(ledger.request(cue, 0.04, 0.05));
  assert.equal(ledger.counts.peak, 2);
});
