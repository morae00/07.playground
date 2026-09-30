# Blackline remaster concept kit (shared)
- lib.js / hero.js / sprites.js / boss.js / board.js = winning proposal B's original SVG-generation code (READ-ONLY reference; namespace window.PN). Do not edit these files.
- Each asset agent writes ONE module file here with its own namespace, e.g. kit/k-hero.js -> window.PN.heroKit, k-enemies.js -> PN.enemies, k-bosses1.js -> PN.bossesA, k-bosses2.js -> PN.bossesB, k-icons.js -> PN.icons, k-env.js -> PN.env.
- Every exported function returns an SVG markup STRING (a <g>…</g> with its own <defs>), drawn in a documented LOCAL BOX with a documented PIVOT (= hitbox center). Callers position with transform="translate(x,y) scale(s)".
- All ids inside returned markup MUST be unique per call (use a module-level counter prefix like 'hk12_'), so many instances can be composed on one scene without clipPath/pattern collisions.
- Document every function + local box + pivot + intended in-game px size in kit/API-<module>.md.
- Load order for pages: lib.js, (hero.js sprites.js boss.js if needed), then k-*.js modules.
