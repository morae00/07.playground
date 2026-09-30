# API — `k-bosses1.js` · `PN.bossesA` (라운드 보스 A) — rev 2

잉크 도살자 `butcher` (Ch1 St5 · dash) · 종탑 간수 `gaoler` (Ch1 St10 · rings) · 용광의 입 `maw` (Ch2 St10 · flame).
먹극화 · PAPER NOIR INK. Style bible §4 (lines), §5 (shading), §7.3 (size), §10.1/§10.3 (bosses), §12.2/§12.4 (telegraphs and bullets).

**rev 2 (art-director rework).** The three bodies are redrawn. The calls, box, pivot, feet, hit radius and `gameScale` are unchanged, so existing scene code keeps working. What changed:
- Anchors moved: `face`, `muzzle` and `head` in `META` (see the table below).
- New anchors: `META.butcher.fist` and `META.gaoler.grip`.
- New option: `haloW`.
- New helper: `PN.bossesA.hitCircle()`.
- Visual extents changed (see the table).

## Load order
```html
<script src="kit/lib.js"></script>          <!-- PN.C, PN.taper, PN.halftone, PN.splat, PN.rng (required) -->
<script src="kit/sprites.js"></script>      <!-- only if you also place PN.heroSprite -->
<script src="kit/k-bosses1.js"></script>    <!-- this module -->
```
The module has no DOM access and uses only string building, so it also runs in Node with `global.window = {}`.
It does **not** need `PN.defs()`. Each call emits its own `<defs>` (patterns, clipPaths, filters) with a per-call id prefix (`bA<n>_`, and `bT<n>_` for telegraphs).

Verified in rev 2 with one page holding:
- all 72 draw variants (3 ids × 3 phases × windup × enraged × 2 LODs)
- 3 silhouettes
- every telegraph kind and stage
- the three `hitCircle` parts

Result: 2763 ids, 0 duplicates, 0 dangling `url(#…)`.

The source lives in `concept/work/bosses1/src/*.js` and is concatenated by `concept/work/bosses1/build.sh`. Do not hand-edit the kit copy.

## `PN.bossesA.draw(id, opts) → string`
Returns `<g class="bossA bossA-<id>"><defs>…</defs>shadow · ground · body · fx</g>`.

| opt | default | meaning |
|---|---|---|
| `phase` | `1` | `1` \| `2` \| `3`. Damage is cumulative (P3 includes P2 marks). |
| `windup` | `false` | Windup pose (telegraph stage 1). It is a **separate drawing**, not a transform of idle (bible §15: windup is designed bigger and first), plus the amber `!` and pose FX. |
| `enraged` | `false` | Ink flame, white-hot eyes, and a **coral outline pulse 2px** sandwiched in ink (filter). This is the only coral on an enemy body. |
| `lod` | `'art'` | `'art'`: key-art weights, 5-unit halftone pitch, lettering. `'game'`: outline ×1.55 (about 4px at 156px), brush ×1.35, **halftone pitch 8** (3.2px at 1x), tiny details dropped (sign lettering becomes a glyph mark; 유곽 nipples and stamp text are dropped). |
| `halo` | `null` | `true` = knock-out halo in the chapter `env.base` colour (§5-6). A colour string gives a custom colour. |
| `haloW` | auto | **new**. Halo dilate radius in local units. Default: game 3.8 (= 1.5px at 0.4), art 3. Sheets use 2.6–2.8 at art scale 1.1–1.4 (about 3–4px). |
| `silhouette` | `false` | Flat `ink` silhouette (no shadow/ground/fx). Use it for 32/48px silhouette tests. |
| `shadow` | `true` | Ground shadow = hit display ellipse |
| `fx` | `true` | Windup `!`, scrape marks, soot plumes, enrage flames, P3 eave drips (gaoler) |
| `seed` | `3` | Turbulence seed for the brush wobble (the wobble is lighter in rev 2: art 1.5, game 1.0) |

### Local box, pivot, display size (identical for all three)
| key | value |
|---|---|
| local box | **400 × 400**, all bosses **face RIGHT**. Flip: `translate(x+400·s, y) scale(-s, s)`. No self-rotation (§7.1). |
| pivot (hit centre) | **(200, 257)** |
| hit radius | r54 world → **135 local** |
| feet | **y = 392** (pivot + r). Boots, clogs, fists and the key bit all stand on it. |
| ground shadow | ellipse centre (200, 331) = pivot + 0.55r, rx 135 / ry 55 (= hit diameter 108 × 44 px) |
| `gameScale` | **0.4**. Figure ≈ 156 px tall, width ≤ 160 px (1440×900, zoom 1.0) |
| place at world (wx, wy) | `translate(wx − 200·0.4, wy − 257·0.4) scale(0.4)` |

### Measured visual extents (pixel bbox, art LOD, local units)
| variant | x | y | width → px at 0.4 |
|---|---|---|---|
| butcher idle | 34 … 402 | 50 … 392 (drips 406) | 368 → 147 |
| butcher windup | 10 … 402 | 6 … 406 (effort lines, scrape decal) | 392 → 157 |
| gaoler idle | 4 … 400 | −20 … 392 (hem drips 414) | 396 → 158 |
| gaoler windup | 4 … 388 | **−132** (raised key bow) … 414 | 384 → 154 |
| maw idle | 22 … 384 | 12 pipes / −82 soot … 404 | 362 → 145 |

Atlas cells should pad about 140 units on top for gaoler windup and maw soot. Everything above the hit circle is "visual only" (§7.3).

### Per-boss anchors (`PN.bossesA.META[id]`)
| id | name | face (weak point / reticle) | muzzle (attack source) | head (`!` / status icon, bottom-centre) | extra | windup |
|---|---|---|---|---|---|---|
| `butcher` | 잉크 도살자 · INK BUTCHER | (271, 150) paper-bag eye hole | (358, 321) sign-board cleaver | (270, 46) clear of hump + bag | `fist` (340, 262) | 0.62 s |
| `gaoler` | 종탑 간수 · BELFRY GAOLER | (235, 132) keyhole eye (bell tilted 8°) | (210, 121) bell body = ripple / ring origin | (200, 0) above the bell loop | `grip` (286, 248) gauntlet on staff | 0.6 s |
| `maw` | 용광의 입 · FURNACE MAW | (206, 244) two eyes in the firebox | (206, 284) firebox mouth | (206, 104) over the finial | | 0.6 s |

`META[id]` also carries `chapter, stage, pattern, env` (chapter palette `{light, base, deep, spot}`), `box, pivot, feet, r, gameScale`.

### Rig and states (cut-out parts, §10.4)
Shared construction is in `src/00-core.js`:
- `X.limb(p0, p1, r0, r1)` builds a capsule limb with designed planes: an ink.500 lit crescent with a notched terminator on the key-light side, 60% dots and then a solid black spot on the underside, an ink.300 dry-brush rim, and a tapered shadow-side contour. `brk0`/`brk1` add 2px ink.300 break lines so limbs never merge with the torso.
- `X.C` lays tapered **shadow-side contour** strokes on the lower-right outlines. They swell mid-stroke, which gives the §4 +40% weight.
- `X.R` draws the ink.300 top-left rims.

**butcher.** Hunched 3/4 stance. The torso pitches forward about 15°, and a pointed trapezius hump rises behind a paper-bag head sunk to shoulder height.
- Parts:
  - bowed ink.700 trousers with a knee break, a stitched knee patch, and clogs with ink.500 toe caps
  - torso with a hump lit crescent (zigzag terminator), scapula plane, pec wedge and fat-fold highlights
  - apron waist strap and back-hip knife roll
  - far arm (upper arm, rolled cuff, forearm, clenched fist) holding the chain and meat hook
  - far shoulder cap
  - ink-soaked leather apron (ink.300 under 40% dots) with a black zigzag hem, belly crescent and running splash
  - paper-bag head
  - near shoulder cap and upper arm with a cuff
  - near forearm
  - sign-board cleaver in the fist
- The cleaver (`A.butcherCleaver`, frame: handle axis x = 0):
  - blade: 58×86 paper.300 slab under 40% dots with 정육점 lettering
  - edge: ink.300 steel strip (14% of the width) riveted with 4 paper.50 dots
  - handle: wrapped, with a ring pommel and a riveted ferrule
  - idle pose: tilted 17° off vertical
- The fist (`A.butcherFist`) has 4 ink.500 finger wedges with a 1.5px paper.300 rim, and a thumb over the top.
- Windup:
  - rigid upper body `translate(10,18) rotate(11 200 320)` (shoulders dropped, chest forward)
  - crouch-lunge legs redrawn
  - near arm swung back, and the cleaver **dragging on the ground behind him** (tip near (150,395), opposite the lane)
  - 3-stroke scrape decal with paper sparks
  - far arm swung out, effort lines, `!`
- P2: the apron is torn (ragged paper edge and flap), and the cleaver gets a paper crack.
- P3: the bag is half torn away, revealing an ink void with one big eye and heavier drips.
- Enraged: ink steam from the top of the bag.

**gaoler.** 범종 head tilted 8° toward facing.
- 당좌 medallion: a **true keyhole** (round top plus tapering slot, 3px ink frame, paper.50 inner rim, eye in the round part, 3 dripping light slivers).
- Tiled eave cape with **3 풍경 on visible cords**, hung from the two upturned tips and the front-left corner. Each has a bronze cup, a clapper, and a paper fish about 30 local long.
- Chest cage, belt with the key ring on the left hip.
- Lantern arm: comes from under the left eave, and the gauntlet fist holds a paper lantern at hip height. Inside is a **folded-paper bird** (head, beak, tail, 2 wing folds, paper.50 with 1.5px ink).
- Tower-key staff (`A.gaolerKey`, frame: grip at 0,0):
  - crosses the body diagonally (idle rotation 19°: pagoda bow upper-right, stepped 3-tooth ward bit at the lower-left, 72 of 364 shaft = 20%)
  - an ink.300 gap outline separates it from the robe
  - gripped at chest height by `A.gaolerGauntlet` (plated back, thumb, 3 finger wedges)
- Windup: forearm raised, grip (318,150), staff `rotate(-8)`, bow high over the bell, dashed strike arc, `!`.
- P2: bell crack, and the left 풍경 swings and rings (sound arcs, plus 「딩—」 in art LOD).
- P3:
  - cage door hangs open on its hinge, padlock swinging, soul core exposed (paper.300)
  - second bell crack plus a **chip knocked out of the bell lip**
  - ink drips (ink.900 teardrops with a 1px ink.300 rim) off the eave tips and hem
- Enraged: black flame in the lantern.

**maw.** Cast-iron stove idol. The face is frontal. One stovepipe arm is planted on clenched iron knuckles (4 blocky fingers plus a thumb block, `A.mawFist`). The other is lifted with a bent elbow in a **rivet collar**.
- Belly:
  - designed ink.500 lit crescent with a notched terminator
  - ink.500 dot band under the collar
  - plate seams curving round the volume, riveted along the curve
- Firebox: a **gothic pointed-arch frame** with a keystone, a lit inner bevel and a double-edge break line, plus grille teeth.
- Organ pipes: **V-cut organ mouths** (ink.500 V lip over a black slot, lip plate below).
- Soot = `A.mawSoot`: 1–3 tapered **dry-brush plumes** per pipe (flat ink.300, ragged turbulence edge) bending right, away from the key light, then a 20% dot tail.
- Windup: amber pre-heat inside the firebox with a paper ember bed, heat squiggles, `!`.
- P2: belly-plate crack and one snapped pipe.
- P3: left plate torn off (ember lattice), grille teeth broken, bleed drips.
- Enraged: black flames on all 5 pipes and the mouth, enlarged eyes.

### Ownership rules followed
- Bodies stay ink.900/700/500. Material patches (apron, key bit, sign board under dots) stay ≤ ink.300.
- Ink drips always run **down**.
- No cyan, violet or lime anywhere.
- Amber appears only in windup (`!`, pre-heat) and telegraphs.
- Coral appears only when enraged and on bullets / active zones.

## `PN.bossesA.hitCircle(opts) → string` (new)
The dashed hit circle in the **same local box as `draw`** (centre (200,257), r 135 = r54 world): paper.50 dashes over an ink.900 underlay.

| opt | default | meaning |
|---|---|---|
| `part` | `'full'` | `'full'`, `'back'` (upper half, emit **before** `draw`), or `'front'` (lower half, emit **after** `draw`, so feet sit on the circle bottom) |
| `px` | 1 | Local units per screen px (`1/scale`), so `w` and `dash` are in screen px |
| `w` | 1.2 | paper stroke width (px). The ink underlay is w + 2 px. |
| `dash` | `[3,3]` | dasharray (px) |
| `alpha` | 0.85 | group opacity |

Example (156px in-game dev overlay): `B.draw('gaoler',{lod:'game'}) + B.hitCircle({px: 2.5})` inside the same `scale(0.4)` group.

## `PN.bossesA.telegraph(kind, opts) → string`
Unchanged from rev 1. These are ground-plane telegraphs in the **same local units as `draw`** (1 world unit = 2.5 local), centred on (0,0). Place them with the same `scale(0.4)` as the boss, translated to the pivot / zone centre, and draw them *under* the boss.

| kind | opts | drawing (bible §12.2) |
|---|---|---|
| `dashLane` | `len=700, w=70, fan=150, stage, progress` | Lane along +x. The end fans to ±`fan` (3.8× homing). preview: dotted ink rim, solid part = `progress`, teardrop brush head, sparse amber hatch (2px/10px). imminent: hatch 5px pitch, 5px rim, chevrons. Use `w = 135` for the r54 body. |
| `dashTrail` | `len, w` | Dry-ink trail decal after the dash (3 s) |
| `tollRing` | `r=150, band=34, stage, progress` | Amber hatched annulus under the gaoler during windup (+12 ticks when imminent) |
| `ripple` | `r0=170, r1=420, n=3` | 담묵 concentric ripples that precede the ring shots |
| `ringShots` | `n=22, r=300, size=17, phase` | Bullets on a ring (see `bullet`) |
| `fireZone` | `r=130, stage: preview\|imminent\|active\|decal` | preview/imminent: hatched circle, coral core, ink flame symbol, 8 ticks. active: coral α0.55, ink-dot edge, black flames with paper cores, coral core. decal: harmless ink.300 soot. |

`PN.bossesA.bullet(x, y, r, angle)` draws an enemy bullet: ink-ball core, coral rim, ink outline, paper glint and a coral speed tail (§12.4). Use `r ≥ 18` local (≥ 14 px at 1x).

## Sheet
`concept/out/boss-sheet-1.png` (1600×1000) is built from `concept/work/bosses1/sheet.html`.

| file | contents |
|---|---|
| `sheet-a.js` | Hero panels (art scale 1.4 / 1.12 / 1.24), halo 2.6–2.8, dashed hit circle split back/front, title plates |
| `sheet-b.js` | Insets, phase strip with hit circles drawn **on top**, silhouettes on measured fixed slots (48px row, 50px enrage row), BEFORE header |
| `sheet-c.js` | Callouts in negative space, leaders ending on part edges |

The BEFORE crops are CSS `background-position` at 0.36 into `analysis/visuals-current-entity-sheet.png`: the whole polygon token plus its red dashed hit circle, with labels below the boxes. rev 1 is preserved in `concept/work/bosses1-v1/`.
