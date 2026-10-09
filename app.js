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

  async function autocompleteScene(t) {
    setTermScene("term");
    term.textContent = "";
    line('<span class="ps">deploy@web-1:~$</span> systemctl status app');
    line('<span class="ok">●</span> app.service - Billing API');
    line('   Active: <span class="ok">active (running)</span> since 10:41');
    await sleep(600, t);
    const row = prompt("deploy@web-1:~$");
    const cmd = row.querySelector(".cmd");
    const ghost = document.createElement("span");
    ghost.className = "ghost-sug";
    ghost.style.cssText = "color:var(--muted);opacity:0.5;";
    row.appendChild(ghost);
    for (const ch of "docker") {
      cmd.textContent += ch;
      const full = "docker ps -a";
      ghost.textContent = full.slice(cmd.textContent.length);
      await sleep(80, t);
    }
    await sleep(900, t);
    // Tab to accept
    const rest = ghost.textContent;
    ghost.textContent = "";
    for (const ch of rest) {
      cmd.textContent += ch;
      await sleep(28, t);
    }
    cmd.classList.remove("cur");
    await sleep(500, t);
    line("CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS");
    line('<span class="dim">3f8a1  nginx:latest  ...  2 days ago  Up 2 days</span>');
    await sleep(2200, t);
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
      await autocompleteScene(t);
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
  const apiFilter = api.querySelector(".api-filter");
  const apiJp = api.querySelector(".api-jp");
  const apiJpText = api.querySelector(".api-jp-text");
  const apiJpCount = api.querySelector(".api-jp-count");
  const REQUEST = '{\n  "amount": 4200,\n  "currency": "eur"\n}';
  const RESPONSE = '{\n  "id": "ch_91ax",\n  "status": "paid",\n  "card": { "brand": "visa", "last4": "4242" }\n}';
  const FILTERED = '[\n  "visa"\n]';
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
    apiFilter.classList.remove("is-on", "is-press");
    apiJp.classList.remove("is-on");
    apiJpText.textContent = "";
    apiJpCount.textContent = "";
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
    apiFilter.classList.add("is-on");
    await sleep(1400, t);
    // JSONPath filter: the corner button opens it over the response.
    apiFilter.classList.add("is-press");
    await sleep(240, t);
    apiFilter.classList.remove("is-press");
    apiJp.classList.add("is-on");
    apiJpText.classList.add("cur");
    await typeInto(apiJpText, "$.card.brand", t, 60);
    apiJpText.classList.remove("cur");
    await sleep(300, t);
    apiRes.textContent = FILTERED;
    apiJpCount.textContent = "1 match";
    await sleep(3000, t);
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

  const db = views.db;
  const dbTree = db.querySelector(".db-tree");
  const dbSql = db.querySelector(".db-sql");
  const dbComplete = db.querySelector(".db-complete");
  const dbRun = db.querySelector(".db-run");
  const dbWait = db.querySelector(".db-wait");
  const dbWaitText = db.querySelector(".db-wait-text");
  const dbRes = db.querySelector(".db-res");
  const dbGrid = db.querySelector(".db-grid");
  const dbEditNote = db.querySelector(".db-edit-note");
  const dbAsk = db.querySelector(".db-ask");
  const dbAskText = db.querySelector(".db-ask-text");
  const dbGen = db.querySelector(".db-gen");
  const dbAiBtn = db.querySelector(".db-ai-btn");
  const DB_TREE = [
    { name: "public", kind: "schema", depth: 0 },
    { name: "customers", kind: "table", depth: 1 },
    { name: "orders", kind: "table", depth: 1, open: true },
    { name: "id", kind: "col", detail: "integer PK", depth: 2 },
    { name: "customer", kind: "col", detail: "text", depth: 2 },
    { name: "total", kind: "col", detail: "numeric", depth: 2 },
    { name: "status", kind: "col", detail: "text", depth: 2 },
    { name: "payments", kind: "table", depth: 1 },
  ];
  const DB_COLS = ["id", "customer", "total", "status"];
  const DB_ROWS = [
    ["1042", "Ada Lovelace", "1 980.00", "paid"],
    ["1043", "Linus T.", "1 455.50", "paid"],
    ["1051", "Grace H.", "1 210.00", "paid"],
    ["1077", "Ken T.", "980.40", "paid"],
    ["1080", "Barbara L.", "912.00", "paid"],
  ];
  const DB_QUERY_HEAD = "SELECT id, ";
  const DB_QUERY_TAIL = ", total, status\nFROM orders\nWHERE status = 'paid'\nORDER BY total DESC;";
  const DB_AI_ASK = "top customers, last 30 days";
  const DB_AI_SQL = "SELECT customer, sum(total) AS spent\nFROM orders\nWHERE created_at > now() - interval '30 days'\nGROUP BY customer\nORDER BY spent DESC;";

  function buildDbTree() {
    dbTree.textContent = "";
    for (const n of DB_TREE) {
      const row = document.createElement("div");
      row.className = `db-node db-${n.kind}`;
      row.style.setProperty("--d", String(n.depth));
      row.innerHTML = `<span>${escapeHtml(n.name)}</span>${n.detail ? `<em>${escapeHtml(n.detail)}</em>` : ""}`;
      dbTree.appendChild(row);
    }
  }

  function dbGridRows(rows, cols = DB_COLS) {
    dbGrid.textContent = "";
    dbGrid.style.setProperty("--cols", String(cols.length));
    const head = document.createElement("div");
    head.className = "db-row db-head";
    head.innerHTML = `<span>#</span>${cols.map((c) => `<span>${escapeHtml(c)}</span>`).join("")}`;
    dbGrid.appendChild(head);
    return rows.map((r, i) => {
      const row = document.createElement("div");
      row.className = "db-row";
      row.innerHTML = `<span>${i + 1}</span>${r.map((v) => `<span>${escapeHtml(v)}</span>`).join("")}`;
      dbGrid.appendChild(row);
      return row;
    });
  }

  function dbReset() {
    buildDbTree();
    dbSql.textContent = "";
    dbSql.classList.remove("is-selected");
    dbComplete.classList.remove("is-on");
    dbWait.classList.remove("is-on");
    dbRes.classList.remove("is-on");
    dbEditNote.textContent = "";
    dbAsk.classList.remove("is-on");
    dbAskText.textContent = "";
    dbAiBtn.classList.remove("is-on");
    dbRun.classList.remove("is-press", "is-cancel");
    dbRun.innerHTML = "Run <kbd>Ctrl ↵</kbd>";
  }

  async function dbRunQuery(t, rows, cols) {
    dbRun.classList.add("is-press");
    await sleep(220, t);
    dbRun.classList.remove("is-press");
    dbRun.classList.add("is-cancel");
    dbRun.textContent = "Cancel";
    dbRes.classList.remove("is-on");
    dbWait.classList.add("is-on");
    for (const s of ["0.2", "0.6", "1.1"]) {
      dbWaitText.textContent = `Running… ${s} s`;
      await sleep(330, t);
    }
    dbWait.classList.remove("is-on");
    dbRun.classList.remove("is-cancel");
    dbRun.innerHTML = "Run <kbd>Ctrl ↵</kbd>";
    const out = dbGridRows(rows, cols);
    dbRes.classList.add("is-on");
    await reveal(out, t, 90);
    return out;
  }

  async function dbQueryScene(t) {
    dbReset();
    await sleep(500, t);
    const [, , orders] = [...dbTree.children];
    orders.classList.add("is-hover");
    await sleep(500, t);
    orders.classList.remove("is-hover");
    dbSql.classList.add("cur");
    await typeInto(dbSql, DB_QUERY_HEAD + "cus", t, 45);
    dbComplete.innerHTML = '<span class="is-sel"><b>cus</b>tomer <em>text</em></span><span><b>CU</b>RSOR</span><span><b>CU</b>RRENT_DATE</span>';
    dbComplete.classList.add("is-on");
    await sleep(900, t);
    dbComplete.classList.remove("is-on");
    dbSql.textContent = DB_QUERY_HEAD + "customer";
    await sleep(250, t);
    await typeInto(dbSql, DB_QUERY_TAIL, t, 26);
    dbSql.classList.remove("cur");
    await sleep(400, t);
    const rows = await dbRunQuery(t, DB_ROWS);
    await sleep(900, t);
    // Edit a cell, then save in one transaction.
    const cell = rows[1].children[4];
    cell.classList.add("is-editing");
    await sleep(500, t);
    cell.textContent = "refunded";
    cell.classList.remove("is-editing");
    cell.classList.add("is-edited");
    dbEditNote.textContent = "1 change · Save…";
    await sleep(1100, t);
    dbEditNote.textContent = "UPDATE … WHERE id = 1043";
    await sleep(1600, t);
    cell.classList.remove("is-edited");
    dbEditNote.textContent = "Saved · 1 row, one transaction";
    await sleep(1600, t);
  }

  async function dbAiScene(t) {
    dbReset();
    await sleep(400, t);
    dbAiBtn.classList.add("is-on");
    dbAsk.classList.add("is-on");
    await sleep(300, t);
    dbAskText.classList.add("cur");
    await typeInto(dbAskText, DB_AI_ASK, t, 40);
    dbAskText.classList.remove("cur");
    dbGen.classList.add("is-press");
    await sleep(240, t);
    dbGen.classList.remove("is-press");
    await sleep(500, t);
    dbSql.textContent = DB_AI_SQL;
    dbSql.classList.add("is-selected");
    await sleep(1200, t);
    dbSql.classList.remove("is-selected");
    await dbRunQuery(t, [["Ada Lovelace", "4 120.00"], ["Grace H.", "3 905.50"], ["Linus T.", "2 760.00"]], ["customer", "spent"]);
    await sleep(2600, t);
  }

  async function dbLoop(t) {
    for (;;) {
      await dbQueryScene(t);
      await dbAiScene(t);
    }
  }

  function dbStill() {
    dbReset();
    dbSql.textContent = DB_QUERY_HEAD + "customer" + DB_QUERY_TAIL;
    dbGridRows(DB_ROWS).forEach((r) => r.classList.add("is-on"));
    dbRes.classList.add("is-on");
  }

  const aiView = views.ai;
  const aiTyped = aiView?.querySelector(".ai-typed");
  const aiGhost = aiView?.querySelector(".ai-ghost");
  const aiPanel = aiView?.querySelector(".ai-panel");
  const aiPanelBody = aiView?.querySelector(".ai-panel-body");

  const AI_SCENARIOS = [
    {
      typed: "docker logs -f app",
      ghost: "",
      explain: "Container logs streaming.\nPress Ctrl+C to stop.",
    },
    {
      typed: "doc",
      ghost: "ker ps -a",
      explain: "Lists all containers\n(running and stopped).",
    },
    {
      typed: "systemctl restart nginx",
      ghost: "",
      explain: "Job failed: port 80 is already in use.\nCheck with: sudo ss -ltnp | grep :80",
    },
    {
      typed: "git stash",
      ghost: " pop",
      explain: "Temporarily shelves\nuncommitted changes.",
    },
    {
      typed: "kubectl get pods -n",
      ghost: " production",
      explain: "Lists all pods in the\nproduction namespace.",
    },
  ];

  async function aiScene(t) {
    for (const sc of AI_SCENARIOS) {
      if (!aiTyped || !aiGhost || !aiPanel || !aiPanelBody) break;
      aiPanel.classList.remove("is-on");
      aiTyped.textContent = "";
      aiGhost.textContent = "";
      aiPanelBody.textContent = "";
      await sleep(400, t);
      for (const ch of sc.typed) {
        aiTyped.textContent += ch;
        if (sc.ghost && aiTyped.textContent.length === sc.typed.length - sc.ghost.length + 1) {
          aiGhost.textContent = sc.ghost;
        }
        await sleep(70, t);
      }
      if (sc.ghost) {
        aiGhost.textContent = sc.ghost;
      }
      await sleep(800, t);
      if (sc.ghost) {
        aiGhost.textContent = "";
        for (const ch of sc.ghost) {
          aiTyped.textContent += ch;
          await sleep(30, t);
        }
      }
      await sleep(500, t);
      aiPanel.classList.add("is-on");
      const cursor = document.createElement("span");
      cursor.className = "ai-cursor";
      aiPanelBody.appendChild(cursor);
      for (const ch of sc.explain) {
        cursor.before(ch === "\n" ? document.createTextNode("\n") : document.createTextNode(ch));
        await sleep(28, t);
      }
      cursor.remove();
      await sleep(1800, t);
    }
  }

  async function aiLoop(t) {
    for (;;) {
      await aiScene(t);
    }
  }

  function aiStill() {
    if (!aiTyped || !aiGhost || !aiPanel || !aiPanelBody) return;
    aiTyped.textContent = "docker ps -a";
    aiGhost.textContent = "";
    aiPanel.classList.add("is-on");
    aiPanelBody.textContent = "Lists all containers\n(running and stopped).";
  }

  const loops = { terminal: terminalLoop, api: apiLoop, db: dbLoop, json: jsonLoop, ai: aiLoop };
  const stills = { terminal: terminalStill, api: apiStill, db: dbStill, json: jsonStill, ai: aiStill };

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
