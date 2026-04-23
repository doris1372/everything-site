/* +5 browser / privacy sections (mini-browser, privacy score, fingerprint preview, storage manager, fake identity) */
(() => {
  "use strict";
  if (!window.EVERYTHING_SECTIONS) return;
  const SECTIONS = window.EVERYTHING_SECTIONS;

  const el = (tag, attrs = {}, ...children) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      if (typeof c === "string" || typeof c === "number") e.appendChild(document.createTextNode(String(c)));
      else e.appendChild(c);
    }
    return e;
  };
  const card = (...children) => el("div", { class: "card" }, ...children);
  const h3 = (t) => el("h3", { style: { marginTop: 0 } }, t);
  const reg = (def) => SECTIONS.push(def);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const LS = {
    get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ================================================
   *  1. Мини-браузер в iframe
   * ================================================
   *  Предупреждение: многие большие сайты (Google, YouTube, GitHub)
   *  запрещают iframe-вложение через X-Frame-Options / CSP frame-ancestors.
   *  Поэтому есть кнопка "открыть в новой вкладке".
   */
  reg({
    id: "mini-browser", title: "Мини-браузер", icon: "🌐", group: "Утилиты",
    desc: "iframe с вкладками, историей и закладками",
    render(root, { toast }) {
      const NS_TABS = "mb:tabs", NS_ACTIVE = "mb:active", NS_HIST = "mb:hist", NS_BM = "mb:bookmarks";
      const DEFAULT_BOOKMARKS = [
        { title: "Wikipedia", url: "https://en.wikipedia.org/wiki/Special:Random" },
        { title: "MDN Web Docs", url: "https://developer.mozilla.org/" },
        { title: "example.com", url: "https://example.com/" },
        { title: "DuckDuckGo (!bang лайт)", url: "https://html.duckduckgo.com/html/" },
        { title: "Wikiquote", url: "https://en.wikiquote.org/wiki/Main_Page" },
        { title: "Hacker News (text)", url: "https://news.ycombinator.com/" },
      ];

      const state = {
        tabs: LS.get(NS_TABS, [{ id: 1, url: "about:blank", title: "Новая вкладка" }]),
        activeId: LS.get(NS_ACTIVE, 1),
        history: LS.get(NS_HIST, []),
        bookmarks: LS.get(NS_BM, DEFAULT_BOOKMARKS),
      };
      const save = () => {
        LS.set(NS_TABS, state.tabs); LS.set(NS_ACTIVE, state.activeId);
        LS.set(NS_HIST, state.history.slice(0, 200)); LS.set(NS_BM, state.bookmarks);
      };
      const activeTab = () => state.tabs.find(t => t.id === state.activeId) || state.tabs[0];
      const normalizeURL = (v) => {
        v = (v || "").trim();
        if (!v) return "about:blank";
        if (v === "about:blank") return v;
        if (/^https?:\/\//i.test(v)) return v;
        if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(v)) return "https://" + v;
        return "https://duckduckgo.com/?q=" + encodeURIComponent(v);
      };

      const tabBar = el("div", { class: "row", style: { flexWrap: "wrap", gap: "4px", marginBottom: "6px" } });
      const addrInp = el("input", { type: "text", placeholder: "URL или поисковый запрос", style: { flex: 1 } });
      const goBtn = el("button", { class: "btn" }, "↵ Go");
      const backBtn = el("button", { class: "btn ghost" }, "←");
      const openInNewTabBtn = el("button", { class: "btn ghost", title: "Открыть в настоящей вкладке" }, "↗");
      const bookmarkBtn = el("button", { class: "btn ghost", title: "В закладки" }, "☆");
      const reloadBtn = el("button", { class: "btn ghost" }, "↻");
      const newTabBtn = el("button", { class: "btn ghost" }, "+ tab");
      const frame = el("iframe", {
        sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
        referrerpolicy: "no-referrer",
        style: { width: "100%", height: "500px", border: "1px solid var(--panel-2)", borderRadius: "8px", background: "#fff" }
      });
      const notice = el("div", { class: "muted", style: { fontSize: "13px", marginTop: "4px" } });
      const bmList = el("div", { class: "row", style: { flexWrap: "wrap", gap: "6px", marginTop: "8px" } });
      const histList = el("div", { class: "mt-3", style: { display: "grid", gap: "4px", maxHeight: "220px", overflowY: "auto" } });

      const loadActive = () => {
        const t = activeTab();
        addrInp.value = t.url === "about:blank" ? "" : t.url;
        frame.src = t.url;
        if (t.url !== "about:blank" && !state.history.includes(t.url)) {
          state.history.unshift(t.url);
          state.history = state.history.slice(0, 200);
        }
        // X-Frame-Options/CSP detection — can't catch reliably, but show hint
        notice.innerHTML = "";
        if (t.url !== "about:blank") {
          notice.appendChild(el("span", {}, "Если вместо сайта пусто — сайт запрещает вложение через `X-Frame-Options` / CSP. Нажми ↗ чтобы открыть в настоящей вкладке."));
        }
        save();
        renderTabs();
        renderHist();
      };

      const renderTabs = () => {
        tabBar.innerHTML = "";
        state.tabs.forEach(t => {
          const isActive = t.id === state.activeId;
          const title = (t.title || t.url || "tab").slice(0, 24);
          const b = el("button", {
            class: isActive ? "btn" : "btn ghost",
            style: { fontSize: "12px", padding: "4px 8px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
            onclick: () => { state.activeId = t.id; loadActive(); },
          }, title);
          if (state.tabs.length > 1) {
            const close = el("span", { style: { marginLeft: "6px", cursor: "pointer", opacity: 0.6 }, onclick: (e) => {
              e.stopPropagation();
              state.tabs = state.tabs.filter(x => x.id !== t.id);
              if (state.activeId === t.id) state.activeId = state.tabs[0].id;
              loadActive();
            } }, "×");
            b.appendChild(close);
          }
          tabBar.appendChild(b);
        });
      };

      const renderBookmarks = () => {
        bmList.innerHTML = "";
        state.bookmarks.forEach((bm, i) => {
          bmList.appendChild(el("span", {
            style: { background: "var(--panel-2)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" },
            onclick: () => { const t = activeTab(); t.url = normalizeURL(bm.url); t.title = bm.title; loadActive(); }
          },
            "⭐ " + bm.title,
            el("span", { style: { opacity: 0.5, cursor: "pointer" }, onclick: (e) => { e.stopPropagation(); state.bookmarks.splice(i, 1); save(); renderBookmarks(); } }, "×")
          ));
        });
      };

      const renderHist = () => {
        histList.innerHTML = "";
        if (!state.history.length) { histList.appendChild(el("div", { class: "muted" }, "История пуста.")); return; }
        state.history.forEach((url, i) => {
          histList.appendChild(el("div", { class: "row", style: { justifyContent: "space-between", padding: "4px 8px", background: "var(--panel-2)", borderRadius: "6px" } },
            el("a", { href: "#", style: { fontSize: "13px", wordBreak: "break-all" }, onclick: (e) => { e.preventDefault(); const t = activeTab(); t.url = url; loadActive(); } }, url),
            el("span", { style: { cursor: "pointer", opacity: 0.6 }, onclick: () => { state.history.splice(i, 1); save(); renderHist(); } }, "×"),
          ));
        });
      };

      goBtn.onclick = () => {
        const t = activeTab();
        t.url = normalizeURL(addrInp.value);
        t.title = addrInp.value || t.url;
        loadActive();
      };
      addrInp.onkeydown = (e) => { if (e.key === "Enter") goBtn.click(); };
      backBtn.onclick = () => {
        // use history stack (previous url for this tab — simple: rewind state.history
        if (state.history.length < 2) { toast("Нечего «назад»"); return; }
        const [, prev] = state.history;
        const t = activeTab(); t.url = prev; t.title = prev; loadActive();
      };
      openInNewTabBtn.onclick = () => {
        const u = activeTab().url;
        if (u && u !== "about:blank") window.open(u, "_blank", "noopener,noreferrer");
      };
      bookmarkBtn.onclick = () => {
        const t = activeTab();
        if (t.url === "about:blank") { toast("Нельзя закладывать пустую вкладку"); return; }
        const title = prompt("Название закладки", t.title || t.url) || t.url;
        state.bookmarks.push({ title, url: t.url }); save(); renderBookmarks(); toast("Добавлено в закладки");
      };
      reloadBtn.onclick = () => { frame.src = activeTab().url; };
      newTabBtn.onclick = () => {
        const id = Math.max(0, ...state.tabs.map(t => t.id)) + 1;
        state.tabs.push({ id, url: "about:blank", title: "Новая вкладка" });
        state.activeId = id; loadActive();
      };

      root._cleanup = () => { /* nothing — iframe is destroyed with DOM */ };

      root.appendChild(card(h3("Мини-браузер"),
        el("p", { class: "muted" }, "iframe-браузер прямо в сайте. Вкладки, история, закладки сохраняются в `localStorage`. Некоторые сайты (Google, YouTube, GitHub, банки) блокируют вложение через `X-Frame-Options: DENY` или CSP — для них используй кнопку ↗."),
        el("div", { class: "row mt-2" }, backBtn, reloadBtn, addrInp, goBtn, openInNewTabBtn, bookmarkBtn, newTabBtn),
        tabBar,
        frame,
        notice,
        el("div", { class: "muted mt-2", style: { fontSize: "13px", fontWeight: "600" } }, "⭐ Закладки:"),
        bmList,
        el("div", { class: "muted mt-2", style: { fontSize: "13px", fontWeight: "600" } }, "📜 История:"),
        histList,
      ));

      renderBookmarks();
      loadActive();
    },
  });

  /* ================================================
   *  2. Privacy Score (Panopticlick-стиль)
   * ================================================
   *  Собирает те же сигналы и оценивает уникальность.
   *  Оценка грубая: у каждого сигнала — вес (бит энтропии),
   *  суммарный fingerprint = Σ битов, оценочное 1 из 2^N.
   */
  reg({
    id: "privacy-score", title: "Privacy Score", icon: "🛡️", group: "Утилиты",
    desc: "Насколько уникален твой браузер",
    render(root) {
      const container = el("div", { class: "mt-3" });
      container.appendChild(el("div", { class: "muted" }, "Считаем..."));

      const signals = [];
      const add = (name, value, bits, notes) => signals.push({ name, value, bits, notes });

      const hash32 = async (t) => {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
        return Array.from(new Uint8Array(buf)).slice(0, 4).map(b => b.toString(16).padStart(2, "0")).join("");
      };

      const collect = async () => {
        const n = navigator, s = screen;
        // approximate Panopticlick-like bit weights
        add("User-Agent", n.userAgent, 10.0, "полная строка UA — один из самых сильных идентификаторов");
        add("Platform", n.platform, 1.5, "Win/Mac/Linux/iPhone");
        add("Языки", (n.languages || [n.language]).join(","), 3.0, "порядок и список языков");
        add("Часовой пояс", Intl.DateTimeFormat().resolvedOptions().timeZone, 3.0, "IANA зона");
        add("Разрешение", `${s.width}x${s.height}x${s.colorDepth}`, 4.5, "экран + глубина цвета");
        add("Pixel ratio", String(window.devicePixelRatio || 1), 2.0, "1.0 / 1.25 / 1.5 / 2.0 / 3.0");
        add("CPU ядер", String(n.hardwareConcurrency || "?"), 2.5, "1-32+");
        add("Device memory", String(n.deviceMemory || "?"), 2.0, "0.25-8+ ГБ");
        add("Touch points", String(n.maxTouchPoints || 0), 1.5, "0 на ПК, 5 на телефоне/планшете");

        // canvas
        try {
          const c = document.createElement("canvas"); c.width = 240; c.height = 60;
          const ctx = c.getContext("2d"); ctx.textBaseline = "top"; ctx.font = "14px Arial";
          ctx.fillStyle = "#f60"; ctx.fillRect(10, 10, 100, 30);
          ctx.fillStyle = "#069"; ctx.fillText("fp🔍Ω★", 2, 15);
          ctx.fillStyle = "rgba(102,204,0,0.7)"; ctx.fillText("fp🔍Ω★", 4, 17);
          const h = await hash32(c.toDataURL());
          add("Canvas hash", h, 9.0, "очень сильный сигнал — зависит от шрифтов, сглаживания, GPU");
        } catch (e) { add("Canvas hash", "блок", 0, "не получили"); }

        // WebGL renderer
        try {
          const gl = document.createElement("canvas").getContext("webgl");
          const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
          const rend = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "n/a";
          add("GPU (WebGL)", String(rend).slice(0, 60), 6.5, "модель видеокарты + драйвер");
        } catch (e) { add("GPU (WebGL)", "блок", 0, "WebGL отключён"); }

        // audio
        try {
          const OA = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          const ctx = new OA(1, 44100, 44100);
          const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = 10000;
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -50; comp.knee.value = 40; comp.ratio.value = 12;
          osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
          const buf = await ctx.startRendering();
          const data = buf.getChannelData(0).slice(4500, 5000);
          let sum = 0; for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
          add("Audio hash", await hash32(sum.toString()), 5.5, "OfflineAudioContext + DynamicsCompressor — специфичен для ОС/движка");
        } catch (e) { add("Audio hash", "блок", 0, ""); }

        // fonts (same 28 test list as fingerprint section)
        const testFonts = ["Arial", "Courier New", "Times New Roman", "Verdana", "Georgia", "Tahoma", "Trebuchet MS", "Comic Sans MS", "Impact", "Lucida Console", "Consolas", "Menlo", "Monaco", "Roboto", "Ubuntu", "Segoe UI", "Helvetica", "Noto Sans", "Open Sans", "Fira Code", "Source Code Pro", "JetBrains Mono", "PT Sans", "Arial Black", "Palatino", "Cambria", "Calibri", "Garamond"];
        const base = ["monospace", "sans-serif", "serif"];
        const span = document.createElement("span"); span.textContent = "mmmmmmmmllI"; span.style.fontSize = "72px"; span.style.position = "absolute"; span.style.left = "-9999px";
        document.body.appendChild(span);
        const widths = {}; for (const b of base) { span.style.fontFamily = b; widths[b] = span.offsetWidth; }
        const detected = [];
        for (const f of testFonts) {
          let found = false;
          for (const b of base) { span.style.fontFamily = `"${f}",${b}`; if (span.offsetWidth !== widths[b]) { found = true; break; } }
          if (found) detected.push(f);
        }
        span.remove();
        add(`Шрифты (${detected.length}/28)`, detected.join(",").slice(0, 80), 6.5, "набор установленных шрифтов сильно зависит от ОС");

        // render
        container.innerHTML = "";
        const total = signals.reduce((a, s) => a + s.bits, 0);
        const pool = 4_500_000_000; // ~web users; just a visual scale
        const uniqueness = Math.min(1, Math.pow(2, total) / pool);
        const verdict = total < 20 ? "🟢 относительно обычный"
          : total < 28 ? "🟡 довольно заметный"
          : total < 36 ? "🟠 заметный, легко отслеживаемый"
          : "🔴 крайне уникальный — проще идентифицировать без кук";

        const bar = el("div", { style: { height: "14px", borderRadius: "7px", overflow: "hidden", background: "var(--panel-2)" } });
        const pct = Math.min(100, (total / 45) * 100);
        bar.appendChild(el("div", { style: { width: pct + "%", height: "100%", background: `linear-gradient(90deg, #4caf50, #ffc107, #f44336)` } }));

        container.appendChild(el("div", { style: { fontSize: "22px", fontWeight: "600" } },
          `Твой fingerprint ≈ ${total.toFixed(1)} бит энтропии`));
        container.appendChild(el("div", { class: "muted", style: { fontSize: "13px", marginTop: "4px" } },
          `Это примерно 1 браузер на ~${Math.pow(2, total).toLocaleString("ru")}. ${verdict}`));
        container.appendChild(el("div", { class: "mt-2" }, bar));
        container.appendChild(el("div", { class: "muted mt-2", style: { fontSize: "12px" } },
          "Оценка грубая — реальные веса у Panopticlick/CreepJS вычисляются на реальном датасете браузеров. Это демонстрация принципа."));

        const tbl = el("table", { style: { width: "100%", borderCollapse: "collapse", marginTop: "14px" } });
        tbl.appendChild(el("tr", {},
          el("th", { style: { textAlign: "left", padding: "6px", borderBottom: "1px solid var(--panel-2)" } }, "Сигнал"),
          el("th", { style: { textAlign: "left", padding: "6px", borderBottom: "1px solid var(--panel-2)" } }, "Значение"),
          el("th", { style: { textAlign: "right", padding: "6px", borderBottom: "1px solid var(--panel-2)" } }, "бит"),
        ));
        signals.forEach(s => tbl.appendChild(el("tr", {},
          el("td", { style: { padding: "6px", verticalAlign: "top" } }, s.name, el("div", { class: "muted", style: { fontSize: "11px" } }, s.notes || "")),
          el("td", { style: { padding: "6px", fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all" } }, String(s.value).slice(0, 60)),
          el("td", { style: { padding: "6px", textAlign: "right", fontFamily: "monospace" } }, s.bits.toFixed(1)),
        )));
        container.appendChild(tbl);

        container.appendChild(el("div", { class: "mt-3 muted", style: { fontSize: "13px" } },
          "Как уменьшить: Tor Browser (спуфит большинство сигналов под одного медианного пользователя), Firefox + `privacy.resistFingerprinting`, Brave, uBlock Origin + CanvasBlocker."));
      };

      collect();
      root.appendChild(card(h3("Privacy Score"), el("p", { class: "muted" }, "Примерная оценка уникальности твоего браузерного fingerprint. Взвешенные биты энтропии по сигналам — чем больше, тем тебя проще идентифицировать без кук и IP."), container));
    },
  });

  /* ================================================
   *  3. Fingerprint preview (impersonate a profile)
   * ================================================
   *  Показывает «как бы выглядел отпечаток, если бы ты был на X устройстве».
   *  НИЧЕГО не подменяет — только рендерит таблицу для сравнения.
   */
  reg({
    id: "fingerprint-preview", title: "Fingerprint preview", icon: "🎭", group: "Утилиты",
    desc: "Как выглядит отпечаток iPhone/Linux/Tor",
    render(root) {
      const profiles = {
        self: {
          name: "Ты сейчас",
          ua: navigator.userAgent, platform: navigator.platform,
          lang: (navigator.languages || [navigator.language]).join(","),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen: `${screen.width}x${screen.height}`, dpr: String(window.devicePixelRatio || 1),
          cores: String(navigator.hardwareConcurrency || "?"),
          mem: String(navigator.deviceMemory || "?"),
          touch: String(navigator.maxTouchPoints || 0),
          gpu: "см. #fingerprint",
          fonts: "см. #fingerprint",
        },
        iphone15: {
          name: "iPhone 15, iOS 17, Safari",
          ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          platform: "iPhone", lang: "en-US,en", tz: "America/Los_Angeles",
          screen: "393x852", dpr: "3", cores: "6", mem: "4", touch: "5",
          gpu: "Apple GPU (Apple A16 Bionic)", fonts: "Helvetica, Times, Courier, San Francisco (iOS-набор, ~15 шрифтов)",
        },
        pixel8: {
          name: "Google Pixel 8, Android 14, Chrome",
          ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
          platform: "Linux armv8l", lang: "en-US,en", tz: "America/New_York",
          screen: "412x915", dpr: "2.625", cores: "9", mem: "8", touch: "5",
          gpu: "ANGLE (Qualcomm, Adreno (TM) 750)", fonts: "Roboto, Noto Sans CJK (Android-набор)",
        },
        winChrome: {
          name: "Windows 11, Chrome",
          ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          platform: "Win32", lang: "ru-RU,ru,en", tz: "Europe/Moscow",
          screen: "1920x1080", dpr: "1", cores: "16", mem: "16", touch: "0",
          gpu: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060)", fonts: "Segoe UI, Calibri, Cambria, Consolas (Windows-набор, ~40)",
        },
        macFirefox: {
          name: "macOS Sonoma, Firefox",
          ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:120.0) Gecko/20100101 Firefox/120.0",
          platform: "MacIntel", lang: "en-US,en", tz: "Europe/Berlin",
          screen: "1728x1117", dpr: "2", cores: "8", mem: "16", touch: "0",
          gpu: "Apple M2 Pro (WebGL)", fonts: "Helvetica Neue, Menlo, SF Pro (macOS-набор)",
        },
        linuxFF: {
          name: "Linux (Ubuntu), Firefox",
          ua: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
          platform: "Linux x86_64", lang: "en-US,en", tz: "UTC",
          screen: "1920x1080", dpr: "1", cores: "8", mem: "16", touch: "0",
          gpu: "Mesa (Intel UHD Graphics 620)", fonts: "DejaVu Sans, Ubuntu, Liberation (Linux-набор)",
        },
        tor: {
          name: "Tor Browser (default)",
          ua: "Mozilla/5.0 (Windows NT 10.0; rv:115.0) Gecko/20100101 Firefox/115.0",
          platform: "Win32", lang: "en-US,en", tz: "UTC",
          screen: "1400x900", dpr: "1", cores: "2", mem: "—",
          touch: "0", gpu: "отключён", fonts: "только bundled — все Tor-юзеры одинаковы",
        },
        bot: {
          name: "Headless Chrome (бот)",
          ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
          platform: "Linux x86_64", lang: "en-US", tz: "UTC",
          screen: "1920x1080", dpr: "1", cores: "4", mem: "—", touch: "0",
          gpu: "SwiftShader (software)", fonts: "минимум (часто заметно именно по этому)",
        },
      };

      const selfBtn = (id) => el("button", { class: "btn ghost", onclick: () => render(id) }, profiles[id].name);
      const display = el("div", { class: "mt-3" });

      const render = (id) => {
        const p = profiles[id];
        display.innerHTML = "";
        const t = el("table", { style: { width: "100%", borderCollapse: "collapse" } });
        const row = (k, v, hl) => t.appendChild(el("tr", {},
          el("td", { style: { padding: "6px 10px", borderBottom: "1px solid var(--panel-2)", color: "var(--muted)", width: "160px" } }, k),
          el("td", { style: { padding: "6px 10px", borderBottom: "1px solid var(--panel-2)", fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all", color: hl ? "var(--accent, #7aa7ff)" : "inherit" } }, v),
        ));
        row("Профиль", p.name, true);
        row("User-Agent", p.ua);
        row("Platform", p.platform);
        row("Языки", p.lang);
        row("Timezone", p.tz);
        row("Разрешение", p.screen + " @ DPR " + p.dpr);
        row("CPU / RAM", p.cores + " / " + p.mem);
        row("Touch points", p.touch);
        row("GPU", p.gpu);
        row("Шрифты", p.fonts);
        display.appendChild(t);
      };

      root.appendChild(card(h3("Fingerprint preview"),
        el("p", { class: "muted" }, "Показывает, как примерно выглядел бы твой отпечаток с другого устройства. Это чисто демонстрация — **ничего не подменяется** в реальных запросах, сайты видят твоего настоящего браузера. Для сравнения с «собой» открой #fingerprint."),
        el("div", { class: "row mt-2", style: { flexWrap: "wrap" } },
          selfBtn("self"), selfBtn("iphone15"), selfBtn("pixel8"),
          selfBtn("winChrome"), selfBtn("macFirefox"), selfBtn("linuxFF"),
          selfBtn("tor"), selfBtn("bot"),
        ),
        display,
      ));
      render("self");
    },
  });

  /* ================================================
   *  4. Менеджер cookies / localStorage этого сайта
   * ================================================
   */
  reg({
    id: "storage-manager", title: "Storage менеджер", icon: "🧹", group: "Утилиты",
    desc: "Посмотреть / удалить / экспортировать данные сайта",
    render(root, { toast }) {
      const lsTable = el("div");
      const ssTable = el("div");
      const cookieTable = el("div");
      const summary = el("div", { class: "pill" });

      const renderRows = (target, entries, onDel) => {
        target.innerHTML = "";
        if (!entries.length) { target.appendChild(el("div", { class: "muted", style: { fontSize: "13px" } }, "Пусто.")); return; }
        entries.forEach(([k, v]) => {
          target.appendChild(el("div", {
            style: { display: "grid", gridTemplateColumns: "200px 1fr auto", gap: "10px", padding: "6px 0", borderBottom: "1px solid var(--panel-2)", alignItems: "start" }
          },
            el("div", { style: { fontFamily: "monospace", fontSize: "12px", fontWeight: "600", wordBreak: "break-all" } }, k),
            el("div", { style: { fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all", maxHeight: "80px", overflow: "auto", color: "var(--muted)" } }, String(v).slice(0, 500)),
            el("button", { class: "btn ghost", style: { fontSize: "11px", padding: "4px 8px" }, onclick: () => { onDel(k); redraw(); } }, "×"),
          ));
        });
      };

      const readCookies = () => document.cookie.split(";").map(c => c.trim()).filter(Boolean).map(c => {
        const idx = c.indexOf("=");
        return [c.slice(0, idx), c.slice(idx + 1)];
      });
      const deleteCookie = (name) => {
        const paths = ["/", location.pathname];
        const domains = ["", location.hostname, "." + location.hostname];
        paths.forEach(p => domains.forEach(d => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${p}${d ? "; domain=" + d : ""}`;
        }));
      };

      const redraw = () => {
        const lsEntries = Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]);
        const ssEntries = Object.keys(sessionStorage).sort().map(k => [k, sessionStorage.getItem(k)]);
        const cookies = readCookies();
        renderRows(lsTable, lsEntries, (k) => localStorage.removeItem(k));
        renderRows(ssTable, ssEntries, (k) => sessionStorage.removeItem(k));
        renderRows(cookieTable, cookies, deleteCookie);
        const bytes = lsEntries.reduce((a, [, v]) => a + (v ? v.length : 0), 0) + ssEntries.reduce((a, [, v]) => a + (v ? v.length : 0), 0);
        summary.textContent = `localStorage: ${lsEntries.length} ключей · sessionStorage: ${ssEntries.length} · cookies: ${cookies.length} · ~${bytes.toLocaleString("ru")} байт`;
      };

      const exportAll = () => {
        const data = {
          localStorage: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])),
          sessionStorage: Object.fromEntries(Object.keys(sessionStorage).map(k => [k, sessionStorage.getItem(k)])),
          cookies: document.cookie,
          at: new Date().toISOString(), origin: location.origin,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = el("a", { href: URL.createObjectURL(blob), download: `everything-site-storage-${Date.now()}.json` });
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast("Экспортировано");
      };
      const importAll = () => {
        const inp = el("input", { type: "file", accept: "application/json" });
        inp.onchange = () => {
          const f = inp.files[0]; if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            try {
              const d = JSON.parse(r.result);
              if (d.localStorage) Object.entries(d.localStorage).forEach(([k, v]) => localStorage.setItem(k, v));
              if (d.sessionStorage) Object.entries(d.sessionStorage).forEach(([k, v]) => sessionStorage.setItem(k, v));
              toast("Импортировано. Куки не импортировались (security).");
              redraw();
            } catch (e) { toast("Ошибка JSON"); }
          };
          r.readAsText(f);
        };
        inp.click();
      };
      const wipeAll = () => {
        if (!confirm("Стереть ВСЕ данные этого сайта (localStorage, sessionStorage, cookies)? Игры/заметки/настройки сбросятся.")) return;
        localStorage.clear(); sessionStorage.clear();
        readCookies().forEach(([k]) => deleteCookie(k));
        toast("Стёрто");
        redraw();
      };

      const section = (title, body) => el("div", { class: "mt-3" },
        el("h4", { style: { margin: "8px 0" } }, title),
        body
      );

      root.appendChild(card(h3("Менеджер хранилища сайта"),
        el("p", { class: "muted" }, "Показывает и удаляет данные, которые хранит ЭТОТ сайт у тебя в браузере. Работает только со своим origin — чужие сайты браузер не даёт смотреть."),
        el("div", { class: "row mt-2" },
          el("button", { class: "btn", onclick: exportAll }, "💾 Экспорт JSON"),
          el("button", { class: "btn ghost", onclick: importAll }, "📂 Импорт"),
          el("button", { class: "btn ghost", onclick: redraw }, "↻ Обновить"),
          el("button", { class: "btn ghost", onclick: wipeAll, style: { color: "#f44336" } }, "🗑️ Стереть всё"),
        ),
        el("div", { class: "mt-2" }, summary),
        section("📦 localStorage", lsTable),
        section("⏳ sessionStorage", ssTable),
        section("🍪 cookies", cookieTable),
      ));
      redraw();
    },
  });

  /* ================================================
   *  5. Генератор фейк-личности
   * ================================================
   *  Классический throwaway user generator.
   *  Имена/домены — синтетические (не реальные люди), емейлы — mailinator/tempmail-стиль.
   */
  reg({
    id: "fake-identity", title: "Фейк-личность", icon: "🎭", group: "Генераторы",
    desc: "Тестовые имя/email/адрес/карта",
    render(root, { toast }) {
      const firstM = ["Артём", "Иван", "Максим", "Дмитрий", "Александр", "Никита", "Кирилл", "Роман", "Егор", "Илья", "Андрей", "Павел", "Денис", "Сергей", "Вячеслав", "Глеб", "Тимур", "Марк", "Олег", "Лев"];
      const firstF = ["Анна", "София", "Мария", "Виктория", "Елизавета", "Дарья", "Полина", "Арина", "Алиса", "Валерия", "Ксения", "Варвара", "Ульяна", "Вероника", "Маргарита", "Ева", "Кира", "Мила", "Есения", "Таисия"];
      const last = ["Иванов", "Петров", "Смирнов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков", "Морозов", "Волков", "Михайлов", "Фёдоров", "Николаев", "Орлов", "Макаров", "Андреев", "Ковалёв", "Ильин", "Гусев"];
      const cities = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону", "Уфа", "Красноярск", "Пермь", "Воронеж", "Волгоград"];
      const streets = ["Ленина", "Пушкина", "Гагарина", "Мира", "Советская", "Молодёжная", "Цветочная", "Садовая", "Парковая", "Школьная", "Заречная", "Набережная", "Центральная", "Лесная", "Победы"];
      const tempDomains = ["mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.io", "throwawaymail.com", "trashmail.com", "yopmail.com", "dispostable.com", "fakemail.net"];
      const adjectives = ["swift", "silent", "lucky", "brave", "cosmic", "neon", "hidden", "midnight", "silver", "golden", "crimson", "azure", "electric", "digital", "quantum"];
      const nouns = ["falcon", "tiger", "pixel", "wolf", "comet", "shadow", "raven", "phoenix", "dragon", "viper", "storm", "thunder", "echo", "nova", "ghost"];

      const out = el("div", { class: "mt-3" });

      const luhnChecksum = (partial) => {
        let sum = 0; let alt = true;
        for (let i = partial.length - 1; i >= 0; i--) {
          let d = parseInt(partial[i], 10);
          if (alt) { d *= 2; if (d > 9) d -= 9; }
          sum += d; alt = !alt;
        }
        return (10 - (sum % 10)) % 10;
      };
      const genCard = () => {
        // Valid Luhn test number; not a real card. Prefix options (test IINs used by payment processors):
        const testPrefixes = ["4242", "4111", "5105", "5555", "3782"];
        const prefix = pick(testPrefixes);
        let body = prefix;
        while (body.length < 15) body += String(rand(0, 9));
        return body + luhnChecksum(body);
      };
      const genPhone = () => {
        const code = pick(["495", "499", "812", "903", "905", "909", "926", "929", "958"]);
        const a = String(rand(100, 999)), b = String(rand(10, 99)), c = String(rand(10, 99));
        return `+7 (${code}) ${a}-${b}-${c}`;
      };
      const formatDate = (d) => {
        const day = String(d.getDate()).padStart(2, "0");
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${day}.${m}.${d.getFullYear()}`;
      };
      const translit = (s) => {
        const map = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
        return s.toLowerCase().split("").map(ch => map[ch] !== undefined ? map[ch] : ch).join("");
      };

      const gen = () => {
        const isM = Math.random() < 0.5;
        const firstName = isM ? pick(firstM) : pick(firstF);
        const lastName = pick(last) + (isM ? "" : "а");
        const username = `${pick(adjectives)}_${pick(nouns)}_${rand(10, 9999)}`;
        const emailUser = translit(firstName) + "." + translit(lastName).replace(/ /g, "") + rand(10, 999);
        const domain = pick(tempDomains);
        const email = `${emailUser}@${domain}`;
        const realDomain = "example.com"; // RFC 2606
        const corporateEmail = `${emailUser}@${realDomain}`;
        const phone = genPhone();
        const city = pick(cities);
        const street = `ул. ${pick(streets)}, д. ${rand(1, 120)}${pick(["", "", "", "к.1", "к.2", "стр.1"])}${pick(["", "", ", кв. " + rand(1, 300)])}`;
        const postalCode = String(rand(100000, 699999));
        const birth = new Date(rand(1960, 2005), rand(0, 11), rand(1, 28));
        const age = new Date().getFullYear() - birth.getFullYear();
        const card = genCard().replace(/(.{4})/g, "$1 ").trim();
        const cvv = String(rand(100, 999));
        const expY = new Date().getFullYear() + rand(2, 7);
        const expM = String(rand(1, 12)).padStart(2, "0");
        const password = [pick(adjectives), pick(nouns), rand(10, 99), pick(["!", "@", "#", "$", "%"])].join("");
        const uuid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

        const rows = [
          ["Имя", `${firstName} ${lastName}`],
          ["Пол / возраст", `${isM ? "М" : "Ж"} / ${age} лет`],
          ["Дата рождения", formatDate(birth)],
          ["Email (throwaway)", email],
          ["Email (example.com, тестовый)", corporateEmail],
          ["Username / логин", username],
          ["Пароль (сильный)", password],
          ["Телефон", phone],
          ["Город", city],
          ["Адрес", street],
          ["Индекс", postalCode],
          ["Карта (тест, Luhn-валидная, НЕ реальная)", card],
          ["CVV / Срок", `${cvv} · ${expM}/${expY}`],
          ["UUID v4", uuid],
        ];
        out.innerHTML = "";
        const t = el("table", { style: { width: "100%", borderCollapse: "collapse" } });
        rows.forEach(([k, v]) => t.appendChild(el("tr", {},
          el("td", { style: { padding: "6px 10px", borderBottom: "1px solid var(--panel-2)", color: "var(--muted)", width: "220px" } }, k),
          el("td", { style: { padding: "6px 10px", borderBottom: "1px solid var(--panel-2)", fontFamily: "monospace", fontSize: "13px" } },
            v,
            " ",
            el("button", { class: "btn ghost", style: { fontSize: "11px", padding: "2px 6px", marginLeft: "6px" },
              onclick: () => { navigator.clipboard?.writeText(v); toast("Скопировано: " + String(v).slice(0, 30)); }
            }, "📋")
          ),
        )));
        out.appendChild(t);
        out.appendChild(el("div", { class: "muted mt-2", style: { fontSize: "12px" } },
          "⚠️ Только для тестовых форм и дев-окружений. Все emails — throwaway-сервисы или example.com (RFC 2606). Карта проходит Luhn-проверку, но на любом платежном шлюзе даст decline — это не валидный номер реального банка. НЕ используй для мошенничества, регистрации в сервисах где требуется реальное имя, или чего-то подобного."));
      };

      root.appendChild(card(h3("Генератор тестовой личности"),
        el("p", { class: "muted" }, "Для заполнения тестовых форм, dev-окружений, песочниц. Email на одноразовых доменах, карта с корректной Luhn-суммой но несуществующая, имена-случайные."),
        el("div", { class: "row mt-2" },
          el("button", { class: "btn", onclick: gen }, "🎲 Сгенерировать"),
          el("button", { class: "btn ghost", onclick: () => { navigator.clipboard?.writeText(Array.from(out.querySelectorAll("tr")).map(tr => tr.children[0].textContent.trim() + ": " + tr.children[1].textContent.replace("📋","").trim()).join("\n")); toast("Всё в буфере"); } }, "📋 Всё"),
        ),
        out,
      ));
      gen();
    },
  });

})();
