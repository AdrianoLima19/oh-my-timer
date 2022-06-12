self.onmessage = (e) => {
  setInterval(() => {
    let timestamp = Date.now() - e.data;
    postMessage(parseTimestampToTime(timestamp));
  }, 75);
};

function parseTimestampToTime(millisecond) {
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
