/* +50 hacker/infosec sections: hashes, ciphers, encoders, network tools, refs, terminals */
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
  const h4 = (t) => el("h4", { style: { margin: "12px 0 6px" } }, t);
  const reg = (def) => SECTIONS.push(def);
  const GROUP = "Хакерское";
  const copy = (s, toast) => { navigator.clipboard?.writeText(s); toast && toast("В буфере"); };
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const bytesToHex = (b) => Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
  const hexToBytes = (h) => {
    h = h.replace(/\s+/g, "");
    if (h.length % 2) h = "0" + h;
    const out = new Uint8Array(h.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  };
  const b64ToBytes = (s) => { const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; };
  const bytesToB64 = (b) => btoa(String.fromCharCode(...b));
  const b64url = (s) => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64urlDec = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return atob(s); };

  /* ===== shared UI ===== */
  const ta = (placeholder, rows = 4) => el("textarea", { class: "input", placeholder, rows, style: { width: "100%", fontFamily: "monospace", fontSize: "13px" } });
  const inp = (placeholder, type = "text") => el("input", { class: "input", type, placeholder, style: { width: "100%", fontFamily: "monospace", fontSize: "13px" } });
  const btn = (text, onclick, variant = "") => el("button", { class: "btn " + variant, onclick }, text);
  const row = (...children) => el("div", { class: "row mt-2", style: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } }, ...children);

  /* ===================================================================
   *  HASHES & CRYPTO (10)
   * =================================================================== */

  /* 1. MD5 (pure JS — tiny impl, RFC 1321) */
  const md5 = (str) => {
    const rotl = (x, n) => (x << n) | (x >>> (32 - n));
    const add = (a, b) => (a + b) | 0;
    const F = (x, y, z) => (x & y) | (~x & z);
    const G = (x, y, z) => (x & z) | (y & ~z);
    const H = (x, y, z) => x ^ y ^ z;
    const I = (x, y, z) => y ^ (x | ~z);
    const T = [];
    for (let i = 0; i < 64; i++) T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0;
    const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
               5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
               4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
               6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    const bytes = enc.encode(str);
    const bits = bytes.length * 8;
    const withPad = new Uint8Array(((bytes.length + 8) >> 6 << 6) + 64);
    withPad.set(bytes);
    withPad[bytes.length] = 0x80;
    const dv = new DataView(withPad.buffer);
    dv.setUint32(withPad.length - 8, bits >>> 0, true);
    dv.setUint32(withPad.length - 4, Math.floor(bits / 0x100000000), true);
    let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
    for (let off = 0; off < withPad.length; off += 64) {
      const M = new Uint32Array(16);
      for (let j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);
      let [A, B, C, D] = [a, b, c, d];
      for (let i = 0; i < 64; i++) {
        let f, g;
        if (i < 16) { f = F(B, C, D); g = i; }
        else if (i < 32) { f = G(B, C, D); g = (5 * i + 1) % 16; }
        else if (i < 48) { f = H(B, C, D); g = (3 * i + 5) % 16; }
        else { f = I(B, C, D); g = (7 * i) % 16; }
        const tmp = D;
        D = C; C = B;
        B = add(B, rotl(add(add(A, f), add(M[g], T[i])), S[i]));
        A = tmp;
      }
      a = add(a, A); b = add(b, B); c = add(c, C); d = add(d, D);
    }
    const out = new Uint8Array(16);
    new DataView(out.buffer).setUint32(0, a, true);
    new DataView(out.buffer).setUint32(4, b, true);
    new DataView(out.buffer).setUint32(8, c, true);
    new DataView(out.buffer).setUint32(12, d, true);
    return bytesToHex(out);
  };

  reg({
    id: "md5", title: "MD5 хеш", icon: "🔓", group: GROUP, desc: "Быстрый, НЕ для паролей",
    render(root, { toast }) {
      const input = ta("введи текст...", 3); input.value = "hello";
      const out = el("div", { style: { fontFamily: "monospace", wordBreak: "break-all", fontSize: "15px", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px" } });
      const upd = () => { out.textContent = md5(input.value); };
      input.oninput = upd;
      root.appendChild(card(h3("MD5 хеш"),
        el("p", { class: "muted" }, "Быстрый 128-битный хеш. ⚠️ Сломан криптографически с 2004 года (коллизии за секунды). Оставлен для совместимости: Ethereum keccak, ETag, checksums, legacy-systems."),
        input, el("div", { class: "mt-2" }), out,
        row(btn("📋 Копировать", () => copy(out.textContent, toast))),
      ));
      upd();
    },
  });

  /* 2. SHA-1 (via WebCrypto) */
  reg({
    id: "sha1", title: "SHA-1 хеш", icon: "🔏", group: GROUP, desc: "Git, TLS legacy",
    render(root, { toast }) {
      const input = ta("текст...", 3); input.value = "The quick brown fox";
      const out = el("div", { style: { fontFamily: "monospace", wordBreak: "break-all", fontSize: "14px", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px" } });
      const upd = async () => { const b = await crypto.subtle.digest("SHA-1", enc.encode(input.value)); out.textContent = bytesToHex(new Uint8Array(b)); };
      input.oninput = upd;
      root.appendChild(card(h3("SHA-1 хеш"),
        el("p", { class: "muted" }, "160 бит. Сломан SHAttered-коллизией в 2017, но всё ещё в git, uuid v5, HOTP/TOTP. НЕ для паролей/подписей."),
        input, el("div", { class: "mt-2" }), out,
        row(btn("📋 Копировать", () => copy(out.textContent, toast))),
      ));
      upd();
    },
  });

  /* 3. SHA-512 */
  reg({
    id: "sha512", title: "SHA-512 хеш", icon: "🔒", group: GROUP, desc: "64-байтовый хеш",
    render(root, { toast }) {
      const input = ta("текст...", 3); input.value = "secret";
      const out = el("div", { style: { fontFamily: "monospace", wordBreak: "break-all", fontSize: "12px", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px" } });
      const upd = async () => { const b = await crypto.subtle.digest("SHA-512", enc.encode(input.value)); out.textContent = bytesToHex(new Uint8Array(b)); };
      input.oninput = upd;
      root.appendChild(card(h3("SHA-512 хеш"),
        el("p", { class: "muted" }, "512 бит, семейство SHA-2. Считается безопасным. Используется в Linux shadow-хешах ($6$), bitcoin-адресах (через RIPEMD160(SHA256)), TLS."),
        input, el("div", { class: "mt-2" }), out,
        row(btn("📋 Копировать", () => copy(out.textContent, toast))),
      ));
      upd();
    },
  });

  /* 4. HMAC-SHA256 */
  reg({
    id: "hmac-sha256", title: "HMAC-SHA256", icon: "🔐", group: GROUP, desc: "Keyed hash для API-подписей",
    render(root, { toast }) {
      const key = inp("ключ"); key.value = "my-secret-key";
      const msg = ta("сообщение", 3); msg.value = "POST /api/transfer {amount:100}";
      const out = el("div", { style: { fontFamily: "monospace", wordBreak: "break-all", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px" } });
      const upd = async () => {
        const k = await crypto.subtle.importKey("raw", enc.encode(key.value), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg.value));
        out.textContent = bytesToHex(new Uint8Array(sig));
      };
      key.oninput = upd; msg.oninput = upd;
      root.appendChild(card(h3("HMAC-SHA256"),
        el("p", { class: "muted" }, "Keyed-hash MAC: подтверждает что сообщение не меняли и его отправил владелец секрета. Основа AWS-подписей, Stripe webhooks, Slack signing secret."),
        el("label", {}, "Ключ"), key,
        el("label", { class: "mt-2" }, "Сообщение"), msg,
        el("div", { class: "mt-2" }, "HMAC (hex):"), out,
        row(btn("📋 Копировать", () => copy(out.textContent, toast))),
      ));
      upd();
    },
  });

  /* 5. CRC32 */
  const CRC32_TABLE = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[i] = c; } return t; })();
  const crc32 = (str) => { let c = 0xffffffff; const b = enc.encode(str); for (let i = 0; i < b.length; i++) c = CRC32_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  reg({
    id: "crc32", title: "CRC32", icon: "🧮", group: GROUP, desc: "Checksum для zip/png/ethernet",
    render(root, { toast }) {
      const input = ta("текст...", 3); input.value = "123456789";
      const outHex = el("div", { style: { fontFamily: "monospace", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px" } });
      const outDec = el("div", { style: { fontFamily: "monospace", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px", marginTop: "6px" } });
      const upd = () => { const v = crc32(input.value); outHex.textContent = "0x" + v.toString(16).padStart(8, "0"); outDec.textContent = String(v); };
      input.oninput = upd;
      root.appendChild(card(h3("CRC32"),
        el("p", { class: "muted" }, "Не криптографическая проверка целостности. Используется в zip, gzip, png, Ethernet. Легко подделать — НЕ для безопасности."),
        input, el("div", { class: "mt-2" }, "Hex:"), outHex, el("div", {}, "Dec:"), outDec,
        row(btn("📋 hex", () => copy(outHex.textContent, toast))),
      ));
      upd();
    },
  });

  /* 6. AES-GCM encrypt/decrypt */
  reg({
    id: "aes-gcm", title: "AES-GCM", icon: "🗝️", group: GROUP, desc: "Шифрование с паролем (PBKDF2)",
    render(root, { toast }) {
      const mode = el("select", { class: "input" },
        el("option", { value: "enc" }, "🔐 Зашифровать"),
        el("option", { value: "dec" }, "🔓 Расшифровать"));
      const pw = inp("пароль", "text"); pw.value = "correct horse battery staple";
      const input = ta("текст или base64...", 4); input.value = "Super secret plaintext";
      const out = ta("", 4); out.readOnly = true;
      const run = async () => {
        try {
          const keyMat = await crypto.subtle.importKey("raw", enc.encode(pw.value), "PBKDF2", false, ["deriveKey"]);
          if (mode.value === "enc") {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMat, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
            const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(input.value));
            const all = new Uint8Array(16 + 12 + ct.byteLength);
            all.set(salt, 0); all.set(iv, 16); all.set(new Uint8Array(ct), 28);
            out.value = bytesToB64(all);
          } else {
            const all = b64ToBytes(input.value.trim());
            const salt = all.slice(0, 16), iv = all.slice(16, 28), ct = all.slice(28);
            const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMat, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
            const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
            out.value = dec.decode(pt);
          }
        } catch (e) { out.value = "❌ " + e.message; }
      };
      root.appendChild(card(h3("AES-256-GCM"),
        el("p", { class: "muted" }, "AES-GCM (authenticated encryption) + PBKDF2-SHA256 со 100k итераций. Формат: base64(salt16 || iv12 || ciphertext+tag)."),
        row(mode), el("label", { class: "mt-2" }, "Пароль"), pw,
        el("label", { class: "mt-2" }, "Вход"), input,
        row(btn("▶ Выполнить", run, "primary"), btn("📋 Копировать результат", () => copy(out.value, toast))),
        el("label", { class: "mt-2" }, "Результат"), out,
      ));
    },
  });

  /* 7. RSA keypair generator */
  reg({
    id: "rsa-keygen", title: "RSA keygen", icon: "🔑", group: GROUP, desc: "2048-bit RSA-PSS в PEM",
    render(root, { toast }) {
      const bits = el("select", { class: "input" },
        el("option", { value: "2048" }, "2048 бит"),
        el("option", { value: "3072" }, "3072 бит"),
        el("option", { value: "4096" }, "4096 бит"));
      const pub = ta("", 8); pub.readOnly = true;
      const priv = ta("", 10); priv.readOnly = true;
      const pem = (label, b64) => "-----BEGIN " + label + "-----\n" + b64.match(/.{1,64}/g).join("\n") + "\n-----END " + label + "-----";
      const gen = async () => {
        pub.value = "генерация..."; priv.value = "генерация...";
        const kp = await crypto.subtle.generateKey({ name: "RSA-PSS", modulusLength: +bits.value, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
        const pubSpki = await crypto.subtle.exportKey("spki", kp.publicKey);
        const privPkcs8 = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
        pub.value = pem("PUBLIC KEY", bytesToB64(new Uint8Array(pubSpki)));
        priv.value = pem("PRIVATE KEY", bytesToB64(new Uint8Array(privPkcs8)));
      };
      root.appendChild(card(h3("Генератор RSA ключей"),
        el("p", { class: "muted" }, "Генерирует RSA-PSS пару в браузере через WebCrypto, экспортирует в PEM. Приватный ключ НЕ уходит с устройства. Используй для подписей, TLS-тестов, SSH (нужна доп. конвертация)."),
        row(bits, btn("🎲 Сгенерировать", gen, "primary")),
        el("label", { class: "mt-2" }, "Публичный"), pub, row(btn("📋", () => copy(pub.value, toast))),
        el("label", { class: "mt-2" }, "Приватный"), priv, row(btn("📋", () => copy(priv.value, toast))),
      ));
    },
  });

  /* 8. TOTP generator */
  const b32Dec = (s) => {
    s = s.replace(/=+$/g, "").toUpperCase().replace(/\s/g, "");
    const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "", out = [];
    for (const c of s) { const i = A.indexOf(c); if (i < 0) throw new Error("Invalid base32"); bits += i.toString(2).padStart(5, "0"); }
    for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.substr(i, 8), 2));
    return new Uint8Array(out);
  };
  reg({
    id: "totp", title: "TOTP генератор", icon: "🔢", group: GROUP, desc: "2FA коды из base32 секрета",
    render(root, { toast }) {
      const secret = inp("JBSWY3DPEHPK3PXP"); secret.value = "JBSWY3DPEHPK3PXP";
      const code = el("div", { style: { fontSize: "42px", fontFamily: "monospace", letterSpacing: "8px", textAlign: "center", padding: "20px", background: "rgba(127,127,127,0.1)", borderRadius: "8px" } });
      const timer = el("div", { class: "muted", style: { textAlign: "center" } });
      const hotp = async (keyBytes, counter) => {
        const buf = new ArrayBuffer(8);
        const dv = new DataView(buf);
        dv.setUint32(4, counter >>> 0);
        dv.setUint32(0, Math.floor(counter / 0x100000000));
        const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
        const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
        const off = sig[19] & 0xf;
        const bin = ((sig[off] & 0x7f) << 24) | (sig[off + 1] << 16) | (sig[off + 2] << 8) | sig[off + 3];
        return (bin % 1e6).toString().padStart(6, "0");
      };
      const upd = async () => {
        try {
          const key = b32Dec(secret.value);
          const t = Math.floor(Date.now() / 30000);
          code.textContent = await hotp(key, t);
          const left = 30 - Math.floor(Date.now() / 1000) % 30;
          timer.textContent = `Обновится через ${left} сек`;
        } catch (e) { code.textContent = "ERR"; timer.textContent = e.message; }
      };
      secret.oninput = upd;
      setInterval(upd, 1000);
      root.appendChild(card(h3("TOTP (Time-based One-Time Password)"),
        el("p", { class: "muted" }, "RFC 6238. Совместим с Google Authenticator, Authy, 1Password. Base32 секрет → 6-значный код обновляется каждые 30 секунд."),
        el("label", {}, "Base32 секрет"), secret,
        code, timer,
        row(btn("📋 Код", () => copy(code.textContent, toast))),
      ));
      upd();
    },
  });

  /* 9. Random bytes */
  reg({
    id: "random-bytes", title: "Random bytes", icon: "🎰", group: GROUP, desc: "CSPRNG: hex/base64/bin",
    render(root, { toast }) {
      const count = inp("16", "number"); count.value = "32";
      const fmt = el("select", { class: "input" },
        el("option", { value: "hex" }, "hex"),
        el("option", { value: "b64" }, "base64"),
        el("option", { value: "b64u" }, "base64url"),
        el("option", { value: "bin" }, "binary (01)"),
        el("option", { value: "pass" }, "password (a-zA-Z0-9)"),
        el("option", { value: "uuid" }, "uuidv4"));
      const out = ta("", 4); out.readOnly = true;
      const gen = () => {
        const n = Math.max(1, Math.min(4096, +count.value || 16));
        const b = crypto.getRandomValues(new Uint8Array(n));
        if (fmt.value === "hex") out.value = bytesToHex(b);
        else if (fmt.value === "b64") out.value = bytesToB64(b);
        else if (fmt.value === "b64u") out.value = b64url(bytesToB64(b));
        else if (fmt.value === "bin") out.value = Array.from(b, x => x.toString(2).padStart(8, "0")).join("");
        else if (fmt.value === "pass") {
          const A = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          out.value = Array.from(b, x => A[x % A.length]).join("");
        } else if (fmt.value === "uuid") {
          b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
          const h = bytesToHex(b.slice(0, 16));
          out.value = `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
        }
      };
      root.appendChild(card(h3("Random bytes / секрет"),
        el("p", { class: "muted" }, "Cryptographically secure random через `crypto.getRandomValues()`. Для API-ключей, JWT secrets, session tokens."),
        row(el("label", {}, "Байт"), count, el("label", {}, "Формат"), fmt, btn("🎲", gen, "primary")),
        el("label", { class: "mt-2" }, "Результат"), out,
        row(btn("📋 Копировать", () => copy(out.value, toast))),
      ));
      gen();
    },
  });

  /* 10. JWT decoder */
  reg({
    id: "jwt-decoder", title: "JWT декодер", icon: "🎫", group: GROUP, desc: "Header.Payload.Signature",
    render(root, { toast }) {
      const input = ta("paste JWT...", 4);
      input.value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const hdr = el("pre", { style: { background: "rgba(127,127,127,0.1)", padding: "10px", borderRadius: "6px", fontSize: "12px", overflow: "auto" } });
      const payload = el("pre", { style: { background: "rgba(127,127,127,0.1)", padding: "10px", borderRadius: "6px", fontSize: "12px", overflow: "auto" } });
      const sig = el("div", { style: { fontFamily: "monospace", fontSize: "12px", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px", wordBreak: "break-all" } });
      const meta = el("div", { class: "muted mt-2", style: { fontSize: "12px" } });
      const upd = () => {
        try {
          const [h, p, s] = input.value.trim().split(".");
          hdr.textContent = JSON.stringify(JSON.parse(b64urlDec(h)), null, 2);
          const pl = JSON.parse(b64urlDec(p));
          payload.textContent = JSON.stringify(pl, null, 2);
          sig.textContent = s || "(нет подписи)";
          const info = [];
          if (pl.iat) info.push("iat (выдан): " + new Date(pl.iat * 1000).toISOString());
          if (pl.exp) info.push("exp (истекает): " + new Date(pl.exp * 1000).toISOString() + (pl.exp * 1000 < Date.now() ? " ⚠️ ИСТЁК" : ""));
          if (pl.nbf) info.push("nbf (валиден с): " + new Date(pl.nbf * 1000).toISOString());
          meta.textContent = info.join(" · ");
        } catch (e) { hdr.textContent = "❌ " + e.message; payload.textContent = ""; sig.textContent = ""; meta.textContent = ""; }
      };
      input.oninput = upd;
      root.appendChild(card(h3("JWT декодер"),
        el("p", { class: "muted" }, "Разбирает JSON Web Token. ⚠️ Не проверяет подпись (нужен секрет сервера). Использует для дебага API-ответов."),
        input,
        h4("🏷️ Header"), hdr,
        h4("📦 Payload"), payload,
        h4("🔏 Signature"), sig, meta,
      ));
      upd();
    },
  });

  /* ===================================================================
   *  CLASSIC CIPHERS (5)
   * =================================================================== */

  /* 11. Caesar / ROT-N with brute force */
  reg({
    id: "caesar", title: "Caesar / ROT-N", icon: "🏛️", group: GROUP, desc: "Сдвиг алфавита + brute force",
    render(root, { toast }) {
      const input = ta("текст...", 3); input.value = "Gur dhvpx oebja sbk whzcf bire gur ynml qbt";
      const shift = inp("13", "number"); shift.value = "13"; shift.min = "0"; shift.max = "25";
      const caesar = (s, n) => s.replace(/[a-z]/gi, c => String.fromCharCode((c.charCodeAt(0) - (c < "a" ? 65 : 97) + n + 26) % 26 + (c < "a" ? 65 : 97)));
      const outOne = ta("", 3); outOne.readOnly = true;
      const outAll = el("pre", { style: { background: "rgba(127,127,127,0.1)", padding: "10px", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", maxHeight: "400px", overflow: "auto" } });
      const upd = () => {
        outOne.value = caesar(input.value, +shift.value || 0);
        outAll.textContent = Array.from({ length: 26 }, (_, i) => `ROT${String(i).padStart(2)}: ${caesar(input.value, i)}`).join("\n");
      };
      input.oninput = upd; shift.oninput = upd;
      root.appendChild(card(h3("Caesar / ROT-N"),
        el("p", { class: "muted" }, "Сдвиг каждой буквы на N позиций. ROT13 — самый известный (совпадает с обратной операцией). Brute force: 26 вариантов за раз."),
        input, row(el("label", {}, "Сдвиг"), shift),
        el("label", { class: "mt-2" }, "Результат при текущем сдвиге:"), outOne,
        h4("🔨 Brute force (все 26 сдвигов)"), outAll,
      ));
      upd();
    },
  });

  /* 12. Atbash */
  reg({
    id: "atbash", title: "Atbash", icon: "🔄", group: GROUP, desc: "Древний еврейский шифр",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "Hello, World!";
      const out = ta("", 3); out.readOnly = true;
      const atbash = (s) => s.replace(/[a-z]/gi, c => String.fromCharCode((c < "a" ? 155 : 219) - c.charCodeAt(0)))
                             .replace(/[а-яё]/gi, c => { const lo = c === c.toLowerCase(); const a = lo ? 1072 : 1040; const i = c.charCodeAt(0) === (lo ? 1105 : 1025) ? 6 : c.charCodeAt(0) - a - (c.charCodeAt(0) > (lo ? 1105 : 1025) ? 1 : 0); return String.fromCharCode(a + 31 - i); });
      const upd = () => { out.value = atbash(input.value); };
      input.oninput = upd;
      root.appendChild(card(h3("Atbash"),
        el("p", { class: "muted" }, "A↔Z, B↔Y, C↔X. Использовался в Танахе (שֵׁשַׁךְ = бабель). Симметричный: зашифруй дважды — получишь исходник."),
        input, el("label", { class: "mt-2" }, "Результат"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      upd();
    },
  });

  /* 13. Vigenère */
  reg({
    id: "vigenere", title: "Vigenère", icon: "🗝️", group: GROUP, desc: "Полиалфавитный шифр XVI века",
    render(root, { toast }) {
      const mode = el("select", { class: "input" },
        el("option", { value: "e" }, "Зашифровать"),
        el("option", { value: "d" }, "Расшифровать"));
      const key = inp("KEY"); key.value = "SECRET";
      const input = ta("", 3); input.value = "Attack at dawn";
      const out = ta("", 3); out.readOnly = true;
      const vig = (s, k, d) => {
        if (!k) return s;
        k = k.toUpperCase().replace(/[^A-Z]/g, "");
        if (!k) return s;
        let j = 0;
        return s.replace(/[a-z]/gi, c => {
          const up = c < "a";
          const ci = c.charCodeAt(0) - (up ? 65 : 97);
          const ki = k.charCodeAt(j % k.length) - 65;
          j++;
          const r = ((ci + (d ? -ki : ki)) % 26 + 26) % 26;
          return String.fromCharCode(r + (up ? 65 : 97));
        });
      };
      const upd = () => { out.value = vig(input.value, key.value, mode.value === "d"); };
      [input, key, mode].forEach(x => x.oninput = upd);
      mode.onchange = upd;
      root.appendChild(card(h3("Vigenère"),
        el("p", { class: "muted" }, "Каждая буква сдвигается по ключу. Не ломался 300 лет (\"le chiffre indéchiffrable\") пока Kasiski/Friedman не нашли атаку на повторяющийся ключ."),
        row(mode), el("label", {}, "Ключ (A-Z)"), key,
        el("label", { class: "mt-2" }, "Вход"), input,
        el("label", { class: "mt-2" }, "Результат"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      upd();
    },
  });

  /* 14. XOR cipher */
  reg({
    id: "xor-cipher", title: "XOR cipher", icon: "⊕", group: GROUP, desc: "Потоковый XOR с hex-ключом",
    render(root, { toast }) {
      const key = inp("hex key (2+ байта)"); key.value = "deadbeef";
      const inMode = el("select", { class: "input" },
        el("option", { value: "t2h" }, "текст → hex"),
        el("option", { value: "h2t" }, "hex → текст"));
      const input = ta("", 3); input.value = "hello";
      const out = ta("", 3); out.readOnly = true;
      const upd = () => {
        try {
          const k = hexToBytes(key.value);
          if (!k.length) return;
          let data;
          if (inMode.value === "t2h") data = enc.encode(input.value);
          else data = hexToBytes(input.value);
          const r = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) r[i] = data[i] ^ k[i % k.length];
          out.value = inMode.value === "t2h" ? bytesToHex(r) : dec.decode(r);
        } catch (e) { out.value = "❌ " + e.message; }
      };
      [key, input, inMode].forEach(x => { x.oninput = upd; x.onchange = upd; });
      root.appendChild(card(h3("XOR cipher"),
        el("p", { class: "muted" }, "Побайтовый XOR с повторяющимся ключом. Если ключ длиннее сообщения и случаен — это one-time pad (ненарушимо). Иначе легко ломается частотным анализом."),
        el("label", {}, "Ключ (hex)"), key, row(inMode),
        el("label", { class: "mt-2" }, "Вход"), input,
        el("label", { class: "mt-2" }, "Результат"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      upd();
    },
  });

  /* 15. ROT47 */
  reg({
    id: "rot47", title: "ROT47", icon: "🔁", group: GROUP, desc: "ROT13 для всего ASCII",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "Hello, World! 123";
      const out = ta("", 3); out.readOnly = true;
      const rot47 = (s) => s.split("").map(c => { const n = c.charCodeAt(0); return n >= 33 && n <= 126 ? String.fromCharCode(33 + (n + 14) % 94) : c; }).join("");
      const upd = () => { out.value = rot47(input.value); };
      input.oninput = upd;
      root.appendChild(card(h3("ROT47"),
        el("p", { class: "muted" }, "ROT13 расширенный на все печатаемые ASCII (33-126). Шифрует знаки препинания, цифры, скобки. Симметричный."),
        input, el("label", { class: "mt-2" }, "Результат"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      upd();
    },
  });

  /* ===================================================================
   *  ENCODERS (8)
   * =================================================================== */

  /* 16. Hex ↔ text */
  reg({
    id: "hex-text", title: "Hex ↔ текст", icon: "#️⃣", group: GROUP, desc: "UTF-8 байты в hex",
    render(root, { toast }) {
      const input = ta("", 4); input.value = "Hello 🧪";
      const hex = ta("", 4); hex.value = "";
      const txt2hex = () => { hex.value = bytesToHex(enc.encode(input.value)); };
      const hex2txt = () => { try { input.value = dec.decode(hexToBytes(hex.value)); } catch (e) { input.value = "❌ " + e.message; } };
      input.oninput = txt2hex;
      hex.oninput = hex2txt;
      root.appendChild(card(h3("Hex ↔ текст"),
        el("p", { class: "muted" }, "UTF-8 байты в hex. Двунаправленно: пиши слева — получишь hex справа, и наоборот."),
        el("label", {}, "Текст"), input, row(btn("📋", () => copy(input.value, toast))),
        el("label", { class: "mt-2" }, "Hex"), hex, row(btn("📋", () => copy(hex.value, toast))),
      ));
      txt2hex();
    },
  });

  /* 17. Bin ↔ text */
  reg({
    id: "bin-text", title: "Бинарный ↔ текст", icon: "💾", group: GROUP, desc: "01010100 01011000",
    render(root, { toast }) {
      const input = ta("", 4); input.value = "Hi!";
      const bin = ta("", 4);
      const t2b = () => { bin.value = Array.from(enc.encode(input.value), x => x.toString(2).padStart(8, "0")).join(" "); };
      const b2t = () => { try { const bytes = bin.value.split(/\s+/).filter(Boolean).map(s => parseInt(s, 2)); input.value = dec.decode(new Uint8Array(bytes)); } catch (e) { input.value = "❌"; } };
      input.oninput = t2b; bin.oninput = b2t;
      root.appendChild(card(h3("Бинарный ↔ текст"),
        el("p", { class: "muted" }, "8-битные группы через пробел. UTF-8."),
        el("label", {}, "Текст"), input, el("label", { class: "mt-2" }, "Binary"), bin,
        row(btn("📋 bin", () => copy(bin.value, toast))),
      ));
      t2b();
    },
  });

  /* 18. Base32 */
  const B32_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const b32Enc = (b) => { let bits = "", out = ""; for (const x of b) bits += x.toString(2).padStart(8, "0"); for (let i = 0; i < bits.length; i += 5) { const c = bits.substr(i, 5); out += B32_ALPHA[parseInt(c.padEnd(5, "0"), 2)]; } while (out.length % 8) out += "="; return out; };
  reg({
    id: "base32", title: "Base32", icon: "3️⃣", group: GROUP, desc: "RFC 4648, для TOTP-секретов",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "Hello!";
      const out = ta("", 3);
      const t2 = () => { out.value = b32Enc(enc.encode(input.value)); };
      const b2 = () => { try { input.value = dec.decode(b32Dec(out.value)); } catch (e) { input.value = "❌"; } };
      input.oninput = t2; out.oninput = b2;
      root.appendChild(card(h3("Base32"),
        el("p", { class: "muted" }, "RFC 4648 алфавит (A-Z, 2-7). Case-insensitive, нет путаницы 0/O/1/l. Используется в TOTP-секретах, onion-адресах Tor v3."),
        el("label", {}, "Текст"), input, el("label", { class: "mt-2" }, "Base32"), out,
      ));
      t2();
    },
  });

  /* 19. Base58 (Bitcoin) */
  const B58_ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const b58Enc = (b) => {
    if (!b.length) return "";
    let num = 0n; for (const x of b) num = num * 256n + BigInt(x);
    let s = ""; while (num > 0n) { s = B58_ALPHA[Number(num % 58n)] + s; num /= 58n; }
    for (const x of b) { if (x === 0) s = "1" + s; else break; }
    return s;
  };
  const b58Dec = (s) => {
    let num = 0n;
    for (const c of s) { const i = B58_ALPHA.indexOf(c); if (i < 0) throw new Error("Invalid base58"); num = num * 58n + BigInt(i); }
    const out = [];
    while (num > 0n) { out.unshift(Number(num & 0xffn)); num >>= 8n; }
    for (const c of s) { if (c === "1") out.unshift(0); else break; }
    return new Uint8Array(out);
  };
  reg({
    id: "base58", title: "Base58", icon: "₿", group: GROUP, desc: "Алфавит Bitcoin-адресов",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "Hello";
      const out = ta("", 3);
      input.oninput = () => { out.value = b58Enc(enc.encode(input.value)); };
      out.oninput = () => { try { input.value = dec.decode(b58Dec(out.value.trim())); } catch (e) { input.value = "❌"; } };
      root.appendChild(card(h3("Base58"),
        el("p", { class: "muted" }, "Алфавит без 0, O, I, l (визуально путаются). Satoshi использовал для Bitcoin-адресов. Нет padding-символа =."),
        el("label", {}, "Текст"), input, el("label", { class: "mt-2" }, "Base58"), out,
      ));
      input.oninput();
    },
  });

  /* 20. Ascii85 */
  const a85Enc = (b) => {
    let out = "";
    for (let i = 0; i < b.length; i += 4) {
      let chunk = b.slice(i, i + 4);
      let pad = 0;
      if (chunk.length < 4) { const n = new Uint8Array(4); n.set(chunk); pad = 4 - chunk.length; chunk = n; }
      let n = ((chunk[0] << 24) | (chunk[1] << 16) | (chunk[2] << 8) | chunk[3]) >>> 0;
      if (n === 0 && pad === 0) { out += "z"; continue; }
      const s = []; for (let j = 0; j < 5; j++) { s.unshift(String.fromCharCode(33 + n % 85)); n = Math.floor(n / 85); }
      out += s.join("").slice(0, 5 - pad);
    }
    return out;
  };
  reg({
    id: "ascii85", title: "Ascii85", icon: "🅰️", group: GROUP, desc: "Плотнее base64, в PDF и PostScript",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "Man is distinguished";
      const out = ta("", 3); out.readOnly = true;
      input.oninput = () => { out.value = a85Enc(enc.encode(input.value)); };
      root.appendChild(card(h3("Ascii85 / Base85"),
        el("p", { class: "muted" }, "Кодирует 4 байта в 5 печатаемых ASCII (против 3→4 у base64). Используется в PDF, PostScript, Git binary patches. 'z' — 4 нулевых байта."),
        input, el("label", { class: "mt-2" }, "Ascii85"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      input.oninput();
    },
  });

  /* 21. HTML entities */
  reg({
    id: "html-entities", title: "HTML entities", icon: "🌐", group: GROUP, desc: "&amp; &lt; &#xNN;",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "<script>alert('XSS')</script>";
      const out = ta("", 3);
      input.oninput = () => { out.value = input.value.replace(/[&<>"'\/]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "/": "&#x2F;" })[c]); };
      out.oninput = () => { const d = el("div"); d.innerHTML = out.value; input.value = d.textContent; };
      root.appendChild(card(h3("HTML entities"),
        el("p", { class: "muted" }, "Экранирует спецсимволы для вставки в HTML без XSS. OWASP-рекомендация: всегда экранируй перед вставкой в `innerHTML`."),
        el("label", {}, "Raw"), input, el("label", { class: "mt-2" }, "Escaped"), out,
      ));
      input.oninput();
    },
  });

  /* 22. Unicode escape */
  reg({
    id: "unicode-escape", title: "Unicode escape", icon: "♾️", group: GROUP, desc: "\\uXXXX / \\u{XXXXX}",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "Привет 🧪";
      const out = ta("", 3);
      input.oninput = () => { out.value = Array.from(input.value).map(c => { const cp = c.codePointAt(0); return cp > 127 ? (cp > 0xffff ? "\\u{" + cp.toString(16) + "}" : "\\u" + cp.toString(16).padStart(4, "0")) : c; }).join(""); };
      out.oninput = () => { try { input.value = out.value.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, a, b) => String.fromCodePoint(parseInt(a || b, 16))); } catch (e) {} };
      root.appendChild(card(h3("Unicode escape"),
        el("p", { class: "muted" }, "Экранирование non-ASCII символов для кода: `\\u0041` = A. Surrogate-пары для эмодзи: `\\u{1F9EA}`."),
        el("label", {}, "Raw"), input, el("label", { class: "mt-2" }, "Escaped"), out,
      ));
      input.oninput();
    },
  });

  /* 23. Punycode (IDN) */
  const punyEncode = (s) => {
    const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128;
    const adapt = (delta, nP, firstTime) => {
      delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
      delta += Math.floor(delta / nP);
      let k = 0;
      while (delta > (((base - tMin) * tMax) >> 1)) { delta = Math.floor(delta / (base - tMin)); k += base; }
      return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
    };
    const digit = (d) => d + (d < 26 ? 97 : 22);
    const chars = Array.from(s);
    let n = initialN, delta = 0, bias = initialBias;
    const basic = chars.filter(c => c.codePointAt(0) < 128);
    let output = basic.join("");
    let h = basic.length;
    const basicLen = h;
    if (basicLen > 0) output += "-";
    while (h < chars.length) {
      let m = Infinity;
      for (const c of chars) { const cp = c.codePointAt(0); if (cp >= n && cp < m) m = cp; }
      delta += (m - n) * (h + 1);
      n = m;
      for (const c of chars) {
        const cp = c.codePointAt(0);
        if (cp < n) delta++;
        else if (cp === n) {
          let q = delta;
          for (let k = base; ; k += base) {
            const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
            if (q < t) break;
            output += String.fromCharCode(digit(t + (q - t) % (base - t)));
            q = Math.floor((q - t) / (base - t));
          }
          output += String.fromCharCode(digit(q));
          bias = adapt(delta, h + 1, h === basicLen);
          delta = 0; h++;
        }
      }
      delta++; n++;
    }
    return "xn--" + output;
  };
  reg({
    id: "punycode", title: "Punycode (IDN)", icon: "🌍", group: GROUP, desc: "мой-домен.рф → xn--",
    render(root, { toast }) {
      const input = inp("домен.рф"); input.value = "привет.мир";
      const out = inp(""); out.readOnly = true;
      input.oninput = () => { out.value = input.value.split(".").map(p => /^[\x00-\x7f]*$/.test(p) ? p : punyEncode(p)).join("."); };
      root.appendChild(card(h3("Punycode (IDN)"),
        el("p", { class: "muted" }, "RFC 3492. Кодирует не-ASCII domain labels в ASCII. ⚠️ Homograph-атака: `раypal.com` (ра — кириллица) выглядит как paypal.com, но Punycode-форма `xn--...` это показывает."),
        el("label", {}, "Домен (Unicode)"), input,
        el("label", { class: "mt-2" }, "Punycode (ASCII)"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      input.oninput();
    },
  });

  /* ===================================================================
   *  NETWORK TOOLS (7)
   * =================================================================== */

  /* 24. CIDR / subnet calculator */
  reg({
    id: "cidr-calc", title: "CIDR калькулятор", icon: "🌐", group: GROUP, desc: "IPv4 подсети",
    render(root, { toast }) {
      const input = inp("10.0.0.0/24"); input.value = "192.168.1.0/24";
      const out = el("div", { class: "mt-2" });
      const upd = () => {
        out.innerHTML = "";
        try {
          const [ip, mask] = input.value.trim().split("/");
          const m = +mask;
          if (!ip || isNaN(m) || m < 0 || m > 32) throw new Error("Формат: IP/mask, mask 0-32");
          const parts = ip.split(".").map(x => +x);
          if (parts.length !== 4 || parts.some(x => isNaN(x) || x < 0 || x > 255)) throw new Error("Неверный IPv4");
          const ipInt = (parts[0] << 24 | parts[1] << 16 | parts[2] << 8 | parts[3]) >>> 0;
          const maskInt = m === 0 ? 0 : (0xffffffff << (32 - m)) >>> 0;
          const network = ipInt & maskInt;
          const broadcast = (network | (~maskInt >>> 0)) >>> 0;
          const toIp = (n) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
          const hosts = m >= 31 ? (m === 32 ? 1 : 2) : (2 ** (32 - m) - 2);
          const rows = [
            ["Network", toIp(network)],
            ["Broadcast", toIp(broadcast)],
            ["Netmask", toIp(maskInt)],
            ["Wildcard", toIp((~maskInt) >>> 0)],
            ["Первый хост", m >= 31 ? toIp(network) : toIp(network + 1)],
            ["Последний хост", m >= 31 ? toIp(broadcast) : toIp(broadcast - 1)],
            ["Адресов всего", String(2 ** (32 - m))],
            ["Хостов", String(hosts)],
            ["Класс", parts[0] < 128 ? "A" : parts[0] < 192 ? "B" : parts[0] < 224 ? "C" : parts[0] < 240 ? "D (multicast)" : "E (reserved)"],
            ["Приватный?", (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)) ? "✅ да (RFC 1918)" : "❌ нет"],
          ];
          const t = el("table", { class: "props" });
          rows.forEach(([k, v]) => t.appendChild(el("tr", {}, el("td", {}, k), el("td", { style: { fontFamily: "monospace" } }, v))));
          out.appendChild(t);
        } catch (e) { out.textContent = "❌ " + e.message; }
      };
      input.oninput = upd;
      root.appendChild(card(h3("CIDR / Subnet калькулятор"),
        el("p", { class: "muted" }, "Разбирает IPv4 подсеть: network, broadcast, netmask, диапазон хостов, класс, приватная ли."),
        input, out,
      ));
      upd();
    },
  });

  /* 25. Ports DB */
  const PORTS = [
    [20, "ftp-data", "TCP", "File Transfer Protocol (data)"],
    [21, "ftp", "TCP", "File Transfer Protocol (control)"],
    [22, "ssh", "TCP", "Secure Shell"],
    [23, "telnet", "TCP", "Telnet (plaintext, небезопасно)"],
    [25, "smtp", "TCP", "Simple Mail Transfer Protocol"],
    [53, "dns", "TCP/UDP", "Domain Name System"],
    [67, "dhcp-server", "UDP", "DHCP сервер"],
    [68, "dhcp-client", "UDP", "DHCP клиент"],
    [69, "tftp", "UDP", "Trivial FTP"],
    [80, "http", "TCP", "HyperText Transfer Protocol"],
    [110, "pop3", "TCP", "Post Office Protocol v3"],
    [119, "nntp", "TCP", "Usenet news"],
    [123, "ntp", "UDP", "Network Time Protocol"],
    [135, "msrpc", "TCP", "Microsoft RPC"],
    [137, "netbios-ns", "UDP", "NetBIOS name service"],
    [139, "netbios-ssn", "TCP", "NetBIOS session"],
    [143, "imap", "TCP", "IMAP"],
    [161, "snmp", "UDP", "SNMP"],
    [194, "irc", "TCP", "IRC"],
    [389, "ldap", "TCP", "LDAP"],
    [443, "https", "TCP", "HTTP over TLS"],
    [445, "smb", "TCP", "SMB / CIFS"],
    [465, "smtps", "TCP", "SMTP over TLS (deprecated)"],
    [500, "isakmp", "UDP", "IPsec key exchange"],
    [514, "syslog", "UDP", "Syslog"],
    [515, "lpd", "TCP", "Line Printer Daemon"],
    [520, "rip", "UDP", "RIP routing"],
    [587, "submission", "TCP", "SMTP mail submission"],
    [636, "ldaps", "TCP", "LDAP over TLS"],
    [873, "rsync", "TCP", "rsync"],
    [989, "ftps-data", "TCP", "FTPS data"],
    [990, "ftps", "TCP", "FTPS control"],
    [993, "imaps", "TCP", "IMAP over TLS"],
    [995, "pop3s", "TCP", "POP3 over TLS"],
    [1080, "socks", "TCP", "SOCKS proxy"],
    [1194, "openvpn", "UDP", "OpenVPN"],
    [1433, "mssql", "TCP", "Microsoft SQL Server"],
    [1521, "oracle", "TCP", "Oracle DB"],
    [1723, "pptp", "TCP", "PPTP VPN"],
    [1883, "mqtt", "TCP", "MQTT"],
    [2049, "nfs", "TCP", "Network File System"],
    [2082, "cpanel", "TCP", "cPanel"],
    [2222, "ssh-alt", "TCP", "SSH (нестандартный)"],
    [2375, "docker", "TCP", "Docker daemon (unsafe)"],
    [2376, "docker-tls", "TCP", "Docker daemon (TLS)"],
    [3306, "mysql", "TCP", "MySQL / MariaDB"],
    [3389, "rdp", "TCP", "Remote Desktop Protocol"],
    [4444, "metasploit", "TCP", "Metasploit default listener"],
    [5000, "upnp", "TCP", "UPnP / Flask dev"],
    [5060, "sip", "UDP/TCP", "SIP VoIP"],
    [5432, "postgres", "TCP", "PostgreSQL"],
    [5555, "adb", "TCP", "Android Debug Bridge"],
    [5672, "amqp", "TCP", "RabbitMQ / AMQP"],
    [5900, "vnc", "TCP", "VNC"],
    [5984, "couchdb", "TCP", "CouchDB"],
    [6379, "redis", "TCP", "Redis"],
    [6667, "irc", "TCP", "IRC"],
    [7777, "game", "TCP", "Unreal Tournament и др. игры"],
    [8000, "http-alt", "TCP", "Django dev, HTTP alt"],
    [8080, "http-proxy", "TCP", "HTTP proxy, Tomcat"],
    [8443, "https-alt", "TCP", "HTTPS alt"],
    [8888, "http-alt2", "TCP", "Jupyter, HTTP alt"],
    [9000, "php-fpm", "TCP", "PHP-FPM, Portainer"],
    [9042, "cassandra", "TCP", "Cassandra CQL"],
    [9092, "kafka", "TCP", "Apache Kafka"],
    [9200, "elasticsearch", "TCP", "Elasticsearch HTTP"],
    [11211, "memcached", "TCP/UDP", "Memcached"],
    [25565, "minecraft", "TCP", "Minecraft Java Edition"],
    [27017, "mongodb", "TCP", "MongoDB"],
    [27015, "srcds", "UDP", "Source/CS/GMod server"],
    [32400, "plex", "TCP", "Plex Media Server"],
    [50000, "sap", "TCP", "SAP GUI"],
  ];
  reg({
    id: "ports-db", title: "Порты → сервисы", icon: "🔌", group: GROUP, desc: "Справочник TCP/UDP",
    render(root, { toast }) {
      const search = inp("поиск (ssh, 443, mongo...)");
      const out = el("div", { style: { maxHeight: "500px", overflow: "auto" } });
      const upd = () => {
        const q = search.value.toLowerCase().trim();
        const rows = PORTS.filter(([p, n, , d]) => !q || String(p).includes(q) || n.toLowerCase().includes(q) || d.toLowerCase().includes(q));
        out.innerHTML = "";
        const t = el("table", { class: "props", style: { width: "100%" } });
        t.appendChild(el("tr", {}, el("th", {}, "Порт"), el("th", {}, "Сервис"), el("th", {}, "Proto"), el("th", {}, "Описание")));
        rows.forEach(([p, n, pr, d]) => t.appendChild(el("tr", {},
          el("td", { style: { fontFamily: "monospace", fontWeight: "bold" } }, String(p)),
          el("td", { style: { fontFamily: "monospace" } }, n),
          el("td", {}, pr),
          el("td", {}, d),
        )));
        out.appendChild(t);
      };
      search.oninput = upd;
      root.appendChild(card(h3("Порты и сервисы"),
        el("p", { class: "muted" }, PORTS.length + " well-known портов TCP/UDP. Поиск по номеру, имени, описанию."),
        search, out,
      ));
      upd();
    },
  });

  /* 26. HTTP status codes */
  const HTTP_CODES = [
    [100, "Continue", "Клиент может продолжить отправку тела запроса"],
    [101, "Switching Protocols", "Переход на WebSocket или другой протокол"],
    [103, "Early Hints", "Предварительные хедеры для preload"],
    [200, "OK", "Успех"],
    [201, "Created", "Ресурс создан (обычно после POST/PUT)"],
    [202, "Accepted", "Запрос принят, но ещё не обработан (async)"],
    [204, "No Content", "Успех, но тела нет"],
    [206, "Partial Content", "Range-запрос, вернулась часть"],
    [301, "Moved Permanently", "Ресурс переехал навсегда"],
    [302, "Found", "Временный редирект"],
    [303, "See Other", "Смотри по другому URL (обычно GET)"],
    [304, "Not Modified", "Использовать кешированную версию"],
    [307, "Temporary Redirect", "Временный редирект с сохранением метода"],
    [308, "Permanent Redirect", "Постоянный с сохранением метода"],
    [400, "Bad Request", "Клиент прислал некорректный запрос"],
    [401, "Unauthorized", "Требуется аутентификация"],
    [402, "Payment Required", "Зарезервировано, иногда Stripe/Cloudflare"],
    [403, "Forbidden", "Авторизован, но запрещено"],
    [404, "Not Found", "Ресурс не найден"],
    [405, "Method Not Allowed", "Метод не поддерживается для ресурса"],
    [406, "Not Acceptable", "Не можем отдать в запрошенном формате"],
    [408, "Request Timeout", "Клиент слишком долго молчал"],
    [409, "Conflict", "Конфликт состояния (optimistic locking)"],
    [410, "Gone", "Ресурс был, теперь его нет (навсегда)"],
    [411, "Length Required", "Нужен Content-Length"],
    [413, "Payload Too Large", "Тело запроса слишком большое"],
    [414, "URI Too Long", "URL слишком длинный"],
    [415, "Unsupported Media Type", "Content-Type не поддерживается"],
    [418, "I'm a teapot", "RFC 2324 шутка, иногда возвращают боты"],
    [422, "Unprocessable Entity", "Валидация не прошла"],
    [425, "Too Early", "Replay risk, подожди"],
    [429, "Too Many Requests", "Rate limit"],
    [431, "Request Header Fields Too Large", "Хедеры слишком большие"],
    [451, "Unavailable For Legal Reasons", "Цензура / DMCA"],
    [500, "Internal Server Error", "Ошибка на сервере"],
    [501, "Not Implemented", "Метод не реализован"],
    [502, "Bad Gateway", "Upstream ответил плохо"],
    [503, "Service Unavailable", "Перегрузка / maintenance"],
    [504, "Gateway Timeout", "Upstream не ответил вовремя"],
    [505, "HTTP Version Not Supported", ""],
    [507, "Insufficient Storage", "WebDAV: нет места"],
    [508, "Loop Detected", "WebDAV"],
    [511, "Network Authentication Required", "Captive portal"],
    [520, "Cloudflare: Unknown", "Upstream вернул неизвестную ошибку"],
    [521, "Cloudflare: Web Server Down", "Origin упал"],
    [522, "Cloudflare: Timeout", "Origin не отвечает"],
    [523, "Cloudflare: Origin Unreachable", "Нет маршрута"],
    [524, "Cloudflare: Timeout", "Origin ответил, но слишком медленно"],
    [525, "Cloudflare: SSL Handshake Failed", ""],
    [526, "Cloudflare: Invalid SSL Certificate", ""],
  ];
  reg({
    id: "http-codes", title: "HTTP коды", icon: "🚦", group: GROUP, desc: "Справочник 1xx-5xx",
    render(root, { toast }) {
      const search = inp("поиск (404, not found, cloudflare...)");
      const out = el("div", { style: { maxHeight: "500px", overflow: "auto" } });
      const upd = () => {
        const q = search.value.toLowerCase().trim();
        const rows = HTTP_CODES.filter(([c, n, d]) => !q || String(c).includes(q) || n.toLowerCase().includes(q) || d.toLowerCase().includes(q));
        out.innerHTML = "";
        const t = el("table", { class: "props", style: { width: "100%" } });
        t.appendChild(el("tr", {}, el("th", {}, "Код"), el("th", {}, "Имя"), el("th", {}, "Описание")));
        rows.forEach(([c, n, d]) => {
          const color = c < 200 ? "#8888ff" : c < 300 ? "#4caf50" : c < 400 ? "#ff9800" : c < 500 ? "#f44336" : "#b71c1c";
          t.appendChild(el("tr", {},
            el("td", { style: { fontFamily: "monospace", fontWeight: "bold", color } }, String(c)),
            el("td", {}, n),
            el("td", { class: "muted" }, d),
          ));
        });
        out.appendChild(t);
      };
      search.oninput = upd;
      root.appendChild(card(h3("HTTP status коды"),
        el("p", { class: "muted" }, HTTP_CODES.length + " кодов, включая стандарт + расширения (Cloudflare)."),
        search, out,
      ));
      upd();
    },
  });

  /* 27. UA parser */
  reg({
    id: "ua-parser", title: "UA парсер", icon: "🕵️", group: GROUP, desc: "Разбор User-Agent",
    render(root, { toast }) {
      const input = ta("", 2); input.value = navigator.userAgent;
      const out = el("div", { class: "mt-2" });
      const upd = () => {
        out.innerHTML = "";
        const ua = input.value;
        const detect = [
          ["Chrome", /Chrome\/(\d+)/, 1, !/Edg|OPR/i.test(ua)],
          ["Firefox", /Firefox\/(\d+)/, 1, true],
          ["Safari", /Version\/(\d+).*Safari/, 1, !/Chrome|Chromium/i.test(ua)],
          ["Edge", /Edg\/(\d+)/, 1, true],
          ["Opera", /OPR\/(\d+)/, 1, true],
          ["Tor", /Mozilla\/5\.0.*Gecko.*Firefox\/[\d.]+$/, null, /Tor/i.test(ua)],
        ];
        let browser = "Unknown", version = "";
        for (const [n, r, g, ok] of detect) {
          if (ok && r.test(ua)) { const m = ua.match(r); browser = n; version = g ? m[g] : ""; break; }
        }
        let os = "Unknown";
        if (/Windows NT 10/.test(ua)) os = "Windows 10/11";
        else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1";
        else if (/Windows NT/.test(ua)) os = "Windows (old)";
        else if (/Mac OS X ([\d_]+)/.test(ua)) os = "macOS " + ua.match(/Mac OS X ([\d_]+)/)[1].replace(/_/g, ".");
        else if (/Android (\d+)/.test(ua)) os = "Android " + ua.match(/Android (\d+)/)[1];
        else if (/iPhone OS ([\d_]+)/.test(ua)) os = "iOS " + ua.match(/iPhone OS ([\d_]+)/)[1].replace(/_/g, ".");
        else if (/Linux/.test(ua)) os = "Linux";
        const mobile = /Mobile|Android|iPhone|iPad/.test(ua);
        const bot = /bot|spider|crawl|scrape|headless|curl|wget|python-requests/i.test(ua);
        const t = el("table", { class: "props" });
        [["Браузер", `${browser} ${version}`], ["ОС", os], ["Устройство", mobile ? "📱 mobile" : "🖥️ desktop"], ["Бот?", bot ? "🤖 похож на бота" : "🧑 похож на человека"], ["Длина строки", ua.length + " символов"]]
          .forEach(([k, v]) => t.appendChild(el("tr", {}, el("td", {}, k), el("td", {}, v))));
        out.appendChild(t);
      };
      input.oninput = upd;
      root.appendChild(card(h3("User-Agent парсер"),
        el("p", { class: "muted" }, "Определяет браузер, ОС, тип устройства, похоже ли на бота."),
        el("label", {}, "User-Agent"), input, out,
      ));
      upd();
    },
  });

  /* 28. UA library */
  const UA_LIB = [
    ["Chrome 120 / Win 11", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"],
    ["Chrome 120 / macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"],
    ["Firefox 121 / Win", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"],
    ["Firefox 121 / Linux", "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0"],
    ["Safari 17 / macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"],
    ["Safari / iPhone iOS 17", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"],
    ["Chrome / Android 14", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"],
    ["Edge / Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"],
    ["Tor Browser 13", "Mozilla/5.0 (Windows NT 10.0; rv:115.0) Gecko/20100101 Firefox/115.0"],
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
    ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
    ["curl 8.5", "curl/8.5.0"],
    ["wget", "Wget/1.21.3"],
    ["Python requests", "python-requests/2.31.0"],
    ["PlayStation 5", "Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15"],
    ["Smart TV (Tizen)", "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36"],
  ];
  reg({
    id: "ua-library", title: "UA библиотека", icon: "📚", group: GROUP, desc: "Готовые User-Agent строки",
    render(root, { toast }) {
      const out = el("div");
      UA_LIB.forEach(([name, ua]) => {
        out.appendChild(el("div", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(127,127,127,0.2)" } },
          el("div", { style: { minWidth: "180px", fontWeight: "bold" } }, name),
          el("code", { style: { flex: 1, fontSize: "11px", wordBreak: "break-all" } }, ua),
          btn("📋", () => copy(ua, toast), "ghost"),
        ));
      });
      root.appendChild(card(h3("User-Agent library"),
        el("p", { class: "muted" }, UA_LIB.length + " популярных UA-строк для тестов. Копируй и вставляй в `Network` → `Override UA` или curl -A."),
        out,
      ));
    },
  });

  /* 29. HTTP header inspector */
  reg({
    id: "http-inspector", title: "HTTP headers", icon: "📡", group: GROUP, desc: "Fetch → headers/status",
    render(root, { toast }) {
      const input = inp("https://example.com"); input.value = "https://api.github.com";
      const out = el("pre", { style: { background: "rgba(127,127,127,0.1)", padding: "10px", borderRadius: "6px", fontSize: "12px", maxHeight: "400px", overflow: "auto" } });
      const go = async () => {
        out.textContent = "загрузка...";
        try {
          const r = await fetch(input.value, { method: "HEAD", mode: "cors" }).catch(() => fetch(input.value, { mode: "cors" }));
          const lines = [`HTTP ${r.status} ${r.statusText}`, `URL: ${r.url}`, ""];
          r.headers.forEach((v, k) => lines.push(`${k}: ${v}`));
          out.textContent = lines.join("\n");
        } catch (e) { out.textContent = "❌ " + e.message + "\n\n(CORS блокирует многие сайты — пробуй *.github.com, httpbin.org, api.ipify.org)"; }
      };
      root.appendChild(card(h3("HTTP header inspector"),
        el("p", { class: "muted" }, "Делает HEAD-запрос и показывает все response headers. ⚠️ Большинство сайтов блокируют CORS из браузера — работает только на CORS-friendly API."),
        row(input, btn("▶ GO", go, "primary")),
        el("div", { class: "mt-2" }), out,
      ));
    },
  });

  /* 30. DNS over HTTPS */
  reg({
    id: "doh", title: "DNS over HTTPS", icon: "🔍", group: GROUP, desc: "DNS query через 1.1.1.1",
    render(root, { toast }) {
      const input = inp("example.com"); input.value = "github.com";
      const type = el("select", { class: "input" }, ...["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA"].map(x => el("option", {}, x)));
      const out = el("pre", { style: { background: "rgba(127,127,127,0.1)", padding: "10px", borderRadius: "6px", fontSize: "12px", maxHeight: "400px", overflow: "auto" } });
      const go = async () => {
        out.textContent = "запрос...";
        try {
          const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(input.value)}&type=${type.value}`, { headers: { Accept: "application/dns-json" } });
          const j = await r.json();
          out.textContent = JSON.stringify(j, null, 2);
        } catch (e) { out.textContent = "❌ " + e.message; }
      };
      root.appendChild(card(h3("DNS over HTTPS"),
        el("p", { class: "muted" }, "Запрашивает DNS через Cloudflare 1.1.1.1 JSON API. Покажет A/AAAA/MX/TXT записи."),
        row(input, type, btn("▶ Query", go, "primary")),
        el("div", { class: "mt-2" }), out,
      ));
    },
  });

  /* ===================================================================
   *  PARSERS & GENERATORS (7)
   * =================================================================== */

  /* 31. URL parser */
  reg({
    id: "url-parser", title: "URL парсер", icon: "🔗", group: GROUP, desc: "Protocol/host/path/query",
    render(root, { toast }) {
      const input = inp("https://..."); input.value = "https://user:pass@www.example.com:8080/path/to/page?foo=bar&baz=qux#section-2";
      const out = el("div", { class: "mt-2" });
      const upd = () => {
        out.innerHTML = "";
        try {
          const u = new URL(input.value);
          const t = el("table", { class: "props" });
          const rows = [["protocol", u.protocol], ["username", u.username || "—"], ["password", u.password ? "***" : "—"], ["host", u.host], ["hostname", u.hostname], ["port", u.port || "(default)"], ["pathname", u.pathname], ["search", u.search || "—"], ["hash", u.hash || "—"], ["origin", u.origin]];
          rows.forEach(([k, v]) => t.appendChild(el("tr", {}, el("td", {}, k), el("td", { style: { fontFamily: "monospace" } }, v))));
          out.appendChild(t);
          if (u.searchParams.size) {
            out.appendChild(h4("🔍 Query params"));
            const t2 = el("table", { class: "props" });
            u.searchParams.forEach((v, k) => t2.appendChild(el("tr", {}, el("td", {}, k), el("td", { style: { fontFamily: "monospace" } }, v))));
            out.appendChild(t2);
          }
        } catch (e) { out.textContent = "❌ " + e.message; }
      };
      input.oninput = upd;
      root.appendChild(card(h3("URL парсер"),
        el("p", { class: "muted" }, "Разбирает URL через `new URL()`: все компоненты + query-параметры."),
        input, out,
      ));
      upd();
    },
  });

  /* 32. Query ↔ JSON */
  reg({
    id: "query-json", title: "Query ↔ JSON", icon: "🔀", group: GROUP, desc: "?a=1&b=2 ↔ {a:1,b:2}",
    render(root, { toast }) {
      const q = ta("?a=1&b=hello&tags=x&tags=y", 3);
      q.value = "?user=alice&age=30&admin=true&tags=red&tags=green";
      const j = ta("", 8);
      const q2j = () => {
        try {
          const p = new URLSearchParams(q.value.startsWith("?") ? q.value.slice(1) : q.value);
          const o = {};
          for (const [k, v] of p) { if (k in o) o[k] = [].concat(o[k], v); else o[k] = v; }
          j.value = JSON.stringify(o, null, 2);
        } catch (e) { j.value = "❌ " + e.message; }
      };
      const j2q = () => {
        try {
          const o = JSON.parse(j.value);
          const p = new URLSearchParams();
          for (const [k, v] of Object.entries(o)) {
            if (Array.isArray(v)) v.forEach(x => p.append(k, String(x)));
            else p.append(k, String(v));
          }
          q.value = "?" + p.toString();
        } catch (e) { q.value = "❌ " + e.message; }
      };
      q.oninput = q2j; j.oninput = j2q;
      root.appendChild(card(h3("Query ↔ JSON"),
        el("p", { class: "muted" }, "Конвертация query-string в JSON. Повторяющиеся ключи становятся массивом."),
        el("label", {}, "Query string"), q, el("label", { class: "mt-2" }, "JSON"), j,
      ));
      q2j();
    },
  });

  /* 33. chmod calculator */
  reg({
    id: "chmod-calc", title: "chmod калькулятор", icon: "📁", group: GROUP, desc: "755 ↔ rwxr-xr-x",
    render(root, { toast }) {
      const build = () => {
        const wrap = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "10px" } });
        const chks = { u: {}, g: {}, o: {} };
        ["u", "g", "o"].forEach(who => {
          const col = el("div", { class: "card", style: { padding: "8px" } });
          col.appendChild(el("div", { style: { fontWeight: "bold" } }, who === "u" ? "Владелец (u)" : who === "g" ? "Группа (g)" : "Все (o)"));
          ["r", "w", "x"].forEach(bit => {
            const id = `chmod-${who}-${bit}`;
            const inp = el("input", { type: "checkbox", id });
            chks[who][bit] = inp;
            col.appendChild(el("label", { for: id, style: { display: "block" } }, inp, " " + bit + " — " + (bit === "r" ? "read (4)" : bit === "w" ? "write (2)" : "execute (1)")));
            inp.onchange = upd;
          });
          wrap.appendChild(col);
        });
        return { wrap, chks };
      };
      const { wrap, chks } = build();
      const inOct = inp("755", "text"); inOct.value = "755";
      const outOct = el("div", { style: { fontSize: "32px", fontFamily: "monospace", fontWeight: "bold", textAlign: "center", padding: "10px" } });
      const outSym = el("div", { style: { fontSize: "22px", fontFamily: "monospace", textAlign: "center" } });
      const outCmd = el("div", { style: { fontFamily: "monospace", padding: "8px", background: "rgba(127,127,127,0.1)", borderRadius: "6px", marginTop: "8px" } });
      const upd = () => {
        const oct = ["u", "g", "o"].map(w => (chks[w].r.checked ? 4 : 0) + (chks[w].w.checked ? 2 : 0) + (chks[w].x.checked ? 1 : 0)).join("");
        const sym = ["u", "g", "o"].map(w => (chks[w].r.checked ? "r" : "-") + (chks[w].w.checked ? "w" : "-") + (chks[w].x.checked ? "x" : "-")).join("");
        outOct.textContent = oct;
        outSym.textContent = "-" + sym;
        outCmd.textContent = "chmod " + oct + " file";
        inOct.value = oct;
      };
      inOct.oninput = () => {
        const m = inOct.value.match(/^[0-7]{3}$/);
        if (!m) return;
        ["u", "g", "o"].forEach((w, i) => {
          const n = +inOct.value[i];
          chks[w].r.checked = !!(n & 4); chks[w].w.checked = !!(n & 2); chks[w].x.checked = !!(n & 1);
        });
        upd();
      };
      root.appendChild(card(h3("chmod калькулятор"),
        el("p", { class: "muted" }, "Переводит Unix-права между octal (755) и symbolic (rwxr-xr-x). Клик по чекбоксу = toggle бита."),
        wrap, outOct, outSym,
        el("label", { class: "mt-2" }, "Ввести octal"), inOct,
        outCmd, row(btn("📋 cmd", () => copy(outCmd.textContent, toast))),
      ));
      // default 755
      chks.u.r.checked = chks.u.w.checked = chks.u.x.checked = true;
      chks.g.r.checked = chks.g.x.checked = true;
      chks.o.r.checked = chks.o.x.checked = true;
      upd();
    },
  });

  /* 34. QR code generator (simple: use canvas + api fallback free) — tiny QR encoder */
  // Using the qrcode-generator algorithm is heavy; use a small approach: delegate to google chart? No, that needs net.
  // Implementing a minimal QR encoder is ~500 lines. Use a placeholder link-based SVG via canvas from a public libless approach:
  // Use URL to image via api.qrserver.com
  reg({
    id: "qr-gen", title: "QR генератор", icon: "▣", group: GROUP, desc: "URL/текст → QR (через CORS API)",
    render(root, { toast }) {
      const input = ta("", 3); input.value = "https://doris1372.github.io/everything-site/";
      const size = inp("300", "number"); size.value = "300";
      const img = el("img", { style: { maxWidth: "100%", background: "#fff", padding: "10px", borderRadius: "6px", display: "block" } });
      const upd = () => { img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${+size.value || 300}x${+size.value || 300}&data=${encodeURIComponent(input.value)}`; };
      input.oninput = upd; size.oninput = upd;
      root.appendChild(card(h3("QR генератор"),
        el("p", { class: "muted" }, "Генерирует QR-код через api.qrserver.com (CORS-friendly). Для офлайн нужен JS-енкодер — см. `qrcode-generator` npm."),
        input, row(el("label", {}, "Размер"), size),
        el("div", { class: "mt-2" }), img,
      ));
      upd();
    },
  });

  /* 35. UUID v7 */
  reg({
    id: "uuid-v7", title: "UUID v7", icon: "🆔", group: GROUP, desc: "Time-sortable UUID (RFC 9562)",
    render(root, { toast }) {
      const out = ta("", 10); out.readOnly = true;
      const gen = () => {
        const lines = [];
        for (let i = 0; i < 10; i++) {
          const ms = Date.now();
          const msHex = ms.toString(16).padStart(12, "0");
          const rand = crypto.getRandomValues(new Uint8Array(10));
          rand[0] = (rand[0] & 0x0f) | 0x70;
          rand[2] = (rand[2] & 0x3f) | 0x80;
          const r = bytesToHex(rand);
          lines.push(`${msHex.slice(0, 8)}-${msHex.slice(8, 12)}-${r.slice(0, 4)}-${r.slice(4, 8)}-${r.slice(8, 20)}`);
        }
        out.value = lines.join("\n");
      };
      root.appendChild(card(h3("UUID v7 (time-sortable)"),
        el("p", { class: "muted" }, "RFC 9562. 48-bit Unix ms + 74-bit random. Сортируется по времени (в отличие от v4), нативно работает как primary key в БД без фрагментации индекса."),
        row(btn("🎲 Сгенерировать 10 штук", gen, "primary")),
        el("div", { class: "mt-2" }), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      gen();
    },
  });

  /* 36. MAC address generator + OUI lookup */
  const OUI = {
    "00:0C:29": "VMware",
    "00:50:56": "VMware",
    "08:00:27": "VirtualBox",
    "52:54:00": "QEMU/KVM",
    "B8:27:EB": "Raspberry Pi Foundation",
    "DC:A6:32": "Raspberry Pi Trading",
    "E4:5F:01": "Raspberry Pi Trading",
    "00:1A:11": "Google",
    "F4:F5:D8": "Google",
    "F4:F5:E8": "Google",
    "A4:83:E7": "Apple",
    "00:03:93": "Apple",
    "28:CF:E9": "Apple",
    "00:1E:C2": "Apple",
    "DC:A6:32": "Raspberry Pi",
    "00:15:5D": "Microsoft (Hyper-V)",
    "00:23:24": "Microsoft",
    "E4:54:E8": "Samsung",
    "00:12:47": "Samsung",
    "00:07:AB": "Samsung",
    "00:1B:63": "Apple",
    "00:16:CB": "Apple",
    "F0:18:98": "Apple",
    "00:D0:2D": "Intel",
    "00:15:17": "Intel",
    "00:1A:A0": "Dell",
    "F8:B1:56": "Dell",
    "00:50:C2": "IEEE Registration Authority",
  };
  reg({
    id: "mac-gen", title: "MAC генератор", icon: "📶", group: GROUP, desc: "Случайный MAC + OUI lookup",
    render(root, { toast }) {
      const vendor = el("select", { class: "input" },
        el("option", { value: "" }, "Случайный (locally administered)"),
        ...Object.entries(OUI).map(([k, v]) => el("option", { value: k }, `${k} — ${v}`)));
      const out = el("div", { style: { fontFamily: "monospace", fontSize: "20px", padding: "10px", background: "rgba(127,127,127,0.1)", borderRadius: "6px", textAlign: "center" } });
      const info = el("div", { class: "muted mt-2" });
      const gen = () => {
        const b = crypto.getRandomValues(new Uint8Array(6));
        if (vendor.value) { const p = vendor.value.split(":").map(x => parseInt(x, 16)); b[0] = p[0]; b[1] = p[1]; b[2] = p[2]; }
        else { b[0] = (b[0] & 0xfe) | 0x02; /* locally administered + unicast */ }
        const mac = Array.from(b, x => x.toString(16).padStart(2, "0").toUpperCase()).join(":");
        out.textContent = mac;
        const prefix = mac.slice(0, 8);
        const oui = OUI[prefix] || "неизвестный OUI";
        info.textContent = `OUI: ${prefix} → ${oui} · ${(b[0] & 2) ? "locally-administered" : "globally-unique"} · ${(b[0] & 1) ? "multicast" : "unicast"}`;
      };
      root.appendChild(card(h3("MAC-адрес генератор"),
        el("p", { class: "muted" }, "Генерирует MAC с выбранным OUI (первые 3 байта = производитель). Второй бит первого байта — locally-administered (можно безопасно присвоить виртуалке)."),
        row(el("label", {}, "OUI"), vendor, btn("🎲", gen, "primary")),
        el("div", { class: "mt-2" }), out, info,
        row(btn("📋", () => copy(out.textContent, toast))),
      ));
      gen();
    },
  });

  /* 37. Slug generator */
  reg({
    id: "slug-gen", title: "Slug / kebab", icon: "🌱", group: GROUP, desc: "Строка → url-slug",
    render(root, { toast }) {
      const input = ta("", 2); input.value = "Привет, мир! Это — тест 2.0 😀";
      const out = ta("", 3); out.readOnly = true;
      const TR = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
      const upd = () => {
        let s = input.value.toLowerCase();
        s = s.split("").map(c => TR[c] ?? c).join("");
        s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
        s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        out.value = s;
      };
      input.oninput = upd;
      root.appendChild(card(h3("Slug / kebab-case"),
        el("p", { class: "muted" }, "Транслит кириллицы, нормализация unicode, только [a-z0-9-]. Для URL, имён файлов, CSS-классов."),
        input, el("label", { class: "mt-2" }, "Slug"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      upd();
    },
  });

  /* ===================================================================
   *  SECURITY EDUCATIONAL (5)
   * =================================================================== */

  /* 38. Password entropy / strength */
  const TOP_PASSWORDS = ["123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "dragon", "123123", "baseball", "abc123", "football", "monkey", "letmein", "696969", "shadow", "master", "666666", "qwertyuiop", "123321", "mustang", "1234567890", "michael", "654321", "pussy", "superman", "1qaz2wsx", "7777777", "121212", "000000", "qazwsx", "123qwe", "killer", "trustno1", "jordan", "jennifer", "zxcvbnm", "asdfgh", "hunter", "buster", "soccer", "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou", "2000", "charlie", "robert", "thomas", "hockey", "ranger", "daniel", "starwars", "klaster", "112233", "george"];
  reg({
    id: "password-entropy", title: "Password strength", icon: "🛡️", group: GROUP, desc: "Энтропия + время брута",
    render(root, { toast }) {
      const input = inp("пароль", "text"); input.value = "Tr0ub4dor&3";
      const out = el("div", { class: "mt-2" });
      const upd = () => {
        out.innerHTML = "";
        const p = input.value;
        let charset = 0;
        if (/[a-z]/.test(p)) charset += 26;
        if (/[A-Z]/.test(p)) charset += 26;
        if (/[0-9]/.test(p)) charset += 10;
        if (/[^a-zA-Z0-9]/.test(p)) charset += 32;
        const entropy = charset && p.length ? Math.log2(charset) * p.length : 0;
        const guesses = 2 ** entropy;
        const seconds = guesses / 1e10; // 10 GH/s brute
        const humanTime = (s) => {
          if (s < 1) return "< 1 секунды";
          const units = [["лет", 31536000], ["дн", 86400], ["ч", 3600], ["мин", 60], ["с", 1]];
          for (const [u, d] of units) { if (s >= d) return Math.round(s / d).toLocaleString() + " " + u; }
          return s.toFixed(2) + " с";
        };
        const inTop = TOP_PASSWORDS.includes(p.toLowerCase());
        const color = inTop ? "#d32f2f" : entropy < 28 ? "#d32f2f" : entropy < 60 ? "#ff9800" : entropy < 128 ? "#689f38" : "#2e7d32";
        const verdict = inTop ? "🚨 в топ-100 самых слабых!" : entropy < 28 ? "🔴 очень слабый" : entropy < 40 ? "🟠 слабый" : entropy < 60 ? "🟡 средний" : entropy < 128 ? "🟢 сильный" : "🟢 очень сильный";
        const bar = el("div", { style: { height: "12px", background: "rgba(127,127,127,0.2)", borderRadius: "6px", overflow: "hidden" } },
          el("div", { style: { height: "100%", width: Math.min(100, entropy / 128 * 100) + "%", background: color, transition: "all 0.2s" } }));
        out.appendChild(bar);
        const t = el("table", { class: "props mt-2" });
        [["Длина", p.length + " символов"], ["Charset", charset + " символов"], ["Энтропия", entropy.toFixed(1) + " бит"], ["Оценка", verdict], ["Guesses нужно", guesses.toExponential(2)], ["Время (10 GH/s брут)", humanTime(seconds)]]
          .forEach(([k, v]) => t.appendChild(el("tr", {}, el("td", {}, k), el("td", { style: { fontFamily: "monospace" } }, v))));
        out.appendChild(t);
      };
      input.oninput = upd;
      root.appendChild(card(h3("Password strength"),
        el("p", { class: "muted" }, "Оценка энтропии по Shannon: log2(charset) × length. Проверка на топ-100 утекших паролей. Время брута предполагает 10 млрд guesses/сек (single RTX 4090)."),
        input, out,
      ));
      upd();
    },
  });

  /* 39. Diceware */
  const DICEWARE = ("ape|ark|arm|art|ash|ask|axe|bad|bag|ban|bar|bat|bay|bed|bee|beg|bet|bid|big|bin|bit|bog|bot|bow|box|boy|bud|bug|bun|bus|but|buy|cab|cam|can|cap|car|cat|cow|coy|cry|cub|cue|cup|cut|dab|dad|dam|day|den|dew|did|die|dig|dim|dip|dog|dot|dry|dub|due|dug|ear|eat|ebb|egg|elf|elk|elm|end|era|eve|eye|fan|far|fat|fax|fed|fee|few|fib|fig|fin|fir|fit|fix|flu|fly|fog|for|fox|fry|fun|fur|gab|gag|gap|gas|gel|gem|get|gig|gin|got|gum|gun|gut|guy|gym|had|ham|has|hat|hay|her|hew|hex|hid|him|hip|his|hit|hog|hop|hot|how|hub|hue|hug|hum|hut|ice|icy|ilk|ill|imp|ink|inn|ion|ire|irk|jab|jam|jar|jaw|jay|jet|jig|job|jog|jot|joy|jug|jut|keg|key|kid|kin|kit|lab|lad|lag|lap|law|lax|lay|led|leg|let|lid|lie|lip|log|lot|low|mad|man|map|mar|mat|may|men|met|mid|mix|mob|mom|moo|mop|mud|mug|mum|nab|nag|nap|net|new|nip|nod|nor|not|now|nun|nut|oak|oar|oat|odd|off|oil|old|one|orb|ore|our|out|owe|owl|own|pad|pal|pan|par|pat|paw|pay|pea|peg|pen|pep|pet|pew|pie|pig|pin|pip|pit|pod|pop|pot|pry|pub|pug|pun|pup|put|rag|ram|rap|rat|raw|ray|red|rib|rid|rig|rim|rip|rob|rod|row|rub|rug|rum|run|rut|rye|sad|sag|sap|sat|saw|say|sea|see|set|sew|she|shy|sin|sip|sir|sit|six|ski|sky|sly|sob|son|sop|sow|soy|spa|spy|sty|sub|sum|sun|tab|tad|tag|tan|tap|tar|tax|tea|ten|the|thy|tie|tin|tip|toe|ton|too|top|tot|tow|toy|try|tub|tug|urn|use|van|vat|vet|vex|via|vie|vow|wad|wag|war|was|wax|way|web|wed|wet|who|why|wig|win|wit|woe|wok|won|woo|wow|wry|yak|yam|yap|yaw|yen|yes|yet|yew|you|yum|zap|zip|zit|zoo").split("|");
  reg({
    id: "diceware", title: "Diceware passphrase", icon: "🎲", group: GROUP, desc: "correct horse battery staple",
    render(root, { toast }) {
      const n = inp("6", "number"); n.value = "6"; n.min = "3"; n.max = "12";
      const sep = el("select", { class: "input" },
        ...[" ", "-", "_", ".", ""].map(x => el("option", { value: x }, x === " " ? "(пробел)" : x === "" ? "(без разделителя)" : x)));
      const out = el("div", { style: { fontFamily: "monospace", fontSize: "18px", padding: "12px", background: "rgba(127,127,127,0.1)", borderRadius: "6px", wordBreak: "break-all" } });
      const info = el("div", { class: "muted mt-2" });
      const gen = () => {
        const count = Math.max(3, Math.min(12, +n.value || 6));
        const idx = new Uint32Array(count);
        crypto.getRandomValues(idx);
        const words = [];
        for (let i = 0; i < count; i++) words.push(DICEWARE[idx[i] % DICEWARE.length]);
        out.textContent = words.join(sep.value);
        const entropy = count * Math.log2(DICEWARE.length);
        info.textContent = `${DICEWARE.length} слов в словаре · энтропия ≈ ${entropy.toFixed(1)} бит`;
      };
      root.appendChild(card(h3("Diceware passphrase"),
        el("p", { class: "muted" }, "Метод EFF: случайные слова из словаря. Легко запомнить, сложно сбрутить. 6 слов ≈ 60+ бит энтропии — достаточно даже против APT."),
        row(el("label", {}, "Слов"), n, el("label", {}, "Разделитель"), sep, btn("🎲", gen, "primary")),
        el("div", { class: "mt-2" }), out, info,
        row(btn("📋", () => copy(out.textContent, toast))),
      ));
      gen();
    },
  });

  /* 40. Regex cheat sheet */
  const REGEX_REF = [
    ["Базовое", ".", "Любой символ (кроме \\n)"],
    ["Базовое", "\\d", "Цифра [0-9]"],
    ["Базовое", "\\D", "Не-цифра"],
    ["Базовое", "\\w", "Слово-символ [A-Za-z0-9_]"],
    ["Базовое", "\\W", "Не-слово"],
    ["Базовое", "\\s", "Whitespace [ \\t\\n\\r]"],
    ["Базовое", "\\S", "Не-whitespace"],
    ["Кванторы", "*", "0 или больше"],
    ["Кванторы", "+", "1 или больше"],
    ["Кванторы", "?", "0 или 1 (опционально)"],
    ["Кванторы", "{n}", "Ровно n раз"],
    ["Кванторы", "{n,m}", "От n до m раз"],
    ["Кванторы", "*?", "Lazy (минимум символов)"],
    ["Якоря", "^", "Начало строки"],
    ["Якоря", "$", "Конец строки"],
    ["Якоря", "\\b", "Граница слова"],
    ["Якоря", "\\B", "Не-граница"],
    ["Группы", "(...)", "Capture группа"],
    ["Группы", "(?:...)", "Non-capture"],
    ["Группы", "(?<name>...)", "Named capture"],
    ["Группы", "\\1", "Backreference на 1-ю группу"],
    ["Lookahead", "(?=...)", "Положительный lookahead"],
    ["Lookahead", "(?!...)", "Отрицательный lookahead"],
    ["Lookbehind", "(?<=...)", "Положительный lookbehind"],
    ["Lookbehind", "(?<!...)", "Отрицательный lookbehind"],
    ["Классы", "[abc]", "Любой из a/b/c"],
    ["Классы", "[^abc]", "Ни один из a/b/c"],
    ["Классы", "[a-z]", "Диапазон"],
    ["Флаги", "i", "Case insensitive"],
    ["Флаги", "g", "Global (все вхождения)"],
    ["Флаги", "m", "Multi-line (^ $ по строкам)"],
    ["Флаги", "s", "Dot matches \\n"],
    ["Флаги", "u", "Unicode"],
    ["Готовые", "^[\\w.-]+@[\\w.-]+\\.[a-z]{2,}$", "Email (упрощённый)"],
    ["Готовые", "^\\+?\\d{10,15}$", "Телефон"],
    ["Готовые", "^https?://[\\w.-]+\\S*$", "URL"],
    ["Готовые", "^\\d{4}-\\d{2}-\\d{2}$", "Дата YYYY-MM-DD"],
    ["Готовые", "^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$", "UUID"],
    ["Готовые", "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", "Пароль: 8+ символов, большая/маленькая буква, цифра"],
  ];
  reg({
    id: "regex-cheat", title: "Regex cheat sheet", icon: "🧪", group: GROUP, desc: "Справочник + готовые рецепты",
    render(root, { toast }) {
      const search = inp("поиск...");
      const out = el("div", { style: { maxHeight: "500px", overflow: "auto" } });
      const upd = () => {
        const q = search.value.toLowerCase();
        const rows = REGEX_REF.filter(([cat, p, d]) => !q || cat.toLowerCase().includes(q) || p.toLowerCase().includes(q) || d.toLowerCase().includes(q));
        out.innerHTML = "";
        const t = el("table", { class: "props" });
        t.appendChild(el("tr", {}, el("th", {}, "Категория"), el("th", {}, "Паттерн"), el("th", {}, "Описание")));
        rows.forEach(([cat, p, d]) => {
          const cell = el("td", { style: { fontFamily: "monospace" } }, el("code", { style: { cursor: "pointer" }, onclick: () => copy(p, toast) }, p));
          t.appendChild(el("tr", {}, el("td", {}, cat), cell, el("td", {}, d)));
        });
        out.appendChild(t);
      };
      search.oninput = upd;
      root.appendChild(card(h3("Regex cheat sheet"),
        el("p", { class: "muted" }, REGEX_REF.length + " записей. Клик по паттерну копирует."),
        search, out,
      ));
      upd();
    },
  });

  /* 41. Magic bytes / file signatures */
  const MAGIC = [
    ["PDF", "%PDF-", "application/pdf"],
    ["PNG", "89 50 4E 47 0D 0A 1A 0A", "image/png"],
    ["JPEG", "FF D8 FF", "image/jpeg"],
    ["GIF87a", "47 49 46 38 37 61", "image/gif"],
    ["GIF89a", "47 49 46 38 39 61", "image/gif"],
    ["WEBP", "52 49 46 46 ?? ?? ?? ?? 57 45 42 50", "image/webp"],
    ["BMP", "42 4D", "image/bmp"],
    ["ICO", "00 00 01 00", "image/x-icon"],
    ["ZIP", "50 4B 03 04", "application/zip"],
    ["ZIP (empty)", "50 4B 05 06", "application/zip (empty)"],
    ["GZIP", "1F 8B", "application/gzip"],
    ["7-ZIP", "37 7A BC AF 27 1C", "application/x-7z-compressed"],
    ["RAR", "52 61 72 21 1A 07 00", "application/x-rar-compressed"],
    ["TAR", "75 73 74 61 72", "application/x-tar"],
    ["XZ", "FD 37 7A 58 5A 00", "application/x-xz"],
    ["MP3 (ID3)", "49 44 33", "audio/mpeg"],
    ["MP3 (frame)", "FF FB", "audio/mpeg"],
    ["WAV", "52 49 46 46 ?? ?? ?? ?? 57 41 56 45", "audio/wav"],
    ["FLAC", "66 4C 61 43", "audio/flac"],
    ["OGG", "4F 67 67 53", "audio/ogg"],
    ["MP4", "?? ?? ?? ?? 66 74 79 70", "video/mp4"],
    ["AVI", "52 49 46 46 ?? ?? ?? ?? 41 56 49 20", "video/x-msvideo"],
    ["MKV", "1A 45 DF A3", "video/x-matroska"],
    ["ELF (Linux)", "7F 45 4C 46", "Linux executable"],
    ["PE (Windows)", "4D 5A", "Windows executable"],
    ["Mach-O (macOS)", "CF FA ED FE / FE ED FA CF", "macOS executable"],
    ["Java .class", "CA FE BA BE", "Java bytecode"],
    ["WASM", "00 61 73 6D", "WebAssembly"],
    ["SQLite 3", "53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33", "SQLite DB"],
    ["OpenPGP", "2D 2D 2D 2D 2D 42 45 47", "PGP armored"],
    ["RSA priv key", "-----BEGIN RSA", "RSA private PEM"],
    ["SSH priv key", "-----BEGIN OPENSSH", "OpenSSH private key"],
    ["LUKS", "4C 55 4B 53 BA BE", "Linux encrypted disk"],
    ["ISO 9660", "43 44 30 30 31", "CD-ROM image (@ 0x8001)"],
    ["BTC wallet", "?? ?? ?? ?? (wallet.dat, BerkeleyDB)", "Bitcoin Core wallet"],
  ];
  reg({
    id: "magic-bytes", title: "Magic bytes DB", icon: "🪄", group: GROUP, desc: "Сигнатуры файлов",
    render(root, { toast }) {
      const search = inp("поиск (png, 50 4B, pdf...)");
      const out = el("div", { style: { maxHeight: "500px", overflow: "auto" } });
      const file = el("input", { type: "file" });
      const fileOut = el("div", { class: "muted mt-2" });
      file.onchange = async () => {
        const f = file.files[0]; if (!f) return;
        const buf = await f.slice(0, 32).arrayBuffer();
        const hex = bytesToHex(new Uint8Array(buf)).match(/.{2}/g).join(" ").toUpperCase();
        fileOut.innerHTML = `Первые 32 байта: <code>${hex}</code>`;
      };
      const upd = () => {
        const q = search.value.toLowerCase();
        const rows = MAGIC.filter(([n, s, d]) => !q || n.toLowerCase().includes(q) || s.toLowerCase().includes(q) || d.toLowerCase().includes(q));
        out.innerHTML = "";
        const t = el("table", { class: "props" });
        t.appendChild(el("tr", {}, el("th", {}, "Формат"), el("th", {}, "Сигнатура"), el("th", {}, "Тип")));
        rows.forEach(([n, s, d]) => t.appendChild(el("tr", {}, el("td", {}, n), el("td", { style: { fontFamily: "monospace", fontSize: "12px" } }, s), el("td", {}, d))));
        out.appendChild(t);
      };
      search.oninput = upd;
      root.appendChild(card(h3("Magic bytes / file signatures"),
        el("p", { class: "muted" }, "Первые байты файла раскрывают тип даже если расширение сменили. Основа `file(1)`, libmagic, exiftool."),
        search, out,
        el("div", { class: "mt-2" }, "🔍 Проверить свой файл:"), file, fileOut,
      ));
      upd();
    },
  });

  /* 42. Cookie parser */
  reg({
    id: "cookie-parser", title: "Cookie парсер", icon: "🍪", group: GROUP, desc: "Set-Cookie → структура",
    render(root, { toast }) {
      const input = ta("paste Cookie: или Set-Cookie: header...", 6);
      input.value = "session=abc123; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600\ntheme=dark; Path=/; Domain=.example.com\n_ga=GA1.2.123456; Expires=Wed, 21 Oct 2026 07:28:00 GMT";
      const out = el("div", { class: "mt-2" });
      const upd = () => {
        out.innerHTML = "";
        const lines = input.value.split(/\n/).filter(Boolean);
        lines.forEach(line => {
          const parts = line.replace(/^Set-Cookie:\s*/i, "").split(";").map(p => p.trim()).filter(Boolean);
          if (!parts.length) return;
          const [name, value] = parts[0].split("=");
          const attrs = {};
          parts.slice(1).forEach(a => { const [k, v] = a.split("="); attrs[k.toLowerCase()] = v ?? true; });
          const card2 = el("div", { style: { border: "1px solid rgba(127,127,127,0.3)", padding: "8px", borderRadius: "6px", marginBottom: "8px", background: "rgba(127,127,127,0.05)" } });
          card2.appendChild(el("div", { style: { fontWeight: "bold", fontFamily: "monospace" } }, `${name} = ${(value || "").slice(0, 60)}${(value || "").length > 60 ? "…" : ""}`));
          const flags = [];
          if (attrs.httponly) flags.push("🔒 HttpOnly (JS не видит)");
          if (attrs.secure) flags.push("🔐 Secure (только HTTPS)");
          if (attrs.samesite) flags.push(`🛡️ SameSite=${attrs.samesite}`);
          if (attrs.path) flags.push(`📁 Path=${attrs.path}`);
          if (attrs.domain) flags.push(`🌐 Domain=${attrs.domain}`);
          if (attrs["max-age"]) flags.push(`⏰ Max-Age=${attrs["max-age"]}s`);
          if (attrs.expires) flags.push(`📅 Expires=${attrs.expires}`);
          card2.appendChild(el("div", { class: "muted", style: { fontSize: "12px", marginTop: "4px" } }, flags.join(" · ")));
          const warns = [];
          if (!attrs.httponly) warns.push("⚠️ нет HttpOnly — XSS может украсть");
          if (!attrs.secure) warns.push("⚠️ нет Secure — может утечь по HTTP");
          if (!attrs.samesite) warns.push("⚠️ нет SameSite — возможен CSRF");
          if (warns.length) card2.appendChild(el("div", { style: { color: "#ff9800", fontSize: "12px", marginTop: "4px" } }, warns.join(" · ")));
          out.appendChild(card2);
        });
      };
      input.oninput = upd;
      root.appendChild(card(h3("Cookie парсер"),
        el("p", { class: "muted" }, "Разбирает Set-Cookie/Cookie заголовки. Показывает флаги безопасности + предупреждения о небезопасных cookies."),
        input, out,
      ));
      upd();
    },
  });

  /* ===================================================================
   *  HACKER AESTHETIC (6)
   * =================================================================== */

  /* 43. Hacker terminal (hackertyper) */
  reg({
    id: "hacker-terminal", title: "Hacker терминал", icon: "⌨️", group: GROUP, desc: "Пиши любые клавиши = код",
    render(root, { toast }) {
      const FAKE = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <sys/socket.h>\n#include <netinet/in.h>\n\nint exploit(char *target, int port) {\n    int sockfd = socket(AF_INET, SOCK_STREAM, 0);\n    struct sockaddr_in addr = { .sin_family = AF_INET, .sin_port = htons(port) };\n    inet_pton(AF_INET, target, &addr.sin_addr);\n    if (connect(sockfd, (struct sockaddr*)&addr, sizeof(addr)) < 0) return -1;\n    char payload[1024];\n    snprintf(payload, sizeof(payload), "GET /%%s HTTP/1.1\\r\\nHost: %s\\r\\n\\r\\n", "admin", target);\n    send(sockfd, payload, strlen(payload), 0);\n    char buf[4096] = {0};\n    recv(sockfd, buf, sizeof(buf) - 1, 0);\n    printf("[+] Response: %s\\n", buf);\n    close(sockfd);\n    return 0;\n}\n\nvoid shellcode_exec() {\n    unsigned char shellcode[] = "\\x48\\x31\\xc0\\x50\\x48\\xbf\\x2f\\x62\\x69\\x6e\\x2f\\x2f\\x73\\x68";\n    void (*f)() = (void(*)())shellcode;\n    f();\n}\n\nint scan_subnet(const char *cidr) {\n    for (int i = 1; i < 255; i++) {\n        pid_t pid = fork();\n        if (pid == 0) {\n            char ip[32]; snprintf(ip, sizeof(ip), "192.168.1.%d", i);\n            execlp("ping", "ping", "-c", "1", "-W", "1", ip, NULL);\n        }\n    }\n    while (wait(NULL) > 0);\n    return 0;\n}\n\nint main(int argc, char **argv) {\n    if (argc < 3) { fprintf(stderr, "usage: %s target port\\n", argv[0]); return 1; }\n    printf("[*] Initializing packet handler...\\n");\n    printf("[*] Scanning subnet 192.168.1.0/24\\n");\n    scan_subnet("192.168.1.0/24");\n    printf("[+] Target: %s:%s\\n", argv[1], argv[2]);\n    if (exploit(argv[1], atoi(argv[2])) == 0) printf("[+] Pwned!\\n");\n    return 0;\n}\n`;
      const term = el("pre", { tabindex: "0", style: { background: "#000", color: "#0f0", fontFamily: "monospace", padding: "12px", borderRadius: "6px", height: "400px", overflow: "auto", fontSize: "13px", margin: 0, outline: "none", cursor: "text" } });
      let pos = 0;
      const onkey = (e) => {
        e.preventDefault();
        const chunk = FAKE.slice(pos, pos + 3 + Math.floor(Math.random() * 5));
        term.textContent += chunk;
        pos = (pos + chunk.length) % FAKE.length;
        term.scrollTop = term.scrollHeight;
        if (pos === 0) term.textContent = "";
      };
      term.onkeydown = onkey;
      term.onclick = () => term.focus();
      root.appendChild(card(h3("Hacker terminal"),
        el("p", { class: "muted" }, "Клик → начни печатать что угодно. Каждое нажатие выводит кусок «хакерского» кода. Как hackertyper.net. Для мемов и фильмов."),
        term,
        row(btn("🔄 Reset", () => { pos = 0; term.textContent = ""; })),
      ));
      setTimeout(() => term.focus(), 100);
    },
  });

  /* 44. ASCII banner / figlet-lite */
  const FIGLET_FONT = {
    A: ["  █████  ", " ██   ██ ", " ███████ ", " ██   ██ ", " ██   ██ "],
    B: [" ██████  ", " ██   ██ ", " ██████  ", " ██   ██ ", " ██████  "],
    C: ["  ██████ ", " ██      ", " ██      ", " ██      ", "  ██████ "],
    D: [" ██████  ", " ██   ██ ", " ██   ██ ", " ██   ██ ", " ██████  "],
    E: [" ███████ ", " ██      ", " █████   ", " ██      ", " ███████ "],
    F: [" ███████ ", " ██      ", " █████   ", " ██      ", " ██      "],
    G: ["  ██████ ", " ██      ", " ██  ███ ", " ██   ██ ", "  ██████ "],
    H: [" ██   ██ ", " ██   ██ ", " ███████ ", " ██   ██ ", " ██   ██ "],
    I: [" ██ ", " ██ ", " ██ ", " ██ ", " ██ "],
    J: ["      ██ ", "      ██ ", "      ██ ", " ██   ██ ", "  █████  "],
    K: [" ██   ██ ", " ██  ██  ", " █████   ", " ██  ██  ", " ██   ██ "],
    L: [" ██      ", " ██      ", " ██      ", " ██      ", " ███████ "],
    M: [" ███    ███ ", " ████  ████ ", " ██ ████ ██ ", " ██  ██  ██ ", " ██      ██ "],
    N: [" ███    ██ ", " ████   ██ ", " ██ ██  ██ ", " ██  ██ ██ ", " ██   ████ "],
    O: ["  ██████  ", " ██    ██ ", " ██    ██ ", " ██    ██ ", "  ██████  "],
    P: [" ██████  ", " ██   ██ ", " ██████  ", " ██      ", " ██      "],
    Q: ["  ██████  ", " ██    ██ ", " ██    ██ ", " ██ ▄▄ ██ ", "  ██████  "],
    R: [" ██████  ", " ██   ██ ", " ██████  ", " ██   ██ ", " ██   ██ "],
    S: ["  ██████ ", " ██      ", "  █████  ", "      ██ ", " ██████  "],
    T: [" ████████ ", "    ██    ", "    ██    ", "    ██    ", "    ██    "],
    U: [" ██    ██ ", " ██    ██ ", " ██    ██ ", " ██    ██ ", "  ██████  "],
    V: [" ██    ██ ", " ██    ██ ", " ██    ██ ", "  ██  ██  ", "   ████   "],
    W: [" ██     ██ ", " ██     ██ ", " ██  █  ██ ", " ██ ███ ██ ", "  ███ ███  "],
    X: [" ██   ██ ", "  ██ ██  ", "   ███   ", "  ██ ██  ", " ██   ██ "],
    Y: [" ██    ██ ", "  ██  ██  ", "   ████   ", "    ██    ", "    ██    "],
    Z: [" ███████ ", "     ██  ", "   ██    ", " ██      ", " ███████ "],
    " ": ["  ", "  ", "  ", "  ", "  "],
    "0": ["  ██████  ", " ██  ████ ", " ██ ██ ██ ", " ████  ██ ", "  ██████  "],
    "1": ["    ██   ", "  ████   ", "    ██   ", "    ██   ", "  ██████ "],
    "2": [" ██████  ", "      ██ ", "   ████  ", " ██      ", " ███████ "],
    "3": [" ██████  ", "      ██ ", "   ████  ", "      ██ ", " ██████  "],
    "4": [" ██   ██ ", " ██   ██ ", " ███████ ", "      ██ ", "      ██ "],
    "5": [" ███████ ", " ██      ", " ███████ ", "      ██ ", " ███████ "],
    "6": ["  █████  ", " ██      ", " ███████ ", " ██   ██ ", "  █████  "],
    "7": [" ███████ ", "      ██ ", "     ██  ", "    ██   ", "    ██   "],
    "8": ["  █████  ", " ██   ██ ", "  █████  ", " ██   ██ ", "  █████  "],
    "9": ["  █████  ", " ██   ██ ", "  ██████ ", "      ██ ", "  █████  "],
    "!": [" ██ ", " ██ ", " ██ ", "    ", " ██ "],
    "?": [" ██████  ", "      ██ ", "    ██   ", "         ", "    ██   "],
    ".": ["    ", "    ", "    ", "    ", " ██ "],
  };
  reg({
    id: "ascii-banner", title: "ASCII баннер", icon: "🅰️", group: GROUP, desc: "Текст → большие ASCII-буквы",
    render(root, { toast }) {
      const input = inp("HELLO"); input.value = "HACK";
      const out = el("pre", { style: { background: "rgba(127,127,127,0.1)", color: "inherit", padding: "12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px", lineHeight: "1.1", overflow: "auto", whiteSpace: "pre" } });
      const upd = () => {
        const chars = input.value.toUpperCase().split("").map(c => FIGLET_FONT[c] || FIGLET_FONT[" "]);
        if (!chars.length) { out.textContent = ""; return; }
        const lines = [];
        for (let row = 0; row < 5; row++) lines.push(chars.map(c => c[row]).join(""));
        out.textContent = lines.join("\n");
      };
      input.oninput = upd;
      root.appendChild(card(h3("ASCII баннер"),
        el("p", { class: "muted" }, "Как `figlet`. Поддерживает A-Z, 0-9, пробел, !?. Для MOTD, README, презентаций."),
        input, el("div", { class: "mt-2" }), out,
        row(btn("📋", () => copy(out.textContent, toast))),
      ));
      upd();
    },
  });

  /* 45. Cyberpunk quotes */
  const CYBER_QUOTES = [
    ["The quieter you become, the more you can hear.", "Ram Dass (через Kali Linux)"],
    ["Hack the planet!", "Hackers (1995)"],
    ["There is no patch for human stupidity.", "Kevin Mitnick"],
    ["Information wants to be free.", "Stewart Brand"],
    ["Code is law.", "Lawrence Lessig"],
    ["The Internet treats censorship as a malfunction and routes around it.", "John Gilmore"],
    ["Security is a process, not a product.", "Bruce Schneier"],
    ["Any sufficiently advanced technology is indistinguishable from magic.", "Arthur C. Clarke"],
    ["In cyberspace, nobody can hear you scream — but they CAN read your packets.", "anon"],
    ["cURL all the things!", "daniel stenberg"],
    ["I'm not a hacker. I'm a security researcher. (на суде)", "anon"],
    ["Trust no one. Verify everything.", "Zero Trust"],
    ["The cloud is just someone else's computer.", "FSF"],
    ["A foolish consistency is the hobgoblin of little minds.", "Emerson"],
    ["I think there is a world market for maybe five computers.", "Thomas Watson, IBM (1943)"],
    ["There are only two industries that refer to their customers as 'users'.", "Edward Tufte"],
    ["640K ought to be enough for anybody.", "приписывается Биллу Гейтсу (он отрицал)"],
    ["Premature optimization is the root of all evil.", "Donald Knuth"],
    ["Beware of bugs in the above code; I have only proved it correct, not tried it.", "Donald Knuth"],
    ["There are two ways to write error-free programs; only the third one works.", "Alan J. Perlis"],
    ["The question of whether a computer can think is no more interesting than whether a submarine can swim.", "Edsger Dijkstra"],
    ["It's hardware that makes a machine fast. It's software that makes a fast machine slow.", "Craig Bruce"],
    ["Programming today is a race between software engineers striving to build bigger and better idiot-proof programs.", "Rick Cook"],
    ["Wake up, Neo. The Matrix has you.", "Матрица"],
    ["I know Kung Fu.", "Нео"],
  ];
  reg({
    id: "cyber-quotes", title: "Cyber цитаты", icon: "💭", group: GROUP, desc: "Хакерский фольклор",
    render(root, { toast }) {
      const q = el("div", { style: { fontSize: "18px", fontStyle: "italic", padding: "20px", background: "rgba(127,127,127,0.1)", borderRadius: "6px", textAlign: "center" } });
      const a = el("div", { class: "muted mt-2", style: { textAlign: "center" } });
      const gen = () => { const [text, author] = CYBER_QUOTES[Math.floor(Math.random() * CYBER_QUOTES.length)]; q.textContent = "« " + text + " »"; a.textContent = "— " + author; };
      root.appendChild(card(h3("Цитаты из хакерского фольклора"),
        el("p", { class: "muted" }, CYBER_QUOTES.length + " цитат из хакерской культуры, infosec, классики CS."),
        q, a,
        row(btn("🎲 Ещё", gen, "primary"), btn("📋", () => copy(q.textContent + " " + a.textContent, toast))),
      ));
      gen();
    },
  });

  /* 46. Leetspeak */
  reg({
    id: "leetspeak", title: "L33t sp34k", icon: "🔠", group: GROUP, desc: "Текст → 1337",
    render(root, { toast }) {
      const LEET = { a: "4", b: "8", e: "3", g: "9", i: "1", l: "1", o: "0", s: "5", t: "7", z: "2" };
      const input = ta("", 3); input.value = "Hack the planet";
      const out = ta("", 3); out.readOnly = true;
      const level = el("select", { class: "input" },
        el("option", { value: "mild" }, "Мягкий (только буквы)"),
        el("option", { value: "hard" }, "Жёсткий (всё заменяется)"),
        el("option", { value: "leet" }, "Elite (с ROT, !, @)"));
      const upd = () => {
        const s = input.value.toLowerCase();
        const L = level.value;
        out.value = s.split("").map(c => {
          if (L === "mild") return LEET[c] ?? c;
          if (L === "hard") return (LEET[c] ?? c).toUpperCase();
          if (L === "leet") {
            const m = { ...LEET, a: "@", s: "$", h: "|-|", m: "|v|", n: "|\\|", w: "\\/\\/" };
            return m[c] ?? c.toUpperCase();
          }
        }).join("");
      };
      input.oninput = upd; level.onchange = upd;
      root.appendChild(card(h3("L33t sp34k"),
        el("p", { class: "muted" }, "Замена букв на похожие цифры/символы. Зародилось на BBS 80-х."),
        input, row(el("label", {}, "Уровень"), level),
        el("label", { class: "mt-2" }, "Leet"), out,
        row(btn("📋", () => copy(out.value, toast))),
      ));
      upd();
    },
  });

  /* 47. Zalgo text */
  reg({
    id: "zalgo", title: "Z͖̾á̷l̷g̴o̶", icon: "👁️", group: GROUP, desc: "Глитчевый текст",
    render(root, { toast }) {
      const MARKS = ["\u0300", "\u0301", "\u0302", "\u0303", "\u0304", "\u0305", "\u0306", "\u0307", "\u0308", "\u0309", "\u030A", "\u030B", "\u030C", "\u030D", "\u030E", "\u030F", "\u0310", "\u0311", "\u0312", "\u0313", "\u0314", "\u0315", "\u031A", "\u031B", "\u033D", "\u033E", "\u033F", "\u0340", "\u0341", "\u0342", "\u0343", "\u0344", "\u0346", "\u034A", "\u034B", "\u034C", "\u0350", "\u0351", "\u0352", "\u0357", "\u035B"];
      const MARKS_DOWN = ["\u0316", "\u0317", "\u0318", "\u0319", "\u031C", "\u031D", "\u031E", "\u031F", "\u0320", "\u0324", "\u0325", "\u0326", "\u0329", "\u032A", "\u032B", "\u032C", "\u032D", "\u032E", "\u032F", "\u0330", "\u0331", "\u0332", "\u0333", "\u0339", "\u033A", "\u033B", "\u033C", "\u0345", "\u0347", "\u0348", "\u0349", "\u034D", "\u034E", "\u0353", "\u0354", "\u0355", "\u0356", "\u0359", "\u035A", "\u0323"];
      const input = ta("", 2); input.value = "Everything is fine";
      const out = el("div", { style: { padding: "12px", fontSize: "18px", background: "rgba(127,127,127,0.1)", borderRadius: "6px", lineHeight: "1.8", wordBreak: "break-word" } });
      const intensity = inp("5", "range"); intensity.min = "1"; intensity.max = "20"; intensity.value = "5";
      const upd = () => {
        const n = +intensity.value;
        out.textContent = input.value.split("").map(c => {
          if (/\s/.test(c)) return c;
          let r = c;
          for (let i = 0; i < n; i++) r += MARKS[Math.floor(Math.random() * MARKS.length)];
          for (let i = 0; i < n; i++) r += MARKS_DOWN[Math.floor(Math.random() * MARKS_DOWN.length)];
          return r;
        }).join("");
      };
      input.oninput = upd; intensity.oninput = upd;
      root.appendChild(card(h3("Zalgo text"),
        el("p", { class: "muted" }, "Добавляет кучу combining diacritical marks (Unicode). Ломает высоту строки, сбивает с толку парсеры. Для мемов и ARG."),
        input, row(el("label", {}, "Уровень"), intensity),
        el("div", { class: "mt-2" }), out,
        row(btn("🎲 Ещё", upd), btn("📋", () => copy(out.textContent, toast))),
      ));
      upd();
    },
  });

  /* 48. MIME types DB */
  const MIMES = [
    ["txt", "text/plain"], ["html", "text/html"], ["htm", "text/html"], ["css", "text/css"], ["csv", "text/csv"], ["xml", "text/xml"], ["md", "text/markdown"],
    ["json", "application/json"], ["js", "application/javascript"], ["mjs", "application/javascript"], ["wasm", "application/wasm"],
    ["pdf", "application/pdf"], ["zip", "application/zip"], ["gz", "application/gzip"], ["tar", "application/x-tar"], ["7z", "application/x-7z-compressed"], ["rar", "application/vnd.rar"],
    ["doc", "application/msword"], ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["xls", "application/vnd.ms-excel"], ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["ppt", "application/vnd.ms-powerpoint"], ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ["odt", "application/vnd.oasis.opendocument.text"], ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
    ["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["gif", "image/gif"], ["svg", "image/svg+xml"], ["webp", "image/webp"], ["avif", "image/avif"], ["ico", "image/x-icon"], ["bmp", "image/bmp"], ["tiff", "image/tiff"],
    ["mp3", "audio/mpeg"], ["wav", "audio/wav"], ["ogg", "audio/ogg"], ["flac", "audio/flac"], ["m4a", "audio/mp4"], ["aac", "audio/aac"], ["opus", "audio/opus"],
    ["mp4", "video/mp4"], ["webm", "video/webm"], ["mkv", "video/x-matroska"], ["avi", "video/x-msvideo"], ["mov", "video/quicktime"], ["m4v", "video/mp4"],
    ["woff", "font/woff"], ["woff2", "font/woff2"], ["ttf", "font/ttf"], ["otf", "font/otf"],
    ["exe", "application/vnd.microsoft.portable-executable"], ["msi", "application/x-msi"], ["deb", "application/vnd.debian.binary-package"], ["rpm", "application/x-rpm"], ["apk", "application/vnd.android.package-archive"], ["dmg", "application/x-apple-diskimage"], ["iso", "application/x-iso9660-image"],
    ["yaml", "application/yaml"], ["yml", "application/yaml"], ["toml", "application/toml"],
    ["torrent", "application/x-bittorrent"], ["epub", "application/epub+zip"], ["mobi", "application/x-mobipocket-ebook"],
  ];
  reg({
    id: "mimes-db", title: "MIME types", icon: "📎", group: GROUP, desc: "Расширение ↔ Content-Type",
    render(root, { toast }) {
      const search = inp("поиск (pdf, image, json...)");
      const out = el("div", { style: { maxHeight: "500px", overflow: "auto" } });
      const upd = () => {
        const q = search.value.toLowerCase();
        const rows = MIMES.filter(([e, m]) => !q || e.toLowerCase().includes(q) || m.toLowerCase().includes(q));
        out.innerHTML = "";
        const t = el("table", { class: "props" });
        t.appendChild(el("tr", {}, el("th", {}, "Расширение"), el("th", {}, "MIME")));
        rows.forEach(([e, m]) => t.appendChild(el("tr", {}, el("td", { style: { fontFamily: "monospace" } }, "." + e), el("td", { style: { fontFamily: "monospace" } }, m))));
        out.appendChild(t);
      };
      search.oninput = upd;
      root.appendChild(card(h3("MIME types DB"),
        el("p", { class: "muted" }, MIMES.length + " MIME-типов. Для `Content-Type` header, `<input accept>`, file upload валидации."),
        search, out,
      ));
      upd();
    },
  });

  /* ===================================================================
   *  REFERENCES (2)
   * =================================================================== */

  /* 49. OWASP Top 10 (2021) */
  const OWASP = [
    ["A01", "Broken Access Control", "Обход проверок прав доступа: IDOR (/api/user/123 → 124), path traversal, CORS misconfiguration.", "Deny by default, проверки на сервере, не доверяй клиенту"],
    ["A02", "Cryptographic Failures", "Слабые алгоритмы (MD5, SHA-1, DES), хранение паролей в открытом виде, отсутствие TLS.", "bcrypt/argon2 для паролей, TLS 1.3, не делай свою крипто"],
    ["A03", "Injection", "SQL/NoSQL/OS injection, LDAP, XPath. Данные от пользователя попадают в запрос без экранирования.", "Parametrized queries, ORM, input validation, least privilege"],
    ["A04", "Insecure Design", "Отсутствие threat modeling, rate limiting, бизнес-логика с дырами (можно заказать -100 штук).", "Threat modeling, security requirements на этапе дизайна"],
    ["A05", "Security Misconfiguration", "Дефолтные пароли, открытые debug-эндпоинты, раскрытие стек-трейсов, CORS=*.", "Hardening guides, pentest, отключи дефолты"],
    ["A06", "Vulnerable Components", "Log4Shell, старый OpenSSL. Зависимости с известными CVE.", "SCA (Dependabot, Snyk), патчинг, SBOM"],
    ["A07", "Identification & Auth Failures", "Слабые пароли, отсутствие MFA, предсказуемые session ID, stuffing без rate limit.", "MFA, rate limiting, account lockout, сильные session-токены"],
    ["A08", "Software & Data Integrity Failures", "Auto-update без проверки подписи, CI/CD без supply chain контроля, insecure deserialization.", "Digital signatures, SLSA, SBOM, integrity checks"],
    ["A09", "Security Logging & Monitoring Failures", "Нет логов, не алертится подозрительное, логи уходят в /dev/null.", "Centralized logging (SIEM), alerting, incident response plan"],
    ["A10", "Server-Side Request Forgery (SSRF)", "Приложение делает HTTP-запрос на URL от юзера → атака на внутренние сервисы (metadata endpoint AWS, localhost:6379).", "Allowlist доменов, запретить private IP, deny metadata URLs"],
  ];
  reg({
    id: "owasp-top10", title: "OWASP Top 10", icon: "🛡️", group: GROUP, desc: "10 главных веб-уязвимостей",
    render(root, { toast }) {
      const out = el("div");
      OWASP.forEach(([id, title, desc, fix]) => {
        const c = el("div", { style: { border: "1px solid rgba(127,127,127,0.3)", borderRadius: "6px", padding: "12px", marginBottom: "10px", background: "rgba(127,127,127,0.05)" } });
        c.appendChild(el("div", { style: { fontWeight: "bold", fontSize: "16px" } }, id + " — " + title));
        c.appendChild(el("div", { class: "muted mt-2", style: { fontSize: "13px" } }, desc));
        c.appendChild(el("div", { class: "mt-2", style: { fontSize: "13px", color: "#4caf50" } }, "✅ Защита: " + fix));
        out.appendChild(c);
      });
      root.appendChild(card(h3("OWASP Top 10 (2021)"),
        el("p", { class: "muted" }, "Топ-10 категорий уязвимостей по данным OWASP Foundation. Обновляется каждые 3-4 года на основе реальных пентестов и CVE."),
        out,
        el("div", { class: "muted mt-2", style: { fontSize: "12px" } }, "Источник: https://owasp.org/Top10/"),
      ));
    },
  });

  /* 50. SQL injection educational reference */
  const SQLI_EXAMPLES = [
    ["Login bypass (наивный)", "admin' OR '1'='1' --", "Комментирует остаток запроса, делает условие всегда истинным."],
    ["UNION для извлечения", "1' UNION SELECT username, password FROM users --", "Добавляет свой SELECT к оригинальному. Нужно совпадение количества колонок."],
    ["Union с NULL (угадать колонки)", "1' UNION SELECT NULL, NULL, NULL --", "Подбирается количество колонок по количеству NULL."],
    ["Boolean-based blind", "1' AND (SELECT COUNT(*) FROM users) > 0 --", "Ответ сервера (ok/error) выдаёт условие. Используется когда результат не виден."],
    ["Time-based blind", "1'; SELECT pg_sleep(5) --", "Если запрос висит 5с — условие истинно. Для Postgres. MySQL: SLEEP(5)."],
    ["Second-order", "'; UPDATE users SET admin=1 WHERE id=1 --", "Payload хранится в БД, срабатывает позже в другом контексте."],
    ["Error-based (MSSQL)", "' AND 1=CONVERT(int, (SELECT @@version)) --", "Заставляет БД выдать ошибку, содержащую результат подзапроса."],
    ["Stacked queries (PostgreSQL)", "1'; DROP TABLE logs; --", "Выполнение нескольких statements подряд. В MySQL через PHP/mysqli обычно запрещено."],
  ];
  reg({
    id: "sqli-ref", title: "SQL injection", icon: "💉", group: GROUP, desc: "Educational: примеры и защита",
    render(root, { toast }) {
      const out = el("div");
      const warn = el("div", { style: { padding: "12px", background: "rgba(255,152,0,0.1)", borderLeft: "4px solid #ff9800", borderRadius: "4px", marginBottom: "12px" } },
        "⚠️ Только для своих приложений / CTF / OWASP Juice Shop / DVWA / тренировочных стендов. Атаки на чужие системы — преступление (ст. 272 УК РФ / CFAA). Это справочник для разработчиков чтобы они закрывали эти дыры.");
      SQLI_EXAMPLES.forEach(([name, payload, explain]) => {
        const c = el("div", { style: { border: "1px solid rgba(127,127,127,0.3)", borderRadius: "6px", padding: "10px", marginBottom: "8px" } });
        c.appendChild(el("div", { style: { fontWeight: "bold" } }, name));
        c.appendChild(el("pre", { style: { background: "#000", color: "#0f0", padding: "8px", borderRadius: "4px", margin: "6px 0", fontSize: "12px", overflow: "auto" } }, payload));
        c.appendChild(el("div", { class: "muted", style: { fontSize: "13px" } }, explain));
        out.appendChild(c);
      });
      const fix = el("div", { style: { padding: "12px", background: "rgba(76,175,80,0.1)", borderLeft: "4px solid #4caf50", borderRadius: "4px", marginTop: "12px" } },
        el("div", { style: { fontWeight: "bold" } }, "✅ Защита:"),
        el("ul", {},
          el("li", {}, "Параметризованные запросы (prepared statements) — всегда"),
          el("li", {}, "ORM с параметрами (не конкатенация!) — SQLAlchemy, Prisma, ActiveRecord"),
          el("li", {}, "Escape + least privilege для DB-юзера приложения"),
          el("li", {}, "WAF (mod_security, Cloudflare)"),
          el("li", {}, "Input validation whitelist-подходом (что разрешено, а не что запрещено)"),
          el("li", {}, "Регулярный pentest и SAST (SonarQube, Semgrep)"),
        ),
      );
      root.appendChild(card(h3("SQL injection — справочник"),
        el("p", { class: "muted" }, "Обзор основных техник SQLi из OWASP Testing Guide. Для разработчиков: чтобы знать чего ждать и как защититься."),
        warn, out, fix,
        el("div", { class: "muted mt-2", style: { fontSize: "12px" } }, "Источники: OWASP Testing Guide, PortSwigger Web Security Academy. Для практики: juice-shop.herokuapp.com, PortSwigger labs."),
      ));
    },
  });

})();
