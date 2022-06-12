import "../css/phosphor.css";
import "../css/styles.css";

/** */
document.querySelector("main").addEventListener("click", (event) => {
  if (event.target.closest("nav") && event.target?.dataset.type) {
    let parent = event.target?.nextElementSibling || event.target?.previousElementSibling;

    if (window.innerWidth > 1024) {
      if (!event.target?.hasAttribute("active")) toggleNavigationState(event.target, parent);
    } else {
      toggleNavigationState(parent, event.target);
    }

    return;
  } else if (event.target.closest("section")?.id && event.target?.dataset.type) {
    let role = event.target.dataset.type;
    let exec = event.target.closest("section").id === "timer" ? timerRoles : stopwatchRoles;

    event.target.blur();

    if (!role || typeof role !== "string") return;
    if (exec[role]) exec[role]();

    return;
  }
});

var navigation;

function toggleNavigationState(target, parent) {
  navigation = target.dataset.type;

  target.toggleAttribute("active", true);
  parent.toggleAttribute("active", false);

  target.setAttribute("aria-expanded", true);
  parent.setAttribute("aria-expanded", false);

  document.querySelector(`.${target.dataset.type}`).toggleAttribute("active", true);
  document.querySelector(`.${parent.dataset.type}`).toggleAttribute("active", false);
}

// Stopwatch

const stopwatchPanel = document.querySelector("#stopwatch");
const stopwatchDisplay = stopwatchPanel.querySelectorAll(".display span");

var stopwatchWorker, stopwatchStamp, stopwatchFreezeTime;

const stopwatchButtons = {
  play: stopwatchPanel.querySelector(".control .ph-play-fill"),
  pause: stopwatchPanel.querySelector(".control .ph-pause-fill"),
};

const stopwatchRoles = {
  play() {
    toggleStopwatchButtonState("play");
    stopwatchStamp = !stopwatchStamp ? Date.now() : stopwatchStamp + Date.now() - stopwatchFreezeTime;
    stopwatchWorker = new Worker("./assets/js/stopwatch.js");
    stopwatchWorker.postMessage(stopwatchStamp);
    stopwatchWorker.onmessage = (message) => updateStopwatchDisplay(message.data);
  },
  pause() {
    toggleStopwatchButtonState("pause");
    stopwatchWorker.terminate();
    stopwatchFreezeTime = Date.now();
  },
  replay() {
    toggleStopwatchButtonState("pause");
    stopwatchStamp = stopwatchFreezeTime = false;
    stopwatchDisplay[0].textContent = stopwatchDisplay[1].textContent = "";
    stopwatchDisplay[2].textContent = stopwatchDisplay[3].textContent = "00";
  },
};

function toggleStopwatchButtonState(state) {
  stopwatchButtons.play.setAttribute("aria-hidden", state === "play");
  stopwatchButtons.pause.setAttribute("aria-hidden", state === "pause");
}

function updateStopwatchDisplay(time) {
  if (navigation !== "stopwatch") return;
  if (time[3] !== "00") stopwatchDisplay[3].textContent = time[3];
  if (time[2] !== "00" && time[2] !== stopwatchDisplay[2]) stopwatchDisplay[2].textContent = time[2];
  if (time[1] !== "00" && time[1] !== stopwatchDisplay[1]) stopwatchDisplay[1].textContent = time[1];
  if (time[0] !== "00" && time[0] !== stopwatchDisplay[0]) stopwatchDisplay[0].textContent = time[0];
}

// Timer

const timerPanel = document.querySelector("#timer");
const timerDisplay = timerPanel.querySelectorAll(".display span");

var timerWorker, timerStamp, timerFreeze, timerOnGoing, isAudioEnabled, audioFile, isNotificationEnabled, timerNotification;

timerStamp = 2000; // 2s
timerStamp = 300000; // 5m

audioFile = new Audio("./assets/audio/Alarm Clock Beep.mp3");
isAudioEnabled = JSON.parse(localStorage.getItem("isAudioEnabled")) ?? true;
isNotificationEnabled = JSON.parse(localStorage.getItem("isNotificationEnabled")) ?? false;

const timerButtons = {
  play: timerPanel.querySelector(".control .ph-play-fill"),
  pause: timerPanel.querySelector(".control .ph-pause-fill"),
  close: timerPanel.querySelector(".control .ph-x-fill"),
  save: timerPanel.querySelector(".control [edit].ph-check-fill"),
  check: timerPanel.querySelector(".control [finish].ph-check-fill"),
  restart: timerPanel.querySelector(".control .ph-arrows-counter-clockwise-fill"),
  speakerOn: timerPanel.querySelector(".control .ph-speaker-simple-high-fill"),
  speakerOff: timerPanel.querySelector(".control .ph-speaker-simple-slash-fill"),
  bellOn: timerPanel.querySelector(".control .ph-bell-ringing-fill"),
  bellOff: timerPanel.querySelector(".control .ph-bell-slash-fill"),
};

const timerRoles = {
  edit() {
    toggleTimerButtonState("pause");
    timerWorker?.terminate();
    timerFreeze = Date.now();
    toggleTimerEditor(true);
  },
  save() {
    timerStamp = parseTimerStringToStamp(getTimerDisplayString());
    resetTimerClockVariables();
    toggleTimerEditor(false);
  },
  close() {
    let time = timerOnGoing ? timerOnGoing - timerFreeze : timerStamp ? timerStamp : 0;
    pushStringToTimerDisplay(parseTimerStampToString(time), false);
    toggleTimerEditor(false);
  },
  play() {
    if (getTimerDisplayString() === "000000" || timerStamp < 1000) return;
    toggleTimerButtonState("play");
    timerOnGoing = !timerOnGoing ? timerStamp + 1000 + Date.now() : timerOnGoing - (timerFreeze - Date.now());
    timerWorker = new Worker("./assets/js/timer.js");
    timerWorker.postMessage(timerOnGoing);
    timerWorker.onmessage = (message) => {
      if (!message.data) {
        timerWorker.terminate();
        pushStringToTimerDisplay("000000");
        if (isAudioEnabled) audioFile.play();
        if (isNotificationEnabled) pushTimerNotification();
        toggleFinishTimer(true);
      } else {
        pushStringToTimerDisplay(message.data);
      }
    };
  },
  pause() {
    toggleTimerButtonState("pause");
    timerWorker.terminate();
    timerFreeze = Date.now();
  },
  reset() {
    toggleTimerButtonState("pause");
    timerWorker?.terminate();
    resetTimerClockVariables();
    pushStringToTimerDisplay(parseTimerStampToString(timerStamp ?? 0), false);
  },
  check() {
    audioFile?.pause();
    timerNotification?.close();
    toggleTimerButtonState("pause");
    resetTimerClockVariables();
    toggleFinishTimer(false);
  },
  restart() {
    audioFile?.pause();
    timerNotification?.close();
    this.reset();
    toggleFinishTimer(false);
    this.play();
  },
  speakerOn() {
    localStorage.setItem("isAudioEnabled", false);
    isAudioEnabled = false;
    toggleTimerSpeaker();
  },
  speakerOff() {
    localStorage.setItem("isAudioEnabled", true);
    isAudioEnabled = true;
    toggleTimerSpeaker();
  },
  bellOn() {
    localStorage.setItem("isNotificationEnabled", false);
    isNotificationEnabled = false;
    toggleTimerNotification();
  },
  async bellOff() {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      localStorage.setItem("isNotificationEnabled", true);
      isNotificationEnabled = true;
      toggleTimerNotification();
    }
    if (Notification.permission === "denied") {
      // shake the icon
    }
  },
};

function toggleTimerButtonState(state) {
  timerButtons.play.setAttribute("aria-hidden", state === "play");
  timerButtons.pause.setAttribute("aria-hidden", state === "pause");
}

function toggleTimerEditor(state) {
  timerPanel.querySelector(".display input").toggleAttribute("edit", state);
  timerPanel.querySelector(".control").toggleAttribute("edit", state);
  timerButtons.close.setAttribute("aria-hidden", !state);
  timerButtons.save.setAttribute("aria-hidden", !state);
}

function pushStringToTimerDisplay(string, compare = true) {
  let array = string.match(/.{1,2}/g);

  if (compare) {
    if (timerDisplay[0] !== array[0]) timerDisplay[0].textContent = array[0];
    if (timerDisplay[1] !== array[1]) timerDisplay[1].textContent = array[1];
    if (timerDisplay[2] !== array[2]) timerDisplay[2].textContent = array[2];
  } else {
    timerDisplay[0].textContent = array[0];
    timerDisplay[1].textContent = array[1];
    timerDisplay[2].textContent = array[2];
  }
}

function parseTimerStringToStamp(string) {
  let time = string.match(/.{1,2}/g);
  return time[0] * 3600000 + time[1] * 60000 + time[2] * 1000;
}

function parseTimerStampToString(stamp) {
  let sec = Math.floor(parseInt(stamp / 1000) % 60)
    .toString()
    .padStart(2, "0");
  let min = Math.floor(parseInt(stamp / 60000) % 60)
    .toString()
    .padStart(2, "0");
  let hour = Math.floor(parseInt(stamp / 3600000))
    .toString()
    .padStart(2, "0");

  return `${hour}${min}${sec}`;
}

function getTimerDisplayString() {
  return timerPanel
    .querySelector(".display")
    .textContent.replace(/\r?\n|\r/g, "")
    .replace(/:/g, "")
    .replaceAll(" ", "");
}

function resetTimerClockVariables() {
  timerFreeze = timerOnGoing = 0;
}

function toggleFinishTimer(state) {
  timerPanel.querySelector(".control").toggleAttribute("finish", state);
  timerButtons.restart.setAttribute("aria-hidden", !state);
  timerButtons.check.setAttribute("aria-hidden", !state);
}

function toggleTimerSpeaker() {
  timerButtons.speakerOn.setAttribute("aria-hidden", !isAudioEnabled);
  timerButtons.speakerOff.setAttribute("aria-hidden", isAudioEnabled);
}

function toggleTimerNotification() {
  timerButtons.bellOn.setAttribute("aria-hidden", !isNotificationEnabled);
  timerButtons.bellOff.setAttribute("aria-hidden", isNotificationEnabled);
}

function pushTimerNotification() {
  if (!isNotificationEnabled) return;

  timerNotification = new Notification("Oh My Timer", { body: "Timer Finalizado!" });
}

// Timer Input

const timerInput = timerPanel.querySelector(".display input");

timerInput.addEventListener("focus", () => pushStringToTimerDisplay("000000", false));

timerInput.onkeydown = (key) => {
  if (key.key === "Enter") timerRoles.save();
};

timerInput.addEventListener("textInput", (key) => {
  key.preventDefault();
  if (isNaN(key.data)) return;
  pushStringToTimerDisplay(getTimerDisplayString().substring(1) + key.data);
});

// Update UI after setup

toggleTimerSpeaker();
toggleTimerNotification();
