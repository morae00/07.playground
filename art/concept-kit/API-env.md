# API-env — `PN.env` (kit/k-env.js) · rev 2

Chapter environments for 먹극화 · PAPER NOIR INK: ground, props/obstacles, landmarks, hazards, arena boundary.
Spec sources: style bible §3.3 (chapter palette), §4 (line), §5 (tone), §7.3 (sizes), §11 (environments), §12 (telegraph and ownership).
Sheet: `concept/out/chapters-env.png` (1600×1000, plus `@2x`). Source: `concept/work/env/sheet.html` (+ `sheet-a/b/c.js`).

## rev 2 changes (art-director rework) — the call signatures are unchanged
- **Every obstacle is squat.** The vertical front face is ≤ 0.45 × hero (`E.PROP_MAX`, ≈ 28.8 px). An `o.H` above 28 is clamped. The top-face depth adds depth, not height. Each call records its measured front-face height in `X.meta.H`, writes it to the wrapper as `data-h` / `data-hr` (ratio to the 64 px hero), and returns it from `PN.env.propMeta()`.
- **Redrawn kinds:** Ch2 `gate` (low rail), `glass` (4 leaded shards), `pillar` (fluted drum with a diagonal fracture); Ch3 `embank` (chipped coping, one missing block); Ch4 `clock` (low plinth with the dial in its top plane, plus the pendulum case lying flat), `hand` (low angle); Ch5 `stele` (toppled slab), `ring` (lying flat, hole shows the floor), `void` (low door frame with a torn-out upper part), `pillar` (obsidian stump). The Ch1 `pole`, Ch3 `sluice`/`bollard`/`reeds` and Ch4 `tomb`/`gears` were lowered.
- **Brush-pen outlines on every prop** (`E.brushOut`, see below). They replace the uniform round-join strokes.
- **Ground motifs are bigger, with no extra contrast.** The Ch2 rose-window pool spans about 0.9 × the patch, Ch3 has a real canal with stone curb strips, Ch4 has a dial ring of R ≥ 104 with all 12 numerals, and Ch5 has concentric bands around an off-patch centre plus a large torn rip.
- **Hazards:** `shock` uses the new `glyph.shatter` (a 5-spike comic impact burst). The `null` interior is a pure erased plane: its eraser crumbs sit outside the rim.
- **Landmarks:** Ch1 is a squat poster column with a round stone capital. Ch3 is a massive mitre sluice. The Ch5 glint is a single crescent. The features are shifted right so the St3/St7 name card overlaps floor only.

## Load order
```html
<script src="kit/lib.js"></script>        <!-- required: PN.defs (grain filter for sheets only) -->
<script src="kit/k-hero.js"></script>     <!-- optional: PN.heroKit.placeSprite for scale -->
<script src="kit/k-enemies.js"></script>  <!-- optional: PN.enemies.draw for value checks -->
<script src="kit/k-env.js"></script>
```
`sprites.js` is no longer used. `k-env.js` is built by concatenating `concept/work/env/parts/*.js` with `work/env/build.sh`, so edit the parts, not the built file. `work/env/nodecheck.js` renders every prop, hazard, landmark and boundary in node and fails on NaN.

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
    - `dialR`: default `max(104, 0.42·min(w,h))`. Draws the ring band, 60 ticks and 12 Roman numerals (`XII … XI`, 19 px, engraved).
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
- **Options:** `w`, `d`, `H` (clamped to ≤ 28), `seed`. Block kinds honour w/d/H; clustered kinds scale uniformly by `w / default`.
- **`PN.env.propMeta(ch, kind, o)`** returns `{ch, kind, name, H, ratio}`, where `ratio = H / 64`. The sheet tags print this value as `0.41×결`.

| ch | kind (alias) | default w×d | front H → ratio | read |
|---|---|---|---|---|
| 1 | `wall` (solid) | 150×40 | 26 → 0.41 | 금 간 회벽: posters 수배/pale, sepia notice on top, broken end with a black rubble core |
| 1 | `jars` | 92×60 | 28 → 0.44 | 먹통·항아리: onggi with straw rope, ink bucket, lidded jar |
| 1 | `cart` | 124×60 | 26 → 0.41 | 나무 수레: poster tubes on the bed, handles to −x (mirror with `scale(-1,1)`) |
| 1 | `pole` (pillar) | 34×34 | 26 → 0.41 | 전봇대 밑동: wrapped posters, splintered top, wire tie |
| 2 | `gate` (solid) | 150×22 | 26 → 0.41 | 쇠창살 칸막이: low rail (sill 8 + bars 15 + finials 3), see-through, chain and pewter lock |
| 2 | `glass` | 104×60 | 3 → 0.05 | 스테인드 조각: 4 angular shards lying flat, lead came, exactly one spot pane per shard |
| 2 | `pillar` (pillar) | 50×32 | 26 → 0.41 | 부러진 석주: fluted drum on a plinth, diagonal fracture, angular chunks |
| 3 | `embank` (solid) | 150×**16** | 26 → 0.41 | 운하 석축: 5 unequal chipped coping blocks with one missing (black gap), ashlar, moss, drip, ring. Top ≈ 38 % of height |
| 3 | `sluice` | 124×30 | 26 → 0.41 | 수문짝: planks, iron bands, crank wheel, chain |
| 3 | `reeds` | 60×28 | 28 → 0.44 | 갈대: **non-blocking** decor, sumi blades and cattails |
| 3 | `bollard` (pillar) | 28×28 | 24 → 0.38 | 계류 말뚝: tarred post, iron cap, rope coil |
| 4 | `clock` (solid) | **84×38** | 18 → 0.28 | 괘종 묘비: low plinth, dial inset on a brass (spot) plate in the top plane, pendulum case lying flat on the right |
| 4 | `gears` | 96×56 | 26 → 0.41 | 톱니 잔해: brass top gear, low standing gear, spring |
| 4 | `hand` | len 86, ground point (0,8) | 26 → 0.41 | 부러진 분침: driven in at a low angle toward the WNW, dotted ground shadow |
| 4 | `tomb` (pillar) | 40×25 | 27 → 0.42 | 문자판 묘비: small arched headstone, engraved dial |
| 5 | `stele` (solid) | 76×28 | 18 → 0.28 | 쓰러진 흑요 비석: left end sunk into the floor, right end propped on a rock; moonlit top plane, one wedge glint, inscription cartouche |
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
This function is unchanged. It draws the north edge strip; the edge line is `y = 0`, the outside is `y < 0` down to `−o.h` (default 74), and the lip reaches about `+14`. Rotate it for other edges.
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
| 1 | St3 | 찢어진 포스터 교차로 | Squat, wide poster column (R29, H44) on a plinth ring with a round stone capital (spot top). Torn posters curl off the silhouette, paste drips, a ring of fallen posters |
| 2 | St7 | 잠긴 장미창 | Rose window lying on the floor, sealed by a + of chains with a pewter lock |
| 3 | St3 | 분할 수문 | Massive mitre sluice: 2 timber-and-iron leaves in a V pointing upstream. The north leaf's downstream face is a black Mignola wedge; the south leaf's lit face carries ink drips. Spot walkway tops, stone piers with gear-wheel housings, chains, balance beams. Upstream water is piled higher (darker, 3 achromatic ripple rings) with spill jets downstream |
| 4 | St3 | 부러진 분침 다이얼 | Raised dial ring with a fallen, snapped brass minute hand |
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
- Unchanged: `E.ribbon`, `E.inkShape/inkSmooth/inkEll/inkLine/inkQ`, `E.cr`, `E.qs`, `E.jag`, `E.roundPath`, `E.sampleRound`, `E.hull`, `E.castPts`, `E.torn`, `E.gearPath`, `E.dial`, `E.ripple`, `E.engrave`, `E.poster`, `E.rubble`, `E.nail`, `E.crackWedge`, `E.voronoi` / `E.rectSlabs` / `E.polar` / `E.slabLayer`, `E.dotDefs`, `E.grainDef`, `E.roughDef`.

## Sheet composition notes (for scene artists)
- Every 1x patch contains the hero (`PN.heroKit.placeSprite('idle', 0, x, y, 1)`, where (x,y) is the hit-circle centre) and one `PN.enemies.draw(ch, role, {lod:'game'})` at `displayScale`, with the §5.6 knock-out halo.
  - Each enemy sits next to the darkest prop. In Ch5 the fox stands beside the obsidian stele.
  - The value contract is visible: the hero is lighter than the ground and the enemy darker. Obsidian props are told apart from enemies by their moonlit top planes, straight edges and lack of eyes.
- Label chips (`S.tag`) are placed only on clear floor. No chip covers a hazard circle's circumference or a prop silhouette.

## Performance
The output is authoring-grade SVG: thousands of dots and ribbons per panel. Bake it into chapter atlases or ImageBitmaps once at load (bible §7.2, §16.4); do not regenerate it per frame. Ground chunks are deterministic in `(ch, seed, ox, oy)`.
