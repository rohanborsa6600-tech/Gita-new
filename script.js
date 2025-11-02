document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const app = document.querySelector(".app-container");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const toggleTheme = document.getElementById("toggleTheme");
  const fontIncrease = document.getElementById("fontIncrease");
  const fontDecrease = document.getElementById("fontDecrease");
  const rawData = document.getElementById("raw-gita-data");
  const gitaContent = document.getElementById("gita-content");
  const indexContainer = document.getElementById("index-container");
  const tocContainer = document.getElementById("auto-toc-container");
  const searchInput = document.getElementById("searchInput");

  let gitaData = [];
  let fontSize = 16;

  /* 🧭 Sidebar Toggle */
  toggleSidebar.addEventListener("click", () => {
    app.classList.toggle("sidebar-collapsed");
  });

  /* 🌗 Theme Switch */
  toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    toggleTheme.innerHTML = document.body.classList.contains("dark-mode")
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    lucide.createIcons();
  });

  /* 🔠 Font Controls */
  fontIncrease.onclick = () => {
    fontSize += 1;
    document.body.style.fontSize = fontSize + "px";
  };
  fontDecrease.onclick = () => {
    fontSize = Math.max(12, fontSize - 1);
    document.body.style.fontSize = fontSize + "px";
  };

  /* 📖 Load Gita Data */
  fetch("gita-data.html")
    .then(res => {
      if (!res.ok) throw new Error("⚠️ गीता फाईल सापडली नाही!");
      return res.text();
    })
    .then(data => {
      rawData.innerHTML = data;
      parseGitaData();
      buildTOC();
      buildIndex();
    })
    .catch(err => {
      gitaContent.innerHTML = `<p style="color:red;">${err.message}</p>`;
    });

  /* 🔍 Search Functionality */
  searchInput.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const verses = gitaContent.querySelectorAll("p");
    verses.forEach(p => {
      p.style.display = p.innerText.toLowerCase().includes(query) ? "block" : "none";
    });
  });

  /* 🧩 Parse gita-data.html */
  function parseGitaData() {
    const paras = rawData.querySelectorAll("p");
    let currentChapter = null;
    let chapterObj = {};

    paras.forEach(p => {
      const cls = p.className.trim();
      const text = p.innerHTML.trim();

      if (cls === "p1") {
        if (currentChapter) gitaData.push(chapterObj);
        currentChapter = text;
        chapterObj = { title: text, shlokas: [] };
      } else if (cls === "p3" || cls === "p9") {
        chapterObj.shlokas.push({ type: cls, text });
      }
    });

    if (currentChapter) gitaData.push(chapterObj);

    // Show default (chapter 1)
    showChapter(0);
  }

  /* 🪶 Build TOC (अध्याय सूची) */
  function buildTOC() {
    tocContainer.innerHTML = "";
    gitaData.forEach((ch, i) => {
      const btn = document.createElement("button");
      btn.className = "toc-item";
      btn.innerHTML = ch.title;
      btn.addEventListener("click", () => showChapter(i));
      tocContainer.appendChild(btn);
    });
  }

  /* 📚 Build Index (गीता सूची - श्लोकसंख्या) */
  function buildIndex() {
    indexContainer.innerHTML = "";
    gitaData.forEach((ch, i) => {
      const div = document.createElement("div");
      div.className = "index-group";
      div.innerHTML = `<h3>${ch.title}</h3>`;

      ch.shlokas.forEach((s, j) => {
        if (s.type === "p3") {
          const p = document.createElement("p");
          p.className = "index-link";
          p.innerHTML = `श्लोक ${i + 1}.${j + 1}: ${s.text}`;
          p.onclick = () => showChapter(i, j);
          div.appendChild(p);
        }
      });
      indexContainer.appendChild(div);
    });
  }

  /* 🕉️ Show Chapter */
  function showChapter(chIndex, scrollTo = 0) {
    const chapter = gitaData[chIndex];
    gitaContent.innerHTML = `<h2>${chapter.title}</h2>`;
    chapter.shlokas.forEach((s, j) => {
      const p = document.createElement("p");
      p.className = s.type;
      p.innerHTML = s.text;
      gitaContent.appendChild(p);
    });

    // scroll highlight
    if (scrollTo > 0) {
      const allP = gitaContent.querySelectorAll("p");
      const target = allP[scrollTo];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("highlight");
        setTimeout(() => target.classList.remove("highlight"), 1500);
      }
    }

    document.querySelectorAll(".page").forEach(pg => pg.classList.remove("visible"));
    document.getElementById("gita-path").classList.add("visible");
  }
});
