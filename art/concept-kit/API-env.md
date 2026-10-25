# API-env — `PN.env` (kit/k-env.js) · rev 3

Chapter environments for 먹극화 · PAPER NOIR INK: ground, props/obstacles, landmarks, hazards, arena boundary.
Spec sources: style bible §3.3 (chapter palette), §4 (line), §5 (tone), §7.3 (sizes), §11 (environments), §12 (telegraph and ownership).
Sheet: `concept/out/chapters-env.png` (1600×1000, plus `@2x`). Source: `concept/work/env/sheet.html` (+ `sheet-a/b/c.js`).

## rev 3 changes (K5, 2026-10-03, brief `docs/art/briefs/env-tops.md`) — call signatures, keys, boxes and pivots are unchanged
- **Big solids get a dressed top.** `wall`, `gate`, `embank`, `clock` and `stele` pick a drawing by **tier** (`E.tier`, below). `base` keeps the rev 2 drawing; `mid` and `large` are new compositions (kind table). The bake keys `env/{ch}/solid{0,1,2}/0`, boxes, anchors and extraPad do not change.
- **No lettering anywhere.** `<text>` count over every prop, boundary, landmark and enemy state is 0 (was 77). `E.poster` lost `o.glyph` and gained `o.layout`; the Ch4 plaza dial uses engraved hour wedges instead of Roman numerals; the Ch1 pole, Ch4 clock ('時') and Ch5 stele (cartouche strokes) lost their glyph marks.
- **Ch4 `clock` base** closes the floor gap between plinth and case (the plinth runs to the case, `pw = w − cw − 1`; dial R 23.1 → 28 at 120×70) and carries a blank recessed name plate on its front.
- **Ch5 `stele` base** carries the erased (blank, recessed) inscription plate instead of the line cartouche with four strokes.
- **`X.meta`** now always records `tier` and `front` for the five solid kinds (see "meta" below).
- Outputs that must not move are pinned by the C8 hashes (below): every other kind, the base gate / embank, boundaries 2–5, landmarks 2/3/5, grounds 1/2/3/5 and all hazards are byte-identical to rev 2 after id normalisation.
- **rev 3.1 (K5 review 1, 2026-10-03)** — mid / large only: the Ch5 slab splits lean and bend (no cabinet-door read), its facets fan from a fracture origin, the small concentric arcs are gone, the erased plate is wide with a chamfered corner, chips sit only at split ends (F1); Ch2 large fills its left-middle (R1); Ch3 reed beds are 1.4× denser with staggered heights (R2); the Ch4 broken plate corner has a lit brass lip (R3). Base tiers and every C8-pinned output are unchanged. Post-K5 reference for the base outputs K5 changed: `k5-base-changed=1vxhszz` (1장 wall 120×70 · 70×132, 4장 clock 120×70, 5장 stele 120×70 · 76×28, 1장 pole) and `k5-lm14-b1=el1tx2` (landmarks 1·4, boundary 1), hashed like C8 but with only the `ev…_` prefix normalised.
- **rev 3.2 (kit audit P3-2, 2026-10-26)** — `E.resolveKind` only: `PN.env.prop(ch, '_alias')` no longer throws (see `PN.env.prop` below). No drawing changed.

### Tiers — `E.tier(w, d)`
| tier | rule | bake sizes that land here |
|---|---|---|
| `base` | `min(w, d) < 100` | 120×70, the pillars 70×132 (Ch1 `wall`), 104×30 (Ch2 `gate`), 76×28 (Ch5 `stele`), and every default size |
| `mid` | `100 ≤ min(w, d) < 160` | 200×130 |
| `large` | `min(w, d) ≥ 160` | 280×190 |

### meta (`E.lastMeta`, `PN.env.propMeta()`)
| field | meaning |
|---|---|
| `H` | height of the tallest drawn element above the floor point it stands on (≤ 28, `E.PROP_MAX`). Written to the wrapper as `data-h` / `data-hr` |
| `front` | height of the front (south) face |
| `tier` | `'base' | 'mid' | 'large'` (solid kinds) |
| `name` | Korean prop name |

Screen rule for every tier: nothing is painted above `y = −d/2 − 28` (outline tolerance 3 → `getBBox` top ≥ `−d/2 − 31`); left / right / bottom silhouette edges sit within ±3 of the footprint (only the lower-right cast shadow, small floor chips ≤ 20 and the Ch3 front ripples leave it).

## rev 2 changes (art-director rework) — the call signatures are unchanged
- **Every obstacle is squat.** The vertical front face is ≤ 0.45 × hero (`E.PROP_MAX`, ≈ 28.8 px). An `o.H` above 28 is clamped. The top-face depth adds depth, not height. Each call records its measured front-face height in `X.meta.H`, writes it to the wrapper as `data-h` / `data-hr` (ratio to the 64 px hero), and returns it from `PN.env.propMeta()`.
- **Redrawn kinds:** Ch2 `gate` (low rail), `glass` (4 leaded shards), `pillar` (fluted drum with a diagonal fracture); Ch3 `embank` (chipped coping, one missing block); Ch4 `clock` (low plinth with the dial in its top plane, plus the pendulum case lying flat), `hand` (low angle); Ch5 `stele` (toppled slab), `ring` (lying flat, hole shows the floor), `void` (low door frame with a torn-out upper part), `pillar` (obsidian stump). The Ch1 `pole`, Ch3 `sluice`/`bollard`/`reeds` and Ch4 `tomb`/`gears` were lowered.
- **Brush-pen outlines on every prop** (`E.brushOut`, see below). They replace the uniform round-join strokes.
- **Ground motifs are bigger, with no extra contrast.** The Ch2 rose-window pool spans about 0.9 × the patch, Ch3 has a real canal with stone curb strips, Ch4 has a dial ring of R ≥ 104 with 12 hour marks (rev 3: engraved wedges, no numerals), and Ch5 has concentric bands around an off-patch centre plus a large torn rip.
- **Hazards:** `shock` uses the new `glyph.shatter` (a 5-spike comic impact burst). The `null` interior is a pure erased plane: its eraser crumbs sit outside the rim.
- **Landmarks:** Ch1 is a squat poster column with a round stone capital. Ch3 is a massive mitre sluice. The Ch5 glint is a single crescent. The features are shifted right so the St3/St7 name card overlaps floor only.

## Load order
```html
<script src="kit/lib.js"></script>        <!-- required: PN.defs (grain filter for sheets only) -->
<script src="kit/k-hero.js"></script>     <!-- optional: PN.heroKit.placeSprite for scale -->
<script src="kit/k-enemies.js"></script>  <!-- optional: PN.enemies.draw for value checks -->
<script src="kit/k-env.js"></script>
```
`sprites.js` is no longer used. In this repository `k-env.js` is edited directly (the original `concept/work/env/parts` sources are not in the repo); check every change with `node scripts/art-review-sheet.mjs … --check` and the C5–C8 commands below.

## Conventions
- Every public function returns an SVG markup string: a `<g>` with its own `<defs>`. Each call gets a unique id prefix (`ev<n>_`). The full sheet has 735 ids, 0 duplicates and 0 broken `url(#)` references.
- Units are world units at 1x. Camera zoom 1.0 means 1 unit = 1 px, and the hero 결 is 64 px tall (`E.HERO_H`).
  - Place with `translate(x,y)`. Do not scale ground, props or hazards: the halftone pitch (5 px) and line weights are tuned for 1x.
  - At a non-1x zoom, resample the atlas once (bible §7.2).
- **Light is upper-left.** Cast shadows are 40 % ink dots toward the lower-right; the Ch3 landmark uses 60 %.
- **Line weights (§4):**
  - Outer silhouette: `E.brushOut`, 1.8 px on the light side → 3.5 px on the shadow side.
  - Top rim (the edge between top and front faces): `X.rim`, 2.2 px, tapered.
  - Interior joints: `X.line`, 1.5 px.
- **Tokens:** bible values, which override lib.js `PN.C`.
  - `PN.env.K` holds the neutrals and signals.
  - `PN.env.CH[1..5]` holds `{key, name, hanja, axis, light, base, deep, spot, spotName, mat}`.
- **Signal ownership** (auto-checked, 0 violations):
  - Amber and coral appear only in hostile hazards. Cyan appears only in `vortex` and `warning`.
  - Ground, props, landmarks and boundaries use no signal colour.
  - The spot colour is a flat fill on up-facing planes, never a ring or hatch.
  - No round highlights on dark props, so obstacles never read as eyes.

## `PN.env.ground(ch, w, h, seed = 1, o = {})`
- **Local box:** `(0,0)–(w,h)`, clipped to that box.
- **Layer:** bottom-most.
- **Seamless chunks:** slabs are hashed in world space, so pass `o.ox, o.oy` for each chunk's world offset. `o.tile: true` wraps the patch itself.
- **Slab layout by chapter:**
  - Ch1: rectilinear flagstones
  - Ch2: polar ribs around `o.center`
  - Ch3: long horizontal courses
  - Ch4: slabs rotated −15°
  - Ch5: faceted obsidian Voronoi
- **Contrast** (`work/env/lum.py`, ground layer of the sheet patches):

  | | Ch1 | Ch2 | Ch3 | Ch4 | Ch5 |
  |---|---|---|---|---|---|
  | darkest marks vs median | 1.35 | 1.34 | 1.33 | 1.30 | 1.28 |
  | lightest vs median | 1.09 | 1.32 | 1.28 | 1.19 | 1.24 |
  | median Y | .406 | .398 | .422 | .412 | .381 |

  Every median is inside the 0.38–0.45 band. Paper grain is applied at α 0.055.
- **Options:**
  - All chapters:
    - `decals:false` turns off all decals.
    - `center:[x,y]` sets the plaza centre for Ch2/4 (default: the patch centre); `null` disables it.
  - Ch1:
    - `drainY` (a number, or `false`)
    - `posters:[[x,y,w,h,angle]]`
    - `puddle:[x,y,r]`
  - Ch2:
    - `rose:[x,y,R]`: the rose-window pool. The tracery shadow is 40 % ground-tone dots and the glass petals are lighter duotone. The default is `[w/2, 0.62h, 0.46·min(w,h)]`; `null` turns it off.
    - `wax:[[x,y]]`
  - Ch3:
    - `canalY` (or `false`)
    - `canalH`: the half-height, default **40**, so the channel is 80 px.
    - `highlight:false` removes the single white glint.
    - The canal is a flat wash with no slab joints. It has a 9 px curb-stone strip on both banks: a joint line in `deep` at α .55 plus a 3 px spot-free lip. Four long, broken flow lines end in curls.
  - Ch4:
    - `dialR`: default `max(104, 0.42·min(w,h))`. Draws the ring band, 60 ticks and 12 engraved hour **wedges** on radius `R − 15`, all pointing at the centre (rev 3; was Roman numerals in a system font): plain hours 10 × 4.4, 3·6·9 1.6× longer and 1.5× wider (16 × 6.6), 12 a broad triangle pointing inward (16 × 14). Fill `mix(base, deep, .6)` with the `E.engrave` groove + lit lip. Only drawn when the patch has a centre (`center` / plaza); game ground tiles pass `center: null` and never take this path.
    - `gears:[[x,y,r,teeth]]`
  - Ch5:
    - `ringC:[x,y]`: the centre of the concentric bands, which may sit off-patch. It falls back to `center`.
    - `rings:[r…]`: band radii (default `[ringR, 0.56·ringR]`).
    - `gaps:[[x,y,w,h,angle]]`: torn paper rips in `env.ch5.light`, harmless.
    - `sheens:[[x,y]]`

## `PN.env.prop(ch, kind, o = {})`
- **Pivot `(0,0)`** is the footprint centre, which is the collision rect centre.
- **Footprint:** `(−w/2, −d/2)–(w/2, d/2)`. The top face is the footprint shifted up by `H`. The front face runs from `d/2 − H` to `d/2`. The shadow extends about `+0.62H` right and `+0.3H` down.
  - Round props (jars, pole, pillar, ring, bollard) foreshorten their top ellipse (`ry ≈ 0.42–0.6 r`).
- **Engine mapping:** for `Obstacle {x, y, w, h, kind}`, draw at `translate(x + w/2, y + h/2)` and pass `{w, d: h}`.
  - `kind: 'solid'` and `kind: 'pillar'` are per-chapter aliases.
  - An unknown kind falls back to the chapter's first kind (`E.resolveKind`).
  - rev 3.2 (2026-10-26, kit audit P3-2): `E.resolveKind` takes a kind only when the registry entry is a drawing function (`typeof … === 'function'`). `'_alias'` (the alias table kept in the same registry) used to resolve to itself and throw `E.props[ch][k] is not a function`; it now falls back like any unknown kind (`prop(1, '_alias')` draws the chapter's first kind). Every other output is byte-identical: K5 pins `k5-base=h2fdeo k5-big=1csj4l7 k5-enemy=mz083l`, C8 `env-unchanged=1ynqlwt enemy-unchanged=jqtira ch4-cleanup=q7pyz9`, and all registry kinds and aliases of chapters 1–5 (default and seed 3, plus `E.lastMeta`) hash the same before and after (`1le8yaf len=754652`).
- **Options:** `w`, `d`, `H` (clamped to ≤ 28), `seed`. Block kinds honour w/d/H; clustered kinds scale uniformly by `w / default`.
- **`PN.env.propMeta(ch, kind, o)`** returns `{ch, kind, name, H, ratio}` plus `front` and `tier` for the solid kinds, where `ratio = H / 64`. The sheet tags print this value as `0.41×결`.

| ch | kind (alias) | default w×d | front H → ratio | read |
|---|---|---|---|---|
| 1 | `wall` (solid) · base | 150×40 | 26 → 0.41 | 금 간 회벽: posters (`portrait` print / pale), sepia notice on top, broken end with a black rubble core |
| 1 | `wall` · mid / large | 200×130 / 280×190 | 26 → 0.41 (front 26) | **벽보 담장 빈터**: plaster wall ring (thickness 12 / 14) round a sunken lot; the cap ring is the rail (light, irregular joints 28–48, 2–3 chips, one section broken down by 7 with a black rubble core — north notch or an inner crater on the east / west cap, never a through gap). North inner face: 2–3 / 3–5 posters (≤ 19, one half-fallen with a curl), nails, crack wedge, ink run. Floor (base/deep mix) with 40 % inner shadow bands (north 11, west 20): jar pile (onggi R15/19, small jar R8/10, fallen ink bucket R11/14 lying with its mouth to the lower-right) and the ink it spilled (9-point fan, never an ellipse, 4–8 % of the floor), 2–3 / 3–4 tied manuscript bundles, 2 / 3 floor posters, wall-foot chips; large adds the hand cart (scale 0.65, right-back) and a fallen-plaster heap ≈ 40×20. South front: 3 / 4 posters, crack wedge, nails, the east-end rubble core. Seeds vary the pile's u (±0.08), the broken-cap side, poster order and bundle count |
| 1 | `jars` | 92×60 | 28 → 0.44 | 먹통·항아리: onggi with straw rope, ink bucket, lidded jar |
| 1 | `cart` | 124×60 | 26 → 0.41 | 나무 수레: poster tubes on the bed, handles to −x (mirror with `scale(-1,1)`) |
| 1 | `pole` (pillar) | 34×34 | 26 → 0.41 | 전봇대 밑동: wrapped posters, splintered top, wire tie |
| 2 | `gate` (solid) · base | 150×22 | 26 → 0.41 | 쇠창살 칸막이: low rail (sill 8 + bars 15 + finials 3), see-through, chain and pewter lock (unchanged; the gate-leaf finials still reach 29.5 — brief Q6, next pass) |
| 2 | `gate` · mid / large | 200×130 / 280×190 | 26 → 0.41 (front 8) | **철책 제단**: stone dais 8 (light top with 8 radial joints from (0, −0.05d) and two open arcs — no closed circle; sill front with the right black wedge). North / south railings are bar rows at plane y ±(d/2 − 4) (pitch 11, rails at 0.82 / 0.28 of the bars, every finial tip ≤ z 26), the side railings ONE iron rail (w 3, ink + ink5) at x ±(w/2 − 4) between stone posts (11×12, 24 tall; 4 corners, large +2 side-middle). The south railing carries the chained gate leaf (x −18…18, hinge bars, chain, pewter padlock). Each railing casts one 40 % band (north on the dais, south on the floor). On the dais: altar stone 68×36 / 95×53 × 10 with a broken NE corner and a candlestick (≤ 8), a fallen bell (focus: iron ink7, ink5 lit band, crack, the inside only a thin ink crescent; 24 / 30 long), a toppled pew (backrest flat, seat on edge 9, legs at uneven spacing; large has a second, shorter pew), 2 fallen candlesticks, wax 6 / 8 drops, 2 / 5 glass shards (one spot pane each, H 3; the large's 5th shard and a 3-drop wax cluster fill the left-middle — K5 review R1), impact cracks under the bell. Seeds vary only angles (pew −8…−14°, bell ±4.6°, candlesticks ±11°) and the spoke jitter |
| 2 | `glass` | 104×60 | 3 → 0.05 | 스테인드 조각: 4 angular shards lying flat, lead came, exactly one spot pane per shard |
| 2 | `pillar` (pillar) | 50×32 | 26 → 0.41 | 부러진 석주: fluted drum on a plinth, diagonal fracture, angular chunks |
| 3 | `embank` (solid) · base | 150×**16** | 26 → 0.41 | 운하 석축: 5 unequal chipped coping blocks with one missing (black gap), ashlar, moss, drip, ring. Top ≈ 38 % of height (unchanged; brief Q4) |
| 3 | `embank` · mid / large | 200×130 / 280×190 | 26 → 0.41 (front 26) | **갈대 둑**: coping ring (t 10 / 12, top z 26) in the base coping grammar on all four sides (18–44 blocks, alternating light tones, 1.5 ink line each, chipped corners; one missing block on the north, large may lose one on the east; moss on a joint, one wet glint). The bank inside has settled to z 10: north inner face 16 (shade, joints, ink runs), wet earth `mix(base, deep, .5)` with 40 % shadow bands (north 8, west 14), moss, cracks, one ragged puddle (10–18 %, never an ellipse, two ripple arcs, one glint ≤ 6×2). Reed beds: big ones under the north coping and along the west (78×25 / 116×38, 26×72 / 38×110), small ones (2 / 4, width 24–34) in front and at the east, ≈ ⅔ of each bed's blades in front ink; blade count ≈ 1.4 × (0.7·width + 0.4·depth), capped 112 (K5 review R2), heights staggered — ⅓ tall 13.5–16, ⅔ short 9.5–13 (tips ≤ z 26, inside the footprint), back blades `mix(deep, ink7, .6)` 2.6, front ink9 3.0–3.4, 1–3 cattails per bed. The half-sunk boat (focus; 50×18 / 70×24, bow to the lower-right, ink7 hull, ink5 lit gunwale, deep plank seams, two thwarts, a broken-plank black gap, stern in the mud). Front: coping lip, two ashlar courses, shade, water band, drips, mooring ring, ripples on the floor |
| 3 | `sluice` | 124×30 | 26 → 0.41 | 수문짝: planks, iron bands, crank wheel, chain |
| 3 | `reeds` | 60×28 | 28 → 0.44 | 갈대: **non-blocking** decor, sumi blades and cattails |
| 3 | `bollard` (pillar) | 28×28 | 24 → 0.38 | 계류 말뚝: tarred post, iron cap, rope coil |
| 4 | `clock` (solid) · base | **84×38** | 18 → 0.28 | 괘종 묘비: low plinth, dial inset on a brass (spot) plate in the top plane, pendulum case lying flat on the right. rev 3: the plinth runs up to the case (`pw = w − cw − 1`, no floor gap inside the footprint; the plinth casts no extra shadow onto the case), and the front carries a blank recessed name plate (`E.plaque`, 0.22·pw × ≤ 7) instead of '時' |
| 4 | `clock` · mid / large | 200×130 / 280×190 | 26 → 0.41 (front 18) | **문자판 받침**: plinth 18 over the whole footprint. Square brass plate (spot flat fill, side 2R + 2·round(0.18R) = 102 / 148, lit bevel top + left) round the dial (`E.dial`, R = round(0.33d) = 43 / 63, centre plane (x0 + 0.4w, 0)); the plate's lower-right corner is broken open 0.35R deep (ink hole, ink5 gear arcs, no light circles) with a lit brass lip `mix(spot, light, .35)` 1.2 along the broken edge, so it reads as a broken plate, not an ink blot (K5 review R3). Pendulum case lying on the plinth (x 56–94 / 78–134, ±54.6 / ±79.8, +8 → z 26; window 0.5 × 0.7 of the case, angular brass bob). Snapped minute-hand fragment (0.9R × 0.14R, spot + ink rim, ≤ 2 thick) between plate and case. 2 / 3 flat gears (r 10–16, 4 thick, one brass face, ink axle holes). Front: groove, right black wedge, blank recessed plate 0.22w × 9 at u 0.3. Seeds vary the gear rotations, the fragment angle (±4°) and the dial crack |
| 4 | `gears` | 96×56 | 26 → 0.41 | 톱니 잔해: brass top gear, low standing gear, spring |
| 4 | `hand` | len 86, ground point (0,8) | 26 → 0.41 | 부러진 분침: driven in at a low angle toward the WNW, dotted ground shadow |
| 4 | `tomb` (pillar) | 40×25 | 27 → 0.42 | 문자판 묘비: small arched headstone, engraved dial |
| 5 | `stele` (solid) · base | 76×28 | 18 → 0.28 | 쓰러진 흑요 비석: left end sunk into the floor, right end propped on a rock; moonlit top plane, one wedge glint; rev 3: the erased inscription plate (`E.erasedPlate`, blank, ≤ 12 % of the top) replaces the line cartouche and its four strokes |
| 5 | `stele` · mid / large | 200×130 / 280×190 | 21 → 0.33 (front 8–18) | **갈라진 흑요 석판** (K5 F1 revision): sunk end raised to 8, raised end 18 (back-right 19); corners BL x0+2, BR/FR x1−3. **Leaning, non-parallel splits** into 2 / 3 pieces, each bending ONCE at v .40–.60 (kink .12–.18u off its chord, so every half has |Δu/Δv| ≥ .118 and no run is straight): mid back u .38 → front .57; large A back .30 → front .43, B back .73 → front .59 (opposite leans, slope difference .27; both bends to the same side, so the pair never mirrors into a vase); whole split ±.04 by seed, 6–9 jagged nodes. The gap shows `void.paper` (3–6 visible between the outlines), the dark wall gets 3 ink wedges, the lit wall only its line. Each piece tilts 0 / 1.5 (0 / 1.6 / 0.8) at its back edge. Tops `mix(ob, ink3, .55)` with 3–5 conchoidal facets per piece **fanning out from a fracture origin on the split** (v .38–.58): tip toward the origin, bowed side away, screen w:h .7–1.8 (box ≈ (.28–.45)·piece width × (.10–.18)·d), direction / size / aspect / tone different for neighbours (t .28 / .38 / .62 / .75). No concentric arcs. ONE moon glint (first piece, back-left edge, bounded by the split). A **wide erased plate** on the piece that is widest at v .42–.64: 60 % of that width, screen w:h ≈ 1.8 (height .16–.26 d), centred at v .53, back-right corner chamfered 12 %, ≥ 20 % of the width away from both splits. Obsidian chips (≤ 6) only at split ends (v .07–.24 or .77–.91), one side per split, never a facing pair: mid 2, large 3–4. Front `mix(ob, ink3, .35)`, black wedge only on the right 20 %; black underside gap + prop rock under the raised end. `meta.H` = 21 (back edge + tilt) |
| 5 | `ring` | 76 × (76·0.6) ellipse | 11 → 0.17 | 일식 고리: stone ring lying flat; the far inner wall is a black crescent (the eclipse) and floor shows through the hole; heaved slabs on the front-right |
| 5 | `void` | 56×8 (threshold 7 deep) | 28 → 0.44 | 오려진 공백: two jambs, lintel, threshold. A diagonal tear removes the upper-right; inside the frame silhouette and doorway is blank `paper.50` with ghost pencil lines |
| 5 | `pillar` | 36×22 on a 46×30 plinth | 24 → 0.38 | 관문 석주 밑동: obsidian block with a snapped top, carved band, single wedge glint |

`PN.env.props[ch][kind](X, o)` is the raw registry. Use `PN.env.prop` so ids, defs and `meta` are handled for you.

## `PN.env.hazard(kind, stage = 'static', o = {})`
- **Pivot `(0,0)`.** The circle of radius `o.r` (default 60) is exactly the hit radius. Decorations reach `r + 11` (imminent ticks). `null` crumbs sit at `r·1.1–1.16`.
- **Stages:**
  - `static`
  - `preview` (0–65 %, `o.p` = progress)
  - `imminent` (65–100 %: hatch doubles, 5 px border, 8/12 ticks)
  - `active` (coral α .55, ink halftone rim)
  - `decay` (dry ink stain)
- **Kinds:**
  - `water` (neutral ink wash, never cyan)
  - `slow` (`ch:4` gives the tick dial)
  - `root`
  - `null`: a pure `void.paper` plane with no interior marks, an amber dotted rim and a ⊘ glyph. `active` adds a 1.5 px coral ring.
  - `trap`: `ch:1` rat plate, `ch:2` chain snare, `ch:4` saw gear
  - `fire`
  - `shock`: 3-stage telegraph with the **shatter burst**
  - `vortex` (ally)
  - `warning` (ally)
  - `tele` (glyph-less enemy circle)
- **Helpers** (`PN.env.hz`): `tele`, `sand`, `stitch`, `brushHead`, `needleHead`, `stain`, `edgeDots`, `glyph.{wave, chain, nul, flame, crack, shatter, bone, star}`.
  - `glyph.shatter(g, col, core)` is a 5-spike irregular burst: ink.900 2 px outline, signal fill, paper.50 core, 3 crack cuts. Keep `g ≤ 0.35r`.
- `PN.env.hazard.kinds` and `PN.env.hazard.owner` are unchanged.

## `PN.env.boundary(ch, w = 300, o = {})`
It draws the north edge strip; the edge line is `y = 0`, the outside is `y < 0` down to `−o.h` (default 74), and the lip reaches about `+14`. Rotate it for other edges. rev 3: the Ch1 strip's first poster is a `'portrait'` print instead of the '禁' glyph (it repeats along all four world edges); Ch2–5 are byte-identical.
- Ch1: rolled paper edge over an ink-bled wall
- Ch2: iron railing
- Ch3: wet curb over deep ink water
- Ch4: half-buried gear fence
- Ch5: white void

## `PN.env.landmark(ch, o = {})`
- **Vignette box:** `(0,0)–(o.w = 280, o.h = 150)`, clipped, with its own ground, at about 0.8×. The feature sits right of centre (about `0.58–0.66 w`), so a name card at the bottom-left `(4, 124)` covers only floor.
- `PN.env.landmarkInfo[ch]` gives `{stage, name, note, alt}`.

| ch | stage | name | vignette |
|---|---|---|---|
| 1 | St3 | 찢어진 포스터 교차로 | Squat, wide poster column (R29, H44) on a plinth ring with a round stone capital (spot top). Torn posters curl off the silhouette, paste drips, a ring of fallen posters. rev 3: the column posters cycle `portrait / print / blank / print / portrait / blank / print` (no lettering; was 수배·禁·失·墨·尋) and the paste drips sit under them |
| 2 | St7 | 잠긴 장미창 | Rose window lying on the floor, sealed by a + of chains with a pewter lock |
| 3 | St3 | 분할 수문 | Massive mitre sluice: 2 timber-and-iron leaves in a V pointing upstream. The north leaf's downstream face is a black Mignola wedge; the south leaf's lit face carries ink drips. Spot walkway tops, stone piers with gear-wheel housings, chains, balance beams. Upstream water is piled higher (darker, 3 achromatic ripple rings) with spill jets downstream |
| 4 | St3 | 부러진 분침 다이얼 | Raised dial ring with a fallen, snapped brass minute hand. rev 3: the hour marks under it are engraved wedges (ground layer), not numerals |
| 5 | St7 | 갈라진 개기 | Obsidian disc split in two with blank paper in the gap. One crescent moon-glint, no parallel strokes |

Alternate stages are not drawn yet: Ch1 St7 잉크 봉쇄선, Ch2 St3 리브 신랑, Ch3 St7 범람 수문 분지, Ch4 St7 톱니 납골당, Ch5 St3 반영의 고리.

## Lower-level helpers
- **`E.brushOut(pts, {w=2.5, gaps=1, strokes, smooth, dense, r, color, taper=7})`:** brush-pen silhouette.
  - Weight follows the outward normal: shadow side (lower-right) ×1.4, light side ×0.72.
  - The loop is split into 2–3 open strokes whose ends taper to a point. Breaks sit only on the upper-left light side (`gaps` real gaps plus overlapping joins); the lowest (footprint) edge is never broken.
  - `dense: true` means `pts` are already samples.
- **`E.ctx(ch, seed)` → `X`:**
  - `X.out(pts, w, o)` / `X.outSm` wrap `brushOut`.
  - `X.rim(x0,y0,x1,y1,w=2.2)` draws the top-rim edge; `X.line(pts, 1.5)` draws joints.
  - Also `X.face`, `X.faceD`, `X.clipped`, `X.shadow`, `X.wrap`, and `X.meta` (set `{H, name}`).
- **`E.block(X, x, y, w, d, H, o)`:** 3/4 block with sharp corners by default. It returns `{s, top, front, sil, x0, x1, yT0, yT1, yB, outline(w)}`.
- **`E.cylSil(cx, R, ry, yTop, yBase)`:** dense cylinder silhouette samples, for `brushOut`.
- **`E.ringBand(c, cx, cy, r0, r1, fill)`:** engraved low-contrast ring channel.
- **`E.dripStain(x, y, len, c, w)`:** ink running down a front face.
- **`E.roseLight(c, x, y, R, p)`:** rose-window light pool.
- **`E.poster(X, cx, cy, w, h, a, o)` (rev 3):** torn paper piece. `o.tone` `'paper' | 'pale' | 'spot'`, `o.dots` (`'d20'` …), `o.curl`, `o.amp`. **`o.glyph` is removed** (no lettering). `o.layout`:
  - `'print'` (default): block top-left + 3 left-aligned lines of falling length — byte-identical to rev 2.
  - `'portrait'`: wanted poster — block u −0.30…0.30 × v −0.40…0.10, lines at v 0.24 (to u 0.24) and v 0.36 (to u 0.02), left edge u −0.30.
  - `'blank'`: no print, the lower 35 % torn away (ragged). Its tear uses a local rng, so `X.rnd` advances exactly as for `'print'`.
  - Vocabulary rules (brief §1.6): one solid ink block (never a hollow box or a box with bars), 2–4 left-aligned lines of different length with the last one shortest, torn edges, 20 % dot stains, nails, curls. Never rings, crosses, `ㅁ/口/日/回`, equal stacked bars (`二/三/≡`), equal vertical bars (`I/II/III`) or paired V's.
- **`E.tier(w, d)`:** `'base' | 'mid' | 'large'` (table above).
- **`E.plaque(x0, y0, x1, y1, fill, shade, lip, sw = 1.5, lw = 0.8)`:** recessed blank name plate — filled face, inner shade on the top + left edges, light lip on the bottom + right. Used by the Ch4 `clock` fronts.
- **`E.erasedPlate(q, u0, v0, u1, v1, ob, cut = 0)`:** erased inscription on an obsidian plane mapped by `q(u, v)` (u along the slab, v toward the back = up): fill `mix(ob, ink3, .62)`, shade ink7 1.5 (top + left), lip `mix(ob, ink3, .75)` 0.8 (bottom + right), nothing inside. `cut` (fraction of the plate width) chamfers the back-right corner at 45° on screen; `0` (the base stele) is the plain four-corner plate, byte-identical to rev 3. Used by every `stele` tier (big tiers pass `cut .12`).
- Internal (not exported): the Ch4 `flatGear(…, th, inkHub)` gained an opt-in `inkHub` (ink axle hole; default output unchanged), and per-chapter builders `wallBig` / `gateBig` / `embankBig` / `clockBig` / `steleBig` with their parts (bundle copy, fallen bucket, spill, plaster heap, railing row, post, altar, fallen bell, pew, candlestick, glass shard, reed bed, sunk boat, puddle).
- Unchanged: `E.ribbon`, `E.inkShape/inkSmooth/inkEll/inkLine/inkQ`, `E.cr`, `E.qs`, `E.jag`, `E.roundPath`, `E.sampleRound`, `E.hull`, `E.castPts`, `E.torn`, `E.gearPath`, `E.dial`, `E.ripple`, `E.engrave`, `E.rubble`, `E.nail`, `E.crackWedge`, `E.block`, `E.brushOut`, `E.ctx`, `E.voronoi` / `E.rectSlabs` / `E.polar` / `E.slabLayer`, `E.dotDefs`, `E.grainDef`, `E.roughDef`.

## Sheet composition notes (for scene artists)
- Every 1x patch contains the hero (`PN.heroKit.placeSprite('idle', 0, x, y, 1)`, where (x,y) is the hit-circle centre) and one `PN.enemies.draw(ch, role, {lod:'game'})` at `displayScale`, with the §5.6 knock-out halo.
  - Each enemy sits next to the darkest prop. In Ch5 the fox stands beside the obsidian stele.
  - The value contract is visible: the hero is lighter than the ground and the enemy darker. Obsidian props are told apart from enemies by their moonlit top planes, straight edges and lack of eyes.
- Label chips (`S.tag`) are placed only on clear floor. No chip covers a hazard circle's circumference or a prop silhouette.

## Performance
The output is authoring-grade SVG: thousands of dots and ribbons per panel. Bake it into chapter atlases or ImageBitmaps once at load (bible §7.2, §16.4); do not regenerate it per frame. Ground chunks are deterministic in `(ch, seed, ox, oy)`. The big solids are the heaviest props (reed beds and railings are many ribbons); they are baked once per chapter like everything else.

## Self-checks (rev 3, brief §7; run from the repo root, read the PNG)
Expected: C5 `text=0`, C6 `signal=0`, C7 15 × `ok`, C8 `env-unchanged=1ynqlwt enemy-unchanged=jqtira ch4-cleanup=q7pyz9` (len 1367228/2437538/299961).
- **C5 lettering** (`text=0`):
```
node scripts/art-review-sheet.mjs expr --name k5-c5-text --scale 1 --crop 0,0,1900,40 --expr '(function(){var E=PN.env,S=[[120,70],[200,130],[280,190]],P={1:["wall",[["pole",34,34],["jars",92,60],["cart",124,60],["wall",70,132]]],2:["gate",[["pillar",50,32],["pillar",76,49],["gate",104,30],["pillar",66,42]]],3:["embank",[["bollard",28,28],["bollard",40,40],["sluice",124,30],["sluice",170,54]]],4:["clock",[["tomb",40,25],["tomb",56,35],["gears",96,56],["tomb",66,41]]],5:["stele",[["pillar",46,30],["pillar",60,39],["stele",76,28],["pillar",92,60]]]},out=[],tot=0;function cnt(n,m){var c=(m.match(/<text/g)||[]).length;tot+=c;if(c)out.push(n+"="+c);}for(var ch=1;ch<=5;ch++){S.forEach(function(s,i){cnt("s"+ch+"-"+s[0],E.prop(ch,P[ch][0],{w:s[0],d:s[1],seed:i+1}));});P[ch][1].forEach(function(p,i){cnt("p"+ch+"-"+p[0]+p[1],E.prop(ch,p[0],{w:p[1],d:p[2],seed:i+1}));});cnt("b"+ch,E.boundary(ch,300));cnt("lm"+ch,E.landmark(ch));cnt("lmw"+ch,E.landmark(ch,{w:480,h:270}));["stalker","charger","shooter","warden"].forEach(function(r){["art","game"].forEach(function(l){["idle","windup","hit"].forEach(function(st){cnt("e"+ch+r+"-"+l+"-"+st,PN.enemies.draw(ch,r,{lod:l,state:st}));});});});}return "<rect width=\"1900\" height=\"40\" fill=\"#fff\"/><text x=\"4\" y=\"26\" font-size=\"15\" font-family=\"monospace\">text="+tot+" "+out.join(" ")+"</text>";})()'
```
- **C6 signal colours** (`signal=0`):
```
node scripts/art-review-sheet.mjs expr --name k5-c6-signal --scale 1 --crop 0,0,1400,40 --expr '(function(){var E=PN.env,S=[[120,70],[200,130],[280,190]],K={1:"wall",2:"gate",3:"embank",4:"clock",5:"stele"},R=/#(00a8c6|007c94|cff6ff|ef5b4f|b8352b|d88d16|805ad5|86b82d|fff0c9|ffe4df)/gi,out=[],tot=0;function cnt(n,m){var c=(m.match(R)||[]).length;tot+=c;if(c)out.push(n+"="+c);}for(var ch=1;ch<=5;ch++){S.forEach(function(s,i){cnt("s"+ch+"-"+s[0],E.prop(ch,K[ch],{w:s[0],d:s[1],seed:i+1}));});cnt("b"+ch,E.boundary(ch,300));cnt("lm"+ch,E.landmark(ch));}return "<rect width=\"1400\" height=\"40\" fill=\"#fff\"/><text x=\"4\" y=\"26\" font-size=\"15\" font-family=\"monospace\">signal="+tot+" "+out.join(" ")+"</text>";})()'
```
- **C7 height / tier / range** (15 × `ok`; `getBBox` ignores clipping, so never draw past a face and rely on its clip):
```
node scripts/art-review-sheet.mjs expr --name k5-c7-meta --scale 1 --crop 0,0,1700,130 --expr '(function(){var E=PN.env,S=[[120,70],[200,130],[280,190]],K={1:"wall",2:"gate",3:"embank",4:"clock",5:"stele"},L=[];function bb(m){var s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.innerHTML=m;document.body.appendChild(s);var b=s.getBBox();s.remove();return [Math.round(b.x),Math.round(b.y),Math.round(b.x+b.width),Math.round(b.y+b.height)];}for(var ch=1;ch<=5;ch++){var r="ch"+ch+" ";S.forEach(function(s,i){var o={w:s[0],d:s[1],seed:i+1},m=E.prop(ch,K[ch],o),M=E.lastMeta,b=bb(m),ok=b[0]>=-s[0]/2-45&&b[2]<=s[0]/2+65&&b[1]>=-s[1]/2-31&&b[3]<=s[1]/2+55&&M.H<=28;r+=s[0]+"x"+s[1]+" H="+M.H+" tier="+M.tier+" bbox="+b.join(",")+(ok?" ok":" FAIL")+" | ";});L.push(r);}return "<rect width=\"1700\" height=\"130\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(20+i*22)+"\" font-size=\"14\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```
- **C8 frozen outputs** (id prefixes, duplicate attributes and tag-end spaces normalised): the exact command is in the brief `docs/art/briefs/env-tops.md` §7 C8; the values above must not move unless a later brief says so.
