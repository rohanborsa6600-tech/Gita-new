// auto-loader.js
// Advanced Auto Background Loader
// Features: auto time detect, smooth fade, remember choice, liquid-glass controls
// Default images (replace in code if you want custom defaults)
(function () {
  const DAY_IMG = "https://images.unsplash.com/photo-1530176928500-2372a88e00b5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1374";
  const NIGHT_IMG = "https://images.unsplash.com/photo-1517582082532-16a092d47074?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1374";

  const LS_KEY = "autoBg_lastMode_v1"; // stores: "day"|"night"|"auto" and last manual "day"|"night"

  // small util
  function q(s){ return document.querySelector(s); }
  function ce(t){ return document.createElement(t); }

  // ===== inject base CSS =====
  const css = `
  /* auto-loader styles */
  .al-bg-fader {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483645;
  }
  .al-bg-image {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transition: opacity 900ms ease, filter 900ms ease;
    will-change: opacity;
    opacity: 0;
    filter: blur(0.5px);
  }
  .al-bg-image.visible { opacity: 1; filter: blur(0px); }

  /* control panel */
  #al-controls {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    min-width: 160px;
    align-items: stretch;
    box-shadow: 0 6px 22px rgba(0,0,0,0.35);
    background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.10);
    backdrop-filter: blur(10px) saturate(120%);
    color: #fff;
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  }
  #al-controls .al-row { display:flex; gap:8px; align-items:center; justify-content:space-between; }
  #al-controls button, #al-controls .al-toggle {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    color: #fff;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
  }
  #al-controls button:hover, #al-controls .al-toggle:hover { background: rgba(255,255,255,0.12); }
  #al-controls .al-primary { background: linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06)); }
  #al-controls label { font-size: 12px; color: rgba(255,255,255,0.9); display:flex; gap:6px; align-items:center; }
  #al-controls input[type="file"] { display:none; }

  /* small badges */
  #al-mode-badge { font-size: 12px; opacity: 0.95; color: rgba(255,255,255,0.95); }

  /* responsive */
  @media (max-width:520px){
    #al-controls { right: 12px; left: 12px; bottom: 12px; flex-direction: row; gap: 8px; padding:8px; border-radius:10px; }
    #al-controls .al-row { flex-direction: column; width:100%; }
  }
  `;
  const s = ce("style"); s.textContent = css; (document.head || document.documentElement).appendChild(s);

  // ===== create fader + two image layers for crossfade =====
  const fader = ce("div"); fader.className = "al-bg-fader";
  const imgDay = ce("div"); imgDay.className = "al-bg-image"; imgDay.dataset.kind = "day";
  const imgNight = ce("div"); imgNight.className = "al-bg-image"; imgNight.dataset.kind = "night";
  fader.appendChild(imgDay); fader.appendChild(imgNight);
  document.body.appendChild(fader);

  // ===== control panel =====
  const panel = ce("div"); panel.id = "al-controls";
  panel.innerHTML = `
    <div class="al-row">
      <div style="display:flex;gap:8px;align-items:center">
        <strong id="al-title">BG Toggle</strong>
        <span id="al-mode-badge">Auto</span>
      </div>
      <div style="display:flex;gap:6px">
        <button id="al-autoBtn" class="al-toggle">Auto</button>
      </div>
    </div>

    <div class="al-row" style="justify-content:space-between">
      <button id="al-dayBtn" class="al-primary">Day ☀️</button>
      <button id="al-nightBtn">Night 🌙</button>
    </div>

    <div class="al-row" style="justify-content:space-between">
      <label for="al-dayFile">Upload</label>
      <input type="file" id="al-dayFile" accept="image/*">
      <label for="al-nightFile" style="opacity:0">x</label>
      <input type="file" id="al-nightFile" accept="image/*">
    </div>
  `;
  document.body.appendChild(panel);

  // Grab elements
  const dayBtn = q("#al-dayBtn");
  const nightBtn = q("#al-nightBtn");
  const autoBtn = q("#al-autoBtn");
  const badge = q("#al-mode-badge");
  const dayFile = q("#al-dayFile");
  const nightFile = q("#al-nightFile");

  // state
  let state = {
    mode: "auto", // "auto" or "manual"
    manual: "day", // if manual: "day" or "night"
    daySrc: DAY_IMG,
    nightSrc: NIGHT_IMG,
  };

  // load from storage
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (parsed.mode) state.mode = parsed.mode;
        if (parsed.manual) state.manual = parsed.manual;
        if (parsed.daySrc) state.daySrc = parsed.daySrc;
        if (parsed.nightSrc) state.nightSrc = parsed.nightSrc;
      }
    }
  } catch (e) { /* ignore */ }

  // helper to persist
  function persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        mode: state.mode,
        manual: state.manual,
        daySrc: state.daySrc,
        nightSrc: state.nightSrc
      }));
    } catch (e) {}
  }

  // helper: determine current desired mode (returns "day" or "night")
  function timeBasedChoice() {
    const h = new Date().getHours();
    // define day as 6..17 (6:00 - 17:59) — change if you want
    return (h >= 6 && h < 18) ? "day" : "night";
  }

  // Set visuals
  function applyBackground(kind, immediate=false) {
    const target = kind === "day" ? imgDay : imgNight;
    const other = kind === "day" ? imgNight : imgDay;
    // set urls (background-image)
    target.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url('${kind === "day" ? escapeForUrl(state.daySrc) : escapeForUrl(state.nightSrc)}')`;
    other.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url('${kind === "day" ? escapeForUrl(state.nightSrc) : escapeForUrl(state.daySrc)}')`;

    // cross-fade: add visible to target, remove from other
    // immediate => toggle without transition (useful on first load)
    if (immediate) {
      target.classList.add("visible");
      other.classList.remove("visible");
    } else {
      // ensure both present, then swap classes (CSS handles transition)
      target.classList.add("visible");
      setTimeout(() => other.classList.remove("visible"), 80);
    }

    // update badge
    badge.textContent = (state.mode === "auto" ? "Auto" : "Manual") + " · " + (kind === "day" ? "Day" : "Night");
  }

  // small helper to safely inject URL strings
  function escapeForUrl(u){
    // if it's already a data URL, return as-is
    if (typeof u !== "string") return "";
    if (u.startsWith("data:")) return u.replace(/'/g, "\\'");
    // otherwise encode single quotes to avoid CSS break
    return u.replace(/'/g, "\\'");
  }

  // initialize layers with low-opacity so transition shows
  imgDay.style.opacity = "0";
  imgNight.style.opacity = "0";

  // initial application on load: decide
  function initialApply() {
    const choice = (state.mode === "auto") ? timeBasedChoice() : state.manual;
    // set both images src quickly so first render is ready
    imgDay.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url('${escapeForUrl(state.daySrc)}')`;
    imgNight.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url('${escapeForUrl(state.nightSrc)}')`;
    applyBackground(choice, true);
  }

  // wire buttons
  dayBtn.addEventListener("click", () => {
    state.mode = "manual";
    state.manual = "day";
    persist();
    applyBackground("day");
  });
  nightBtn.addEventListener("click", () => {
    state.mode = "manual";
    state.manual = "night";
    persist();
    applyBackground("night");
  });
  autoBtn.addEventListener("click", () => {
    state.mode = (state.mode === "auto") ? "manual" : "auto";
    // if switching to auto, decide by time; else keep previous manual
    if (state.mode === "auto") {
      const byTime = timeBasedChoice();
      applyBackground(byTime);
    } else {
      // switch to manual but keep current manual value
      applyBackground(state.manual);
    }
    persist();
  });

  // file uploads: user can override day/night by uploading images
  function readFileToDataUrl(file, cb) {
    if (!file) return cb(null);
    const r = new FileReader();
    r.onload = ()=> cb(r.result);
    r.onerror = ()=> cb(null);
    r.readAsDataURL(file);
  }
  dayFile.addEventListener("change", (e)=>{
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    readFileToDataUrl(f, (dataUrl)=>{
      if (dataUrl) {
        state.daySrc = dataUrl;
        persist();
        if (state.mode === "auto" ? timeBasedChoice()==="day" : state.manual==="day") {
          applyBackground("day");
        }
      }
    });
  });
  nightFile.addEventListener("change", (e)=>{
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    readFileToDataUrl(f, (dataUrl)=>{
      if (dataUrl) {
        state.nightSrc = dataUrl;
        persist();
        if (state.mode === "auto" ? timeBasedChoice()==="night" : state.manual==="night") {
          applyBackground("night");
        }
      }
    });
  });

  // auto-switch by time when in auto mode (optional: check every minute)
  let autoInterval = null;
  function startAutoWatcher() {
    stopAutoWatcher();
    autoInterval = setInterval(()=>{
      if (state.mode !== "auto") return;
      const choice = timeBasedChoice();
      applyBackground(choice);
    }, 60 * 1000); // every minute
  }
  function stopAutoWatcher() {
    if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
  }

  // Accessibility: keyboard shortcuts
  window.addEventListener("keydown", (e)=>{
    // d = day, n = night, a = auto toggle
    if (e.key === "d" || e.key === "D") { dayBtn.click(); }
    if (e.key === "n" || e.key === "N") { nightBtn.click(); }
    if (e.key === "a" || e.key === "A") { autoBtn.click(); }
  });

  // start
  initialApply();
  if (state.mode === "auto") startAutoWatcher();

  // expose small global API (optional) so you can override from console
  window.__autoBg = {
    setDay(src){ state.daySrc = src; persist(); if (state.mode==='auto'?timeBasedChoice()==='day':state.manual==='day') applyBackground('day'); },
    setNight(src){ state.nightSrc = src; persist(); if (state.mode==='auto'?timeBasedChoice()==='night':state.manual==='night') applyBackground('night'); },
    setAuto(){ state.mode='auto'; persist(); startAutoWatcher(); applyBackground(timeBasedChoice()); },
    setManual(kind){ if (kind==='day' || kind==='night'){ state.mode='manual'; state.manual = kind; persist(); stopAutoWatcher(); applyBackground(kind);} },
    state() { return JSON.parse(JSON.stringify(state)); }
  };

})();
