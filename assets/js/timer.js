var clock;

self.onmessage = (e) => {
  clock = setInterval(() => {
    let timestamp = e.data - Date.now();
    if (timestamp < 1000) {
      postMessage(false);
      clearInterval(clock);
    }
    postMessage(convertTimerStampToString(timestamp));
  }, 1000);
};

function convertTimerStampToString(millisecond) {
  let sec = Math.abs(parseInt(millisecond / 1000) % 60)
    .toString()
    .padStart(2, "0");
  let min = Math.abs(parseInt(millisecond / 60000) % 60)
    .toString()
    .padStart(2, "0");
  let hr = Math.abs(parseInt(millisecond / 3600000) % 60)
    .toString()
    .padStart(2, "0");

  return `${hr}${min}${sec}`;
}
