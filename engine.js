/* Family Day Quest — engine
 * Tiny scene-graph adventure engine. No build step, no deps.
 * Renders into #stage; scenes are functions registered via Game.scene(id, fn).
 */
(function () {
  "use strict";

  const SAVE_KEY = "familyDayQuest:v1";

  const TIERS = [
    {
      id: "sprout",
      glyph: "🌱",
      name: "Sprout",
      ageRange: "ages 6–9",
      blurb: "Big pictures, small steps. The wisest path for tiny adventurers.",
      readingLevel: 1,
    },
    {
      id: "apprentice",
      glyph: "🧙",
      name: "Apprentice",
      ageRange: "ages 10–13",
      blurb: "Real terms, real puzzles. Robes and hats not required.",
      readingLevel: 2,
    },
    {
      id: "mage",
      glyph: "⚔️",
      name: "Mage",
      ageRange: "ages 14–16",
      blurb: "Multi-step trials and trickier traps. Bring your wits.",
      readingLevel: 3,
    },
    {
      id: "sage",
      glyph: "📜",
      name: "Sage",
      ageRange: "adults",
      blurb: "Deep lore footnotes and the actual technical bits.",
      readingLevel: 4,
    },
  ];

  const DEFAULT_STATS = {
    curiosity: 3,
    logic: 3,
    creativity: 3,
    courage: 3,
  };

  const QUESTS = [
    { id: "tool-forge", glyph: "🛠️", title: "The Tool Forge", concept: "Tools & Functions",
      blurb: "Equip the AI sprite Spark with the right tools to help villagers." },
    { id: "mcp-bridge", glyph: "🌉", title: "The MCP Bridge", concept: "Model Context Protocol",
      blurb: "Connect your agent to the data towers without breaking the seals." },
    { id: "goblin-riddle", glyph: "👺", title: "The Goblin's Riddle", concept: "Prompts & Instructions",
      blurb: "Instruct a literal-minded goblin. Words matter. A lot." },
    { id: "agents-plan", glyph: "🐉", title: "The Agent's Plan", concept: "Agentic Planning",
      blurb: "Plan a multi-step caper to recover the dragon's stolen library." },
    { id: "openclaw", glyph: "🜲", title: "The OpenClaw Sanctuary", concept: "Open Multi-Agent Systems",
      blurb: "Coordinate a fellowship of specialist agents. The capstone trial." },
  ];

  const SCENES = {};
  let state = null;

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) { /* private-mode etc — ignore */ }
  }

  function freshState() {
    return {
      hero: null,
      tier: null,
      stats: { ...DEFAULT_STATS },
      xp: 0,
      flags: {},
      quests: {},
      lastDice: null,
      visited: [],
    };
  }

  function tier() { return TIERS.find(t => t.id === state.tier) || TIERS[1]; }
  function readingLevel() { return tier().readingLevel; }

  /* Pick variant text by reading level. Accepts either a string or
   * an object like { 1: "...", 2: "...", default: "..." }. */
  function pick(variants) {
    if (typeof variants === "string") return variants;
    if (variants == null) return "";
    const lvl = readingLevel();
    if (variants[lvl] != null) return variants[lvl];
    // Walk down: 4→3→2→1, then up
    for (let l = lvl - 1; l >= 1; l--) if (variants[l] != null) return variants[l];
    for (let l = lvl + 1; l <= 4; l++) if (variants[l] != null) return variants[l];
    if (variants.default != null) return variants.default;
    return "";
  }

  function rollD20() {
    const result = 1 + Math.floor(Math.random() * 20);
    state.lastDice = result;
    animateDice(result);
    return result;
  }

  function animateDice(value) {
    const tray = document.getElementById("dice-tray");
    const die = document.getElementById("dice");
    if (!tray || !die) return;
    tray.classList.remove("hidden");
    tray.classList.add("rolling");
    let frame = 0;
    const tumbleId = setInterval(() => {
      die.textContent = String(1 + Math.floor(Math.random() * 20));
      frame++;
      if (frame >= 8) {
        clearInterval(tumbleId);
        die.textContent = String(value);
        setTimeout(() => tray.classList.remove("rolling"), 260);
      }
    }, 70);
  }

  function gainXP(n, reason) {
    state.xp += n;
    save();
    updateHud();
    if (reason) toast(`+${n} XP — ${reason}`);
  }

  function bumpStat(stat, n) {
    state.stats[stat] = Math.min(10, (state.stats[stat] || 0) + n);
    save();
  }

  function setFlag(key, value = true) { state.flags[key] = value; save(); }
  function flag(key) { return !!state.flags[key]; }

  function markQuestDone(id) {
    state.quests[id] = { done: true, finishedAt: Date.now() };
    save();
  }
  function questDone(id) { return state.quests[id] && state.quests[id].done; }

  function questsCompleted() {
    return QUESTS.filter(q => questDone(q.id)).length;
  }

  function go(sceneId, params) {
    if (!SCENES[sceneId]) {
      console.error("Unknown scene:", sceneId);
      return;
    }
    state.visited.push(sceneId);
    save();
    render(sceneId, params || {});
  }

  function render(sceneId, params) {
    const stage = document.getElementById("stage");
    stage.innerHTML = "";
    const node = SCENES[sceneId](params);
    if (node instanceof Node) stage.appendChild(node);
    else if (typeof node === "string") stage.innerHTML = node;
    updateHud();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (k === "html") node.innerHTML = v;
        else if (v === true) node.setAttribute(k, "");
        else if (v != null && v !== false) node.setAttribute(k, v);
      }
    }
    for (const child of children) {
      if (child == null || child === false) continue;
      if (Array.isArray(child)) child.forEach(c => c && node.appendChild(c instanceof Node ? c : document.createTextNode(String(c))));
      else node.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function scene(opts) {
    /* opts: { title, lede, body: [Node|string|fn], choices: [{label, hint, onPick, requires, roll}] } */
    const root = el("section", { class: "scene" });
    if (opts.title) {
      root.appendChild(el("h1", null, opts.title));
    }
    if (opts.lede) {
      root.appendChild(el("p", { class: "lede" }, opts.lede));
    }
    if (Array.isArray(opts.body)) {
      for (const part of opts.body) {
        if (part == null) continue;
        if (typeof part === "string") {
          const p = el("p", { html: part });
          root.appendChild(p);
        } else if (part instanceof Node) {
          root.appendChild(part);
        }
      }
    }
    if (Array.isArray(opts.choices) && opts.choices.length) {
      const wrap = el("div", { class: "choices" });
      for (const c of opts.choices) {
        if (c.requires && !c.requires()) continue;
        const btn = el("button", {
          class: "choice",
          onclick: () => {
            if (c.roll) {
              const r = rollD20();
              setTimeout(() => c.onPick && c.onPick(r), 700);
            } else {
              c.onPick && c.onPick();
            }
          },
        }, c.label);
        if (c.hint) btn.appendChild(el("span", { class: "roll-hint" }, c.hint));
        wrap.appendChild(btn);
      }
      root.appendChild(wrap);
    }
    return root;
  }

  function lore({ title, body, code }) {
    const node = el("div", { class: "lore" },
      el("div", { class: "lore-title" }, title || "Lore Scroll"),
      el("div", { class: "lore-body", html: body || "" }),
    );
    if (code) {
      const pre = el("pre", { style: { whiteSpace: "pre-wrap", margin: "8px 0 0", fontSize: "13px" } }, code);
      node.appendChild(pre);
    }
    return node;
  }

  function speaker(name, text, kind) {
    const cls = "speaker" + (kind ? " " + kind : "");
    return el("p", null,
      el("span", { class: cls }, name + ":"),
      " ",
      document.createTextNode(text),
    );
  }

  function toast(text) {
    const t = el("div", { style: {
      position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
      background: "rgba(43,29,18,0.92)", color: "#f7ecd2", padding: "8px 16px",
      borderRadius: "8px", fontFamily: "var(--display)", letterSpacing: "0.06em",
      fontSize: "14px", zIndex: 200, opacity: "0", transition: "opacity 0.25s",
    } }, text);
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; });
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 350); }, 2400);
  }

  function updateHud() {
    if (!state || !state.hero) {
      document.getElementById("topbar").hidden = true;
      return;
    }
    document.getElementById("topbar").hidden = false;
    document.getElementById("hud-hero").textContent = `${tier().glyph} ${state.hero}`;
    document.getElementById("hud-tier").textContent = tier().name;
    document.getElementById("hud-xp").textContent = `⭐ ${state.xp} XP`;
  }

  function openSheet() {
    const body = document.getElementById("sheet-body");
    body.innerHTML = "";
    body.appendChild(el("p", null,
      `Hero of the realm: `,
      el("strong", null, state.hero),
      ` · `, el("em", null, tier().name),
    ));
    body.appendChild(el("p", null, `XP earned: ⭐ ${state.xp}`));
    const stats = state.stats;
    const order = ["curiosity", "logic", "creativity", "courage"];
    const labels = { curiosity: "Curiosity 🔍", logic: "Logic 🧮", creativity: "Creativity 🎨", courage: "Courage 🛡️" };
    for (const k of order) {
      const row = el("div", { class: "stat-row" },
        el("span", null, labels[k]),
        el("span", null,
          `${stats[k]} `,
          el("span", { class: "stat-bar" }, el("span", { class: "fill", style: { width: `${(stats[k]/10)*100}%` } })),
        ),
      );
      body.appendChild(row);
    }
    const completed = questsCompleted();
    body.appendChild(el("p", null,
      `Quests completed: `, el("strong", null, `${completed} / ${QUESTS.length}`),
    ));
    document.getElementById("sheet").classList.remove("hidden");
  }

  function closeSheet() { document.getElementById("sheet").classList.add("hidden"); }

  function reset() {
    if (!confirm("Start a new adventure? Your current progress will be lost.")) return;
    localStorage.removeItem(SAVE_KEY);
    state = freshState();
    save();
    go("start");
  }

  function boot() {
    state = loadSave() || freshState();

    document.getElementById("sheet-close").addEventListener("click", closeSheet);
    document.getElementById("hud-sheet").addEventListener("click", openSheet);
    document.getElementById("hud-reset").addEventListener("click", reset);
    document.getElementById("sheet").addEventListener("click", (e) => {
      if (e.target.id === "sheet") closeSheet();
    });

    if (state.hero && state.tier) {
      go("hub");
    } else {
      go("start");
    }
  }

  // Public API
  window.Game = {
    boot,
    scene(id, fn) { SCENES[id] = fn; },
    go,
    el,
    sceneNode: scene,
    lore,
    speaker,
    pick,
    rollD20,
    gainXP,
    bumpStat,
    setFlag,
    flag,
    markQuestDone,
    questDone,
    questsCompleted,
    state: () => state,
    tier,
    tiers: () => TIERS,
    quests: () => QUESTS,
    save,
    setHero(name, tierId) {
      state.hero = name;
      state.tier = tierId;
      save();
    },
    toast,
    reset,
  };
})();
