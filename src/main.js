import "./styles/main.css";
import { isMac } from "./utils/index.js";
import { sketch } from "./sketch.js";

if (isMac) document.body.classList.add("mac");

new p5(sketch, document.querySelector("#app"));
