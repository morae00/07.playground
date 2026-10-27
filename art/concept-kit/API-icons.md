# API — kit/k-icons.js (PN.icons · PN.vfx)

먹극화 · PAPER NOIR INK — skill icons 17, rarity frames, pickups, telegraph / zone / hit / kill / decal / damage-number language (bible §12, §13.3, §13.4).

## Load order
```html
<script src="kit/lib.js"></script>        <!-- required: PN.taper, PN.rng, PN.halftone, PN.speedLines, PN.splat -->
<script src="kit/k-icons.js"></script>    <!-- no dependency on hero.js / sprites.js / boss.js -->
```
- Every function returns an SVG markup **string**: one `<g>` with its own `<defs>` (patterns, clipPaths, filters, gradients).
- All ids are unique per call (prefix `ki<N><tag>_`, module counter), so any number of instances can be composed on one scene. Verified: sheet + extra tiles = 266 ids, 0 duplicates, 0 dangling `url(#…)`.
- Position with `transform="translate(x,y) scale(s)"`. Colors are bible §3 tokens, exposed as `PN.icons.K` (`ink #121110`, `ink7 #2B2926`, `ink5 #46423D`, `ink3 #8C8579`, `ink1 #BCB4A5`, `p50 #FAF6EC`, `paper #F3EEE2`, `p300 #D8D0C0`, `hanji #EFE6D2`, `voidp #E2DBCB`, `ally #00A8C6`, `allyD #007C94`, `allyG #CFF6FF`, `hostile #EF5B4F`, `warn #D88D16`, `reward #86B82D`, `elite #805AD5`, `silver`, `gold`, `ground1 #B8AC93`).
- The original split sources (`work/icons/src/01…10-*.js`, `work/icons/build.sh`) are not in this repository: `art/concept-kit/k-icons.js` is the source and is edited directly. The Ch1 role silhouettes (`PN._ki.SIL`) are baked from `k-enemies.js` into this file (no runtime dependency on that module).
- **Rev 2 (AD rework):** every signature below is unchanged; new options are additive (`kill/decal {role}`, `telegraph {flash}`, `skill {pitchFor}`) and there is one new function (`PN.icons.hudSlot`).
- **Rev 2.1 (2026-10-26, full audit P2 — art P2-4, kit P2-1):** signatures unchanged. Three outputs changed on purpose, nothing else:
  1. `magnetSigil` (plain and awakened): the talisman has no strokes (they read as 'エ·ㄴ·十'); it is a blank paper strip with torn side edges and foot and one ink seal blot.
  2. `paperWard` (plain and awakened): no dot inside any scale (the dot halftone and the two lacing holes made 'B'/'R' counters; the three loose plates read as a Latin 'B'). Every scale is folded paper — a lit face and a flat shade face split by one oblique fold — and the rows are laid bottom-up so each rounded foot overlaps the row below. The loose plates are the same scale cut with a slanted top, one fold line, spread apart.
  3. The awakened `覺` seal glyph is a fixed outline (`PN._ki.KAKU`, one `<path class="ki-kaku" fill-rule="evenodd">`) instead of `<text font-family="AppleMyungjo…">`, so the 61 awakened tiles (17 skill + 44 arsenal, which borrow this frame) bake the same on every machine. See `frame()` below.
  - Proof that nothing else moved: the K9 C5 composition without `paperWard`/`magnetSigil` and with the seal element normalised (`<text …>覺</text>` and `<path class="ki-kaku" …/>` both → `[SEAL]`) is `1otfqng len=2297146` before and after; `skillvfx-all=1xq1i37` is unchanged.
- **Rev 2.2 (2026-10-26, P2 follow-up — art-director review F1, F2, R1, R2):** signatures unchanged. Three icon drawings changed on purpose (plain and awakened, so their skill tiles and HUD slots too), nothing else:
  1. `recoveryThread` (F1): one thread sews the gash shut instead of three equal X's in a row (they read as 'XXX' at 120 px). Two cross-stitches of different size and angle (0.8× −12° and 1× 0°, centres 23.7 apart where the X's were 15.6; the gap between neighbouring stitches is ≥ the 11.2 stitch width), an ink needle hole (r 1.2) at every stitch end, a short thread arcing from each stitch to the next (paper 5 + ink 2.2, the `tailT` grammar), and the stitch by the needle a single pulled stroke (1.15× +10°) that starts where `tailT` ends. Spool, needle, patch and gash are unchanged; no cyan.
  2. `frostLine` (F2): the round, ink-ringed crumbs below the cut (they read as 'o·0·8') are now five angular chalk chips: four-point wedges (longest edge ≥ 1.6× the shortest), paper with one `p300` shade facet and a 1.1 ink edge, ≥ 7 apart and ≥ 3 clear of the cut's ink stroke. They use fixed geometry and no random numbers, so the 30 dust specks still take `rng(21)` first and come out unchanged. Cut, chalk, star and the mass's eyes are unchanged.
  3. `paperWard` (R1): the two top loose plates no longer sit on the strap tips (they read as spatulas on sticks). The plate top edge is 3.5 lower (a shorter plate, rounded foot showing), and the two top plates are ×0.8 (was 0.92) so they fit beside the straps: left (9,28) −10°, right (87,9.5) 14° between the collar and the strap (right of the strap is the awakened seal). The third plate keeps its place and size, (113,52) 62° ×0.92, with the shorter cut.
  4. R2: the unused font constant `SERIF` is gone from the source and from `PN._ki` (40 keys). No output used it. The one 'AppleMyungjo' left in the kit sources is the provenance comment of `KAKU`, which this revision does not touch.
  - Proof that nothing else moved (the rev 2.1 method, see the table at the end): the K9 C5 composition without the three icons is `1p19mpe len=2288766` raw and `c604qa len=2165838` with the seal normalised, before and after; `skillvfx-all`, every K9 arsenal hash and the VFX/pickup hash are unchanged. `KAKU` and the awakened seal markup are unchanged (the raw hash covers every awakened frame).
  - Rebake: the `skill-tiles` and `hud-slots` sheets. The arsenal sheets and the atlas do not draw these icons.
- **Rev 2.3 (2026-10-27, the user's choice (다) in the kit P2 review §2.2: the kit writes the 覺 seal):** signatures unchanged. One output changed on purpose, nothing else: the awakened seal glyph, so the 61 awakened tiles (`skill-tiles` 17, `arsenal-tiles` 44).
  1. `PN._ki.KAKU` is 20 brush strokes in the standard stroke order, written by the kit from the structure of the character (覺 = 𦥯 over 見: the two 𦥑 halves around 爻, then 冖; 目 + 儿). It was written without looking at any font (글꼴을 보지 않고 썼다): no font glyph was rendered, viewed or traced, no other person's calligraphy was used, and the coordinates of the rev 2.1 outline were not used. Stroke table and brush kinds: `frame()` below.
  2. The seal markup changes one attribute, `fill-rule="nonzero"` (was `evenodd`). The stroke pieces overlap at every joint and crossing and all wind the same way, so nonzero fills their union; even-odd would open a hole in every overlap (23.9 of the 139.5 units² of ink). It is still one `<path class="ki-kaku" …/>`, so the rev 2.1 seal normaliser still applies.
  3. New read-only export `PN._ki.KAKU_STROKES` (`PN._ki` now 41 keys): a frozen array of frozen `{ n, stroke, pieces, d }` records in writing order, the data behind `KAKU` (= the `d`s joined), for review plates and this document. The `pieces` arrays are the data as written; treat them as read-only (changing them does not change `KAKU`, which is built once at load).
  - Proof that nothing else moved (the rev 2.1 method, table at the end): with the seal normalised, the full K9 C5 composition, C5 − three, every K9 arsenal hash and `all44-icons` are the same before and after; `skillvfx-all`, `shots264` and the VFX/pickup composition are the same raw.
  - Rebake: the `skill-tiles` and `arsenal-tiles` sheets (`node scripts/build-ui-art.mjs sheets`). HUD slots, plain tiles, bonus tiles and the atlas carry no seal.
- **Rev 2.4 (2026-10-27, kit P2 follow-up and seal review: F3 required, R4 recommended, done in one round so the 61 awakened cells bake once):** signatures unchanged. Two outputs changed on purpose, nothing else:
  1. F3 `paperWard` (plain and awakened, so its tiles and HUD slots too): the two top loose plates were nearly upright (−10°, 14°) and read as a 'U' / shield. They now fly off tilted and leaning the same way — right (84.5,11.6) −38° ×0.8, left (10,36) −50° ×0.74 — with a torn top edge (four uneven teeth, inked 2.0 so the top is never the thin side), a short diagonal crease (a bent corner) instead of a fold from the top to the foot, and a smaller offset shadow (0.6). Ink to ink (probe `rev24-plates-probe`): right plate 7.19 off the right strap, 3.28 off the cuirass outline, 9.05 off the collar, 2.82 inside the window, 6.47 card units off the awakened seal's shadow disc (6.16 off the paper disc); left plate 5.92 off the left strap, 4.15 off the cuirass outline, 2.25 inside the window. The third plate (113,52) 62° ×0.92, the scale rows, straps, collar, band and buckle are unchanged; no cyan.
  2. R4 `KAKU`: the strokes are heavier so the seal reads as ink, not grey, at 1×. Verticals, 撇, 冖 and 儿 ×1.25–1.3 (𦥑 verticals 1.45, 爻 1.38–1.55, 冖 1.5–1.75, 目 verticals 1.75 / 1.85, 儿 1.7–2.0), horizontals ≤ ×1.1 (stroke 3 kept at 1.02 and stroke 4 at 1.14 for the 𦥑 gap). To keep the gaps with the heavier strokes: the 𦥑 left half moved 0.7 toward 爻 and the right half 0.35; stroke 1 (撇) stands at 46° (was 35°, review §2.5 item 3); 目 moved 0.15 down with its inner horizontals 0.3 shorter; 冖's right end 0.15 in; 儿's foot 0.15 up. Same 20 strokes, order, stroke directions, one nonzero path and winding.
  - Proof: with the seal normalised, C5 − three is `c604qa len=2165838` and every K9 arsenal hash is the same before and after; `frostLine` `1imzng8` and `recoveryThread` `1224g4p` are the same. New: `paperWard` `18eps6a`, `KAKU` `w0b72m len=16761`. Table at the end.
  - Rebake: `skill-tiles`, `hud-slots` (paperWard) and `arsenal-tiles` (the seal).

---

## PN.icons

### `PN.icons.skill(id, {size = 128, awakened = false})`
- **Local box** 0,0 → 128,128 (the master). `size` scales the box (`size/128`). **Pivot** = box top-left (UI element, no world pivot).
- **Display sizes:** 128 master (@2x of the 64 px icon), 120 on draft cards, **48 px readability target**, 40 px HUD slot.
- **Halftone floor (§3.1 / §5-4):** every dot tone inside an icon is generated through the call context, whose pitch is `max(8, 3·128/size)` master units, so tones are never finer than 3 px on screen (128/48 → 8, 40 → 9.6). Dot radii are rescaled to keep 20/40/60 % coverage. `pitchFor` (internal, optional) sets the display size used for the floor without changing `size` (used by `tile()` and `hudSlot()`).
- Normal: paper background, shadow-side halftone fade bottom-right, brush-pen subject (`feDisplacementMap` wobble), paper grain α≈0.06. Everything is clipped to the 128 window.
- `awakened: true`: ink (먹지) background + paper ensō brush circle + paper 2.2 px knock-out halo around the subject. The subject is scaled 1.1 and breaks out of the window by **at most 10 units** (clipped to −10…138, i.e. it never leaves the 160 card). Ground bands / roof lines that must stay inside the window are returned by the drawing as `top` and are always clipped to the window (fixes the blackSun roof bar). `mirrorClone` opts out of the halo (`halo:false`) because it is line art.
- Signal rule: actives carry exactly one cyan element (thread, glint, stitch ring, rim). Passives have no cyan. No coral, amber or violet appears in any icon. Coins are `ink.100`, not amber.

| id | 이름 | rarity | kind | drawing |
|---|---|---|---|---|
| needleStorm | 먹선 바늘 | common | active | 3 slim paper.50 needles (70 long, ≤ 7 wide, ink-dipped sharp point, elongated eye slot) fanned 20° apart from one ink splash; a cyan thread through each eye S-curves back to the splash; 4 short speed strokes. Awakened: 5 needles, the thread splits (부채꼴 난사) |
| fanKnives | 부채 단검 | common | active | hanji fan with pleat halftone, ribs forged into blades, black moon behind; cyan glint on the centre blade |
| chainSpark | 백색 연쇄 | rare | active | ink / cyan / paper-core zig-zag bolt linking 3 ink-drop ghouls (slit paper eyes) |
| frostLine | 백묵 절단 | rare | active | a chalk stick has cut a black mass in two; white gash with cyan core, chalk dust. Rev 2.2: below the cut five angular chalk chips (four-point wedges, paper + `p300` facet, 1.1 ink edge, fixed geometry), no round crumbs |
| orbitScythes | 초승 궤도 | epic | active | 3/4 top-down gat at the centre (paper brim disc + crown with ink shadow wedge); two 낫 with wrapped handles at 10 and 4 o'clock on a tilted orbit that breaks outside the black disc; trailing motion arcs; cyan inner edge on the front sickle |
| boneMortar | 골분 박격 | epic | active | solid ink.900 onggi (ink.500 lit face upper-left, paper knock-out halo, paper cloth cap) with a paper crossed-bones label, falling on a paper burst; cyan stitched landing ring |
| railSpear | 흑선 레일 | legendary | active | heavy black spear (shaft 8, head ≈ 30, paper bevel facet) with a cyan core, riding a flat ink.100 rail band between two ruled lines + one rivet-dot row; runs a ghoul through a paper burst |
| mirrorClone | 거울 분신 | legendary | active | two true side profiles of 결 facing each other across a cracked mirror: gat from the side (flat lens brim, tapered crown + band), one brush contour brow→nose→lips→chin, eye glint dot under the diagonal brim shadow, right-cheek scar, scarf knot, hair tail. Lines ≥ 4 (shadow side 5.4). Cyan running stitch on the right copy only. Brims ≥ 6 px inside the window |
| voidMine | 무음 지뢰 | epic | active | spiked ink-swirl disc sunk in the ground, swallowed sound arcs; cyan stitched ring |
| blackSun | 검은 태양 | mythic | active | black disc, white corona, alley roofs; cyan diamond-ring glint |
| eclipseStep | 일식 보법 | mythic | active | the verb dominates: one heavy diagonal paper brush slash (lower-left → upper-right) with a cyan rim; small eclipse disc (r 25 ≈ 40 % of the window) behind; three 짚신 sole prints with crescent shadows stepping beside it (ink.300 → 500 → 900) |
| ironFrame | 철골 프레임 | common | passive | riveted girder-lattice heater shield |
| magnetSigil | 수거 자석 | common | passive | horseshoe with nail holes and a paper talisman pulling 엽전 on field lines. Rev 2.1: the talisman is blank — torn side edges and torn foot, one ink seal blot (`blob` r 3.2 at strip (2.4, 12.6)), no strokes |
| paperWard | 종이 갑주 | rare | passive | cuirass of overlapping folded-paper scales (6 rows, laid bottom-up so the rounded feet show); three loose scales lift off at the shoulders. Rev 2.1: each scale = lit face + flat shade face (`p300`, `ink1` on the dark side) split by one oblique fold, no dots; loose scales have a slanted cut top and one ink fold line. Rev 2.2: the loose-scale top is 3.5 lower; they sit at (87,9.5) 14° ×0.8, (113,52) 62° ×0.92 and (9,28) −10° ×0.8. The two top ones keep their ink ≥ 5.6 off the 7-wide shoulder straps, ≥ 3.4 off the cuirass outline and ≥ 2.1 inside the window; the right one stays ≈ 6 card units clear of the awakened seal. Rev 2.4 (F3): the two top plates no longer stand upright (they read as a 'U' / shield): right (84.5,11.6) −38° ×0.8, left (10,36) −50° ×0.74, both leaning the same way (no mirrored pair); their top is a torn edge of four uneven teeth (depth 1.0–1.4 after scaling) inked 2.0, the fold is a short diagonal crease from a tooth notch to the right side (a bent corner, `p300` above it) instead of a line from the top to the foot, and the offset shadow is 0.6 (was 1). The third plate (113,52) 62° ×0.92 is unchanged |
| recoveryThread | 회복 실 | rare | passive | spool feeds ink thread through a needle that is mid-stitch; a torn paper patch with a black gash sewn shut (no ring). Rev 2.2: one thread — a 0.8× −12° and a 1× 0° cross-stitch with an ink needle hole (r 1.2) at each end, a paper + ink thread arcing from stitch to stitch, and by the needle one pulled stroke (1.15× +10°) where the needle's tail thread ends |
| coinFever | 동전 열병 | rare | passive | 7 엽전 (ink.100, ink outline, square hole, r ≥ 7.4) stacked and leaping out of the tip of a black flame over a coin pile; paper sparkle stars. Awakened keeps a paper-outlined flame |
| executionMark | 집행 표식 | legendary | passive | ink seal stamp with a paper brush ✕ knocked out (not 인주 red) |

Helpers: `PN.icons.list()` returns the 17 ids. `PN.icons.info(id)` returns `{id, name, rarity, rarityKo, kind}`. `PN.icons.RARITY` = `['common','rare','epic','legendary','mythic']`, `PN.icons.RARITY_KO`.

### `PN.icons.frame(rarity, {size, metal = true, awakened = false})`
- **Local box** 0,0 → 160,160 (card), plus a 4 px ink offset shadow at +4,+4. **Icon window** (16,16) → (144,144). **Knot thread** is centred at y = 152.5. `size` scales the card (`size/160`).
- Rarity is coded by **shape only** (§13.3):

| rarity | window line | extra | knots 結 | band |
|---|---|---|---|---|
| common 일반 | single brush ink line (heavier bottom/right) | — | 1 | — |
| rare 희귀 | double line | — | 2 | — |
| epic 영웅 | double line | 4 corner diamonds | 3 | 40 % halftone band |
| legendary 전설 | double line | + torn card edge + stitched dotted inner edge | 4 | **은니** silver gradient |
| mythic 신화 | inverted card (ink card, paper lines) | torn edge + corner diamonds | 5 | **금니** gold gradient |

- `metal:false` replaces the metal gradients with flat `ink.300` (legendary) or paper (mythic). Use it everywhere outside the draft modal: HUD and battle canvas must have zero `rank.*` tokens.
- `awakened:true` adds ink-bleed blots with drips along the border and a `覺` seal: paper disc r 18 with an ink ensō ring and the glyph centred on (137, 23), fully inside the card corner (glyph ≈ 22 units, ≈ 8.8 px at 0.4 display). The seal is drawn last so the popped-out art never covers it. **Knots keep the skill's own rarity** (see delta below).
  - Rev 2.3 (weights rev 2.4): the glyph is `<path class="ki-kaku" d="${PN._ki.KAKU}" fill="ink" fill-rule="nonzero"/>`, the kit's 20 brush strokes: no `<text>`, no font. `KAKU` = 58 pieces (20 `taperFn` ribbons and 38 small ellipses for the pressed entries, turns and round ends), 1210 points, 16.8 KB, bbox 126.57–147.81 × 11.44–33.47 card units (inside the earlier 125.9–148.0 × 11.4–33.5), ink ≥ 0.80 inside the ensō's inner edge (rev 2.3: 0.94). All 58 pieces wind the same way, so the nonzero fill is their union (even-odd would hole every joint: 161.8 units² of ink, 128.2 with even-odd). Mythic (inverted) cards draw the same ink glyph on their paper disc.
  - The 61 cells that carry it: `skill-tiles` awakened 17, `arsenal-tiles` awakened 44. Plain frames, bonus tiles and HUD slots have no seal.
  - Provenance (rev 2.3): written by the kit (kit-artist agent) from the structure of the character and its standard stroke order, without looking at any font (글꼴을 보지 않고 썼다). No font glyph was rendered, viewed or traced; no other person's calligraphy, scan or photo was used; the coordinates of the rev 2.1 outline were not used. That outline (traced from a system-font rendering, rev 2.1) is retired. One disclosure: while the module was being edited, a file read once displayed the retired outline's source line, after these strokes had been drafted and rendered; nothing was taken from it (rev 2.3 delivery report). A person who reads the character should still confirm the strokes and their order (P2 review §2.2 (다)).
  - Sizes and weights (rev 2.4, review R4): the glyph is 22.0 units tall, 20.6 px at the 150 tile (1×, em 22.5 px) and 41 px at the 2× bake (em 45 px). Stroke widths (card units): 𦥑 verticals and 撇 1.45, 𦥑 horizontals 1.02–1.19 (提 1.14), 爻 1.38–1.55, 冖 1.5–1.75, 目 horizontals 1.19–1.3 and verticals 1.75 / 1.85, 儿 1.7–2.0. Measured gaps (`rev24-kaku-gaps`, ink to ink): 目's horizontals 0.91–0.96, the 𦥑 horizontals 1.40–1.83 (strokes 1–3 1.40, 3–4 1.42, 9–10 1.77, 10–11 1.58), 爻's two crosses 0.90, the top part to 冖 0.85–1.06, 冖 to 目 0.67 at 目's pressed corner and 0.80–0.90 elsewhere. 目's inner horizontals stop 0.61–0.75 short of the right vertical; horizontals rise ≈ 2° to the right; 目's verticals lean in slightly at the foot. At 1× (tile 150) 目's verticals and 儿 always cover at least one whole pixel (4–8 pixels at coverage ≥ 0.9 whatever the half-pixel alignment); 冖 and the 𦥑 verticals reach 0.81–1.0 depending on alignment; at 2× every stroke has whole-pixel ink (`rev24-kaku-coverage`).
  - Rev 2.4 also moved strokes to keep those gaps with the heavier widths: 𦥑 left half +0.7 in x and right half −0.35 (both toward 爻, review R4 option 2); stroke 1 stands at 46° (was 35°, R4 option 1, review §2.5 item 3); stroke 6 ends 0.15 shorter and stroke 7 starts 0.1 lower; 目 0.15 lower with inner horizontals ending 0.3 shorter; 冖's right end 0.15 in; 儿's foot 0.15 up. Not taken: lengthening the 𦥑 verticals to y ≈ 19.3 (R4 option 3). With the heavier 冖 that would leave only ≈ 0.4 between them, so the verticals keep their ends (18.7 left, 18.45 right; ink to ≈ 19.0, level with 爻's foot).

  **覺 strokes** (`PN._ki.KAKU_STROKES`, card units, writing order: the top from left to right — 𦥑 left half, 爻, 𦥑 right half — then 冖, 目, 儿). A spine is a Catmull-Rom curve (`smooth(…, 8)`) through start, the listed points and end, resampled to about 3 samples per unit (10–28 segments) and drawn with `taperFn`. "turn" is the corner point of a `Z` press.

  | # | stroke | part | pieces | start | end | width | spine through |
  |---|---|---|---|---|---|---|---|
  | 1 | ㇒ 撇 | 𦥑 left | P | (131.35, 11.88) | (129.5, 13.8) | 1.45 | (130.42, 12.84) |
  | 2 | ㇑ 豎 | 𦥑 left | S | (129.4, 13.6) | (129.68, 18.7) | 1.45 | (129.52, 16.1) |
  | 3 | ㇐ 橫 | 𦥑 left | H | (129.9, 15.72) | (132.2, 15.48) | 1.02 | (131, 15.6) |
  | 4 | ㇀ 提 | 𦥑 left | T | (129.8, 18.55) | (132.7, 17.45) | 1.14 | (131.2, 18.08) |
  | 5 | ㇒ 撇 | 爻 upper | P | (138.75, 12) | (135.25, 14.6) | 1.38 | (137.3, 13.22) |
  | 6 | ㇔ 點 | 爻 upper | N | (135.55, 12.55) | (138.05, 14.35) | 1.45 | (136.85, 13.5) |
  | 7 | ㇒ 撇 | 爻 lower | P | (140, 15.55) | (134.55, 18.85) | 1.45 | (137.65, 17.2) |
  | 8 | ㇏ 捺 (long dot) | 爻 lower | N | (135.3, 15.95) | (140.2, 18.5) | 1.55 | (137.6, 17.25) |
  | 9 | ㇕ 橫折 | 𦥑 right | Hc + Z + Sc | (142.1, 12.85) | (145.1, 18.45) | 1.12 / 1.3 / 1.45 | (143.65, 12.75) to (145.25, 12.62); turn (145.4, 12.75); (145.4, 12.8), (145.3, 15.7) |
  | 10 | ㇐ 橫 | 𦥑 right | H | (142.35, 15.7) | (145, 15.55) | 1.12 | (143.65, 15.62) |
  | 11 | ㇐ 橫 | 𦥑 right | H | (142.15, 18.45) | (145.2, 18.3) | 1.19 | (143.65, 18.38) |
  | 12 | ㇔ 點 | 冖 | D | (127, 20.15) | (127.6, 21.8) | 1.75 | (127.32, 20.95) |
  | 13 | ㇖ 橫鉤 | 冖 | Hc + Z + G | (127.9, 20.9) | (145.6, 22.85) | 1.5 / 1.45 / 1.65 | (137.5, 20.68) to (146.9, 20.55); turn (146.9, 20.6); (146.95, 20.65), (146.4, 21.8) |
  | 14 | ㇑ 豎 | 目 | S | (133, 22.75) | (133.2, 29.4) | 1.75 | (133.08, 25.95) |
  | 15 | ㇕ 橫折 | 目 | Hc + Z + Sc | (133.3, 22.95) | (140.9, 29.25) | 1.26 / 1.35 / 1.85 | (137.2, 22.8) to (141.1, 22.6); turn (141.25, 22.75); (141.25, 22.8), (141.12, 26) |
  | 16 | ㇐ 橫 | 目 | H | (133.7, 25.05) | (139.35, 24.81) | 1.19 | (136.7, 24.93) |
  | 17 | ㇐ 橫 | 目 | H | (133.7, 27.12) | (139.35, 26.89) | 1.19 | (136.7, 27) |
  | 18 | ㇐ 橫 | 目 | H | (133.15, 29.25) | (141.3, 28.92) | 1.3 | (137.1, 29.1) |
  | 19 | ㇒ 撇 | 儿 | P | (134.55, 29.6) | (129.5, 33) | 2.0 | (134.4, 31), (133, 32.3) |
  | 20 | ㇟ 豎彎鉤 | 儿 | W + Z + G | (138.65, 29.55) | (146.15, 30.75) | 1.9 / 1.7 / 1.8 | (138.7, 31.15), (139.4, 32.35), (141.5, 32.65) to (145.3, 32.5); turn (145.25, 32.4); (145.3, 32.55), (145.75, 31.7) |

  **Brush kinds.** The ribbon width along the stroke is `prof(w, a, s0, b, s1, m)`: the brush presses in over the first `a` of the length from `s0·w`, lifts out over the last `b` to `s1·w` (cosine ease), and the body between eases to `m·w` mid-way. Ellipses are given as rx × ry in multiples of `w`.

  | kind | stroke | a, s0, b, s1, m | entry | end |
  |---|---|---|---|---|
  | H | 橫 | 0.14, 0.8, 0.16, 0.72, 0.92 | pressed head: 0.55 × 0.41 at 45°, 0.26 w into the stroke, 0.03 w down | pressed stop: 0.5 × 0.39 at 38°, 0.24 w back, 0.07 w down |
  | Hc | 橫 into a turn | 0.14, 0.8, 0.06, 0.92, 0.92 | pressed head | into the `Z` |
  | S | 豎 (垂露) | 0.12, 0.85, 0.14, 0.82, 0.9 | pressed head | round end: 0.45 × 0.41 along the stroke, 0.1 w back |
  | Sc | 豎 out of a turn | 0.05, 0.95, 0.14, 0.82, 0.9 | from the `Z` | round end |
  | P | 撇 | 0.12, 0.88, 0.6, 0.07, 1 | pressed head | lifts off to a point |
  | T | 提 | 0.12, 0.9, 0.7, 0.07, 1 | pressed head | lifts off to a point |
  | D | 點 | 0.68, 0.3, 0.12, 0.82, 1 | lands thin | round end |
  | N | 爻's long dots (㇔, ㇏) | 0.72, 0.24, 0.1, 0.78, 1 | lands thin | round end |
  | W | 豎彎 | 0.1, 0.88, 0.05, 0.96, 0.8 | pressed head | runs into the hook (thinnest at the bend) |
  | G | 鉤 | 0.04, 1, 0.8, 0.06, 1 | from the `Z` | flicks out to a point |
  | Z | pressed turn (頓) | ellipse 0.6 × 0.46 at 45°, centre the corner + (0.1 w, 0.06 w) | | |

  - Choices a reader should confirm: stroke 4 is written as a rising 提 (a flat 橫 is the other common form); the top is written left half → 爻 → right half.
- Epic halftone band pitch is 8 card units (≥ 3 px down to a 64 px card); with `size` it follows `max(8, 3·160/size)`.

### `PN.icons.tile(id, {rarity, awakened, metal, size})`
- Frame + icon composed in the same 160 box. The icon sits at (16,16), and rarity defaults to the skill's own. When `awakened`, the icon is drawn over the frame so the art breaks the panel.

### `PN.icons.hudSlot(id, {size = 40, level = 0, cooldown = 0, awakenReady = false, rarity})` — new in rev 2
- §13.2 in-game HUD skill slot. **Local box** 0,0 → 52,56 at `size` 40 (everything scales by `size/40`). **Pivot** = top-left. Slot card (0,0)–(44,44) + 2 px ink offset shadow, icon 40 at (2,2) (halftone floor 9.6 → 3 px).
- Active = square slot, passive = chamfered slot. **Rarity = knot count only**, in ink, on a thread under the slot (knot glyph 5.4 px, 1.0 px gaps, y 50.5). Level = 5 square pips in a column at x 46.4. `cooldown` (0..1 remaining) = ink α0.64 clockwise wedge from 12 o'clock with a paper hairline on the sweeping edge. `awakenReady` = small paper ensō badge at the top-right corner.
- No cyan, coral or `rank.*` metal in the slot chrome. Draw it over the battlefield ground (knots are ink). `PN.icons.HUD_SLOT_BOX` = `{w:52, h:56, icon:[2,2,40], knotY:50.5}`.

### `PN.icons.pickup(kind, {tier, size})`
- **Local box** 48×48, which is **2× the in-game px**. **Pivot** (24,24) = pickup centre. A ground shadow ellipse sits at y = 43.
- `size` = display size of the 48 box. For 1× in game use `size = 24`, or in general `scale = inGamePx / (PICKUP_PX·2)`.

| kind | in-game px (`PN.icons.PICKUP_PX`) | drawing |
|---|---|---|
| `xp` (`tier` 1/2/3) | 14 / 16 / 18 | lime jade diamond, facets, paper glint; tier 2 facet lines, tier 3 sparkle |
| `coin` | 12 | 엽전 `ink.100` disc, punched square hole, ink rim (no amber) |
| `magnet` | 22 | ink horseshoe, paper poles, lime jade inside (it hauls XP), pull dashes |
| `heal` | 22 | folded paper 약첩 packet tied with ink cord, lime cross seal |

---

## PN.vfx — world units (1 unit = 1 in-game px at zoom 1.0)

### `PN.vfx.telegraph(shape, stage, size, opts)` — 적 텔레그래프 "붓이 그려 나가는 예고" (§12.2)
- `shape` / `size` / **origin (0,0)**:
  - `'circle'`: `size` = radius (use the hazard radius exactly). Origin = centre.
  - `'lane'`: `size` = length along +x, `opts.width` (default 36). Origin = start of the lane on its centre line.
  - `'cone'`: `size` = radius, `opts.angle` = full angle in degrees (default 60). Origin = apex, opening along +x.
  - `'grid'`: `size` = square side. Two horizontal and two vertical iron bars (bar width 0.2·size) at ±size/4. Origin = centre.
- `opts.dir` = rotation in degrees. `opts.progress` (0..1) overrides how much of the outline the brush has drawn. Defaults: preview 0.42, imminent 0.86, active 1. **Drawn outline fraction = telegraph progress.** `PN.vfx.TELE_STAGE` gives the stage ranges: preview 0–0.65, imminent 0.65–1.
- `stage`:
  - `preview`: ink α0.7 2 px dashed outline over the drawn part; the undrawn part is an `ink.300` dotted guide. A wet tapered trail ends in a teardrop brush head. Fill is amber diagonal hatch, 2 px lines at pitch 10, α≈0.6, with a 0.7 px ink hairline under each line so it prints on light ground.
  - `imminent`: the same hatch at pitch 5, a 5 px ink outline with an amber dash inside, 8 radial ticks (lane: 12), a pulse echo ring on circles, and a larger brush head. Lanes get an amber arrowhead and grids get latch rivets.
  - `active`: coral fill α0.55 + a **graded ink halftone edge band** inside the rim: 4 dot rows at pitch 4.6 world units (≥ 3 px at 1x and at the sheet's ×0.66): 86 % (neighbouring dots merge into a solid inner rim) → 60 → 40 → 20 %, band ≈ 14 units, scaled down for thin shapes by the shape's inradius (grid bars, narrow lanes). Closed 5 px ink outline. Lane arrowhead turns coral. There is no stitched/dotted rim, so it never reads as the ally ring (checked in the grayscale/CVD proof, sheet panel 04).
  - `opts.flash: true` (the 0.1 s 종이 섬광 frame only) adds a 2.8 px paper line just inside the rim. The resting active frame has no paper band.
- Hand-off: after `active`, stamp `PN.vfx.decal()` for about 1.2 s.

### `PN.vfx.allyZone(r = 64, {motif})` — 아군 장판 (e.g. 골분 박격 landing)
- Circle of radius `r` centred on the origin: paper α0.25, cyan halftone 20 % (pitch 6), and a cyan running-stitch border (ink 5 / cyan 2.8 / glow 0.8, dash 8/5).
- `motif:'bone'` adds bone-powder specks. It never uses hatching or coral.

### `PN.vfx.enemyZone(kind = 'slow', r = 64)` — 적 지대 (comparison partner)
- `slow`: amber 3 px border inside an ink 5.4 px border, dense hatch α0.35 with the **same 0.7 px ink hairline under each amber line as the telegraph hatch** (visible on light ground at α0.35), ink wave symbol with a paper knock-out (symbol scales with `min(1, r/42)`).
- `root`: the same border and hatch with a chain-link symbol. `fire` hatch also carries the hairline.
- `null`: `void.paper` fill, amber/ink dotted border, thin coral 1.5 px ring, ⊘ symbol.
- `fire`: hatched ring, coral core with ink outline, paper flame glyph.
- Origin = centre.

### `PN.vfx.hit(frame 0..3, {angle, crit, seed})` — 적중
- Origin = impact point. `angle` (degrees) = travel direction of the blow; spatter flies that way.
- Comic paper star ≤ 16 px with an ink rim, plus 9 ink drops (streaks on f1–f2).
- `crit:true`: star ×1.55, a large ink bleed blot with drips behind it (파묵), strokes ×2, 16 drops. Never coral.
- Frames: f0 flash, f1 full star, f2 broken star, f3 shards and settled drops.

### `PN.vfx.kill(frame 0..5, {role = 'stalker', r, seed})` — 처치 (먹 폭발 6f)
- Built from the **actual Ch1 role silhouettes** of `k-enemies.js` (baked into `09-sil.js` as outline geometry: `PN._ki.SIL`), so the death reads as *that* enemy. `role` = `'stalker'` (벽보 들개, default) · `'charger'` (먹통 황소) · `'shooter'` (붓대 포수) · `'warden'` (회벽 수문장). Unknown roles fall back to stalker.
- Origin = enemy **pivot** (hitbox centre), same local frame as `PN.enemies.draw` placed at displayScale. `r` defaults to the role's hitbox radius (12 / 19 / 12 / 28); a different `r` scales the silhouette. Ground shadow at (0, 0.55·r).
- Frames: **f0** paper negative of the silhouette (2 px ink outline, ink eye holes) · **f1** ink body swells ×1.08 with paper cracks from the centre + tension ticks · **f2** the body bursts into 4 rotated shards over an ink star (radius ≤ min(0.9·half-length, 1.6·r)) with a paper flash core · **f3** the body slumps into ink (vertical ×0.5, goo-merged) with droplets · **f4** puddle derived from the body (×0.36, goo filter) + drips + wet glint + paper ✕✕ at the head end + a torn ink.100 poster scrap · **f5** settled ink.700 puddle (×0.32) + ✕✕ = `decal(0)` shape.
- Footprint at 1x (stalker): f0–f2 ≈ 52 × 32 px, f4–f5 ≈ 44 × 12 px. Lay out frame cells ≥ 60 px apart at ×1 (sheet uses ×1.2 at 86 / 58 px).

### `PN.vfx.decal(age, {role = 'stalker', r, seed, lod})` — 마른 먹 자국
- Same puddle geometry as kill f5 (derived from the role silhouette). **Origin = ground point = pivot + (0, 0.55·r)** (unchanged rev-1 contract): `decal(0)` stamped at the ground point overlaps kill f5 drawn at the pivot exactly. `age` in seconds.
- Colour ink.700 → ink.300 over 3 s; opacity 0.92 → 0.60, then fades out 25–30 s (after that an empty group). Wet glint < 1 s, ✕✕ < 1.2 s, poster scrap < 15 s, dry-brush streaks once dry. Halftone rim (pitch 3.2, masked to the puddle) is dropped with `lod:'reduced'`.
- Layer: above the ground, below hazard fills. Budget 48 / 24 / 0.

### `PN.vfx.damageNumber(value, crit = false, {kind})`
- Origin = centre of the text baseline. Font: Avenir Next Condensed 800 (the bundled build should substitute a bold condensed OFL face), skewed −8°.
- `dealt`: ink numerals with a paper 3.4 px outline, 14 px.
- `dealt` + `crit`: inverted jagged ink tag with paper numerals, 17 px, and "!". Not coral.
- `hit(frame, {crit})`: the crit ink-bleed drips are shorter in rev 2 (≤ 16 units below the impact) so a ×2 display fits a 60 px row.
- `taken`: coral numerals with an ink outline, 15 px, prefixed "−".
- `heal`: lime numerals with an ink outline, prefixed "+".

---

## Bible delta (AD rulings, rev 2) — approved deviations from style-bible v1.0

1. **Hatch hairline (§3.2 sandwich rule).** Every amber hatch line (telegraph preview/imminent, slow/root/fire zones) carries a 0.7 px `ink.900` hairline (α0.55) on its lower edge. Reason: §3.2 forbids colour-only signal lines; amber on Ch1 ground is 1.21:1. The hairline is the ink layer of the sandwich, not an extra hatch. The allyZone never uses it (no hatching at all).
2. **Awakened frames keep the rarity knots.** §13.3 table row *각성* is read as: frame = 원 등급 프레임 + 먹 번짐 테 + 붓 원(ensō) + 覺 인장, **매듭 = 원 등급 유지**. Five knots on an awakened common would read as mythic, so knot count stays a pure rarity code everywhere (cards, tiles, HUD).

   | 등급 | 프레임 | 매듭 | 재질 |
   |---|---|---|---|
   | 각성 | 스킬 일러스트가 칸을 깨고 튀어나옴(≤ 10 u) + 먹 번짐 테 + 붓 원 + 覺 인장 | **매듭 = 원 등급 유지** | 금박 대신 먹 번짐 |
3. **Icon halftone floor.** §5-4 "1x pitch ≥ 3 px" is applied at the display size of the icon (48 px card strip, 40 px HUD), not only at the 128 master: pitch = `max(8, 3·128/size)`.

---

## Notes for runtime
- Icons use `feTurbulence` / `feDisplacementMap` filters. Rasterize once into the icon atlas (128 master → 64 / 48 / 40 mips); do not render live.
- VFX are stamp-sized vectors meant to be baked per frame into the FX atlas, per bible §14. The telegraph can also be rendered live because it is cheap without filters.
- Sheet: `work/icons/sheet.html` (+ `sheet-a/b/c.js`) → `out/icons-vfx.png` (1600×1000). Verified rev 2: 319 ids, 0 duplicates, 0 dangling `url(#…)`; telegraph cells keep ≥ 8 px from the row dividers; FX frames keep ≥ 4 px from labels.

---

## Self-checks (rev 2.1, 2026-10-26)

Run from the repository root with `node scripts/art-review-sheet.mjs expr …`; a probe that throws prints its text.

| Check | Before rev 2.1 | After rev 2.1 |
|---|---|---|
| K9 C5 `icons-all` (command in `API-icons2.md` §8 `k9-c5-unchanged`) | `19vh262 len=2634966` | `1ppwq36 len=2775655` (intended: paperWard, magnetSigil, seal) |
| K9 C5 `skillvfx-all` | `1xq1i37 len=698432` | same |
| C5 composition − paperWard − magnetSigil, seal normalised | `1otfqng len=2297146` | **same** |
| K9 `keep-but-MR` / `icons32` / `shots264` | `1nz2ip3` / `st2cpv` / `194b48x` | `r0yvbb len=4712046` / `1258xoj len=4367429` / `194b48x` (awakened tiles carry the seal) |
| same, seal normalised | `1ties3r` / `159p5qb` | **same** |
| K9 `volley-keep-v2` / `batch2-accepted` | `11ea404` / `1cu38bf` | `c8qbvw len=970336` / `3w5svv len=2364628` |
| same, seal normalised | `wby8ee` / `rrl5bv` | **same** |
| K9 `batch3-icons` / `n1-awakened` | `1prsfzs` / `1agojwf` | `1xxdfo8 len=2830151` / `hb2bg7 len=287742` |
| same, seal normalised | `uvtmhk` / `1k4npwd` | **same** |
| seal cells (awakened tiles with the glyph) | 61 | 61 (plain frames 0) |
| `<text` / `AppleMyungjo` in every icon, frame, tile, slot, pickup and arsenal tile | 61 cells | 0 |

Seal normaliser used in those rows (applied after each command's own id normaliser):
```js
function seal(m){return m.replace(/<text x="137" y="31.2"[^>]*>覺<\/text>/g,"[SEAL]").replace(/<path class="ki-kaku"[^>]*\/>/g,"[SEAL]");}
```

Letter check (K9 method, art audit P2-4): shuffled sheets mixing both icons (plain and awakened) with eight other skill icons, grayscale, at 120 px (draft-card window, tile 150), 40 px and 32 px HUD slots with the 1-px block filter of `k9-t3px-blind20-all`. No letter reads in `paperWard` or `magnetSigil` (renders `p2kit-blind120-gray`, `p2kit-blind40-32-gray`).

## Self-checks (rev 2.2, 2026-10-26)

Same commands and normalisers as rev 2.1. "C5 − three" is the C5 composition (`skill` 128 and 40, `tile` 150 metal, `hudSlot` 40 for every id, plain and awakened, plus every frame) with `frostLine`, `paperWard` and `recoveryThread` left out.

| Check | Before rev 2.2 | After rev 2.2 |
|---|---|---|
| K9 C5 `icons-all` | `1ppwq36 len=2775655` | `j5efte len=2786703` (intended: the three icons) |
| K9 C5 `skillvfx-all` | `1xq1i37 len=698432` | same |
| C5 − three, raw (covers `KAKU` and every awakened frame) | `1p19mpe len=2288766` | **same** |
| C5 − three, seal normalised | `c604qa len=2165838` | **same** |
| `frostLine` / `paperWard` / `recoveryThread` (`skill` plain + awakened, ids normalised) | `1pdjezc` / `10cz142` / `dh0ka1` | `1imzng8` / `9ep2si` / `1224g4p` |
| K9 `keep-but-MR` / `icons32` / `shots264` / `all44-icons` | `r0yvbb` / `1258xoj` / `194b48x` / `199zjh5 len=6108240` | same |
| K9 `volley-keep-v2` / `batch2-accepted` / `batch3-icons` / `n1-awakened` | `c8qbvw` / `3w5svv` / `1xxdfo8` / `hb2bg7` | same |
| `PN.vfx` telegraphs, zones, hits, kills, decals, damage numbers + `PN.icons.pickup` | `1qa8nyx len=642500` | same |
| `PN._ki` keys | 41 (with `SERIF`) | 40 |
| awakened tiles carrying `ki-kaku` (17 skill + 44 arsenal) / plain frames | 61 / 0 | 61 / 0 |
| `<text` / `font-family` / `AppleMyungjo` in 412 icon, tile, slot, frame, pickup and arsenal cells | — | 0 / 0 / 0 |
| `--check` on 400 of those cells in one call (`p22-lint-all`) | — | ok |

Geometry (probes `p22-f1f2-probe`, `p22-r1-eval`):
- `recoveryThread`: 10 needle holes (4 + 4 + 2); stitch centres (52.5,103), (75,95.5), (97.3,86.1), 23.7 and 24.2 apart; horizontal gaps between stitches 11.27 and 11.91 (stitch width 11.2); the pulled stroke starts at (92.5,76.5), at the end of `tailT` (92,76).
- `frostLine`: 5 chips of 4 points; longest/shortest edge 1.62–4.09; ≥ 7.25 between chip inks; ≥ 3.07 clear of the cut's 12-wide ink stroke; the 30 dust circles equal the `rng(21)` sequence verbatim.
- `paperWard` top plates (ink to ink, the offset shadow included): left (9,28) −10° ×0.8 — 5.63 off the left strap, 5.92 off the cuirass, 2.28 inside the window's left edge; right (87,9.5) 14° ×0.8 — 8.74 off the right strap, 3.49 above the cuirass, 8.20 off the collar, 2.19 below the window's top edge, 5.99 card units clear of the awakened seal disc.

Read check (not blind; the drawer looked): grayscale, every skill tile plain and awakened shuffled at 120 px (`p22-blind120-gray`), the changed tiles at 120 px and 2× (`p22-changed120-gray`, `p22-changed-2x-gray`), 40 and 32 px HUD slots in the bake's recipe at true size and with a 1-px block filter (`p22-slots40-32-gray-1x`, `p22-slots40-32-gray-px4`). No row of X's, no circle or digit among the chips, and the top plates stand apart from the straps.

## Self-checks (rev 2.3, 2026-10-27)

Same compositions and normalisers as rev 2.1 and 2.2, computed in one throwing probe before and after (`seal3-hash-before`, `seal3-hash-after`): the C5 composition of `k9-c5-unchanged` (and C5 − three as in rev 2.2), the K9 compositions of `k9u-keep-but-MR`, `k9-baselines-v2` and `k9-batch3-hash`, and `all44-icons` (every arsenal id's icon + tile + slot, plain and awakened). The VFX + pickup row uses its own composition (telegraph 4 shapes × 3 stages, both ally zones, the 4 enemy zones, hit f0–3 plain and crit, kill f0–5 and decal at six ages for each role, every pickup kind and tier; `damageNumber` is left out because it draws text and is not baked), so compare it only with itself.

| Check | Before rev 2.3 | After rev 2.3 |
|---|---|---|
| K9 C5 `icons-all`, raw | `j5efte len=2786703` | `87qgcg len=3105060` (intended: the seal of every awakened tile and frame) |
| K9 C5 `icons-all`, seal normalised | `4q23nc len=2648409` | **same** |
| K9 C5 `skillvfx-all` | `1xq1i37 len=698432` | same |
| C5 − three, raw / seal normalised | `1p19mpe len=2288766` / `c604qa len=2165838` | `v977qq len=2571750` / **same** |
| K9 `keep-but-MR`, raw / seal normalised | `r0yvbb len=4712046` / `1ties3r len=4548142` | `3cm7b len=5089358` / **same** |
| K9 `icons32`, raw / seal normalised | `1258xoj len=4367429` / `159p5qb len=4203525` | `14rrmzn len=4744741` / **same** |
| K9 `shots264` | `194b48x len=344617` | same |
| K9 `all44-icons`, raw / seal normalised | `199zjh5 len=6108240` / `13n8k49 len=5882872` | `1s1ca2h len=6627044` / **same** |
| K9 `volley-keep-v2`, raw / seal normalised | `c8qbvw len=970336` / `wby8ee len=944726` | `167r2wu len=1029291` / **same** |
| K9 `batch2-accepted`, raw / seal normalised | `3w5svv len=2364628` / `rrl5bv len=2292920` | `1q7pa6z len=2529702` / **same** |
| K9 `batch3-icons`, raw / seal normalised | `1xxdfo8 len=2830151` / `uvtmhk len=2717467` | `sj14qg len=3089553` / **same** |
| K9 `n1-awakened`, raw / seal normalised | `hb2bg7 len=287742` / `1k4npwd len=272376` | `o0zvid len=323115` / **same** |
| VFX + pickup (rev 2.3 composition) | `2o013g len=635291` | same |
| `PN._ki` keys | 40 | 41 (`KAKU_STROKES`) |
| `KAKU` | retired outline | `39gjb2 len=16856` |
| cells carrying `ki-kaku` among 426 icon, tile, slot, frame, pickup and arsenal cells (`seal3-lint-scan`) | 61 awakened tiles / 0 plain (rev 2.2) | awakened tiles 17 + 44 = 61, awakened frames 10, plain cells, slots, skills and pickups 0. Every seal's `d` is `PN._ki.KAKU`, every `fill-rule` is `nonzero` |
| `<text` / `font-family` / `AppleMyungjo` in those 426 cells | 0 / 0 / 0 | 0 / 0 / 0 |
| `--check` on the 426 cells in one call (`seal3-lint-all`) | — | ok |
| `AppleMyungjo` in the `k-icons.js` source as loaded (`seal3-probe-source`) | 1 (the rev 2.1 comment) | 0 |

Geometry (`seal3-probe-geom`): 58 pieces, all wound the same way (negative signed area in SVG coordinates, 0 positive); 1218 points; bbox 126.74–147.84 × 11.48–33.42; largest distance from (137, 23) 14.00; nearest approach to the ensō's inner edge 0.94 at (145.96, 33.2), the foot of stroke 20 (the ring is open at the upper right, −83° to −49°); ink 139.5 units² with nonzero fill, 115.6 if it were even-odd.

Renders (all `--check` ok; the review plates draw their numbers as seven-segment paths, no `<text>`): `seal3-order-x8` (each stroke in one of four colours, a white dot at its start and a dashed leader to its number outside the seal), `seal3-order-steps-x8` (20 cells, strokes 1…n − 1 grey, stroke n ink with a red start dot, the number under the cell), `seal3-final-x8` (rare and mythic cards), `seal3-final-glyph-x16`, `seal3-tiles-1x` / `-2x` / `-1x-gray` / `-2x-gray` (awakened needleStorm, chainSpark, executionMark, inkDarts, stormThread, meteorBrush, mythic blackSun at the bake's 150 tile), `seal3-sizes-22-32-45` (seal alone at em 22, 32 and 45 px, true pixels) and `-px8` (the same through the K9 1-px block filter, ×8).

## Self-checks (rev 2.4, 2026-10-27)

Same compositions, normalisers and probe as rev 2.3 (`rev24-hash-before`, `rev24-hash-after`). "Before" is the rev 2.3 tree after the main session deleted the retired outline's comment line; `rev24-hash-before` re-measured C5, C5 − three, the three icons, `keep-but-MR`, `all44-icons`, `shots264` and `KAKU`, and the other "before" values are the rev 2.3 measurements (a deleted comment line changes no output). `skillvfx-all` reads `1occir8 len=698430` in this working tree before and after this revision; other modules are being edited at the same time (the P2 follow-up review §3 saw the same value), and `k-skills-vfx.js` does not use `k-icons.js`, so it is not part of this proof.

| Check | Before rev 2.4 | After rev 2.4 |
|---|---|---|
| C5 − three, seal normalised (covers every icon, tile, slot and frame except frostLine, paperWard, recoveryThread) | `c604qa len=2165838` | **same** |
| C5 − three, raw (changes with `KAKU`) | `v977qq len=2571750` | `1xdl7jm len=2569470` |
| `frostLine` / `recoveryThread` (`skill` plain + awakened, ids normalised) | `1imzng8` / `1224g4p` | **same** |
| `paperWard` (same formula) | `9ep2si` | `18eps6a` (F3) |
| K9 C5 `icons-all`, raw / seal normalised | `87qgcg len=3105060` / `4q23nc len=2648409` | `1lhpyz4 len=3109103` / `ph7do8 len=2655017` (paperWard) |
| K9 `keep-but-MR` / `icons32` / `all44-icons`, seal normalised | `1ties3r` / `159p5qb` / `13n8k49` | **same** |
| K9 `volley-keep-v2` / `batch2-accepted` / `batch3-icons` / `n1-awakened`, seal normalised | `wby8ee` / `rrl5bv` / `uvtmhk` / `1k4npwd` | **same** |
| K9 `shots264` | `194b48x len=344617` | same |
| VFX + pickup (rev 2.3 composition) | `2o013g len=635291` | same |
| `KAKU` | `39gjb2 len=16856` | `w0b72m len=16761` (R4) |
| `PN._ki` keys | 41 | 41 |
| cells carrying `ki-kaku` among 426 cells (`rev24-lint-scan`) | awakened tiles 61, awakened frames 10, others 0 | same; every `d` is `PN._ki.KAKU`, every `fill-rule` `nonzero` |
| `<text` / `font-family` / `AppleMyungjo` in those cells; cyan in paperWard | 0 / 0 / 0; 0 | 0 / 0 / 0; 0 |
| loaded `k-icons.js` source: `AppleMyungjo` / `Myungjo` / `DELETE-BEFORE-COMMIT` | 0 / 0 / 0 | 0 / 0 / 0 (1304 lines) |
| `--check` on the 426 cells in one call (`rev24-lint-all`) | — | ok |

Geometry (`rev24-kaku-geom`): 58 pieces, all negative winding; 1210 points; bbox 126.57–147.81 × 11.44–33.47; largest distance from (137, 23) 13.87; nearest approach to the ensō's inner edge 0.80 at (146.14, 33.22), the foot of stroke 20; ink 161.8 units² (nonzero), 128.2 if even-odd. Plate distances: `paperWard` row above and rev 2.4 entry.

Renders (all `--check` ok): `rev24-paperward-x6` (plain and awakened icon), `rev24-plates-x16` (the two top plates), `rev24-paperward-gray-1x` and `-2x` (tile 150 and 220, plain and awakened, HUD slots 40 and 32 plain and awakened, grayscale), `rev24-kaku-x16`, `rev24-seal-x8` (rare and mythic), `rev24-order-steps-x8`, `rev24-tiles-1x` / `-2x` / `-1x-gray` / `-2x-gray` (the same seven awakened tiles as rev 2.3), `rev24-sizes-22-32-45` and `-px8`.
