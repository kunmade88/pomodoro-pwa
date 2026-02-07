// ---- PWA install (service worker) ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}

// ---- Simple Pomodoro ----
const $ = (id) => document.getElementById(id);

const mFocus = $("mFocus");
const mBreak = $("mBreak");
const mLong  = $("mLong");
const timeText = $("timeText");

const btnStart = $("btnStart");
const btnPause = $("btnPause");
const btnReset = $("btnReset");

const setFocus = $("setFocus");
const setBreak = $("setBreak");
const setLong  = $("setLong");
const setCycles = $("setCycles");

const STORAGE_KEY = "pomodoro_pwa_settings_v1";

let mode = "focus"; // focus | break | long
let timer = null;
let remainingSeconds = 25 * 60;
let completedFocusCycles = 0;

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    setFocus.value  = clampInt(s.focus, 1, 180, 25);
    setBreak.value  = clampInt(s.break, 1, 60, 5);
    setLong.value   = clampInt(s.long, 1, 120, 15);
    setCycles.value = clampInt(s.cycles, 1, 12, 4);
  } catch {}
}

function saveSettings() {
  const s = {
    focus: clampInt(setFocus.value, 1, 180, 25),
    break: clampInt(setBreak.value, 1, 60, 5),
    long: clampInt(setLong.value, 1, 120, 15),
    cycles: clampInt(setCycles.value, 1, 12, 4),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

function getDurations() {
  const s = saveSettings();
  return {
    focus: s.focus * 60,
    break: s.break * 60,
    long:  s.long * 60,
    cycles: s.cycles
  };
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setActivePill() {
  [mFocus, mBreak, mLong].forEach(el => el.classList.remove("active"));
  if (mode === "focus") mFocus.classList.add("active");
  if (mode === "break") mBreak.classList.add("active");
  if (mode === "long")  mLong.classList.add("active");
}

function setMode(nextMode, resetTimer = true) {
  mode = nextMode;
  setActivePill();

  if (resetTimer) {
    const d = getDurations();
    remainingSeconds =
      mode === "focus" ? d.focus :
      mode === "break" ? d.break : d.long;
    render();
  }
}

function render() {
  timeText.textContent = formatTime(remainingSeconds);
  document.title = `${timeText.textContent} • Pomodoro`;
}

function buzz() {
  if (navigator.vibrate) {
    navigator.vibrate([300, 200, 300, 200, 300]);
  }
}

function beep() {
  // tiny beep using WebAudio (works in most browsers after user interaction)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 180);
  } catch {}
}

async function notify(title, body) {
  // optional: browser notification (may be limited on iOS depending on install/state)
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission !== "granted") return;
    new Notification(title, { body });
  } catch {}
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function startTimer() {
  if (timer) return;
  timer = setInterval(tick, 1000);
}

function tick() {
  remainingSeconds -= 1;
  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    render();
    stopTimer();

    // session finished
    beep();
    buzz();

    if (mode === "focus") {
      completedFocusCycles += 1;
      const { cycles } = getDurations();
      const isLong = (completedFocusCycles % cycles === 0);
      const next = isLong ? "long" : "break";
      notify("집중 완료!", isLong ? "긴휴식 시작해요." : "휴식 시작해요.");
      setMode(next, true);
    } else {
      notify("휴식 완료!", "다시 집중 시작해요.");
      setMode("focus", true);
    }
    return;
  }
  render();
}

// ---- events ----
btnStart.addEventListener("click", () => startTimer());
btnPause.addEventListener("click", () => stopTimer());
btnReset.addEventListener("click", () => {
  stopTimer();
  completedFocusCycles = 0;
  setMode(mode, true);
});

[mFocus, mBreak, mLong].forEach((el) => {
  el.addEventListener("click", () => {
    stopTimer();
    completedFocusCycles = 0;
    setMode(el === mFocus ? "focus" : el === mBreak ? "break" : "long", true);
  });
});

[setFocus, setBreak, setLong, setCycles].forEach((inp) => {
  inp.addEventListener("change", () => {
    // keep current mode time in sync when user changes settings
    stopTimer();
    setMode(mode, true);
  });
});

// init
loadSettings();
setMode("focus", true);
render();
