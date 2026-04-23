/* +50 extra sections — appended to window.EVERYTHING_SECTIONS */
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
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  /* ========== 1. SHA-256 ========== */
  reg({
    id: "sha256", title: "SHA-256", icon: "🔒", group: "Утилиты", desc: "Хеш строки",
    render(root) {
      const input = el("textarea", { placeholder: "Введите текст..." });
      const out = el("div", { class: "output", style: { wordBreak: "break-all" } }, "—");
      const btn = el("button", {
        class: "btn", onclick: async () => {
          const data = new TextEncoder().encode(input.value);
          const buf = await crypto.subtle.digest("SHA-256", data);
          out.textContent = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
        }
      }, "Посчитать");
      root.appendChild(card(h3("SHA-256"), input, el("div", { class: "row mt-2" }, btn), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 2. URL codec ========== */
  reg({
    id: "url-codec", title: "URL encode", icon: "🔗", group: "Утилиты", desc: "encode/decode",
    render(root) {
      const ta = el("textarea", { placeholder: "Текст или URL..." });
      const out = el("div", { class: "output" }, "—");
      root.appendChild(card(
        h3("URL encode / decode"), ta,
        el("div", { class: "row mt-2" },
          el("button", { class: "btn", onclick: () => { try { out.textContent = encodeURIComponent(ta.value); } catch (e) { out.textContent = "Ошибка"; } } }, "Encode"),
          el("button", { class: "btn ghost", onclick: () => { try { out.textContent = decodeURIComponent(ta.value); } catch (e) { out.textContent = "Невалидный URL"; } } }, "Decode"),
        ),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 3. Text stats ========== */
  reg({
    id: "text-stats", title: "Текст-статистика", icon: "📊", group: "Утилиты", desc: "Слова, время чтения",
    render(root) {
      const ta = el("textarea", { placeholder: "Вставьте текст..." });
      const out = el("div", { class: "output" }, "—");
      const update = () => {
        const t = ta.value;
        const chars = t.length;
        const charsNoSpace = t.replace(/\s/g, "").length;
        const words = (t.trim().match(/\S+/g) || []).length;
        const sentences = (t.match(/[.!?]+/g) || []).length;
        const paragraphs = t.split(/\n\s*\n/).filter(p => p.trim()).length;
        const readMin = Math.max(1, Math.ceil(words / 200));
        out.textContent = `Символов: ${chars}\nБез пробелов: ${charsNoSpace}\nСлов: ${words}\nПредложений: ${sentences}\nАбзацев: ${paragraphs}\nВремя чтения: ~${readMin} мин`;
      };
      ta.addEventListener("input", update);
      update();
      root.appendChild(card(h3("Статистика текста"), ta, el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 4. Regex tester ========== */
  reg({
    id: "regex", title: "Regex тестер", icon: "🧪", group: "Утилиты", desc: "Проверка выражений",
    render(root) {
      const pat = el("input", { placeholder: "например: \\d+" });
      const flags = el("input", { placeholder: "g, i, m..." , value: "g" });
      const txt = el("textarea", { placeholder: "Текст для поиска..." });
      const out = el("div", { class: "output" }, "—");
      const run = () => {
        try {
          const re = new RegExp(pat.value, flags.value);
          const matches = [...txt.value.matchAll(new RegExp(pat.value, flags.value.includes("g") ? flags.value : flags.value + "g"))];
          out.textContent = matches.length
            ? `Найдено: ${matches.length}\n` + matches.slice(0, 100).map((m, i) => `${i + 1}. "${m[0]}" @ ${m.index}`).join("\n")
            : "Совпадений нет";
        } catch (e) { out.textContent = "Ошибка: " + e.message; }
      };
      pat.addEventListener("input", run); flags.addEventListener("input", run); txt.addEventListener("input", run);
      root.appendChild(card(
        h3("Regex тестер"),
        el("div", { class: "row" }, el("label", {}, "Pattern"), pat, el("label", {}, "Flags"), flags),
        txt, el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 5. UUID v4 ========== */
  reg({
    id: "uuid", title: "UUID v4", icon: "🆔", group: "Генераторы", desc: "Случайные UUID",
    render(root) {
      const out = el("div", { class: "output", style: { fontFamily: "monospace" } }, "—");
      const count = el("input", { type: "number", value: "5", min: "1", max: "1000" });
      const gen = () => {
        const n = Math.min(1000, Math.max(1, parseInt(count.value, 10) || 1));
        out.textContent = Array.from({ length: n }, () => crypto.randomUUID()).join("\n");
      };
      gen();
      root.appendChild(card(
        h3("UUID v4 генератор"),
        el("div", { class: "row" }, el("label", {}, "Сколько"), count, el("button", { class: "btn", onclick: gen }, "Сгенерировать"),
          el("button", { class: "btn ghost", onclick: () => navigator.clipboard.writeText(out.textContent) }, "Копировать")),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 6. Timestamp ========== */
  reg({
    id: "timestamp", title: "Timestamp", icon: "⏰", group: "Утилиты", desc: "Unix ↔ дата",
    render(root) {
      const tsIn = el("input", { type: "number", placeholder: "1700000000", value: Math.floor(Date.now() / 1000) });
      const dateIn = el("input", { type: "datetime-local" });
      const out = el("div", { class: "output" }, "—");
      dateIn.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const updateFromTs = () => {
        const v = parseInt(tsIn.value, 10);
        if (isFinite(v)) {
          const ms = v > 1e12 ? v : v * 1000;
          const d = new Date(ms);
          out.textContent = `ISO: ${d.toISOString()}\nLocal: ${d.toString()}\nUTC: ${d.toUTCString()}`;
        }
      };
      const updateFromDate = () => {
        const d = new Date(dateIn.value);
        if (!isNaN(d)) {
          const sec = Math.floor(d.getTime() / 1000);
          out.textContent = `Unix (sec): ${sec}\nUnix (ms): ${d.getTime()}\nISO: ${d.toISOString()}`;
          tsIn.value = sec;
        }
      };
      tsIn.addEventListener("input", updateFromTs);
      dateIn.addEventListener("input", updateFromDate);
      updateFromTs();
      root.appendChild(card(
        h3("Timestamp конвертер"),
        el("div", { class: "row" }, el("label", {}, "Unix"), tsIn, el("label", {}, "Дата"), dateIn),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 7. CSV / JSON ========== */
  reg({
    id: "csv-json", title: "CSV ↔ JSON", icon: "📑", group: "Утилиты", desc: "Взаимная конвертация",
    render(root) {
      const inp = el("textarea", { placeholder: "name,age\\nAlice,30\\nBob,25" });
      const out = el("textarea", { readonly: true });
      const parseCsv = (s) => {
        const rows = s.trim().split(/\r?\n/).map(r => r.split(","));
        const [head, ...body] = rows;
        return body.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || "").trim()])));
      };
      const toCsv = (arr) => {
        if (!Array.isArray(arr) || !arr.length) return "";
        const keys = [...new Set(arr.flatMap(o => Object.keys(o)))];
        return [keys.join(","), ...arr.map(o => keys.map(k => (o[k] ?? "")).join(","))].join("\n");
      };
      root.appendChild(card(
        h3("CSV ↔ JSON"), inp,
        el("div", { class: "row mt-2" },
          el("button", { class: "btn", onclick: () => { try { out.value = JSON.stringify(parseCsv(inp.value), null, 2); } catch (e) { out.value = "Ошибка: " + e.message; } } }, "CSV → JSON"),
          el("button", { class: "btn ghost", onclick: () => { try { out.value = toCsv(JSON.parse(inp.value)); } catch (e) { out.value = "Ошибка: " + e.message; } } }, "JSON → CSV"),
        ),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 8. Base converter ========== */
  reg({
    id: "base-conv", title: "Системы счисления", icon: "🔢", group: "Утилиты", desc: "Dec/Hex/Bin/Oct",
    render(root) {
      const dec = el("input", { placeholder: "Dec", value: "42" });
      const hex = el("input", { placeholder: "Hex" });
      const bin = el("input", { placeholder: "Bin" });
      const oct = el("input", { placeholder: "Oct" });
      const update = (from) => {
        let n = NaN;
        try {
          if (from === "dec") n = parseInt(dec.value, 10);
          else if (from === "hex") n = parseInt(hex.value, 16);
          else if (from === "bin") n = parseInt(bin.value, 2);
          else if (from === "oct") n = parseInt(oct.value, 8);
        } catch (e) { }
        if (!isFinite(n)) return;
        if (from !== "dec") dec.value = String(n);
        if (from !== "hex") hex.value = n.toString(16).toUpperCase();
        if (from !== "bin") bin.value = n.toString(2);
        if (from !== "oct") oct.value = n.toString(8);
      };
      dec.addEventListener("input", () => update("dec"));
      hex.addEventListener("input", () => update("hex"));
      bin.addEventListener("input", () => update("bin"));
      oct.addEventListener("input", () => update("oct"));
      update("dec");
      root.appendChild(card(
        h3("Системы счисления"),
        el("div", { class: "row" }, el("label", {}, "Dec"), dec, el("label", {}, "Hex"), hex),
        el("div", { class: "row mt-2" }, el("label", {}, "Bin"), bin, el("label", {}, "Oct"), oct),
      ));
    },
  });

  /* ========== 9. Tip calculator ========== */
  reg({
    id: "tip-calc", title: "Чаевые", icon: "💵", group: "Утилиты", desc: "Счёт + tip",
    render(root) {
      const bill = el("input", { type: "number", value: "1000" });
      const tip = el("input", { type: "range", min: "0", max: "30", value: "10" });
      const people = el("input", { type: "number", value: "2", min: "1" });
      const out = el("div", { class: "output" });
      const upd = () => {
        const b = parseFloat(bill.value) || 0;
        const t = parseInt(tip.value, 10);
        const p = Math.max(1, parseInt(people.value, 10) || 1);
        const tipAmt = b * t / 100;
        const total = b + tipAmt;
        out.textContent = `Счёт: ${b.toFixed(2)}\nЧаевые (${t}%): ${tipAmt.toFixed(2)}\nИтого: ${total.toFixed(2)}\nНа человека: ${(total / p).toFixed(2)}`;
      };
      [bill, tip, people].forEach(x => x.addEventListener("input", upd));
      upd();
      root.appendChild(card(
        h3("Калькулятор чаевых"),
        el("div", { class: "row" }, el("label", {}, "Счёт"), bill, el("label", {}, "Чаевые %"), tip, el("label", {}, "Людей"), people),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 10. Loan calculator ========== */
  reg({
    id: "loan-calc", title: "Кредит", icon: "🏦", group: "Утилиты", desc: "Ежемесячный платёж",
    render(root) {
      const amt = el("input", { type: "number", value: "1000000" });
      const rate = el("input", { type: "number", value: "15", step: "0.1" });
      const years = el("input", { type: "number", value: "5" });
      const out = el("div", { class: "output" });
      const upd = () => {
        const P = parseFloat(amt.value) || 0;
        const r = (parseFloat(rate.value) || 0) / 100 / 12;
        const n = (parseInt(years.value, 10) || 1) * 12;
        const M = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const total = M * n;
        out.textContent = `Платёж: ${M.toFixed(2)} / мес\nВсего выплатите: ${total.toFixed(2)}\nПереплата: ${(total - P).toFixed(2)}`;
      };
      [amt, rate, years].forEach(x => x.addEventListener("input", upd));
      upd();
      root.appendChild(card(
        h3("Кредитный калькулятор"),
        el("div", { class: "row" }, el("label", {}, "Сумма"), amt, el("label", {}, "Ставка %"), rate, el("label", {}, "Лет"), years),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 11. Morse ========== */
  reg({
    id: "morse", title: "Азбука Морзе", icon: "📡", group: "Утилиты", desc: "En/Ru translator",
    render(root) {
      const map = {
        A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
        А: ".-", Б: "-...", В: ".--", Г: "--.", Д: "-..", Е: ".", Ж: "...-", З: "--..", И: "..", Й: ".---", К: "-.-", Л: ".-..", М: "--", Н: "-.", О: "---", П: ".--.", Р: ".-.", С: "...", Т: "-", У: "..-", Ф: "..-.", Х: "....", Ц: "-.-.", Ч: "---.", Ш: "----", Щ: "--.-", Ъ: "--.--", Ы: "-.--", Ь: "-..-", Э: "..-..", Ю: "..--", Я: ".-.-",
        0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
      };
      const inv = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
      const inp = el("textarea", { placeholder: "Текст или точки-тире..." });
      const out = el("div", { class: "output" });
      const encode = () => { out.textContent = [...inp.value.toUpperCase()].map(c => map[c] ?? (c === " " ? "/" : "")).join(" "); };
      const decode = () => { out.textContent = inp.value.trim().split(/\s+/).map(t => t === "/" ? " " : inv[t] ?? "?").join(""); };
      root.appendChild(card(
        h3("Морзе"),
        inp,
        el("div", { class: "row mt-2" },
          el("button", { class: "btn", onclick: encode }, "→ Морзе"),
          el("button", { class: "btn ghost", onclick: decode }, "→ Текст"),
        ),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 12. Число прописью ========== */
  reg({
    id: "num-words", title: "Число прописью", icon: "🔤", group: "Утилиты", desc: "Число → текст",
    render(root) {
      const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
      const onesF = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
      const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
      const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
      const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
      const grp3 = (n, fem) => {
        const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
        const parts = [];
        if (h) parts.push(hundreds[h]);
        if (t === 1) parts.push(teens[u]);
        else {
          if (t) parts.push(tens[t]);
          if (u) parts.push(fem ? onesF[u] : ones[u]);
        }
        return parts.join(" ");
      };
      const plural = (n, forms) => { n = Math.abs(n) % 100; const m = n % 10; if (n > 10 && n < 20) return forms[2]; if (m > 1 && m < 5) return forms[1]; if (m === 1) return forms[0]; return forms[2]; };
      const num2w = (n) => {
        if (!isFinite(n)) return "—"; if (n === 0) return "ноль"; if (n < 0) return "минус " + num2w(-n);
        const bil = Math.floor(n / 1e9), mil = Math.floor((n % 1e9) / 1e6), thou = Math.floor((n % 1e6) / 1e3), rest = n % 1000;
        const parts = [];
        if (bil) parts.push(grp3(bil) + " " + plural(bil, ["миллиард", "миллиарда", "миллиардов"]));
        if (mil) parts.push(grp3(mil) + " " + plural(mil, ["миллион", "миллиона", "миллионов"]));
        if (thou) parts.push(grp3(thou, true) + " " + plural(thou, ["тысяча", "тысячи", "тысяч"]));
        if (rest) parts.push(grp3(rest));
        return parts.join(" ").replace(/\s+/g, " ").trim();
      };
      const inp = el("input", { type: "number", value: "1234567", min: "0", max: "999999999999" });
      const out = el("div", { class: "output" });
      const upd = () => { out.textContent = num2w(parseInt(inp.value, 10)); };
      inp.addEventListener("input", upd); upd();
      root.appendChild(card(h3("Число прописью"), el("div", { class: "row" }, el("label", {}, "Число"), inp), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 13. Percent ========== */
  reg({
    id: "percent", title: "Проценты", icon: "％", group: "Утилиты", desc: "Калькулятор %",
    render(root) {
      const a = el("input", { type: "number", value: "200" });
      const b = el("input", { type: "number", value: "10" });
      const out = el("div", { class: "output" });
      const upd = () => {
        const x = parseFloat(a.value) || 0, y = parseFloat(b.value) || 0;
        out.textContent = `${y}% от ${x} = ${(x * y / 100).toFixed(4)}\n${x} это ${((x / (y || 1)) * 100).toFixed(4)}% от ${y}\n${x} + ${y}% = ${(x * (1 + y / 100)).toFixed(4)}\n${x} − ${y}% = ${(x * (1 - y / 100)).toFixed(4)}\n${x} от ${y} = ${((x / (y || 1)) * 100).toFixed(4)}%`;
      };
      a.addEventListener("input", upd); b.addEventListener("input", upd); upd();
      root.appendChild(card(h3("Калькулятор процентов"), el("div", { class: "row" }, el("label", {}, "A"), a, el("label", {}, "B (%)"), b), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 14. Date diff ========== */
  reg({
    id: "date-diff", title: "Разница дат", icon: "📆", group: "Утилиты", desc: "Дней между",
    render(root) {
      const a = el("input", { type: "date", value: new Date().toISOString().slice(0, 10) });
      const b = el("input", { type: "date", value: new Date().toISOString().slice(0, 10) });
      const out = el("div", { class: "output" });
      const upd = () => {
        const d1 = new Date(a.value), d2 = new Date(b.value);
        if (isNaN(d1) || isNaN(d2)) { out.textContent = "—"; return; }
        const ms = Math.abs(d2 - d1), days = Math.floor(ms / 86400000);
        const weeks = Math.floor(days / 7);
        const years = Math.floor(days / 365.25);
        out.textContent = `Дней: ${days}\nНедель: ${weeks}\nЛет (прибл.): ${years}\nЧасов: ${Math.floor(ms / 3.6e6)}\nМинут: ${Math.floor(ms / 60000)}`;
      };
      a.addEventListener("input", upd); b.addEventListener("input", upd); upd();
      root.appendChild(card(h3("Разница между датами"), el("div", { class: "row" }, el("label", {}, "От"), a, el("label", {}, "До"), b), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 15. Char table ========== */
  reg({
    id: "char-table", title: "Символы", icon: "🔣", group: "Утилиты", desc: "Unicode стрелки/символы",
    render(root, { toast }) {
      const ranges = {
        "Стрелки": [0x2190, 0x21ff],
        "Мат. операторы": [0x2200, 0x22ff],
        "Геометрия": [0x25a0, 0x25ff],
        "Разное": [0x2600, 0x26ff],
        "Дингбаты": [0x2700, 0x27bf],
      };
      const out = el("div", { class: "output center", style: { fontSize: "28px", minHeight: "50px" } }, "Клик = копировать");
      const wrap = el("div");
      Object.entries(ranges).forEach(([name, [lo, hi]]) => {
        const h = el("div", { class: "pill mt-4" }, name);
        const grid = el("div", { style: { display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "6px" } });
        for (let c = lo; c <= hi; c++) {
          const ch = String.fromCodePoint(c);
          grid.appendChild(el("button", { class: "btn ghost", style: { padding: "2px 6px", fontSize: "18px", minWidth: "32px" }, title: "U+" + c.toString(16).toUpperCase(), onclick: () => { navigator.clipboard.writeText(ch); out.textContent = ch; toast("Скопирован"); } }, ch));
        }
        wrap.appendChild(h); wrap.appendChild(grid);
      });
      root.appendChild(card(h3("Таблица символов"), out, wrap));
    },
  });

  /* ========== 16. Avatar ========== */
  reg({
    id: "avatar", title: "Аватар", icon: "🧑‍🎨", group: "Генераторы", desc: "Инициалы + цвет",
    render(root) {
      const name = el("input", { placeholder: "Имя Фамилия", value: "Иван Иванов" });
      const preview = el("div", { style: { width: "160px", height: "160px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px", fontWeight: "700", color: "#fff" } });
      const update = () => {
        const parts = name.value.trim().split(/\s+/);
        const initials = (parts[0]?.[0] || "?") + (parts[1]?.[0] || "");
        let hash = 0; for (const ch of name.value) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
        const hue = hash % 360;
        preview.style.background = `hsl(${hue} 60% 50%)`;
        preview.textContent = initials.toUpperCase();
      };
      name.addEventListener("input", update); update();
      root.appendChild(card(h3("Аватар по имени"), el("div", { class: "row" }, el("label", {}, "Имя"), name), el("div", { class: "center mt-3" }, preview)));
    },
  });

  /* ========== 17. Barcode (simple EAN-like stripes) ========== */
  reg({
    id: "barcode", title: "Штрих-код", icon: "▮", group: "Генераторы", desc: "Декоративный",
    render(root) {
      const inp = el("input", { value: "1234567890" });
      const svg = el("div");
      const upd = () => {
        const text = inp.value;
        let hash = 0; for (const c of text) hash = (hash * 131 + c.charCodeAt(0)) >>> 0;
        const bars = []; let seed = hash || 1;
        for (let i = 0; i < 60; i++) { seed = (seed * 1103515245 + 12345) >>> 0; bars.push((seed & 3) + 1); }
        let x = 0; const rects = bars.map((w, i) => { const rx = `<rect x="${x}" y="0" width="${i % 2 === 0 ? w : 0}" height="120" fill="#000"/>`; x += w + 1; return rx; }).join("");
        svg.innerHTML = `<svg width="100%" viewBox="0 0 ${x} 140" style="background:#fff;padding:10px;border-radius:8px"><g>${rects}</g><text x="${x / 2}" y="135" text-anchor="middle" font-size="14" font-family="monospace">${text}</text></svg>`;
      };
      inp.addEventListener("input", upd); upd();
      root.appendChild(card(h3("Штрих-код (декоративный)"), el("div", { class: "row" }, el("label", {}, "Текст"), inp), el("div", { class: "mt-3" }, svg)));
    },
  });

  /* ========== 18. Mandala / spirograph ========== */
  reg({
    id: "mandala", title: "Мандала", icon: "🌸", group: "Генераторы", desc: "Спирограф",
    render(root) {
      const cvs = el("canvas", { width: 500, height: 500, style: { background: "#0b0f20", borderRadius: "10px", maxWidth: "100%" } });
      const R = el("input", { type: "range", min: "10", max: "200", value: "100" });
      const r = el("input", { type: "range", min: "10", max: "200", value: "65" });
      const d = el("input", { type: "range", min: "0", max: "200", value: "120" });
      const draw = () => {
        const ctx = cvs.getContext("2d");
        ctx.fillStyle = "#0b0f20"; ctx.fillRect(0, 0, 500, 500);
        ctx.strokeStyle = "#7c5cff"; ctx.lineWidth = 1; ctx.beginPath();
        const bigR = +R.value, smallR = +r.value, dd = +d.value;
        for (let t = 0; t < Math.PI * 200; t += 0.05) {
          const x = (bigR - smallR) * Math.cos(t) + dd * Math.cos(((bigR - smallR) / smallR) * t);
          const y = (bigR - smallR) * Math.sin(t) - dd * Math.sin(((bigR - smallR) / smallR) * t);
          const X = 250 + x, Y = 250 + y;
          if (t === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      };
      [R, r, d].forEach(x => x.addEventListener("input", draw));
      draw();
      root.appendChild(card(
        h3("Мандала / спирограф"),
        el("div", { class: "row" }, el("label", {}, "R"), R, el("label", {}, "r"), r, el("label", {}, "d"), d),
        el("div", { class: "center mt-3" }, cvs)
      ));
    },
  });

  /* ========== 19. Pattern generator ========== */
  reg({
    id: "pattern-gen", title: "Паттерн CSS", icon: "🧩", group: "Генераторы", desc: "Repeating bg",
    render(root, { toast }) {
      const preview = el("div", { style: { height: "200px", borderRadius: "10px", border: "1px solid var(--border)" } });
      const code = el("div", { class: "output" });
      const gen = () => {
        const h = rand(0, 360); const h2 = (h + rand(30, 180)) % 360;
        const sz = rand(20, 60);
        const patterns = [
          `repeating-linear-gradient(45deg, hsl(${h} 50% 40%) 0 10px, hsl(${h2} 50% 30%) 10px 20px)`,
          `repeating-linear-gradient(0deg, hsl(${h} 60% 40%) 0 ${sz / 2}px, transparent ${sz / 2}px ${sz}px)`,
          `radial-gradient(circle at center, hsl(${h} 60% 50%) ${sz / 4}px, transparent ${sz / 4}px) 0 0 / ${sz}px ${sz}px, hsl(${h2} 40% 20%)`,
          `conic-gradient(hsl(${h} 60% 50%) 0 25%, hsl(${h2} 60% 40%) 25% 50%, hsl(${h} 60% 30%) 50% 75%, hsl(${h2} 60% 60%) 75% 100%) 0 0 / ${sz}px ${sz}px`,
        ];
        const p = pick(patterns);
        preview.style.background = p;
        code.textContent = `background: ${p};`;
      };
      gen();
      root.appendChild(card(
        h3("Генератор CSS-паттернов"),
        el("div", { class: "row" },
          el("button", { class: "btn", onclick: gen }, "Новый"),
          el("button", { class: "btn ghost", onclick: () => { navigator.clipboard.writeText(code.textContent); toast("Скопирован CSS"); } }, "Скопировать"),
        ),
        el("div", { class: "mt-3" }, preview),
        el("div", { class: "mt-2" }, code)
      ));
    },
  });

  /* ========== 20. Fake user ========== */
  reg({
    id: "fake-user", title: "Фейковый юзер", icon: "🕵️", group: "Генераторы", desc: "Имя, email, адрес",
    render(root) {
      const firstNames = ["Александр", "Екатерина", "Михаил", "Ольга", "Иван", "Мария", "Сергей", "Анна", "Дмитрий", "Елена"];
      const lastNames = ["Иванов", "Смирнова", "Петров", "Волкова", "Козлов", "Новикова", "Фёдоров", "Морозова", "Попов", "Соколова"];
      const cities = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Самара"];
      const streets = ["Ленина", "Мира", "Центральная", "Садовая", "Гагарина", "Пушкина"];
      const out = el("div", { class: "output" });
      const gen = () => {
        const fn = pick(firstNames), ln = pick(lastNames);
        const translit = { А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ж: "Zh", З: "Z", И: "I", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Sch", Ъ: "", Ы: "y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya" };
        const mail = (ln + fn[0]).toLowerCase().split("").map(c => translit[c.toUpperCase()]?.toLowerCase() || c).join("") + rand(10, 99) + "@" + pick(["mail.ru", "gmail.com", "yandex.ru"]);
        out.textContent = `ФИО: ${fn} ${ln}\nEmail: ${mail}\nТелефон: +7 (9${rand(10, 99)}) ${rand(100, 999)}-${rand(10, 99)}-${rand(10, 99)}\nГород: ${pick(cities)}\nУлица: ул. ${pick(streets)}, д. ${rand(1, 150)}, кв. ${rand(1, 300)}\nВозраст: ${rand(18, 80)}\nIP: ${rand(1, 254)}.${rand(0, 255)}.${rand(0, 255)}.${rand(0, 255)}`;
      };
      gen();
      root.appendChild(card(h3("Случайный пользователь"), el("button", { class: "btn", onclick: gen }, "Новый"), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 21. Random fact ========== */
  reg({
    id: "random-fact", title: "Случайный факт", icon: "💡", group: "Развлечения", desc: "Интересное",
    render(root) {
      const facts = [
        "Мёд не портится — археологи находили съедобный мёд возрастом 3000 лет.",
        "У осьминога три сердца и голубая кровь.",
        "Банан — это ягода, а клубника — нет.",
        "В человеческом теле около 37 триллионов клеток.",
        "Крошечные следы платины есть в каждой молнии.",
        "Коалы спят до 22 часов в сутки.",
        "Эйфелева башня летом выше на 15 см из-за теплового расширения.",
        "Кошки не могут чувствовать сладкий вкус.",
        "У улитки около 14 000 зубов.",
        "Венера вращается в обратную сторону по сравнению с большинством планет.",
        "Сердце креветки расположено в её голове.",
        "Скорость чихания может превышать 160 км/ч.",
        "Наутилусы существуют более 500 миллионов лет.",
        "Первый сайт в мире до сих пор работает: info.cern.ch.",
        "ДНК человека совпадает с ДНК банана примерно на 50%.",
        "Свет от Солнца достигает Земли за 8 минут 20 секунд.",
        "Слоны — единственные животные, не умеющие прыгать.",
        "Бабочки пробуют еду ногами.",
        "В одной капле воды — около 1.67 секстиллионов молекул H₂O.",
        "В Австралии розовые озёра из-за особых бактерий.",
      ];
      const out = el("div", { class: "output", style: { fontSize: "18px" } }, pick(facts));
      root.appendChild(card(h3("Случайный факт"), el("button", { class: "btn", onclick: () => out.textContent = pick(facts) }, "Ещё факт"), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 22. Idea generator ========== */
  reg({
    id: "idea-gen", title: "Генератор идей", icon: "🎯", group: "Генераторы", desc: "Бизнес/творчество",
    render(root) {
      const what = ["платформу", "бота", "игру", "сервис", "приложение", "сайт", "инструмент", "сообщество", "подкаст", "ютуб-канал"];
      const who = ["для фрилансеров", "для студентов", "для родителей", "для геймеров", "для собачников", "для бегунов", "для художников", "для программистов", "для путешественников", "для писателей"];
      const how = ["с ИИ-помощником", "на блокчейне", "с геймификацией", "с AR", "полностью офлайн", "на WebGL", "как прогрессивное веб-приложение", "с голосовым управлением", "с элементами RPG", "минималистичное"];
      const out = el("div", { class: "output", style: { fontSize: "18px" } });
      const gen = () => out.textContent = `Создайте ${pick(what)} ${pick(who)} ${pick(how)}.`;
      gen();
      root.appendChild(card(h3("Генератор идей"), el("button", { class: "btn", onclick: gen }, "Ещё идея"), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 23. 2048 ========== */
  reg({
    id: "g2048", title: "2048", icon: "🧮", group: "Игры", desc: "Классика",
    render(root) {
      const N = 4; let grid, score, best = +(localStorage.getItem("2048-best") || 0), over;
      const board = el("div", { style: { display: "grid", gridTemplateColumns: `repeat(${N}, 64px)`, gap: "6px", background: "var(--panel-2)", padding: "8px", borderRadius: "10px", width: "fit-content" } });
      const scoreEl = el("div", { class: "pill" }); const bestEl = el("div", { class: "pill" });
      const addRandom = () => { const empty = []; grid.forEach((r, i) => r.forEach((v, j) => { if (!v) empty.push([i, j]); })); if (!empty.length) return; const [i, j] = pick(empty); const c = localStorage.getItem("cheat-2048"); if (c === "big") grid[i][j] = 128; else if (c === "win") grid[i][j] = 1024; else grid[i][j] = Math.random() < 0.9 ? 2 : 4; };
      const reset = () => { grid = Array.from({ length: N }, () => Array(N).fill(0)); score = 0; over = false; addRandom(); addRandom(); render(); };
      const colorFor = v => { const colors = { 0: "#1a1d30", 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563", 32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61", 512: "#edc850", 1024: "#edc53f", 2048: "#edc22e" }; return colors[v] || "#3c3a32"; };
      const render = () => {
        board.innerHTML = "";
        grid.forEach(r => r.forEach(v => {
          board.appendChild(el("div", { style: { width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", background: colorFor(v), color: v > 4 ? "#fff" : "#776e65", fontWeight: "700", fontSize: v >= 1024 ? "18px" : "22px", borderRadius: "6px" } }, v || ""));
        }));
        scoreEl.textContent = "Счёт: " + score; bestEl.textContent = "Рекорд: " + best;
      };
      const slideRow = (row) => {
        const a = row.filter(v => v); const merged = [];
        for (let i = 0; i < a.length; i++) { if (a[i] === a[i + 1]) { merged.push(a[i] * 2); score += a[i] * 2; i++; } else merged.push(a[i]); }
        while (merged.length < N) merged.push(0); return merged;
      };
      const move = (dir) => {
        if (over) return;
        const before = JSON.stringify(grid);
        if (dir === "L") grid = grid.map(slideRow);
        else if (dir === "R") grid = grid.map(r => slideRow(r.slice().reverse()).reverse());
        else if (dir === "U") { for (let c = 0; c < N; c++) { const col = grid.map(r => r[c]); const s = slideRow(col); for (let i = 0; i < N; i++) grid[i][c] = s[i]; } }
        else if (dir === "D") { for (let c = 0; c < N; c++) { const col = grid.map(r => r[c]).reverse(); const s = slideRow(col).reverse(); for (let i = 0; i < N; i++) grid[i][c] = s[i]; } }
        if (JSON.stringify(grid) !== before) { addRandom(); if (score > best) { best = score; localStorage.setItem("2048-best", best); } render(); }
      };
      const onKey = (e) => {
        const map = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D", a: "L", d: "R", w: "U", s: "D" };
        if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
      };
      document.addEventListener("keydown", onKey);
      root._cleanup = () => document.removeEventListener("keydown", onKey);
      reset();
      root.appendChild(card(h3("2048"), el("div", { class: "row" }, scoreEl, bestEl, el("button", { class: "btn", onclick: reset }, "Заново")),
        el("div", { class: "mt-3 center" }, board),
        el("p", { class: "mt-2", style: { color: "var(--muted)", textAlign: "center" } }, "Стрелки или WASD")
      ));
    },
  });

  /* ========== 24. Minesweeper ========== */
  reg({
    id: "minesweeper", title: "Сапёр", icon: "💣", group: "Игры", desc: "Классика",
    render(root) {
      const N = 9, M = 10; let grid, revealed, flagged, over, firstClick;
      const boardWrap = el("div", { style: { display: "inline-block", background: "var(--panel-2)", padding: "6px", borderRadius: "10px" } });
      const status = el("div", { class: "pill" });
      const build = () => {
        grid = Array.from({ length: N }, () => Array(N).fill(0));
        revealed = Array.from({ length: N }, () => Array(N).fill(false));
        flagged = Array.from({ length: N }, () => Array(N).fill(false));
        over = false; firstClick = true;
      };
      const placeMines = (skipI, skipJ) => {
        let placed = 0;
        while (placed < M) {
          const i = rand(0, N - 1), j = rand(0, N - 1);
          if (grid[i][j] === "*") continue;
          if (Math.abs(i - skipI) <= 1 && Math.abs(j - skipJ) <= 1) continue;
          grid[i][j] = "*"; placed++;
        }
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          if (grid[i][j] === "*") continue;
          let c = 0; for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const ni = i + di, nj = j + dj; if (ni >= 0 && ni < N && nj >= 0 && nj < N && grid[ni][nj] === "*") c++; }
          grid[i][j] = c;
        }
      };
      const flood = (i, j) => {
        if (i < 0 || i >= N || j < 0 || j >= N || revealed[i][j] || flagged[i][j]) return;
        revealed[i][j] = true;
        if (grid[i][j] === 0) for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) if (di || dj) flood(i + di, j + dj);
      };
      const click = (i, j) => {
        if (over || flagged[i][j]) return;
        if (firstClick) { placeMines(i, j); firstClick = false; }
        if (grid[i][j] === "*") { over = true; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (grid[a][b] === "*") revealed[a][b] = true; status.textContent = "💥 Проигрыш"; render(); return; }
        flood(i, j);
        const totalCells = N * N; let revealedCount = 0;
        for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (revealed[a][b]) revealedCount++;
        if (revealedCount === totalCells - M) { over = true; status.textContent = "🎉 Победа!"; }
        render();
      };
      const flag = (i, j) => { if (over || revealed[i][j]) return; flagged[i][j] = !flagged[i][j]; render(); };
      const render = () => {
        boardWrap.innerHTML = "";
        const b = el("div", { style: { display: "grid", gridTemplateColumns: `repeat(${N}, 30px)`, gap: "2px" } });
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const v = grid[i][j];
          const cell = el("button", {
            style: { width: "30px", height: "30px", fontSize: "14px", fontWeight: "700", background: revealed[i][j] ? "var(--panel)" : "var(--panel-2)", color: ["", "#4cc9f0", "#2ec27e", "#f6c23e", "#ff6b6b", "#c77dff", "#ff9e4a", "#e76f51", "#6f42c1"][v] || "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", cursor: over ? "default" : "pointer" },
            onclick: () => click(i, j),
            oncontextmenu: (e) => { e.preventDefault(); flag(i, j); }
          }, revealed[i][j] ? (v === "*" ? "💣" : (v || "")) : (flagged[i][j] ? "🚩" : ""));
          b.appendChild(cell);
        }
        boardWrap.appendChild(b);
        if (!over) status.textContent = `Мин: ${M}`;
      };
      const reset = () => { build(); render(); };
      reset();
      root.appendChild(card(h3("Сапёр"), el("div", { class: "row" }, status, el("button", { class: "btn", onclick: reset }, "Заново")),
        el("div", { class: "mt-3 center" }, boardWrap),
        el("p", { class: "mt-2", style: { color: "var(--muted)", textAlign: "center" } }, "ЛКМ — открыть, ПКМ — флажок")
      ));
    },
  });

  /* ========== 25. Whack a mole ========== */
  reg({
    id: "whack", title: "Поймай крота", icon: "🐹", group: "Игры", desc: "На время",
    render(root) {
      const N = 9; let score = 0, time = 30, running = false, current = -1, iv;
      const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 80px)", gap: "8px" } });
      const cells = [];
      for (let i = 0; i < N; i++) {
        const c = el("div", { style: { width: "80px", height: "80px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", userSelect: "none" }, onclick: () => { if (running && i === current) { score++; scoreEl.textContent = "Очки: " + score; c.textContent = "🎯"; setTimeout(() => { c.textContent = ""; }, 200); current = -1; } } });
        cells.push(c); grid.appendChild(c);
      }
      const scoreEl = el("div", { class: "pill" }, "Очки: 0");
      const timeEl = el("div", { class: "pill" }, "Время: 30");
      const startBtn = el("button", { class: "btn" }, "Старт");
      const tick = () => {
        if (current >= 0) cells[current].textContent = "";
        current = rand(0, N - 1); cells[current].textContent = "🐹";
      };
      const start = () => {
        if (running) return;
        running = true; score = 0; time = 30; scoreEl.textContent = "Очки: 0"; timeEl.textContent = "Время: 30";
        iv = setInterval(() => {
          tick();
          time--; timeEl.textContent = "Время: " + time;
          if (time <= 0) { clearInterval(iv); running = false; if (current >= 0) cells[current].textContent = ""; current = -1; timeEl.textContent = "Конец! " + score + " очков"; }
        }, 700);
      };
      startBtn.onclick = start;
      root._cleanup = () => { clearInterval(iv); running = false; };
      root.appendChild(card(h3("Поймай крота"), el("div", { class: "row" }, scoreEl, timeEl, startBtn), el("div", { class: "mt-3 center" }, grid)));
    },
  });

  /* ========== 26. Typing speed ========== */
  reg({
    id: "typing", title: "Тест печати", icon: "⌨️", group: "Игры", desc: "WPM",
    render(root) {
      const texts = [
        "Быстрая бурая лиса перепрыгивает через ленивую собаку.",
        "Программирование — это искусство решения проблем с помощью логики.",
        "Каждый день — это новая возможность научиться чему-то новому.",
        "Код должен быть понятен человеку, а не только компьютеру.",
        "Хорошая архитектура стоит больше, чем быстрая реализация.",
      ];
      let target = "", start = 0, running = false;
      const tgt = el("div", { class: "output", style: { fontSize: "18px" } });
      const ta = el("textarea", { placeholder: "Начните печатать..." });
      const stat = el("div", { class: "output" });
      const newRound = () => { target = pick(texts); tgt.textContent = target; ta.value = ""; running = false; start = 0; stat.textContent = "—"; };
      ta.addEventListener("input", () => {
        if (!running) { running = true; start = Date.now(); }
        let correct = 0; for (let i = 0; i < ta.value.length; i++) if (ta.value[i] === target[i]) correct++;
        const elapsed = (Date.now() - start) / 1000;
        const words = ta.value.length / 5, wpm = elapsed ? (words / (elapsed / 60)) : 0;
        const acc = ta.value.length ? (correct / ta.value.length * 100) : 100;
        stat.textContent = `Время: ${elapsed.toFixed(1)} с\nWPM: ${wpm.toFixed(1)}\nТочность: ${acc.toFixed(1)}%`;
        if (ta.value === target) { running = false; stat.textContent += "\n✓ Готово!"; }
      });
      newRound();
      root.appendChild(card(h3("Тест скорости печати"), el("button", { class: "btn", onclick: newRound }, "Новый текст"), el("div", { class: "mt-3" }, tgt), el("div", { class: "mt-2" }, ta), el("div", { class: "mt-2" }, stat)));
    },
  });

  /* ========== 27. Simon says ========== */
  reg({
    id: "simon", title: "Саймон", icon: "🔴", group: "Игры", desc: "Повтори последовательность",
    render(root) {
      const colors = ["#ff6b6b", "#4cc9f0", "#f6c23e", "#2ec27e"];
      const pads = colors.map((c, i) => el("div", { style: { width: "100px", height: "100px", background: c, opacity: "0.5", borderRadius: "14px", cursor: "pointer", transition: "opacity .15s" }, onclick: () => userPress(i) }));
      const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 100px)", gap: "10px" } });
      pads.forEach(p => grid.appendChild(p));
      let seq = [], idx = 0, playing = false;
      const score = el("div", { class: "pill" }, "Раунд: 0");
      const flash = (i) => new Promise(res => { pads[i].style.opacity = "1"; setTimeout(() => { pads[i].style.opacity = "0.5"; setTimeout(res, 200); }, 400); });
      const playSeq = async () => { playing = true; for (const i of seq) await flash(i); playing = false; idx = 0; };
      const next = () => { seq.push(rand(0, 3)); score.textContent = "Раунд: " + seq.length; playSeq(); };
      const userPress = async (i) => {
        if (playing || !seq.length) return;
        await flash(i);
        if (seq[idx] !== i) { score.textContent = "Проигрыш! Раундов: " + (seq.length - 1); seq = []; idx = 0; return; }
        idx++;
        if (idx === seq.length) setTimeout(next, 600);
      };
      root.appendChild(card(h3("Саймон"), el("div", { class: "row" }, score, el("button", { class: "btn", onclick: () => { seq = []; next(); } }, "Старт")), el("div", { class: "mt-3 center" }, grid)));
    },
  });

  /* ========== 28. Pong ========== */
  reg({
    id: "pong", title: "Понг", icon: "🏓", group: "Игры", desc: "Ракетка vs AI",
    render(root) {
      const cvs = el("canvas", { width: 600, height: 360, style: { background: "#0b0f20", borderRadius: "10px", maxWidth: "100%" } });
      const ctx = cvs.getContext("2d");
      const state = { ball: { x: 300, y: 180, vx: 4, vy: 3 }, p: 150, ai: 150, pS: 0, aS: 0 };
      const score = el("div", { class: "pill" });
      let raf, lastY = null;
      const draw = () => {
        ctx.fillStyle = "#0b0f20"; ctx.fillRect(0, 0, 600, 360);
        ctx.fillStyle = "#fff";
        ctx.fillRect(10, state.p, 10, 60);
        ctx.fillRect(580, state.ai, 10, 60);
        ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, 6, 0, Math.PI * 2); ctx.fill();
      };
      const step = () => {
        const b = state.ball;
        b.x += b.vx; b.y += b.vy;
        if (b.y < 0 || b.y > 360) b.vy *= -1;
        state.ai += (b.y - state.ai - 30) * 0.06;
        if (b.x < 20 && b.y > state.p && b.y < state.p + 60) { b.vx = Math.abs(b.vx) * 1.03; }
        if (b.x > 580 && b.y > state.ai && b.y < state.ai + 60) { b.vx = -Math.abs(b.vx) * 1.03; }
        if (b.x < 0) { state.aS++; reset(-4); }
        if (b.x > 600) { state.pS++; reset(4); }
        score.textContent = `Ты ${state.pS} : ${state.aS} AI`;
        draw(); raf = requestAnimationFrame(step);
      };
      const reset = (vx) => { state.ball = { x: 300, y: 180, vx, vy: (Math.random() - 0.5) * 6 }; };
      const onMove = (e) => { const rect = cvs.getBoundingClientRect(); const y = (e.clientY - rect.top) * (360 / rect.height); state.p = Math.max(0, Math.min(300, y - 30)); };
      cvs.addEventListener("mousemove", onMove);
      step();
      root._cleanup = () => { cancelAnimationFrame(raf); cvs.removeEventListener("mousemove", onMove); };
      root.appendChild(card(h3("Понг"), score, el("div", { class: "mt-3 center" }, cvs), el("p", { class: "mt-2", style: { color: "var(--muted)", textAlign: "center" } }, "Мышь двигает ракетку")));
    },
  });

  /* ========== 29. Breakout ========== */
  reg({
    id: "breakout", title: "Арканоид", icon: "🧱", group: "Игры", desc: "Ломай кирпичи",
    render(root) {
      const cvs = el("canvas", { width: 600, height: 400, style: { background: "#0b0f20", borderRadius: "10px", maxWidth: "100%" } });
      const ctx = cvs.getContext("2d");
      const ROWS = 5, COLS = 10; let bricks, paddle, ball, raf, score, lives, over;
      const colors = ["#ff6b6b", "#f6c23e", "#2ec27e", "#4cc9f0", "#c77dff"];
      const info = el("div", { class: "pill" });
      const reset = () => {
        bricks = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) bricks.push({ r, c, alive: true });
        paddle = { x: 250, w: 100 };
        ball = { x: 300, y: 300, vx: 3, vy: -3, r: 6 };
        score = 0; lives = 3; over = false;
      };
      const draw = () => {
        ctx.fillStyle = "#0b0f20"; ctx.fillRect(0, 0, 600, 400);
        for (const b of bricks) if (b.alive) { ctx.fillStyle = colors[b.r]; ctx.fillRect(b.c * 60 + 2, b.r * 25 + 10, 56, 22); }
        ctx.fillStyle = "#fff"; ctx.fillRect(paddle.x, 380, paddle.w, 10);
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
        ctx.font = "14px sans-serif"; ctx.fillText("♥ " + lives, 540, 20);
      };
      const step = () => {
        if (over) return;
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 6 || ball.x > 594) ball.vx *= -1;
        if (ball.y < 6) ball.vy *= -1;
        if (ball.y > 380 && ball.y < 386 && ball.x > paddle.x && ball.x < paddle.x + paddle.w) { ball.vy = -Math.abs(ball.vy); ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 0.05; }
        if (ball.y > 400) { lives--; if (lives <= 0) { over = true; info.textContent = "Конец! Очки: " + score; return; } ball = { x: 300, y: 300, vx: 3, vy: -3, r: 6 }; }
        for (const b of bricks) if (b.alive) {
          const bx = b.c * 60 + 2, by = b.r * 25 + 10;
          if (ball.x > bx && ball.x < bx + 56 && ball.y > by && ball.y < by + 22) { b.alive = false; ball.vy *= -1; score += 10; info.textContent = "Очки: " + score; }
        }
        if (bricks.every(b => !b.alive)) { over = true; info.textContent = "Победа! " + score; return; }
        draw(); raf = requestAnimationFrame(step);
      };
      const onMove = (e) => { const rect = cvs.getBoundingClientRect(); paddle.x = Math.max(0, Math.min(500, (e.clientX - rect.left) * (600 / rect.width) - 50)); };
      cvs.addEventListener("mousemove", onMove);
      reset(); info.textContent = "Очки: 0"; step();
      root._cleanup = () => { cancelAnimationFrame(raf); cvs.removeEventListener("mousemove", onMove); over = true; };
      root.appendChild(card(h3("Арканоид"), el("div", { class: "row" }, info, el("button", { class: "btn", onclick: () => { cancelAnimationFrame(raf); reset(); info.textContent = "Очки: 0"; step(); } }, "Заново")), el("div", { class: "mt-3 center" }, cvs)));
    },
  });

  /* ========== 30. Flappy ========== */
  reg({
    id: "flappy", title: "Flappy", icon: "🐦", group: "Игры", desc: "Пробел — взмах",
    render(root) {
      const cvs = el("canvas", { width: 400, height: 500, style: { background: "#4cc9f0", borderRadius: "10px", maxWidth: "100%" } });
      const ctx = cvs.getContext("2d");
      let bird, pipes, score, raf, over;
      const info = el("div", { class: "pill" });
      const reset = () => { bird = { y: 200, vy: 0 }; pipes = []; score = 0; over = false; info.textContent = "Счёт: 0"; };
      const spawn = () => { const gap = 130, top = rand(40, 300); pipes.push({ x: 400, top, bottom: top + gap }); };
      const draw = () => {
        ctx.fillStyle = "#4cc9f0"; ctx.fillRect(0, 0, 400, 500);
        ctx.fillStyle = "#2a9d8f"; for (const p of pipes) { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, p.bottom, 50, 500 - p.bottom); }
        ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(100, bird.y, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000"; ctx.font = "bold 28px sans-serif"; ctx.fillText(score, 180, 40);
      };
      let frame = 0;
      const step = () => {
        if (over) return;
        frame++;
        bird.vy += 0.5; bird.y += bird.vy;
        if (bird.y > 485 || bird.y < 15) { over = true; info.textContent = "Конец! " + score; return; }
        if (frame % 80 === 0) spawn();
        for (const p of pipes) p.x -= 3;
        pipes = pipes.filter(p => p.x > -50);
        for (const p of pipes) {
          if (!p.passed && p.x + 50 < 100) { p.passed = true; score++; info.textContent = "Счёт: " + score; }
          if (100 > p.x && 100 < p.x + 50 && (bird.y < p.top || bird.y > p.bottom)) { over = true; info.textContent = "Конец! " + score; return; }
        }
        draw(); raf = requestAnimationFrame(step);
      };
      const jump = () => { if (over) return; bird.vy = -8; };
      const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); jump(); } };
      cvs.addEventListener("click", jump);
      document.addEventListener("keydown", onKey);
      reset(); step();
      root._cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); cvs.removeEventListener("click", jump); over = true; };
      root.appendChild(card(h3("Flappy"), el("div", { class: "row" }, info, el("button", { class: "btn", onclick: () => { cancelAnimationFrame(raf); reset(); step(); } }, "Заново")), el("div", { class: "mt-3 center" }, cvs), el("p", { class: "mt-2", style: { color: "var(--muted)", textAlign: "center" } }, "Пробел или клик")));
    },
  });

  /* ========== 31. Hangman ========== */
  reg({
    id: "hangman", title: "Виселица", icon: "🪢", group: "Игры", desc: "Угадай слово",
    render(root) {
      const words = ["программирование", "клавиатура", "холодильник", "библиотека", "велосипед", "самолёт", "океан", "компьютер", "музыка", "галактика", "телефон", "шоколад", "картофель", "путешествие", "фестиваль"];
      let word, guessed, wrongs, over;
      const display = el("div", { class: "output center", style: { fontSize: "24px", letterSpacing: "4px" } });
      const status = el("div", { class: "pill" });
      const keys = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: "4px", maxWidth: "500px" } });
      const reset = () => {
        word = pick(words); guessed = new Set(); wrongs = 0; over = false;
        keys.innerHTML = "";
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюя".split("").forEach(l => {
          const btn = el("button", { class: "btn ghost", style: { padding: "4px 0" }, onclick: () => guess(l, btn) }, l);
          keys.appendChild(btn);
        });
        render();
      };
      const render = () => {
        display.textContent = word.split("").map(l => guessed.has(l) ? l : "_").join(" ");
        status.textContent = "Ошибок: " + wrongs + " / 7";
        if (wrongs >= 7) { display.textContent = "💀 " + word; status.textContent = "Проигрыш"; over = true; }
        else if (word.split("").every(l => guessed.has(l))) { status.textContent = "🎉 Победа!"; over = true; }
      };
      const guess = (l, btn) => { if (over || guessed.has(l)) return; guessed.add(l); btn.disabled = true; if (!word.includes(l)) wrongs++; render(); };
      reset();
      root.appendChild(card(h3("Виселица"), el("div", { class: "row" }, status, el("button", { class: "btn", onclick: reset }, "Новая игра")), el("div", { class: "mt-3" }, display), el("div", { class: "mt-3 center" }, keys)));
    },
  });

  /* ========== 32. Wordle-like ========== */
  reg({
    id: "wordle", title: "Wordle", icon: "🟩", group: "Игры", desc: "Угадай слово из 5 букв",
    render(root, { toast }) {
      const WORDS = ["мечта", "книга", "песня", "ветер", "пламя", "школа", "танец", "птица", "слово", "лифта", "домик", "кошка", "мышка", "рукав", "волна", "лужок", "поезд", "хлеба", "звезд", "кремл", "мосты", "парта", "лампа", "молот", "скала", "горка", "ветка", "поход"].filter(w => [...w].length === 5);
      let target = pick(WORDS), tries = [], current = "", over = false;
      const board = el("div", { style: { display: "grid", gridTemplateRows: "repeat(6, 40px)", gap: "4px", width: "240px" } });
      const status = el("div", { class: "pill" });
      const draw = () => {
        board.innerHTML = "";
        for (let r = 0; r < 6; r++) {
          const row = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 40px)", gap: "4px" } });
          const guess = tries[r] || (r === tries.length ? current : "");
          for (let c = 0; c < 5; c++) {
            const letter = guess[c] || "";
            let bg = "var(--panel-2)";
            if (tries[r]) {
              if (target[c] === letter) bg = "#2ec27e";
              else if (target.includes(letter)) bg = "#f6c23e";
              else bg = "#555";
            }
            row.appendChild(el("div", { style: { background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "20px", borderRadius: "6px", textTransform: "uppercase" } }, letter));
          }
          board.appendChild(row);
        }
      };
      const onKey = (e) => {
        if (over) return;
        const k = e.key.toLowerCase();
        if (k === "enter") {
          if (current.length !== 5) { toast("5 букв"); return; }
          tries.push(current);
          if (current === target) { over = true; status.textContent = "🎉 Победа!"; }
          else if (tries.length >= 6) { over = true; status.textContent = "Слово было: " + target; }
          current = ""; draw();
        } else if (k === "backspace") { current = current.slice(0, -1); draw(); }
        else if (/^[а-яё]$/.test(k) && current.length < 5) { current += k; draw(); }
      };
      document.addEventListener("keydown", onKey);
      root._cleanup = () => document.removeEventListener("keydown", onKey);
      status.textContent = `${WORDS.length} слов`;
      const reset = () => { target = pick(WORDS); tries = []; current = ""; over = false; draw(); status.textContent = "Попыток: 6"; window.__wordleTarget = target; };
      reset();
      root.appendChild(card(h3("Wordle (5 букв)"), el("div", { class: "row" }, status, el("button", { class: "btn", onclick: reset }, "Новое")), el("div", { class: "mt-3 center" }, board), el("p", { class: "mt-2", style: { color: "var(--muted)", textAlign: "center" } }, "Печатайте на клавиатуре, Enter — ввод")));
    },
  });

  /* ========== 33. Reaction test ========== */
  reg({
    id: "reaction", title: "Тест реакции", icon: "⚡", group: "Игры", desc: "Ms",
    render(root) {
      const area = el("div", { style: { height: "220px", background: "#ff6b6b", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "22px", cursor: "pointer", userSelect: "none" } }, "Нажмите, чтобы начать");
      let state = "idle", start = 0, timer;
      const info = el("div", { class: "pill" }, "Рекорд: " + (localStorage.getItem("reaction-best") || "—"));
      area.onclick = () => {
        if (state === "idle") {
          state = "waiting"; area.style.background = "#f6c23e"; area.textContent = "Ждите зелёного...";
          timer = setTimeout(() => { state = "go"; area.style.background = "#2ec27e"; area.textContent = "КЛИК!"; start = Date.now(); }, rand(1500, 4000));
        } else if (state === "waiting") {
          clearTimeout(timer); state = "idle"; area.style.background = "#ff6b6b"; area.textContent = "Слишком рано! Ещё раз";
        } else if (state === "go") {
          const t = Date.now() - start;
          state = "idle"; area.style.background = "var(--accent)"; area.textContent = `${t} мс — клик для повтора`;
          const best = +(localStorage.getItem("reaction-best") || 99999);
          if (t < best) { localStorage.setItem("reaction-best", t); info.textContent = "Рекорд: " + t; }
        }
      };
      root._cleanup = () => clearTimeout(timer);
      root.appendChild(card(h3("Тест реакции"), info, el("div", { class: "mt-3" }, area)));
    },
  });

  /* ========== 34. Connect Four ========== */
  reg({
    id: "connect4", title: "Четыре в ряд", icon: "🔴", group: "Игры", desc: "Против бота",
    render(root) {
      const COLS = 7, ROWS = 6; let grid, turn, over;
      const board = el("div", { style: { display: "grid", gridTemplateColumns: `repeat(${COLS}, 50px)`, gap: "4px", background: "#1e3a8a", padding: "8px", borderRadius: "10px" } });
      const status = el("div", { class: "pill" });
      const reset = () => { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); turn = 1; over = false; render(); status.textContent = "Ход: красный"; };
      const drop = (c, player) => {
        for (let r = ROWS - 1; r >= 0; r--) if (!grid[r][c]) { grid[r][c] = player; return r; }
        return -1;
      };
      const check = (player) => {
        const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          for (const [dr, dc] of dirs) {
            let k = 0; for (let i = 0; i < 4; i++) { const nr = r + dr * i, nc = c + dc * i; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === player) k++; else break; }
            if (k === 4) return true;
          }
        }
        return false;
      };
      const render = () => {
        board.innerHTML = "";
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const v = grid[r][c];
          board.appendChild(el("div", { style: { width: "50px", height: "50px", borderRadius: "50%", background: v === 1 ? "#ef4444" : v === 2 ? "#fde047" : "#0f1221", cursor: over || turn !== 1 ? "default" : "pointer" }, onclick: () => userMove(c) }));
        }
      };
      const userMove = (c) => {
        if (over || turn !== 1) return;
        if (drop(c, 1) < 0) return;
        if (check(1)) { over = true; status.textContent = "Красный (вы) победили!"; render(); return; }
        turn = 2; render(); status.textContent = "Ход: жёлтый (бот)";
        setTimeout(botMove, 400);
      };
      const botMove = () => {
        if (over) return;
        // Try winning move, then blocking move, else random
        for (const p of [2, 1]) for (let c = 0; c < COLS; c++) {
          const r = drop(c, p); if (r < 0) continue;
          if (check(p)) { grid[r][c] = 2; if (check(2)) { over = true; status.textContent = "Бот победил"; render(); return; } turn = 1; render(); status.textContent = "Ход: красный"; return; }
          grid[r][c] = 0;
        }
        const valid = []; for (let c = 0; c < COLS; c++) if (!grid[0][c]) valid.push(c);
        const c = pick(valid); drop(c, 2);
        if (check(2)) { over = true; status.textContent = "Бот победил"; }
        else if (grid[0].every(x => x)) { over = true; status.textContent = "Ничья"; }
        turn = 1; render(); if (!over) status.textContent = "Ход: красный";
      };
      reset();
      root.appendChild(card(h3("Четыре в ряд"), el("div", { class: "row" }, status, el("button", { class: "btn", onclick: reset }, "Заново")), el("div", { class: "mt-3 center" }, board)));
    },
  });

  /* ========== 35. Lights Out ========== */
  reg({
    id: "lights-out", title: "Lights Out", icon: "💡", group: "Игры", desc: "Погаси все",
    render(root) {
      const N = 5; let grid;
      const board = el("div", { style: { display: "grid", gridTemplateColumns: `repeat(${N}, 50px)`, gap: "4px" } });
      const status = el("div", { class: "pill" });
      const reset = () => {
        grid = Array.from({ length: N }, () => Array.from({ length: N }, () => Math.random() < 0.5));
        render(); status.textContent = "Погасите все";
      };
      const toggle = (i, j) => {
        if (i < 0 || i >= N || j < 0 || j >= N) return;
        grid[i][j] = !grid[i][j];
      };
      const click = (i, j) => {
        toggle(i, j); toggle(i - 1, j); toggle(i + 1, j); toggle(i, j - 1); toggle(i, j + 1);
        render();
        if (grid.every(r => r.every(v => !v))) status.textContent = "🎉 Победа!";
      };
      const render = () => {
        board.innerHTML = "";
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          board.appendChild(el("div", { style: { width: "50px", height: "50px", background: grid[i][j] ? "#f6c23e" : "var(--panel-2)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer" }, onclick: () => click(i, j) }));
        }
      };
      reset();
      root.appendChild(card(h3("Lights Out"), el("div", { class: "row" }, status, el("button", { class: "btn", onclick: reset }, "Новая")), el("div", { class: "mt-3 center" }, board)));
    },
  });

  /* ========== 36. 15-puzzle ========== */
  reg({
    id: "puzzle15", title: "Пятнашки", icon: "🧩", group: "Игры", desc: "Собери 1-15",
    render(root) {
      const N = 4; let grid;
      const board = el("div", { style: { display: "grid", gridTemplateColumns: `repeat(${N}, 60px)`, gap: "4px", background: "var(--panel-2)", padding: "6px", borderRadius: "10px" } });
      const status = el("div", { class: "pill" });
      const shuffleGrid = () => {
        const arr = Array.from({ length: 15 }, (_, i) => i + 1).concat(0);
        for (let k = 0; k < 500; k++) {
          const zi = arr.indexOf(0), r = Math.floor(zi / N), c = zi % N;
          const moves = []; if (r > 0) moves.push(zi - N); if (r < N - 1) moves.push(zi + N); if (c > 0) moves.push(zi - 1); if (c < N - 1) moves.push(zi + 1);
          const m = pick(moves); [arr[zi], arr[m]] = [arr[m], arr[zi]];
        }
        grid = arr;
      };
      const render = () => {
        board.innerHTML = "";
        grid.forEach((v, idx) => {
          board.appendChild(el("div", { style: { width: "60px", height: "60px", background: v ? "var(--accent)" : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700", borderRadius: "6px", cursor: v ? "pointer" : "default" }, onclick: () => click(idx) }, v || ""));
        });
        if (grid.slice(0, 15).every((v, i) => v === i + 1)) status.textContent = "🎉 Победа!";
      };
      const click = (idx) => {
        const zi = grid.indexOf(0);
        const zr = Math.floor(zi / N), zc = zi % N, r = Math.floor(idx / N), c = idx % N;
        if ((zr === r && Math.abs(zc - c) === 1) || (zc === c && Math.abs(zr - r) === 1)) {
          [grid[zi], grid[idx]] = [grid[idx], grid[zi]]; render();
        }
      };
      const reset = () => { shuffleGrid(); render(); status.textContent = "Двигайте плитки"; };
      reset();
      root.appendChild(card(h3("Пятнашки"), el("div", { class: "row" }, status, el("button", { class: "btn", onclick: reset }, "Новая")), el("div", { class: "mt-3 center" }, board)));
    },
  });

  /* ========== 37. Math quiz ========== */
  reg({
    id: "math-quiz", title: "Матем. квиз", icon: "➗", group: "Игры", desc: "Считай быстро",
    render(root) {
      let score = 0, streak = 0, a, b, op, answer;
      const q = el("div", { class: "output center", style: { fontSize: "28px" } });
      const inp = el("input", { type: "number", autofocus: true });
      const status = el("div", { class: "pill" });
      const next = () => {
        op = pick(["+", "−", "×"]);
        if (op === "×") { a = rand(2, 12); b = rand(2, 12); answer = a * b; }
        else if (op === "−") { a = rand(10, 99); b = rand(1, a); answer = a - b; }
        else { a = rand(1, 99); b = rand(1, 99); answer = a + b; }
        q.textContent = `${a} ${op} ${b} = ?`; inp.value = ""; inp.focus();
        status.textContent = `Очки: ${score} | Серия: ${streak}`;
      };
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { const v = parseInt(inp.value, 10); if (v === answer) { score++; streak++; } else { streak = 0; } next(); }
      });
      next();
      root.appendChild(card(h3("Математическая викторина"), status, el("div", { class: "mt-3" }, q), el("div", { class: "mt-3 row" }, el("label", {}, "Ответ"), inp), el("p", { class: "mt-2", style: { color: "var(--muted)" } }, "Enter — ответить")));
    },
  });

  /* ========== 38. Matrix rain ========== */
  reg({
    id: "matrix", title: "Матрица", icon: "🌧️", group: "Развлечения", desc: "Падающий код",
    render(root) {
      const cvs = el("canvas", { width: 600, height: 400, style: { background: "#000", borderRadius: "10px", maxWidth: "100%" } });
      const ctx = cvs.getContext("2d");
      const chars = "アィウエオカキクケコｱｲｳｴｵABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const fontSize = 14, columns = Math.floor(600 / fontSize);
      const drops = Array.from({ length: columns }, () => rand(-50, 0));
      let raf;
      const step = () => {
        ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = "#2ec27e"; ctx.font = fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
          ctx.fillText(chars[rand(0, chars.length - 1)], i * fontSize, drops[i] * fontSize);
          drops[i]++;
          if (drops[i] * fontSize > 400 && Math.random() > 0.975) drops[i] = 0;
        }
        raf = requestAnimationFrame(step);
      };
      step();
      root._cleanup = () => cancelAnimationFrame(raf);
      root.appendChild(card(h3("Matrix rain"), el("div", { class: "center mt-2" }, cvs)));
    },
  });

  /* ========== 39. Confetti ========== */
  reg({
    id: "confetti", title: "Конфетти", icon: "🎊", group: "Развлечения", desc: "Частицы",
    render(root) {
      const cvs = el("canvas", { width: 600, height: 400, style: { background: "#0b0f20", borderRadius: "10px", maxWidth: "100%", cursor: "crosshair" } });
      const ctx = cvs.getContext("2d");
      const parts = [];
      const burst = (x, y) => {
        for (let i = 0; i < 80; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 8, life: 80, color: `hsl(${rand(0, 360)} 80% 60%)` });
      };
      let raf;
      const step = () => {
        ctx.fillStyle = "rgba(11,15,32,.2)"; ctx.fillRect(0, 0, 600, 400);
        for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 6); }
        for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
        raf = requestAnimationFrame(step);
      };
      step();
      cvs.addEventListener("click", (e) => { const r = cvs.getBoundingClientRect(); burst((e.clientX - r.left) * (600 / r.width), (e.clientY - r.top) * (400 / r.height)); });
      const auto = setInterval(() => burst(rand(100, 500), rand(100, 300)), 1500);
      root._cleanup = () => { cancelAnimationFrame(raf); clearInterval(auto); };
      root.appendChild(card(h3("Конфетти"), el("p", { style: { color: "var(--muted)" } }, "Кликай — больше взрывов"), el("div", { class: "center mt-2" }, cvs)));
    },
  });

  /* ========== 40. Kaleidoscope ========== */
  reg({
    id: "kaleidoscope", title: "Калейдоскоп", icon: "🔮", group: "Развлечения", desc: "Двигай мышь",
    render(root) {
      const cvs = el("canvas", { width: 500, height: 500, style: { background: "#000", borderRadius: "50%", maxWidth: "100%", cursor: "crosshair" } });
      const ctx = cvs.getContext("2d");
      const SEGMENTS = 10; let hue = 0, lastX = 250, lastY = 250;
      const onMove = (e) => {
        const r = cvs.getBoundingClientRect();
        const x = (e.clientX - r.left) * (500 / r.width), y = (e.clientY - r.top) * (500 / r.height);
        hue = (hue + 2) % 360;
        ctx.save(); ctx.translate(250, 250);
        for (let i = 0; i < SEGMENTS; i++) {
          ctx.rotate((Math.PI * 2) / SEGMENTS);
          ctx.strokeStyle = `hsl(${hue} 70% 60%)`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(lastX - 250, lastY - 250); ctx.lineTo(x - 250, y - 250); ctx.stroke();
          ctx.save(); ctx.scale(1, -1); ctx.beginPath(); ctx.moveTo(lastX - 250, lastY - 250); ctx.lineTo(x - 250, y - 250); ctx.stroke(); ctx.restore();
        }
        ctx.restore();
        lastX = x; lastY = y;
      };
      cvs.addEventListener("mousemove", onMove);
      const clear = () => { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 500, 500); };
      clear();
      root._cleanup = () => cvs.removeEventListener("mousemove", onMove);
      root.appendChild(card(h3("Калейдоскоп"), el("button", { class: "btn", onclick: clear }, "Очистить"), el("div", { class: "center mt-2" }, cvs)));
    },
  });

  /* ========== 41. ASCII art ========== */
  reg({
    id: "ascii-art", title: "ASCII арт", icon: "▢", group: "Развлечения", desc: "Текст крупно",
    render(root) {
      const font = {
        A: [" ██ ", "█  █", "████", "█  █", "█  █"],
        B: ["███ ", "█  █", "███ ", "█  █", "███ "],
        C: [" ███", "█   ", "█   ", "█   ", " ███"],
        D: ["██  ", "█ █ ", "█  █", "█ █ ", "██  "],
        E: ["████", "█   ", "███ ", "█   ", "████"],
        F: ["████", "█   ", "███ ", "█   ", "█   "],
        G: [" ███", "█   ", "█ ██", "█  █", " ███"],
        H: ["█  █", "█  █", "████", "█  █", "█  █"],
        I: ["███", " █ ", " █ ", " █ ", "███"],
        J: ["  ██", "   █", "   █", "█  █", " ██ "],
        K: ["█  █", "█ █ ", "██  ", "█ █ ", "█  █"],
        L: ["█   ", "█   ", "█   ", "█   ", "████"],
        M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
        N: ["█  █", "██ █", "█ ██", "█  █", "█  █"],
        O: [" ██ ", "█  █", "█  █", "█  █", " ██ "],
        P: ["███ ", "█  █", "███ ", "█   ", "█   "],
        Q: [" ██ ", "█  █", "█  █", "█ ██", " ███"],
        R: ["███ ", "█  █", "███ ", "█ █ ", "█  █"],
        S: [" ███", "█   ", " ██ ", "   █", "███ "],
        T: ["████", " █  ", " █  ", " █  ", " █  "],
        U: ["█  █", "█  █", "█  █", "█  █", " ██ "],
        V: ["█  █", "█  █", "█  █", " ██ ", "  █ "],
        W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
        X: ["█  █", " ██ ", " ██ ", " ██ ", "█  █"],
        Y: ["█ █", " █ ", " █ ", " █ ", " █ "],
        Z: ["████", "   █", "  █ ", " █  ", "████"],
        " ": ["  ", "  ", "  ", "  ", "  "],
      };
      const inp = el("input", { value: "HELLO", maxlength: 20 });
      const out = el("pre", { class: "output", style: { fontFamily: "monospace", fontSize: "14px" } });
      const upd = () => {
        const text = (inp.value || "").toUpperCase();
        const lines = Array(5).fill("");
        for (const c of text) { const g = font[c] || font[" "]; for (let i = 0; i < 5; i++) lines[i] += g[i] + "  "; }
        out.textContent = lines.join("\n");
      };
      inp.addEventListener("input", upd); upd();
      root.appendChild(card(h3("ASCII арт"), el("div", { class: "row" }, el("label", {}, "Текст"), inp), el("div", { class: "mt-3" }, out)));
    },
  });

  /* ========== 42. Mood tracker ========== */
  reg({
    id: "mood", title: "Настроение", icon: "🙂", group: "Развлечения", desc: "Трекер дня",
    render(root) {
      const KEY = "mood-entries";
      const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
      const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
      const emojis = ["😭", "😞", "😐", "🙂", "😄"];
      const list = el("div", { class: "output" });
      const render = () => {
        const d = load();
        list.innerHTML = "";
        if (!d.length) { list.textContent = "Пока пусто"; return; }
        d.slice(-14).forEach(e => { list.appendChild(el("div", {}, `${new Date(e.t).toLocaleString()}: ${emojis[e.m]} ${e.note || ""}`)); });
      };
      const noteInp = el("input", { placeholder: "Заметка (необязательно)" });
      const buttons = el("div", { style: { display: "flex", gap: "8px", fontSize: "32px" } });
      emojis.forEach((em, i) => buttons.appendChild(el("button", { class: "btn ghost", style: { fontSize: "32px", padding: "4px 10px" }, onclick: () => { const d = load(); d.push({ t: Date.now(), m: i, note: noteInp.value }); save(d); noteInp.value = ""; render(); } }, em)));
      render();
      root.appendChild(card(h3("Трекер настроения"), el("div", { class: "row" }, noteInp), el("div", { class: "mt-3 center" }, buttons), el("div", { class: "mt-3" }, list), el("button", { class: "btn ghost mt-2", onclick: () => { localStorage.removeItem(KEY); render(); } }, "Очистить")));
    },
  });

  /* ========== 43. Tone generator ========== */
  reg({
    id: "tone-gen", title: "Генератор тона", icon: "🎚️", group: "Звук", desc: "Выбор Hz",
    render(root) {
      let ctx, osc, gain;
      const freq = el("input", { type: "range", min: "20", max: "2000", value: "440" });
      const type = el("select");
      ["sine", "square", "sawtooth", "triangle"].forEach(t => type.appendChild(el("option", { value: t }, t)));
      const freqLabel = el("div", { class: "pill" });
      const update = () => { freqLabel.textContent = freq.value + " Hz " + type.value; if (osc) { osc.frequency.value = +freq.value; osc.type = type.value; } };
      const toggle = el("button", { class: "btn" }, "▶️ Играть");
      toggle.onclick = () => {
        if (!osc) { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); osc = ctx.createOscillator(); gain = ctx.createGain(); gain.gain.value = 0.2; osc.connect(gain); gain.connect(ctx.destination); osc.type = type.value; osc.frequency.value = +freq.value; osc.start(); toggle.textContent = "⏹ Стоп"; }
        else { osc.stop(); osc.disconnect(); osc = null; toggle.textContent = "▶️ Играть"; }
      };
      freq.addEventListener("input", update); type.addEventListener("change", update); update();
      root._cleanup = () => { if (osc) { try { osc.stop(); osc.disconnect(); } catch (e) { } osc = null; } if (ctx) { try { ctx.close(); } catch (e) { } ctx = null; } };
      root.appendChild(card(h3("Генератор тона"), el("div", { class: "row" }, freqLabel, type, toggle), el("div", { class: "mt-2" }, freq)));
    },
  });

  /* ========== 44. Drum pad ========== */
  reg({
    id: "drums", title: "Драм-пад", icon: "🥁", group: "Звук", desc: "Клик = удар",
    render(root) {
      let ctx;
      const play = (freq, dur, type = "triangle", gainV = 0.3) => {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.value = gainV; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + dur);
      };
      const noise = (dur = 0.1, gainV = 0.2) => {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g = ctx.createGain(); g.gain.value = gainV; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        src.connect(g); g.connect(ctx.destination); src.start();
      };
      const pads = [
        { label: "Kick", color: "#ef4444", k: "q", act: () => play(80, 0.3, "sine", 0.5) },
        { label: "Snare", color: "#f6c23e", k: "w", act: () => { play(180, 0.15, "triangle", 0.2); noise(0.15); } },
        { label: "Hi-Hat", color: "#4cc9f0", k: "e", act: () => noise(0.05) },
        { label: "Clap", color: "#2ec27e", k: "r", act: () => { noise(0.08); setTimeout(() => noise(0.08), 30); } },
        { label: "Tom", color: "#c77dff", k: "a", act: () => play(160, 0.2, "sine", 0.3) },
        { label: "Cow", color: "#ff6b6b", k: "s", act: () => play(560, 0.1, "square", 0.1) },
        { label: "Beep", color: "#7c5cff", k: "d", act: () => play(880, 0.1, "sine", 0.2) },
        { label: "Low", color: "#6b7280", k: "f", act: () => play(50, 0.4, "sine", 0.4) },
      ];
      const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 90px)", gap: "10px" } });
      const buttons = pads.map(p => { const b = el("div", { style: { width: "90px", height: "90px", background: p.color, borderRadius: "12px", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "700", userSelect: "none" }, onclick: p.act }, p.label, el("div", { style: { fontSize: "12px", opacity: ".8" } }, p.k.toUpperCase())); return b; });
      buttons.forEach(b => grid.appendChild(b));
      const onKey = (e) => { const i = pads.findIndex(p => p.k === e.key); if (i >= 0) { pads[i].act(); buttons[i].style.transform = "scale(0.92)"; setTimeout(() => { buttons[i].style.transform = ""; }, 80); } };
      document.addEventListener("keydown", onKey);
      root._cleanup = () => { document.removeEventListener("keydown", onKey); if (ctx) { try { ctx.close(); } catch (e) { } } };
      root.appendChild(card(h3("Драм-пад"), el("div", { class: "mt-2 center" }, grid), el("p", { class: "mt-2", style: { color: "var(--muted)", textAlign: "center" } }, "Клавиши Q W E R A S D F")));
    },
  });

  /* ========== 45. Synth ========== */
  reg({
    id: "synth", title: "Синтезатор", icon: "🎛️", group: "Звук", desc: "Монотембр",
    render(root) {
      let ctx;
      const type = el("select"); ["sine", "square", "sawtooth", "triangle"].forEach(t => type.appendChild(el("option", { value: t }, t)));
      const att = el("input", { type: "range", min: "0", max: "1", step: "0.01", value: "0.05" });
      const rel = el("input", { type: "range", min: "0", max: "2", step: "0.01", value: "0.3" });
      const keys = ["z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", ","];
      const notes = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88, 523.25];
      const active = new Map();
      const press = (i) => {
        if (active.has(i)) return;
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type.value; o.frequency.value = notes[i];
        g.gain.value = 0; g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + (+att.value || 0.01));
        o.connect(g); g.connect(ctx.destination); o.start();
        active.set(i, { o, g });
      };
      const release = (i) => {
        const a = active.get(i); if (!a) return; active.delete(i);
        a.g.gain.cancelScheduledValues(ctx.currentTime); a.g.gain.setValueAtTime(a.g.gain.value, ctx.currentTime);
        a.g.gain.linearRampToValueAtTime(0, ctx.currentTime + (+rel.value || 0.1));
        a.o.stop(ctx.currentTime + (+rel.value || 0.1) + 0.05);
      };
      const onDown = (e) => { const i = keys.indexOf(e.key.toLowerCase()); if (i >= 0) press(i); };
      const onUp = (e) => { const i = keys.indexOf(e.key.toLowerCase()); if (i >= 0) release(i); };
      document.addEventListener("keydown", onDown); document.addEventListener("keyup", onUp);
      root._cleanup = () => { document.removeEventListener("keydown", onDown); document.removeEventListener("keyup", onUp); active.forEach((_, i) => release(i)); if (ctx) { try { ctx.close(); } catch (e) { } } };
      root.appendChild(card(h3("Синтезатор"),
        el("div", { class: "row" }, el("label", {}, "Wave"), type, el("label", {}, "Att"), att, el("label", {}, "Rel"), rel),
        el("p", { class: "mt-2", style: { color: "var(--muted)" } }, "Клавиши Z-M (+ S,D,G,H,J для диезов) — октава")
      ));
    },
  });

  /* ========== 46. Noise ========== */
  reg({
    id: "noise", title: "Белый шум", icon: "〰️", group: "Звук", desc: "Для концентрации",
    render(root) {
      let ctx, src, gain;
      const vol = el("input", { type: "range", min: "0", max: "1", step: "0.01", value: "0.3" });
      const toggle = el("button", { class: "btn" }, "▶️ Играть");
      toggle.onclick = () => {
        if (!src) {
          ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
          const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
          const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
          gain = ctx.createGain(); gain.gain.value = +vol.value;
          src.connect(gain); gain.connect(ctx.destination); src.start();
          toggle.textContent = "⏹ Стоп";
        } else { src.stop(); src.disconnect(); src = null; toggle.textContent = "▶️ Играть"; }
      };
      vol.addEventListener("input", () => { if (gain) gain.gain.value = +vol.value; });
      root._cleanup = () => { if (src) { try { src.stop(); src.disconnect(); } catch (e) { } src = null; } if (ctx) { try { ctx.close(); } catch (e) { } } };
      root.appendChild(card(h3("Белый шум"), el("div", { class: "row" }, toggle, el("label", {}, "Громкость"), vol)));
    },
  });

  /* ========== 47. Binary clock ========== */
  reg({
    id: "binary-clock", title: "Бинарные часы", icon: "🕓", group: "Инфо", desc: "Время в битах",
    render(root) {
      const wrap = el("div", { style: { display: "flex", gap: "12px", justifyContent: "center" } });
      const columns = [];
      for (let i = 0; i < 6; i++) {
        const col = el("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } });
        const dots = []; for (let j = 0; j < 4; j++) { const d = el("div", { style: { width: "28px", height: "28px", borderRadius: "50%", background: "var(--panel-2)", border: "1px solid var(--border)" } }); dots.push(d); col.appendChild(d); }
        columns.push(dots); wrap.appendChild(col);
      }
      const time = el("div", { class: "pill mt-3", style: { display: "block", textAlign: "center" } });
      const tick = () => {
        const now = new Date();
        const digits = [
          Math.floor(now.getHours() / 10), now.getHours() % 10,
          Math.floor(now.getMinutes() / 10), now.getMinutes() % 10,
          Math.floor(now.getSeconds() / 10), now.getSeconds() % 10,
        ];
        for (let c = 0; c < 6; c++) {
          for (let b = 0; b < 4; b++) {
            const on = (digits[c] >> (3 - b)) & 1;
            columns[c][b].style.background = on ? "var(--accent)" : "var(--panel-2)";
          }
        }
        time.textContent = now.toLocaleTimeString();
      };
      tick();
      const iv = setInterval(tick, 1000);
      root._cleanup = () => clearInterval(iv);
      root.appendChild(card(h3("Бинарные часы"), wrap, time));
    },
  });

  /* ========== 48. Countdown NY ========== */
  reg({
    id: "countdown-ny", title: "До Нового года", icon: "🎄", group: "Инфо", desc: "Обратный отсчёт",
    render(root) {
      const out = el("div", { class: "output center", style: { fontSize: "32px" } });
      const tick = () => {
        const now = new Date();
        const ny = new Date(now.getFullYear() + 1, 0, 1);
        const ms = ny - now;
        const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
        out.textContent = `${d} дн. ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      };
      tick();
      const iv = setInterval(tick, 1000);
      root._cleanup = () => clearInterval(iv);
      root.appendChild(card(h3("До Нового года"), out));
    },
  });

  /* ========== 49. World time ========== */
  reg({
    id: "world-time", title: "Мировое время", icon: "🌍", group: "Инфо", desc: "Часовые пояса",
    render(root) {
      const zones = [
        { name: "Москва", tz: "Europe/Moscow" },
        { name: "Лондон", tz: "Europe/London" },
        { name: "Нью-Йорк", tz: "America/New_York" },
        { name: "Лос-Анджелес", tz: "America/Los_Angeles" },
        { name: "Токио", tz: "Asia/Tokyo" },
        { name: "Сидней", tz: "Australia/Sydney" },
        { name: "Дубай", tz: "Asia/Dubai" },
        { name: "Сан-Паулу", tz: "America/Sao_Paulo" },
      ];
      const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" } });
      const cells = zones.map(z => {
        const c = el("div", { style: { background: "var(--panel-2)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" } });
        c.appendChild(el("div", { class: "pill" }, z.name));
        const t = el("div", { style: { fontSize: "22px", marginTop: "8px", fontFamily: "monospace" } });
        c.appendChild(t);
        grid.appendChild(c); return { t, tz: z.tz };
      });
      const tick = () => {
        const now = new Date();
        cells.forEach(({ t, tz }) => { t.textContent = now.toLocaleTimeString("ru-RU", { timeZone: tz }); });
      };
      tick();
      const iv = setInterval(tick, 1000);
      root._cleanup = () => clearInterval(iv);
      root.appendChild(card(h3("Мировые часы"), grid));
    },
  });

  /* ========== 50. Quiz capitals ========== */
  reg({
    id: "quiz-caps", title: "Викторина: столицы", icon: "🏛️", group: "Игры", desc: "Угадай столицу",
    render(root) {
      const data = [
        ["Россия", "Москва"], ["Франция", "Париж"], ["Германия", "Берлин"], ["Италия", "Рим"], ["Испания", "Мадрид"],
        ["Великобритания", "Лондон"], ["США", "Вашингтон"], ["Канада", "Оттава"], ["Япония", "Токио"], ["Китай", "Пекин"],
        ["Бразилия", "Бразилиа"], ["Аргентина", "Буэнос-Айрес"], ["Австралия", "Канберра"], ["Египет", "Каир"], ["Индия", "Дели"],
        ["Турция", "Анкара"], ["Польша", "Варшава"], ["Швеция", "Стокгольм"], ["Норвегия", "Осло"], ["Финляндия", "Хельсинки"],
        ["Греция", "Афины"], ["Португалия", "Лиссабон"], ["Нидерланды", "Амстердам"], ["Бельгия", "Брюссель"], ["Австрия", "Вена"],
        ["Чехия", "Прага"], ["Венгрия", "Будапешт"], ["Украина", "Киев"], ["Беларусь", "Минск"], ["Казахстан", "Астана"],
      ];
      let current, options, streak = 0, total = 0;
      const q = el("div", { class: "output center", style: { fontSize: "22px" } });
      const btns = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" } });
      const status = el("div", { class: "pill" });
      const next = () => {
        current = pick(data);
        const wrong = shuffle(data.filter(d => d[1] !== current[1])).slice(0, 3).map(d => d[1]);
        options = shuffle([current[1], ...wrong]);
        q.textContent = "Столица: " + current[0];
        btns.innerHTML = "";
        options.forEach(o => btns.appendChild(el("button", {
          class: "btn ghost",
          onclick: () => {
            total++;
            if (o === current[1]) { streak++; status.textContent = `✓ ${streak}/${total}`; }
            else { streak = 0; status.textContent = `✗ (было: ${current[1]}) — ${streak}/${total}`; }
            setTimeout(next, 700);
          }
        }, o)));
      };
      next();
      root.appendChild(card(h3("Викторина: столицы"), status, el("div", { class: "mt-3" }, q), el("div", { class: "mt-3" }, btns)));
    },
  });

  /* ========== 51. Game generator ========== */
  reg({
    id: "game-gen", title: "Генератор игр", icon: "🎮", group: "Генераторы", desc: "Концепт за 1 клик",
    render(root) {
      const genres = ["платформер", "roguelike", "метроидвания", "idle-кликер", "хоррор", "визуальная новелла", "bullet-hell", "tower defense", "survival", "тактика", "пазл", "раннер", "симулятор", "гонки", "карточная", "файтинг", "стелс", "RTS", "MOBA", "королевская битва", "sandbox", "открытый мир", "souls-like", "JRPG", "action-RPG", "VR-симулятор", "детектив", "ритм-игра", "immersive sim", "auto-battler"];
      const settings = ["киберпанк-город", "средневековый замок", "далёкое будущее", "космическая станция", "постапокалипсис", "подводный мир", "гигантское дерево", "мёртвая планета", "сны", "внутри компьютера", "стимпанк-небо", "викторианский Лондон", "советская Москва", "древний Египет", "загробный мир", "гиперпространство", "муравейник", "затерянный остров", "Дикий Запад", "мультивселенная", "чёрная дыра", "ковчег", "поезд без конца", "лабиринт-тюрьма", "биопанк-джунгли", "микромир", "снежная планета", "парк аттракционов ночью", "заброшенная станция метро"];
      const mechanics = ["гравитация переворачивается", "ты управляешь двумя персонажами одновременно", "время замедляется, когда не двигаешься", "смерть перезапускает мир", "каждый выстрел двигает тебя назад", "враги сильнее, если ты сильнее", "нет прыжка — только рывок", "один патрон на всю игру", "ты становишься тем, кого убиваешь", "противники видны только через зеркало", "экран поделён на прошлое и настоящее", "ты — инвентарь главного героя", "случайные правила каждый раунд", "дневной/ночной цикл меняет всё", "крафт из других игроков", "одна кнопка", "нельзя прыгать 2 раза подряд", "камера не твоя", "уровень рушится за тобой", "торговля с врагами"];
      const twists = ["главный злодей — это ты из будущего", "мир полностью сгенерирован AI", "каждая смерть оставляет труп на уровне", "НПС помнят твои действия навсегда", "музыка меняет геймплей", "весь сюжет — это сон кота", "финал зависит от времени, за которое ты прошёл", "есть настоящий секретный уровень только в пятницу 13-го", "персонажи ломают 4-ю стену", "новая игра+ меняет жанр", "сейв-файл общается с тобой", "деньги в игре — это твоё время", "один из персонажей — реальный игрок с другого сервера"];
      const prefixes = ["Neo", "Last", "Echo", "Cold", "Dark", "Bright", "Blood", "Sky", "Under", "Over", "Lost", "Hollow", "Broken", "Eternal", "Shattered", "Crimson", "Silent", "Wild", "Deep", "Pale"];
      const nouns = ["Protocol", "Tide", "Crown", "Bastion", "Throne", "Realm", "Path", "Circuit", "Garden", "Machine", "Shadow", "Saint", "Tower", "Descent", "Beacon", "Requiem", "Vault", "Hollow", "Oath", "Ember"];
      const out = el("div", { class: "output" });
      const gen = () => {
        const title = pick(prefixes) + " " + pick(nouns) + (Math.random() < 0.5 ? ": " + pick(["Reborn", "Awakening", "Legacy", "Nemesis", "Genesis", "Eclipse", "Odyssey"]) : "");
        const genre = pick(genres);
        const set = pick(settings);
        const mech = pick(mechanics);
        const twist = pick(twists);
        const rating = (6 + Math.random() * 4).toFixed(1);
        out.innerHTML = "";
        out.appendChild(el("h4", { style: { margin: "0 0 8px", fontSize: "24px" } }, "🎮 " + title));
        out.appendChild(el("div", { class: "muted", style: { marginBottom: "10px" } }, "Жанр: " + genre + " · Потенциальный рейтинг: " + rating + "/10"));
        out.appendChild(el("div", { class: "mt-2" }, el("b", {}, "Сеттинг: "), set));
        out.appendChild(el("div", { class: "mt-2" }, el("b", {}, "Главная фишка: "), mech));
        out.appendChild(el("div", { class: "mt-2" }, el("b", {}, "Сюжетный твист: "), twist));
        out.appendChild(el("div", { class: "mt-3 muted", style: { fontSize: "13px" } }, "Комбинаций: ~" + (genres.length * settings.length * mechanics.length * twists.length).toLocaleString("ru") + ". Жми ещё."));
      };
      gen();
      root.appendChild(card(h3("Генератор концептов игр"),
        el("div", { class: "row" }, el("button", { class: "btn", onclick: gen }, "🎲 Новая игра")),
        el("div", { class: "mt-3" }, out)
      ));
    },
  });

  /* ========== 52. Cheats ========== */
  reg({
    id: "cheats", title: "Читы", icon: "😈", group: "Развлечения", desc: "Легендарные коды + читы на игры сайта",
    render(root, { toast, go }) {
      const codes = [
        { game: "Doom (1993)", code: "IDDQD", effect: "Бессмертие (God mode)" },
        { game: "Doom (1993)", code: "IDKFA", effect: "Все ключи и оружие" },
        { game: "Контра (NES)", code: "↑↑↓↓←→←→BA", effect: "30 жизней (Konami Code)" },
        { game: "GTA: San Andreas", code: "HESOYAM", effect: "Здоровье, броня, $250,000" },
        { game: "GTA: San Andreas", code: "BAGUVIX", effect: "Бесконечное здоровье" },
        { game: "GTA V", code: "PAINKILLER", effect: "Неуязвимость 5 мин" },
        { game: "The Sims", code: "rosebud / motherlode", effect: "+1,000 / +50,000 §" },
        { game: "The Sims 4", code: "motherlode", effect: "+50,000 симолеонов" },
        { game: "Age of Empires II", code: "marco / polo", effect: "Карта / без тумана войны" },
        { game: "Warcraft III", code: "whosyourdaddy", effect: "Убийство с 1 удара" },
        { game: "StarCraft", code: "show me the money", effect: "+10,000 минералов и газа" },
        { game: "StarCraft", code: "power overwhelming", effect: "Неуязвимость" },
        { game: "WoW (старый)", code: "/macro", effect: "Макросы (не чит, но легенда)" },
        { game: "Minecraft", code: "/gamemode creative", effect: "Креативный режим" },
        { game: "Minecraft", code: "/give @p ...", effect: "Выдать себе предмет" },
        { game: "Half-Life", code: "sv_cheats 1; god", effect: "Бессмертие" },
        { game: "Quake", code: "god / noclip / give all", effect: "Бог, сквозь стены, всё оружие" },
        { game: "Mortal Kombat", code: "ABACABB", effect: "Blood code (Genesis)" },
        { game: "Command & Conquer", code: "!CheckMark!", effect: "Больше юнитов (debug)" },
        { game: "Sim City 2000", code: "FUND", effect: "+$10,000 (но с кредитом)" },
        { game: "Roblox (устаревшие)", code: "—", effect: "Обычно бан. Не делайте." },
        { game: "Cyberpunk 2077", code: "unlock_all_quickhacks", effect: "Через консоль (моды)" },
        { game: "Skyrim", code: "tgm / tcl / tfc", effect: "Бог / сквозь стены / свободная камера" },
        { game: "Civilization", code: "Chipotle (Civ VI)", effect: "Открывает дебаг-консоль" },
        { game: "Fallout 4", code: "tgm / tcl / showlooksmenu", effect: "Бог / стены / смена внешности" },
      ];
      const search = el("input", { type: "search", placeholder: "Поиск: игра или код...", style: { width: "100%" } });
      const list = el("div", { class: "mt-3", style: { display: "grid", gap: "6px", maxHeight: "300px", overflowY: "auto" } });
      const renderList = () => {
        const q = (search.value || "").toLowerCase();
        list.innerHTML = "";
        const filtered = codes.filter(c => !q || c.game.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.effect.toLowerCase().includes(q));
        if (!filtered.length) { list.appendChild(el("div", { class: "muted" }, "Ничего не найдено.")); return; }
        filtered.forEach(c => {
          const row = el("div", { style: { padding: "8px 10px", background: "var(--panel-2)", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center" } },
            el("div", {},
              el("div", { style: { fontWeight: "600" } }, c.game),
              el("div", { class: "muted", style: { fontSize: "13px" } }, c.effect)
            ),
            el("code", { style: { background: "var(--panel)", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", userSelect: "all" }, title: "Клик — скопировать", onclick: () => { navigator.clipboard?.writeText(c.code); toast("Скопировано: " + c.code); } }, c.code),
          );
          list.appendChild(row);
        });
      };
      search.oninput = renderList;
      renderList();

      /* Live cheats */
      const liveStatus = el("div", { class: "muted", style: { fontSize: "13px", marginTop: "6px" } });
      const updateStatus = () => {
        const parts = [];
        const c2048 = localStorage.getItem("cheat-2048");
        if (c2048 === "big") parts.push("2048: стартовые плитки 128");
        else if (c2048 === "win") parts.push("2048: стартовые плитки 1024");
        const clk = +(localStorage.getItem("clicker") || 0);
        if (clk >= 1000000) parts.push("Кликер: " + clk.toLocaleString("ru"));
        const rb = localStorage.getItem("reaction-best");
        if (rb && +rb <= 10) parts.push("Реакция: рекорд " + rb + "мс");
        liveStatus.textContent = parts.length ? "Активно: " + parts.join(" · ") : "Активных читов нет.";
      };

      const cheatBtn = (label, fn) => el("button", { class: "btn", onclick: () => { fn(); updateStatus(); } }, label);
      const liveCheats = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" } },
        cheatBtn("🧮 2048: старт с плиток 128", () => { localStorage.setItem("cheat-2048", "big"); toast("Вкл. Открой 2048 заново"); }),
        cheatBtn("🧮 2048: старт с плиток 1024", () => { localStorage.setItem("cheat-2048", "win"); toast("Вкл. Один ход до победы"); }),
        cheatBtn("🧮 2048: выкл читы", () => { localStorage.removeItem("cheat-2048"); toast("Выкл"); }),
        cheatBtn("👆 Кликер: +1,000,000", () => { const cur = +(localStorage.getItem("clicker") || 0); localStorage.setItem("clicker", cur + 1000000); toast("+1,000,000 очков"); }),
        cheatBtn("👆 Кликер: сброс", () => { localStorage.setItem("clicker", 0); toast("Обнулено"); }),
        cheatBtn("⚡ Реакция: рекорд 1 мс", () => { localStorage.setItem("reaction-best", 1); toast("Теперь ты бог"); }),
        cheatBtn("⚡ Реакция: сброс рекорда", () => { localStorage.removeItem("reaction-best"); toast("Сброшено"); }),
        cheatBtn("🔢 Угадай число: показать", () => { const t = window.__guessTarget; if (t) { toast("Загаданное число: " + t); } else { toast("Открой 'Угадай число' сначала"); } }),
        cheatBtn("🟩 Wordle: показать слово", () => { const w = window.__wordleTarget; if (w) { toast("Слово: " + w); } else { toast("Открой Wordle сначала"); } }),
        cheatBtn("🍅 Pomodoro: пропустить цикл", () => { toast("Сам знаешь, что просто выключи таймер :)"); }),
        cheatBtn("🎰 Все рекорды: сброс", () => { ["clicker", "2048-best", "reaction-best", "cheat-2048", "flappy-best", "snake-best"].forEach(k => localStorage.removeItem(k)); toast("Всё сброшено"); }),
        cheatBtn("🌈 Rainbow page (5 сек)", () => {
          const body = document.body;
          body.style.transition = "filter 0.5s";
          body.style.filter = "hue-rotate(0deg)";
          let deg = 0;
          const iv = setInterval(() => { deg = (deg + 30) % 360; body.style.filter = `hue-rotate(${deg}deg)`; }, 100);
          setTimeout(() => { clearInterval(iv); body.style.filter = ""; body.style.transition = ""; }, 5000);
        }),
      );

      /* Konami code listener (persists across section navigation) */
      const konamiStatus = el("div", { class: "pill" }, window.__konamiUnlocked ? "🎉 Konami активирован" : "Konami: введи ↑↑↓↓←→←→BA");
      const konamiSeq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
      if (!window.__konamiInstalled) {
        window.__konamiInstalled = true;
        let idx = 0;
        document.addEventListener("keydown", (e) => {
          const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
          if (k === konamiSeq[idx]) {
            idx++;
            if (idx === konamiSeq.length) {
              idx = 0;
              window.__konamiUnlocked = true;
              localStorage.setItem("konami", "1");
              // Fireworks of emojis
              const layer = document.createElement("div");
              Object.assign(layer.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "9999", overflow: "hidden" });
              document.body.appendChild(layer);
              const emojis = ["🎉", "✨", "🎊", "💥", "🔥", "⭐", "🌟"];
              for (let i = 0; i < 60; i++) {
                const s = document.createElement("div");
                s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                Object.assign(s.style, { position: "absolute", left: Math.random() * 100 + "%", top: "-5%", fontSize: (20 + Math.random() * 30) + "px", transition: "transform 3s linear, opacity 3s linear", opacity: "1" });
                layer.appendChild(s);
                requestAnimationFrame(() => { s.style.transform = `translateY(${window.innerHeight + 200}px) rotate(${Math.random() * 720}deg)`; s.style.opacity = "0"; });
              }
              setTimeout(() => layer.remove(), 3500);
              try { const K = document.querySelector(".konami-pill"); if (K) K.textContent = "🎉 Konami активирован"; } catch (e) {}
            }
          } else {
            idx = k === konamiSeq[0] ? 1 : 0;
          }
        });
      }
      konamiStatus.className = "pill konami-pill";
      if (localStorage.getItem("konami") === "1") { window.__konamiUnlocked = true; konamiStatus.textContent = "🎉 Konami активирован"; }

      updateStatus();
      root.appendChild(card(h3("База чит-кодов"), search, list));
      root.appendChild(card(h3("Живые читы на игры этого сайта"), el("p", { class: "muted" }, "Меняют localStorage или DOM. Перезайди в игру, чтобы увидеть эффект."),
        el("div", { class: "mt-3" }, liveCheats),
        el("div", { class: "mt-3 row" }, liveStatus)
      ));
      root.appendChild(card(h3("Секрет"), konamiStatus, el("p", { class: "muted mt-2" }, "Введи классический код Konami где угодно на сайте — будет сюрприз.")));
    },
  });

})();
