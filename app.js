const D_PENUH = 20.0;
const D_KOSONG = 120.0;
const ISI_CM_PER_S = 3.0;
const KURAS_CM_PER_S = 0.5;

let jarak = 89.0;
let modeOtomatis = true;
let statusPompa = false;

const el = {
  persen: document.getElementById("persen"),
  jarak: document.getElementById("jarak"),
  mode: document.getElementById("mode"),
  pompa: document.getElementById("pompa"),
  dot: document.getElementById("dot"),
  air: document.getElementById("air"),
  inlet: document.getElementById("inlet"),
  level: document.getElementById("level"),
  log: document.getElementById("log"),
};

const persenDari = (cm) => Math.min(100, Math.max(0, (1 - (cm - D_PENUH) / (D_KOSONG - D_PENUH)) * 100));
const kePersenID = (p) => p.toFixed(1).replace(".", ",");
// shortcut: 57/220 mengulang geometri clip di SVG index.html, sinkronkan kalau viewBox berubah
const tinggiAir = (p) => 57 + (1 - p / 100) * 220;

function catat(pesan, aksi = false) {
  const baris = document.createElement("div");
  baris.textContent = pesan;
  if (aksi) baris.className = "aksi";
  el.log.appendChild(baris);
  while (el.log.children.length > 80) el.log.firstChild.remove();
  el.log.scrollTop = el.log.scrollHeight;
}

function render() {
  const p = persenDari(jarak);
  const y = tinggiAir(p);

  el.persen.textContent = kePersenID(p);
  el.jarak.textContent = Math.round(jarak);
  el.mode.textContent = modeOtomatis ? "OTOMATIS" : "MANUAL";
  el.mode.classList.toggle("manual", !modeOtomatis);
  el.pompa.textContent = statusPompa ? "NYALA" : "MATI";
  el.dot.classList.toggle("on", statusPompa);

  el.air.setAttribute("y", y);
  el.air.setAttribute("height", 277 - y);
  el.inlet.setAttribute("y2", Math.max(y, 57));
  el.inlet.classList.toggle("on", statusPompa);

  if (document.activeElement !== el.level) el.level.value = Math.round(jarak);
}

let tStatus = 0;
let tTerakhir = performance.now();

function tick(sekarang) {
  const dt = Math.min((sekarang - tTerakhir) / 1000, 0.25);
  tTerakhir = sekarang;

  jarak += (statusPompa ? -ISI_CM_PER_S : KURAS_CM_PER_S) * dt;
  jarak = Math.min(D_KOSONG, Math.max(D_PENUH, jarak));

  const p = persenDari(jarak);
  if (modeOtomatis) {
    if (p < 25.0 && !statusPompa) {
      statusPompa = true;
      catat("[AUTO-ACTION] Air < 25%! Pompa Hidup Otomatis.", true);
    } else if (p >= 95.0 && statusPompa) {
      statusPompa = false;
      catat("[AUTO-ACTION] Air Penuh (>=95%)! Pompa Mati Otomatis.", true);
    }
  }

  tStatus += dt;
  if (tStatus >= 2.0) {
    tStatus = 0;
    catat(`Air: ${p.toFixed(1)}% | Mode: ${modeOtomatis ? "OTOMATIS" : "MANUAL  "} | Pompa: ${statusPompa ? "ON (NYALA)" : "OFF (MATI)"}`);
  }

  render();
  requestAnimationFrame(tick);
}

document.getElementById("btn-auto").addEventListener("click", () => {
  modeOtomatis = true;
  catat("\n[APLIKASI HP] Mode diubah ke: OTOMATIS", true);
});
document.getElementById("btn-on").addEventListener("click", () => {
  modeOtomatis = false;
  statusPompa = true;
  catat("\n[APLIKASI HP] Tombol ON Ditekan -> Pompa NYALA (Manual)", true);
});
document.getElementById("btn-off").addEventListener("click", () => {
  modeOtomatis = false;
  statusPompa = false;
  catat("\n[APLIKASI HP] Tombol OFF Ditekan -> Pompa MATI (Manual)", true);
});

el.level.addEventListener("input", () => {
  jarak = Number(el.level.value);
});

catat(`[SISTEM] Smart Toren siap. Level awal ${kePersenID(persenDari(jarak))}% (${jarak} cm).`);
render();
requestAnimationFrame(tick);
