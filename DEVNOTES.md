# DEVNOTES — Quest for DARPA

Implementation guide for anyone (human or agent) updating `index.html`. This is not user-facing — see [README.md](./README.md) for that.

The whole game lives in **one file**: `index.html`. It is intentionally not split. If you find yourself wanting to add a build step or extract a module, *don't* — the constraint is "drop one file on GitHub Pages and it works offline forever."

---

## Architecture in 60 seconds

Everything runs inside a single namespace `Q`, defined by an IIFE near the bottom of the file. There are exactly these top-level subsystems:

| Subsystem | Where | Purpose |
|---|---|---|
| `STRINGS` | top of the IIFE | All user-facing copy. Edit text here. |
| `PAL` | after STRINGS | The 16-color palette as JS hex constants. |
| `ROOMS` | after PAL | Tile-map definitions for the hub and 6 stages. |
| `puzzles` | after ROOMS | 18 puzzle generator functions (6 stages × 3 tiers). |
| `audio` | after puzzles | Web Audio synthesis. Off by default. |
| `state` | after audio | The single source of truth for runtime state. |
| `ui` | after state | DOM helpers (`$`, `$$`, `show`, `openModal`, `setHud`). |
| Canvas + render | after ui | `drawTile`, `drawObject`, `drawHero`, `drawWorld`. |
| Movement / input | after render | Keyboard, D-pad, hero step + collision. |
| Puzzle flow | after input | `openPuzzle`, `renderPuzzleBody`, `puzzleSolved`, `wrongAnswer`. |
| Story flow | after puzzles flow | `showDialog`, `showItemGet`, `runFinalAssembly`, `finishGame`. |
| `wire()`, `boot()`, `selfTest()` | bottom | Wire-up, entry point, regression tests. |

To find any of these in the file, grep for the heading comment (e.g. `------- ROOMS`, `------- AUDIO`, `------- SELF-TESTS`).

---

## The flow (single state-machine in plain English)

```
title                  — Konami listens here
  ↓ START
tier                   — Sprout / Cadet / Operative + Family Co-op toggle
  ↓ Next
hero                   — name input + tunic color
  ↓ Next
timer                  — 5-min toggle
  ↓ Begin
game (hub)             — preamble dialog auto-shows once
  ↓ walk into a portal "1"–"6"
game (stageN)
  ↓ walk to puzzle pedestal + Space
modal-dialog (Mission Brief)              — TEACH
  ↓ OK
modal-puzzle                               — APPLY
  ↓ correct or skip
modal-dialog (what we learned)             — REINFORCE
  ↓ OK
modal-itemget                              — REWARD
  ↓ OK
exitToHub()
  ↓ once stagesCleared.size === 6 && inventory.length === 7
modal-dialog ("All six artifacts gathered!")
  ↓ walk to Codex pedestal + Space
runFinalAssembly()                         — fanfare + sparkles
  ↓ View Certificate
finishGame()                               — cert page, glow + fanfare
```

Important guarantee: educational content is **never** gated behind a correct answer. `puzzleSolved()` and the Skip button both run the same callback chain (Mission Brief → "what we learned" → item-get).

---

## Where things live (anchor lines, may drift)

These are search anchors, not exact lines. Use grep.

| To find | Search anchor |
|---|---|
| All user copy | `const STRINGS = {` |
| Per-stage teaching brief | `stageIntros: [` |
| Per-stage post-puzzle copy | `stageEdu: [` |
| Hub map | `hub: {` then look for `map: [` |
| Stage maps | `s1: {`, `s2: {`, ..., `s6: {` |
| All 18 puzzles | `function s1Sprout`, etc. |
| Pattern renderer | `def.kind === "pattern"` |
| Codex finale | `function runFinalAssembly` |
| Easter-egg dispatch | `function revealEgg` |
| Self-tests | `function selfTest` |
| Keydown handler | `window.addEventListener("keydown"` |

---

## Easter eggs — exact implementation locations

The game has **seven** hidden eggs. They are tracked in `state.eastereggsFound` (a `Set`) and credited via `revealEgg(name, opts)`. Each gives `+5` score and an audible jingle. The final screen shows `N of 7`.

### Quick map

| # | Name | Where | Triggered by |
|---|---|---|---|
| 1 | `konami` | Title screen | The Konami code (`↑ ↑ ↓ ↓ ← → ← → b a`) — watched by the global `keydown` listener; calls `unlockKonami()` which calls `revealEgg("konami")` and reveals a hidden gold tunic swatch (`#swatch-gold`). Also grants `heilmeier-apprentice` badge. |
| 2 | `turing` | Stage 1 | Bonk the blackboard 3× (walk into it). `bonk()` increments `state.blackboardBonks`; on the 3rd bonk it calls `revealEgg("turing", {...})` with a Turing/ELIZA dialog. The blackboard is a tile object with `kind: "egg", egg: "turing"` in `ROOMS.s1.objects`. |
| 3 | `bombe` | Stage 1 | Interact with the vacuum tube object (`egg: "bombe"`). Opens `openBombe()` — a 3-rotor mini-puzzle (set rotors so `r1 × r2 × r3 = 60`). Solving awards `+50` and the `codebreaker` badge via `revealEgg("bombe", {silent: true})`. |
| 4 | `shakey` | Stage 2 | Walk near Shakey, press Space. Shakey is a special NPC with its own wander-1-tile-per-second loop in `stepShakey()`. Detected in `tryInteract()` by adjacency. |
| 5 | `cgc` | Stage 4 | Interact with the bug-on-pedestal object (`egg: "cgc"`). Calls `revealEgg("cgc")`. References DEF CON 24, 2016. |
| 6 | `robotics` | Stage 5 | Interact with the DRC door (`egg: "robotics"`). Calls `revealEgg("robotics")`. References DRC Finals 2015, Pomona. |
| 7 | `internet` | Hub | Interact with the stone tablet (`egg: "internet"`). Calls `revealEgg("internet")`. The tablet text is `STRINGS.stoneTablet`. |

### Adding a new easter egg

1. Add an object to the room's `objects` array with `kind: "egg", egg: "<name>"`, plus a `title` and `text`. The map char (e.g. `e`) maps to the next un-claimed declaration in source order — so if you have multiple objects sharing a char, ordering matters.
2. Add a render branch in `drawObject()` under `case "egg": switch(obj.egg) { case "<name>": ... }`. Drawn in canvas pixels using `ctx.fillRect` — no images.
3. Add a handler in `interact()` under `case "egg":` for the `"<name>"` egg. End the success path with `revealEgg("<name>")`.
4. Update the count in the certificate (`cert-eggs`) — currently hard-set to "of 7" in the HTML at `#screen-final`. Bump that to "of 8" if you add an 8th.
5. Add an entry to the public-facing list in `README.md`.

### Konami: code is in `state.konami.codes`

```js
state.konami = {
  progress: 0,
  codes: ["ArrowUp","ArrowUp","ArrowDown","ArrowDown",
          "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"]
};
```

The watcher only listens on `state.screen === "title"`. To add a second code (e.g. for a different unlock), add a parallel `state.konami2` with its own progress and dispatch.

---

## Adding content

### Adding a new stage

There are six. Adding a 7th requires touching:

1. **`STRINGS.stageNames`**, **`stageEras`**, **`stageEdu`**, **`stageIntros`** — push a 7th entry.
2. **`STRINGS.splashes`** — push a 7th entry.
3. **`STRINGS.items`** — add a new artifact key. Update the array in `puzzleSolved()`, `showItemGet()` final-flow check, and `runFinalAssembly()`'s `items` constant.
4. **`ROOMS.s7`** — define the room (16×11 minimum, copy `s6` as a template).
5. **`puzzles[7] = { sprout, cadet, operative }`** — three puzzle generators.
6. **`ROOMS.hub.map`** — add a portal char `7` somewhere walkable. Add the `{ ch: "7", id: "portal7", kind: "portal", stage: 7 }` object.
7. **HUD inventory slot count** — `setHud()` and the HTML `#hud-inv` show 7 slots (stylus + 6 items). With 7 stages you need 8.
8. **`runFinalAssembly().items`** — add the 7th key.
9. **`selfTest()`** — bump the loop counts (currently `s<=6`).
10. **`finishGame()` certificate** — bump the badge grid loop and the `cert-badges` "/6" copy.

It's about 20 minutes of mechanical edits. The self-test will tell you what you missed.

### Adding a new puzzle type (alongside `pair`/`scramble`/`fill`/`cipher`/`sequence`/`logic`/`image`/`maze`/`pattern`)

1. Add a generator that returns `{ kind: "myKind", prompt, hints, ...fields }`.
2. Add an `else if(def.kind === "myKind")` branch in `renderPuzzleBody()` that builds the DOM widget. Call `puzzleSolved()` on success, `wrongAnswer()` on failure.
3. (Optional) wire `pz-submit` if your widget needs an explicit submit button.
4. (Optional) wire keyboard within the widget (see the maze for a pattern — listen to keydown and bail when the modal closes).

### Adding/changing user-facing copy

All strings are in `STRINGS`. Touch nothing else.

Special cases:
- The certificate text is in HTML (`#screen-final`).
- The Help modal is in HTML (`#modal-help`).
- The References content is generated by `renderRefs()` from a JS template literal — that's the one place where text lives outside `STRINGS`.

---

## Canvas / tile system

- 16 × 16 px tiles. World canvas size is `cols × rows × 16`.
- Hub is 20 × 11. All stages are 16 × 11.
- Tile chars in `map`:
  - `#` wall (collision)
  - `.` floor
  - any other char = floor underneath, but maps to an object via the `objects` array
- Hero collision uses an inset bbox `(bx=4, by=6, bw=8, bh=9)` against the tile grid.
- Walkability rules in `isWalkable(room, gx, gy)`:
  - `#` always blocks
  - No object at tile → walkable
  - Object kind `"portal"` or `"exit"` → walkable (and auto-triggers on enter)
  - Anything else → blocks (you walk *up to* it and press Space)

The hero is drawn programmatically by `drawHero(c, x, y, scale, dir, frame, tunic)` — no sprite sheet. Each call paints ~40 individual `fillRect`s. Cheap and theme-able.

---

## Audio

`audio` is built on Web Audio. All effects are synthesized; no audio files. Functions:

| Function | When |
|---|---|
| `audio.ok()` | Correct puzzle answer |
| `audio.no()` | Wrong puzzle answer |
| `audio.bonk()` | Hero hits a wall |
| `audio.step()` | Per-step hero footstep tick |
| `audio.itemGet()` | Item get jingle (4 notes) |
| `audio.eggGet()` | Easter egg jingle (3 notes) |
| `audio.stage()` | Stage transition (3 notes) |
| `audio.fanfare()` | **NEW**: opening of Codex finale (6-note ascending arpeggio) |
| `audio.bigChord()` | **NEW**: held C-major chord on Codex completion |

All respect `state.mute` (which mirrors `set-sound`). Default is muted.

---

## Self-tests

`selfTest()` runs once at boot, after `wire()`. It checks:

- `STRINGS` has every required key
- All 6 stages have intro/era/edu/name + 3-tier puzzles
- All 7 inventory items are defined
- Hub map row/col counts agree, the Codex pedestal exists, all 6 portals exist
- Each stage room has a puzzle and an exit, and its row/col counts agree
- **Keystroke regression**: simulates `a`, `s`, `d`, `w`, Space `keydown` events while `#hero-name` is focused and asserts none are `preventDefault`'d. This is the test that would have caught the bug that ate letters in the name input.

On failure it prints to console and shows an amber banner. Add a new `ok(...)` line if you add a feature that should never regress.

---

## Recently fixed bugs (don't reintroduce)

| Bug | Fix | Test |
|---|---|---|
| Letters `a` `s` `d` `w` Space dropped from `#hero-name` input | Keydown handler returns early when an `INPUT`/`TEXTAREA`/`SELECT` is focused | `selfTest` keystroke simulation |
| Enter / Space on focused buttons swallowed | `preventDefault` no longer fires on Enter / Space when a modal is open — the browser's native button activation handles them | Manually verifiable: focus any modal OK and press Enter |
| 6th-artifact "bugged out" (post-puzzle dialog double-fired) | `showDialog` and `showItemGet` are idempotent (`handled` flag guards) | Manually verifiable: spam-click any OK button — callback runs once |
| Pattern puzzle showed "What comes next" instead of the actual emoji/number sequence | Pattern puzzles now declare an explicit `sequence: [...]` field; renderer reads it directly instead of regex-parsing the prompt | Visible in stage 6 across all three tiers |
| Codex finale was silent and abrupt | Added `audio.fanfare()` + `audio.bigChord()`, sparkle burst (`spawnSparkles`), name shoutout, focused next-button | Manually verifiable: collect all 6 and walk to Codex |

---

## Roadmap (mature improvements)

In rough priority order. None of these are blocking; the game ships.

1. **Replace typing for Sprout/Cadet** with multi-choice buttons + icons. Typing on phones is rough for under-8s.
2. **Tutorial first room.** A 30-second optional movement-and-interact tutorial before the hub. Half of all booth kids skip the help modal.
3. **Booth idle reset.** After 90 s of no input, fade in a "Pass it on?" prompt that resets the run for the next kid in line.
4. **Voiceover for Mission Briefs** via Web Speech API (offline-safe). Helps younger or non-fluent readers.
5. **Interactive Codex assembly.** Make the finale a drag-each-artifact-into-the-right-chronological-slot, not just a cutscene.
6. **Stage 5 Sprout rework.** Replace pizza/planet image grid with a one-screen scroll where Stanley auto-drives and the kid taps "stop" on hazards.
7. **Per-kid recap QR on the certificate.** Inline-rendered SVG QR (no library needed) linking to a static "what your kid just learned" page parents can read in the car.
8. **Confidence-based difficulty.** A 3-question warm-up that picks the tier silently, with parent override.
9. **Centralized state machine.** Replace the callback chain in `puzzleSolved` → `showDialog` → `showItemGet` → `exitToHub` with a `state.phase` enum and a single `advance()` switch. Catches whole classes of timing bugs.
10. **Booth analytics (no PII).** `console.table` per-puzzle timings on session end. Lives in dev tools, never leaves the laptop.
11. **Show-the-answer mode.** When skipping, post-skip "what we learned" includes a tiny annotated screenshot of the puzzle with the right answer marked.
12. **Audio context unlock on first pointerdown.** Avoid the iOS Safari case where audio starts muted even after the player taps Start.
13. **Dyslexia-friendly font toggle** in Settings (system fallback only — `Atkinson Hyperlegible` if available, else system serif).
14. **Stylize the hub as an ARPANET map.** Connect UCLA/SRI/UCSB/Utah with glowing lines; the 6 stage portals sit on those lines as research projects.

---

## Style and constraints

- **Single file.** Don't split. If you really need to, vendor it back in before commit.
- **No new network calls.** No web fonts, no CDN scripts, no fetches. The page is offline after first load.
- **No localStorage / cookies / analytics.** Session state only.
- **No defense framing.** DARPA = research agency that funded internet, autonomous vehicles, GPS, voice. Stylus-sword is the only "weapon" and it bonks walls.
- **No copyrighted likenesses.** Stylized DARPA shield is a homage. No Mario/Pikachu/Link.
- **Reduced motion.** Respect `prefers-reduced-motion` (already disables scanlines, sparkles, and codex-pop animations).
- **Educational content never gates.** Skip = same teaching as solve.

---

## License

MIT. See [LICENSE](./LICENSE).
