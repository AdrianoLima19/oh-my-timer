import "../css/phosphor.css";
import "../css/styles.css";

/**
 * Para evitar uso de múltiplos eventListeners apenas um está sendo utilizado no container identificando o
 * parente do objeto clicado [nav|section] e executando as funcionalidades de acordo.
 */
document.querySelector("main").addEventListener("click", (event) => {
  if (event.target.closest("nav") && event.target.dataset?.type) {
    let parent = event.target?.nextElementSibling ?? event.target?.previousElementSibling;

    if (window.innerWidth > 1024 && !event.target?.hasAttribute("active")) toggleNavigationPanel(event.target, parent);
    if (window.innerWidth <= 1024) toggleNavigationPanel(parent, event.target);
  } else if (event.target.closest("section")?.id && event.target.dataset?.type) {
    let exec = event.target.closest("section").id === "timer" ? timerRoles : stopwatchRoles;
    let role = event.target.dataset.type;

    if (!role || typeof role !== "string") return;
    if (exec[role]) exec[role]();
  }
});

// Navigation

var navigation = localStorage.getItem("navigation") ?? "timer";

function toggleNavigationPanel(target, parent) {
  navigation = target.dataset.type;
  localStorage.setItem("navigation", navigation);

  resetDocumentTitle();

  target.toggleAttribute("active", true);
  parent.toggleAttribute("active", false);

  target.setAttribute("aria-expanded", true);
  parent.setAttribute("aria-expanded", false);

  document.querySelector(`.${target.dataset.type}`).toggleAttribute("active", true);
  document.querySelector(`.${parent.dataset.type}`).toggleAttribute("active", false);
}

function resetDocumentTitle() {
  document.title = "Oh My Timer";
}

function pushTimeToDocumentTitle(time) {
  document.title = `Oh My Timer - ${time[0]}:${time[1]}:${time[2]}`;
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
    toggleStopwatchState("play");

    stopwatchStamp = !stopwatchStamp ? Date.now() : stopwatchStamp + Date.now() - stopwatchFreezeTime;

    stopwatchWorker = new Worker("./assets/js/stopwatch.js");
    stopwatchWorker.postMessage(stopwatchStamp);
    stopwatchWorker.onmessage = (message) => pushStopwatchToDisplay(message.data);
  },
  pause() {
    stopwatchWorker.terminate();

    stopwatchFreezeTime = Date.now();

    toggleStopwatchState("pause");
  },
  replay() {
    stopwatchWorker.terminate();

    stopwatchStamp = stopwatchFreezeTime = false;

    stopwatchDisplay[0].textContent = stopwatchDisplay[1].textContent = "";
    stopwatchDisplay[2].textContent = stopwatchDisplay[3].textContent = "00";

    resetDocumentTitle();
    toggleStopwatchState("pause");
  },
};

function toggleStopwatchState(state) {
  stopwatchButtons.play.setAttribute("aria-hidden", state === "play");
  stopwatchButtons.pause.setAttribute("aria-hidden", state === "pause");
}

function pushStopwatchToDisplay(time) {
  if (navigation !== "stopwatch") return;

  pushTimeToDocumentTitle(time);

  stopwatchDisplay[3].textContent = time[3];
  stopwatchDisplay[2].textContent = time[2];
  if (time[1] !== "00") stopwatchDisplay[1].textContent = time[1];
  if (time[0] !== "00") stopwatchDisplay[0].textContent = time[0];
}

// Timer

const timerPanel = document.querySelector("#timer");
const timerDisplay = timerPanel.querySelectorAll(".display span");

var timerWorker,
  timerStamp,
  timerFreeze,
  timerOnGoing,
  isAudioEnabled,
  audioFile,
  isNotificationEnabled,
  timerNotification;

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
  restart: timerPanel.querySelector(".control .ph-arrows-counter-clockwise-fill"),
  check: timerPanel.querySelector(".control [finish].ph-check-fill"),
  speakerOn: timerPanel.querySelector(".control .ph-speaker-simple-high-fill"),
  speakerOff: timerPanel.querySelector(".control .ph-speaker-simple-slash-fill"),
  bellOn: timerPanel.querySelector(".control .ph-bell-ringing-fill"),
  bellOff: timerPanel.querySelector(".control .ph-bell-slash-fill"),
};

const timerRoles = {
  edit() {
    toggleTimerState("pause");

    timerWorker?.terminate();

    if (!timerFreeze) timerFreeze = Date.now();

    toggleTimerEditor(true);
  },
  close() {
    let time = timerOnGoing ? timerOnGoing - timerFreeze : timerStamp ? timerStamp : 0;

    pushStringToTimerDisplay(parseTimerStampToString(time), false);

    toggleTimerEditor(false);
  },
  save() {
    timerStamp = parseTimerStringToStamp(getTimerDisplayString());

    resetTimerClockVariables();

    toggleTimerEditor(false);
  },
  play() {
    if (getTimerDisplayString() === "000000" || timerStamp < 1000) return;

    toggleTimerState("play");

    timerOnGoing = !timerOnGoing ? timerStamp + 1000 + Date.now() : timerOnGoing - (timerFreeze - Date.now());

    timerWorker = new Worker("./assets/js/timer.js");
    timerWorker.postMessage(timerOnGoing);

    timerWorker.onmessage = (message) => {
      if (message.data) {
        pushStringToTimerDisplay(message.data);
      } else {
        timerWorker.terminate();

        pushStringToTimerDisplay("000000");

        if (isAudioEnabled) audioFile.play();
        if (isNotificationEnabled) pushTimerNotification();

        toggleFinishTimer(true);
      }
    };
  },
  pause() {
    toggleTimerState("pause");

    timerWorker.terminate();

    timerFreeze = Date.now();
  },
  reset() {
    toggleTimerState("pause");

    timerWorker?.terminate();

    resetDocumentTitle();
    resetTimerClockVariables();
    pushStringToTimerDisplay(parseTimerStampToString(timerStamp ?? 0), false, false);
  },
  restart() {
    audioFile?.pause();
    timerNotification?.close();

    this.reset();

    toggleFinishTimer(false);

    this.play();
  },
  check() {
    audioFile?.pause();
    timerNotification?.close();

    toggleTimerState("pause");
    resetTimerClockVariables();
    toggleFinishTimer(false);
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

function toggleTimerState(state) {
  timerButtons.play.setAttribute("aria-hidden", state === "play");
  timerButtons.pause.setAttribute("aria-hidden", state === "pause");
}

function toggleTimerEditor(state) {
  timerPanel.querySelector(".display input").toggleAttribute("edit", state);
  timerPanel.querySelector(".control").toggleAttribute("edit", state);
  timerButtons.close.setAttribute("aria-hidden", !state);
  timerButtons.save.setAttribute("aria-hidden", !state);
}

function pushStringToTimerDisplay(string, compare = true, pushToTile = true) {
  let array = string.match(/.{1,2}/g);

  if (navigation === "timer" && pushToTile) pushTimeToDocumentTitle(array);

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

function parseTimerStringToStamp(string) {
  let time = string.match(/.{1,2}/g);
  return time[0] * 3600000 + time[1] * 60000 + time[2] * 1000;
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

/**
 * Update UI after setup
 *
 * Não é necessário colocar scripts abaixo dentro do window.onload pois o arquivo é chamado
 * com atributo defer, executando este script só quando o html ja está pronto.
 */

(() => {
  let target = document.querySelector(`nav [data-type='${navigation}']`);
  let parent = target?.nextElementSibling ?? target?.previousElementSibling;
  toggleNavigationPanel(target, parent);
})();

toggleTimerSpeaker();
toggleTimerNotification();

/**
 * Caso website seja acessado em algum dispositivo móvel o script abaixo altera o tipo do input para int.
 */
let browserAgent = navigator.userAgent || navigator.vendor || window.opera;

if (
  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
    browserAgent
  ) ||
  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
    browserAgent.substr(0, 4)
  )
) {
  timerInput.type = "number";
}
