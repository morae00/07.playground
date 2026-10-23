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
  'hit.heavy': { variants: 4, layers: [tap(1500, 0.05), thud(170, 90, 0.07, 0.8), { noise: 'crackle', filter: 'highpass', hz: 4800, attack: 0.001, decay: 0.04, gain: 0.35 }] },
  'hit.critical': { variants: 4, layers: [tap(1100, 0.08, 1.1), thud(120, 55, 0.12, 1), { noise: 'white', filter: 'lowpass', hz: 5200, to: 900, attack: 0.002, decay: 0.16, gain: 0.5, at: 0.01 }] },
  'shield.block': { variants: 3, layers: [{ tone: 'triangle', hz: 1175, to: 1047, attack: 0.001, decay: 0.09, gain: 0.7 }, { tone: 'sine', hz: 1760, attack: 0.001, decay: 0.07, gain: 0.3 }, { noise: 'white', filter: 'bandpass', hz: 5200, q: 2, attack: 0.001, decay: 0.02, gain: 0.5 }] },
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
  'cast.fanKnives': { variants: 3, layers: [{ noise: 'white', filter: 'highpass', hz: 6400, to: 4200, attack: 0.004, decay: 0.07, gain: 0.8 }, { tone: 'triangle', hz: 1300, to: 1700, attack: 0.001, decay: 0.03, gain: 0.25 }] },
  'cast.chainSpark': { variants: 3, layers: [{ noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.001, decay: 0.12, gain: 0.9 }, { tone: 'triangle', hz: 1760, to: 880, attack: 0.001, decay: 0.05, gain: 0.3 }] },
  'cast.frostLine': { variants: 3, layers: [{ noise: 'white', filter: 'bandpass', hz: 6800, to: 4600, q: 3, attack: 0.002, decay: 0.12, gain: 0.8 }, { noise: 'crackle', filter: 'bandpass', hz: 1200, q: 1.2, attack: 0.002, decay: 0.08, gain: 0.3 }, { tone: 'sine', hz: 1760, to: 1319, attack: 0.002, decay: 0.09, gain: 0.25 }] },
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
  'enemy.kill.iron': { variants: 4, layers: [{ tone: 'triangle', hz: 880, to: 640, attack: 0.001, decay: 0.12, gain: 0.7 }, { tone: 'triangle', hz: 1319, attack: 0.001, decay: 0.035, gain: 0.3 }, { noise: 'white', filter: 'bandpass', hz: 4800, q: 2, attack: 0.001, decay: 0.03, gain: 0.6 }] },
  'enemy.kill.water': { variants: 4, layers: [{ noise: 'white', filter: 'lowpass', hz: 2400, to: 380, attack: 0.004, decay: 0.2, gain: 0.9 }, thud(320, 110, 0.1, 0.5)] },
  'enemy.kill.clock': { variants: 4, layers: [{ tone: 'triangle', hz: 1568, attack: 0.001, decay: 0.018, gain: 0.5 }, { tone: 'triangle', hz: 1250, to: 560, attack: 0.001, decay: 0.09, gain: 0.5, at: 0.03 }, { noise: 'crackle', filter: 'highpass', hz: 4800, attack: 0.001, decay: 0.06, gain: 0.35 }] },
  'enemy.kill.eclipse': { variants: 4, layers: [{ tone: 'sine', hz: 1760, to: 420, attack: 0.002, decay: 0.22, gain: 0.6 }, { noise: 'white', filter: 'highpass', hz: 5200, attack: 0.001, decay: 0.09, gain: 0.35 }] },
  // Boss patterns (AUD-04): one gesture each, played when the pattern fires.
  'boss.dash': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 500, to: 2400, q: 1.2, attack: 0.04, decay: 0.3, gain: 0.8 }, thud(90, 60, 0.25, 0.6)] },
  'boss.rings': { variants: 2, layers: [{ tone: 'sine', hz: 392, attack: 0.002, decay: 0.9, gain: 0.6 }, { tone: 'sine', hz: 988, attack: 0.002, decay: 0.5, gain: 0.3 }, { tone: 'triangle', hz: 196, attack: 0.004, decay: 0.7, gain: 0.3 }] },
  // Played as the shock zone's telegraph starts: the rift officer's sabre strikes (the amber family), then the crack spreads.
  'boss.shock': { variants: 2, layers: [...clack(0, 3000), { noise: 'crackle', filter: 'highpass', hz: 1800, attack: 0.001, decay: 0.25, gain: 1, at: 0.04 }, thud(70, 40, 0.3, 0.8, 0.04), { tone: 'triangle', hz: 140, to: 80, attack: 0.002, decay: 0.2, gain: 0.4, at: 0.04 }] },
  'boss.clones': { variants: 2, layers: [{ tone: 'triangle', hz: 1175, to: 1760, attack: 0.02, decay: 0.3, gain: 0.45 }, { tone: 'triangle', hz: 1568, to: 2349, attack: 0.02, decay: 0.3, gain: 0.35, at: 0.06 }, { noise: 'white', filter: 'highpass', hz: 6000, attack: 0.05, decay: 0.2, gain: 0.2 }] },
  'boss.flame': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 600, to: 1800, attack: 0.04, decay: 0.3, gain: 0.9 }, { noise: 'crackle', filter: 'bandpass', hz: 1000, q: 0.8, attack: 0.02, decay: 0.28, gain: 0.4 }] },
  'boss.tide': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 300, to: 1500, attack: 0.25, decay: 0.6, gain: 0.8 }, { tone: 'sine', hz: 110, to: 82, attack: 0.2, decay: 0.6, gain: 0.4 }] },
  'boss.traps': { variants: 2, layers: [{ tone: 'square', hz: 740, attack: 0.001, decay: 0.03, gain: 0.35 }, { tone: 'square', hz: 988, attack: 0.001, decay: 0.03, gain: 0.3, at: 0.07 }, { tone: 'square', hz: 622, attack: 0.001, decay: 0.03, gain: 0.3, at: 0.14 }, tap(2400, 0.05, 0.6)] },
  'boss.clock': { variants: 2, layers: [{ tone: 'square', hz: 1760, attack: 0.001, decay: 0.02, gain: 0.5 }, { tone: 'square', hz: 1320, attack: 0.001, decay: 0.02, gain: 0.45, at: 0.25 }, thud(160, 120, 0.2, 0.4)] },
  'boss.saw': { variants: 2, layers: [{ tone: 'sawtooth', hz: 180, to: 420, attack: 0.02, decay: 0.35, gain: 0.45 }, { noise: 'white', filter: 'bandpass', hz: 4800, q: 2.4, attack: 0.02, decay: 0.3, gain: 0.5 }] },
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
  // SYS-14 bombers (appended, so every earlier file stays byte-identical). S4: the fuse burns, a paper sizzle that
  // brightens and swells toward the blast; it carries no timing (P0-3): the five amber clacks are bomber.tick, played
  // on simulation time. The blast's body sits at 110-220 Hz where laptop speakers carry it, and its crackle stays above
  // the warning lane.
  'bomber.fuse': { variants: 2, layers: [{ noise: 'crackle', filter: 'highpass', hz: 4200, to: 6000, attack: 0.6, hold: 0.35, decay: 0.15, gain: 0.1 }, { noise: 'white', filter: 'bandpass', hz: 1400, to: 2000, q: 1.2, attack: 0.9, hold: 0.05, decay: 0.15, gain: 0.06 }] },
  'bomber.blast': { variants: 3, layers: [{ noise: 'white', filter: 'lowpass', hz: 2400, to: 180, attack: 0.002, decay: 0.5, gain: 1 }, thud(110, 45, 0.4, 0.7), { tone: 'triangle', hz: 220, to: 90, attack: 0.002, decay: 0.25, gain: 0.35 }, { noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.001, decay: 0.22, gain: 0.45 }] },
  // SYS-15 arsenal casts (K10 Q7, appended so every earlier file stays byte-identical): each weapon's own object and
  // gesture (arsenal-icons §3.4, arsenal-fx §2), in the table's order. A weapon without a cue keeps its look's
  // cast.<look>, which stays the family's reference. Short (most under 0.25 s), main energy kept out of the 2.4-3.6 kHz
  // warning lane, and nothing shaped like the clack, the kill tear, the shield clink, or the pickup ticks.
  // volley
  'cast.inkDarts': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1900, q: 3, attack: 0.001, decay: 0.025, gain: 1 }, { tone: 'triangle', hz: 820, to: 640, attack: 0.001, decay: 0.03, gain: 0.35 }, { noise: 'white', filter: 'bandpass', hz: 1650, q: 3, attack: 0.001, decay: 0.025, gain: 0.8, at: 0.04 }, { tone: 'triangle', hz: 760, to: 600, attack: 0.001, decay: 0.03, gain: 0.3, at: 0.04 }] },
  'cast.brushQuills': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1600, to: 1000, q: 1.2, attack: 0.006, decay: 0.07, gain: 0.8 }, { noise: 'crackle', filter: 'highpass', hz: 4500, attack: 0.001, decay: 0.03, gain: 0.3 }] },
  'cast.sealArrows': { variants: 2, layers: [{ tone: 'triangle', hz: 210, to: 150, attack: 0.002, decay: 0.12, gain: 0.7 }, { noise: 'white', filter: 'lowpass', hz: 2000, to: 600, attack: 0.006, decay: 0.1, gain: 0.6 }, tap(900, 0.03, 0.7)] },
  'cast.frostNeedles': { variants: 2, layers: [{ tone: 'sine', hz: 4400, to: 4150, attack: 0.001, decay: 0.06, gain: 0.4 }, { tone: 'sine', hz: 5900, attack: 0.001, decay: 0.04, gain: 0.25, at: 0.012 }, { noise: 'white', filter: 'highpass', hz: 6000, attack: 0.002, decay: 0.05, gain: 0.5 }, { noise: 'white', filter: 'bandpass', hz: 1500, q: 2, attack: 0.001, decay: 0.02, gain: 0.4 }] },
  'cast.thunderNeedles': { variants: 2, layers: [{ noise: 'crackle', filter: 'bandpass', hz: 1500, q: 1.2, attack: 0.001, decay: 0.07, gain: 0.8 }, { tone: 'sawtooth', hz: 180, to: 120, attack: 0.001, decay: 0.05, gain: 0.3 }, { tone: 'sine', hz: 1800, to: 900, attack: 0.001, decay: 0.04, gain: 0.3 }] },
  'cast.twinBlades': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1500, q: 1.5, attack: 0.01, decay: 0.12, gain: 0.9, lfo: { hz: 28, depth: 0.8 } }, { tone: 'triangle', hz: 1050, attack: 0.001, decay: 0.05, gain: 0.3 }, { tone: 'triangle', hz: 1180, attack: 0.001, decay: 0.05, gain: 0.25, at: 0.03 }] },
  'cast.ghostVolley': { variants: 2, layers: [{ tone: 'sine', hz: 1300, to: 1700, attack: 0.01, decay: 0.1, gain: 0.45 }, { tone: 'sine', hz: 1900, to: 2200, attack: 0.015, decay: 0.08, gain: 0.25 }, { noise: 'white', filter: 'highpass', hz: 5000, attack: 0.02, decay: 0.08, gain: 0.35 }] },
  'cast.headsmanDarts': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1200, to: 700, q: 2.5, attack: 0.004, decay: 0.09, gain: 0.9 }, { tone: 'triangle', hz: 620, attack: 0.001, decay: 0.14, gain: 0.35 }, { tone: 'sine', hz: 1490, attack: 0.001, decay: 0.1, gain: 0.2 }] },
  // burst
  'cast.paperStorm': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 900, to: 2000, q: 1.2, attack: 0.01, decay: 0.14, gain: 0.9, lfo: { hz: 18, depth: 0.7 } }, { noise: 'crackle', filter: 'highpass', hz: 6000, attack: 0.005, decay: 0.05, gain: 0.2 }] },
  'cast.inkBloom': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 900, to: 1900, attack: 0.01, decay: 0.09, gain: 0.8 }, { tone: 'sine', hz: 330, to: 520, attack: 0.003, decay: 0.08, gain: 0.4 }, { tone: 'sine', hz: 1400, to: 900, attack: 0.001, decay: 0.03, gain: 0.25, at: 0.06 }, { tone: 'sine', hz: 1250, to: 820, attack: 0.001, decay: 0.03, gain: 0.2, at: 0.085 }] },
  'cast.thornHalo': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 600, to: 1700, q: 1.4, attack: 0.01, decay: 0.07, gain: 0.8 }, ...[[0.03, 1720], [0.045, 1930], [0.062, 1580], [0.078, 2050]].map(([at, hz]) => ({ tone: 'triangle', hz, attack: 0.001, decay: 0.012, gain: 0.3, at }))] },
  'cast.starShards': { variants: 2, layers: [{ noise: 'crackle', filter: 'highpass', hz: 4500, attack: 0.001, decay: 0.06, gain: 0.7 }, { tone: 'triangle', hz: 1400, attack: 0.001, decay: 0.06, gain: 0.35 }, { tone: 'triangle', hz: 2100, attack: 0.001, decay: 0.05, gain: 0.25, at: 0.02 }, { tone: 'sine', hz: 5300, attack: 0.001, decay: 0.04, gain: 0.2, at: 0.03 }] },
  'cast.sunNeedles': { variants: 1, layers: [{ noise: 'white', filter: 'lowpass', hz: 700, attack: 0.002, decay: 0.06, gain: 0.6 }, ...[[0, 4100], [0.02, 5200], [0.045, 4500], [0.07, 5900], [0.1, 4300], [0.13, 4900]].map(([at, hz]) => ({ tone: 'sine', hz, attack: 0.001, decay: 0.03, gain: 0.3, at }))] },
  // spray: the fastest casts, so the shortest and plainest
  'cast.inkDrizzle': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1300, q: 2, attack: 0.001, decay: 0.02, gain: 0.7 }, { noise: 'white', filter: 'bandpass', hz: 800, q: 3, attack: 0.001, decay: 0.018, gain: 0.5, at: 0.014 }] },
  'cast.pinHail': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1800, q: 2.5, attack: 0.001, decay: 0.018, gain: 0.6 }, { tone: 'sine', hz: 5000, attack: 0.001, decay: 0.015, gain: 0.3 }, { tone: 'sine', hz: 4300, attack: 0.001, decay: 0.015, gain: 0.25, at: 0.012 }] },
  // rear
  'cast.tailGuard': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1700, to: 1000, q: 1.2, attack: 0.04, decay: 0.05, gain: 0.8 }, { tone: 'triangle', hz: 840, attack: 0.001, decay: 0.04, gain: 0.35, at: 0.04 }, { tone: 'triangle', hz: 1260, attack: 0.001, decay: 0.03, gain: 0.2, at: 0.04 }] },
  'cast.smokeTail': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 500, to: 1400, attack: 0.015, decay: 0.12, gain: 1 }, { noise: 'white', filter: 'bandpass', hz: 900, q: 0.8, attack: 0.01, decay: 0.08, gain: 0.3 }] },
  'cast.gravePins': { variants: 2, layers: [{ noise: 'white', filter: 'highpass', hz: 4500, attack: 0.01, decay: 0.04, gain: 0.4 }, ...[[0.035, 1100, 0.8], [0.06, 1250, 0.6], [0.09, 1000, 0.5]].map(([at, hz, gain]) => ({ noise: 'white', filter: 'bandpass', hz, q: 4, attack: 0.001, decay: 0.018, gain, at })), thud(300, 200, 0.04, 0.4, 0.035)] },
  // seeker
  'cast.trackingSeals': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1100, to: 2100, q: 2, attack: 0.01, decay: 0.07, gain: 0.7 }, { tone: 'triangle', hz: 700, attack: 0.001, decay: 0.025, gain: 0.4, at: 0.06 }, { noise: 'white', filter: 'bandpass', hz: 600, q: 1.4, attack: 0.001, decay: 0.02, gain: 0.5, at: 0.06 }] },
  'cast.huntersMarks': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1700, q: 3, attack: 0.001, decay: 0.02, gain: 0.8 }, { noise: 'crackle', filter: 'bandpass', hz: 1100, q: 1.2, attack: 0.002, decay: 0.05, gain: 0.4, at: 0.03 }, { tone: 'triangle', hz: 600, to: 1200, attack: 0.003, decay: 0.06, gain: 0.3 }] },
  'cast.crowFeathers': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 1400, attack: 0.01, decay: 0.05, gain: 0.9 }, { noise: 'white', filter: 'lowpass', hz: 1200, attack: 0.01, decay: 0.05, gain: 0.7, at: 0.06 }, { noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.002, decay: 0.04, gain: 0.2 }] },
  'cast.bossbane': { variants: 1, layers: [thud(110, 70, 0.1, 0.8), { noise: 'crackle', filter: 'bandpass', hz: 900, q: 2, attack: 0.01, decay: 0.14, gain: 0.5 }, { tone: 'sine', hz: 1250, to: 1180, attack: 0.001, decay: 0.08, gain: 0.2, at: 0.01 }] },
  // strike: the blow lands as it is cast
  'cast.inkLightning': { variants: 2, layers: [{ noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.001, decay: 0.05, gain: 0.8 }, { noise: 'crackle', filter: 'bandpass', hz: 1400, q: 1, attack: 0.001, decay: 0.04, gain: 0.6 }, { noise: 'white', filter: 'lowpass', hz: 900, to: 200, attack: 0.01, decay: 0.2, gain: 0.7, at: 0.02 }, thud(95, 60, 0.15, 0.5, 0.01)] },
  'cast.brushDownpour': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 1800, to: 500, attack: 0.002, decay: 0.05, gain: 0.9 }, { noise: 'white', filter: 'lowpass', hz: 1600, to: 450, attack: 0.002, decay: 0.05, gain: 0.7, at: 0.045 }, thud(160, 100, 0.06, 0.4)] },
  'cast.fallingScroll': { variants: 1, layers: [thud(140, 80, 0.14, 1), { noise: 'white', filter: 'bandpass', hz: 600, q: 2, attack: 0.001, decay: 0.04, gain: 0.6 }, { noise: 'crackle', filter: 'bandpass', hz: 1500, q: 0.8, attack: 0.01, decay: 0.14, gain: 0.35, at: 0.03 }] },
  'cast.seventhSeal': { variants: 1, layers: [...[[0, 1], [0.04, 0.8], [0.075, 0.65]].flatMap(([at, gain]) => [{ noise: 'white', filter: 'bandpass', hz: 450, q: 2.5, attack: 0.001, decay: 0.03, gain, at }, thud(150, 110, 0.06, 0.6 * gain, at)]), { noise: 'white', filter: 'lowpass', hz: 1500, attack: 0.002, decay: 0.05, gain: 0.3 }] },
  // nova: around the player
  'cast.inkPulse': { variants: 2, layers: [thud(85, 55, 0.18, 0.8), { tone: 'triangle', hz: 170, to: 110, attack: 0.002, decay: 0.12, gain: 0.3 }, { noise: 'white', filter: 'lowpass', hz: 300, to: 1500, attack: 0.02, decay: 0.14, gain: 0.7 }] },
  'cast.frostRing': { variants: 2, layers: [{ noise: 'crackle', filter: 'highpass', hz: 5000, attack: 0.005, decay: 0.2, gain: 0.6 }, { tone: 'sine', hz: 4600, to: 4300, attack: 0.002, decay: 0.1, gain: 0.25, at: 0.02 }, { tone: 'sine', hz: 1050, to: 1400, attack: 0.01, decay: 0.12, gain: 0.3 }, { noise: 'white', filter: 'lowpass', hz: 250, attack: 0.01, decay: 0.15, gain: 0.4 }] },
  'cast.thunderclap': { variants: 1, layers: [{ noise: 'white', filter: 'bandpass', hz: 1100, q: 1.4, attack: 0.001, decay: 0.03, gain: 1 }, { noise: 'white', filter: 'bandpass', hz: 1900, q: 1.6, attack: 0.001, decay: 0.025, gain: 0.5 }, { noise: 'white', filter: 'lowpass', hz: 600, to: 150, attack: 0.02, decay: 0.25, gain: 0.6, at: 0.03 }, { noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.001, decay: 0.08, gain: 0.3, at: 0.02 }] },
  'cast.silenceBell': { variants: 1, layers: [{ noise: 'white', filter: 'bandpass', hz: 4800, q: 2, attack: 0.001, decay: 0.01, gain: 0.4 }, { tone: 'sine', hz: 880, attack: 0.002, decay: 0.4, gain: 0.5 }, { tone: 'sine', hz: 1760, attack: 0.002, decay: 0.25, gain: 0.25 }, { tone: 'sine', hz: 2210, attack: 0.002, decay: 0.15, gain: 0.15 }, { noise: 'white', filter: 'bandpass', hz: 4800, q: 2, attack: 0.001, decay: 0.01, gain: 0.25, at: 0.13 }, { tone: 'sine', hz: 880, attack: 0.002, decay: 0.25, gain: 0.25, at: 0.13 }, { noise: 'white', filter: 'highpass', hz: 5000, attack: 0.1, decay: 0.2, gain: 0.12, at: 0.05 }] },
  // lob: the throw (the landing has no cue yet)
  'cast.inkPots': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 700, to: 1400, q: 1, attack: 0.02, decay: 0.1, gain: 0.7 }, { tone: 'triangle', hz: 1720, attack: 0.001, decay: 0.05, gain: 0.35 }, { tone: 'sine', hz: 4300, attack: 0.001, decay: 0.03, gain: 0.15 }] },
  'cast.clusterPots': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 900, to: 1500, q: 1, attack: 0.015, decay: 0.09, gain: 0.5 }, ...[[0, 2050], [0.03, 1820], [0.055, 2150]].map(([at, hz]) => ({ tone: 'triangle', hz, attack: 0.001, decay: 0.025, gain: 0.35, at }))] },
  'cast.tarJar': { variants: 1, layers: [{ tone: 'sine', hz: 220, to: 140, attack: 0.004, decay: 0.08, gain: 0.5 }, { tone: 'sine', hz: 330, to: 180, attack: 0.004, decay: 0.07, gain: 0.4, at: 0.045 }, { noise: 'white', filter: 'lowpass', hz: 500, attack: 0.01, decay: 0.12, gain: 0.5 }] },
  'cast.meteorBrush': { variants: 1, layers: [{ noise: 'white', filter: 'lowpass', hz: 600, to: 2200, attack: 0.04, decay: 0.25, gain: 0.9 }, { tone: 'sawtooth', hz: 70, to: 110, attack: 0.02, decay: 0.22, gain: 0.3 }, { noise: 'crackle', filter: 'highpass', hz: 4500, attack: 0.02, decay: 0.15, gain: 0.25 }] },
  // chain
  'cast.sparkThread': { variants: 2, layers: [{ noise: 'crackle', filter: 'highpass', hz: 4800, attack: 0.001, decay: 0.1, gain: 0.6 }, { tone: 'triangle', hz: 1400, to: 1000, attack: 0.001, decay: 0.03, gain: 0.4 }, { tone: 'sine', hz: 700, attack: 0.001, decay: 0.05, gain: 0.2 }] },
  'cast.stormThread': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 600, to: 1400, q: 1.5, attack: 0.02, decay: 0.12, gain: 0.8 }, { noise: 'crackle', filter: 'bandpass', hz: 1700, q: 1.5, attack: 0.005, decay: 0.1, gain: 0.5 }, { tone: 'sawtooth', hz: 130, attack: 0.002, decay: 0.06, gain: 0.2 }] },
  'cast.frostChainlet': { variants: 2, layers: [...[[0, 980, 0.45], [0.028, 1240, 0.4], [0.052, 1090, 0.35]].flatMap(([at, hz, gain]) => [{ tone: 'triangle', hz, attack: 0.001, decay: 0.035, gain, at }, { tone: 'sine', hz: hz * 1.41, attack: 0.001, decay: 0.025, gain: gain * 0.5, at }, { noise: 'white', filter: 'bandpass', hz: 1800, q: 2, attack: 0.001, decay: 0.012, gain: gain * 0.8, at }]), { noise: 'white', filter: 'highpass', hz: 6000, attack: 0.005, decay: 0.07, gain: 0.3 }] },
  // beam
  'cast.inkLance': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1200, to: 1800, q: 1.5, attack: 0.008, decay: 0.07, gain: 0.8 }, { tone: 'triangle', hz: 1660, attack: 0.001, decay: 0.06, gain: 0.25, at: 0.015 }, { noise: 'white', filter: 'bandpass', hz: 1800, to: 900, q: 1.5, attack: 0.01, decay: 0.06, gain: 0.4, at: 0.1 }] },
  'cast.wideBrush': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 700, to: 1200, q: 0.8, attack: 0.02, decay: 0.14, gain: 0.9 }, { noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.02, decay: 0.1, gain: 0.3 }] },
  'cast.crossStrokes': { variants: 1, layers: [...[[0, 1500, 1], [0.025, 1800, 0.85], [0.05, 1300, 0.75], [0.075, 1700, 0.65]].map(([at, hz, gain]) => ({ noise: 'crackle', filter: 'bandpass', hz, q: 1.6, attack: 0.001, decay: 0.03, gain, at })), { noise: 'white', filter: 'lowpass', hz: 2200, to: 800, attack: 0.004, decay: 0.1, gain: 0.4 }] },
  'cast.judgmentLine': { variants: 1, layers: [{ noise: 'white', filter: 'bandpass', hz: 1000, q: 3, attack: 0.001, decay: 0.015, gain: 0.9 }, { tone: 'triangle', hz: 200, to: 194, attack: 0.001, decay: 0.25, gain: 0.6 }, { tone: 'triangle', hz: 400, to: 388, attack: 0.001, decay: 0.15, gain: 0.3 }, { tone: 'sine', hz: 100, to: 97, attack: 0.002, decay: 0.2, gain: 0.3 }] },
  // halo
  'cast.inkOrbit': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 900, to: 1500, q: 2, attack: 0.02, decay: 0.04, gain: 0.7 }, { noise: 'white', filter: 'bandpass', hz: 1500, to: 1000, q: 2, attack: 0.005, decay: 0.05, gain: 0.6, at: 0.05 }] },
  'cast.wardRing': { variants: 2, layers: [{ noise: 'crackle', filter: 'bandpass', hz: 500, q: 3, attack: 0.005, decay: 0.08, gain: 0.6 }, thud(130, 90, 0.08, 0.7), { tone: 'triangle', hz: 260, to: 200, attack: 0.002, decay: 0.07, gain: 0.3 }, { noise: 'white', filter: 'bandpass', hz: 1200, q: 2, attack: 0.001, decay: 0.03, gain: 0.3, at: 0.02 }] },
  'cast.eclipseHalo': { variants: 1, layers: [{ tone: 'sine', hz: 130, to: 190, attack: 0.03, decay: 0.22, gain: 0.3 }, { noise: 'white', filter: 'bandpass', hz: 400, to: 900, q: 2, attack: 0.03, decay: 0.2, gain: 0.7 }, { noise: 'white', filter: 'highpass', hz: 6000, attack: 0.02, decay: 0.1, gain: 0.15, at: 0.05 }] },
  // S4 follow-up: one amber clack per fuse tick, played on simulation time (pitch from presentation), so pauses and the slow game keep it true.
  'bomber.tick': { variants: 2, layers: [...clack(0, 2900, 1)] },
  // Warnings (V3): the amber family, played as a threat is telegraphed. Appended at the end, so earlier files stay byte-identical.
  'warn.ranged': { variants: 2, layers: [...clack(0, 3000, 0.9), ...clack(0.07, 3300, 0.7)] },
  'warn.boss': { variants: 2, layers: [...clack(0, 2700), ...clack(0.09, 2900), ...clack(0.18, 3200), { noise: 'white', filter: 'lowpass', hz: 400, to: 900, attack: 0.15, decay: 0.15, gain: 0.5 }] },
});
