# Quality gates

## Required on every change

- `npm test`
- `npm run test:coverage:core` (90% line and branch minimum)
- `npm run build`
- three-way bundle budget from `config/bundle-baseline.json` (policy version 2, see below)
- no production developer controls or forbidden debug markers
- no new TypeScript errors

Update `config/bundle-baseline.json` only when promoting a reviewed release, and keep its byte count equal to the attached bundle budget report. Updating the baseline merely to make a pull request pass is not allowed.

### Bundle budget policy (version 2, 2026-09-30)

`npm run verify:bundle` measures `dist/` in three groups:

| Group | Measure | Warning | Fail |
|---|---|---|---|
| App JS (every non-vendor chunk: `assets/index-*.js` and the lazy `App-*.js`) | gzip, against the recorded app baseline | +15% | +25% |
| Vendor JS (`assets/vendor-*.js`, split by `vite.config.ts`) | gzip, against the recorded vendor baseline | +15% | +60% or 96 KiB, whichever is lower |
| CSS | gzip | 32 KiB | 48 KiB |
| Initial assets (images, audio, fonts, and data outside `assets/packs/`: the string tables, the content tables, the atlas manifest, the boss titles; keyed UI art sheets, which load only where a cell shows, are built under `assets/packs/ui/`) | raw bytes | 3 MiB | 4 MiB |
| Installed assets (everything outside JS/CSS, including chapter packs) | raw bytes | 200 MiB | 250 MiB |

Chapter packs (`assets/packs/<chapter>/`) have a 12 MiB per-pack target and resident textures a 96 MiB target; both are checked at runtime by the renderer spike, not by this script. Only the common pack and the pack of the chapter on screen stay resident (ART-07). The v2 baseline was first recorded before R0 fixes on commit 174eb99 (app 53,565 B, vendor 60,279 B). It then moved to the R0 milestone (60,407 B on 0e53a01). It then moved to an R1 interim point, 75,381 B measured on b762892. It then sat at an R3 interim point, 92,420 B measured on 912414e (after CON-04), approved by the user on 2026-10-01. It now sits at 96,803 B: on 2026-10-12 the user chose to move it by exactly what the R5 features they asked for added (4,383 B) instead of downloading terser; awaiting team review. `docs/decisions/TEC-05-app-js-baseline.md` lists what every commit since R0 cost and what the team needs to confirm. A baseline change needs the budget report, the reason, and review in the same change.

## Balance

`npm run test:balance:smoke` is a deterministic pressure smoke test, not a difficulty verdict. `npm run test:balance:pilot` checks representative chapter boundaries and boss stages. A release candidate uses `npm run test:balance:full` across all 50 stages, four build policies, and ten fixed seeds. Three policies are representative builds whose permanent upgrades grow by chapter. The fourth, `fresh`, is a new player with no upgrades or passives (CON-09). Seed shards run through a bounded worker pool, then merge in canonical stage/persona/seed order. The JSON report records clear/death/timeout rates, simulated and wall-clock time percentiles, death causes (contact, shot, boss contact, boss shot, shock, fire, each marked when the boss was enraged), economy percentiles, build growth, scenario details, and a deterministic fingerprint.

The remaster baseline is `artifacts/balance-remaster-baseline.json`: 2,000 scenarios under the remaster rules on commit 216de64, after the R5 features and their tuning (fingerprint 33f84fc7a300e1c4; the R5 runs are below). Before it came 2ec7493 (R4 interim, cda5998b1edf8203) and 3171af0 (R3 end, 25cd131c5d4ca2aa). Earlier full runs used the same seeds and personas:

| | bf13b46 (CON-09) | 565e8b2 (SYS-03) | 73d367c (SYS-02, SYS-04) | bf4d474 (boss fixes) | f05b83e (R1 end) | 3d0c5d3 (R2 end) | 3171af0 (R3 end) |
|---|---:|---:|---:|---:|---:|---:|---:|
| clear, all 2,000 | 52.0% | 51.2% | 39.6% | 40.0% | 41.1% | 42.0% | 29.2% |
| clears: striker / survivor / collector / fresh (of 500) | 299 / 456 / 284 / 0 | 294 / 466 / 264 / 0 | 220 / 410 / 162 / 0 | 224 / 416 / 159 / 0 | 221 / 444 / 157 / 0 | 225 / 456 / 159 / 0 | 136 / 362 / 86 / 1 |
| clear by chapter without fresh, Ch1 / 2 / 3 / 4 / 5 (%) | 23.3 / 59.0 / 72.3 / 91.7 / 100.0 | 27.3 / 54.3 / 69.3 / 90.7 / 99.7 | 23.7 / 41.7 / 43.3 / 70.3 / 85.0 | 24.0 / 46.0 / 42.7 / 70.3 / 83.3 | 28.0 / 49.0 / 47.7 / 66.7 / 82.7 | 30.3 / 49.7 / 48.3 / 69.7 / 82.0 | 30.3 / 47.0 / 30.3 / 39.7 / 47.3 |
| timeouts (20 min of play) | 0 | 0 | 2 | 1 | 2 | 3 | 1 |
| deaths: contact / shots / boss | 923 / 9 / 29 | 934 / 7 / 33 | 1120 / 57 / 21 | 1118 / 50 / 25 | 1085 / 59 / 27 | 1071 / 57 / 25 | 1323 / 48 / 39 |
| boss stages without fresh, clear time p50 / max (s) | 199 / 1155 | 184 / 755 | 249 / 751 | 252 / 927 | 222 / 1001 | 251 / 1098 | 256 / 689 |
| fresh in 1-1, death p50 (s) | 45 | 67 | 72 | 72 | 65 | 66 | 71 |

Findings:

- Without `fresh`, clear rates rise with the chapter. The chapter growth modelled for upgrades outpaces the difficulty growth. SYS-02 (enemy roles) and SYS-04 (boss moves, stepped enrage) made Ch2 to Ch5 harder and flattened that curve; Ch1 stayed near 24%. Shot deaths rose from 7 to 50, because shooters lead their aim now. This is input for SYS-07.
- Boss fights got longer, and at 73d367c two never ended. A crowd at the enemy cap shoved the boss away from the player (fixed in 83c3294), and Ch3 and Ch5 bosses anchored in place although their phase grammars are not built yet (fixed in bf4d474).
- One fight still times out: 2-10 survivor, seed 211531, boss at 13% health after 20 minutes. The stepped enrage (SYS-04) stops at damage x2.0, so a tank build that keeps moving is never forced to end the fight. The 0.1.0 enrage (x4.5 and a silence field) was a hard stop. Decision D-02 (2026-10-02) added the overtime rule after the last enrage step (`enrageOvertime`); before it, this is why `noTimeouts` failed. `personaClearsObserved` fails because `fresh` clears 0 of 500.
- R1 end (f05b83e): clears 41.1%. Ch1 to Ch3 rose 3 to 5 points. The only rule changes since bf4d474 are FX-02 and ART-05, and the pilots below put the gain on FX-02: per-hit hit-stop had taken players' acting time. Ch4 and Ch5 moved within noise. The chapter curve is still inverted (Ch1 28% to Ch5 83%), which SYS-07 owns. `fresh` still clears 0 of 500.
- Two fights time out, both `survivor` in a final boss stage, and the boss keeps almost all its health: 2-10 seed 211531 at 99% (13% at bf4d474) and 5-10 seed 1510177 at 97%.
  - The persona's fixed square walk gets pinned against the arena's top edge.
  - The crowd sits at its 150 cap, so a mob is always nearer than the boss, and auto-aim, which takes the nearest target, never picks the boss.
  - Without per-hit hit-stop (FX-02), the walk and the boss's following repeat exactly every 70 s, so nothing breaks the loop. The uneven slow-downs of per-hit hit-stop likely broke it at bf4d474.
  - A player walks to the boss, so this is a persona artifact. It still shows that a boss can go unhurt for a whole fight, which led to the overtime rule above (D-02); a boss-priority rule for auto-aim was the other option.
- R2 end (3d0c5d3): clears 41.1% to 42.0%. The rule changes since f05b83e are SYS-06 cover, the SYS-05 phase moves of the Ch2-5 final bosses, and the Ch2-5 kit footprints (ART-07, ART-08). Ch1 rose 2.3 points and Ch4 3.0 points. Ch2, Ch3, and Ch5 moved within noise. The chapter curve is still inverted (Ch1 30% to Ch5 82%), for SYS-07. `fresh` still clears 0 of 500.
- Boss fights got longer: clear time p50 222 to 251 s, max 1,001 to 1,098 s. The Ch2-5 final bosses now run their phase moves.
- Three fights time out. Two are the survivor pin above: 2-10 at 99% (base seed 17) and 5-10 at 98% (base seed 524287).
- The third is new and is not a persona artifact: 5-10 striker, base seed 997, boss at 41% after 20 minutes. It cleared in 146 s at f05b83e.
  - The Ch5 final boss's phase 2 (silence balance) anchors where the phase began.
  - The striker was pinned at the top edge about 2,100 away. The boss never came to it and took no damage for the last 13 minutes, and enrage step 4 does nothing at that range.
  - A player who runs away gets the same stalemate. The next SYS-05 commit gives anchored bosses a leash.
- `fresh` walks a fixed square and runs into enemies, so it says little about a new player. The opt-in `novice` persona (`BALANCE_FULL_PERSONAS=novice`) has the same fresh meta but steers away from nearby threats with the analog stick every 0.1 s, circling instead of backing into walls. On bf4d474:
  - 1-1, 20 seeds: 50% clear (fresh 0 of 10) and 70% survive 3 minutes.
  - Ch1, 10 seeds each: 1-1 4/10, 1-2 3/10, 1-3 4/10, 1-4 4/10, 1-5 4/10, 1-6 2/10, 1-7 1/10, 1-8 1/10, 1-9 4/10, 1-10 1/10. Later stages are harder because the novice keeps the fresh meta throughout.
  - Contact still causes nearly every death.
- R3 end (3171af0): clears 42.0% to 29.2%. R3 changed seeded outcomes with SYS-07's difficulty curve, CON-03's objectives, SYS-09's pickups, SYS-10's elites, and the endless rotation (CON-08, infinite only). The inverted chapter curve is gone: Ch1 30%, then 47 / 30 / 40 / 47%, where R2 rose to 82% in Ch5. The R3 exit gates hold on this run:
  - normal stage clears by chapter for the three team personas, Ch1 / 2 / 3 / 4 / 5: 30.0 / 45.4 / 31.7 / 37.5 / 41.2%; adjacent steps +15.4 / -13.7 / +5.8 / +3.8 points (gate ±25);
  - hits that dealt the minimum 1: 0.1% of 160,066 team hits (gate 20%);
  - `maxed` in all ten Ch5 stages × 10 seeds: 72% clears, lowest health median 0.54 (gate 0.70), minimum hits 0%;
  - the `novice` in 1-1 × 20 seeds: 50% clears (gate 40-70%). `fresh`, the fixed square walk with no upgrades, clears 1 of 500 (1-9).
- One fight times out: the known survivor pin at 5-10 (base seed 524287, boss at 98%). The 5-10 striker stalemate of R2 is gone (1ad7113).
- Some stages fall far below their chapter. The team personas clear 4-3 at 3%, 3-9 at 7%, 4-8 and 5-9 at 13%, and `maxed` clears 5-7 at 10% and 5-8 at 40%. A flag A/B on 4-3, 3-9, and 4-8 (the same 30 runs each) puts the causes apart:

| | 4-3 (giants, landmark) | 3-9 (traps) | 4-8 (traps) |
|---|---:|---:|---:|
| remaster rules | 3% | 7% | 13% |
| without stage objectives | 40% | 10% | 23% |
| without the difficulty curve | 17% | 17% | 43% |
| without elites | 10% | 13% | 10% |

  - 4-3 is the giants objective: 15 more points of large enemies (Ch4's wardens carry shields, SYS-02) on a landmark stage. The traps stages late in a chapter double the terrain, and Ch5's null zones become slows at 42% speed: 5-7 starts with 27 slow zones and 13 fires among the densest landmark's 39 obstacles (5-6 has 14, 6, and 22), and a survivor there spent 63 of its 132 s slowed.
  - The options were a smaller tier shift for giants from Ch3, no giants or traps on landmark stages, or a lower terrain multiplier where the chapter's hazards slow. The team kept the stages as they are, as hurdle stages, since the chapter gates hold (decision D-01, 2026-10-02).

R4 interim (2ec7493: the decisions D-02, D-04, D-05, and D-09 on; the later UI-08 and TEC-09 commits leave every gameplay fingerprint unchanged), 2,000 scenarios in 66 minutes on 6 workers. This run is the new remaster baseline (`artifacts/balance-remaster-baseline.json`, fingerprint cda5998b1edf8203):
- Clears 29.2% to 28.6%, by chapter 28 / 44 / 33 / 40 / 46%. D-02's enrage overtime ends every fight: no timeouts (one at R3's end), though the longest boss clear grew from 689 s to 993 s.
- The R3 gates hold:
  - normal stage clears by chapter for the team personas: 28.3 / 41.7 / 33.3 / 36.7 / 39.2%; adjacent steps +13.3 / -8.3 / +3.3 / +2.5 points (gate ±25). D-09's Ch3-4 step (+29 in its pilot) is +3.3 here;
  - minimum hits: 0.1% of 160,321 team hits (gate 20%);
  - `maxed` in Ch5: 68% clears (72% before), lowest health median 0.39 (gate 0.70);
  - the `novice` in 1-1: 40% clears (gate 40-70%), at the band's floor: 8 of 20 runs against 10 at R3's end, within the noise of 20 runs. Its death median is 193 s.
    A wider sample settles it (f2f1a94, 100 seeds, the same rules): 61 of 100 clear, 95% Wilson interval 51-70%, inside the band; 76% survive 3 minutes (the CON-02 target is 80%), and every death is contact (death median 144 s).
- The hurdle stages stay low as D-01 accepted: the team personas clear 4-8 at 3%, 3-9 at 7%, and 4-3 and 4-9 at 13%; `maxed` clears 5-7 at 20%.

R5 (the user's request of 2026-10-12: much tougher bosses, above all in the infinite run's first 25 minutes; far more monsters; bombers whose dodging decides clears; five times the weapons; characters). The rules are `bossToughness` (SYS-12), `horde` (SYS-13), `bombers` (SYS-14), `arsenal` (SYS-15), and `characters` (CON-10). Full runs on the same 2,000 scenarios, 10 workers, about 65 minutes each:

| | 2ec7493 (R4 interim) | f99baae (R5 features) | 216de64 (R5 tuned, the baseline) |
|---|---:|---:|---:|
| clear, all 2,000 | 28.6% | 40.0% | 25.1% |
| clears: striker / survivor / collector / fresh (of 500) | 122 / 365 / 85 / 0 | 227 / 443 / 131 / 0 | 109 / 339 / 53 / 0 |
| team normal stage clears by chapter (%) | 28.3 / 41.7 / 33.3 / 36.7 / 39.2 | 28.8 / 42.1 / 49.6 / 64.6 / 69.6 | 22.5 / 35.4 / 30.0 / 38.8 / 37.5 |
| team boss stage clears by chapter (%) | 28.3 / 51.7 / 31.7 / 53.3 / 71.7 | 28.3 / 73.3 / 51.7 / 80.0 / 83.3 | 15.0 / 35.0 / 20.0 / 48.3 / 60.0 |
| hits at the minimum (team) | 0.06% | 7.2% | 3.0% |
| deaths: contact / shots / boss / blast | 1,329 / 59 / 36 / 0 | 1,019 / 10 / 50 / 117 | 1,283 / 28 / 71 / 113 |
| boss stage clear time p50 / max (s) | 206 / 993 | 242 / 1,005 | 366 / 990 |
| team level at a clear, median by chapter | 15 / 17 / 21 / 26 / 28 | 19 / 23 / 29 / 31 / 33 | 16 / 21 / 26 / 27 / 29 |
| timeouts | 0 | 0 | 0 |

- The features alone made the campaign easier, and the later chapters most: the inverted curve came back. Two causes:
  - The horde cut each enemy's damage to 0.6 before the flat defence, so once the personas' defence grew, its hits fell to the damage floor.
  - A big crowd dies faster than it comes, about three kills a minute for every one before, so 0.55 of the rewards paid 1.5-2 times the XP and 2-3 times the coins per minute. Stages ended about 5 levels higher.
- The tuning:
  - ef388ec (SYS-13) scales an ordinary enemy's hit after defence and pays 0.4 of the XP and 0.35 of the coins. The infinite run takes its own shares, hits 0.35 and rewards 0.55: at 0.6 a half-upgraded build died at a median 8 minutes (6 seeds), at 0.45 9, at 0.35 14.
  - 8b5280c and 216de64 (SYS-12) give boss stage bosses their chapter's factor: 1.6 times the health and 1.2 times the damage in Ch1, 1.8 and 1.35 in Ch2, 2 and 1.5 from Ch3. With 1.6 and 1.2 everywhere the boss stages stayed easier than at R4. With 2 and 1.5 everywhere the Ch1 final boss stopped every team run, and the novice cleared 1-10 in 1 of 20 runs (4 of 20 now, 10 of 20 with the R5 rules off).
- Pilot sets for the tuning (25 stages, the first five seeds, the team personas, 375 runs):

| | R4 interim | f99baae | hits after defence | + rewards 0.4 / 0.35 | + bosses 2 / 1.5 |
|---|---:|---:|---:|---:|---:|
| clear | 41.6% | 58.1% | 47.2% | 37.6% | 34.7% |
| normal clears by chapter (%) | 33 / 51 / 29 / 49 / 36 | 31 / 51 / 47 / 73 / 73 | 29 / 47 / 38 / 56 / 47 | 22 / 47 / 31 / 47 / 40 | 22 / 47 / 31 / 47 / 40 |
| boss clears by chapter (%) | 27 / 47 / 23 / 57 / 70 | 30 / 73 / 47 / 83 / 80 | 23 / 57 / 43 / 70 / 73 | 13 / 27 / 27 / 57 / 67 | 13 / 20 / 17 / 47 / 57 |
| novice 1-1 (20 seeds) | 8 of 20 | | 16 of 20 | 14 of 20 | 14 of 20 |
| maxed Ch5: clears, lowest health p50 | 68%, 0.39 | | 81%, 0.65 | 69%, 0.43 | 69%, 0.43 |

- The R3 gates on 216de64:
  - normal stage clears by chapter for the team personas, adjacent steps +12.9 / -5.4 / +8.8 / -1.2 points (gate ±25);
  - minimum hits: 3.0% of 243,694 team hits (gate 20%);
  - `maxed` in all ten Ch5 stages × 10 seeds: 69% clears, lowest health median 0.43 (gate 0.70), minimum hits 3.2%;
  - the `novice` in 1-1 × 100 seeds (1-100): 55 clear, 95% Wilson interval 45-64%, inside the 40-70% band. 66% survive 3 minutes (76% at R4; the CON-02 target is 80%), and the death median is 114 s (144 s at R4). Contact causes nearly every death: the crowd of the opening minutes is the new player's wall, not the bosses.
- Bosses now end runs: 71 boss deaths against 36, and boss stage clears take a median 366 s instead of 206 s. Bombers end 113 runs (5 / 12 / 33 / 29 / 34 by chapter), about one death in 13, and contact still causes most.
- The hurdle stages: the team personas clear 1-10 at 0% (6 of 30 at R4; 0 to 3 of 30 with any one R5 rule off, so no single rule makes it), 3-9 at 3%, 1-7 at 7%, and 3-7, 4-3, and 4-9 at 13%; `maxed` clears 5-7 at 20%, 5-8 at 30%, and 5-9 at 20%. The persona's fixed walk dies about 35 s into 1-10 at level 3; the novice, who steers away from threats, clears it 4 times in 20.
- `fresh` still clears 0 of 500, so `personaClearsObserved` fails as before; its 1-1 death median is 79 s (74 s at R4).

The infinite run on 216de64 (`npm run test:balance:infinite`, six seeds, at most 30 minutes; the CON-08 rotation columns above are the R4 reference):

| | max, R4 | max, R5 | mid, R4 | mid, R5 |
|---|---:|---:|---:|---:|
| survival p50 (simulated s) | 1,750 | 1,471 | 1,574 | 890 |
| runs that died before the cap | 2 of 6 | 5 of 6 | 5 of 6 | 6 of 6 |
| round bosses defeated p50 | 196 | 48 | 84 | 22.5 |
| score p50 | 6,019,020 | 4,262,800 | 1,915,807 | 1,795,672 |

- A round boss is a fight now: with a maxed build the median kill takes about 20-45 s in each five minutes of the first 25 (2.8-3.7 s between minutes 5 and 20 before SYS-12; six seeds), so a run fells a quarter as many. Scores fall 29% (max) and 6% (mid).
- The half-upgraded runs end between 10 and 25 minutes (10.4, 10.5, 10.8, 18.9, 22.3, 24.7); the maxed ones between 18 and 30 (one reaches the cap). In 25-minute runs of the same build that record the cause, bosses ended three of the maxed runs and a blast one, and the crowd ended most half-upgraded ones.

CON-02 Ch1 tuning: by the novice proxy, 1-1 already clears within the R1 target band (40-70%), and 3-minute survival (70%) is near its 80% target. A longer opening ramp does not help (1-1, novice, 20 seeds): a 90 s ramp kept 50% clear but dropped 3-minute survival to 50%, and 120 s gave 45% and 65%. Fewer early enemies mean less XP and fewer drafts (median 14 drafts at 45 s, 5 at 90 s), so the player is weaker when the pressure arrives. The 45 s ramp stays. The R1 playtest (6 or more new players) decides the final Ch1 numbers.

FX-02 (two-layer hit-stop, `rareHitStop` rule) changes seeded outcomes, so it was piloted against its parent (FX-04) on 8 stages × 10 seeds × 4 personas:

| | before (FX-04) | after (FX-02) |
|---|---:|---:|
| clear, all 320 | 25.9% | 32.5% |
| clears: striker / survivor / collector / fresh | 17 / 59 / 7 / 0 | 22 / 71 / 11 / 0 |
| clear by stage: 1-1 / 1-3 / 1-5 / 1-8 / 1-10 / 2-5 / 3-10 / 5-5 | 25 / 15 / 23 / 20 / 8 / 38 / 15 / 65% | 28 / 18 / 25 / 25 / 18 / 53 / 28 / 68% |
| deaths: contact / shots / boss | 224 / 7 / 6 | 201 / 6 / 9 |
| fresh in 1-1, death p50 (s) | 68 | 73 |

Per-hit global hit-stop slowed the simulation while the budgeted stage and enrage clocks kept running (BUG-07). Players lost up to 8% of their acting time, and boss stages lost the most (1-10, 2-5, 3-10). FX-02 gives that time back. **[Team check]** either accept the easier boss stages, or fold the change into the CON-02 and SYS-07 tuning, for example with enrage timers. The R1-end full run above (f05b83e) includes it and ART-05's obstacle catalogue.

ART-05 (Ch1 environment kit, `kitProps` rule) takes obstacle footprints from the kit's prop catalogue instead of random ranges. Positions stay where they were, but every footprint changes. It was piloted against its parent (FX-02) on six Ch1 stages × 10 seeds × 4 personas:

| | before (FX-02) | after (ART-05) |
|---|---:|---:|
| clear, all 240 | 20.8% | 20.4% |
| clears: striker / survivor / collector / fresh | 1 / 49 / 0 / 0 | 1 / 48 / 0 / 0 |
| clear by stage: 1-1 / 1-3 / 1-5 / 1-7 / 1-8 / 1-10 | 28 / 18 / 25 / 13 / 25 / 18% | 28 / 20 / 23 / 10 / 23 / 20% |
| deaths: contact / shots / boss | 175 / 8 / 5 | 173 / 6 / 10 |
| boss stages, clear time p50 / max (s) | 394 / 933 | 394 / 488 |
| fresh in 1-1, death p50 (s) | 73 | 68 |

11 of 240 outcomes flipped, in both directions, and the clear rate moved by one scenario, which is within seed noise. Walls keep the old average footprint (200×130), while pillars shrink to prop size (a pole, a jar pile, a cart), leaving more open ground. In 1-10, fewer runs died to the crowd (28 to 23), and more reached the boss and died to its shots (5 to 9), which pass over props.

ART-07 builds the Ch2 and Ch3 maps from their kit catalogues in the same way. Piloted against its parent on six stages of each chapter × 10 seeds × 4 personas:

| | before | after (ART-07) |
|---|---:|---:|
| clear, all 480 | 37.5% | 36.0% |
| clears: striker / survivor / collector / fresh | 47 / 99 / 34 / 0 | 37 / 102 / 34 / 0 |
| clear by stage: 2-1 / 2-3 / 2-5 / 2-7 / 2-8 / 2-10 | 68 / 40 / 53 / 28 / 23 / 30% | 63 / 40 / 45 / 25 / 23 / 33% |
| clear by stage: 3-1 / 3-3 / 3-5 / 3-7 / 3-8 / 3-10 | 70 / 53 / 20 / 18 / 23 / 28% | 68 / 55 / 23 / 25 / 18 / 18% |
| timeouts (20 min of play) | 0 | 2 |
| deaths: contact / shots / boss | 286 / 6 / 7 | 287 / 10 / 8 |
| boss stages, clear time p50 / max (s) | 238 / 1136 | 287 / 541 |

- The overall rate moved by 7 of 480, within seed noise, but 75 outcomes flipped, more than in Ch1. The Ch2 and Ch3 crowds are denser, which likely makes the open ground the smaller pillars leave count for more.
- `striker` lost 13 clears to crowd contact and gained 3. **[Team check]** accept this with the art, or give the pillar family larger props; SYS-07 retunes the chapter curve either way.
- The two timeouts (2-5 and 2-10, both `survivor`, boss at 98% and 99% health) are the persona artifact of the R1-end run: both runs cleared before, and the new maps sent the square walk into the loop where auto-aim never picks the boss.

ART-08 does the same for Ch4 and Ch5. Piloted against its parent on six stages of each chapter × 10 seeds × 4 personas:

| | before | after (ART-08) |
|---|---:|---:|
| clear, all 480 | 57.5% | 56.5% |
| clears: striker / survivor / collector / fresh | 86 / 116 / 74 / 0 | 87 / 116 / 68 / 0 |
| clear by stage: 4-1 / 4-3 / 4-5 / 4-7 / 4-8 / 4-10 | 70 / 63 / 48 / 43 / 30 / 58% | 73 / 58 / 40 / 45 / 33 / 60% |
| clear by stage: 5-1 / 5-3 / 5-5 / 5-7 / 5-8 / 5-10 | 70 / 68 / 68 / 60 / 53 / 63% | 65 / 65 / 68 / 58 / 53 / 63% |
| timeouts (20 min of play) | 0 | 1 |
| deaths: contact / shots / boss | 190 / 7 / 6 | 196 / 4 / 8 |
| boss stages, clear time p50 / max (s) | 179 / 925 | 197 / 1189 |

The rate moved by 5 of 480 (71 flips), within seed noise. The timeout (5-10 `survivor`, boss at 96%) is the same persona artifact.

SYS-06 (obstacles as cover, `obstacleCover` rule) was piloted against its parent (TEC-10) on 13 stages from every chapter (1-1, 1-5, 1-10, 2-3, 2-5, 2-10, 3-3, 3-5, 3-10, 4-5, 4-10, 5-5, 5-10) × 10 seeds × 4 personas:

| | before | after (SYS-06) |
|---|---:|---:|
| clear, all 520 | 39.4% | 40.8% |
| clears: striker / survivor / collector / fresh | 48 / 118 / 39 / 0 | 56 / 118 / 38 / 0 |
| clear by chapter without fresh, Ch1 / 2 / 3 / 4 / 5 (%) | 31.1 / 52.2 / 42.2 / 66.7 / 86.7 | 30.0 / 52.2 / 50.0 / 65.0 / 90.0 |
| deaths: contact / shots / boss | 282 / 8 / 21 | 282 / 8 / 14 |
| boss stages, clear time p50 / max (s) | 233 / 1189 | 243 / 985 |

- Cover makes the game a little easier: 7 more clears of 520 (39 flips), most of them in 3-3 (55 to 68%) and among `striker` runs.
- Shot deaths did not move, because the personas never use cover on purpose. The gain comes from shots that happened to meet a wall.
- Boss deaths fell from 21 to 14.
- The three timeouts are the same `survivor` loops before and after.

The terrain A/B (SYS-06, `terrainOnEnemies`, then off in both rule sets) was piloted on the same 520 runs with the flag switched on (`BALANCE_RULE_PATCH`), against the flag off:

| | off | on |
|---|---:|---:|
| clear, all 520 | 40.8% | 40.0% |
| clears: striker / survivor / collector / fresh | 56 / 118 / 38 / 0 | 54 / 120 / 34 / 0 |
| clear by chapter without fresh, Ch1 / 2 / 3 / 4 / 5 (%) | 30.0 / 52.2 / 50.0 / 65.0 / 90.0 | 31.1 / 53.3 / 44.4 / 65.0 / 88.3 |
| deaths: contact / shots / boss | 282 / 8 / 14 | 283 / 7 / 20 |
| boss stages, clear time p50 / max (s) | 243 / 985 | 231 / 747 |
| kills, all runs | 257,499 | 243,435 (−5.5%) |

- The clear rate did not move beyond noise: 48 runs flipped, 22 to a clear and 26 away from one.
- Boss stages end sooner (p50 243 to 231 s) and the runs make 5.5% fewer kills.
- The largest single change is 3-3 (27 to 20 clears of 40), where water covers the most ground.
- The personas never lure enemies into terrain on purpose, so this measures the side effects only. The team switched the flag on in the remaster rules (decision D-05, 2026-10-02); the next full measure includes it.

SYS-05 (the Ch2-5 final bosses' phase moves) was piloted on those bosses' stages (2-10, 3-10, 4-10, 5-10) × 10 seeds × 4 personas, against the SYS-06 run:

| | before | after (SYS-05) |
|---|---:|---:|
| clear, all 160 | 42.5% | 43.8% |
| clears: striker / survivor / collector / fresh | 17 / 34 / 17 / 0 | 18 / 36 / 16 / 0 |
| clear by chapter without fresh, Ch2 / 3 / 4 / 5 (%) | 40.0 / 26.7 / 76.7 / 83.3 | 40.0 / 30.0 / 73.3 / 90.0 |
| deaths: contact / shots / boss | 84 / 3 / 3 | 81 / 3 / 5 |
| clear time p50 / max (s) | 262 / 874 | 278 / 862 |

- Only 4 runs flipped (3 to a clear): the moves change what a fight looks like, not how hard it is for the personas.
- Boss deaths rose from 3 to 5 and the median clear took 16 s longer.
- The gameplay fingerprints did not change, because their scenarios never bring these bosses to phase 2. `test/bossMovesFinal.integration.test.mjs` covers every move instead.

The SYS-05 anchor leash (an anchoring boss follows a player more than 720 away and plants again, and enrage ends the hold) was piloted on the stages whose bosses anchor (1-10, 2-10, 5-10) × the baseline's 10 seeds × 4 personas, against the R2-end baseline:

| | R2 end | leash |
|---|---:|---:|
| clear, all 120 | 35.0% | 35.8% |
| clear without fresh, 1-10 / 2-10 / 5-10 (%) | 30.0 / 33.3 / 76.7 | 30.0 / 33.3 / 80.0 |
| clear time p50 / max, 1-10 (s) | 425 / 848 | 429 / 804 |
| clear time p50 / max, 2-10 (s) | 380 / 428 | 345 / 396 |
| clear time p50 / max, 5-10 (s) | 198 / 805 | 182 / 445 |
| timeouts | 3 | 2 |

- One run flipped: the 5-10 stalemate above (striker, base seed 997) now clears. The other 119 end the same way, with the same death causes.
- Long anchored fights end sooner: 5-10's longest clear fell from 805 s to 445 s.
- The two survivor pins remain. There the boss comes, but auto-aim keeps to the nearer crowd (see the overtime rule above).

SYS-09 (pickups wait 60 s before flying home, `patientPickups` rule) was piloted with the flag on and off (`BALANCE_RULE_PATCH`) on 1-2, 1-5, 1-6, 2-4, 3-7, 4-3, and 5-2 × the pilot seeds (11, 23, 37, 41, 59, 67, 71, 83, 97, 101) × 4 personas:

| | off (30 s) | on (60 s) |
|---|---:|---:|
| clear, all 280 | 35.0% | 34.6% |
| clears: striker / survivor / collector (%) | 28.6 / 87.1 / 24.3 | 31.4 / 84.3 / 22.9 |
| drafts per run, p50 | 4 | 4 |
| timeouts | 0 | 0 |

- 7 of 280 runs flipped (3 to a clear, 4 to a death), so the longer wait barely moves power. It changes when the drops come home, and so how much a route past them pays.
- The pause-hub guardrail is covered by `test/economy.integration.test.mjs`: a max-health upgrade bought paused heals nothing while paused, then fills in over 3 s after resuming, never faster than its share.
- The R3 exit's coin target (median balance at most 30% of the coins earned) is a player measure: the personas never shop, so it needs playtest telemetry. Developer builds keep a run log for that (decision D-07, docs/DEVELOPER_APP.md): the menu shows the median share and copies the runs as JSON.

CON-03 (stage objectives, `stageObjectives` rule) was piloted with the flag on and off on two stages per objective (1-9, 3-7 swarm; 2-9, 4-7 hold; 1-3, 5-7 traps; 2-3, 4-9 elites; 2-4, 5-9 salvage; 1-6, 5-2 giants; 2-6, 4-4 crossfire; 3-6, 5-4 vanguard) × the baseline's 10 seeds × 4 personas:

| Objective | clear without fresh, off / on (%) | bonus met on a clear |
|---|---:|---:|
| swarm (small +15 points, spawns ×1.2) | 31.7 / 33.3 | 16 of 20 |
| holdLine | 50.0 / 50.0 | 1 of 30 |
| traps (terrain ×2) | 51.7 / 41.7 | 9 of 25 |
| elites (stronger field bosses) | 50.0 / 48.3 | 27 of 29 |
| salvage | 55.0 / 55.0 | 0 of 33 |
| giants (large +15 points) | 61.7 / 48.3 | 22 of 29 |
| crossfire (ranged cap ×3) | 56.7 / 51.7 | 17 of 31 |
| vanguard (third field boss) | 58.3 / 55.0 | 31 of 33 |

- All 640 runs: clears 38.9% to 35.9%, 37 flips (9 to a clear, 28 to a death). The giants and traps changes are the hardest, at 13 and 10 points. SYS-07's curve work starts from these numbers.
- The personas never walk to a zone or a cache, so the hold and salvage goals need playtests. The field boss goals were met on 93-94% of clears, so decision D-04 (2026-10-02) counts only field bosses defeated within 60 s of arriving, and one that outlives the window fails the goal. SYS-10's elites gave the elite hunt its intended goal.

SYS-07 (difficulty curve, `difficultyCurve` rule) was tuned with three pilot sets, each against today's formulas and the chosen numbers:
- The team: striker, survivor, and collector on 1, 4, 9 (normal), 5, and 10 of every chapter × 5 seeds.
- `maxed` (an opt-in persona with every upgrade and passive at its cap) on six Ch5 stages × 10 seeds.
- `novice` on 1-1 × 20 seeds.

| | before | after |
|---|---:|---:|
| normal stage clears by chapter, team (%) | 31 / 64 / 47 / 71 / 76 | 33 / 53 / 33 / 49 / 42 |
| adjacent chapter differences (points) | +33 / -18 / +24 / +4 | +20 / -20 / +16 / -7 |
| boss stage clears by chapter, team (%) | 27 / 43 / 40 / 63 / 83 | 30 / 50 / 30 / 47 / 67 |
| maxed in Ch5: clears, lowest health p50 | 98%, 0.89 | 85%, 0.65 |
| maxed in Ch5: hits that dealt the minimum 1 | 57% | 0% |
| novice 1-1 clears | 50% | 50% |

- The R3 balance gates hold on these sets: the new-player 1-1 band (40-70%), adjacent chapters within ±25 points, a maxed Ch5 lowest health median at most 70%, and minimum hits at most 20%. The full rebaseline at R3's end confirms them.
- The inverted curve is gone. The team's normal clears are now 33% to 53% in every chapter instead of rising to 76%.
- Ch3 is still the valley. Its 3-9 clears 7% and its mid boss 27-33%: the canal maps' horizontal channels and slows trap the personas' fixed walk. Ch3's mid boss stage fell to 0% under the hybrid defence alone, until boss stages took 15% lighter crowds. The team kept Ch3 as it is (decision D-03, 2026-10-02).
- Tried and dropped:
  - flatter stage steps (0.08 to 0.12 per stage, with 0.5 to 0.6 per chapter): they deepened the Ch3 valley;
  - 15% more damage per chapter: maxed Ch5 clears fell to 30%;
  - a lower damage floor and gentler tide slows: they did not move the Ch3 spike.
- `scripts/lib/full-balance-runner.mjs` now records each run's lowest health, hits, and minimum hits, and offers the `maxed` persona.

SYS-10 (elites, `eliteAffixes` rule) was measured on the same sets, against fa5eb0f:

| | without elites | elites (chosen: 12% of elite beats, ×2.5 health) | gentler (8%, ×2.0) |
|---|---:|---:|---:|
| team clears, all (%) | 43.2 | 41.3 | 40.8 |
| normal stage clears by chapter, team (%) | 33 / 53 / 33 / 49 / 42 | 29 / 51 / 24 / 47 / 44 | 29 / 53 / 27 / 44 / 38 |
| adjacent chapter differences (points) | +20 / -20 / +16 / -7 | +22 / -27 / +22 / -2 | +24 / -27 / +18 / -7 |
| boss stage clears by chapter, team (%) | 30 / 50 / 30 / 47 / 67 | the same | the same |
| maxed in Ch5: clears, lowest health p50 | 88%, 0.68 | 83%, 0.60 | 90%, 0.66 |
| novice 1-1 clears | 50% | 50% | 50% |

- Elites cost the team about two points overall. Boss stages have no beats, so they do not change.
- Ch3 is the bots' valley again: its normal stages lose 6-9 points either way, and the Ch2-3 step reaches -27, past the ±25 gate. With 45 runs a chapter, a chapter moves about ±7 points by chance, and the gentler numbers did no better, so the chosen numbers stay. The team kept Ch3 as it is (decision D-03, 2026-10-02).
- Elites keep a maxed build under pressure: its lowest health median falls from 0.68 to 0.60.

CON-07's passive tree gives each account passive ten points instead of five. The `maxed` persona now holds all thirty (it held 5 / 5 / 5). Its second nodes started stronger; this is what each setting did to maxed Ch5 (six stages × 10 seeds):

| second nodes (per point) | clears | lowest health p50 |
|---|---:|---:|
| the 5 / 5 / 5 build, no second nodes (SYS-07) | 85% | 0.65 |
| crit damage +0.05, crit chance +1%, regen +0.15/s | 92% | 0.79 |
| crit damage +0.02, crit chance +0.4%, regen +0.04/s | 88% | 0.71 |
| crit damage +0.02, crit chance +0.4%, coin gain +3% (chosen) | 88% | 0.68 |

The chosen nodes keep a full tree inside the R3 gate (lowest health median at most 70%). Regeneration was what lifted the lowest health, so the third node became coin gain.

SYS-08 (build depth, `buildDepth` rule) is an A/B experiment, off in both rule sets until the slot playtests decide. The bots measured it on the SYS-07 pilot sets, with the experiment off (today's rules) and on. The first set compares XP curves, before tokens (the personas had account level 1):

| | off | slots and owned weight | + XP 0.6 / 0.1 | + XP 0.7 / 0.1 | + XP 0.8 / 0.08 |
|---|---:|---:|---:|---:|---:|
| team clears, all (%) | 43.2 | 42.4 | 42.4 | 38.9 | 40.5 |
| normal stage clears by chapter, team (%) | 33 / 53 / 33 / 49 / 42 | 29 / 49 / 27 / 53 / 38 | 31 / 53 / 24 / 56 / 33 | 31 / 51 / 22 / 42 / 36 | 27 / 42 / 22 / 58 / 36 |
| drafts on cleared 8-minute stages, p50 (p10-p90) | 34 (13-44) | 36 (16-44) | 27 (17-33) | 25 (13-32) | 26 (14-32) |
| the same by chapter | 16 / 20 / 37 / 39 / 43 | 20 / 28 / 36 / 40 / 43 | 18 / 22 / 29 / 31 / 33 | 16 / 18 / 27 / 29 / 32 | 15 / 18 / 27 / 30 / 31 |
| awakenings on those stages, p50 | 3 | 4 | 3 | 2 | 3 |
| fusions taken in the 375 team runs | 0 | 36 | 23 | 9 | 19 |
| maxed in Ch5: clears, lowest health p50 | 85%, 0.65 | 82%, 0.59 | 83%, 0.58 | 78%, 0.48 | 68%, 0.50 |
| novice 1-1 clears | 50% | 60% | 65% | 70% | 55% |

- The XP rows read "level L needs the usual XP × scale × (1 + growth × (L − 1))". 0.6 / 0.1 is the table's setting: drafts fall into the 20-28 band, 3 awakenings a stage, and clears stay level. Early levels get cheaper, so a new player's first drafts come sooner.
- Its cost is a bumpier chapter curve. Ch3's normal stages fall to 24%, and the Ch2-3 and Ch3-4 steps pass the ±25-point gate (-29, +31). Ch3 was already the valley of the bots' fixed walk (SYS-07); slots alone took it from 33% to 27%.
- In the second half of a stage, bonus cards are 0% of the cards offered in every set, off or on. Under the remaster rules, 8-minute stages never run out of skills; the 0.1.0 finding (every late card a bonus) came from 12-minute stages.

The second set adds tokens and compares slot counts, all with XP 0.6 / 0.1. The personas now have an account level of 1 plus their passive points (one a level), so from Ch3 on they hold one or two tokens, and they redraw a draft that has no card in their plan:

| | off | 6 + 4 slots | 5 + 3 slots | no slot limit |
|---|---:|---:|---:|---:|
| team clears, all (%) | 43.2 | 44.8 | 44.5 | 44.8 |
| normal stage clears by chapter, team (%) | 33 / 53 / 33 / 49 / 42 | 31 / 53 / 29 / 58 / 47 | 31 / 51 / 29 / 58 / 42 | 31 / 53 / 29 / 58 / 47 |
| adjacent chapter differences (points) | +20 / -20 / +16 / -7 | +22 / -24 / +29 / -11 | +20 / -22 / +29 / -16 | +22 / -24 / +29 / -11 |
| boss stage clears by chapter, team (%) | 30 / 50 / 30 / 47 / 67 | 23 / 57 / 30 / 57 / 67 | 23 / 57 / 30 / 60 / 70 | 23 / 57 / 30 / 57 / 67 |
| drafts on cleared 8-minute stages, p50 (p10-p90) | 34 (13-44) | 27 (17-34) | 27 (17-34) | 28 (17-34) |
| awakenings on those stages, p50 | 3 | 3 | 3 | 3 |
| fusions taken in the 375 team runs | 0 | 19 | 24 | 15 |
| team runs that ended with ten skills | 87 | 21 | 0 (eight at most) | 31 |
| maxed in Ch5: clears, lowest health p50 | 85%, 0.65 | 82%, 0.60 | 82%, 0.60 | 85%, 0.61 |
| novice 1-1 clears | 50% | 65% | 65% | 65% |

- Tokens add about two points of clears (42.4% to 44.8%).
- The slot count barely moves the bots. In eight minutes they rarely fill ten slots, so a build with no limit plays almost the same. Players pick differently. The team chose 6 + 4 and switched the rule on in the remaster rules (decision D-09, 2026-10-02).
- With the experiment on, the Ch3-4 step (+29) passed the R3 gate of ±25 points in this pilot. Ch3 is the bots' valley either way. The team adopted the rule anyway and kept Ch3 as it is (D-03); the next full measure shows where the step lands.
- `scripts/lib/full-balance-runner.mjs` now records each run's awakenings, fusions, run level, and the cards and bonus cards offered in the stage's second half. The personas take fusion cards first.

CON-08 (the endless rotation, `infiniteRotation` rule) was measured with `npm run test:balance:infinite`: the striker's picks and square walk, six seeds, at most 30 minutes of frames. `max` is the test fixture's full build (passives 5 / 5 / 5) and `mid` has half its upgrades and passives. The rotation off is `BALANCE_RULE_PATCH='{"infiniteRotation":false}'`:

| | max, off | max, rotation | mid, off | mid, rotation |
|---|---:|---:|---:|---:|
| survival p50 (simulated s) | 1,758 | 1,750 | 1,487 | 1,574 |
| runs that died before the cap | 1 of 6 | 2 of 6 | 5 of 6 | 5 of 6 |
| round bosses defeated p50 | 162 | 196 | 76 | 84 |
| score p50 | 4,568,976 | 6,019,020 | 1,627,937 | 1,915,807 |
| chapter turns, field bosses per run | 0, 0 | 5, 6 | 0, 0 | 3-5, 3-6 |

- Survival barely moves. Round bosses fall 11-21% more often, so scores rise 18-32%: each chapter's first minutes bring its own two bosses instead of any of the ten, and Ch1's fall fastest. The board keeps v2 records apart from v1, so the shift never mixes with old records.
- Every field boss fell. They add a side target and a bounty, not a wall.

## Game rules and grammar

Gameplay changes ship behind the rule set in `src/game/rules.ts`. `classic` reproduces 0.1.0 exactly and `remaster` is the default. The app never switches rule sets, so app builds fold GameEngine's `this.rules.<flag>` reads to the remaster values (`scripts/lib/fold-rules.mjs` in `vite.config.ts`, TEC-05) and the minifier drops the classic branches; tests, the balance harness, and benches build the engine unfolded and keep both. After changing how GameEngine reads its rules, `npm run test:folded-rules` must report that the folded engine plays exactly as the unfolded one (seeded balance runs and every remaster draw fingerprint; only the classic scenario may differ), and `test/releaseFoldRules.test.mjs` fails if a read escapes the folding. Infinite-mode records and replay fixtures are kept per rules version: the remaster rules (v2) may change freely until a build ships them, and after that the first change to seeded outcomes must raise `RULES_VERSION`. `test/grammarContracts.integration.test.mjs` pins the preserved game grammar (stage structure, draft sizes, radii, tier mix, deterministic replay) and one regression test per R0 gameplay fix.

CON-08 changes the remaster infinite run's seeded outcomes, under v2 because no build has shipped it. `test/rotation.integration.test.mjs` pins the daily and weekly seeds of 2026-10-01, so a later build cannot hand players a different day's run, and replays a scripted daily run (a field boss and a chapter turn) in another window and with other options to the same state (G14). Classic fingerprints, the remaster campaign fingerprints, and every draw fingerprint stayed the same; the remaster infinite fingerprint changed, because its first round boss now comes from Ch1.

The stage objectives (CON-03) are G9's one stage exception: a stage may move one tier's share by 15 points at most, and the crossfire stages raise the ranged cap up to 6. The stage card states every change, and `test/objectives.integration.test.mjs` pins the moved mixes, the cap, and the field boss marks (G8).

Skill numbers live in `src/content/data/skillNumbers.ts` (a content table, TEC-05); the engine and the draft-card copy both read them through `src/game/skillNumbers.ts`. `src/game/skillNumbers.snapshot.json` records every number and every generated card line. After an intended balance change, review the diff and refresh it with `UPDATE_SKILL_SNAPSHOT=1 npm run test:unit`.

## Visual and accessibility

`npm run test:visual` builds the developer bundle and captures the menu, infinite menu, infinite play, story (the prologue's first panel, CON-06), playing, paused, draft, bombers (the `BOMB` cheat: two of each bomber around the hero, one fuse planted; SYS-14), settlement, and boss states at the TEC-01 viewports (1024x720, 1280x720, 1440x900, 1920x1080), at DPR 1 and 2, in three modes: full motion, the system's reduced motion, and the reduced flash setting (set in the menu's settings before the first capture), which UI-08 separates from reduced motion: 240 captures. Phone and tablet sizes (320x568, 375x812, 768x1024) remain selectable with `VISUAL_VIEWPORTS`. It fails on console errors, blank Canvas output, viewport overflow, incoherent control overlap, missing images, and contract-level accessibility violations. It also reads every visible text in each capture (UI-08) and fails on text under 13 px, or under WCAG contrast (4.5:1, 3:1 for large text) against the surface painted under it. Text over the game canvas, which carries its own paper halo, text on baked art, and text scrolled out of its container are not measured; disabled controls are exempt, and with a modal open only the modal's text is read. The same audit (`scripts/lib/text-audit.mjs`) runs in a UI probe over every menu tab, every codex part, and every pause hub tab at 1440x900 and 1024x720 (30 screens).

Captures are deterministic: seeded `Math.random` and `crypto`, and a paused Playwright clock that only moves when a step settles, so the game loop, timers, and the dialog input guard advance by exact amounts (TEC-06). Once the app has mounted, the gate runs the page clock to an exact tick count. Playwright adds the real time between installing and pausing its clock (0-2 ms) to `performance.now()`, which otherwise shifts moving sprites by a sub-pixel. Two runs of the same build produce identical images, in any viewport order.

`npm run test:ui-probes` drives the developer build with keyboard and a virtual gamepad (HUD focus, draft and settlement input guards, gamepad menu navigation). It also injects faults to check error recovery (TEC-14): a frame error, a render error, and a missing atlas page. The audio probes (AUD-01) check that two runs share one running audio context with its limiter, that clearing a crowd in one frame starts one kill voice, and that button clicks play UI cues. The death probe (FX-03) ends a run with the developer cheat KO and checks that the settlement waits for the death moment, which cannot be paused. The HUD probe (UI-02) measures the HUD's footprint on a 4 px grid, using element boxes for bars, art, chips, and buttons, and glyph boxes for text. It must stay at or under 7% of the screen at 1440×900 and 12% at 1024×720, and the centre 40% of the screen must stay clear. The live-region probe (UI-08) checks that the HUD's effect rack, whose timers redraw every snapshot, is not a live region, and that the one line that speaks the effects changes only when an effect starts or ends. The key probe (UI-08) chooses I as the up key in the menu's settings, checks that P is refused and that the choice survives a reload, and then that I moves the hero up in a run while W no longer does and the arrow keys still do. The pause probe (UI-04) checks the pause hub and the menu settings:
- The run stays stopped while the hub is open, and the hub has its four tabs.
- A health upgrade bought in the hub adds no health until the run resumes, then about +7 after one second and the full +20 after four (G6).
- The menu's settings tab can set reduced flash before any run.

The focus probe (UI-08) presses Tab through the pause hub and a draft and checks that focus stays in the modal, lands only on visible controls, and always shows a focus ring.

The colour probe (UI-08) checks that colour is never the only cue. Every coloured state also has a shape, a mark, or words:

| Where | State | Cue besides colour |
|---|---|---|
| Draft cards | rarity | the rarity's name and one more ◆ per rank (the kit frame also changes shape, UI-03) |
| Stage map | current, cleared, locked, stars | the "도전 가능" caption, the cleared seal, a dashed border with the lock reason, ★ per star |
| HUD effects | buff, debuff | a + or ! mark and the effect's name |
| HUD bonus goal | done, failed | done inverts to paper on ink, failed is dashed |
| Endless record | ranked, practice | the words 경쟁 기록 or 연습 · 기록 제외 |
| Boss bar | enraged | the words 광폭화 with the step (광폭화 2/4) or the overtime count |
| Field (canvas) | ownership, telegraphs, elites, hazards | hatching for enemies and stitched dots for allies (style bible P4), dashed then thick then filled telegraph stages (V3), the elite's three-dot crown (V6), each hazard's icon and pattern (ART-06) |

The probe checks the first three rows in the developer build: every current stage node has its caption, every cleared one its seal, and every locked one a dashed border; every draft card's ◆ count matches its rarity and it names the rarity; every effect carries its mark.

The save probe (TEC-15) exports from the menu's settings and checks the text reaches the clipboard. It then pastes a text that is not an export, which is refused, and a changed export, which asks once more before importing and reloads with it. The hint probe (UI-09) checks that a first 1-1 run opens with the movement hint without pausing, below the centre band, and that a second run on the same save does not repeat it. The draft probe (UI-03) opens a draft at 1440×900 and 1024×720. It checks that the three cards sit centred and show their baked tiles, that no text is under 13 px, and that the dialog fits without scrolling. The pad probe (UI-07) plays 1-1 with a virtual Xbox pad only: A lands on the start button and starts the stage, the stick moves the hero, the D-pad and A pick a draft card, Start opens the pause hub, RB and LB switch its tabs, and B resumes. The settlement then shows A, and ✕ once the pad reports as a PlayStation pad, and A takes it to 1-2. Only the draft and the stage end are forced, with the developer cheats. The settlement probe (UI-05) plays 1-1 for six seconds and clears it, at the same two sizes. It checks that Enter inside the input guard does nothing, that the settlement shows the victory portrait, the gold's parts, and the damage bars with no text under 13 px and no scrolling, and that Enter after the guard starts 1-2. `npm run test:dev-smoke` checks that `npm run dev` serves a styled page under the development CSP.

The string checks (UI-10) run with the unit tests. The Korean and English tables must have the same keys and placeholders, English must have no Korean left, every key must be used, and no player-facing Korean may stay in code outside the allowlist in `src/i18n/strings.test.ts`. The developer bundle check reads the tables too, so its required controls can live there.

`npm run test:electron-smoke` (after `npm run build`, on a desktop session) launches the real Electron app with a throwaway data folder, so a player's save is never touched. It checks the 1440x900 content size (TEC-01), the `app://game` origin, the first-launch move of a seeded `file://` save with its backup file and marker, and a second launch that keeps the moved save (TEC-15). It also checks sprite loading (TEC-03), a short run without console errors, the local error log, and reload after a forced renderer crash (TEC-14). A run paused in it must come back after the renderer crash, after a quit, and after a force-quit 1.5 s after a later pause, at the tick and with the commands it was saved with (CON-04). CI runs on Linux without a display, so this check is part of the local and release gate.

Golden screenshot updates require explicit review. A capture-only run is not a regression pass. Goldens are made on macOS, the shipping platform, with `VISUAL_UPDATE_GOLDENS=1`; Linux CI renders fonts differently, so the CI visual job (1024x720 and 1440x900) runs without mandatory goldens and the full local/release matrix remains the acceptance gate. The first committed golden set is taken when the R1 character art lands, because R1 replaces nearly every pixel; until then renderer refactors are checked with the headless Canvas draw-call fingerprint: run `npm run fingerprint:draw > before.json` on the base commit and again after the change, then `node scripts/draw-fingerprint.mjs --compare before.json after.json` must report SAME for every scenario. The headless fingerprint draws without sprites, so since TEC-10 it follows the load-failure silhouettes: TEC-10 changed every scenario by design (40-50% fewer canvas calls, for example c1s1-fresh 755,992 to 397,828), and later refactors compare against it.

## Performance

`npm run test:soak:smoke` checks deterministic simulation pressure in CI. Release performance additionally requires `npm run test:soak` and the desktop soak.

`npm run test:electron-soak` (after `npm run build:developer`, about 45 minutes, the window open) is the desktop soak (TEC-09): the real app on a throwaway data folder, 15 minutes of 5-10 at double speed and 30 minutes of the infinite run, with GOD on, each draft taking its first card, and a settled stage started again. It records every animation frame's interval, long tasks, the JS heap after a garbage collection, and renderer crashes, and fails unless at most 1% of frames miss a vsync (over 25 ms), the interval p99 is at most 33 ms, the heap grows at most 20 MiB over each phase, and nothing crashes. Its report goes to `artifacts/performance/electron-soak.json` with the load average at the start and the end.

The first desktop soak (2026-10-02) found that frames fell apart in the infinite run after its fifth minute: 30% of frames missed, p99 865 ms, the heap up 18 MiB. The main thread was idle or in native drawing, not in script. The cause: `SpriteAtlas.frame` handed out a new frame object for every lookup, and the renderer keys its cut-out caches (the hit flash, the elite outline, the hero's outline cosmetic) by frame, so every hit flash and every elite on every frame built a new canvas that the GPU kept. The atlas now keeps one frame object per key until the resident packs change, the renderer drops its cut-outs when they do, and each cache is bounded. The rerun on this Mac (load average 3.0 at the start):
- 5-10 at double speed, 15 minutes: 50,410 frames, 0.01% missed, interval p50 16.7 / p95 18.5 / p99 18.7 / max 115.7 ms, 1 long task, heap after GC 8.9 to 8.5 MiB;
- infinite, 30 minutes: 104,370 frames, 0.02% missed, interval p50 16.7 / p95 18.2 / p99 18.6 / max 66.0 ms, 1 long task, heap after GC 7.6 to 10.7 MiB.

`npm run bench:render` (desktop session) measures the real renderer in Electron at 1440x900. It covers the TEC-04 stress scene (400 enemies since the SYS-13 horde, 204 before; 240 hostile shots, 520 particles, 160 damage numbers) at DPR 1 and 2 and render scales 2.0 and 1.5, with sprites and vectors, plus the final boss stage of every chapter with its pack and runs with the frame rate unlocked. The first results and the provisional Canvas2D decision are in `docs/decisions/TEC-04-render-backend.md`. Headless Chromium can rasterize in software, so its frame times are not performance evidence.

`npm run bench:packs` (after `npm run build`) opens the production build in Electron and switches the menu's chapter to time each chapter pack's load, and adds up the resident textures (the common pack, the skill VFX pack, the UI art, and the chapter's pack, decoded) and each pack's size. The R2 targets are a 1.5 s transition, 96 MiB resident, and 12 MiB per pack. The R2-end numbers are in the TEC-04 record.

`npm run test:perf` (desktop session, about 45 s) is the release performance gate (decision D-22): the TEC-04 stress scene at DPR 2 and render scale 2.0 with sprites, once with vsync and once with the frame rate unlocked. The SYS-13 horde raised the scene from 204 to 400 enemies (the infinite run's cap); on this Mac it passes with work p95 7.0 ms and unlocked interval p95 5.2 ms (204 enemies: 5.7 and 3.4). It fails the run when a target below is missed.

Targets (TEC-04 D-3, one wording for every gate since D-22):

- with vsync at 60 Hz: at most 1% of frames miss a vsync, and in-frame main-thread work p95 at or below 8 ms
- with the frame rate unlocked: frame interval p95 at or below 11 ms (90 fps)
- 15-minute soak: frame p99 at or below 33ms
- retained heap growth at or below 20MiB
- entity and effect counts within documented caps
- no unexplained long-task or GC cluster

TEC-09's CPU items, measured before any change (this Mac, 2026-10-02):
- The simulation is not the bottleneck. A headless Ch3 crowd of 220 enemies with skills firing steps at 0.032 ms per tick; the stress scene's whole in-frame work p95 is 3-4 ms, mostly drawing.
- The broad-phase index (`src/game/spatialIndex.ts`) now keys cells by integer and marks visited entries with a query stamp, instead of building key strings, key arrays, and a set per query. Results and their order are unchanged. 400 rounds of 300 inserts and 250 circle queries take 222 ms instead of 442, and the crowd steps at 0.028 ms per tick (3 runs each). Classic and remaster gameplay fingerprints and every draw fingerprint are unchanged.
- Particles need no ring buffer: a burst only spawns into the room left under the cap (`Presentation.burst`), so the oldest are dropped one by one only when the effect density setting lowers the cap.
- Enemy objects are not pooled. Spawns are a few per second, the soak's heap holds, and reusing an enemy object would risk a stale reference (a target or a projectile owner) changing a seeded outcome.

## Release evidence

A release record contains:

- commit and version
- Node and npm versions
- unit, security, integration, balance, visual, accessibility, and performance results
- arm64 and x64 package smoke results
- signature, Gatekeeper, notarization, and staple results
- SHA-256 checksums and dependency inventory
- save upgrade and rollback confirmation

`npm run release:evidence` collects available gate JSON, produces a CycloneDX SBOM, and writes SHA-256 manifests for packaged artifacts. It intentionally fails when no distributable exists.
