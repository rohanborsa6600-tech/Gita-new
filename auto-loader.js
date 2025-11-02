// === auto-loader.js ===
// Fully Safari-safe day/night background system

window.addEventListener("load", function () {
  const DAY_IMG =
    "https://images.unsplash.com/photo-1530176928500-2372a88e00b5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1374";
  const NIGHT_IMG =
    "https://images.unsplash.com/photo-1517582082532-16a092d47074?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1374";

  // CSS glass UI
  const style = document.createElement("style");
  style.textContent = `
    #bg-toggle-controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 14px;
      backdrop-filter: blur(12px) saturate(160%);
      -webkit-backdrop-filter: blur(12px) saturate(160%);
      padding: 14px 18px;
      z-index: 2147483647;
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
    }
    #bg-toggle-controls button {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 10px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    #bg-toggle-controls button:hover {
      background: rgba(255,255,255,0.3);
    }
    body {
      transition: background-image 1s ease, color 0.3s ease;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      color: white;
    }
  `;
  document.head.appendChild(style);

  // Create UI panel
  const panel = document.createElement("div");
  panel.id = "bg-toggle-controls";
  const btn = document.createElement("button");
  btn.id = "bg-toggle";
  panel.appendChild(btn);
  document.body.appendChild(panel);

  // Auto time detection
  const hour = new Date().getHours();
  const isAutoNight = hour < 6 || hour >= 18;
  let currentMode =
    localStorage.getItem("bgMode") || (isAutoNight ? "night" : "day");

  function applyBg(mode, instant = false) {
    const img = mode === "night" ? NIGHT_IMG : DAY_IMG;
    document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)), url('${img}')`;
    document.body.style.color = "#fff";
    if (!instant) {
      document.body.animate([{ opacity: 0.8 }, { opacity: 1 }], {
        duration: 800,
        easing: "ease",
      });
    }
    btn.textContent =
      mode === "night" ? "Switch to Day ☀️" : "Switch to Night 🌙";
    localStorage.setItem("bgMode", mode);
  }

  // Initial background
  applyBg(currentMode, true);

  // Toggle event
  btn.addEventListener("click", () => {
    currentMode = currentMode === "day" ? "night" : "day";
    applyBg(currentMode);
  });
});
