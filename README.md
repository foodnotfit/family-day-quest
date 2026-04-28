# Quest for DARPA — The Legend of Jason CIO

A single-file, retro top-down web game that walks kids and their parents through ~75 years of AI history in about five minutes. Built for a family-day booth.

> **Play it:** https://&lt;your-github-username&gt;.github.io/family-day-quest/
> *(Replace with your real URL once GitHub Pages is enabled — see [Deploy](#deploy-to-github-pages) below.)*

![Style](https://img.shields.io/badge/style-retro%20top--down-yellow)
![Tech](https://img.shields.io/badge/single--file-html%20css%20js-blue)
![Offline](https://img.shields.io/badge/offline-ready-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## What it is

Jason CIO is a top-down pixel-art adventurer. The player names him, picks a tunic color, and steps into the **ARPANET hub**. From the hub, six glowing portals lead to short stages — one per era of AI history. Each stage teaches a few facts, then asks the kid to apply them in a puzzle scaled to their age tier (Sprout 5–7, Cadet 8–10, Operative 11–14). Solving the puzzle unlocks one of six artifacts. Bring all six back to the **Codex of Sparks** in the middle of the hub, ignite it, and you've finished the quest.

- Six stages: The Spark → First Words → The Long Winter → The Comeback → The Grand Challenge → The Age of Models.
- Three age tiers + a Family Co-op toggle for always-on hints.
- Seven hidden Easter eggs (see below).
- A 5-minute timer (toggle).
- A printable References screen with verifiable sources for every historical claim.
- Sound off by default. `prefers-reduced-motion` respected. Keyboard, touch, and mouse all supported.

---

## Quick play

| Action | Keyboard | Touch |
|---|---|---|
| Move | `←` `↑` `↓` `→` or `W` `A` `S` `D` | On-screen D-pad |
| Interact / continue | `Space` or `Enter` | The yellow `A` button |
| Pause | `Esc`, or the ⏸ button | ⏸ button |
| Mute | The 🔇 button in the HUD | Same |

The whole flow: **Title → Tier → Hero setup (name + tunic) → Timer toggle → ARPANET hub → 6 stages → Codex assembly → Certificate.**

---

## Stages and what they teach

| # | Stage | Era | Anchor fact (taught in stage) |
|---|---|---|---|
| 1 | The Spark | 1940s–1950s | Turing's 1950 paper. The 1956 Dartmouth workshop names "AI". Vacuum tubes. |
| 2 | First Words | 1960s–early 1970s | ELIZA (MIT, 1966). ARPANET's 4 nodes (1969). |
| 3 | The Long Winter | Late 1970s–1980s | Lighthill 1973. Expert systems. MYCIN. |
| 4 | The Comeback | 1990s | Deep Blue beats Kasparov, May 1997. DART (1991 Gulf War). |
| 5 | The Grand Challenge | 2000s–early 2010s | DARPA Grand Challenges (2004/2005/2007). ImageNet 2009. AlexNet 2012. |
| 6 | The Age of Models | Mid-2010s–today | AlphaGo 2016. "Attention Is All You Need" 2017. Modern LLMs and agents. |

Each stage awards an artifact: Turing Tape → ELIZA Scroll → Rule Compass → Deep Blue Shard → Grand Challenge Key → Transformer Crystal. All six light up the Codex of Sparks.

---

## Easter eggs

There are **eight** hidden secrets. The final certificate counts how many the player found. Public hints (no full spoilers in case a kid reads the README):

1. **Konami's whisper.** A famous old code, entered on the title screen. Unlocks a gold "DARPA HARD" tunic and a Heilmeier's Apprentice badge.
2. **Bonk the blackboard.** Stage 1. There's a chalk-covered blackboard. Walk into it — repeatedly. Something opens up.
3. **Behind the vacuum tube.** Stage 1. A glowing tube hides a tiny rotor puzzle (set 3 numbers that multiply to 60). +50 points and a Codebreaker badge.
4. **A wandering robot.** Stage 2. Shakey (SRI, 1966–1972, ARPA-funded) takes a step every second. Catch up to him and press Space.
5. **A bug on a pedestal.** Stage 4. References the 2016 DARPA Cyber Grand Challenge at DEF CON 24.
6. **The DRC door.** Stage 5. The 2015 DARPA Robotics Challenge finals.
7. **A weathered stone tablet.** The hub. "1969. Four nodes. One idea. Everything else followed."
8. **A hidden archway.** Tucked into the side of the hub. A glowing magenta doorway you might walk past without noticing — but step inside for a nice little surprise.

Implementation locations and exact triggers are in [`DEVNOTES.md`](./DEVNOTES.md).

---

## Deploy to GitHub Pages

The whole game is one file — `index.html` — with no build step.

1. **Create a public GitHub repo** (e.g., `family-day-quest`) and push these files to the `main` branch.
2. **Repo → Settings → Pages → Source:** *Deploy from a branch*. Select `main` and `/ (root)`. **Save.**
3. **Wait** ~60 seconds for the green check, then visit `https://<your-username>.github.io/family-day-quest/`.
4. **Test** once on a phone (≥375 px wide) and once on a kiosk laptop. Done.

`.nojekyll` is included so GitHub Pages serves the file as-is without preprocessing. No CI, no workflow, no build.

---

## Local development

It's one HTML file. Open it in a browser.

```sh
# macOS
open index.html

# Or serve locally so audio context unlock behaves the same as on Pages
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Edit `index.html` directly. The `STRINGS` object near the top (around line 1010) holds every user-facing string, including the per-stage Mission Briefs and the closing Codex line — change copy there in one place.

A self-test runs at boot. Open the browser console and you should see:

```
Quest for DARPA — self-test passed ✓ (18 puzzles, 19 hub objects, keystroke handler clean)
```

If anything fails, an amber banner appears at the top of the page and the failures are logged to the console.

---

## File structure

```
family-day-quest/
├── index.html       ← the entire game (HTML + CSS + JS)
├── README.md        ← this file (public-facing)
├── DEVNOTES.md      ← implementation guide for agents and contributors
├── CHANGELOG.md     ← release notes
├── LICENSE          ← MIT
└── .nojekyll        ← tells GitHub Pages to serve raw (no Jekyll preprocessing)
```

Nothing else. No `node_modules`, no bundler, no asset folder.

---

## Constraints honored

- **Single file.** All HTML, CSS, and JS embedded in `index.html`.
- **Fully offline.** Zero network calls after first load. No web fonts. No fetches. No CDN scripts.
- **No tracking.** No cookies. No `localStorage`. No analytics. Session-only first name (1–12 chars).
- **No defense framing.** DARPA is presented as a research agency that funded the internet, autonomous vehicles, GPS, voice recognition, and AI. The only "weapon" is Jason CIO's stylus-sword (it bonks walls).
- **No copyrighted likenesses.** The stylized DARPA shield is a homage, not the official seal. No Mario / Pikachu / Link.
- **Educational content is never gated.** Skipping a puzzle still teaches the lesson and awards the artifact.
- **Accessibility.** Keyboard navigation everywhere, color-blind-safe palette, 16 px minimum body text, mute by default, `prefers-reduced-motion` honored.

---

## Credits and references

Sources for every historical claim are in the in-game **References** screen (reachable from the title, pause, and final screens) and are also browsable below. Built for a family-day booth in 2026.

A non-exhaustive list — the full version with full citations is in the game:

- Turing, A. M. (1950). *Computing Machinery and Intelligence.* Mind, 59(236), 433–460.
- McCarthy, Minsky, Rochester, Shannon (1955). *A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence.*
- Weizenbaum, J. (1966). *ELIZA — A Computer Program for the Study of Natural Language Communication Between Man and Machine.* CACM 9(1), 36–45.
- Lighthill, J. (1973). *Artificial Intelligence: A General Survey.* SRC (UK).
- Buchanan, B. G., & Shortliffe, E. H. (1984). *Rule-Based Expert Systems: The MYCIN Experiments.*
- IBM Research. *Deep Blue.* (1997.)
- DARPA. *Grand Challenge* (2004, 2005, 2007).
- Krizhevsky, Sutskever, Hinton (2012). *ImageNet Classification with Deep Convolutional Neural Networks.* (AlexNet)
- Russakovsky et al. (2015). *ImageNet Large Scale Visual Recognition Challenge.*
- Silver et al. (2016). *Mastering the game of Go with deep neural networks and tree search.* Nature 529.
- Vaswani et al. (2017). *Attention Is All You Need.* NeurIPS.
- Roland & Shiman (2002). *Strategic Computing: DARPA and the Quest for Machine Intelligence, 1983–1993.* MIT Press.
- Heilmeier, G. H. *Heilmeier's Catechism* (the eight questions).
- Leiner et al. (1997). *Brief History of the Internet.* Internet Society.
- Engelbart, D. (1968). *The Mother of All Demos.* Fall Joint Computer Conference.
- SRI International. *Shakey the Robot* (1966–1972).
- DARPA. *Cyber Grand Challenge* (DEF CON 24, 2016).
- DARPA. *Robotics Challenge* (DRC Finals, June 2015, Pomona, CA).

---

## License

[MIT](./LICENSE). Build it, fork it, run it at your own school's family day. If you ship a fork, please don't claim Anthropic, DARPA, or the people referenced here have endorsed it.
