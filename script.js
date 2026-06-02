(function() {
  const ACTIVITIES = [
    { key: "food", label: "Food", emoji: "🍽️" },
    { key: "drink-hookah", label: "Drink & Hookah", emoji: "☕🌿" },
    { key: "walking", label: "Walking", emoji: "🚶‍♂️💕" },
  ];

  const CITIES = [
    { key: "germana", label: "جرمانا", emoji: "🏙️" },
    { key: "bab-touma", label: "باب توما", emoji: "🕌" },
    { key: "bab-sharqi", label: "باب شرقي", emoji: "🌆" },
    { key: "other", label: "مكان آخر", emoji: "📍" },
  ];

  function genTimes() {
    const out = [];
    for (let h = 19; h <= 22; h++) {
      for (const m of [0, 30]) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        out.push(d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      }
    }
    return out;
  }
  const TIMES = genTimes();

  function ordinal(n) {
    const s = ["th","st","nd","rd"];
    const v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const [y,m,d] = iso.split("-").map(Number);
    const dt = new Date(y, m-1, d);
    const weekday = dt.toLocaleDateString(undefined, { weekday: "long" });
    const month   = dt.toLocaleDateString(undefined, { month: "long" });
    return weekday + ", " + month + " " + ordinal(d);
  }

  let step = 1;
  let date = "";
  let time = "";
  let activities = [];
  let city = "";
  let customCity = "";
  let placeName = "";
  let noPos = null; // {x,y} relative px offsets

  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.className = "toast";
    setTimeout(() => { toastEl.className = ""; toastEl.textContent = ""; }, 1800);
  }

  function render() {
    app.innerHTML = "";

    if (step === 1) {
      const wrap = document.createElement("div");
      wrap.className = "card fade-step";
      wrap.style.position = "relative";
      wrap.innerHTML = `
        <div class="heart-bounce">💌</div>
        <h1 style="font-size: 2rem; margin-bottom: 8px; color: #e91e63;" class="wave-text" id="hello-text"></h1>
        <h2 style="font-size: 2.5rem; margin-bottom: 0;">Will you go on a date with me?</h2>
        <div class="mt-10 flex flex-col items-center gap-4 min-h-140 relative" id="step1-btns">
          <button class="btn-secondary" id="btn-no">No</button>
          <button class="btn-primary text-lg" id="btn-yes">Yes ✨</button>
        </div>
      `;
      app.appendChild(wrap);

      // Add wave animation to "Hello"
      const helloText = wrap.querySelector("#hello-text");
      const text = "Hello Elissa!";
      helloText.innerHTML = text.split("").map(char => 
        `<span>${char === " " ? "&nbsp;" : char}</span>`
      ).join("");

      const noBtn = wrap.querySelector("#btn-no");
      const yesBtn = wrap.querySelector("#btn-yes");

      function dodge() {
        const card = wrap;
        const w = card.clientWidth;
        const h = card.clientHeight;
        const x = Math.random() * (w - 120) - w/2 + 60;
        const y = Math.random() * (h * 0.5) - h * 0.25;
        noPos = { x, y };
        noBtn.style.position = "absolute";
        noBtn.style.left = "calc(50% + " + x + "px)";
        noBtn.style.top = Math.max(0, y + 60) + "px";
        noBtn.style.transform = "translateX(-50%)";
      }
      noBtn.addEventListener("mouseenter", dodge);
      noBtn.addEventListener("focus", dodge);
      noBtn.addEventListener("click", dodge);
      noBtn.addEventListener("touchstart", dodge);
      yesBtn.addEventListener("click", () => { step = 2; render(); });
      return;
    }

    if (step === 2) {
      const wrap = document.createElement("div");
      wrap.className = "fade-step";
      wrap.innerHTML = `
        <div class="progress-hearts" id="hearts"></div>
        <div class="card">
          <div class="text-center text-2xl mb-2">📅 🐾</div>
          <h2 class="text-center mb-6">So… when are you free?</h2>
          <label class="block">Pick a Day ✨</label>
          <input type="date" class="input-pill" id="inp-date" value="${date}" min="2026-06-04" max="2026-06-30">
          <label class="block">What Time? 🥰</label>
          <select class="input-pill mb-6" id="inp-time">
            <option value="">Select a time…</option>
            ${TIMES.map(t => `<option value="${t}"${t===time?" selected":""}>${t}</option>`).join("")}
          </select>
          <button class="btn-primary w-full" id="btn-next" disabled>okay next →</button>
        </div>
      `;
      app.appendChild(wrap);
      renderHearts(wrap.querySelector("#hearts"), 2);

      const dInp = wrap.querySelector("#inp-date");
      const tInp = wrap.querySelector("#inp-time");
      const nxt = wrap.querySelector("#btn-next");

      function update() {
        nxt.disabled = !(dInp.value && tInp.value);
      }
      dInp.addEventListener("change", () => { date = dInp.value; update(); });
      tInp.addEventListener("change", () => { time = tInp.value; update(); });
      nxt.addEventListener("click", () => { if (date && time) { step = 3; render(); } });
      update();
      return;
    }

    if (step === 3) {
      const wrap = document.createElement("div");
      wrap.className = "fade-step";
      wrap.innerHTML = `
        <div class="progress-hearts" id="hearts"></div>
        <div class="card">
          <h2 class="text-center">What are we doing? ✨</h2>
          <p class="text-center text-sm text-gray-500 mt-2 mb-6">(pick 1, 2 or 3 activities)</p>
          <div class="food-grid" id="activity-grid"></div>
          <button class="btn-primary w-full" id="btn-next" disabled>let's do this! →</button>
        </div>
      `;
      app.appendChild(wrap);
      renderHearts(wrap.querySelector("#hearts"), 3);

      const grid = wrap.querySelector("#activity-grid");
      ACTIVITIES.forEach(a => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "food-card" + (activities.includes(a.key) ? " selected" : "");
        btn.setAttribute("aria-pressed", activities.includes(a.key) ? "true" : "false");
        btn.innerHTML = `<div class="food-emoji">${a.emoji}</div><div class="food-label">${a.label}</div>`;
        btn.addEventListener("click", () => {
          if (activities.includes(a.key)) {
            activities = activities.filter(x => x !== a.key);
          } else {
            if (activities.length < 3) {
              activities = activities.concat(a.key);
            }
          }
          render();
        });
        grid.appendChild(btn);
      });

      const nxt = wrap.querySelector("#btn-next");
      nxt.disabled = activities.length < 1;
      nxt.addEventListener("click", () => { if (activities.length >= 1) { step = 4; render(); } });
      return;
    }

    if (step === 4) {
      const wrap = document.createElement("div");
      wrap.className = "fade-step";
      wrap.innerHTML = `
        <div class="progress-hearts" id="hearts"></div>
        <div class="card">
          <h2 class="text-center">Where should we go? 📍</h2>
          <p class="text-center text-sm text-gray-500 mt-2 mb-6">Pick a city</p>
          <div class="food-grid" id="city-grid"></div>
          <div id="custom-city-field" style="display:none; margin-bottom: 16px;">
            <label class="block">Where exactly? ✨</label>
            <input type="text" class="input-pill" id="inp-custom-city" placeholder="اكتب اسم المكان..." value="${customCity}">
          </div>
          <div id="place-name-field" style="display:none; margin-bottom: 16px;">
            <label class="block">${activities.includes("food") ? "Restaurant name? 🍽️" : "Cafe name? ☕"}</label>
            <input type="text" class="input-pill" id="inp-place-name" placeholder="اكتب اسم المطعم او المقهى..." value="${placeName}">
          </div>
          <button class="btn-primary w-full" id="btn-next" disabled>perfect! →</button>
        </div>
      `;
      app.appendChild(wrap);
      renderHearts(wrap.querySelector("#hearts"), 4);

      const grid = wrap.querySelector("#city-grid");
      const customCityField = wrap.querySelector("#custom-city-field");
      const customCityInput = wrap.querySelector("#inp-custom-city");
      const placeNameField = wrap.querySelector("#place-name-field");
      const placeNameInput = wrap.querySelector("#inp-place-name");
      const nxt = wrap.querySelector("#btn-next");

      // Show/hide custom city field
      function updateFields() {
        if (city === "other") {
          customCityField.style.display = "block";
        } else {
          customCityField.style.display = "none";
        }

        // Show place name field if Food or Drink & Hookah is selected
        if (activities.includes("food") || activities.includes("drink-hookah")) {
          placeNameField.style.display = "block";
        } else {
          placeNameField.style.display = "none";
        }

        updateNextButton();
      }

      function updateNextButton() {
        const cityValid = city && (city !== "other" || customCity.trim());
        const placeValid = !(activities.includes("food") || activities.includes("drink-hookah")) || placeName.trim();
        nxt.disabled = !(cityValid && placeValid);
      }

      CITIES.forEach(c => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "food-card" + (city === c.key ? " selected" : "");
        btn.setAttribute("aria-pressed", city === c.key ? "true" : "false");
        btn.innerHTML = `<div class="food-emoji">${c.emoji}</div><div class="food-label">${c.label}</div>`;
        btn.addEventListener("click", () => {
          city = c.key;
          render();
        });
        grid.appendChild(btn);
      });

      customCityInput.addEventListener("input", (e) => {
        customCity = e.target.value;
        updateNextButton();
      });

      placeNameInput.addEventListener("input", (e) => {
        placeName = e.target.value;
        updateNextButton();
      });

      updateFields();
      nxt.addEventListener("click", () => { 
        if (!nxt.disabled) { 
          step = 5; 
          render(); 
        } 
      });
      return;
    }

    if (step === 5) {
      const activityLabels = ACTIVITIES.filter(a => activities.includes(a.key)).map(a => a.label).join(", ");
      const cityLabel = city === "other" ? customCity : CITIES.find(c => c.key === city)?.label || "";
      
      const wrap = document.createElement("div");
      wrap.className = "fade-step";
      wrap.innerHTML = `
        <div class="progress-hearts" id="hearts"></div>
        <div class="card text-center">
          <h2 style="font-size:2.25rem;">It's a date! ❤️</h2>
          <p class="mt-3 text-gray-700">${time}, got it. bringing snacks just in case 🍿</p>
          <p class="text-sm text-gray-500 mt-2 italic">p.s. normal people text. i made a website on my lunch break for you, no big deal.</p>

          <div class="summary-box">
            <div class="summary-row">
              <span class="summary-icon">📅</span>
              <div>
                <div class="summary-label">WHEN</div>
                <div class="summary-value">${fmtDate(date)}</div>
                <div class="text-gray-700">at ${time}</div>
              </div>
            </div>
            <div class="summary-row">
              <span class="summary-icon">📍</span>
              <div>
                <div class="summary-label">WHERE</div>
                <div style="font-weight:600;color:#333;">${cityLabel}</div>
                ${placeName ? `<div class="text-gray-700">${placeName}</div>` : ""}
              </div>
            </div>
            <div class="summary-row">
              <span class="summary-icon">✨</span>
              <div>
                <div class="summary-label">ACTIVITIES</div>
                <div style="font-weight:600;color:#333;">${activityLabels}</div>
              </div>
            </div>
          </div>

          <button class="btn-primary mt-8 w-full" id="btn-copy">📋 Copy plan & text me</button>
          <button class="mt-3 text-sm text-gray-400" style="background:none;border:none;cursor:pointer;" id="btn-reset">start over</button>
        </div>
      `;
      app.appendChild(wrap);
      renderHearts(wrap.querySelector("#hearts"), 5);

      wrap.querySelector("#btn-copy").addEventListener("click", async () => {
        let text = `It's a date! 💖\n\nWhen: ${fmtDate(date)} at ${time}\nWhere: ${cityLabel}`;
        if (placeName) {
          text += `\nPlace: ${placeName}`;
        }
        text += `\nActivities: ${activityLabels}\n\nbringing snacks just in case 🍿`;
        try {
          await navigator.clipboard.writeText(text);
          showToast("Copied! 💖");
        } catch(e) {
          showToast("Couldn't copy 😢");
        }
      });
      wrap.querySelector("#btn-reset").addEventListener("click", () => {
        step = 1; date = ""; time = ""; activities = []; city = ""; customCity = ""; placeName = ""; noPos = null; render();
      });
    }
  }

  function renderHearts(container, s) {
    const filled = Math.max(0, s - 1);
    container.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const div = document.createElement("div");
      div.className = "heart-item";
      div.innerHTML = `<span class="heart">${i < filled ? "💖" : "🤍"}</span>` + (i < 3 ? `<span class="heart-line">—</span>` : "");
      container.appendChild(div);
    }
  }

  render();
})();
