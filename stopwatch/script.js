"use strict";

const timerOutput = document.getElementById("timer-output");
const toggleButton = document.getElementById("toggleBtn");
const resetButton = document.getElementById("resetBtn");

const timerState = {
  isActive: false,
  startTimestamp: 0,
  accumulatedTime: 0,
  animationId: 0,
};

const formatMilliseconds = (milliseconds) => {
  const centiseconds = Math.floor(milliseconds / 10);
  const cs = centiseconds % 100;

  const seconds = Math.floor(centiseconds / 100);
  const s = seconds % 60;

  const minutes = Math.floor(seconds / 60);
  const m = minutes % 60;

  const hours = Math.floor(minutes / 60);

  return (
    String(hours).padStart(2, "0") + ":" +
    String(m).padStart(2, "0") + ":" +
    String(s).padStart(2, "0") + "." +
    String(cs).padStart(2, "0")
  );
};

const updateDisplay = (ms) => {
  timerOutput.textContent = formatMilliseconds(ms);
};

const animationLoop = () => {
  if (!timerState.isActive) return;
  const currentTime = performance.now();
  const totalTime = timerState.accumulatedTime + (currentTime - timerState.startTimestamp);
  updateDisplay(totalTime);
  timerState.animationId = requestAnimationFrame(animationLoop);
};

const updateButtonStates = () => {
  toggleButton.textContent = timerState.isActive 
    ? "Pause" 
    : (timerState.accumulatedTime > 0 ? "Resume" : "Start");

  resetButton.disabled = timerState.isActive || timerState.accumulatedTime === 0;
};

const startTimer = () => {
  if (timerState.isActive) return;
  timerState.isActive = true;
  timerState.startTimestamp = performance.now();

  if (!timerState.animationId) {
    timerState.animationId = requestAnimationFrame(animationLoop);
  }

  updateButtonStates();
};

const pauseTimer = () => {
  if (!timerState.isActive) return;
  timerState.isActive = false;

  if (timerState.animationId) {
    cancelAnimationFrame(timerState.animationId);
  }
  timerState.animationId = 0;

  timerState.accumulatedTime += performance.now() - timerState.startTimestamp;
  updateDisplay(timerState.accumulatedTime);
  updateButtonStates();
};

const resetTimer = () => {
  if (timerState.isActive) return;
  if (timerState.animationId) {
    cancelAnimationFrame(timerState.animationId);
  }
  timerState.animationId = 0;

  timerState.startTimestamp = 0;
  timerState.accumulatedTime = 0;
  updateDisplay(0);
  updateButtonStates();
};

toggleButton.addEventListener("click", () => {
  timerState.isActive ? pauseTimer() : startTimer();
});

resetButton.addEventListener("click", resetTimer);

document.addEventListener("keydown", (event) => {
  const pressedKey = event.key;
  const keyCode = event.code;

  const isSpacebar = pressedKey === " " || keyCode === "Space";
  if (isSpacebar) {
    event.preventDefault();
    timerState.isActive ? pauseTimer() : startTimer();
    return;
  }

  if (pressedKey.toLowerCase() === "r") {
    resetTimer();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && timerState.isActive) {
    timerState.accumulatedTime += performance.now() - timerState.startTimestamp;
    timerState.startTimestamp = performance.now();
    updateDisplay(timerState.accumulatedTime);
    if (timerState.animationId) {
      cancelAnimationFrame(timerState.animationId);
    }
    timerState.animationId = 0;
  } else if (!document.hidden && timerState.isActive && !timerState.animationId) {
    timerState.startTimestamp = performance.now();
    timerState.animationId = requestAnimationFrame(animationLoop);
  }
});

updateDisplay(0);
updateButtonStates();
