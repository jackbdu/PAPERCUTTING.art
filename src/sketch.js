import { Paper, Scissors, renderP5, renderSvg, renderImage, renderStripes } from "./engine/index.js";
import { PaperPresets, PapercutPresets } from "./presets/index.js";
import { History, actionKeyIsPressed, makeFilename, downloadFile } from "./utils/index.js";

let stats;

if (import.meta.env.DEV) {
  import("stats.js").then(({ default: Stats }) => {
    stats = new Stats();
    document.body.appendChild(stats.dom);
  });
}

const MAX_USER_JSON_DATA_LENGTH = 1000000;
const MAX_USER_IMAGE_DATA_LENGTH = 1000000;

const CAPTURE_WIDTH = 1920;
const CAPTURE_DURATION = 300;
const CAPTURE_HEIGHT = 1080;
let captureIndex = 0;
const capture = P5Capture.getInstance();

const paperOptions = PaperPresets.SQUARE;

const history = new History();
let paper;
let scissors;
let image;
let video;
let userImage;

let showOverlap = false;

let fovy = 1;
const minFovy = 0.1;
const maxFovy = 1;
const mouseWheelSensitivity = 0.001;
const mouseMovementSensitivity = 1;
const orbitSensitivity = 0.2;
const cameraSensitivity = 1;
const scissorsBaseScale = 200;
let pointerLockError = false;
let refSize;
let texture;
let scrapCandidateTexture;
let overlay;

let mouseX = 0;
let mouseY = 0;
let canvas;

const interactionAllowed = () => capture?.state !== "capturing" && (document.pointerLockElement || pointerLockError);

const moveMouseBy = (dx, dy) => {
  const mouseMovementFactor = mouseMovementSensitivity * fovy;
  mouseX += dx * mouseMovementFactor;
  mouseY += dy * mouseMovementFactor;
};

const sketch = (p) => {
  const handleDroppedFile = (file) => {
    if (file.subtype === "json") {
      paper.loadPreset(file.data);
      history.save(paper);
      const stringifiedData = JSON.stringify(file.data);
      if (stringifiedData.length < MAX_USER_JSON_DATA_LENGTH) {
        try {
          localStorage.setItem("userJson", stringifiedData);
        } catch (e) {
          console.warn(e);
        }
      }
    } else if (file.type === "image") {
      // TODO: Implement SVG Parser
      /*
      if (file.data.startsWith("data:image/svg+xml;base64,")) {
        const svgDocument = new DOMParser().parseFromString(atob(file.data.split(",")[1]), "image/svg+xml");
        const pathD = svgDocument.querySelector("path").getAttribute("d");
        console.log(pathD, pathD.split(" "));
      }
      */
      if (userImage) userImage.remove();
      userImage = p.createImg(file.data, "", "", () => {
        const aspectRatio = userImage.width / userImage.height;
        showOverlap = true;
        overlay.background("#ffffff");
        overlay.image(userImage, 0, 0, overlay.width, overlay.height);
        paper.loadPreset({ width: 512 * aspectRatio, height: 512 });
      });
      if (file.data.length < MAX_USER_IMAGE_DATA_LENGTH) {
        try {
          localStorage.setItem("userImage", file.data);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  };

  p.setup = async () => {
    image = await p.loadImage("reference.png");
    canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    canvas.drop(handleDroppedFile);
    canvas.mousePressed(() => {
      if (!document.pointerLockElement) {
        try {
          document.body.requestPointerLock();
        } catch (e) {
          pointerLockError = true;
        }
      }
    });
    texture = p.createGraphics(paperOptions.width, paperOptions.height);
    scrapCandidateTexture = p.createGraphics(paperOptions.width, paperOptions.height);
    overlay = p.createGraphics(paperOptions.width, paperOptions.height);
    overlay.image(image, 0, 0, overlay.width, overlay.height);
    p.frameRate(120);
    paper = new Paper(paperOptions);
    paper.loadPreset(history.load() ?? {});
    scissors = new Scissors();
    scissors.hide();
    p.strokeWeight(1);
    p.strokeJoin(p.ROUND);
    p.strokeCap(p.ROUND);
    // p.debugMode();
    p.linePerspective(false);
    p.textureMode(p.NORMAL);
  };

  p.draw = () => {
    stats?.begin();

    const canvasAspectRatio = p.width / p.height;

    texture.blendMode(p.BLEND);
    texture.background(paper.fill);

    if (showOverlap) {
      texture.blendMode(p.DARKEST);
      texture.image(overlay, 0, 0, texture.width, texture.height);
    }
    p.texture(texture);

    p.perspective(fovy, canvasAspectRatio, 80, 8000);

    if (capture?.state !== "capturing") {
      if (captureIndex !== 0) {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        captureIndex = 0;
      }
      p.ambientLight(32);
      p.directionalLight(255, 255, 255, 0, 0, -1);
      refSize = Math.min(p.width, p.height);
      mouseX = p.constrain(mouseX, Math.min(-p.width / 2, -paper.width), Math.max(p.width / 2, paper.width));
      mouseY = p.constrain(mouseY, Math.min(-p.height / 2, -paper.height), Math.max(p.height / 2, paper.height));
      const orbitFactor = orbitSensitivity / refSize;
      const cameraFollowingFactor = p.map(fovy, minFovy, maxFovy, 1, 0);
      const cameraFactor = (cameraSensitivity / refSize) * 1000;
      p.camera(scissors.x * cameraFactor, scissors.y * cameraFactor, canvasAspectRatio < 1 ? 800 / canvasAspectRatio : 800, scissors.x * cameraFollowingFactor, scissors.y * cameraFollowingFactor, 0);
      p.rotateX(-scissors.y * orbitFactor);
      p.rotateY(scissors.x * orbitFactor);

      scissors.scale = scissorsBaseScale * fovy;
      scissors.update(p.deltaTime, mouseX, mouseY, paper.beingCut);
      paper.update(scissors.px, scissors.py, scissors.x, scissors.y, fovy);
      if (scissors.cuttingActivated && paper.cut(scissors.px, scissors.py, scissors.x, scissors.y)) {
        history.save(paper);
      }

      // RENDERING
      p.background("#fff");
      p.stroke("#000");
      // MIMICK DEPTH OF FIELD, TOO EXPENSIVE
      if (renderP5(p, paper.scrapsGraphics)) p.filter(p.BLUR, 2);

      renderP5(p, paper.mainPiecesGraphics);

      p.push();
      scrapCandidateTexture.background(paper.polycutColor);
      renderStripes(scrapCandidateTexture);
      p.texture(scrapCandidateTexture);
      renderP5(p, paper.scrapCandidatesGraphics);
      p.pop();

      p.push();
      // CLIPPING TO AVOID OVERFLOWING POLYCUTS
      if (paper.polycuts.length > 0) p.clip(() => renderP5(p, paper.piecesGraphics));
      renderP5(p, paper.polycutsGraphics);
      p.pop();

      p.translate(0, 0, 1);

      renderP5(p, scissors.graphics);
    } else {
      p.noStroke();
      p.ambientLight(128);
      p.spotLight(155, 155, 155, 1024, -1024, 2048, -0.5, 0.5, -1, Math.PI / 2, 10);
      const progress = captureIndex / CAPTURE_DURATION;
      p.camera(0, 0, 800);
      p.background("#fff");
      renderP5(p, paper.videoGraphics(progress));
      captureIndex++;
    }

    stats?.end();
  };

  p.mousePressed = (event) => {
    if (interactionAllowed()) {
      history.save(paper);
      scissors.beginCut();
      if (p.touches.length > 1) {
        scissors.endCut();
      }
    }
  };

  p.doubleClicked = (event) => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  };

  p.mouseReleased = (event) => {
    if (interactionAllowed()) {
      scissors.endCut();
      paper.filterScraps();
      history.save(paper);
    }
  };

  p.mouseMoved = (event) => {
    if (interactionAllowed()) moveMouseBy(event.movementX, event.movementY);
  };

  p.mouseDragged = (event) => {
    // history.save(paper);
    if (interactionAllowed()) moveMouseBy(event.movementX, event.movementY);
  };

  p.mouseWheel = (event) => {
    if (interactionAllowed()) fovy = p.constrain(fovy - event.delta * mouseWheelSensitivity, minFovy, maxFovy);
  };

  p.keyPressed = (event) => {
    switch (event.code) {
      case "KeyA":
        scissors.toggleAim();
        break;
      case "KeyB":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          if (capture?.state === "idle") {
            p.resizeCanvas(CAPTURE_WIDTH, CAPTURE_HEIGHT);
            capture?.start({
              width: CAPTURE_WIDTH,
              height: CAPTURE_HEIGHT,
            });
            captureIndex = 0;
          }
        }
        break;
      case "KeyC":
        if (video && video.loadedmetadata) {
          showOverlap = true;
          overlay.background("#ffffff");
          overlay.image(video, 0, 0, overlay.width, overlay.height);
        } else {
          video = p.createCapture(p.VIDEO, (stream) => {
            showOverlap = true;
            overlay.background("#ffffff");
            overlay.image(video, 0, 0, overlay.width, overlay.height);
          });
        }
        break;
      case "KeyE":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          downloadFile(`${makeFilename()}.svg`, renderSvg(paper.mainPiecesGraphics));
        }
        break;
      case "KeyF":
        p.fullscreen(!p.fullscreen());
        break;
      case "KeyH":
        document.body.classList.toggle("hide-info");
        break;
      case "KeyL":
        if (userImage) {
          showOverlap = true;
          overlay.background("#ffffff");
          overlay.image(userImage, 0, 0, overlay.width, overlay.height);
        } else if (localStorage.getItem("userImage")) {
          userImage = p.createImg(localStorage.getItem("userImage"), "", "", () => {
            showOverlap = true;
            overlay.background("#ffffff");
            overlay.image(userImage, 0, 0, overlay.width, overlay.height);
          });
        }
        break;
      case "KeyO":
        if (actionKeyIsPressed(event)) {
          renderImage(p, paper.imageGraphics);
        } else {
          showOverlap = true;
          overlay.background("#ffffff");
          overlay.image(image, 0, 0, overlay.width, overlay.height);
        }
        break;
      case "KeyP":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          renderImage(p, paper.printGraphics, { print: true, aspectRatio: Math.sqrt(2) });
        }
        break;
      case "KeyS":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          const exportJson = paper.toExport();
          downloadFile(`${makeFilename()}.json`, JSON.stringify(exportJson), "application/json");
          history.save(paper);
        } else {
          scissors.toggleBody();
        }
        break;
      case "KeyZ":
        if (actionKeyIsPressed(event) && event.shiftKey) {
          event.preventDefault();
          paper.loadPreset(history.loadNext());
        } else if (actionKeyIsPressed(event)) {
          event.preventDefault();
          paper.loadPreset(history.loadPrev());
        }
        break;
      case "Space":
        showOverlap = !showOverlap;
        break;
      case "ArrowLeft":
        paper.rotate(-Math.PI / 4);
        history.save(paper);
        break;
      case "ArrowRight":
        paper.rotate(Math.PI / 4);
        history.save(paper);
        break;
      case "ArrowUp":
        paper.flipX();
        history.save(paper);
        break;
      case "ArrowDown":
        paper.flipY();
        history.save(paper);
        break;
      case "Digit0":
        if (localStorage.getItem("userJson")) {
          paper.loadPreset(JSON.parse(localStorage.getItem("userJson")));
          history.save(paper);
        }
        break;
      case "Digit1":
        paper.loadPreset(PaperPresets.SQUARE);
        history.save(paper);
        break;
      case "Digit2":
        paper.loadPreset(PaperPresets.RECT_LANDSCAPE);
        history.save(paper);
        break;
      case "Digit3":
        paper.loadPreset(PaperPresets.RECT_PORTRAIT);
        history.save(paper);
        break;
      case "Digit4":
        paper.loadPreset(PaperPresets.DIAMOND);
        history.save(paper);
        break;
      case "Digit5":
        paper.loadPreset(PaperPresets.CIRCLE);
        history.save(paper);
        break;
      case "Digit6":
        paper.loadPreset(PaperPresets.ELLIPSE_LANDSCAPE);
        history.save(paper);
        break;
      case "Digit7":
        paper.loadPreset(PaperPresets.ELLIPSE_PORTRAIT);
        history.save(paper);
        break;
      case "Digit8":
        paper.loadPreset(JSON.parse(JSON.stringify(PapercutPresets.chun)));
        history.save(paper);
        break;
      case "Digit9":
        paper.loadPreset(JSON.parse(JSON.stringify(PapercutPresets.portrait)));
        history.save(paper);
        break;
    }
  };

  p.windowResized = (event) => {
    if (capture.state !== "capturing") p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

P5Capture.setDefaultOptions({
  format: "mp4",
  framerate: 60,
  bitrate: 10000,
  disableUi: true,
  verbose: true,
  duration: CAPTURE_DURATION,
  baseFilename: () => makeFilename("video"),
});

document.addEventListener("pointerlockchange", (event) => {
  if (!(document.pointerLockElement || pointerLockError)) {
    document.body.classList.remove("hide-info");
    scissors.hide();
    scissors.endCut();
    setTimeout(() => {
      if (!(document.pointerLockElement || pointerLockError)) {
        mouseX = 0;
        mouseY = 0;
      }
    }, 1000);
  } else {
    document.body.classList.add("hide-info");
    scissors.unhide();
  }
});

export { sketch };
