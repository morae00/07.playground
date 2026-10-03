// SFX spec (AUD-02 v0): every cue in src/game/audioPolicy.ts as a small synthesis recipe. scripts/build-sfx.mjs
// renders the recipes offline in Chromium (OfflineAudioContext) into WAV variants of one sound pack. This is
// placeholder sound design in the paper-and-ink tone of the style bible until the SFX library order arrives:
// recorded files replace these by name, with no code change. Each variant nudges pitch and length a little, so
// the mixer's random variant pick keeps repeats from sounding mechanical.
//
// A layer is noise or a tone:
//   { noise: 'white' | 'crackle', filter: 'lowpass' | 'bandpass' | 'highpass', hz, to?, q?, attack, decay, gain, at? }
//   { tone: 'sine' | 'triangle' | 'square' | 'sawtooth', hz, to?, attack, decay, gain, at? }
// `to` sweeps the frequency exponentially over the decay; `at` delays the layer (seconds). Crackle is noise gated
// by short random pulses: the tear of paper. `hold` keeps a layer at full level for that long before its decay,
// and `lfo: { hz, depth }` swells its level. A recipe with `loop` (seconds) is an ambience bed: it renders a
// second longer and folds that tail over its head, so the file loops without a seam (AUD-04).

export const SFX_RATE = 22050;
/** Every file is normalized to this peak; the mixer brings it back to the synth level (audioPolicy SAMPLE_PEAK). */
export const SFX_PEAK = 0.9;
export const SFX_PACK = Object.freeze({ id: 'sfx-common', dir: 'assets/packs/sfx-common' });

const tap = (hz, decay, gain = 1) => ({ noise: 'white', filter: 'bandpass', hz, q: 1.4, attack: 0.001, decay, gain });
const thud = (hz, to, decay, gain = 1, at = 0) => ({ tone: 'sine', hz, to, attack: 0.002, decay, gain, at });
// The amber family (V3): a dry wooden clapper (딱따기) in the 2.4-3.6 kHz warning lane, which the most frequent sounds
// (light hits, the ch1 kill, pickups) keep clear. Spread it into a recipe's layers: ...clack(at, hz, gain).
const clack = (at = 0, hz = 3000, gain = 1) => [
  { tone: 'triangle', hz, to: hz * 0.94, attack: 0.001, decay: 0.03, gain: 0.6 * gain, at },
  { noise: 'white', filter: 'bandpass', hz: hz * 1.07, q: 4, attack: 0.001, decay: 0.018, gain: 0.8 * gain, at },
  { tone: 'sine', hz: hz * 1.47, attack: 0.001, decay: 0.015, gain: 0.25 * gain, at },
];

export const RECIPES = Object.freeze({
  // Hits: a paper tap that gets lower, longer, and wetter with the tier (G13). The light one, the most frequent sound
  // in a crowd, is a brush flicking the paper's edge above the warning lane (4.6 kHz): the highest and shortest tier.
  'hit.light': { variants: 4, layers: [{ noise: 'white', filter: 'bandpass', hz: 4600, q: 2.2, attack: 0.001, decay: 0.022, gain: 1 }, { tone: 'triangle', hz: 1100, to: 600, attack: 0.001, decay: 0.014, gain: 0.35 }] },
  'hit.heavy': { variants: 4, layers: [tap(1500, 0.05), thud(170, 90, 0.07, 0.8), { noise: 'crackle', filter: 'highpass', hz: 3000, attack: 0.001, decay: 0.04, gain: 0.3 }] },
  'hit.critical': { variants: 4, layers: [tap(1100, 0.08, 1.1), thud(120, 55, 0.12, 1), { noise: 'white', filter: 'lowpass', hz: 5200, to: 900, attack: 0.002, decay: 0.16, gain: 0.5, at: 0.01 }] },
  'shield.block': { variants: 3, layers: [{ tone: 'triangle', hz: 1480, to: 1320, attack: 0.001, decay: 0.09, gain: 0.7 }, { tone: 'sine', hz: 2210, attack: 0.001, decay: 0.07, gain: 0.35 }, tap(3200, 0.02, 0.5)] },
  // Kills: a torn scrap of paper, bright and dry (body 1.3 kHz, torn fibres above 5.2 kHz, the warning lane left
  // clear, 0.11 s so the 3-voice cap cuts less tail); bosses burst like a thrown ink pot.
  'enemy.kill': { variants: 4, layers: [{ noise: 'crackle', filter: 'bandpass', hz: 1300, q: 1.1, attack: 0.002, decay: 0.09, gain: 1 }, { noise: 'crackle', filter: 'highpass', hz: 5200, attack: 0.001, decay: 0.05, gain: 0.35 }, thud(210, 120, 0.05, 0.4)] },
  'enemy.stunned': { variants: 3, layers: [{ tone: 'triangle', hz: 620, to: 880, attack: 0.002, decay: 0.08, gain: 0.5 }, { tone: 'triangle', hz: 930, to: 1320, attack: 0.002, decay: 0.08, gain: 0.35, at: 0.05 }] },
  'boss.kill': { variants: 2, layers: [thud(90, 32, 0.7, 1), { noise: 'white', filter: 'lowpass', hz: 3400, to: 260, attack: 0.004, decay: 0.8, gain: 0.8 }, { noise: 'crackle', filter: 'highpass', hz: 2200, attack: 0.01, decay: 0.5, gain: 0.4, at: 0.05 }] },
  'boss.enraged': { variants: 2, layers: [{ tone: 'sawtooth', hz: 62, to: 88, attack: 0.08, decay: 0.7, gain: 0.8 }, { noise: 'white', filter: 'bandpass', hz: 420, q: 2, attack: 0.1, decay: 0.6, gain: 0.5 }] },
  // A boss arrival is a warning too (FX-05): two clacks, then the low swell, with a 220 Hz layer over the ch5 drone.
  'boss.intro': { variants: 1, layers: [...clack(0, 2800), ...clack(0.09, 3100), { tone: 'sawtooth', hz: 55, to: 49, attack: 0.12, decay: 0.9, gain: 0.8, at: 0.1 }, { tone: 'sine', hz: 110, attack: 0.05, decay: 0.8, gain: 0.5, at: 0.1 }, { tone: 'triangle', hz: 220, to: 196, attack: 0.08, decay: 0.7, gain: 0.3, at: 0.1 }, { noise: 'white', filter: 'lowpass', hz: 700, attack: 0.2, decay: 0.7, gain: 0.35, at: 0.1 }] },
  // The player: 結's paper body crumples and ink spatters, low, dull, and wet, unlike the bright dry kill tear. The
  // heartbeat is a double low beat with a drum-skin overtone (~120 Hz) and a short slap (~500 Hz) for laptop speakers.
  'player.hurt': { variants: 3, layers: [thud(150, 70, 0.1, 1), { tone: 'triangle', hz: 420, to: 190, attack: 0.002, decay: 0.07, gain: 0.4 }, { noise: 'white', filter: 'lowpass', hz: 1400, to: 300, attack: 0.002, decay: 0.08, gain: 0.5 }, { noise: 'crackle', filter: 'bandpass', hz: 700, q: 1, attack: 0.002, decay: 0.07, gain: 0.45 }] },
  'player.heartbeat': { variants: 1, layers: [thud(62, 44, 0.09, 1), { tone: 'triangle', hz: 124, to: 88, attack: 0.002, decay: 0.07, gain: 0.45 }, { noise: 'white', filter: 'bandpass', hz: 520, q: 1.2, attack: 0.001, decay: 0.025, gain: 0.3 }, thud(58, 42, 0.1, 0.8, 0.16), { tone: 'triangle', hz: 116, to: 84, attack: 0.002, decay: 0.08, gain: 0.35, at: 0.16 }, { noise: 'white', filter: 'bandpass', hz: 480, q: 1.2, attack: 0.001, decay: 0.025, gain: 0.22, at: 0.16 }] },
  'player.down': { variants: 1, layers: [{ tone: 'sawtooth', hz: 180, to: 45, attack: 0.01, decay: 0.6, gain: 0.7 }, { noise: 'white', filter: 'lowpass', hz: 1800, to: 200, attack: 0.01, decay: 0.7, gain: 0.5 }] },
  // Casts: each skill's own gesture.
  'cast.fanKnives': { variants: 3, layers: [{ noise: 'white', filter: 'highpass', hz: 4200, to: 2400, attack: 0.004, decay: 0.07, gain: 0.8 }, { tone: 'triangle', hz: 1300, to: 1700, attack: 0.001, decay: 0.03, gain: 0.25 }] },
  'cast.chainSpark': { variants: 3, layers: [{ noise: 'crackle', filter: 'highpass', hz: 2600, attack: 0.001, decay: 0.12, gain: 0.9 }, { tone: 'square', hz: 1760, to: 880, attack: 0.001, decay: 0.05, gain: 0.25 }] },
  'cast.frostLine': { variants: 3, layers: [{ noise: 'white', filter: 'bandpass', hz: 5200, to: 2600, q: 3, attack: 0.002, decay: 0.12, gain: 0.8 }, { tone: 'sine', hz: 2400, to: 1800, attack: 0.002, decay: 0.09, gain: 0.3 }] },
  'cast.railSpear': { variants: 2, layers: [{ tone: 'sawtooth', hz: 140, to: 70, attack: 0.002, decay: 0.16, gain: 0.7 }, { noise: 'white', filter: 'lowpass', hz: 6000, to: 800, attack: 0.001, decay: 0.2, gain: 0.7 }] },
  'cast.boneMortar': { variants: 2, layers: [thud(120, 60, 0.16, 1), { noise: 'white', filter: 'lowpass', hz: 1200, to: 300, attack: 0.004, decay: 0.2, gain: 0.6 }] },
  'cast.mirrorClone': { variants: 3, layers: [{ tone: 'triangle', hz: 470, to: 940, attack: 0.004, decay: 0.08, gain: 0.5 }, { tone: 'triangle', hz: 705, to: 1410, attack: 0.004, decay: 0.08, gain: 0.35 }] },
  'cast.voidMine': { variants: 2, layers: [{ tone: 'sine', hz: 180, to: 60, attack: 0.01, decay: 0.2, gain: 0.8 }, { noise: 'white', filter: 'lowpass', hz: 600, to: 120, attack: 0.02, decay: 0.2, gain: 0.4 }] },
  'cast.blackSun': { variants: 2, layers: [{ tone: 'sine', hz: 150, to: 40, attack: 0.02, decay: 0.4, gain: 0.9 }, { noise: 'white', filter: 'bandpass', hz: 300, to: 80, q: 1.5, attack: 0.05, decay: 0.35, gain: 0.5 }] },
  // Draft and run rewards.
  'draft.skill': { variants: 1, layers: [{ tone: 'triangle', hz: 523, attack: 0.004, decay: 0.12, gain: 0.6 }, { tone: 'triangle', hz: 784, attack: 0.004, decay: 0.14, gain: 0.45, at: 0.05 }] },
  'draft.awakening': { variants: 1, layers: [{ tone: 'sawtooth', hz: 110, to: 220, attack: 0.02, decay: 0.4, gain: 0.5 }, { tone: 'triangle', hz: 659, attack: 0.01, decay: 0.5, gain: 0.4, at: 0.1 }, { noise: 'white', filter: 'highpass', hz: 3000, attack: 0.05, decay: 0.3, gain: 0.25 }] },
  'draft.heal': { variants: 1, layers: [{ tone: 'sine', hz: 523, to: 660, attack: 0.01, decay: 0.2, gain: 0.6 }, { tone: 'sine', hz: 784, attack: 0.01, decay: 0.2, gain: 0.3, at: 0.06 }] },
  'draft.coins': { variants: 1, layers: [{ tone: 'triangle', hz: 1568, attack: 0.001, decay: 0.08, gain: 0.5 }, { tone: 'triangle', hz: 2093, attack: 0.001, decay: 0.08, gain: 0.4, at: 0.05 }, { tone: 'triangle', hz: 2637, attack: 0.001, decay: 0.1, gain: 0.35, at: 0.1 }] },
  'draft.overdrive': { variants: 1, layers: [{ tone: 'sawtooth', hz: 130, to: 260, attack: 0.01, decay: 0.25, gain: 0.6 }, { noise: 'white', filter: 'bandpass', hz: 800, to: 2400, q: 1.2, attack: 0.02, decay: 0.2, gain: 0.4 }] },
  'run.upgrade': { variants: 1, layers: [{ tone: 'triangle', hz: 392, attack: 0.002, decay: 0.07, gain: 0.5 }, { tone: 'triangle', hz: 587, attack: 0.002, decay: 0.08, gain: 0.4, at: 0.04 }] },
  'run.levelUp': { variants: 1, layers: [{ noise: 'white', filter: 'bandpass', hz: 600, to: 4200, q: 1.1, attack: 0.03, decay: 0.3, gain: 0.5 }, { tone: 'triangle', hz: 523, attack: 0.01, decay: 0.3, gain: 0.4, at: 0.08 }, { tone: 'triangle', hz: 659, attack: 0.01, decay: 0.3, gain: 0.35, at: 0.14 }, { tone: 'triangle', hz: 784, attack: 0.01, decay: 0.4, gain: 0.35, at: 0.2 }] },
  'draft.sting': { variants: 1, layers: [{ tone: 'sawtooth', hz: 196, attack: 0.01, decay: 0.45, gain: 0.45 }, { tone: 'sawtooth', hz: 294, attack: 0.01, decay: 0.45, gain: 0.35 }, { noise: 'crackle', filter: 'highpass', hz: 2600, attack: 0.02, decay: 0.3, gain: 0.3 }] },
  // Pickups: a jade bead tick at C6-G6, under the warning lane even at the combo's +48%; the coin rings like a 엽전
  // on stone, body G6 and ring D8 with a 5.6 kHz click, either side of the lane.
  'pickup.xp': { variants: 3, layers: [{ tone: 'sine', hz: 1047, attack: 0.001, decay: 0.035, gain: 0.7 }, { tone: 'sine', hz: 1568, attack: 0.001, decay: 0.025, gain: 0.35 }] },
  'pickup.coin': { variants: 3, layers: [{ tone: 'triangle', hz: 1568, attack: 0.001, decay: 0.05, gain: 0.6 }, { tone: 'sine', hz: 4699, attack: 0.001, decay: 0.04, gain: 0.25 }, { noise: 'white', filter: 'bandpass', hz: 5600, q: 2, attack: 0.001, decay: 0.01, gain: 0.4 }] },
  // UI: brush flicks on paper.
  'ui.confirm': { variants: 2, layers: [tap(3000, 0.018, 0.8), { tone: 'triangle', hz: 740, attack: 0.001, decay: 0.03, gain: 0.3 }] },
  'ui.cancel': { variants: 2, layers: [tap(1800, 0.022, 0.8), { tone: 'triangle', hz: 440, attack: 0.001, decay: 0.035, gain: 0.3 }] },
  'ui.deny': { variants: 1, layers: [{ tone: 'square', hz: 150, attack: 0.002, decay: 0.06, gain: 0.35 }, tap(700, 0.04, 0.5)] },
  // Chapter materials (AUD-04): each chapter's enemies die in their own stuff. Ch1 keeps the paper tear above.
  'enemy.kill.iron': { variants: 4, layers: [{ tone: 'triangle', hz: 880, to: 640, attack: 0.001, decay: 0.12, gain: 0.7 }, { tone: 'square', hz: 1330, attack: 0.001, decay: 0.035, gain: 0.25 }, tap(3100, 0.03, 0.6)] },
  'enemy.kill.water': { variants: 4, layers: [{ noise: 'white', filter: 'lowpass', hz: 2400, to: 380, attack: 0.004, decay: 0.2, gain: 0.9 }, thud(320, 110, 0.1, 0.5)] },
  'enemy.kill.clock': { variants: 4, layers: [{ tone: 'square', hz: 2100, attack: 0.001, decay: 0.018, gain: 0.45 }, { tone: 'triangle', hz: 1250, to: 560, attack: 0.001, decay: 0.09, gain: 0.5, at: 0.03 }, { noise: 'crackle', filter: 'highpass', hz: 2800, attack: 0.001, decay: 0.06, gain: 0.35 }] },
  'enemy.kill.eclipse': { variants: 4, layers: [{ tone: 'sine', hz: 1760, to: 420, attack: 0.002, decay: 0.22, gain: 0.6 }, { noise: 'white', filter: 'highpass', hz: 5200, attack: 0.001, decay: 0.09, gain: 0.35 }] },
  // Boss patterns (AUD-04): one gesture each, played when the pattern fires.
  'boss.dash': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 500, to: 2400, q: 1.2, attack: 0.04, decay: 0.3, gain: 0.8 }, thud(90, 60, 0.25, 0.6)] },
  'boss.rings': { variants: 2, layers: [{ tone: 'sine', hz: 392, attack: 0.002, decay: 0.9, gain: 0.6 }, { tone: 'sine', hz: 988, attack: 0.002, decay: 0.5, gain: 0.3 }, { tone: 'triangle', hz: 196, attack: 0.004, decay: 0.7, gain: 0.3 }] },
  'boss.shock': { variants: 2, layers: [{ noise: 'crackle', filter: 'highpass', hz: 1800, attack: 0.001, decay: 0.25, gain: 1 }, thud(70, 40, 0.3, 0.8)] },
  'boss.clones': { variants: 2, layers: [{ tone: 'triangle', hz: 1175, to: 1760, attack: 0.02, decay: 0.3, gain: 0.45 }, { tone: 'triangle', hz: 1568, to: 2349, attack: 0.02, decay: 0.3, gain: 0.35, at: 0.06 }, { noise: 'white', filter: 'highpass', hz: 6000, attack: 0.05, decay: 0.2, gain: 0.2 }] },
  'boss.flame': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 900, to: 2600, attack: 0.05, decay: 0.45, gain: 0.9 }, { noise: 'crackle', filter: 'bandpass', hz: 1400, q: 0.7, attack: 0.02, decay: 0.4, gain: 0.4 }] },
  'boss.tide': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 300, to: 1500, attack: 0.25, decay: 0.6, gain: 0.8 }, { tone: 'sine', hz: 110, to: 82, attack: 0.2, decay: 0.6, gain: 0.4 }] },
  'boss.traps': { variants: 2, layers: [{ tone: 'square', hz: 740, attack: 0.001, decay: 0.03, gain: 0.35 }, { tone: 'square', hz: 988, attack: 0.001, decay: 0.03, gain: 0.3, at: 0.07 }, { tone: 'square', hz: 622, attack: 0.001, decay: 0.03, gain: 0.3, at: 0.14 }, tap(2400, 0.05, 0.6)] },
  'boss.clock': { variants: 2, layers: [{ tone: 'square', hz: 1760, attack: 0.001, decay: 0.02, gain: 0.5 }, { tone: 'square', hz: 1320, attack: 0.001, decay: 0.02, gain: 0.45, at: 0.25 }, thud(160, 120, 0.2, 0.4)] },
  'boss.saw': { variants: 2, layers: [{ tone: 'sawtooth', hz: 180, to: 420, attack: 0.02, decay: 0.35, gain: 0.5 }, { noise: 'white', filter: 'bandpass', hz: 3400, q: 2.4, attack: 0.02, decay: 0.3, gain: 0.5 }] },
  // Played as the bullet wall's telegraph starts: the eclipse conductor taps the stand three times (the amber family),
  // then the sun is swallowed, raised to 110-82 Hz so it carries on laptop speakers and over the ch5 drone.
  'boss.eclipse': { variants: 2, layers: [...clack(0, 2900, 0.8), ...clack(0.1, 2900, 0.8), ...clack(0.2, 3200), { tone: 'sine', hz: 110, to: 82, attack: 0.1, decay: 0.7, gain: 0.7, at: 0.1 }, { tone: 'triangle', hz: 220, to: 165, attack: 0.1, decay: 0.6, gain: 0.3, at: 0.1 }, { noise: 'white', filter: 'lowpass', hz: 500, to: 120, attack: 0.1, decay: 0.7, gain: 0.4, at: 0.1 }] },
  'boss.null': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 3000, to: 300, q: 1.5, attack: 0.35, decay: 0.3, gain: 0.7 }, { tone: 'sine', hz: 880, to: 110, attack: 0.3, decay: 0.3, gain: 0.3 }] },
  // Ambience beds (AUD-04): one quiet loop per chapter, under the effects.
  'ambience.ch1': { variants: 1, loop: 8, layers: [{ noise: 'white', filter: 'lowpass', hz: 420, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.8, lfo: { hz: 0.25, depth: 0.5 } }, ...[1.3, 3.9, 6.2].map((at) => ({ noise: 'crackle', filter: 'highpass', hz: 2600, attack: 0.02, decay: 0.25, gain: 0.25, at }))] },
  'ambience.ch2': { variants: 1, loop: 8, layers: [{ tone: 'sine', hz: 73, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.5, lfo: { hz: 0.125, depth: 0.4 } }, { tone: 'triangle', hz: 146, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.15, lfo: { hz: 0.25, depth: 0.6 } }, { tone: 'sine', hz: 523, attack: 0.002, decay: 2.4, gain: 0.2, at: 2 }] },
  'ambience.ch3': { variants: 1, loop: 8, layers: [{ noise: 'white', filter: 'bandpass', hz: 700, q: 0.6, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.8, lfo: { hz: 0.375, depth: 0.45 } }, { noise: 'white', filter: 'lowpass', hz: 220, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.6, lfo: { hz: 0.125, depth: 0.3 } }] },
  'ambience.ch4': { variants: 1, loop: 8, layers: [{ noise: 'white', filter: 'lowpass', hz: 300, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.35 }, ...Array.from({ length: 16 }, (_, index) => ({ tone: 'square', hz: index % 2 ? 1320 : 1760, attack: 0.001, decay: 0.012, gain: 0.18, at: index * 0.5 }))] },
  'ambience.ch5': { variants: 1, loop: 8, layers: [{ tone: 'sine', hz: 55, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.5, lfo: { hz: 0.125, depth: 0.5 } }, { noise: 'white', filter: 'highpass', hz: 4800, attack: 0.001, hold: 9.2, decay: 0.1, gain: 0.08, lfo: { hz: 0.5, depth: 0.8 } }] },
});
