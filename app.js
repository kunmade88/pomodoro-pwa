let timeLeft = 25 * 60;
let timerId = null;
let isFocusMode = true;

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const bodyBg = document.getElementById('body-bg');
const modeText = document.getElementById('mode-text');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

startBtn.addEventListener('click', () => {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
        startBtn.innerText = '▶';
    } else {
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft === 0) {
                clearInterval(timerId);
                alert(isFocusMode ? "휴식 시간입니다!" : "집중 시간입니다!");
                toggleMode();
            }
        }, 1000);
        startBtn.innerText = 'II';
    }
});

function toggleMode() {
    isFocusMode = !isFocusMode;
    timeLeft = isFocusMode ? 25 * 60 : 5 * 60;
    bodyBg.className = isFocusMode ? 'bg-rose-50 min-h-screen flex items-center justify-center' : 'bg-emerald-50 min-h-screen flex items-center justify-center';
    modeText.innerText = isFocusMode ? 'Focus' : 'Break';
    modeText.className = isFocusMode ? 'px-6 py-2 bg-white rounded-full shadow-sm text-rose-600 font-bold' : 'px-6 py-2 bg-white rounded-full shadow-sm text-emerald-600 font-bold';
    updateDisplay();
}

resetBtn.addEventListener('click', () => {
    clearInterval(timerId);
    timerId = null;
    timeLeft = isFocusMode ? 25 * 60 : 5 * 60;
    startBtn.innerText = '▶';
    updateDisplay();
});
