/* All sections registered on window.EVERYTHING_SECTIONS */
(() => {
  "use strict";

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
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return e;
  };

  const card = (...children) => el("div", { class: "card" }, ...children);
  const h3 = (t) => el("h3", { style: { marginTop: 0 } }, t);

  const SECTIONS = [];
  const reg = (def) => SECTIONS.push(def);

  /* ============== HOME ============== */
  reg({
    id: "home",
    title: "Главная",
    icon: "🏠",
    group: "Главная",
    render(root, { go }) {
      const hero = el(
        "div",
        { class: "home-hero" },
        el("h2", {}, "Добро пожаловать в Everything ✨"),
        el(
          "p",
          {},
          "Экспериментальный сайт, где много всего: калькуляторы, игры, генераторы, рисовалка, звуки, часы и ещё. Всё работает прямо в браузере."
        ),
        el(
          "div",
          { class: "row" },
          el("span", { class: "pill" }, `${SECTIONS.length - 1} разделов`),
          el("span", { class: "pill" }, "0 backend"),
          el("span", { class: "pill" }, "open-source")
        )
      );
      root.appendChild(hero);

      const grid = el("div", { class: "home-grid" });
      SECTIONS.filter((s) => s.id !== "home").forEach((s) => {
        const c = el(
          "button",
          { class: "home-card", onclick: () => go(s.id) },
          el("span", { class: "icon" }, s.icon),
          el("span", { class: "title" }, s.title),
          el("span", { class: "desc" }, s.desc || s.group)
        );
        grid.appendChild(c);
      });
      root.appendChild(grid);
    },
  });

  /* ============== КАЛЬКУЛЯТОР ============== */
  reg({
    id: "calculator",
    title: "Калькулятор",
    icon: "🧮",
    group: "Утилиты",
    desc: "Базовый калькулятор",
    render(root) {
      const display = el("div", { class: "display" }, "0");
      const wrap = el("div", { class: "calc" }, display);
      let expr = "";
      const push = (v) => {
        expr += v;
        display.textContent = expr || "0";
      };
      const btns = [
        ["C", "clear", () => { expr = ""; display.textContent = "0"; }],
        ["±", "", () => { if (expr && !isNaN(+expr)) expr = String(-parseFloat(expr)); display.textContent = expr || "0"; }],
        ["%", "", () => push("%")],
        ["÷", "op", () => push("/")],
        ["7","",()=>push("7")],["8","",()=>push("8")],["9","",()=>push("9")],
        ["×","op",()=>push("*")],
        ["4","",()=>push("4")],["5","",()=>push("5")],["6","",()=>push("6")],
        ["−","op",()=>push("-")],
        ["1","",()=>push("1")],["2","",()=>push("2")],["3","",()=>push("3")],
        ["+","op",()=>push("+")],
        ["0","",()=>push("0")],[".","",()=>push(".")],
        ["=","eq",() => {
          try {
            const safe = expr.replace(/%/g,"/100").replace(/[^0-9+\-*/().%]/g,"");
            const result = Function("return (" + safe + ")")();
            display.textContent = String(result);
            expr = String(result);
          } catch { display.textContent = "Ошибка"; expr = ""; }
        }],
      ];
      btns.forEach(([label, klass, fn]) => {
        wrap.appendChild(el("button", { class: klass, onclick: fn }, label));
      });
      root.appendChild(card(h3("Калькулятор"), wrap));
    },
  });

  /* ============== КОНВЕРТЕР ЕДИНИЦ ============== */
  reg({
    id: "units",
    title: "Конвертер единиц",
    icon: "📏",
    group: "Утилиты",
    desc: "Длина, вес, температура",
    render(root) {
      const categories = {
        "Длина (м)": { "м": 1, "см": 0.01, "мм": 0.001, "км": 1000, "дюйм": 0.0254, "фут": 0.3048, "ярд": 0.9144, "миля": 1609.344 },
        "Масса (кг)": { "кг": 1, "г": 0.001, "т": 1000, "фунт": 0.45359237, "унция": 0.0283495 },
        "Объём (л)": { "л": 1, "мл": 0.001, "м³": 1000, "галлон (US)": 3.78541, "пинта (US)": 0.473176 },
        "Скорость (м/с)": { "м/с": 1, "км/ч": 1/3.6, "миль/ч": 0.44704, "узел": 0.514444 },
        "Температура": "TEMP",
      };
      const catSel = el("select");
      Object.keys(categories).forEach((k) => catSel.appendChild(el("option", { value: k }, k)));
      const fromSel = el("select");
      const toSel = el("select");
      const inp = el("input", { type: "number", value: "1" });
      const out = el("div", { class: "output" }, "—");

      const populate = () => {
        const cat = categories[catSel.value];
        fromSel.innerHTML = ""; toSel.innerHTML = "";
        if (cat === "TEMP") {
          ["°C","°F","K"].forEach((u)=>{ fromSel.appendChild(el("option",{value:u},u)); toSel.appendChild(el("option",{value:u},u)); });
          toSel.value = "°F";
        } else {
          Object.keys(cat).forEach((u)=>{ fromSel.appendChild(el("option",{value:u},u)); toSel.appendChild(el("option",{value:u},u)); });
          toSel.selectedIndex = 1;
        }
        convert();
      };
      const convert = () => {
        const v = parseFloat(inp.value);
        if (isNaN(v)) { out.textContent = "Введите число"; return; }
        const cat = categories[catSel.value];
        let res;
        if (cat === "TEMP") {
          let c = v;
          if (fromSel.value === "°F") c = (v - 32) * 5/9;
          else if (fromSel.value === "K") c = v - 273.15;
          if (toSel.value === "°C") res = c;
          else if (toSel.value === "°F") res = c * 9/5 + 32;
          else res = c + 273.15;
        } else {
          const base = v * cat[fromSel.value];
          res = base / cat[toSel.value];
        }
        out.textContent = `${v} ${fromSel.value} = ${+res.toFixed(6)} ${toSel.value}`;
      };
      [catSel, fromSel, toSel, inp].forEach((e) => e.addEventListener("input", convert));
      catSel.addEventListener("change", populate);
      populate();

      root.appendChild(card(
        h3("Конвертер единиц"),
        el("div", { class: "grid cols-2" },
          el("div", {}, el("label", {}, "Категория"), catSel),
          el("div", {}, el("label", {}, "Значение"), inp),
          el("div", {}, el("label", {}, "Из"), fromSel),
          el("div", {}, el("label", {}, "В"), toSel),
        ),
        el("div", { class: "mt-4" }, out)
      ));
    },
  });

  /* ============== ГЕНЕРАТОР ПАРОЛЕЙ ============== */
  reg({
    id: "password",
    title: "Генератор паролей",
    icon: "🔑",
    group: "Генераторы",
    desc: "Безопасные пароли",
    render(root, { toast }) {
      const out = el("input", { type: "text", readonly: true, class: "mono" });
      const len = el("input", { type: "range", min: 6, max: 48, value: 16 });
      const lenLabel = el("span", {}, "16");
      const up = el("input", { type: "checkbox", checked: true });
      const low = el("input", { type: "checkbox", checked: true });
      const num = el("input", { type: "checkbox", checked: true });
      const sym = el("input", { type: "checkbox", checked: true });

      const chk = (c, t) => el("label", { class: "row" }, c, " ", t);
      len.addEventListener("input", () => { lenLabel.textContent = len.value; generate(); });
      [up, low, num, sym].forEach((c) => c.addEventListener("change", generate));

      function generate() {
        let pool = "";
        if (up.checked) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (low.checked) pool += "abcdefghijklmnopqrstuvwxyz";
        if (num.checked) pool += "0123456789";
        if (sym.checked) pool += "!@#$%^&*()-_=+[]{};:,.<>/?";
        if (!pool) { out.value = "Выберите хотя бы один набор"; return; }
        const arr = new Uint32Array(+len.value);
        crypto.getRandomValues(arr);
        let s = "";
        for (const x of arr) s += pool[x % pool.length];
        out.value = s;
      }
      generate();

      root.appendChild(card(
        h3("Генератор паролей"),
        el("div", { class: "row" }, out,
          el("button", { class: "btn", onclick: () => { navigator.clipboard.writeText(out.value); toast("Скопировано"); } }, "📋"),
          el("button", { class: "btn ghost", onclick: generate }, "↻")),
        el("div", { class: "mt-4 row" }, el("label", {}, "Длина: ", lenLabel), len),
        el("div", { class: "mt-2 row" }, chk(up, "A-Z"), chk(low, "a-z"), chk(num, "0-9"), chk(sym, "!@#$…")),
      ));
    },
  });

  /* ============== BASE64 ============== */
  reg({
    id: "base64",
    title: "Base64",
    icon: "🔐",
    group: "Утилиты",
    desc: "Кодирование/декодирование",
    render(root, { toast }) {
      const inp = el("textarea", { placeholder: "Введите текст..." });
      const out = el("textarea", { placeholder: "Результат..." });
      const enc = () => {
        try { out.value = btoa(unescape(encodeURIComponent(inp.value))); }
        catch (e) { out.value = "Ошибка: " + e.message; }
      };
      const dec = () => {
        try { out.value = decodeURIComponent(escape(atob(inp.value))); }
        catch (e) { out.value = "Ошибка: " + e.message; }
      };
      root.appendChild(card(
        h3("Base64"),
        el("label", {}, "Вход"), inp,
        el("div", { class: "row mt-2" },
          el("button", { class: "btn", onclick: enc }, "Encode →"),
          el("button", { class: "btn", onclick: dec }, "Decode ←"),
          el("button", { class: "btn ghost", onclick: () => { inp.value=""; out.value=""; } }, "Очистить"),
          el("button", { class: "btn ghost", onclick: () => { navigator.clipboard.writeText(out.value); toast("Скопировано"); } }, "📋")
        ),
        el("label", { class: "mt-4" }, "Результат"), out
      ));
    },
  });

  /* ============== ТЕКСТ-ИНСТРУМЕНТЫ ============== */
  reg({
    id: "textools",
    title: "Текст-инструменты",
    icon: "🔤",
    group: "Утилиты",
    desc: "UPPER, lower, reverse, подсчёт",
    render(root) {
      const inp = el("textarea", { placeholder: "Введите текст..." });
      const out = el("textarea", {});
      const stats = el("div", { class: "output" }, "—");
      const setOut = (v) => { out.value = v; };
      const t = () => inp.value;
      const updateStats = () => {
        const s = t();
        const words = s.trim() ? s.trim().split(/\s+/).length : 0;
        stats.textContent = `Символов: ${s.length} | без пробелов: ${s.replace(/\s/g,"").length} | слов: ${words} | строк: ${s ? s.split("\n").length : 0}`;
      };
      inp.addEventListener("input", updateStats);
      updateStats();

      const btns = [
        ["ПРОПИСНЫЕ", () => setOut(t().toUpperCase())],
        ["строчные", () => setOut(t().toLowerCase())],
        ["Каждое Слово", () => setOut(t().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()))],
        ["Перевернуть", () => setOut([...t()].reverse().join(""))],
        ["Убрать пробелы", () => setOut(t().replace(/\s+/g, " ").trim())],
        ["Сорт. строк", () => setOut(t().split("\n").sort().join("\n"))],
        ["Уник. строки", () => setOut([...new Set(t().split("\n"))].join("\n"))],
        ["slug", () => setOut(t().toLowerCase().replace(/[^a-zа-яё0-9\s-]/gi,"").trim().replace(/\s+/g,"-"))],
      ];

      root.appendChild(card(
        h3("Текст-инструменты"),
        el("label", {}, "Вход"), inp,
        stats,
        el("div", { class: "row mt-4" }, btns.map(([l, fn]) => el("button", { class: "btn small ghost", onclick: fn }, l))),
        el("label", { class: "mt-4" }, "Результат"), out
      ));
    },
  });

  /* ============== MARKDOWN PREVIEW ============== */
  reg({
    id: "markdown",
    title: "Markdown",
    icon: "📝",
    group: "Утилиты",
    desc: "Простой превью",
    render(root) {
      const md = (s) => {
        let html = s
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/^### (.*)$/gm, "<h3>$1</h3>")
          .replace(/^## (.*)$/gm, "<h2>$1</h2>")
          .replace(/^# (.*)$/gm, "<h1>$1</h1>")
          .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
          .replace(/\*(.+?)\*/g, "<i>$1</i>")
          .replace(/`([^`]+)`/g, "<code>$1</code>")
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
          .replace(/^- (.*)$/gm, "<li>$1</li>")
          .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
          .replace(/\n\n/g, "<br><br>");
        return html;
      };
      const inp = el("textarea", {}, "# Привет!\n\nЭто **markdown** превью. *Ура!*\n\n- пункт раз\n- пункт два\n\n`код` и [ссылка](https://example.com)");
      const preview = el("div", { class: "output", style: { minHeight: "200px" } });
      const update = () => { preview.innerHTML = md(inp.value); };
      inp.addEventListener("input", update);
      update();
      root.appendChild(card(
        h3("Markdown превью"),
        el("div", { class: "grid cols-2" }, inp, preview)
      ));
    },
  });

  /* ============== JSON FORMATTER ============== */
  reg({
    id: "json",
    title: "JSON форматтер",
    icon: "🗂️",
    group: "Утилиты",
    desc: "Красивый вывод JSON",
    render(root) {
      const inp = el("textarea", { placeholder: '{"привет":"мир"}' });
      const out = el("textarea", {});
      const status = el("div", { class: "pill" }, "—");
      const fmt = (indent) => {
        try {
          const v = JSON.parse(inp.value);
          out.value = JSON.stringify(v, null, indent);
          status.textContent = "Валидный JSON ✓";
        } catch (e) {
          status.textContent = "Ошибка: " + e.message;
        }
      };
      root.appendChild(card(
        h3("JSON форматтер"),
        inp,
        el("div", { class: "row mt-2" },
          el("button", { class: "btn", onclick: () => fmt(2) }, "Формат 2"),
          el("button", { class: "btn", onclick: () => fmt(4) }, "Формат 4"),
          el("button", { class: "btn ghost", onclick: () => fmt(0) }, "Минифицировать"),
          status
        ),
        el("label", { class: "mt-4" }, "Результат"), out
      ));
    },
  });

  /* ============== BMI ============== */
  reg({
    id: "bmi",
    title: "BMI калькулятор",
    icon: "⚖️",
    group: "Утилиты",
    desc: "Индекс массы тела",
    render(root) {
      const h = el("input", { type: "number", value: 175, placeholder: "рост, см" });
      const w = el("input", { type: "number", value: 70, placeholder: "вес, кг" });
      const out = el("div", { class: "output" }, "—");
      const calc = () => {
        const hi = +h.value / 100;
        const wi = +w.value;
        if (!hi || !wi) { out.textContent = "Введите значения"; return; }
        const b = wi / (hi * hi);
        let cat = b < 18.5 ? "недостаток веса" : b < 25 ? "норма" : b < 30 ? "избыточный вес" : "ожирение";
        out.textContent = `BMI = ${b.toFixed(2)} — ${cat}`;
      };
      [h, w].forEach((x) => x.addEventListener("input", calc));
      calc();
      root.appendChild(card(
        h3("BMI калькулятор"),
        el("div", { class: "grid cols-2" },
          el("div", {}, el("label", {}, "Рост, см"), h),
          el("div", {}, el("label", {}, "Вес, кг"), w)),
        el("div", { class: "mt-4" }, out)
      ));
    },
  });

  /* ============== AGE ============== */
  reg({
    id: "age",
    title: "Калькулятор возраста",
    icon: "🎂",
    group: "Утилиты",
    desc: "Сколько вам дней",
    render(root) {
      const d = el("input", { type: "date" });
      d.value = "2000-01-01";
      const out = el("div", { class: "output" });
      const calc = () => {
        if (!d.value) { out.textContent = "Выберите дату"; return; }
        const b = new Date(d.value);
        const now = new Date();
        let y = now.getFullYear() - b.getFullYear();
        let m = now.getMonth() - b.getMonth();
        let day = now.getDate() - b.getDate();
        if (day < 0) { m--; day += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
        if (m < 0) { y--; m += 12; }
        const days = Math.floor((now - b) / 86400000);
        out.textContent = `${y} лет, ${m} мес., ${day} дн.\nВсего дней: ${days}\nЧасов: ${days*24}\nСекунд: ~${days*86400}`;
      };
      d.addEventListener("input", calc);
      calc();
      root.appendChild(card(h3("Калькулятор возраста"), el("label", {}, "Дата рождения"), d, el("div", { class: "mt-4" }, out)));
    },
  });

  /* ============== ЧАСЫ ============== */
  reg({
    id: "clock",
    title: "Часы",
    icon: "🕐",
    group: "Инфо",
    desc: "Цифровые и аналоговые",
    render(root) {
      const digital = el("div", { class: "huge center mono" });
      const dateEl = el("div", { class: "center muted" });
      const canvas = el("canvas", { width: 240, height: 240, class: "center", style: { display: "block", margin: "0 auto" } });
      const ctx = canvas.getContext("2d");

      let tick;
      const draw = () => {
        const now = new Date();
        digital.textContent = now.toLocaleTimeString("ru-RU");
        dateEl.textContent = now.toLocaleDateString("ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const w = canvas.width, h = canvas.height, r = w/2 - 10;
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w/2, h/2);
        ctx.strokeStyle = getVar("--text"); ctx.fillStyle = getVar("--panel");
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = getVar("--panel-2"); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = getVar("--text");
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI/2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a)*(r-12), Math.sin(a)*(r-12));
          ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
          ctx.lineWidth = 2; ctx.stroke();
        }
        const H = now.getHours() % 12, M = now.getMinutes(), S = now.getSeconds() + now.getMilliseconds()/1000;
        const hand = (len, angle, width, color) => {
          ctx.save(); ctx.rotate(angle); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -len); ctx.stroke(); ctx.restore();
        };
        hand(r*0.5, (H + M/60) / 12 * Math.PI * 2, 6, getVar("--text"));
        hand(r*0.72, (M + S/60) / 60 * Math.PI * 2, 4, getVar("--accent"));
        hand(r*0.85, S / 60 * Math.PI * 2, 2, getVar("--danger"));
        ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fillStyle = getVar("--accent"); ctx.fill();
        ctx.restore();
      };
      tick = setInterval(draw, 50);
      draw();
      root._cleanup = () => clearInterval(tick);

      root.appendChild(card(h3("Часы"), digital, dateEl, el("div", { class: "mt-4" }, canvas)));
    },
  });

  function getVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#fff";
  }

  /* ============== СЕКУНДОМЕР ============== */
  reg({
    id: "stopwatch",
    title: "Секундомер",
    icon: "⏱️",
    group: "Утилиты",
    desc: "Тайминг с кругами",
    render(root) {
      const display = el("div", { class: "huge center mono" }, "00:00.00");
      const laps = el("ol", {});
      let running = false, start = 0, elapsed = 0, timer;

      const fmt = (ms) => {
        const total = Math.floor(ms / 10);
        const cs = total % 100;
        const s = Math.floor(total / 100) % 60;
        const m = Math.floor(total / 6000);
        return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
      };
      const render = () => { display.textContent = fmt(elapsed + (running ? Date.now() - start : 0)); };
      const startFn = () => { if (!running) { running = true; start = Date.now(); timer = setInterval(render, 30); } };
      const stopFn = () => { if (running) { elapsed += Date.now() - start; running = false; clearInterval(timer); } };
      const reset = () => { stopFn(); elapsed = 0; laps.innerHTML = ""; render(); };
      const lap = () => { if (running || elapsed) laps.insertBefore(el("li", {}, fmt(elapsed + (running ? Date.now() - start : 0))), laps.firstChild); };
      root._cleanup = () => clearInterval(timer);
      render();

      root.appendChild(card(
        h3("Секундомер"),
        display,
        el("div", { class: "row mt-4 center" },
          el("button", { class: "btn ok", onclick: startFn }, "Старт"),
          el("button", { class: "btn warn", onclick: stopFn }, "Стоп"),
          el("button", { class: "btn", onclick: lap }, "Круг"),
          el("button", { class: "btn danger", onclick: reset }, "Сброс"),
        ),
        laps
      ));
    },
  });

  /* ============== POMODORO ============== */
  reg({
    id: "pomodoro",
    title: "Pomodoro",
    icon: "🍅",
    group: "Утилиты",
    desc: "Таймер 25/5",
    render(root, { toast }) {
      let seconds = 25 * 60;
      let mode = "work";
      let timer = null;
      const display = el("div", { class: "huge center mono" });
      const label = el("div", { class: "center muted" });
      const render = () => {
        const m = Math.floor(seconds / 60), s = seconds % 60;
        display.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
        label.textContent = mode === "work" ? "Работа" : "Перерыв";
      };
      const start = () => {
        if (timer) return;
        timer = setInterval(() => {
          seconds--;
          if (seconds < 0) {
            mode = mode === "work" ? "break" : "work";
            seconds = (mode === "work" ? 25 : 5) * 60;
            toast(mode === "work" ? "Работаем!" : "Перерыв!");
            try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=").play(); } catch {}
          }
          render();
        }, 1000);
      };
      const stop = () => { clearInterval(timer); timer = null; };
      const reset = () => { stop(); seconds = (mode === "work" ? 25 : 5) * 60; render(); };
      root._cleanup = stop;
      render();

      root.appendChild(card(
        h3("Pomodoro"),
        label, display,
        el("div", { class: "row mt-4 center" },
          el("button", { class: "btn ok", onclick: start }, "Старт"),
          el("button", { class: "btn warn", onclick: stop }, "Пауза"),
          el("button", { class: "btn danger", onclick: reset }, "Сброс"),
        )
      ));
    },
  });

  /* ============== ЗАМЕТКИ ============== */
  reg({
    id: "notes",
    title: "Заметки",
    icon: "🗒️",
    group: "Утилиты",
    desc: "Сохраняются в браузере",
    render(root, { toast }) {
      const ta = el("textarea", { placeholder: "Пишите здесь..." });
      ta.value = localStorage.getItem("notes") || "";
      ta.addEventListener("input", () => localStorage.setItem("notes", ta.value));
      const clear = () => { if (confirm("Удалить все заметки?")) { ta.value = ""; localStorage.setItem("notes", ""); toast("Очищено"); } };
      root.appendChild(card(
        h3("Заметки"),
        el("p", { class: "muted" }, "Сохраняются в localStorage вашего браузера."),
        ta,
        el("div", { class: "row mt-2" }, el("button", { class: "btn danger", onclick: clear }, "Очистить"))
      ));
    },
  });

  /* ============== TODO ============== */
  reg({
    id: "todo",
    title: "Todo лист",
    icon: "✅",
    group: "Утилиты",
    desc: "Сохраняется локально",
    render(root) {
      let todos = JSON.parse(localStorage.getItem("todos") || "[]");
      const save = () => localStorage.setItem("todos", JSON.stringify(todos));
      const inp = el("input", { type: "text", placeholder: "Новая задача..." });
      const list = el("ul", { style: { padding: 0, listStyle: "none" } });
      const addBtn = el("button", { class: "btn" }, "Добавить");
      const render = () => {
        list.innerHTML = "";
        if (!todos.length) { list.appendChild(el("li", { class: "muted" }, "Пусто. Добавьте задачу.")); return; }
        todos.forEach((t, i) => {
          const cb = el("input", { type: "checkbox" });
          cb.checked = t.done;
          cb.onchange = () => { todos[i].done = cb.checked; save(); render(); };
          const txt = el("span", { style: { flex: 1, textDecoration: t.done ? "line-through" : "none", color: t.done ? "var(--muted)" : "var(--text)" } }, t.text);
          const del = el("button", { class: "btn small danger", onclick: () => { todos.splice(i, 1); save(); render(); } }, "✕");
          list.appendChild(el("li", { class: "row", style: { padding: "8px 0", borderBottom: "1px solid var(--border)" } }, cb, txt, del));
        });
      };
      const add = () => { if (!inp.value.trim()) return; todos.push({ text: inp.value.trim(), done: false }); inp.value = ""; save(); render(); };
      addBtn.onclick = add;
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
      render();
      root.appendChild(card(h3("Todo"), el("div", { class: "row" }, inp, addBtn), list));
    },
  });

  /* ============== СЛУЧАЙНОЕ ЧИСЛО ============== */
  reg({
    id: "random",
    title: "Случайное число",
    icon: "🎯",
    group: "Генераторы",
    desc: "В диапазоне",
    render(root) {
      const minI = el("input", { type: "number", value: 1 });
      const maxI = el("input", { type: "number", value: 100 });
      const cnt = el("input", { type: "number", value: 1, min: 1, max: 1000 });
      const out = el("div", { class: "output big center" }, "—");
      const gen = () => {
        const mn = +minI.value, mx = +maxI.value, n = Math.max(1, Math.min(1000, +cnt.value || 1));
        if (mn > mx) { out.textContent = "Мин > Макс"; return; }
        const r = [];
        for (let i = 0; i < n; i++) r.push(Math.floor(Math.random() * (mx - mn + 1)) + mn);
        out.textContent = r.join(", ");
      };
      root.appendChild(card(h3("Случайное число"),
        el("div", { class: "grid cols-3" },
          el("div", {}, el("label", {}, "Минимум"), minI),
          el("div", {}, el("label", {}, "Максимум"), maxI),
          el("div", {}, el("label", {}, "Сколько"), cnt)),
        el("div", { class: "mt-4 row" }, el("button", { class: "btn", onclick: gen }, "🎲 Сгенерировать")),
        el("div", { class: "mt-4" }, out)
      ));
      gen();
    },
  });

  /* ============== LOREM IPSUM ============== */
  reg({
    id: "lorem",
    title: "Lorem ipsum",
    icon: "📄",
    group: "Генераторы",
    desc: "Текст-заполнитель",
    render(root, { toast }) {
      const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit in voluptate velit esse cillum fugiat nulla pariatur".split(" ");
      const n = el("input", { type: "number", value: 3, min: 1, max: 50 });
      const out = el("textarea", {});
      const gen = () => {
        const p = [];
        for (let i = 0; i < +n.value; i++) {
          const len = 30 + Math.floor(Math.random() * 40);
          const s = [];
          for (let j = 0; j < len; j++) s.push(words[Math.floor(Math.random() * words.length)]);
          let str = s.join(" ");
          str = str[0].toUpperCase() + str.slice(1) + ".";
          p.push(str);
        }
        out.value = p.join("\n\n");
      };
      gen();
      root.appendChild(card(h3("Lorem ipsum"),
        el("div", { class: "row" }, el("label", {}, "Абзацев"), n, el("button", { class: "btn", onclick: gen }, "Сгенерировать"),
          el("button", { class: "btn ghost", onclick: () => { navigator.clipboard.writeText(out.value); toast("Скопировано"); } }, "📋")),
        out
      ));
    },
  });

  /* ============== ЦВЕТ ============== */
  reg({
    id: "color",
    title: "Цвет",
    icon: "🎨",
    group: "Генераторы",
    desc: "HEX/RGB/HSL + палитра",
    render(root, { toast }) {
      const box = el("div", { class: "color-box" });
      const inp = el("input", { type: "color", value: "#7c5cff" });
      const info = el("div", { class: "output" });
      const palette = el("div", { class: "row", style: { flexWrap: "wrap" } });

      const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return { r: (n>>16)&255, g:(n>>8)&255, b:n&255 }; };
      const rgbToHsl = (r, g, b) => {
        r/=255; g/=255; b/=255;
        const max=Math.max(r,g,b), min=Math.min(r,g,b);
        let h, s, l=(max+min)/2;
        if (max===min) { h=s=0; } else {
          const d = max-min;
          s = l>0.5 ? d/(2-max-min) : d/(max+min);
          switch (max) {
            case r: h = (g-b)/d + (g<b?6:0); break;
            case g: h = (b-r)/d + 2; break;
            case b: h = (r-g)/d + 4; break;
          }
          h /= 6;
        }
        return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
      };
      const update = () => {
        box.style.background = inp.value;
        const { r, g, b } = hexToRgb(inp.value);
        const { h, s, l } = rgbToHsl(r, g, b);
        info.textContent = `HEX: ${inp.value}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${s}%, ${l}%)`;
        palette.innerHTML = "";
        for (let i = 0; i < 5; i++) {
          const ll = Math.max(10, Math.min(90, l - 30 + i * 15));
          const color = `hsl(${h}, ${s}%, ${ll}%)`;
          const swatch = el("button", {
            class: "btn ghost",
            style: { background: color, color: "#fff", minWidth: "70px", border: "1px solid var(--border)" },
            onclick: () => { navigator.clipboard.writeText(color); toast("Скопирован " + color); },
          }, color);
          palette.appendChild(swatch);
        }
      };
      inp.addEventListener("input", update);
      update();
      root.appendChild(card(h3("Цвет"), inp, box, info, el("label", { class: "mt-4" }, "Палитра"), palette));
    },
  });

  /* ============== ГРАДИЕНТ ============== */
  reg({
    id: "gradient",
    title: "CSS градиент",
    icon: "🌈",
    group: "Генераторы",
    desc: "Создавайте фоны",
    render(root, { toast }) {
      const c1 = el("input", { type: "color", value: "#7c5cff" });
      const c2 = el("input", { type: "color", value: "#4cc9f0" });
      const ang = el("input", { type: "range", min: 0, max: 360, value: 90 });
      const preview = el("div", { style: { height: "200px", borderRadius: "14px", border: "1px solid var(--border)" } });
      const code = el("div", { class: "output" });
      const update = () => {
        const css = `linear-gradient(${ang.value}deg, ${c1.value}, ${c2.value})`;
        preview.style.background = css;
        code.textContent = `background: ${css};`;
      };
      [c1, c2, ang].forEach((e) => e.addEventListener("input", update));
      update();
      root.appendChild(card(h3("Градиент"),
        el("div", { class: "row" }, c1, c2, el("label", {}, "Угол"), ang),
        preview, code,
        el("div", { class: "row mt-2" }, el("button", { class: "btn", onclick: () => { navigator.clipboard.writeText(code.textContent); toast("Скопирован CSS"); } }, "📋"))
      ));
    },
  });

  /* ============== ИМЕНА ============== */
  reg({
    id: "names",
    title: "Имена",
    icon: "👤",
    group: "Генераторы",
    desc: "Случайный ник",
    render(root) {
      const adj = ["быстрый","весёлый","тихий","дикий","старый","юный","синий","красный","смелый","хитрый","сонный","безумный"];
      const noun = ["тигр","медведь","волк","лис","дракон","рыцарь","капитан","пират","ниндзя","кот","сокол","робот"];
      const out = el("div", { class: "big center" });
      const gen = () => { out.textContent = adj[Math.floor(Math.random()*adj.length)] + "_" + noun[Math.floor(Math.random()*noun.length)] + Math.floor(Math.random()*100); };
      gen();
      root.appendChild(card(h3("Генератор имён"), out,
        el("div", { class: "row center mt-4" }, el("button", { class: "btn", onclick: gen }, "Ещё")),
      ));
    },
  });

  /* ============== КРЕСТИКИ-НОЛИКИ ============== */
  reg({
    id: "tictactoe",
    title: "Крестики-нолики",
    icon: "❌",
    group: "Игры",
    desc: "Против бота",
    render(root, { toast }) {
      let board, turn, over;
      const status = el("div", { class: "big center" });
      const boardEl = el("div", { class: "ttt-board", style: { margin: "12px auto" } });
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      const checkWin = (b, p) => lines.some((l) => l.every((i) => b[i] === p));
      const full = (b) => b.every(Boolean);
      const minimax = (b, isMax) => {
        if (checkWin(b, "O")) return 1;
        if (checkWin(b, "X")) return -1;
        if (full(b)) return 0;
        let best = isMax ? -Infinity : Infinity;
        for (let i = 0; i < 9; i++) if (!b[i]) {
          b[i] = isMax ? "O" : "X";
          const s = minimax(b, !isMax);
          b[i] = null;
          best = isMax ? Math.max(best, s) : Math.min(best, s);
        }
        return best;
      };
      const botMove = () => {
        let bestI = -1, bestS = -Infinity;
        for (let i = 0; i < 9; i++) if (!board[i]) {
          board[i] = "O"; const s = minimax(board, false); board[i] = null;
          if (s > bestS) { bestS = s; bestI = i; }
        }
        board[bestI] = "O"; turn = "X";
        check();
      };
      const check = () => {
        if (checkWin(board, "X")) { status.textContent = "Победа ❌!"; over = true; }
        else if (checkWin(board, "O")) { status.textContent = "Победа ⭕!"; over = true; }
        else if (full(board)) { status.textContent = "Ничья"; over = true; }
        else status.textContent = "Ход: " + turn;
        render();
      };
      const render = () => {
        boardEl.innerHTML = "";
        board.forEach((v, i) => {
          const b = el("button", { class: "ttt-cell", disabled: over || !!v, onclick: () => play(i) }, v || "");
          boardEl.appendChild(b);
        });
      };
      const play = (i) => {
        if (over || board[i] || turn !== "X") return;
        board[i] = "X"; turn = "O"; check();
        if (!over) setTimeout(botMove, 200);
      };
      const reset = () => { board = Array(9).fill(null); turn = "X"; over = false; check(); };
      reset();
      root.appendChild(card(h3("Крестики-нолики"), status, boardEl,
        el("div", { class: "row center" }, el("button", { class: "btn", onclick: reset }, "Заново"))));
    },
  });

  /* ============== ЗМЕЙКА ============== */
  reg({
    id: "snake",
    title: "Змейка",
    icon: "🐍",
    group: "Игры",
    desc: "Классика",
    render(root) {
      const canvas = el("canvas", { width: 400, height: 400, class: "snake-canvas" });
      const ctx = canvas.getContext("2d");
      const score = el("div", { class: "big center" }, "0");
      const status = el("div", { class: "muted center" }, "Стрелки или WASD");

      const cells = 20, size = 400 / cells;
      let snake, dir, food, timer, over;
      const reset = () => {
        snake = [{ x: 10, y: 10 }];
        dir = { x: 1, y: 0 };
        food = { x: 15, y: 10 };
        over = false;
        score.textContent = 0;
        clearInterval(timer);
        timer = setInterval(tick, 110);
      };
      const tick = () => {
        if (over) return;
        const head = { x: (snake[0].x + dir.x + cells) % cells, y: (snake[0].y + dir.y + cells) % cells };
        if (snake.some((s) => s.x === head.x && s.y === head.y)) {
          over = true; status.textContent = "Игра окончена. Нажмите Рестарт."; return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score.textContent = +score.textContent + 1;
          do { food = { x: Math.floor(Math.random()*cells), y: Math.floor(Math.random()*cells) }; }
          while (snake.some((s) => s.x === food.x && s.y === food.y));
        } else {
          snake.pop();
        }
        draw();
      };
      const draw = () => {
        ctx.fillStyle = getVar("--panel-2"); ctx.fillRect(0,0,400,400);
        ctx.fillStyle = getVar("--danger");
        ctx.fillRect(food.x*size+2, food.y*size+2, size-4, size-4);
        snake.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? getVar("--accent") : getVar("--accent-2");
          ctx.fillRect(s.x*size+1, s.y*size+1, size-2, size-2);
        });
      };
      const key = (e) => {
        const k = e.key.toLowerCase();
        if (k === "arrowup" || k === "w") { if (dir.y !== 1) dir = { x: 0, y: -1 }; }
        else if (k === "arrowdown" || k === "s") { if (dir.y !== -1) dir = { x: 0, y: 1 }; }
        else if (k === "arrowleft" || k === "a") { if (dir.x !== 1) dir = { x: -1, y: 0 }; }
        else if (k === "arrowright" || k === "d") { if (dir.x !== -1) dir = { x: 1, y: 0 }; }
      };
      document.addEventListener("keydown", key);
      root._cleanup = () => { clearInterval(timer); document.removeEventListener("keydown", key); };
      reset();
      root.appendChild(card(h3("Змейка"),
        el("div", { class: "center" }, canvas),
        el("div", { class: "row center mt-2" }, el("div", {}, "Счёт: ", score)),
        status,
        el("div", { class: "row center mt-2" }, el("button", { class: "btn", onclick: reset }, "Рестарт"))
      ));
    },
  });

  /* ============== УГАДАЙ ЧИСЛО ============== */
  reg({
    id: "guess",
    title: "Угадай число",
    icon: "🔢",
    group: "Игры",
    desc: "От 1 до 100",
    render(root) {
      let target, tries;
      const inp = el("input", { type: "number", min: 1, max: 100 });
      const out = el("div", { class: "output big center" });
      const btn = el("button", { class: "btn" }, "Проверить");
      const reset = () => { target = Math.floor(Math.random()*100)+1; tries = 0; out.textContent = "Введите число от 1 до 100"; inp.value = ""; };
      btn.onclick = () => {
        const g = +inp.value;
        if (!g) return;
        tries++;
        if (g === target) { out.textContent = `Угадали за ${tries} попыток! 🎉`; }
        else if (g < target) out.textContent = `Больше. (попытка ${tries})`;
        else out.textContent = `Меньше. (попытка ${tries})`;
      };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
      reset();
      root.appendChild(card(h3("Угадай число"), out,
        el("div", { class: "row mt-2" }, inp, btn, el("button", { class: "btn ghost", onclick: reset }, "Новая игра"))));
    },
  });

  /* ============== КАМЕНЬ-НОЖНИЦЫ-БУМАГА ============== */
  reg({
    id: "rps",
    title: "Камень–ножницы–бумага",
    icon: "✊",
    group: "Игры",
    desc: "Против компьютера",
    render(root) {
      const opts = [["rock","✊"],["paper","✋"],["scissors","✌️"]];
      const score = { me: 0, bot: 0 };
      const scoreEl = el("div", { class: "big center" }, "Вы: 0 | Бот: 0");
      const result = el("div", { class: "output big center" }, "Выберите!");
      const pick = (me) => {
        const bot = opts[Math.floor(Math.random()*3)][0];
        const names = { rock: "Камень", paper: "Бумага", scissors: "Ножницы" };
        let r;
        if (me === bot) r = "Ничья";
        else if ((me==="rock"&&bot==="scissors")||(me==="paper"&&bot==="rock")||(me==="scissors"&&bot==="paper"))
          { r = "Победа!"; score.me++; }
        else { r = "Поражение"; score.bot++; }
        result.textContent = `Вы: ${names[me]} | Бот: ${names[bot]} → ${r}`;
        scoreEl.textContent = `Вы: ${score.me} | Бот: ${score.bot}`;
      };
      root.appendChild(card(h3("Камень–ножницы–бумага"),
        scoreEl, result,
        el("div", { class: "row center mt-4" }, opts.map(([v, ico]) => el("button", { class: "btn", style: { fontSize: "24px" }, onclick: () => pick(v) }, ico)))
      ));
    },
  });

  /* ============== ПАМЯТЬ ============== */
  reg({
    id: "memory",
    title: "Память",
    icon: "🧠",
    group: "Игры",
    desc: "Найди пары",
    render(root, { toast }) {
      const emojis = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼"];
      let cards, first = null, lock = false, matches = 0, moves = 0;
      const grid = el("div", { class: "memory-grid", style: { justifyContent: "center", margin: "12px auto" } });
      const movesEl = el("div", { class: "muted center" }, "Ходы: 0");
      const shuffle = (a) => a.sort(() => Math.random() - 0.5);
      const reset = () => {
        cards = shuffle([...emojis, ...emojis].map((v, i) => ({ v, i, flipped: false, matched: false })));
        first = null; lock = false; matches = 0; moves = 0;
        movesEl.textContent = "Ходы: 0";
        render();
      };
      const render = () => {
        grid.innerHTML = "";
        cards.forEach((c, i) => {
          const b = el("div", {
            class: "mem-card" + (c.flipped || c.matched ? " flipped" : "") + (c.matched ? " matched" : ""),
            onclick: () => click(i),
          }, c.flipped || c.matched ? c.v : "?");
          grid.appendChild(b);
        });
      };
      const click = (i) => {
        if (lock) return;
        const c = cards[i];
        if (c.flipped || c.matched) return;
        c.flipped = true; render();
        if (first == null) { first = i; return; }
        moves++; movesEl.textContent = "Ходы: " + moves;
        if (cards[first].v === c.v) {
          cards[first].matched = true; c.matched = true;
          first = null; matches++; render();
          if (matches === emojis.length) toast("Победа за " + moves + " ходов!");
        } else {
          lock = true;
          setTimeout(() => {
            cards[first].flipped = false; c.flipped = false;
            first = null; lock = false; render();
          }, 700);
        }
      };
      reset();
      root.appendChild(card(h3("Память"), movesEl, grid,
        el("div", { class: "row center mt-2" }, el("button", { class: "btn", onclick: reset }, "Заново"))));
    },
  });

  /* ============== КЛИКЕР ============== */
  reg({
    id: "clicker",
    title: "Кликер",
    icon: "👆",
    group: "Игры",
    desc: "Набивай очки",
    render(root) {
      let score = +(localStorage.getItem("clicker") || 0);
      const out = el("div", { class: "huge center" }, String(score));
      const btn = el("button", { class: "btn", style: { fontSize: "28px", padding: "24px 40px" }, onclick: () => {
        score++; out.textContent = score; localStorage.setItem("clicker", score);
      } }, "КЛИК!");
      const reset = el("button", { class: "btn danger", onclick: () => { if(confirm("Сбросить?")){score=0;out.textContent=0;localStorage.setItem("clicker",0);} } }, "Сброс");
      root.appendChild(card(h3("Кликер"), out,
        el("div", { class: "row center mt-4" }, btn, reset)));
    },
  });

  /* ============== КУБИК ============== */
  reg({
    id: "dice",
    title: "Кубик",
    icon: "🎲",
    group: "Развлечения",
    desc: "Бросок",
    render(root) {
      const sides = el("input", { type: "number", value: 6, min: 2, max: 100 });
      const n = el("input", { type: "number", value: 2, min: 1, max: 10 });
      const out = el("div", { class: "huge center" }, "🎲");
      const roll = () => {
        const rolls = [];
        for (let i = 0; i < +n.value; i++) rolls.push(Math.floor(Math.random() * +sides.value) + 1);
        out.textContent = rolls.join(" + ") + (rolls.length > 1 ? " = " + rolls.reduce((a,b)=>a+b,0) : "");
      };
      root.appendChild(card(h3("Кубик"),
        el("div", { class: "grid cols-2" },
          el("div", {}, el("label", {}, "Граней"), sides),
          el("div", {}, el("label", {}, "Кубиков"), n)),
        out,
        el("div", { class: "row center mt-4" }, el("button", { class: "btn", onclick: roll }, "🎲 Бросить"))));
      roll();
    },
  });

  /* ============== МОНЕТА ============== */
  reg({
    id: "coin",
    title: "Монета",
    icon: "🪙",
    group: "Развлечения",
    desc: "Орёл или решка",
    render(root) {
      const out = el("div", { class: "huge center" }, "🪙");
      const flip = () => {
        out.textContent = "🔄";
        setTimeout(() => { out.textContent = Math.random() < 0.5 ? "🦅 Орёл" : "🌼 Решка"; }, 400);
      };
      root.appendChild(card(h3("Монета"), out,
        el("div", { class: "row center mt-4" }, el("button", { class: "btn", onclick: flip }, "Подбросить"))));
    },
  });

  /* ============== КОЛЕСО ФОРТУНЫ ============== */
  reg({
    id: "wheel",
    title: "Колесо фортуны",
    icon: "🎡",
    group: "Развлечения",
    desc: "Случайный выбор",
    render(root, { toast }) {
      const itemsInp = el("textarea", {}, "Пицца\nСуши\nБургер\nСалат\nПаста");
      const wrap = el("div", { class: "wheel-wrap center", style: { margin: "0 auto" } });
      const canvas = el("canvas", { class: "wheel-canvas", width: 320, height: 320 });
      wrap.appendChild(el("div", { class: "wheel-pointer" }, "🔻"));
      wrap.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      let angle = 0, spinning = false;

      const draw = () => {
        const items = itemsInp.value.split("\n").filter(Boolean);
        if (!items.length) { ctx.clearRect(0,0,320,320); return; }
        const step = (Math.PI * 2) / items.length;
        const colors = ["#7c5cff","#4cc9f0","#f72585","#2ecc71","#f9b233","#ff5c7a","#22d3ee","#a78bfa"];
        ctx.clearRect(0,0,320,320);
        ctx.save(); ctx.translate(160, 160); ctx.rotate(angle);
        items.forEach((it, i) => {
          ctx.beginPath();
          ctx.moveTo(0,0);
          ctx.arc(0, 0, 150, i*step, (i+1)*step);
          ctx.fillStyle = colors[i % colors.length];
          ctx.fill();
          ctx.save();
          ctx.rotate(i*step + step/2);
          ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "right";
          ctx.fillText(it.slice(0, 14), 140, 5);
          ctx.restore();
        });
        ctx.restore();
      };
      itemsInp.addEventListener("input", draw);
      draw();

      const spin = () => {
        if (spinning) return;
        spinning = true;
        const items = itemsInp.value.split("\n").filter(Boolean);
        const target = Math.PI * 8 + Math.random() * Math.PI * 2;
        const start = performance.now();
        const startAngle = angle;
        const animate = (t) => {
          const p = Math.min(1, (t - start) / 3500);
          const ease = 1 - Math.pow(1 - p, 3);
          angle = startAngle + target * ease;
          draw();
          if (p < 1) requestAnimationFrame(animate);
          else {
            spinning = false;
            const step = (Math.PI*2)/items.length;
            const norm = (Math.PI*1.5 - angle % (Math.PI*2) + Math.PI*4) % (Math.PI*2);
            const idx = Math.floor(norm / step) % items.length;
            toast("Выпало: " + items[idx]);
          }
        };
        requestAnimationFrame(animate);
      };

      root.appendChild(card(h3("Колесо фортуны"),
        el("div", { class: "grid cols-2" },
          el("div", {}, el("label", {}, "Варианты (по одному на строку)"), itemsInp),
          wrap),
        el("div", { class: "row center mt-4" }, el("button", { class: "btn", onclick: spin }, "Крутить!"))
      ));
    },
  });

  /* ============== ЦИТАТЫ ============== */
  reg({
    id: "quotes",
    title: "Цитаты",
    icon: "💬",
    group: "Развлечения",
    desc: "Случайные мудрости",
    render(root) {
      const quotes = [
        ["Единственная настоящая ошибка — не исправлять своих прошлых ошибок.", "Конфуций"],
        ["Жизнь — это то, что случается с тобой, пока ты строишь планы.", "Джон Леннон"],
        ["Будьте собой. Все другие роли уже заняты.", "Оскар Уайльд"],
        ["Знание — сила.", "Фрэнсис Бэкон"],
        ["Кто хочет — ищет способы, кто не хочет — причины.", "Сократ"],
        ["Лучший способ предсказать будущее — создать его.", "Питер Друкер"],
        ["В начале было слово. И слово было «баг».", "Аноним"],
        ["Простота — высшая степень утончённости.", "Леонардо да Винчи"],
      ];
      const q = el("div", { class: "big center" });
      const a = el("div", { class: "muted center" });
      const pick = () => { const [t, au] = quotes[Math.floor(Math.random()*quotes.length)]; q.textContent = "«" + t + "»"; a.textContent = "— " + au; };
      pick();
      root.appendChild(card(h3("Цитаты"), q, a,
        el("div", { class: "row center mt-4" }, el("button", { class: "btn", onclick: pick }, "Ещё"))));
    },
  });

  /* ============== АНЕКДОТЫ ============== */
  reg({
    id: "jokes",
    title: "Анекдоты",
    icon: "😂",
    group: "Развлечения",
    desc: "Чтобы улыбнуться",
    render(root) {
      const jokes = [
        "— Доктор, у меня проблемы с памятью.\n— И давно?\n— Что давно?",
        "Программист ложится спать и ставит на тумбочку два стакана: полный — если захочет пить, и пустой — если не захочет.",
        "Почему программисты путают Хэллоуин и Рождество? Потому что Oct 31 == Dec 25.",
        "— Сколько нужно программистов, чтобы поменять лампочку?\n— Нисколько, это проблема железа.",
        "Самый короткий анекдот про сисадмина: \"Проверьте кабель\".",
        "— Официант, у меня в супе волос!\n— 0.1% от массы супа — норма по ГОСТу.",
      ];
      const q = el("div", { class: "output", style: { whiteSpace: "pre-wrap", fontSize: "16px" } });
      const pick = () => { q.textContent = jokes[Math.floor(Math.random()*jokes.length)]; };
      pick();
      root.appendChild(card(h3("Анекдоты"), q,
        el("div", { class: "row center mt-4" }, el("button", { class: "btn", onclick: pick }, "Ещё"))));
    },
  });

  /* ============== РИСОВАЛКА ============== */
  reg({
    id: "draw",
    title: "Рисовалка",
    icon: "🖌️",
    group: "Развлечения",
    desc: "Рисуйте мышкой",
    render(root) {
      const canvas = el("canvas", { width: 600, height: 400, class: "draw-canvas" });
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.fillStyle = "#fff"; ctx.fillRect(0,0,600,400);
      const color = el("input", { type: "color", value: "#111111" });
      const size = el("input", { type: "range", min: 1, max: 40, value: 4 });
      let drawing = false, last = null;
      const pos = (e) => {
        const r = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: (t.clientX - r.left) * (canvas.width/r.width), y: (t.clientY - r.top) * (canvas.height/r.height) };
      };
      const start = (e) => { drawing = true; last = pos(e); e.preventDefault(); };
      const move = (e) => {
        if (!drawing) return;
        const p = pos(e);
        ctx.strokeStyle = color.value; ctx.lineWidth = +size.value;
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        last = p; e.preventDefault();
      };
      const end = () => { drawing = false; last = null; };
      canvas.addEventListener("mousedown", start);
      canvas.addEventListener("mousemove", move);
      canvas.addEventListener("mouseup", end);
      canvas.addEventListener("mouseleave", end);
      canvas.addEventListener("touchstart", start);
      canvas.addEventListener("touchmove", move);
      canvas.addEventListener("touchend", end);

      const clear = () => { ctx.fillStyle = "#fff"; ctx.fillRect(0,0,600,400); };
      const save = () => {
        const a = document.createElement("a");
        a.download = "drawing.png"; a.href = canvas.toDataURL(); a.click();
      };
      root.appendChild(card(h3("Рисовалка"),
        el("div", { class: "row" }, el("label", {}, "Цвет"), color, el("label", {}, "Толщина"), size,
          el("button", { class: "btn danger", onclick: clear }, "Очистить"),
          el("button", { class: "btn", onclick: save }, "💾 Сохранить")),
        el("div", { class: "mt-4" }, canvas)
      ));
    },
  });

  /* ============== ФЕЙЕРВЕРКИ ============== */
  reg({
    id: "fireworks",
    title: "Фейерверки",
    icon: "🎆",
    group: "Развлечения",
    desc: "Кликайте по экрану",
    render(root) {
      const canvas = el("canvas", { width: 600, height: 400, style: { background: "#0a0c1a", borderRadius: "14px", cursor: "pointer", width: "100%", maxWidth: "800px", display: "block" } });
      const ctx = canvas.getContext("2d");
      let particles = [];
      const explode = (x, y) => {
        const hue = Math.random() * 360;
        for (let i = 0; i < 60; i++) {
          const a = (Math.random() * Math.PI * 2);
          const s = Math.random() * 5 + 1;
          particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1, hue });
        }
      };
      canvas.addEventListener("click", (e) => {
        const r = canvas.getBoundingClientRect();
        explode((e.clientX - r.left) * (canvas.width/r.width), (e.clientY - r.top) * (canvas.height/r.height));
      });
      let auto;
      const loop = () => {
        ctx.fillStyle = "rgba(10,12,26,0.2)";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        particles = particles.filter((p) => p.life > 0);
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.015;
          ctx.fillStyle = `hsla(${p.hue},100%,60%,${p.life})`;
          ctx.fillRect(p.x, p.y, 3, 3);
        }
        auto = requestAnimationFrame(loop);
      };
      loop();
      const timer = setInterval(() => explode(Math.random()*canvas.width, Math.random()*canvas.height*0.7), 1400);
      root._cleanup = () => { cancelAnimationFrame(auto); clearInterval(timer); };
      root.appendChild(card(h3("Фейерверки"), el("p", { class: "muted" }, "Кликайте по холсту — будет бум!"), canvas));
    },
  });

  /* ============== ПИАНИНО ============== */
  reg({
    id: "piano",
    title: "Пианино",
    icon: "🎹",
    group: "Звук",
    desc: "Web Audio",
    render(root) {
      const keys = [
        { n: "C", f: 261.63, b: false, k: "a" },
        { n: "C#", f: 277.18, b: true, k: "w" },
        { n: "D", f: 293.66, b: false, k: "s" },
        { n: "D#", f: 311.13, b: true, k: "e" },
        { n: "E", f: 329.63, b: false, k: "d" },
        { n: "F", f: 349.23, b: false, k: "f" },
        { n: "F#", f: 369.99, b: true, k: "t" },
        { n: "G", f: 392.00, b: false, k: "g" },
        { n: "G#", f: 415.30, b: true, k: "y" },
        { n: "A", f: 440.00, b: false, k: "h" },
        { n: "A#", f: 466.16, b: true, k: "u" },
        { n: "B", f: 493.88, b: false, k: "j" },
        { n: "C2", f: 523.25, b: false, k: "k" },
      ];
      let actx;
      const play = (f, el) => {
        if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.25, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.7);
        o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.7);
        if (el) { el.classList.add("active"); setTimeout(() => el.classList.remove("active"), 200); }
      };
      const piano = el("div", { class: "piano" });
      const map = {};
      keys.forEach((k) => {
        const b = el("div", { class: "key" + (k.b ? " black" : ""), onclick: () => play(k.f, b) });
        piano.appendChild(b); map[k.k] = { k, b };
      });
      const kd = (e) => { const m = map[e.key.toLowerCase()]; if (m) play(m.k.f, m.b); };
      document.addEventListener("keydown", kd);
      root._cleanup = () => document.removeEventListener("keydown", kd);
      root.appendChild(card(h3("Пианино"), el("p", { class: "muted" }, "Клавиши: A S D F G H J K, чёрные: W E T Y U"),
        el("div", { style: { overflowX: "auto" } }, piano)));
    },
  });

  /* ============== МЕТРОНОМ ============== */
  reg({
    id: "metronome",
    title: "Метроном",
    icon: "🥁",
    group: "Звук",
    desc: "BPM",
    render(root) {
      const bpm = el("input", { type: "range", min: 30, max: 240, value: 100 });
      const lbl = el("div", { class: "big center" }, "100 BPM");
      let actx, timer;
      const tick = () => {
        if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = 1000; g.gain.setValueAtTime(0.2, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.05);
        o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.05);
      };
      const upd = () => { lbl.textContent = bpm.value + " BPM"; if (timer) { clearInterval(timer); timer = setInterval(tick, 60000 / +bpm.value); } };
      bpm.addEventListener("input", upd);
      const start = () => { if (!timer) timer = setInterval(tick, 60000 / +bpm.value); };
      const stop = () => { clearInterval(timer); timer = null; };
      root._cleanup = stop;
      root.appendChild(card(h3("Метроном"), lbl, bpm,
        el("div", { class: "row center mt-4" },
          el("button", { class: "btn ok", onclick: start }, "Старт"),
          el("button", { class: "btn danger", onclick: stop }, "Стоп"))));
    },
  });

  /* ============== КАЛЕНДАРЬ ============== */
  reg({
    id: "calendar",
    title: "Календарь",
    icon: "📅",
    group: "Инфо",
    desc: "Текущий месяц",
    render(root) {
      let d = new Date();
      const wrap = el("div");
      const draw = () => {
        wrap.innerHTML = "";
        const m = d.getMonth(), y = d.getFullYear();
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        const title = el("div", { class: "big center" }, d.toLocaleString("ru-RU", { month: "long", year: "numeric" }));
        const ctrl = el("div", { class: "row center" },
          el("button", { class: "btn ghost", onclick: () => { d = new Date(y, m - 1, 1); draw(); } }, "‹"),
          el("button", { class: "btn ghost", onclick: () => { d = new Date(); draw(); } }, "Сегодня"),
          el("button", { class: "btn ghost", onclick: () => { d = new Date(y, m + 1, 1); draw(); } }, "›"));
        const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px", marginTop: "12px" } });
        ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach((n) => grid.appendChild(el("div", { class: "muted center" }, n)));
        const startDow = (first.getDay() + 6) % 7;
        for (let i = 0; i < startDow; i++) grid.appendChild(el("div"));
        const today = new Date();
        for (let day = 1; day <= last.getDate(); day++) {
          const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
          grid.appendChild(el("div", {
            class: "center",
            style: { padding: "8px", borderRadius: "8px", background: isToday ? "var(--accent)" : "var(--panel-2)", color: isToday ? "#fff" : "var(--text)", border: "1px solid var(--border)" }
          }, String(day)));
        }
        wrap.appendChild(title); wrap.appendChild(ctrl); wrap.appendChild(grid);
      };
      draw();
      root.appendChild(card(h3("Календарь"), wrap));
    },
  });

  /* ============== ТАЙМЕР ============== */
  reg({
    id: "timer",
    title: "Таймер",
    icon: "⏲️",
    group: "Утилиты",
    desc: "Обратный отсчёт",
    render(root, { toast }) {
      const mins = el("input", { type: "number", value: 5, min: 0, max: 999 });
      const secs = el("input", { type: "number", value: 0, min: 0, max: 59 });
      const display = el("div", { class: "huge center mono" }, "05:00");
      let left = 300, timer = null;
      const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
      const setLeft = () => { left = (+mins.value || 0) * 60 + (+secs.value || 0); display.textContent = fmt(left); };
      [mins, secs].forEach((e) => e.addEventListener("input", setLeft));
      setLeft();
      const start = () => {
        if (timer || left <= 0) return;
        timer = setInterval(() => {
          left--;
          display.textContent = fmt(left);
          if (left <= 0) { clearInterval(timer); timer = null; toast("Время вышло!"); }
        }, 1000);
      };
      const stop = () => { clearInterval(timer); timer = null; };
      root._cleanup = stop;
      root.appendChild(card(h3("Таймер"),
        el("div", { class: "grid cols-2" },
          el("div", {}, el("label", {}, "Минут"), mins),
          el("div", {}, el("label", {}, "Секунд"), secs)),
        display,
        el("div", { class: "row center mt-4" },
          el("button", { class: "btn ok", onclick: start }, "Старт"),
          el("button", { class: "btn warn", onclick: stop }, "Стоп"),
          el("button", { class: "btn danger", onclick: () => { stop(); setLeft(); } }, "Сброс"))
      ));
    },
  });

  /* ============== ЧАТ-БОТ ============== */
  reg({
    id: "bot",
    title: "Чат-бот",
    icon: "🤖",
    group: "Развлечения",
    desc: "Простой эхо-бот",
    render(root) {
      const log = el("div", { class: "output", style: { minHeight: "220px", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" } });
      const inp = el("input", { type: "text", placeholder: "Напишите что-нибудь..." });
      const add = (who, msg) => {
        log.appendChild(el("div", { style: { padding: "6px 10px", borderRadius: "10px", alignSelf: who === "Вы" ? "flex-end" : "flex-start", background: who === "Вы" ? "var(--accent)" : "var(--panel)", color: who === "Вы" ? "#fff" : "var(--text)", maxWidth: "80%" } }, msg));
        log.scrollTop = log.scrollHeight;
      };
      const respond = (m) => {
        const l = m.toLowerCase();
        if (/привет|здрав|хай/.test(l)) return "Привет! Как дела?";
        if (/как дела|как ты/.test(l)) return "Я же бот, у меня всё стабильно 😄";
        if (/имя|тебя зовут/.test(l)) return "Я — Everything-бот.";
        if (/пока|бай|прощай/.test(l)) return "До встречи! 👋";
        if (/шутк|анекдот/.test(l)) return "Почему программисты путают Хэллоуин и Рождество? Oct 31 == Dec 25.";
        if (/спасибо|благодар/.test(l)) return "Всегда пожалуйста!";
        if (l.endsWith("?")) return "Интересный вопрос. А вы как думаете?";
        return "Хм... " + m.split("").reverse().join("");
      };
      const send = () => {
        if (!inp.value.trim()) return;
        const v = inp.value.trim(); inp.value = "";
        add("Вы", v);
        setTimeout(() => add("Бот", respond(v)), 300);
      };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
      add("Бот", "Здравствуйте! Напишите мне что-нибудь.");
      root.appendChild(card(h3("Чат-бот"), log,
        el("div", { class: "row mt-2" }, inp, el("button", { class: "btn", onclick: send }, "➤"))));
    },
  });

  /* ============== ПОГОДА (без API — эмулятор) ============== */
  // пропустим: без API не информативно. Добавим вместо этого что-то ещё.

  /* ============== EMOJI PICKER ============== */
  reg({
    id: "emoji",
    title: "Эмодзи",
    icon: "😀",
    group: "Утилиты",
    desc: "Каталог",
    render(root, { toast }) {
      const cats = {
        "Смайлы": "😀😁😂🤣😃😄😅😆😉😊😋😎😍😘😗😚😙🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵😡😠🤬😷🤒🤕🤢🤮🥳🥺🤠🤡🤥🤫🤭🧐🤓",
        "Жесты": "👍👎👌✌️🤞🤟🤘🤙👈👉👆👇☝️✋🤚🖐️🖖👋🤏💪👐🙌🤝🙏✍️💅🤳",
        "Сердца": "❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟",
        "Животные": "🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐒🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🪲🐛🦋🐌🐞🐜🐢🐍🐙🦑🦐🦀🐡🐠🐟🐬🐳🐋🦈🐊🦓🐘🦒🦘🦍🦧🐿️🦔",
        "Еда": "🍎🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶️🫑🌽🥕🫒🧄🧅🥔🍠🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🌭🍔🍟🍕🥪🌮🌯🥙🧆🍜🍲🍛🍣🍱🍤🍙🍚🍘🥠🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪",
        "Природа": "🌹🌺🌻🌼🌷🌸💐🌾🌿☘️🍀🍁🍂🍃🌳🌲🌴🌵🌍🌎🌏🌕🌖🌗🌘🌑🌒🌓🌔☀️🌤️⛅🌥️☁️🌦️🌧️⛈️🌩️🌨️❄️☃️⛄🌬️💨💧💦🌊",
        "Объекты": "⚽⚾🥎🏀🏐🏈🏉🎾🥏🎱🪀🏓🏸🏒🏑🥍🏏⛳🪁🏹🎣🤿🥊🥋🎽🛹🛷⛸️🥌🎿⛷️🎯🎮🕹️🎰🎲🧩♟️🎭🎨🎬🎤🎧🎼🎹🥁🎷🎺🎸🪕🎻🎲🔔📚📖🔖📒💼💻⌨️🖥️🖨️💰💎⚙️🛠️🔧🔨⚒️🔩💡🔋🧲📅📌📍📎",
      };
      const out = el("div", { class: "output center", style: { fontSize: "32px" } }, "Выберите смайл");
      const wrap = el("div");
      Object.entries(cats).forEach(([name, arr]) => {
        const h = el("div", { class: "pill mt-4" }, name);
        const grid = el("div", { style: { fontSize: "24px", display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" } });
        [...arr].forEach((em) => {
          grid.appendChild(el("button", { class: "btn ghost", style: { padding: "4px 8px", fontSize: "22px" }, onclick: () => { navigator.clipboard.writeText(em); out.textContent = em; toast("Скопирован " + em); } }, em));
        });
        wrap.appendChild(h); wrap.appendChild(grid);
      });
      root.appendChild(card(h3("Эмодзи — клик = копировать"), out, wrap));
    },
  });

  /* ============== ПРИВЯЗКА ============== */
  window.EVERYTHING_SECTIONS = SECTIONS;
})();
