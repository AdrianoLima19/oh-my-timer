// Stopwatch

const stopwatchPanel = document.querySelector(".container .stopwatch");

const stopwatchElements = {
  display: stopwatchPanel.querySelectorAll(".display span"),
  playButton: stopwatchPanel.querySelector(".control .fa-play"),
  pauseButton: stopwatchPanel.querySelector(".control .fa-pause"),
};

var stopwatchStamp, stopwatchFreezeTime, runStopwatchClock;

const stopwatchRoles = {
  play() {
    toggleStopwatchState("play");

    stopwatchStamp = !stopwatchStamp ? Date.now() : stopwatchStamp + Date.now() - stopwatchFreezeTime;

    runStopwatchClock = setInterval(runStopwatchInterval, 75);
  },
  pause() {
    toggleStopwatchState("pause");

    stopwatchFreezeTime = Date.now();

    clearInterval(runStopwatchClock);
  },
  redo() {
    if (typeof runStopwatchClock !== "undefined") {
      clearInterval(runStopwatchClock);

      stopwatchStamp = stopwatchFreezeTime = runStopwatchClock = undefined;

      stopwatchElements.display[0].textContent = stopwatchElements.display[1].textContent = "";
      stopwatchElements.display[2].textContent = stopwatchElements.display[3].textContent = "00";

      toggleStopwatchState("pause");
    }
  },
};

stopwatchPanel.addEventListener("click", (event) => {
  let role = event.target.dataset.role;

  if (!role || typeof role !== "string") return;

  event.target.blur();

  if (stopwatchRoles[role]) stopwatchRoles[role]();
});

function toggleStopwatchState(state) {
  stopwatchElements.playButton.classList.toggle("hidden", state === "play");
  stopwatchElements.pauseButton.classList.toggle("hidden", state === "pause");
}

function runStopwatchInterval() {
  let time = parseStopwatchStampToArray(Date.now() - stopwatchStamp);
  let display = stopwatchElements.display;

  if (time[3] !== "00") display[3].textContent = time[3];
  if (time[2] !== "00" && time[2] !== display[2]) display[2].textContent = time[2];
  if (time[1] !== "00" && time[1] !== display[1]) display[1].textContent = time[1];
  if (time[0] !== "00" && time[0] !== display[0]) display[0].textContent = time[0];
}

function parseStopwatchStampToArray(millisecond) {
  let ms = Math.abs(parseInt(millisecond % 1000))
    .toString()
    .padStart(3, "0")
    .slice(0, -1);
  let sec = Math.abs(parseInt(millisecond / 1000) % 60)
    .toString()
    .padStart(2, "0");
  let min = Math.abs(parseInt(millisecond / 60000) % 60)
    .toString()
    .padStart(2, "0");
  let hr = Math.abs(parseInt(millisecond / 3600000) % 60)
    .toString()
    .padStart(2, "0");

  return [hr, min, sec, ms];
}

// Timer

const timerPanel = document.querySelector(".container .timer");

// var timerStamp = 2000, //timer -> 2s
var timerStamp = 300000, //timer -> 5m
  runTimer,
  freezeTimer,
  runTimerClock,
  timerNotification = JSON.parse(localStorage.getItem("timerNotification")) ?? false,
  playAudio = JSON.parse(localStorage.getItem("playAudio")) ?? true,
  audio = new Audio("storage/sounds/Alarm Clock Beep.mp3");

const timerElements = {
  play: timerPanel.querySelector(".control .fa-play"),
  pause: timerPanel.querySelector(".control .fa-pause"),
  timer: timerPanel.querySelectorAll(".display span"),
  display: timerPanel.querySelector(".display"),
  control: timerPanel.querySelector(".control"),
  volumeOn: timerPanel.querySelector(".control .fa-volume-up"),
  volumeOff: timerPanel.querySelector(".control .fa-volume-off"),
  bellOn: timerPanel.querySelector(".control .fa-bell"),
  bellOff: timerPanel.querySelector(".control .fa-bell-slash"),
  edit: timerPanel.querySelector(".display .edit"),
  input: timerPanel.querySelector(".display input"),
};

const timerRoles = {
  play() {
    if (parseTimerDisplayToString() === "000000") return;

    toggleTimerState("play");

    if (!runTimer) {
      // user's timer + now() + 1s delay
      runTimer = timerStamp + Date.now() + 1000;
    } else {
      runTimer -= freezeTimer - Date.now();
    }

    runTimerClock = setInterval(runTimerInterval, 250);
  },
  pause() {
    toggleTimerState("pause");

    freezeTimer = Date.now();

    clearInterval(runTimerClock);
  },
  redo() {
    toggleTimerState("pause");

    if (typeof runTimerClock !== "undefined") {
      clearInterval(runTimerClock);

      runTimer = freezeTimer = runTimerClock = undefined;

      parseTimerStringToDisplay(parseTimerStampToString(timerStamp ?? 0), true);
    }
  },
  check() {
    audio.pause();

    toggleTimerState("pause");

    if (typeof notifyTimer !== "undefined") notifyTimer.close();

    timerElements.control.classList.toggle("finished");
  },
  replay() {
    audio.pause();

    this.redo();
    this.play();

    timerElements.control.classList.toggle("finished");
  },
  volumeOn() {
    localStorage.setItem("playAudio", false);

    playAudio = false;

    toggleAudioState("on");
  },
  volumeOff() {
    localStorage.setItem("playAudio", true);

    playAudio = true;

    toggleAudioState("off");
  },
  bellOff() {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      toggleNotificationSate("off");

      localStorage.setItem("timerNotification", true);

      timerNotification = true;
    }

    if (Notification.permission === "denied") {
      // shake the icon
    }
  },
  bellOn() {
    toggleNotificationSate("on");

    localStorage.setItem("timerNotification", false);

    timerNotification = false;
  },
  edit() {
    toggleTimerState("pause");

    if (typeof runTimerClock !== "undefined") {
      clearInterval(runTimerClock);
    }

    toggleTimerEdit();
  },
  close() {
    let value;

    if (typeof runTimer !== "undefined") value = runTimer - freezeTimer;

    parseTimerStringToDisplay(parseTimerStampToString(value ?? timerStamp ?? 0), true);

    toggleTimerEdit();
  },
  save() {
    let timer = parseTimerDisplayToString().match(/.{1,2}/g);

    toggleTimerState("pause");

    if (typeof runTimerClock !== "undefined") {
      clearInterval(runTimerClock);

      runTimer = freezeTimer = runTimerClock = undefined;
    }

    timerStamp = timer[0] * 3600000 + timer[1] * 60000 + timer[2] * 1000;

    toggleTimerEdit();
  },
};

timerPanel.addEventListener("click", (event) => {
  let role = event.target.dataset.role;

  if (!role && typeof role !== "string") return;

  event.target.blur();

  if (timerRoles[role]) timerRoles[role]();
});

timerElements.input.addEventListener("focus", () => {
  parseTimerStringToDisplay(parseTimerStampToString(0), true);
});

timerElements.input.onkeydown = (event) => {
  if (event.key == "Enter") timerRoles.save();
};

timerElements.input.addEventListener("textInput", (event) => {
  event.preventDefault();

  if (isNaN(event.data)) return;

  parseTimerStringToDisplay(parseTimerDisplayToString().substring(1) + event.data);
});

function toggleTimerState(state) {
  timerElements.play.classList.toggle("hidden", state === "play");
  timerElements.pause.classList.toggle("hidden", state === "pause");
}

function runTimerInterval() {
  let time = runTimer - Date.now();

  if (time < 1000) {
    clearInterval(runTimerClock);

    if (playAudio) audio.play();
    if (timerNotification) pushTimerNotification();

    timerElements.control.classList.toggle("finished");

    runTimer = 0;
  }

  parseTimerStringToDisplay(parseTimerStampToString(time));
}

function parseTimerStringToDisplay(string, push = false) {
  let array = string.match(/.{1,2}/g);
  let timer = timerElements.timer;

  if (array[0] !== timer[0] || push) timer[0].textContent = array[0];
  if (array[1] !== timer[1] || push) timer[1].textContent = array[1];
  if (array[2] !== timer[2] || push) timer[2].textContent = array[2];
}

function parseTimerStampToString(millisecond) {
  let sec = Math.floor(parseInt(millisecond / 1000) % 60)
    .toString()
    .padStart(2, "0");
  let min = Math.floor(parseInt(millisecond / 60000) % 60)
    .toString()
    .padStart(2, "0");
  let hour = Math.floor(parseInt(millisecond / 3600000))
    .toString()
    .padStart(2, "0");

  return `${hour}${min}${sec}`;
}

function toggleAudioState(state) {
  timerElements.volumeOn.classList.toggle("hidden", state === "on");
  timerElements.volumeOff.classList.toggle("hidden", state === "off");
}

function toggleNotificationSate(state) {
  timerElements.bellOn.classList.toggle("hidden", state === "on");
  timerElements.bellOff.classList.toggle("hidden", state === "off");
}

function pushTimerNotification() {
  if (!timerNotification) return;

  let title = "Oh My Timer";
  let body = "Timer Finalizado!";
  let icon = "./favicon.png";

  notifyTimer = new Notification(title, { body, icon }); // var|let não atribuído para variável vazar para escopo global
}

function toggleTimerEdit() {
  timerElements.edit.classList.toggle("active");
  timerElements.input.classList.toggle("active");
  timerElements.control.classList.toggle("active");
}

function parseTimerDisplayToString() {
  return timerElements.display.textContent
    .replace(/\r?\n|\r/g, "")
    .replace(/:/g, "")
    .replaceAll(" ", "");
}

// Navigation

const navigationPanel = document.querySelector(".container nav");

const navigationElements = {
  timerButton: navigationPanel.querySelector("[data-role='timer']"),
  stopwatchButton: navigationPanel.querySelector("[data-role='stopwatch']"),
};

navigationPanel.addEventListener("click", (event) => {
  let toggle = event.target.dataset.role;

  if (!toggle || typeof toggle !== "string") return;

  event.target.blur();

  let button = navigationPanel.querySelector(`[data-role='${toggle}']`);
  let width = window.innerWidth;

  if (width >= 1200) {
    if (button.classList.contains(".active")) return;

    togglePanel(toggle);
    return;
  }

  togglePanel(toggle == "timer" ? "stopwatch" : "timer");
});

function togglePanel(panel) {
  navigationElements.timerButton.classList.toggle("active", panel === "timer");
  navigationElements.stopwatchButton.classList.toggle("active", panel === "stopwatch");

  timerPanel.classList.toggle("active", panel === "timer");
  stopwatchPanel.classList.toggle("active", panel === "stopwatch");
}

// Caso website seja acessado em algum dispositivo móvel
// o script abaixo altera o tipo do input para int.
let browserAgent = navigator.userAgent || navigator.vendor || window.opera;

if (
  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
    browserAgent
  ) ||
  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
    browserAgent.substr(0, 4)
  )
) {
  timerElements.input.type = "number";
}

// Document Ready

// Não é necessário colocar if statements em window.onload pois arquivo é chamado
// com atributo defer que so executa script quando html está pronto
if (playAudio === false) timerRoles.volumeOn(); // toggle state to off
if (timerNotification === true) timerRoles.bellOff(); // toggle state to on
