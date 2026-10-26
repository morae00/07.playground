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

test('a boss warning passes the pattern spacing another boss set, but not its own', () => {
  const ledger = new VoiceLedger();
  assert.ok(ledger.request('boss.rings', 0, 0.5));
  assert.ok(ledger.request('boss.shock', 0.05, 0.3), 'the shock sounds over the other boss\'s rings');
  assert.equal(ledger.request('boss.flame', 0.1, 0.5), null, 'an ordinary pattern still waits');
  assert.equal(ledger.request('boss.eclipse', 0.1, 0.5), null, 'two warnings keep the spacing between them');
  assert.ok(ledger.request('boss.eclipse', 0.26, 0.5));
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

test('a voice stopped early frees its slot (S4)', () => {
  const ledger = new VoiceLedger();
  const fuse = ledger.request('bomber.fuse', 0, 1.15);
  assert.ok(fuse);
  assert.equal(ledger.release(fuse.voice.id)?.id, fuse.voice.id);
  assert.equal(ledger.voices.length, 0);
  assert.equal(ledger.release(fuse.voice.id), null, 'a voice is released once');
});

test('AUD-02: a cue that keeps its oldest voices refuses a new one at its limit instead of cutting the first', () => {
  const ledger = new VoiceLedger();
  assert.equal(CUES['bomber.fuse'].keep, 'oldest');
  const fuses = [0, 0.1, 0.2].map((now) => ledger.request('bomber.fuse', now, 1.15));
  assert.ok(fuses.every(Boolean));
  assert.equal(ledger.request('bomber.fuse', 0.3, 1.15), null, 'the fourth fuse stays silent');
  assert.deepEqual(ledger.voices.map((voice) => voice.id), fuses.map((fuse) => fuse!.voice.id), 'the first fuse, due first, keeps sounding');
  assert.deepEqual([ledger.counts.dropped, ledger.counts.stolen], [1, 0]);
  assert.ok(ledger.request('bomber.fuse', 1.16, 1.15), 'once the first has ended a new one sounds');
  // A refused request sets no spacing: the next one waits only for a free voice.
  const ticks = new VoiceLedger();
  for (const now of [0, 0.04, 0.08, 0.12]) assert.ok(ticks.request('bomber.tick', now, 0.5), `tick at ${now}`);
  assert.equal(ticks.request('bomber.tick', 0.16, 0.5), null);
  assert.equal(ticks.counts.spaced, 0);
});

test('AUD-02: a higher-priority cue passes a group spacing a lower one set; equal or lower ones wait (P1-5)', () => {
  assert.ok(CUES['hit.light'].priority < CUES['hit.heavy'].priority);
  assert.equal(CUES['hit.heavy'].priority, CUES['hit.critical'].priority);
  const ledger = new VoiceLedger();
  assert.ok(ledger.request('hit.light', 0, 0.03));
  assert.ok(ledger.request('hit.heavy', 0.01, 0.05), 'a heavy hit is not held back by a light one');
  assert.equal(ledger.request('hit.light', 0.03, 0.03), null, 'a light hit waits out the heavy hit\'s spacing');
  assert.equal(ledger.request('hit.critical', 0.03, 0.06), null, 'and so does a critical one, at the same priority');
  assert.ok(ledger.request('hit.critical', 0.055, 0.06), 'until it is over');
  assert.equal(ledger.request('shield.block', 0.06, 0.03), null);
  assert.equal(ledger.counts.spaced, 3);
  // In a crowd: a light hit every 1/28 s never blocks the criticals between them.
  const crowd = new VoiceLedger();
  let criticals = 0;
  for (let index = 0; index < 56; index += 1) {
    crowd.request('hit.light', index / 28, 0.03);
    if (index % 7 === 3 && crowd.request('hit.critical', index / 28 + 0.001, 0.06)) criticals += 1;
  }
  assert.equal(criticals, 8);
});
