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
- Sources are split under `work/icons/src/01…10-*.js`; `work/icons/build.sh` concatenates them into `kit/k-icons.js`. Edit the parts, not the built file. `09-sil.js` holds the Ch1 role silhouettes baked from `k-enemies.js` (no runtime dependency on that module).
- **Rev 2 (AD rework):** every signature below is unchanged; new options are additive (`kill/decal {role}`, `telegraph {flash}`, `skill {pitchFor}`) and there is one new function (`PN.icons.hudSlot`).

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
| frostLine | 백묵 절단 | rare | active | a chalk stick has cut a black mass in two; white gash with cyan core, chalk dust |
| orbitScythes | 초승 궤도 | epic | active | 3/4 top-down gat at the centre (paper brim disc + crown with ink shadow wedge); two 낫 with wrapped handles at 10 and 4 o'clock on a tilted orbit that breaks outside the black disc; trailing motion arcs; cyan inner edge on the front sickle |
| boneMortar | 골분 박격 | epic | active | solid ink.900 onggi (ink.500 lit face upper-left, paper knock-out halo, paper cloth cap) with a paper crossed-bones label, falling on a paper burst; cyan stitched landing ring |
| railSpear | 흑선 레일 | legendary | active | heavy black spear (shaft 8, head ≈ 30, paper bevel facet) with a cyan core, riding a flat ink.100 rail band between two ruled lines + one rivet-dot row; runs a ghoul through a paper burst |
| mirrorClone | 거울 분신 | legendary | active | two true side profiles of 결 facing each other across a cracked mirror: gat from the side (flat lens brim, tapered crown + band), one brush contour brow→nose→lips→chin, eye glint dot under the diagonal brim shadow, right-cheek scar, scarf knot, hair tail. Lines ≥ 4 (shadow side 5.4). Cyan running stitch on the right copy only. Brims ≥ 6 px inside the window |
| voidMine | 무음 지뢰 | epic | active | spiked ink-swirl disc sunk in the ground, swallowed sound arcs; cyan stitched ring |
| blackSun | 검은 태양 | mythic | active | black disc, white corona, alley roofs; cyan diamond-ring glint |
| eclipseStep | 일식 보법 | mythic | active | the verb dominates: one heavy diagonal paper brush slash (lower-left → upper-right) with a cyan rim; small eclipse disc (r 25 ≈ 40 % of the window) behind; three 짚신 sole prints with crescent shadows stepping beside it (ink.300 → 500 → 900) |
| ironFrame | 철골 프레임 | common | passive | riveted girder-lattice heater shield |
| magnetSigil | 수거 자석 | common | passive | horseshoe with nail holes and a paper talisman pulling 엽전 on field lines |
| paperWard | 종이 갑주 | rare | passive | lamellar cuirass of folded paper scales; loose plates lifting off |
| recoveryThread | 회복 실 | rare | passive | spool feeds ink thread through a needle that is mid-stitch; a torn paper patch with a black gash cross-stitched shut (no ring) |
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
- `awakened:true` adds ink-bleed blots with drips along the border and a `覺` seal: paper disc r 18 with an ink ensō ring and a 24-unit glyph at (137, 23), fully inside the card corner (glyph ≥ 9 px at 0.4 display). The seal is drawn last so the popped-out art never covers it. **Knots keep the skill's own rarity** (see delta below).
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
