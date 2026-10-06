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

  const sleep = (ms, t) => new Promise((res, rej) => setTimeout(() => (t.stop ? rej(STOP) : res()), ms));

  async function typeInto(el, text, t, speed = 30) {
    for (const ch of text) {
      el.textContent += ch;
      await sleep(speed, t);
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

  async function terminalLoop(t) {
    for (;;) {
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
      await sleep(2600, t);
    }
  }

  function terminalStill() {
    term.textContent = "";
    line('<span class="ps">you@laptop:~$</span> ssh deploy@web-1');
    line('<span class="dim">Welcome to Ubuntu 22.04.5 LTS</span>');
    line('<span class="ps">deploy@web-1:~$</span> systemctl status app');
    line('<span class="ok">●</span> app.service - Billing API');
    line('   Active: <span class="ok">active (running)</span> since 10:41');
  }

  const api = views.api;
  const apiPath = api.querySelector(".api-path");
  const apiReq = api.querySelector(".api-req");
  const apiStatus = api.querySelector(".api-status");
  const apiRes = api.querySelector(".api-res");
  const apiSend = api.querySelector(".api-send");
  const REQUEST = '{\n  "amount": 4200,\n  "currency": "eur"\n}';
  const RESPONSE = '{\n  "id": "ch_91ax",\n  "status": "paid"\n}';
  const STATUS = "<b>201 Created</b><span>142 ms · 96 B</span>";

  function apiClear() {
    apiPath.textContent = "";
    apiReq.textContent = "";
    apiRes.textContent = "";
    apiStatus.innerHTML = "";
    apiStatus.classList.remove("is-on");
    apiRes.classList.remove("is-on");
    apiSend.classList.remove("is-press");
  }

  async function apiLoop(t) {
    for (;;) {
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
  }

  function apiStill() {
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
  const LEFT = ["{", '  "id": 42,', '  "tags": ["a", "b"],', '  "paid": true', "}"];
  const SAME = ["{", '  "paid": true,', '  "tags": ["a", "b"],', '  "id": 42', "}"];
  const EDITED = ["{", '  "paid": false,', '  "tags": ["a", "b"],', '  "id": 42,', '  "note": "late"', "}"];
  const IDENTICAL = '<span class="good">✓ Logically identical</span> <span class="muted">key order does not matter</span>';
  const DIFFERENT = '<span class="path">2 differences</span> <span class="muted">$.paid changed · $.note added</span>';

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

  async function reveal(rows, t, gap = 110) {
    for (const row of rows) {
      row.classList.add("is-on");
      await sleep(gap, t);
    }
  }

  async function jsonLoop(t) {
    for (;;) {
      result.classList.remove("is-on");
      const l = paint(left, LEFT);
      const r = paint(right, SAME);
      await sleep(300, t);
      await reveal(l, t);
      await reveal(r, t);
      await sleep(500, t);
      result.innerHTML = IDENTICAL;
      result.classList.add("is-on");
      await sleep(2000, t);
      result.classList.remove("is-on");
      await sleep(250, t);
      const edited = paint(right, EDITED, { 1: "changed", 4: "added" });
      edited.forEach((row) => row.classList.add("is-on"));
      paint(left, LEFT, { 3: "changed" }).forEach((row) => row.classList.add("is-on"));
      await sleep(500, t);
      result.innerHTML = DIFFERENT;
      result.classList.add("is-on");
      await sleep(3200, t);
    }
  }

  function jsonStill() {
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
