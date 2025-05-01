import { seededRandom } from "./math.js";

// https://www.30secondsofcode.org/js/s/browser-os-detection/
const isMac = /mac/i.test(navigator.userAgent);

const actionKeyIsPressed = (event) => (isMac && event.metaKey) || (!isMac && event.ctrlKey);

const dateToFilenameString = (date) => {
  const yyyy = date.getFullYear();
  // MONTH STARTS WITH 0
  const MM = date.getMonth() + 1;
  const dd = date.getDate();
  const hh = date.getHours();
  const mm = date.getMinutes();
  const ss = date.getSeconds();
  return `${yyyy}-${MM}-${dd}-${hh}-${mm}-${ss}`;
};

const makeFilename = (subtitle = "", date = new Date()) => `PAPERCUTTING.art-${subtitle !== "" ? subtitle + "-" : ""}${dateToFilenameString(date)}`;

// https://www.delftstack.com/howto/javascript/javascript-download/
const downloadFile = (filename, data, type = "text/plain", charset = "utf-8") => {
  const element = document.createElement("a");
  element.setAttribute("href", `data:${type};charset=${charset},${encodeURIComponent(data)}`);
  element.setAttribute("download", filename);
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// https://javascript.info/task/shuffle
const getShuffledArrayWithSeed = (array, seed = 0) => {
  const random = seededRandom(seed);
  array = array.slice();
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(random() * (i + 1)); // random index from 0 to i

    // swap elements array[i] and array[j]
    // we use "destructuring assignment" syntax to achieve that
    // you'll find more details about that syntax in later chapters
    // same can be written as:
    // let t = array[i]; array[i] = array[j]; array[j] = t
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export { isMac, actionKeyIsPressed, dateToFilenameString, makeFilename, downloadFile, getShuffledArrayWithSeed };
