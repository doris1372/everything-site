/* +4 gaming-utility sections (console cheats DB, fingerprint viewer, CS2 config, sens converter) */
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

  /* ================================================
   *  1. Большая база консольных чит-команд
   * ================================================
   *  Только офлайн / свои сервера / синглплеер. Никакого MP.
   */
  reg({
    id: "console-cheats", title: "Консольные читы", icon: "📚", group: "Развлечения",
    desc: "sv_cheats 1 и команды для ~15 игр",
    render(root, { toast }) {
      const DB = [
        /* Counter-Strike 2 / CSGO / CS 1.6 — only with sv_cheats 1 on your own server */
        { game: "CS2 / CSGO", cmd: "sv_cheats 1", effect: "Включить режим читов (нужно для нижних команд). Работает только на своём сервере/локально." },
        { game: "CS2 / CSGO", cmd: "noclip", effect: "Полёт сквозь стены" },
        { game: "CS2 / CSGO", cmd: "god", effect: "Бессмертие" },
        { game: "CS2 / CSGO", cmd: "impulse 101", effect: "Дать все оружия и $16000 (CSGO)" },
        { game: "CS2 / CSGO", cmd: "give weapon_ak47", effect: "Выдать AK-47" },
        { game: "CS2 / CSGO", cmd: "give weapon_awp", effect: "Выдать AWP" },
        { game: "CS2 / CSGO", cmd: "bot_add / bot_add_t / bot_add_ct", effect: "Добавить бота (в определённую команду)" },
        { game: "CS2 / CSGO", cmd: "bot_kick", effect: "Выгнать всех ботов" },
        { game: "CS2 / CSGO", cmd: "bot_stop 1", effect: "Боты стоят на месте" },
        { game: "CS2 / CSGO", cmd: "mp_limitteams 0 ; mp_autoteambalance 0", effect: "Отключить балансировку команд" },
        { game: "CS2 / CSGO", cmd: "host_timescale 2", effect: "Ускорить игру x2 (1 = норма)" },
        { game: "CS2 / CSGO", cmd: "mp_roundtime 60 ; mp_restartgame 1", effect: "Увеличить раунд до 60 мин" },
        { game: "CS2 / CSGO", cmd: "mp_freezetime 0", effect: "Отключить фриз-тайм" },
        { game: "CS2 / CSGO", cmd: "mp_warmup_end", effect: "Закончить разминку" },
        { game: "CS2 / CSGO", cmd: "mp_startmoney 16000 ; mp_maxmoney 65535", effect: "Стартовые / максимальные деньги" },
        { game: "CS2 / CSGO", cmd: "mp_buytime 9999", effect: "Покупать всегда" },
        { game: "CS2 / CSGO", cmd: "mp_buy_anywhere 1", effect: "Покупать где угодно" },
        { game: "CS2 / CSGO", cmd: "sv_infinite_ammo 1", effect: "Бесконечные патроны" },
        { game: "CS2 / CSGO", cmd: "sv_infinite_ammo 2", effect: "Не нужна перезарядка" },
        { game: "CS2 / CSGO", cmd: "sv_showimpacts 1", effect: "Показывать точки попаданий (debug)" },
        { game: "CS2 / CSGO", cmd: "sv_grenade_trajectory 1", effect: "Траектория гранат" },
        { game: "CS2 / CSGO", cmd: "ent_fire !self addoutput \"health 99999\"", effect: "Установить своё HP в 99999 (CSGO)" },

        /* Quake — legendary */
        { game: "Quake", cmd: "god", effect: "Бессмертие" },
        { game: "Quake", cmd: "noclip", effect: "Сквозь стены" },
        { game: "Quake", cmd: "give all / give w", effect: "Все предметы / всё оружие" },
        { game: "Quake", cmd: "map e1m1", effect: "Загрузить карту" },
        { game: "Quake", cmd: "impulse 9", effect: "Все оружия + патроны" },

        /* Half-Life (classic) */
        { game: "Half-Life", cmd: "sv_cheats 1", effect: "Включить читы" },
        { game: "Half-Life", cmd: "god", effect: "Бессмертие" },
        { game: "Half-Life", cmd: "noclip", effect: "Сквозь стены" },
        { game: "Half-Life", cmd: "impulse 101", effect: "Все оружия и патроны" },
        { game: "Half-Life", cmd: "notarget", effect: "Враги не видят" },

        /* Doom (classic, 1993/Ultimate) */
        { game: "Doom (1993)", cmd: "IDDQD", effect: "God mode" },
        { game: "Doom (1993)", cmd: "IDKFA", effect: "Все ключи, все оружия, 200% патронов" },
        { game: "Doom (1993)", cmd: "IDFA", effect: "Все оружия без ключей" },
        { game: "Doom (1993)", cmd: "IDCLIP", effect: "Сквозь стены (Doom II)" },
        { game: "Doom (1993)", cmd: "IDSPISPOPD", effect: "Сквозь стены (Doom I)" },
        { game: "Doom (1993)", cmd: "IDBEHOLDV", effect: "Бессмертие на 30 сек" },
        { game: "Doom (1993)", cmd: "IDCLEV##", effect: "Перейти на карту (например IDCLEV23)" },

        /* GTA V */
        { game: "GTA V", cmd: "PAINKILLER", effect: "Неуязвимость на 5 мин" },
        { game: "GTA V", cmd: "TURTLE", effect: "Полное здоровье и броня" },
        { game: "GTA V", cmd: "POWERUP", effect: "Полные спец-способности" },
        { game: "GTA V", cmd: "TOOLUP", effect: "Все оружия" },
        { game: "GTA V", cmd: "SKYFALL", effect: "Падение с неба" },
        { game: "GTA V", cmd: "LIQUOR", effect: "Пьяный режим" },
        { game: "GTA V", cmd: "FUGITIVE", effect: "Поднять уровень розыска" },
        { game: "GTA V", cmd: "LAWYERUP", effect: "Снять розыск" },
        { game: "GTA V", cmd: "HOPTOIT", effect: "Супер-прыжок" },
        { game: "GTA V", cmd: "CATCHME", effect: "Быстрый бег" },
        { game: "GTA V", cmd: "DEADEYE", effect: "Слоу-мо при прицеливании" },
        { game: "GTA V", cmd: "SLOWMO (x3)", effect: "Замедление (3 уровня)" },
        { game: "GTA V", cmd: "GOTGILLS", effect: "Быстрое плавание" },
        { game: "GTA V", cmd: "MAKEITRAIN", effect: "Изменить погоду на дождь" },

        /* GTA San Andreas */
        { game: "GTA: San Andreas", cmd: "HESOYAM", effect: "Здоровье, броня, $250,000, починить авто" },
        { game: "GTA: San Andreas", cmd: "BAGUVIX", effect: "Бесконечное здоровье" },
        { game: "GTA: San Andreas", cmd: "CVWKXAM", effect: "Бесконечный кислород" },
        { game: "GTA: San Andreas", cmd: "THUGSTOOLS", effect: "Оружие уровня 1 (thug)" },
        { game: "GTA: San Andreas", cmd: "PROFESSIONALTOOLS", effect: "Оружие уровня 2" },
        { game: "GTA: San Andreas", cmd: "NUTTERTOOLS", effect: "Оружие уровня 3 (nutter)" },
        { game: "GTA: San Andreas", cmd: "AEZAKMI", effect: "Никогда не разыскивают" },
        { game: "GTA: San Andreas", cmd: "BRINGITON", effect: "Уровень розыска 6" },
        { game: "GTA: San Andreas", cmd: "JUMPJET", effect: "Заспавнить Hydra" },
        { game: "GTA: San Andreas", cmd: "OHDUDE", effect: "Заспавнить Hunter" },
        { game: "GTA: San Andreas", cmd: "ROCKETMAN", effect: "Jetpack" },
        { game: "GTA: San Andreas", cmd: "ASNAEB", effect: "Ясная погода" },

        /* Skyrim / Oblivion */
        { game: "Skyrim", cmd: "tgm", effect: "God mode (неуязвимость + бесконечные заклинания)" },
        { game: "Skyrim", cmd: "tcl", effect: "Отключить коллизии (сквозь всё)" },
        { game: "Skyrim", cmd: "tfc", effect: "Свободная камера" },
        { game: "Skyrim", cmd: "tm", effect: "Скрыть UI (для скриншотов)" },
        { game: "Skyrim", cmd: "player.additem 0000000f 10000", effect: "Добавить 10,000 золота" },
        { game: "Skyrim", cmd: "player.additem 0000000a 1", effect: "Добавить отмычку" },
        { game: "Skyrim", cmd: "player.setlevel 50", effect: "Установить уровень 50" },
        { game: "Skyrim", cmd: "player.addperk <ID>", effect: "Добавить перк" },
        { game: "Skyrim", cmd: "psb", effect: "Выучить все заклинания" },
        { game: "Skyrim", cmd: "coc whiterun", effect: "Телепорт в Вайтран" },
        { game: "Skyrim", cmd: "kill", effect: "Убить выделенную цель" },
        { game: "Skyrim", cmd: "resurrect", effect: "Воскресить выделенную цель" },
        { game: "Skyrim", cmd: "disable", effect: "Убрать объект из мира" },

        /* Fallout 4 */
        { game: "Fallout 4", cmd: "tgm", effect: "God mode" },
        { game: "Fallout 4", cmd: "tcl", effect: "Отключить коллизии" },
        { game: "Fallout 4", cmd: "tfc", effect: "Свободная камера" },
        { game: "Fallout 4", cmd: "player.additem 0000000f 1000", effect: "+1000 крышек" },
        { game: "Fallout 4", cmd: "player.additem 0001f66b 100", effect: "Стимпаки" },
        { game: "Fallout 4", cmd: "player.setav speedmult 200", effect: "Ходить x2 быстрее" },
        { game: "Fallout 4", cmd: "coc sanctuaryext", effect: "Телепорт в Sanctuary" },
        { game: "Fallout 4", cmd: "showlooksmenu player 1", effect: "Меню редактирования внешности" },

        /* Minecraft commands */
        { game: "Minecraft", cmd: "/gamemode creative", effect: "Креативный режим" },
        { game: "Minecraft", cmd: "/gamemode survival", effect: "Выживание" },
        { game: "Minecraft", cmd: "/give @p diamond 64", effect: "64 алмаза" },
        { game: "Minecraft", cmd: "/give @p netherite_ingot 16", effect: "Незеритовые слитки" },
        { game: "Minecraft", cmd: "/effect give @p minecraft:night_vision 9999", effect: "Ночное зрение" },
        { game: "Minecraft", cmd: "/effect give @p minecraft:regeneration 9999 10", effect: "Регенерация" },
        { game: "Minecraft", cmd: "/time set day", effect: "День" },
        { game: "Minecraft", cmd: "/weather clear", effect: "Ясно" },
        { game: "Minecraft", cmd: "/tp @p ~ ~10 ~", effect: "Телепорт на 10 блоков вверх" },
        { game: "Minecraft", cmd: "/kill @e[type=!player]", effect: "Убить всех мобов" },
        { game: "Minecraft", cmd: "/locate structure minecraft:stronghold", effect: "Найти крепость" },
        { game: "Minecraft", cmd: "/seed", effect: "Показать сид мира" },

        /* Terraria */
        { game: "Terraria", cmd: "/godmode (journey)", effect: "Бессмертие (journey mode)" },
        { game: "Terraria", cmd: "/setdifficulty expert", effect: "Поменять сложность" },
        { game: "Terraria", cmd: "item slider (journey)", effect: "Дублирование любого предмета в journey" },
        { game: "Terraria", cmd: "TCC / TMOD mods", effect: "Читы через TModLoader / Cheat Sheet mod" },

        /* Stardew Valley */
        { game: "Stardew Valley", cmd: "Имя персонажа: '[123 456]'", effect: "Заспавнит предметы с ID 123 и 456" },
        { game: "Stardew Valley", cmd: "CJB Cheats Menu (mod)", effect: "Меню читов (деньги, ходьба скорость, погода)" },
        { game: "Stardew Valley", cmd: "'[104] Roger'", effect: "Пример имени, создающий 'неоспоримую книгу' (104)" },

        /* Factorio */
        { game: "Factorio", cmd: "/cheat all", effect: "Все технологии + броня + оружие" },
        { game: "Factorio", cmd: "/c game.player.character.walking_speed_modifier = 5", effect: "Скорость ходьбы x6" },
        { game: "Factorio", cmd: "/c game.player.force.chart(game.player.surface, {{-1024,-1024},{1024,1024}})", effect: "Открыть карту" },
        { game: "Factorio", cmd: "/editor", effect: "Переключить в редактор (singleplayer)" },

        /* Civilization VI */
        { game: "Civilization VI", cmd: "DebugPanel = 1 (AppOptions.txt)", effect: "Включить дебаг-панель" },
        { game: "Civilization VI", cmd: "EnableDebugMenu 1", effect: "Альтернативный метод" },

        /* Age of Empires II */
        { game: "Age of Empires II", cmd: "marco", effect: "Показать всю карту" },
        { game: "Age of Empires II", cmd: "polo", effect: "Убрать туман войны" },
        { game: "Age of Empires II", cmd: "rock on", effect: "+1000 камня" },
        { game: "Age of Empires II", cmd: "lumberjack", effect: "+1000 дерева" },
        { game: "Age of Empires II", cmd: "cheese steak jimmy's", effect: "+1000 еды" },
        { game: "Age of Empires II", cmd: "robin hood", effect: "+1000 золота" },
        { game: "Age of Empires II", cmd: "i r winner", effect: "Победить" },
        { game: "Age of Empires II", cmd: "i love the monkey head", effect: "Жуткий 'VDML'-юнит" },
        { game: "Age of Empires II", cmd: "how do you turn this on", effect: "Заспавнить Cobra Car" },

        /* Warcraft III */
        { game: "Warcraft III", cmd: "whosyourdaddy", effect: "Убийство с одного удара" },
        { game: "Warcraft III", cmd: "iseedeadpeople", effect: "Открыть карту" },
        { game: "Warcraft III", cmd: "greedisgood 99999", effect: "+99999 золота и дерева" },
        { game: "Warcraft III", cmd: "keysersoze 99999", effect: "+99999 золота" },
        { game: "Warcraft III", cmd: "pointbreak", effect: "Отключить лимит еды" },
        { game: "Warcraft III", cmd: "thereisnospoon", effect: "Бесконечная мана" },
        { game: "Warcraft III", cmd: "warpten", effect: "Ускорить строительство" },

        /* StarCraft */
        { game: "StarCraft", cmd: "show me the money", effect: "+10,000 минералов и газа" },
        { game: "StarCraft", cmd: "power overwhelming", effect: "Неуязвимость" },
        { game: "StarCraft", cmd: "operation cwal", effect: "Быстрое строительство" },
        { game: "StarCraft", cmd: "black sheep wall", effect: "Открыть карту" },
        { game: "StarCraft", cmd: "there is no cow level", effect: "Победить миссию" },
        { game: "StarCraft", cmd: "modify the phase variance", effect: "Построить что угодно" },
        { game: "StarCraft", cmd: "war aint what it used to be", effect: "Убрать туман войны" },

        /* The Sims */
        { game: "The Sims 4", cmd: "testingcheats true", effect: "Включить читы" },
        { game: "The Sims 4", cmd: "motherlode", effect: "+50,000 симолеонов" },
        { game: "The Sims 4", cmd: "rosebud / kaching", effect: "+1,000 симолеонов" },
        { game: "The Sims 4", cmd: "Money 999999", effect: "Установить точную сумму" },
        { game: "The Sims 4", cmd: "cas.fulleditmode", effect: "Полный CAS (редактировать симов в игре)" },
        { game: "The Sims 4", cmd: "bb.moveobjects on", effect: "Двигать/ставить предметы где угодно" },
        { game: "The Sims 4", cmd: "stats.set_skill_level Major_Handiness 10", effect: "Макс. навык починки" },
        { game: "The Sims 4", cmd: "death.toggle false", effect: "Отключить смерть" },
        { game: "The Sims 4", cmd: "aspirations.complete_current_milestone", effect: "Завершить текущую веху устремления" },

        /* Cyberpunk 2077 (через cyber engine tweaks mod) */
        { game: "Cyberpunk 2077", cmd: "Game.AddToInventory('Items.money', 99999)", effect: "+99,999 эдди (нужен CET)" },
        { game: "Cyberpunk 2077", cmd: "Game.SetLevel('Level', 50)", effect: "Уровень 50" },
        { game: "Cyberpunk 2077", cmd: "Game.GetPlayer():GetStatsSystem():AddModifier(...)", effect: "Добавить модификатор" },
        { game: "Cyberpunk 2077", cmd: "Game.AddToInventory('Items.Preset_V54_Johnny', 1)", effect: "Заспавнить пистолет Джонни" },

        /* The Witcher 3 (console mod) */
        { game: "The Witcher 3", cmd: "addmoney(10000)", effect: "+10,000 крон" },
        { game: "The Witcher 3", cmd: "god", effect: "Бессмертие" },
        { game: "The Witcher 3", cmd: "addexp(10000)", effect: "+10,000 опыта" },
        { game: "The Witcher 3", cmd: "healme", effect: "Восстановить здоровье" },
        { game: "The Witcher 3", cmd: "additem('Aerondight', 1)", effect: "Дать Аэрондайт" },
        { game: "The Witcher 3", cmd: "setlevel(35)", effect: "Установить уровень" },
      ];

      const search = el("input", { type: "search", placeholder: "Поиск: игра, команда, эффект...", style: { width: "100%" } });
      const gameFilter = el("select", { style: { padding: "8px" } });
      const games = ["Все игры", ...Array.from(new Set(DB.map(c => c.game))).sort()];
      games.forEach(g => gameFilter.appendChild(el("option", { value: g }, g)));
      const count = el("div", { class: "pill" });
      const list = el("div", { class: "mt-3", style: { display: "grid", gap: "6px", maxHeight: "500px", overflowY: "auto" } });

      const redraw = () => {
        const q = (search.value || "").toLowerCase();
        const gf = gameFilter.value;
        const filtered = DB.filter(c => {
          if (gf !== "Все игры" && c.game !== gf) return false;
          if (!q) return true;
          return c.game.toLowerCase().includes(q) || c.cmd.toLowerCase().includes(q) || c.effect.toLowerCase().includes(q);
        });
        list.innerHTML = "";
        count.textContent = `Найдено: ${filtered.length} / ${DB.length}`;
        if (!filtered.length) { list.appendChild(el("div", { class: "muted" }, "Ничего не найдено.")); return; }
        filtered.forEach(c => {
          list.appendChild(el("div", {
            style: { padding: "10px", background: "var(--panel-2)", borderRadius: "8px", display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "10px", alignItems: "center" }
          },
            el("div", { class: "muted", style: { fontSize: "13px", fontWeight: "600" } }, c.game),
            el("div", {},
              el("code", { style: { background: "var(--panel)", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" } }, c.cmd),
              el("div", { class: "muted", style: { fontSize: "12px", marginTop: "4px" } }, c.effect),
            ),
            el("button", {
              class: "btn ghost",
              style: { fontSize: "12px", padding: "6px 10px" },
              onclick: () => { navigator.clipboard?.writeText(c.cmd); toast("Скопировано: " + c.cmd); }
            }, "📋")
          ));
        });
      };
      search.oninput = redraw;
      gameFilter.onchange = redraw;
      redraw();

      root.appendChild(card(h3("Консольные команды / читы (" + DB.length + ")"),
        el("p", { class: "muted" }, "Только для синглплеера, офлайн-режима и своих локальных серверов. В мультиплеерных матчмейкинговых играх эти команды заблокированы анти-читом (VAC, EAC, BattlEye)."),
        el("div", { class: "row mt-3" }, search),
        el("div", { class: "row mt-2" }, el("label", {}, "Игра: "), gameFilter, count),
        list
      ));
    },
  });

  /* ================================================
   *  2. Browser fingerprint viewer
   * ================================================
   *  Показывает, что твой браузер раскрывает о тебе.
   */
  reg({
    id: "fingerprint", title: "Fingerprint браузера", icon: "🔍", group: "Утилиты",
    desc: "Что твой браузер раскрывает о тебе",
    render(root, { toast }) {
      const row = (label, value, muted) => el("div", {
        style: { display: "grid", gridTemplateColumns: "220px 1fr", gap: "10px", padding: "6px 0", borderBottom: "1px solid var(--panel-2)" }
      },
        el("div", { class: "muted", style: { fontSize: "13px" } }, label),
        el("div", { style: { fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all", color: muted ? "var(--muted)" : "inherit" } }, value || "—"),
      );

      const container = el("div", { class: "mt-3" });
      container.appendChild(el("div", { class: "muted", style: { fontSize: "13px" } }, "Собираем данные..."));

      const hash32 = async (text) => {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).slice(0, 4).map(b => b.toString(16).padStart(2, "0")).join("");
      };

      const canvasFP = async () => {
        try {
          const c = document.createElement("canvas");
          c.width = 240; c.height = 60;
          const ctx = c.getContext("2d");
          ctx.textBaseline = "top";
          ctx.font = "14px Arial";
          ctx.fillStyle = "#f60";
          ctx.fillRect(10, 10, 100, 30);
          ctx.fillStyle = "#069";
          ctx.fillText("Fingerprint 🔍 Ω★", 2, 15);
          ctx.fillStyle = "rgba(102,204,0,0.7)";
          ctx.fillText("Fingerprint 🔍 Ω★", 4, 17);
          return await hash32(c.toDataURL());
        } catch (e) { return "заблокировано"; }
      };

      const webglFP = () => {
        try {
          const c = document.createElement("canvas");
          const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
          if (!gl) return { vendor: "—", renderer: "—", unmaskedRenderer: "—" };
          const dbg = gl.getExtension("WEBGL_debug_renderer_info");
          return {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            unmaskedRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "—",
            unmaskedVendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : "—",
          };
        } catch (e) { return { vendor: "—", renderer: "—", unmaskedRenderer: "—" }; }
      };

      const audioFP = async () => {
        try {
          const OA = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          if (!OA) return "не поддерживается";
          const ctx = new OA(1, 44100, 44100);
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.value = 10000;
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -50; comp.knee.value = 40; comp.ratio.value = 12;
          comp.attack.value = 0; comp.release.value = 0.25;
          osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
          const buf = await ctx.startRendering();
          const data = buf.getChannelData(0).slice(4500, 5000);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
          return await hash32(sum.toString());
        } catch (e) { return "заблокировано"; }
      };

      const fontCheck = () => {
        const testFonts = ["Arial", "Courier New", "Times New Roman", "Verdana", "Georgia", "Tahoma", "Trebuchet MS", "Comic Sans MS", "Impact", "Lucida Console", "Consolas", "Menlo", "Monaco", "Roboto", "Ubuntu", "Segoe UI", "Helvetica", "Noto Sans", "Open Sans", "Fira Code", "Source Code Pro", "JetBrains Mono", "PT Sans", "Arial Black", "Palatino", "Cambria", "Calibri", "Garamond"];
        const base = ["monospace", "sans-serif", "serif"];
        const span = document.createElement("span");
        span.textContent = "mmmmmmmmmmlliI";
        span.style.fontSize = "72px";
        span.style.position = "absolute"; span.style.left = "-9999px";
        document.body.appendChild(span);
        const widths = {};
        for (const b of base) { span.style.fontFamily = b; widths[b] = span.offsetWidth; }
        const detected = [];
        for (const f of testFonts) {
          let found = false;
          for (const b of base) {
            span.style.fontFamily = `"${f}", ${b}`;
            if (span.offsetWidth !== widths[b]) { found = true; break; }
          }
          if (found) detected.push(f);
        }
        span.remove();
        return detected;
      };

      const webrtcIP = () => new Promise(resolve => {
        try {
          const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
          pc.createDataChannel("");
          pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => resolve("недоступно"));
          const ips = new Set();
          pc.onicecandidate = (e) => {
            if (!e.candidate) { pc.close(); resolve(ips.size ? [...ips].join(", ") : "не раскрыто"); return; }
            const m = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[0-9a-f]{0,4}(:[0-9a-f]{0,4}){2,})/i.exec(e.candidate.candidate || "");
            if (m) ips.add(m[1]);
          };
          setTimeout(() => { pc.close(); resolve(ips.size ? [...ips].join(", ") : "не раскрыто (или заблокировано)"); }, 1500);
        } catch (e) { resolve("заблокировано"); }
      });

      const gather = async () => {
        const n = navigator;
        const s = screen;
        const [canvasHash, audioHash, webrtc] = await Promise.all([canvasFP(), audioFP(), webrtcIP()]);
        const gl = webglFP();
        const fonts = fontCheck();

        container.innerHTML = "";
        container.appendChild(el("h4", { style: { margin: "14px 0 8px" } }, "🖥️ Окружение"));
        container.appendChild(row("User Agent", n.userAgent));
        container.appendChild(row("Platform", n.platform));
        container.appendChild(row("Языки", (n.languages || [n.language]).join(", ")));
        container.appendChild(row("Часовой пояс", Intl.DateTimeFormat().resolvedOptions().timeZone + " (UTC" + (-new Date().getTimezoneOffset() / 60 >= 0 ? "+" : "") + (-new Date().getTimezoneOffset() / 60) + ")"));
        container.appendChild(row("Cookies", n.cookieEnabled ? "включены" : "выключены"));
        container.appendChild(row("Do Not Track", n.doNotTrack || "не установлен"));
        container.appendChild(row("Онлайн", n.onLine ? "да" : "нет"));

        container.appendChild(el("h4", { style: { margin: "14px 0 8px" } }, "📺 Экран"));
        container.appendChild(row("Разрешение", `${s.width}×${s.height}`));
        container.appendChild(row("Доступное", `${s.availWidth}×${s.availHeight}`));
        container.appendChild(row("Глубина цвета", s.colorDepth + " бит"));
        container.appendChild(row("Pixel Ratio", (window.devicePixelRatio || 1).toFixed(2)));
        container.appendChild(row("Размер окна", `${window.innerWidth}×${window.innerHeight}`));

        container.appendChild(el("h4", { style: { margin: "14px 0 8px" } }, "⚙️ Железо"));
        container.appendChild(row("CPU ядер (logical)", n.hardwareConcurrency || "—"));
        container.appendChild(row("RAM (прибл.)", n.deviceMemory ? n.deviceMemory + " ГБ" : "не раскрыто"));
        container.appendChild(row("Touch points", n.maxTouchPoints || 0));
        const conn = n.connection || n.mozConnection || n.webkitConnection;
        container.appendChild(row("Сеть", conn ? `${conn.effectiveType || "?"} · ${conn.downlink || "?"} Mbps · RTT ${conn.rtt || "?"}ms` : "API недоступен"));

        container.appendChild(el("h4", { style: { margin: "14px 0 8px" } }, "🎨 GPU / WebGL"));
        container.appendChild(row("Vendor", gl.vendor));
        container.appendChild(row("Renderer", gl.renderer));
        container.appendChild(row("Unmasked vendor", gl.unmaskedVendor));
        container.appendChild(row("Unmasked renderer", gl.unmaskedRenderer));

        container.appendChild(el("h4", { style: { margin: "14px 0 8px" } }, "🆔 Fingerprint-хэши"));
        container.appendChild(row("Canvas (первые 4 байта SHA-256)", canvasHash));
        container.appendChild(row("AudioContext", audioHash));

        container.appendChild(el("h4", { style: { margin: "14px 0 8px" } }, "🔤 Обнаружено шрифтов"));
        container.appendChild(row(`${fonts.length} из ${28}`, fonts.join(", ") || "ничего"));

        container.appendChild(el("h4", { style: { margin: "14px 0 8px" } }, "🌐 WebRTC IP leak"));
        container.appendChild(row("Локальные/публичные IP", webrtc));

        container.appendChild(el("p", { class: "muted mt-3", style: { fontSize: "13px" } },
          "Эта секция только показывает, что браузер выдаёт сайтам. Чтобы меньше светиться: включи Resist Fingerprinting в Firefox, используй Tor Browser или добавь uBlock Origin + CanvasBlocker."));

        const combined = n.userAgent + "|" + n.platform + "|" + (n.languages || []).join(",") + "|" + s.width + "x" + s.height + "|" + canvasHash + "|" + audioHash + "|" + fonts.join(",") + "|" + gl.unmaskedRenderer;
        const full = await hash32(combined);
        container.prepend(el("div", { class: "pill", style: { fontSize: "15px" } }, "🆔 Твой общий fingerprint: " + full));
      };

      gather();

      root.appendChild(card(h3("Browser fingerprint"), el("p", { class: "muted" }, "Смотрим, что твой браузер рассказывает сайтам (UA, GPU, шрифты, canvas-хэш, WebRTC-утечки и т.д.)."), container));
    },
  });

  /* ================================================
   *  3. CS2 config generator
   * ================================================
   */
  reg({
    id: "cs2-config", title: "CS2 конфиг", icon: "🎯", group: "Генераторы",
    desc: "Прицел, viewmodel, чувствительность",
    render(root, { toast }) {
      const state = {
        // crosshair
        cl_crosshairstyle: 4,
        cl_crosshairsize: 2.5,
        cl_crosshairthickness: 1.0,
        cl_crosshairgap: -2,
        cl_crosshairdot: 0,
        cl_crosshair_t: 0,
        cl_crosshaircolor: 1,
        cl_crosshairalpha: 255,
        cl_crosshair_drawoutline: 1,
        cl_crosshair_outlinethickness: 1,
        // viewmodel
        viewmodel_fov: 68,
        viewmodel_offset_x: 2.5,
        viewmodel_offset_y: 2.0,
        viewmodel_offset_z: -2.0,
        viewmodel_presetpos: 3,
        // sens
        sensitivity: 1.5,
        zoom_sensitivity_ratio_mouse: 1.0,
        fps_max: 0,
      };

      const preview = el("canvas", { width: 200, height: 200, style: { background: "#2d2d2d", borderRadius: "8px" } });
      const renderPreview = () => {
        const ctx = preview.getContext("2d");
        ctx.clearRect(0, 0, 200, 200);
        ctx.fillStyle = "#2d2d2d"; ctx.fillRect(0, 0, 200, 200);
        const cx = 100, cy = 100;
        const palette = { 0: "#ff0000", 1: "#00ff00", 2: "#ffff00", 3: "#0000ff", 4: "#00ffff" };
        const color = palette[state.cl_crosshaircolor] || "#00ff00";
        const size = state.cl_crosshairsize * 6;
        const th = Math.max(1, state.cl_crosshairthickness * 2);
        const gap = Math.max(0, 4 + state.cl_crosshairgap * 2);
        ctx.globalAlpha = state.cl_crosshairalpha / 255;
        const draw = (dx, dy, w, h) => {
          if (state.cl_crosshair_drawoutline) {
            ctx.fillStyle = "#000";
            const o = state.cl_crosshair_outlinethickness;
            ctx.fillRect(dx - o, dy - o, w + 2*o, h + 2*o);
          }
          ctx.fillStyle = color;
          ctx.fillRect(dx, dy, w, h);
        };
        // vertical top
        if (!state.cl_crosshair_t) draw(cx - th/2, cy - gap - size, th, size);
        // bottom, left, right
        draw(cx - th/2, cy + gap, th, size);
        draw(cx - gap - size, cy - th/2, size, th);
        draw(cx + gap, cy - th/2, size, th);
        if (state.cl_crosshairdot) { ctx.fillStyle = color; ctx.fillRect(cx - th/2, cy - th/2, th, th); }
        ctx.globalAlpha = 1;
      };

      const output = el("pre", {
        style: { background: "var(--panel-2)", padding: "12px", borderRadius: "8px", overflow: "auto", fontSize: "13px", maxHeight: "280px" }
      });
      const renderOutput = () => {
        const lines = [
          "// === Прицел ===",
          `cl_crosshairstyle ${state.cl_crosshairstyle}`,
          `cl_crosshairsize ${state.cl_crosshairsize}`,
          `cl_crosshairthickness ${state.cl_crosshairthickness}`,
          `cl_crosshairgap ${state.cl_crosshairgap}`,
          `cl_crosshairdot ${state.cl_crosshairdot}`,
          `cl_crosshair_t ${state.cl_crosshair_t}`,
          `cl_crosshaircolor ${state.cl_crosshaircolor}`,
          `cl_crosshairalpha ${state.cl_crosshairalpha}`,
          `cl_crosshair_drawoutline ${state.cl_crosshair_drawoutline}`,
          `cl_crosshair_outlinethickness ${state.cl_crosshair_outlinethickness}`,
          "",
          "// === Viewmodel ===",
          `viewmodel_fov ${state.viewmodel_fov}`,
          `viewmodel_offset_x ${state.viewmodel_offset_x}`,
          `viewmodel_offset_y ${state.viewmodel_offset_y}`,
          `viewmodel_offset_z ${state.viewmodel_offset_z}`,
          `viewmodel_presetpos ${state.viewmodel_presetpos}`,
          "",
          "// === Чувствительность и FPS ===",
          `sensitivity ${state.sensitivity}`,
          `zoom_sensitivity_ratio_mouse ${state.zoom_sensitivity_ratio_mouse}`,
          `fps_max ${state.fps_max}`,
        ];
        output.textContent = lines.join("\n");
      };

      const redraw = () => { renderPreview(); renderOutput(); };

      const slider = (label, key, min, max, step) => {
        const v = el("span", { class: "pill" }, String(state[key]));
        const inp = el("input", { type: "range", min, max, step, value: state[key], style: { flex: 1 } });
        inp.oninput = () => {
          const n = +inp.value;
          state[key] = (step < 1 ? n : Math.round(n));
          v.textContent = state[key];
          redraw();
        };
        return el("div", { class: "mt-2" },
          el("label", {}, label),
          el("div", { class: "row" }, inp, v)
        );
      };

      const select = (label, key, options) => {
        const sel = el("select", {});
        options.forEach(([val, name]) => {
          const o = el("option", { value: val }, name);
          if (+val === +state[key] || val === state[key]) o.setAttribute("selected", "");
          sel.appendChild(o);
        });
        sel.onchange = () => { state[key] = +sel.value; redraw(); };
        return el("div", { class: "mt-2" }, el("label", {}, label), sel);
      };

      const copyBtn = el("button", { class: "btn", onclick: () => {
        navigator.clipboard?.writeText(output.textContent);
        toast("Конфиг скопирован. Вставь в консоль CS2 (~)");
      } }, "📋 Скопировать конфиг");

      const randomBtn = el("button", { class: "btn ghost", onclick: () => {
        state.cl_crosshaircolor = Math.floor(Math.random() * 5);
        state.cl_crosshairsize = +(0.5 + Math.random() * 3).toFixed(1);
        state.cl_crosshairgap = Math.floor(Math.random() * 6) - 3;
        state.cl_crosshairthickness = +(0.5 + Math.random() * 1.5).toFixed(1);
        state.cl_crosshairdot = Math.random() < 0.3 ? 1 : 0;
        state.cl_crosshair_t = Math.random() < 0.3 ? 1 : 0;
        // re-render controls by re-mounting — simpler: just redraw values and users can toggle
        root.innerHTML = ""; render();
      } }, "🎲 Рандом прицел");

      const resetBtn = el("button", { class: "btn ghost", onclick: () => {
        Object.assign(state, {
          cl_crosshairstyle: 4, cl_crosshairsize: 2.5, cl_crosshairthickness: 1.0, cl_crosshairgap: -2,
          cl_crosshairdot: 0, cl_crosshair_t: 0, cl_crosshaircolor: 1, cl_crosshairalpha: 255,
          cl_crosshair_drawoutline: 1, cl_crosshair_outlinethickness: 1,
          viewmodel_fov: 68, viewmodel_offset_x: 2.5, viewmodel_offset_y: 2.0, viewmodel_offset_z: -2.0, viewmodel_presetpos: 3,
          sensitivity: 1.5, zoom_sensitivity_ratio_mouse: 1.0, fps_max: 0,
        });
        root.innerHTML = ""; render();
      } }, "↺ Сброс");

      const render = () => {
        const leftCol = el("div", {},
          el("h4", {}, "🎯 Прицел"),
          select("Style (стиль)", "cl_crosshairstyle", [[2, "2 — Classic static"], [4, "4 — Classic static"], [5, "5 — Dynamic"]]),
          slider("Size (размер)", "cl_crosshairsize", 0.5, 6, 0.5),
          slider("Thickness (толщина)", "cl_crosshairthickness", 0.5, 3, 0.5),
          slider("Gap (зазор)", "cl_crosshairgap", -5, 10, 1),
          slider("Alpha (прозрачность)", "cl_crosshairalpha", 50, 255, 5),
          select("Color (цвет)", "cl_crosshaircolor", [[0, "Red"], [1, "Green"], [2, "Yellow"], [3, "Blue"], [4, "Cyan"]]),
          select("Dot (точка в центре)", "cl_crosshairdot", [[0, "Нет"], [1, "Да"]]),
          select("T-style (без верха)", "cl_crosshair_t", [[0, "Крест"], [1, "T"]]),
          select("Outline (контур)", "cl_crosshair_drawoutline", [[0, "Нет"], [1, "Да"]]),
          slider("Outline thickness", "cl_crosshair_outlinethickness", 0, 3, 1),
        );
        const rightCol = el("div", {},
          el("h4", {}, "👁️ Viewmodel"),
          slider("FOV (54-68)", "viewmodel_fov", 54, 68, 1),
          slider("Offset X", "viewmodel_offset_x", -2.5, 2.5, 0.1),
          slider("Offset Y", "viewmodel_offset_y", -2, 2, 0.1),
          slider("Offset Z", "viewmodel_offset_z", -2, 2, 0.1),
          select("Preset pos", "viewmodel_presetpos", [[1, "1 — Desktop"], [2, "2 — Couch"], [3, "3 — Classic"]]),
          el("h4", { style: { marginTop: "16px" } }, "🖱️ Чувствительность"),
          slider("Sensitivity", "sensitivity", 0.1, 5, 0.1),
          slider("Zoom sens ratio", "zoom_sensitivity_ratio_mouse", 0.5, 2, 0.05),
          slider("fps_max (0 = unlim)", "fps_max", 0, 500, 30),
        );

        root.appendChild(card(h3("CS2 конфиг-генератор"),
          el("p", { class: "muted" }, "Настрой прицел, viewmodel и чувствительность — кинь в буфер и вставь в консоль CS2 (нажми ~ в игре). Чисто пользовательские настройки, не читы."),
          el("div", { class: "row mt-2" }, copyBtn, randomBtn, resetBtn),
          el("div", { class: "mt-3", style: { display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: "16px" } },
            el("div", {}, el("div", { class: "muted", style: { fontSize: "13px", marginBottom: "6px" } }, "Превью:"), preview),
            leftCol, rightCol
          ),
          el("h4", { style: { marginTop: "16px" } }, "Конфиг для вставки"),
          output
        ));
        redraw();
      };
      render();
    },
  });

  /* ================================================
   *  4. DPI / eDPI / cm-per-360 sensitivity converter
   * ================================================
   */
  reg({
    id: "sens-converter", title: "Конвертер сенсы", icon: "🖱️", group: "Утилиты",
    desc: "CS2 ↔ Valorant/Apex/OW/Quake/Fortnite",
    render(root, { toast }) {
      // Yaw values: degrees of rotation per mouse count per unit sens.
      // Keeping cm/360 constant: sens_out = sens_in * yaw_in / yaw_out
      const GAMES = [
        { id: "cs2", name: "CS2 / CSGO / CS 1.6", yaw: 0.022 },
        { id: "source", name: "Source (HL2, TF2, L4D)", yaw: 0.022 },
        { id: "apex", name: "Apex Legends", yaw: 0.022 },
        { id: "quake", name: "Quake / Quake Live", yaw: 0.022 },
        { id: "r6", name: "Rainbow Six Siege (80° FOV)", yaw: 0.00572957795 * 0.5 * (2 / 0.02) }, // empirical ratio not trivial — use multiplier
        { id: "valorant", name: "Valorant", yaw: 0.07 },
        { id: "overwatch", name: "Overwatch 2", yaw: 0.0066 },
        { id: "fortnite", name: "Fortnite (mouse 100% / 100%)", yaw: 0.5715 }, // multiplier approx
        { id: "minecraft", name: "Minecraft (1.0 = 72°/count × raw)", yaw: 0.022 * 0.69 }, // MC roughly 0.69x CS
        { id: "roblox", name: "Roblox (default)", yaw: 0.5 },
      ];

      const state = { dpi: 800, from: "cs2", sens: 1.5 };

      // Compute cm/360 given DPI and sens for game with yaw
      // deg per count = DPI counts per inch? Actually: counts per inch; we want cm per 360deg
      // inches per 360 = 360 / (DPI * sens * yaw); cm per 360 = inches per 360 * 2.54
      const cm360 = (dpi, sens, yaw) => {
        if (!(dpi > 0) || !(sens > 0) || !(yaw > 0)) return NaN;
        return (360 / (dpi * sens * yaw)) * 2.54;
      };
      const sensForCm = (dpi, cm, yaw) => {
        if (!(dpi > 0) || !(cm > 0) || !(yaw > 0)) return NaN;
        return (360 * 2.54) / (cm * dpi * yaw);
      };

      const dpiInp = el("input", { type: "number", min: 100, max: 32000, value: state.dpi, step: 50 });
      const sensInp = el("input", { type: "number", min: 0.01, max: 20, value: state.sens, step: 0.01 });
      const fromSel = el("select", {});
      GAMES.forEach(g => fromSel.appendChild(el("option", { value: g.id }, g.name)));
      fromSel.value = state.from;

      const srcCm = el("div", { class: "pill" });
      const srcEdpi = el("div", { class: "pill" });
      const tbl = el("table", { style: { width: "100%", borderCollapse: "collapse", marginTop: "12px" } });

      const redraw = () => {
        state.dpi = +dpiInp.value || 0;
        state.sens = +sensInp.value || 0;
        state.from = fromSel.value;
        const src = GAMES.find(g => g.id === state.from);
        const baseCm = cm360(state.dpi, state.sens, src.yaw);
        srcCm.textContent = isFinite(baseCm) ? `cm/360: ${baseCm.toFixed(2)}` : "cm/360: —";
        srcEdpi.textContent = `eDPI: ${Math.round(state.dpi * state.sens)}`;
        tbl.innerHTML = "";
        const head = el("tr", {},
          el("th", { style: { textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--panel-2)" } }, "Игра"),
          el("th", { style: { textAlign: "right", padding: "6px 10px", borderBottom: "1px solid var(--panel-2)" } }, "Sens"),
          el("th", { style: { textAlign: "right", padding: "6px 10px", borderBottom: "1px solid var(--panel-2)" } }, "eDPI"),
          el("th", { style: { textAlign: "right", padding: "6px 10px", borderBottom: "1px solid var(--panel-2)" } }, "cm/360"),
        );
        tbl.appendChild(head);
        GAMES.forEach(g => {
          const newSens = sensForCm(state.dpi, baseCm, g.yaw);
          const newCm = cm360(state.dpi, newSens, g.yaw);
          const isSrc = g.id === state.from;
          const sensFmt = isFinite(newSens) ? newSens.toFixed(3) : "—";
          const row = el("tr", { style: { background: isSrc ? "var(--panel-2)" : "transparent" } },
            el("td", { style: { padding: "6px 10px" } }, (isSrc ? "▶ " : "") + g.name),
            el("td", { style: { padding: "6px 10px", textAlign: "right", fontFamily: "monospace" } }, sensFmt),
            el("td", { style: { padding: "6px 10px", textAlign: "right", fontFamily: "monospace" } }, isFinite(newSens) ? String(Math.round(state.dpi * newSens)) : "—"),
            el("td", { style: { padding: "6px 10px", textAlign: "right", fontFamily: "monospace" } }, isFinite(newCm) ? newCm.toFixed(2) : "—"),
          );
          tbl.appendChild(row);
        });
      };
      [dpiInp, sensInp, fromSel].forEach(i => i.oninput = redraw);
      fromSel.onchange = redraw;

      const presets = el("div", { class: "row mt-2" });
      [
        ["Spray CS (45 cm/360)", 45],
        ["Flick (30 cm/360)", 30],
        ["AWP (60 cm/360)", 60],
        ["Низкая (80 cm/360)", 80],
        ["Высокая (20 cm/360)", 20],
      ].forEach(([label, cm]) => {
        presets.appendChild(el("button", { class: "btn ghost", onclick: () => {
          const src = GAMES.find(g => g.id === state.from);
          const s = sensForCm(state.dpi, cm, src.yaw);
          if (isFinite(s)) { sensInp.value = s.toFixed(3); redraw(); toast(`Установлено ${cm} cm/360`); }
        } }, label));
      });

      root.appendChild(card(h3("Конвертер чувствительности мыши"),
        el("p", { class: "muted" }, "Переведёт твою сенсу из одной игры в остальные так, чтобы cm/360 остался одинаковым (поворот на 360° = одинаковое движение мыши в см). Работает через yaw-коэффициенты каждой игры."),
        el("div", { class: "grid cols-3 mt-3" },
          el("div", {}, el("label", {}, "Твой DPI"), dpiInp),
          el("div", {}, el("label", {}, "Игра-источник"), fromSel),
          el("div", {}, el("label", {}, "Sens в этой игре"), sensInp),
        ),
        el("div", { class: "row mt-3" }, srcCm, srcEdpi),
        el("div", { class: "mt-2 muted", style: { fontSize: "13px" } }, "Быстрые пресеты (устанавливают cm/360 для игры-источника):"),
        presets,
        tbl,
        el("p", { class: "muted mt-3", style: { fontSize: "12px" } }, "⚠️ Для Valorant, OW2, Fortnite, R6 точность перевода зависит от внутриигровых настроек (FOV, mouse acceleration, per-scope multipliers). Для CS2/CSGO/Apex/Quake конверсия точная.")
      ));
      redraw();
    },
  });

})();
