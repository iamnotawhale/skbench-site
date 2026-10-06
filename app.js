const RELEASES = "https://api.github.com/repos/iamnotawhale/skhub-site/releases/latest";
const DOWNLOAD =
  "https://github.com/iamnotawhale/skhub-site/releases/latest/download/skhub_amd64.deb";

const versionEl = document.getElementById("version");
const downloadEl = document.getElementById("download");

downloadEl.href = DOWNLOAD;

async function loadLatest() {
  try {
    const res = await fetch(RELEASES, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const tag = (data.tag_name || "").replace(/^v/, "");
    if (tag && versionEl) versionEl.textContent = `v${tag}`;
  } catch {
    if (versionEl) versionEl.textContent = "latest";
  }
}

loadLatest();

(() => {
  const demo = document.querySelector(".demo");
  const pillars = document.querySelector(".pillars");
  const cards = [...document.querySelectorAll(".pillar[data-demo]")];
  if (!demo || !pillars || cards.length === 0) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const views = Object.fromEntries([...demo.querySelectorAll(".demo-view")].map((v) => [v.dataset.view, v]));
  const STOP = Symbol("stop");
  let token = null;
  let active = null;

  const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sleep = (ms, t) => new Promise((res, rej) => setTimeout(() => (t.stop ? rej(STOP) : res()), ms));

  async function typeInto(el, text, t, speed = 30) {
    for (const ch of text) {
      el.textContent += ch;
      await sleep(speed, t);
    }
  }

  async function reveal(rows, t, gap = 110) {
    for (const row of rows) {
      row.classList.add("is-on");
      await sleep(gap, t);
    }
  }

  const term = views.terminal.querySelector(".term");
  const line = (html) => {
    const el = document.createElement("span");
    el.className = "ln";
    el.innerHTML = html;
    term.appendChild(el);
    return el;
  };
  const prompt = (who) => line(`<span class="ps">${who}</span> <span class="cmd cur"></span>`);

  const termView = views.terminal;
  const termTitle = termView.querySelector(".demo-bar span");
  const syncBox = termView.querySelector(".sync");
  const syncNote = termView.querySelector(".sync-note");
  const syncNodes = [...termView.querySelectorAll(".node")];
  const syncLines = (node) => [...node.querySelectorAll(".node-line")];
  const syncChip = termView.querySelector(".node-chip");
  const wires = [...termView.querySelectorAll(".wire")];

  function setTermScene(scene) {
    term.classList.toggle("is-on", scene === "term");
    syncBox.classList.toggle("is-on", scene === "sync");
    termTitle.textContent = scene === "term" ? "web-1 · ssh" : "Encrypted sync";
  }

  async function sessionScene(t) {
    setTermScene("term");
    term.textContent = "";
    const first = prompt("you@laptop:~$");
    await typeInto(first.querySelector(".cmd"), "ssh deploy@web-1", t);
    first.querySelector(".cmd").classList.remove("cur");
    await sleep(450, t);
    line('<span class="dim">Welcome to Ubuntu 22.04.5 LTS</span>');
    await sleep(380, t);
    const second = prompt("deploy@web-1:~$");
    await typeInto(second.querySelector(".cmd"), "systemctl status app", t);
    second.querySelector(".cmd").classList.remove("cur");
    await sleep(320, t);
    line('<span class="ok">●</span> app.service - Billing API');
    line('   Active: <span class="ok">active (running)</span> since 10:41');
    await sleep(700, t);
    const third = prompt("deploy@web-1:~$");
    await typeInto(third.querySelector(".cmd"), "tail -f app.log", t);
    third.querySelector(".cmd").classList.remove("cur");
    for (const row of ["10:41:07 GET  /health          200", "10:41:09 POST /v1/charges     201", "10:41:12 GET  /v1/charges/91  200"]) {
      await sleep(650, t);
      line(`<span class="dim">${row}</span>`);
    }
    await sleep(2200, t);
  }

  function syncReset() {
    for (const node of syncNodes) {
      node.classList.remove("is-lit");
      for (const row of syncLines(node)) row.classList.remove("is-on");
    }
    syncChip.classList.remove("is-on");
    syncNote.classList.remove("is-on");
    for (const wire of wires) wire.classList.remove("go");
  }

  function say(text) {
    syncNote.classList.remove("is-on");
    syncNote.textContent = text;
    syncNote.classList.add("is-on");
  }

  async function send(wire, t) {
    wire.classList.remove("go");
    void wire.offsetWidth;
    wire.classList.add("go");
    await sleep(950, t);
  }

  async function syncScene(t) {
    setTermScene("sync");
    syncReset();
    const [laptop, server, desk] = syncNodes;
    laptop.classList.add("is-lit");
    const mine = syncLines(laptop);
    await sleep(500, t);
    say("Hosts, snippets and history live in an encrypted local catalog");
    await reveal(mine.slice(0, 2), t, 220);
    await sleep(700, t);
    say("Edit a host on one machine…");
    await reveal(mine.slice(2), t, 300);
    await sleep(700, t);
    say("…it is encrypted on the laptop before it leaves");
    syncChip.classList.add("is-on");
    await sleep(1100, t);
    await send(wires[0], t);
    laptop.classList.remove("is-lit");
    server.classList.add("is-lit");
    say("The sync server only ever sees ciphertext");
    await reveal(syncLines(server), t, 200);
    await sleep(1300, t);
    await send(wires[1], t);
    server.classList.remove("is-lit");
    desk.classList.add("is-lit");
    say("Decrypted only on your other machine");
    await reveal(syncLines(desk), t, 260);
    await sleep(2600, t);
  }

  async function terminalLoop(t) {
    for (;;) {
      await sessionScene(t);
      await syncScene(t);
    }
  }

  function terminalStill() {
    setTermScene("term");
    term.textContent = "";
    line('<span class="ps">you@laptop:~$</span> ssh deploy@web-1');
    line('<span class="dim">Welcome to Ubuntu 22.04.5 LTS</span>');
    line('<span class="ps">deploy@web-1:~$</span> systemctl status app');
    line('<span class="ok">●</span> app.service - Billing API');
    line('   Active: <span class="ok">active (running)</span> since 10:41');
  }

  const api = views.api;
  const apiPick = api.querySelector(".api-pick");
  const apiEditor = api.querySelector(".api-editor");
  const treeView = api.querySelector(".tree-view");
  const treeList = api.querySelector(".tree-list");
  const apiPath = api.querySelector(".api-path");
  const apiReq = api.querySelector(".api-req");
  const apiStatus = api.querySelector(".api-status");
  const apiRes = api.querySelector(".api-res");
  const apiSend = api.querySelector(".api-send");
  const REQUEST = '{\n  "amount": 4200,\n  "currency": "eur"\n}';
  const RESPONSE = '{\n  "id": "ch_91ax",\n  "status": "paid"\n}';
  const STATUS = "<b>201 Created</b><span>142 ms · 96 B</span>";
  const TREE = [
    { group: "Payments API", count: 4, depth: 0 },
    { group: "Refunds", count: 2, depth: 1 },
    { method: "POST", label: "Refund order", depth: 2 },
    { method: "GET", label: "Refund status", depth: 2 },
    { method: "POST", label: "Charge card", depth: 1, target: true },
    { method: "GET", label: "List charges", depth: 1 },
    { group: "Users", count: 47, depth: 0 },
    { method: "GET", label: "List users", depth: 1 },
    { method: "DEL", label: "Delete user", depth: 1 },
    { method: "PTCH", label: "Patch user", depth: 1 },
    { group: "Orders", count: 12, depth: 0 },
    { method: "GET", label: "List orders", depth: 1 },
    { method: "POST", label: "Create order", depth: 1 },
    { method: "PUT", label: "Update order", depth: 1 },
    { group: "Webhooks", count: 5, depth: 0 },
    { method: "POST", label: "Register hook", depth: 1 },
  ];

  function buildTree() {
    treeList.textContent = "";
    return TREE.map((item) => {
      const row = document.createElement("div");
      row.style.setProperty("--d", String(item.depth));
      if (item.group) {
        row.className = "t-row t-group";
        row.innerHTML = `<span>${escapeHtml(item.group)}</span><span class="cnt">${item.count}</span>`;
      } else {
        row.className = "t-row t-req";
        row.innerHTML = `<span class="m m-${item.method.toLowerCase()}">${item.method}</span><span>${escapeHtml(item.label)}</span>`;
      }
      treeList.appendChild(row);
      return row;
    });
  }

  function setApiScene(scene) {
    apiPick.classList.toggle("is-on", scene === "pick");
    apiEditor.classList.toggle("is-on", scene === "send");
  }

  function apiClear() {
    apiPath.textContent = "";
    apiReq.textContent = "";
    apiRes.textContent = "";
    apiStatus.innerHTML = "";
    apiStatus.classList.remove("is-on");
    apiRes.classList.remove("is-on");
    apiSend.classList.remove("is-press");
  }

  function scrollTree(offset, seconds) {
    treeList.style.transition = seconds ? `transform ${seconds}s cubic-bezier(0.45, 0, 0.25, 1)` : "none";
    treeList.style.transform = `translateY(${-offset}px)`;
  }

  async function pickScene(t) {
    setApiScene("pick");
    const rows = buildTree();
    const target = rows.findIndex((_, i) => TREE[i].target);
    scrollTree(0, 0);
    await sleep(700, t);
    const reach = Math.max(0, treeList.offsetHeight - treeView.clientHeight + 8);
    scrollTree(reach, 1.6);
    await sleep(2000, t);
    scrollTree(0, 1.2);
    await sleep(1500, t);
    for (let i = 1; i <= target; i += 1) {
      rows[i].classList.add("is-hover");
      await sleep(120, t);
      if (i < target) rows[i].classList.remove("is-hover");
    }
    await sleep(300, t);
    rows[target].classList.remove("is-hover");
    rows[target].classList.add("is-active");
    await sleep(800, t);
  }

  async function sendScene(t) {
    setApiScene("send");
    apiClear();
    apiPath.classList.add("cur");
    await typeInto(apiPath, "{{base_url}}/v1/charges", t, 34);
    apiPath.classList.remove("cur");
    await sleep(300, t);
    apiReq.classList.add("cur");
    await typeInto(apiReq, REQUEST, t, 22);
    apiReq.classList.remove("cur");
    await sleep(500, t);
    apiSend.classList.add("is-press");
    await sleep(260, t);
    apiSend.classList.remove("is-press");
    await sleep(250, t);
    apiStatus.innerHTML = STATUS;
    apiStatus.classList.add("is-on");
    await sleep(300, t);
    apiRes.textContent = RESPONSE;
    apiRes.classList.add("is-on");
    await sleep(3200, t);
  }

  async function apiLoop(t) {
    for (;;) {
      await pickScene(t);
      await sendScene(t);
    }
  }

  function apiStill() {
    setApiScene("send");
    apiClear();
    apiPath.textContent = "{{base_url}}/v1/charges";
    apiReq.textContent = REQUEST;
    apiStatus.innerHTML = STATUS;
    apiStatus.classList.add("is-on");
    apiRes.textContent = RESPONSE;
    apiRes.classList.add("is-on");
  }

  const json = views.json;
  const left = json.querySelector('[data-side="left"]');
  const right = json.querySelector('[data-side="right"]');
  const result = json.querySelector(".cmp-result");
  const fmtBox = json.querySelector(".fmt");
  const cmpBox = json.querySelector(".cmp");
  const fmtPane = json.querySelector(".fmt-pane");
  const beautifyBtn = json.querySelector('[data-btn="beautify"]');
  const tabs = [...json.querySelectorAll(".mode-tabs span")];
  const LEFT = ["{", '  "id": 42,', '  "tags": ["a", "b"],', '  "paid": true', "}"];
  const SAME = ["{", '  "paid": true,', '  "tags": ["a", "b"],', '  "id": 42', "}"];
  const EDITED = ["{", '  "paid": false,', '  "tags": ["a", "b"],', '  "id": 42,', '  "note": "late"', "}"];
  const IDENTICAL = '<span class="good">✓ Logically identical</span> <span class="muted">key order does not matter</span>';
  const DIFFERENT = '<span class="path">2 differences</span> <span class="muted">$.paid changed · $.note added</span>';
  const MINIFIED = '<order id="42"><item sku="A1">Tea</item><item sku="B2">Cup</item><item sku="C3">Jam</item></order>';
  const PRETTY = ['<order id="42">', '  <item sku="A1">Tea</item>', '  <item sku="B2">Cup</item>', '  <item sku="C3">Jam</item>', "</order>"];

  const wrap = (cls, text) => `<span class="${cls}">${escapeHtml(text)}</span>`;

  function highlight(text) {
    const tag = /(<\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)(\s*\/?>)/g;
    let out = "";
    let last = 0;
    for (const m of text.matchAll(tag)) {
      out += escapeHtml(text.slice(last, m.index)) + wrap("t-punc", m[1]) + wrap("t-tag", m[2]);
      for (const part of m[3].matchAll(/(\s+)([\w:-]+)(=)("[^"]*")/g)) {
        out += escapeHtml(part[1]) + wrap("t-attr", part[2]) + wrap("t-punc", part[3]) + wrap("t-val", part[4]);
      }
      out += wrap("t-punc", m[4]);
      last = m.index + m[0].length;
    }
    return out + escapeHtml(text.slice(last));
  }

  function setMode(mode) {
    for (const tab of tabs) tab.classList.toggle("is-on", tab.dataset.tab === mode);
    fmtBox.classList.toggle("is-on", mode === "format");
    cmpBox.classList.toggle("is-on", mode === "compare");
  }

  function paint(pane, lines, marks = {}) {
    pane.textContent = "";
    lines.forEach((text, i) => {
      const el = document.createElement("span");
      el.className = `ln${marks[i] ? ` ${marks[i]}` : ""}`;
      el.textContent = text;
      pane.appendChild(el);
    });
    return [...pane.children];
  }

  function prettyRows() {
    fmtPane.textContent = "";
    return PRETTY.map((text) => {
      const el = document.createElement("span");
      el.className = "ln";
      el.innerHTML = highlight(text);
      fmtPane.appendChild(el);
      return el;
    });
  }

  async function formatScene(t) {
    setMode("format");
    fmtPane.textContent = "";
    beautifyBtn.classList.remove("is-press");
    await sleep(350, t);
    await typeInto(fmtPane, MINIFIED, t, 14);
    fmtPane.innerHTML = `<span class="ln flat is-on">${highlight(MINIFIED)}</span>`;
    await sleep(800, t);
    beautifyBtn.classList.add("is-press");
    await sleep(260, t);
    beautifyBtn.classList.remove("is-press");
    await sleep(220, t);
    await reveal(prettyRows(), t, 95);
    await sleep(2200, t);
  }

  async function compareScene(t) {
    setMode("compare");
    result.classList.remove("is-on");
    const l = paint(left, LEFT);
    const r = paint(right, SAME);
    await sleep(500, t);
    await reveal(l, t);
    await reveal(r, t);
    await sleep(500, t);
    result.innerHTML = IDENTICAL;
    result.classList.add("is-on");
    await sleep(2000, t);
    result.classList.remove("is-on");
    await sleep(250, t);
    paint(right, EDITED, { 1: "changed", 4: "added" }).forEach((row) => row.classList.add("is-on"));
    paint(left, LEFT, { 3: "changed" }).forEach((row) => row.classList.add("is-on"));
    await sleep(500, t);
    result.innerHTML = DIFFERENT;
    result.classList.add("is-on");
    await sleep(3200, t);
  }

  async function jsonLoop(t) {
    for (;;) {
      await formatScene(t);
      await compareScene(t);
    }
  }

  function jsonStill() {
    setMode("compare");
    paint(left, LEFT, { 3: "changed" }).forEach((row) => row.classList.add("is-on"));
    paint(right, EDITED, { 1: "changed", 4: "added" }).forEach((row) => row.classList.add("is-on"));
    result.innerHTML = DIFFERENT;
    result.classList.add("is-on");
  }

  const loops = { terminal: terminalLoop, api: apiLoop, json: jsonLoop };
  const stills = { terminal: terminalStill, api: apiStill, json: jsonStill };

  function activate(name) {
    if (active === name) return;
    if (token) token.stop = true;
    active = name;
    for (const [key, el] of Object.entries(views)) el.classList.toggle("is-on", key === name);
    for (const card of cards) card.classList.toggle("is-demo", card.dataset.demo === name);
    if (!name) return;
    token = { stop: false };
    if (reduced) {
      stills[name]();
      return;
    }
    loops[name](token).catch((e) => {
      if (e !== STOP) throw e;
    });
  }

  for (const card of cards) {
    card.addEventListener("mouseenter", () => activate(card.dataset.demo));
    card.addEventListener("focusin", () => activate(card.dataset.demo));
  }
  pillars.addEventListener("mouseleave", () => {
    if (!pillars.contains(document.activeElement)) activate(null);
  });
  pillars.addEventListener("focusout", (e) => {
    if (!pillars.contains(e.relatedTarget)) activate(null);
  });
})();
