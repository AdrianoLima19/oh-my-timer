// todo page
const pageTimerButton = document.querySelector(".page-nav [data-timer]");
const pageStopwatchButton = document.querySelector(".page-nav [data-stopwatch]");
const pageTimerPanel = document.querySelector(".timer-panel");
const pageStopwatchPanel = document.querySelector(".stopwatch-panel");

pageTimerButton.addEventListener("click", () => {
  pageTimerButton.classList.toggle("active", true);
  pageStopwatchButton.classList.toggle("active", false);
  pageTimerPanel.classList.toggle("active", true);
  pageStopwatchPanel.classList.toggle("active", false);
});
pageStopwatchButton.addEventListener("click", () => {
  pageTimerButton.classList.toggle("active", false);
  pageStopwatchButton.classList.toggle("active", true);
  pageTimerPanel.classList.toggle("active", false);
  pageStopwatchPanel.classList.toggle("active", true);
});

// todo stopwatch
const stopwatchPlayButton = document.querySelector(".stopwatch-panel [data-play]");
const stopwatchPauseButton = document.querySelector(".stopwatch-panel [data-pause]");
const stopwatchResetButton = document.querySelector(".stopwatch-panel [data-reset]");

const stopwatchDisplay = document.querySelector(".stopwatch-panel .clock-panel");

var stopwatchStamp;
var [stopwatchHour, stopwatchMinute, stopwatchSecond, stopwatchMillisecond] = [0, 0, 0, 0];

stopwatchPlayButton.addEventListener("click", () => {
  if (!stopwatchStamp) stopwatchStamp = Date.now();
  stopwatchTimer = setInterval(runStopwatchTimer, 65);
  stopwatchButtonToggle();
});

function stopwatchButtonToggle() {
  stopwatchPlayButton.classList.toggle("hidden");
  stopwatchPauseButton.classList.toggle("hidden");
}

function runStopwatchTimer() {
  let clock = convertMillisecondToStringArray(Date.now() - stopwatchStamp);

  stopwatchDisplay.children[0].textContent =
    (clock["hr"] !== "00" ? `${clock["hr"]} : ` : "") +
    (clock["min"] !== "00" ? `${clock["min"]} : ` : "") +
    `${clock["sec"]} `;
  stopwatchDisplay.children[1].textContent = `. ${clock["ms"]}`;
}

function convertMillisecondToStringArray(millisecond) {
  let ms = Math.abs(parseInt(millisecond % 100, 10))
    .toString()
    .padStart(2, "0");
  let sec = Math.abs(parseInt(millisecond / 1000) % 60)
    .toString()
    .padStart(2, "0");
  let min = Math.abs(parseInt(millisecond / 60000) % 60)
    .toString()
    .padStart(2, "0");
  let hour = Math.abs(parseInt(millisecond / 3600000) % 60)
    .toString()
    .padStart(2, "0");

  return {
    hr: hour,
    min: min,
    sec: sec,
    ms: ms,
  };
}

stopwatchPauseButton.addEventListener("click", () => {
  clearInterval(stopwatchTimer);
  stopwatchButtonToggle();
});

stopwatchResetButton.addEventListener("click", () => {
  if (typeof stopwatchTimer !== "undefined") {
    clearInterval(stopwatchTimer);
    stopwatchTimer = undefined;
    stopwatchStamp = null;
    stopwatchPlayButton.classList.remove("hidden");
    stopwatchPauseButton.classList.add("hidden");
    stopwatchDisplay.children[0].textContent = `00 `;
    stopwatchDisplay.children[1].textContent = `. 00`;
  }
});

// todo timer
const timerEditButton = document.querySelector(".timer-panel [data-edit]");
const timerPlayButton = document.querySelector(".timer-panel [data-play]");
const timerPauseButton = document.querySelector(".timer-panel [data-pause]");
const timerResetButton = document.querySelector(".timer-panel [data-reset]");
const timerBellButtonOn = document.querySelector(".timer-panel [data-bell-on]");
const timerBellButtonOff = document.querySelector(".timer-panel [data-bell-off]");

const timerClockDisplay = document.querySelector(".timer-panel [data-display]");
const timerClockInput = document.querySelector(".timer-panel [data-input]");

const timerEditPanelSaveButton = document.querySelector(".timer-panel .edit-panel [data-save]");
const timerEditPanelCloseButton = document.querySelector(".timer-panel .edit-panel [data-close]");

var timerStamp;
var timerNotificationStatus;
var audio = new Audio("storage/sounds/ES_Alarm Clock Beep - SFX Producer.mp3");

timerNotificationStatus = localStorage.getItem("timerNotificationStatus") ?? Notification.permission;
timerNotificationStatus = timerNotificationStatus === "true" || timerNotificationStatus === "granted" ? true : false;

if (timerNotificationStatus) timerNotificationToggle();

timerEditButton.addEventListener("click", () => {
  resetTimerClock();
  timerEditPanelCloseButton.parentElement.classList.toggle("hidden");
  setTimeout(() => {
    timerEditButton.parentElement.classList.toggle("edit");
  }, 50);
  setTimeout(() => {
    timerClockInput.classList.toggle("edit");
  }, 75);
});

timerEditPanelCloseButton.addEventListener("click", () => {
  parseStringToTimerDisplay(convertTimerStampToString(timerStamp ?? 0));

  timerEditPanelCloseButton.parentElement.classList.toggle("hidden");
  timerEditButton.parentElement.classList.toggle("edit");
  timerClockInput.classList.toggle("edit");
});

timerEditPanelSaveButton.addEventListener("click", () => {
  let timerClockStamp = parseTimerDisplayToString().match(/.{1,2}/g);

  timerStamp = timerClockStamp[0] * 3600000 + timerClockStamp[1] * 60000 + timerClockStamp[2] * 1000;

  timerEditPanelSaveButton.parentElement.classList.toggle("hidden");
  timerEditButton.parentElement.classList.toggle("edit");
  timerClockInput.classList.toggle("edit");
});

timerClockInput.addEventListener("focusin", () => {
  parseStringToTimerDisplay("000000");
});

timerClockInput.addEventListener("keypress", (event) => {
  event.preventDefault();
  if (isNaN(event.key)) return;
  let input = parseTimerDisplayToString();
  parseStringToTimerDisplay(input.substring(1) + event.key);
});

function parseTimerDisplayToString() {
  return timerClockDisplay.textContent
    .replace(/\r?\n|\r/g, "")
    .replace(/:/g, "")
    .replaceAll(" ", "");
}

function parseStringToTimerDisplay(string) {
  let input = string.match(/.{1,1}/g);
  let loop = 0;
  timerClockDisplay.childNodes.forEach((e) => {
    if (e.tagName != "SPAN") return;
    e.textContent = input[loop++];
  });
}

function convertTimerStampToString(millisecond) {
  let sec = Math.abs(parseInt(millisecond / 1000) % 60)
    .toString()
    .padStart(2, "0");
  let min = Math.abs(parseInt(millisecond / 60000) % 60)
    .toString()
    .padStart(2, "0");
  let hour = Math.abs(parseInt(millisecond / 3600000) % 60)
    .toString()
    .padStart(2, "0");
  return `${hour}${min}${sec}`;
}

timerPlayButton.addEventListener("click", () => {
  if (!timerStamp) return;

  timerClockDisplayInterval = setInterval(runTimerClock, 1000);

  timerPlayButton.classList.toggle("hidden");
  timerPauseButton.classList.toggle("hidden");
});

timerPauseButton.addEventListener("click", () => {
  audio.pause();
  clearInterval(timerClockDisplayInterval);

  timerPlayButton.classList.toggle("hidden");
  timerPauseButton.classList.toggle("hidden");
});

function runTimerClock() {
  if ((timerStamp -= 1000) <= 0) {
    pushTimerNotificationToUser();
    clearInterval(timerClockDisplayInterval);
    audio.play();
  }

  parseStringToTimerDisplay(convertTimerStampToString(timerStamp));
}

timerResetButton.addEventListener("click", resetTimerClock);

function resetTimerClock() {
  if (typeof timerClockDisplayInterval !== "undefined") {
    audio.pause();
    clearInterval(timerClockDisplayInterval);
    timerClockDisplayInterval = undefined;
    timerStamp = 0;

    parseStringToTimerDisplay("000000");

    timerPlayButton.classList.toggle("hidden", false);
    timerPauseButton.classList.toggle("hidden", true);
  }
}

[timerBellButtonOff, timerBellButtonOn].forEach((element) => {
  element.addEventListener("click", async () => {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      timerNotificationStatus = timerNotificationStatus ? false : true;
      localStorage.setItem("timerNotificationStatus", timerNotificationStatus);
      timerNotificationToggle();
    }

    if (Notification.permission === "denied") {
      timerBellButtonOff.classList.add("shake");
    }
  });
});

timerBellButtonOff.addEventListener("animationend", () => {
  timerBellButtonOff.classList.remove("shake");
});

function timerNotificationToggle() {
  timerBellButtonOff.classList.toggle("hidden");
  timerBellButtonOn.classList.toggle("hidden");
}

function pushTimerNotificationToUser() {
  if (!timerNotificationStatus) return;
  var title = "Oh My Timer";
  var body = "Timer Finalizado!";
  new Notification(title, { body });
}
