self.onmessage = (timestamp) => {
  setInterval(() => {
    let time = Date.now() - timestamp.data;

    let ms = Math.abs(parseInt(time % 1000))
      .toString()
      .padStart(3, "0")
      .slice(0, -1);
    let sec = Math.abs(parseInt(time / 1000) % 60)
      .toString()
      .padStart(2, "0");
    let min = Math.abs(parseInt(time / 60000) % 60)
      .toString()
      .padStart(2, "0");
    let hr = Math.abs(parseInt(time / 3600000) % 60)
      .toString()
      .padStart(2, "0");

    postMessage([hr, min, sec, ms]);
  }, 75);
};
