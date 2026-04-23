(() => {
  "use strict";

  const nav = document.getElementById("nav");
  const content = document.getElementById("content");
  const pageTitle = document.getElementById("page-title");
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menu-btn");
  const themeBtn = document.getElementById("theme-toggle");
  const navSearch = document.getElementById("nav-search");
  const randomBtn = document.getElementById("random-section");

  // Theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") document.documentElement.classList.add("light");
  themeBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    localStorage.setItem("theme", document.documentElement.classList.contains("light") ? "light" : "dark");
  });

  // Sidebar toggle (mobile)
  menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 820 && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && e.target !== menuBtn) sidebar.classList.remove("open");
    }
  });

  // Build navigation
  const SECTIONS = window.EVERYTHING_SECTIONS;
  const groups = {};
  for (const s of SECTIONS) {
    (groups[s.group] = groups[s.group] || []).push(s);
  }
  const groupOrder = ["Главная", "Утилиты", "Генераторы", "Игры", "Развлечения", "Звук", "Инфо"];
  groupOrder.forEach((gname) => {
    if (!groups[gname]) return;
    const title = document.createElement("div");
    title.className = "nav-group-title";
    title.textContent = gname;
    nav.appendChild(title);
    groups[gname].forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "nav-item";
      btn.dataset.id = s.id;
      btn.dataset.label = s.title.toLowerCase();
      btn.innerHTML = `<span>${s.icon}</span><span>${s.title}</span>`;
      btn.addEventListener("click", () => go(s.id));
      nav.appendChild(btn);
    });
  });

  function setActive(id) {
    nav.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  }

  function go(id, push = true) {
    const s = SECTIONS.find((x) => x.id === id) || SECTIONS[0];
    if (typeof content._cleanup === "function") {
      try { content._cleanup(); } catch {}
      content._cleanup = null;
    }
    content.innerHTML = "";
    pageTitle.textContent = s.title;
    setActive(s.id);
    try {
      s.render(content, { go, toast });
    } catch (err) {
      console.error(err);
      content.innerHTML = `<div class="card"><h3>Что-то пошло не так</h3><pre class="output">${String(err && err.stack || err)}</pre></div>`;
    }
    if (push) history.replaceState(null, "", "#" + s.id);
    if (window.innerWidth <= 820) sidebar.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Search
  navSearch.addEventListener("input", () => {
    const q = navSearch.value.trim().toLowerCase();
    nav.querySelectorAll(".nav-item").forEach((b) => {
      const match = !q || b.dataset.label.includes(q);
      b.classList.toggle("hidden", !match);
    });
  });

  randomBtn.addEventListener("click", () => {
    const pool = SECTIONS.filter((s) => s.id !== "home");
    const pick = pool[Math.floor(Math.random() * pool.length)];
    go(pick.id);
  });

  // Toast helper
  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  document.body.appendChild(toastEl);
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  // Initial route
  const hash = location.hash.replace("#", "");
  go(hash && SECTIONS.find((s) => s.id === hash) ? hash : "home", false);

  window.addEventListener("hashchange", () => {
    const h = location.hash.replace("#", "");
    if (h) go(h, false);
  });
})();
