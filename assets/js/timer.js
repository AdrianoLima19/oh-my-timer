var clock;

self.onmessage = (timestamp) => {
  clock = setInterval(() => {
    let time = timestamp.data - Date.now();

    if (time < 1000) {
      postMessage(false);
      clearInterval(clock);
    } else {
      let sec = Math.abs(parseInt(time / 1000) % 60)
        .toString()
        .padStart(2, "0");
      let min = Math.abs(parseInt(time / 60000) % 60)
        .toString()
        .padStart(2, "0");
      let hr = Math.abs(parseInt(time / 3600000) % 60)
        .toString()
        .padStart(2, "0");

      postMessage(`${hr}${min}${sec}`);
    }
  }, 1000);
};
