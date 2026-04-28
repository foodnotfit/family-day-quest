# Changelog

All notable changes to this game.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-04-28

First public release. The game is feature-complete and booth-ready.

### Added
- Six historically accurate stages: The Spark, First Words, The Long Winter, The Comeback, The Grand Challenge, The Age of Models.
- Three age tiers (Sprout 5–7, Cadet 8–10, Operative 11–14) with a Family Co-op always-on-hints toggle.
- Top-down 16-color canvas engine with 4-direction movement (WASD / arrow keys / on-screen D-pad), bonk feedback, and 16 × 16 px tiles.
- Walkable ARPANET hub with the four 1969 nodes (UCLA, SRI, UCSB, Utah), Heilmeier's Catechism pillar, and DARPA office banners (I2O, DSO, MTO, BTO, STO, TTO).
- Story preamble shown once per run framing the quest as "ignite the Codex of Sparks."
- Per-stage Mission Brief teaching dialog that fires *before* the puzzle (teach → apply → reinforce → reward).
- Codex of Sparks pedestal in the hub center. Lights up when all six artifacts are collected. Triggers final-assembly sequence with fanfare audio (`audio.fanfare`, `audio.bigChord`), six pop-in artifact reveals, sparkle burst, and the player's name shout-out.
- Final certificate page with celebration glow, fanfare replay, focus on Play Again, and printable References.
- All seven hidden Easter eggs:
  1. Konami code on title (gold "DARPA HARD" tunic + Heilmeier's Apprentice badge)
  2. Blackboard Turing/ELIZA door (Stage 1, bonk ×3)
  3. Bombe rotor puzzle behind the vacuum tube (Stage 1, +50 + Codebreaker badge)
  4. Wandering Shakey the Robot (Stage 2)
  5. CGC bug-on-a-pedestal (Stage 4)
  6. DRC door (Stage 5)
  7. "Internet Origin" stone tablet (hub)
- Help modal with full key legend (`<kbd>` chips), reachable from the title screen and the in-game bottom bar.
- 5-minute timer toggle with friendly "Time's up!" + "keep playing untimed" path.
- Self-test harness (`selfTest()`) that runs at boot. Validates STRINGS shape, all 6 stages × 3 tiers of puzzles, hub map invariants, codex pedestal presence, and runs a keystroke-regression simulation against the name input.
- Web Audio synthesis throughout (no audio files): step, bonk, ok/no, item-get jingle, egg-get jingle, stage transition, fanfare, big chord.
- Full References modal with sources for every historical claim. Print-stylesheet strips the retro chrome.

### Constraints honored
- Single-file `index.html`. No build step.
- Fully offline after first load. No web fonts, no CDN, no fetches, no analytics.
- No tracking, no cookies, no localStorage. Session-only first name (1–12 chars).
- DARPA framed exclusively as a research agency. No defense / weapons context.
- Stylized DARPA shield (homage), not the official seal. No copyrighted character likenesses.
- Educational content is never gated behind a correct answer. Skip awards the same teaching and the same artifact.
- Accessibility: keyboard navigation everywhere, color-blind-safe palette, 16 px minimum body text, mute by default, `prefers-reduced-motion` honored.

### Fixed during development
- **Keystroke-eating bug.** The global keydown handler was calling `preventDefault()` on the letters `a`, `s`, `d`, `w` and Space unconditionally, which silently dropped them from the name input. The handler now bails out early when an `INPUT`, `TEXTAREA`, or `SELECT` is focused. A self-test simulates the regression at boot.
- **Enter / Space couldn't activate focused buttons in modals.** Same root cause. The handler no longer `preventDefault`s Enter or Space when a modal is open — the browser's native button activation handles it. `showDialog` and `showItemGet` also explicitly `.focus()` the OK button.
- **6th-artifact double-fire.** The post-puzzle dialog and item-get callbacks could in principle fire twice on a fast double-click. Both are now idempotent via a `handled` flag.
- **Pattern puzzle visual breakage.** The Stage 6 pattern puzzles were extracting the pattern by regex-parsing the prompt string, which produced cells like `["What", "comes", "next"]` instead of `["🔵","🟡","🔵","🟡"]`. Pattern puzzles now declare an explicit `sequence` field; the renderer reads it directly.
- **Codex finale was silent and abrupt.** Added a triumphant ascending arpeggio + held major chord, sparkle burst around the pedestal, and a name-aware closing line. The "View Certificate" button is hidden during the animation, then revealed and focused.

### Known limitations / roadmap
See [DEVNOTES.md](./DEVNOTES.md#roadmap-mature-improvements) for the full list. Highlights:
- Sprout/Cadet typing puzzles should become multi-choice for phone usability.
- A 30-second movement-and-interact tutorial before the hub.
- Booth idle reset (90 s no input → "Pass it on?").
- Web Speech API voiceover for Mission Briefs.
- Interactive Codex assembly (drag artifacts into chronological order) instead of cutscene.
