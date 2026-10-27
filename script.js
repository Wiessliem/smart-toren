// Simulasi logika Smart Toren (mengikuti hc-sr04.ino)
const D_KOSONG = 120.0;
const D_PENUH = 20.0;
const BATAS_ON = 25.0;     // pompa hidup jika < 25%
const BATAS_OFF = 95.0;    // pompa mati jika >= 95%

const LAJU_ISI = 1.5;      // % per detik saat pompa ON
const LAJU_PAKAI = 0.4;    // % per detik saat pompa OFF (air dipakai)
const TICK_MS = 100;       // update animasi
const LOG_MS = 2000;       // interval cetak serial (seperti delay(2000))

const state = { level: 60, mode: "AUTO", pump: false };

const $ = (id) => document.getElementById(id);
const el = {
  water: $("water"), persen: $("persen"), jarak: $("jarak"), chip: $("chip"),
  modeTxt: $("modeTxt"), modeBtns: $("modeBtns"), log: $("log"),
  slider: $("slider"), sliderVal: $("sliderVal"), speed: $("speed"),
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const speed = () => Number(el.speed.value);

function log(text) {
  const lines = el.log.textContent.split("\n").filter(Boolean);
  lines.push(text);
  while (lines.length > 9) lines.shift();
  el.log.textContent = lines.join("\n") + "\n";
  el.log.scrollTop = el.log.scrollHeight;
}

function statusLine() {
  return "Air: " + state.level.toFixed(1) + "% | Mode: " +
    (state.mode === "AUTO" ? "OTOMATIS" : "MANUAL  ") +
    " | Pompa: " + (state.pump ? "ON (NYALA)" : "OFF (MATI)");
}

function render() {
  const p = state.level;
  document.documentElement.style.setProperty("--lvl", p.toFixed(2));
  el.persen.textContent = p.toFixed(1);
  // persentase = (1 - (jarak - D_PENUH)/(D_KOSONG - D_PENUH)) * 100
  const jarak = D_PENUH + (1 - p / 100) * (D_KOSONG - D_PENUH);
  el.jarak.textContent = jarak.toFixed(0) + " cm";

  let cls = "chip-mid", txt = "● Air Normal";
  if (p >= BATAS_OFF) { cls = "chip-full"; txt = "✔ Air Penuh"; }
  else if (p < BATAS_ON) { cls = "chip-low"; txt = "⚠ Air Rendah"; }
  if (state.pump && p < BATAS_OFF) txt += " · Mengisi ↑";
  el.chip.className = "status-chip " + cls;
  el.chip.textContent = txt;

  document.body.classList.toggle("pump-active", state.pump);
  document.body.classList.toggle("mode-auto", state.mode === "AUTO");
  document.body.classList.toggle("mode-manual", state.mode !== "AUTO");
  el.modeTxt.textContent = state.mode === "AUTO" ? "OTOMATIS" : "MANUAL";
  // Tombol aktif = perintah terakhir (AUTO / ON / OFF)
  const aktif = state.mode === "AUTO" ? "AUTO" : (state.pump ? "ON" : "OFF");
  el.modeBtns.querySelectorAll("button").forEach((b) =>
    b.classList.toggle("active", b.dataset.cmd === aktif));

  el.slider.value = Math.round(p);
  el.sliderVal.textContent = Math.round(p);
}

function autoLogic() {
  if (state.mode !== "AUTO") return;
  if (state.level < BATAS_ON && !state.pump) {
    state.pump = true;
    log("[AUTO-ACTION] Air < 25%! Pompa Hidup Otomatis.");
  } else if (state.level >= BATAS_OFF && state.pump) {
    state.pump = false;
    log("[AUTO-ACTION] Air Penuh (>=95%)! Pompa Mati Otomatis.");
  }
}

function command(cmd) {
  if (cmd === "AUTO") {
    state.mode = "AUTO";
    log("[APLIKASI HP] Mode diubah ke: OTOMATIS");
  } else if (cmd === "ON") {
    state.mode = "MANUAL"; state.pump = true;
    log("[APLIKASI HP] Tombol ON Ditekan -> Pompa NYALA (Manual)");
  } else if (cmd === "OFF") {
    state.mode = "MANUAL"; state.pump = false;
    log("[APLIKASI HP] Tombol OFF Ditekan -> Pompa MATI (Manual)");
  }
  autoLogic();
  render();
}

// Level air mengikuti status pompa
setInterval(() => {
  const dt = (TICK_MS / 1000) * speed();
  state.level = clamp(
    state.level + (state.pump ? LAJU_ISI : -LAJU_PAKAI) * dt, 0, 100);
  autoLogic();
  render();
}, TICK_MS);

// Cetak status ke serial monitor tiap 2 detik
setInterval(() => log(statusLine()), LOG_MS);

el.modeBtns.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) command(b.dataset.cmd);
});

el.slider.addEventListener("input", () => {
  state.level = Number(el.slider.value);
  autoLogic();
  render();
});

log("Smart Toren siap. Mode: OTOMATIS");
render();
