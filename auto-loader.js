// 🌞🌙 Auto Background Loader (by Bhai)
(function () {
  const dayImage =
    "https://images.unsplash.com/photo-1530176928500-2372a88e00b5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1374";
  const nightImage =
    "https://images.unsplash.com/photo-1517582082532-16a092d47074?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1374";

  // ===== CSS Inject =====
  const css = `
  #bg-toggle-controls {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.12);
    padding: 16px;
    border-radius: 14px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.25);
    z-index: 9999;
  }
  #bg-toggle-controls button {
    background: rgba(255,255,255,0.15);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    padding: 8px 18px;
    font-size: 16px;
    cursor: pointer;
  }
  #bg-toggle-controls button:hover {
    background: rgba(255,255,255,0.25);
  }`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ===== Control Panel =====
  const panel = document.createElement("div");
  panel.id = "bg-toggle-controls";
  panel.innerHTML = `<button id="bg-toggle">Switch to Night 🌙</button>`;
  document.body.appendChild(panel);

  // ===== Logic =====
  let isDay = true;

  function setBackground(img) {
    document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)), url('${img}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.transition = "background-image 1s ease";
    document.body.style.color = "white";
  }

  // Initial background
  setBackground(dayImage);

  // Toggle button
  document.getElementById("bg-toggle").addEventListener("click", () => {
    isDay = !isDay;
    if (isDay) {
      setBackground(dayImage);
      document.getElementById("bg-toggle").textContent = "Switch to Night 🌙";
    } else {
      setBackground(nightImage);
      document.getElementById("bg-toggle").textContent = "Switch to Day ☀️";
    }
  });
})();
