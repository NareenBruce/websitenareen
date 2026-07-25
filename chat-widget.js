/* =========================================================================
   Nareen Portfolio — AI Chat Widget
   Self-contained: injects its own styles + markup, talks to an n8n webhook.
   Drop-in: <script src="./chat-widget.js" defer></script> before </body>.
   ========================================================================= */
(function () {
  "use strict";

  // ---- CONFIG ---------------------------------------------------------------
  const WEBHOOK_URL =
    "https://n8n.nareenbruce.tech/webhook/b4f2f851-b881-4bce-8c27-b4d7a8a5e2a4";
  const WELCOME =
    "👋 Hi there! I'm Bruce's assistant. Bruce is a Data Science & AI engineer who loves building things that actually ship — from ML pipelines to data dashboards to self-hosted systems.\n\nAsk me anything about his work, skills, or projects. And if you'd like to get in touch with him directly, just say the word — I can pass your message straight to him. 😊";
  const ACCENT = "#0062b9";

  // A stable per-visitor session id so n8n can keep conversation memory.
  let sessionId = null;
  try {
    sessionId = localStorage.getItem("nareen_chat_session");
    if (!sessionId) {
      sessionId =
        "sess_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem("nareen_chat_session", sessionId);
    }
  } catch (e) {
    // localStorage may be blocked; fall back to an in-memory id.
    sessionId = "sess_" + Date.now().toString(36);
  }

  // ---- STYLES ---------------------------------------------------------------
  const css = `
  .nchat-launcher{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;
    background:#12151c;border:2px solid ${ACCENT};cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.45);
    display:flex;align-items:center;justify-content:center;z-index:99998;transition:transform .2s ease,box-shadow .2s ease,background .2s ease;}
  .nchat-launcher:hover{transform:scale(1.06);background:${ACCENT};box-shadow:0 8px 26px rgba(0,98,185,.55);}
  .nchat-launcher svg{width:26px;height:26px;fill:${ACCENT};transition:fill .2s ease;}
  .nchat-launcher:hover svg{fill:#fff;}
  .nchat-launcher .nchat-close-ico{display:none;}
  .nchat-launcher.open .nchat-open-ico{display:none;}
  .nchat-launcher.open .nchat-close-ico{display:block;}

  .nchat-panel{position:fixed;bottom:96px;right:24px;width:380px;max-width:calc(100vw - 32px);
    height:560px;max-height:calc(100vh - 130px);background:#12151c;border:1px solid rgba(255,255,255,.08);
    border-radius:14px;box-shadow:0 16px 50px rgba(0,0,0,.5);z-index:99999;display:flex;flex-direction:column;
    overflow:hidden;opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;
    transition:opacity .22s ease,transform .22s ease;font-family:'Inter',system-ui,sans-serif;}
  .nchat-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}

  .nchat-header{background:linear-gradient(135deg,${ACCENT},#004a8f);padding:16px 18px;display:flex;align-items:center;gap:12px;}
  .nchat-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.15);
    display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
  .nchat-htext h4{margin:0;color:#fff;font-size:15px;font-weight:700;line-height:1.2;}
  .nchat-htext span{color:rgba(255,255,255,.8);font-size:12px;display:flex;align-items:center;gap:5px;}
  .nchat-dot{width:7px;height:7px;border-radius:50%;background:#31d158;display:inline-block;}

  .nchat-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:12px;
    background:#0d1015;scrollbar-width:thin;scrollbar-color:#2a2f3a transparent;}
  .nchat-body::-webkit-scrollbar{width:6px;}
  .nchat-body::-webkit-scrollbar-thumb{background:#2a2f3a;border-radius:3px;}

  .nchat-msg{max-width:82%;padding:11px 14px;font-size:14px;line-height:1.5;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;}
  .nchat-msg.bot{background:#1c2029;color:#e6e8ec;align-self:flex-start;border-bottom-left-radius:4px;}
  .nchat-msg.user{background:${ACCENT};color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}

  .nchat-typing{align-self:flex-start;background:#1c2029;padding:13px 16px;border-radius:14px;border-bottom-left-radius:4px;display:flex;gap:4px;}
  .nchat-typing span{width:7px;height:7px;border-radius:50%;background:#6b7280;animation:nchatBounce 1.3s infinite ease-in-out;}
  .nchat-typing span:nth-child(2){animation-delay:.15s;}
  .nchat-typing span:nth-child(3){animation-delay:.3s;}
  @keyframes nchatBounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-6px);opacity:1;}}

  .nchat-footer{padding:12px;background:#12151c;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:8px;align-items:flex-end;}
  .nchat-input{flex:1;background:#1c2029;border:1px solid rgba(255,255,255,.08);border-radius:10px;
    color:#e6e8ec;font-family:inherit;font-size:14px;padding:10px 12px;resize:none;max-height:96px;line-height:1.4;outline:none;}
  .nchat-input:focus{border-color:${ACCENT};}
  .nchat-input::placeholder{color:#6b7280;}
  .nchat-send{width:40px;height:40px;border-radius:10px;border:none;background:${ACCENT};cursor:pointer;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s ease;}
  .nchat-send:hover{background:#004a8f;}
  .nchat-send:disabled{opacity:.4;cursor:not-allowed;}
  .nchat-send svg{width:18px;height:18px;fill:#fff;}

  .nchat-branding{text-align:center;font-size:11px;color:#4b5563;padding:6px 0 10px;background:#12151c;}
  @media(max-width:480px){
    .nchat-panel{bottom:0;right:0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0;}
    .nchat-launcher{bottom:18px;right:18px;}
  }`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- MARKUP ---------------------------------------------------------------
  const launcher = document.createElement("button");
  launcher.className = "nchat-launcher";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.innerHTML = `
    <svg class="nchat-open-ico" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.6 1.23 4.94 3.2 6.56L4 22l4.9-1.66c.98.27 2.02.42 3.1.42 5.52 0 10-4.04 10-9S17.52 2 12 2z"/></svg>
    <svg class="nchat-close-ico" viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

  const panel = document.createElement("div");
  panel.className = "nchat-panel";
  panel.innerHTML = `
    <div class="nchat-header">
      <div class="nchat-avatar">🤖</div>
      <div class="nchat-htext">
        <h4>Bruce's Assistant</h4>
        <span><i class="nchat-dot"></i> Online — usually replies instantly</span>
      </div>
    </div>
    <div class="nchat-body" id="nchatBody"></div>
    <div class="nchat-footer">
      <textarea class="nchat-input" id="nchatInput" rows="1" placeholder="Ask about Bruce…"></textarea>
      <button class="nchat-send" id="nchatSend" aria-label="Send message">
        <svg viewBox="0 0 24 24"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
    <div class="nchat-branding">Powered by n8n · Bruce's portfolio</div>`;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const body = panel.querySelector("#nchatBody");
  const input = panel.querySelector("#nchatInput");
  const sendBtn = panel.querySelector("#nchatSend");

  // ---- HELPERS --------------------------------------------------------------
  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Render markdown-style [label](url) links first, then any leftover bare
  // URLs. Input is escaped beforehand, so this only runs on safe text.
  function linkify(safeText) {
    const anchor =
      'style="color:#4da3ff;text-decoration:underline;"';
    // [label](url)
    let out = safeText.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" ' + anchor + ">$1</a>"
    );
    // bare URLs not already inside an anchor
    out = out.replace(
      /(^|[^"'>])(https?:\/\/[^\s<]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener" ' + anchor + ">$2</a>"
    );
    return out;
  }

  function addMsg(text, who) {
    const el = document.createElement("div");
    el.className = "nchat-msg " + who;
    if (who === "bot") {
      // Bot text is trusted (our copy or n8n's) — escape then linkify.
      el.innerHTML = linkify(escapeHtml(text));
    } else {
      // User text stays inert.
      el.textContent = text;
    }
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function showTyping() {
    const t = document.createElement("div");
    t.className = "nchat-typing";
    t.id = "nchatTyping";
    t.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping() {
    const t = document.getElementById("nchatTyping");
    if (t) t.remove();
  }

  let welcomed = false;
  function togglePanel() {
    const open = panel.classList.toggle("open");
    launcher.classList.toggle("open", open);
    launcher.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    if (open && !welcomed) {
      welcomed = true;
      addMsg(WELCOME, "bot");
    }
    if (open) setTimeout(() => input.focus(), 250);
  }

  // Auto-grow the textarea.
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 96) + "px";
  });

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, "user");
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          page: window.location.href,
        }),
      });

      hideTyping();

      if (!res.ok) throw new Error("HTTP " + res.status);

      // Be tolerant about what n8n returns: JSON {reply|output|text|message} or raw text.
      let reply = "";
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        const pick = (o) =>
          o && (o.reply || o.output || o.text || o.message || o.answer);
        reply = pick(data) || (Array.isArray(data) && data[0] && pick(data[0])) || "";
        if (!reply && typeof data === "string") reply = data;
      } else {
        reply = await res.text();
      }

      addMsg(
        reply && reply.trim()
          ? reply.trim()
          : "Hmm, I didn't catch a reply there. Mind trying again?",
        "bot"
      );
    } catch (err) {
      hideTyping();
      addMsg(
        "⚠️ I'm having trouble reaching the server right now.\n\n[👉 Click here to message Bruce on WhatsApp](https://wa.me/60167459771?text=Hi%20Bruce%2C%20I%20was%20on%20your%20portfolio%20and%20wanted%20to%20reach%20you.)",
        "bot"
      );
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ---- EVENTS ---------------------------------------------------------------
  launcher.addEventListener("click", togglePanel);
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();