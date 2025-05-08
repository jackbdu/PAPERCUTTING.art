import { Interface, Paper, Scissors, renderP5, renderSvg, renderImage, renderStripes } from "./engine/index.js";
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
let userInterface;
let paper;
let scissors;
let image;
let video;
let userImage;
let fileInput;

let showOverlap = false;

let fovy = 1.2;
const minFovy = 0.1;
const maxFovy = 1.5;
const maxCameraFollowingFovy = 1.2;
const mouseWheelSensitivity = 0.001;
const mouseMovementSensitivity = 1;
const orbitSensitivity = 0.2;
const cameraSensitivity = 1;
const scissorsBaseScale = 200;
let pointerLockError = false;
let canvas;
let texture;
let scrapCandidateTexture;
let overlay;

let mouseX = 0;
let mouseY = 0;
let ptouchX = 0;
let ptouchY = 0;
let touchX = 0;
let touchY = 0;

let reduceAnimation = false;
let slowFrames = 0;
let paperPreset;
let farClippingDistance = 8000;
let nearClippingDistance = 80;
const maxSlowFrames = 60;
const minFrameRate = 30;

const interactionAllowed = () => capture?.state !== "capturing" && (document.pointerLockElement || pointerLockError);

const moveMouseBy = (dx, dy) => {
  const mouseMovementFactor = mouseMovementSensitivity * fovy;
  mouseX += dx * mouseMovementFactor;
  mouseY += dy * mouseMovementFactor;
};

const applyMainScene = (p) => {
  const canvasAspectRatio = p.width / p.height;
  const refSize = Math.min(p.width, p.height);
  const orbitFactor = orbitSensitivity / refSize;
  const cameraFollowingFactor = p.constrain(p.map(fovy, minFovy, maxCameraFollowingFovy, 1, 0), 0, 1);
  const cameraFactor = (cameraSensitivity / refSize) * 1000;
  p.perspective(fovy, canvasAspectRatio, nearClippingDistance, farClippingDistance);
  p.camera(scissors.x * cameraFactor, scissors.y * cameraFactor, canvasAspectRatio < 1 ? 800 / canvasAspectRatio : 800, scissors.x * cameraFollowingFactor, scissors.y * cameraFollowingFactor, 0);
  p.rotateX(-scissors.y * orbitFactor);
  p.rotateY(scissors.x * orbitFactor);

  p.ambientLight(64);
  p.directionalLight(255, 255, 255, 0, 0, -1);
  p.background("#fff");
  p.stroke("#000");
};

const applyVideoScene = (p) => {
  const canvasAspectRatio = p.width / p.height;
  p.perspective(fovy, canvasAspectRatio, 80, 8000);
  p.camera(0, 0, 800);

  p.ambientLight(100);
  p.spotLight(200, 200, 200, 1024, -1024, 2048, -0.5, 0.5, -1, Math.PI / 2, 10);

  p.background("#fff");
  p.noStroke();
};

const updateScissors = (p) => {
  scissors.scale = scissorsBaseScale * fovy;
  scissors.update(p.deltaTime, mouseX, mouseY, paper.beingCut);
};

const updatePaper = (p) => {
  paper.update(scissors.px, scissors.py, scissors.x, scissors.y, fovy);
  if (scissors.cuttingActivated && paper.cut(scissors.px, scissors.py, scissors.x, scissors.y)) {
    history.save(paper.toSnapshot());
  }
};

const updateUserInterface = (p) => {
  userInterface.update(scissors.px, scissors.py, scissors.x, scissors.y, fovy);
};

const updateEngines = (p) => {
  updateScissors(p);
  updateUserInterface(p);
  updatePaper(p);
};

const renderUserInterface = (p) => {
  renderP5(p, userInterface.getMainPiecesGraphics());
  renderP5(p, userInterface.getScrapCandidatesGraphics());
};

const renderScraps = (p) => {
  const paperHasScraps = renderP5(p, paper.getScrapsGraphics());
  const userInterfaceHasScraps = renderP5(p, userInterface.getScrapsGraphics());
  if ((paperHasScraps || userInterfaceHasScraps) && !reduceAnimation) p.filter(p.BLUR, 2);
};

const renderPaper = (p) => {
  renderP5(p, paper.getMainPiecesGraphics());

  p.push();
  scrapCandidateTexture.background(paper.polycutColor);
  renderStripes(scrapCandidateTexture);
  p.texture(scrapCandidateTexture);
  renderP5(p, paper.getScrapCandidatesGraphics());
  p.pop();

  p.push();
  // CLIPPING TO AVOID OVERFLOWING POLYCUTS
  if (paper.polycuts.length > 0) p.clip(() => renderP5(p, paper.getPiecesGraphics()));
  renderP5(p, paper.getPolycutsGraphics());
  p.pop();
};

const renderScissors = (p) => {
  renderP5(p, scissors.graphics);
};

const applyTexture = (p) => {
  texture.blendMode(p.BLEND);
  texture.background(paper.fill);
  if (showOverlap) {
    texture.blendMode(p.DARKEST);
    texture.image(overlay, 0, 0, texture.width, texture.height);
  }
  p.texture(texture);
};

const constrainMousePosition = (p) => {
  mouseX = p.constrain(mouseX, Math.min(-p.width / 2, -paper.width), Math.max(p.width / 2, paper.width));
  mouseY = p.constrain(mouseY, Math.min(-p.height / 2, -paper.height), Math.max(p.height / 2, paper.height));
};

const renderMainGraphics = (p) => {
  constrainMousePosition(p);

  applyMainScene(p);
  updateEngines(p);

  applyTexture(p);
  renderScraps(p);
  renderPaper(p);
  p.translate(0, 0, 1);
  renderUserInterface(p);
  p.translate(0, 0, 1);
  renderScissors(p);
};

const renderVideoGraphics = (p) => {
  applyVideoScene(p);
  applyTexture(p);
  const progress = captureIndex / CAPTURE_DURATION;
  renderP5(p, paper.toVideoGraphics(progress));
};

const handleFile = (p, file) => {
  if (file.subtype === "json") {
    paper.loadPreset(file.data);
    history.save(paper.toSnapshot());
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

const RenderingSetup = (p) => {
  p.frameRate(120);
  p.strokeWeight(1);
  p.strokeJoin(p.ROUND);
  p.strokeCap(p.ROUND);
  p.linePerspective(false);
  p.textureMode(p.NORMAL);
};

const canvasSetup = (p) => {
  canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
  canvas.drop((file) => handleFile(p, file));
  canvas.mousePressed(() => {
    if (!document.pointerLockElement) {
      try {
        document.body.requestPointerLock();
      } catch (e) {
        pointerLockError = true;
      }
    }
  });
};

const enginesSetup = (p) => {
  userInterface = new Interface();
  paper = new Paper(paperOptions);
  paper.loadPreset(history.load() ?? {});
  scissors = new Scissors();
  scissors.hide();
};

const loadAssets = async (p) => {
  image = await p.loadImage("reference.png");
};

const offscreenGraphicsSetup = (p) => {
  texture = p.createGraphics(paperOptions.width, paperOptions.height);
  scrapCandidateTexture = p.createGraphics(paperOptions.width, paperOptions.height);
  overlay = p.createGraphics(paperOptions.width, paperOptions.height);
  overlay.image(image, 0, 0, overlay.width, overlay.height);
};
const fileInputsSetup = (p) => {
  fileInput = p.createFileInput((file) => handleFile(p, file), false);
  fileInput.hide();
};

const runCommand = (p, command) => {
  switch (command) {
    case "exit":
      if (document.pointerLockElement) document.exitPointerLock();
      break;
    case "menu":
      userInterface.toggleSecondary();
      break;
    case "undo":
      paper.loadPreset(history.loadPrev());
      break;
    case "redo":
      paper.loadPreset(history.loadNext());
      break;
    case "square":
      paperPreset = paperPreset === PaperPresets.SQUARE ? PaperPresets.DIAMOND : PaperPresets.SQUARE;
      paper.loadPreset(paperPreset);
      history.save(paper.toSnapshot());
      break;
    case "circle":
      paperPreset = paperPreset === PaperPresets.CIRCLE ? PaperPresets.ELLIPSE_LANDSCAPE : PaperPresets.CIRCLE;
      paper.loadPreset(paperPreset);
      history.save(paper.toSnapshot());
      break;
    case "a4":
      paperPreset = paperPreset === PaperPresets.RECT_LANDSCAPE ? PaperPresets.RECT_PORTRAIT : PaperPresets.RECT_LANDSCAPE;
      paper.loadPreset(paperPreset);
      history.save(paper.toSnapshot());
      break;
    case "example":
      // TODO: add more examples, use an array
      const example1 = JSON.stringify(PapercutPresets.chun);
      const example2 = JSON.stringify(PapercutPresets.portrait);
      paperPreset = JSON.stringify(paperPreset) === example1 ? JSON.parse(example2) : JSON.parse(example1);
      paper.loadPreset(paperPreset);
      history.save(paper.toSnapshot());
      break;
    case "load":
      fileInput.elt.click();
      break;
    case "help":
      document.body.classList.toggle("hide-help");
      break;
    case "closer":
      fovy -= 0.2;
      fovy = p.constrain(fovy, minFovy, maxFovy);
      break;
    case "farther":
      fovy += 0.2;
      fovy = p.constrain(fovy, minFovy, maxFovy);
      break;
    case "full":
      p.fullscreen(!p.fullscreen());
      break;
    case "scissors":
      scissors.cycleDisplay();
      break;
    case "overlay":
      showOverlap = !showOverlap;
      if (showOverlap && userImage) {
        overlay.background("#ffffff");
        overlay.image(userImage, 0, 0, overlay.width, overlay.height);
      } else if (showOverlap && localStorage.getItem("userImage")) {
        userImage = p.createImg(localStorage.getItem("userImage"), "", "", () => {
          showOverlap = true;
          overlay.background("#ffffff");
          overlay.image(userImage, 0, 0, overlay.width, overlay.height);
        });
      }
      break;
    case "camera":
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
        video.hide();
      }
      break;
    case "print":
      renderImage(p, paper.toPrintGraphics(), { print: true, aspectRatio: Math.sqrt(2) });
      break;
    case "png":
      renderImage(p, paper.toImageGraphics());
      break;
    case "svg":
      downloadFile(`${makeFilename()}.svg`, renderSvg(paper.toImageGraphics()));
      break;
    case "mp4":
      if (capture?.state === "idle") {
        p.resizeCanvas(CAPTURE_WIDTH, CAPTURE_HEIGHT);
        canvas.elt.style = "max-width:100%;max-height:100%;width:auto;height:auto;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);";
        capture?.start({
          format: "mp4",
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
        });
        captureIndex = 0;
        runCommand(p, "exit");
      }
      break;
    case "pngs":
      if (capture?.state === "idle") {
        p.resizeCanvas(CAPTURE_WIDTH, CAPTURE_HEIGHT);
        capture?.start({
          format: "png",
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
        });
        captureIndex = 0;
        runCommand(p, "exit");
      }
      break;
    case "stop":
      if (capture.state === "capturing") capture.stop();
      break;
    case "json":
      const exportJson = paper.toExport();
      downloadFile(`${makeFilename()}.json`, JSON.stringify(exportJson), "application/json");
      history.save(paper.toSnapshot());
      break;
    case "reset":
      paper.reset();
      history.save(paper.toSnapshot());
      break;
    case "rotateL":
      paper.rotate(-Math.PI / 4);
      history.save(paper.toSnapshot());
      break;
    case "rotateR":
      paper.rotate(Math.PI / 4);
      history.save(paper.toSnapshot());
      break;
    case "flipY":
      paper.flipY();
      history.save(paper.toSnapshot());
      break;
    case "flipX":
      paper.flipX();
      history.save(paper.toSnapshot());
      break;
  }
};

const sketch = (p) => {
  p.setup = async () => {
    await loadAssets(p);
    canvasSetup(p);
    offscreenGraphicsSetup(p);
    fileInputsSetup(p);
    enginesSetup(p);
    RenderingSetup(p);
  };

  p.draw = () => {
    stats?.begin();
    if (!reduceAnimation && p.frameRate() < minFrameRate && slowFrames > maxSlowFrames) {
      reduceAnimation = true;
    } else if (!reduceAnimation && p.frameRate() < minFrameRate) {
      slowFrames++;
    } else {
      slowFrames = 0;
    }

    if (capture?.state !== "capturing") {
      if (captureIndex !== 0) {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        captureIndex = 0;
      }
      renderMainGraphics(p);
    } else {
      renderVideoGraphics(p);
      captureIndex++;
    }

    stats?.end();
  };

  p.doubleClicked = (event) => {
    runCommand(p, "stop");
  };

  p.mousePressed = (event) => {
    if (interactionAllowed()) {
      const commands = userInterface.mousePressed();
      commands.forEach((command) => runCommand(p, command));
      if (commands?.length < 1) {
        history.save(paper.toSnapshot());
        scissors.beginCut();
      }
    }
  };

  p.touchStarted = (event) => {
    ptouchX = event.touches[0].clientX;
    ptouchY = event.touches[0].clientY;
    if (interactionAllowed()) {
      const canvasAspectRatio = p.width / p.height;
      if (ptouchX > p.width / 2) {
        const commands = userInterface.mousePressed();
        commands.forEach((command) => runCommand(p, command));
        if (commands?.length < 1) {
          history.save(paper.toSnapshot());
          scissors.beginCut();
        }
      }
    } else {
      reduceAnimation = true;
      if (!document.pointerLockElement) {
        try {
          document.body.requestPointerLock();
        } catch (e) {
          pointerLockError = true;
          scissors.unhide();
        }
      }
    }
  };

  p.mouseReleased = (event) => {
    if (interactionAllowed() && scissors.cuttingActivated) {
      scissors.endCut();
      paper.filterScraps();
      history.save(paper.toSnapshot());
    }
  };

  p.touchEnded = (event) => {
    if (interactionAllowed() && scissors.cuttingActivated) {
      scissors.endCut();
      paper.filterScraps();
      history.save(paper.toSnapshot());
    }
  };
  p.mouseMoved = (event) => {
    if (interactionAllowed()) moveMouseBy(event.movementX, event.movementY);
  };

  p.touchMoved = (event) => {
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
    const movementX = touchX - ptouchX;
    const movementY = touchY - ptouchY;
    if (interactionAllowed()) {
      moveMouseBy(movementX, movementY);
      // MOBILE FILEINPUT SUPPORT
      const hoveredCommands = userInterface.hoveredCommands();
      if (hoveredCommands.includes("load")) {
        fileInput.show();
      } else {
        fileInput.hide();
      }
    }
    ptouchX = touchX;
    ptouchY = touchY;
  };

  p.mouseDragged = (event) => {
    // history.save(paper.toSnapshot());
    if (interactionAllowed()) moveMouseBy(event.movementX, event.movementY);
  };

  p.mouseWheel = (event) => {
    if (interactionAllowed()) fovy = p.constrain(fovy - event.delta * mouseWheelSensitivity, minFovy, maxFovy);
  };

  p.keyPressed = (event) => {
    switch (event.code) {
      case "Escape":
        runCommand(p, "stop");
        break;
      case "KeyA":
        scissors.toggleAim();
        break;
      case "KeyB":
        if (actionKeyIsPressed(event) && event.shiftKey) {
          event.preventDefault();
          runCommand(p, "pngs");
        } else if (actionKeyIsPressed(event)) {
          event.preventDefault();
          runCommand(p, "mp4");
        }
        break;
      case "KeyC":
        runCommand(p, "camera");
        break;
      case "KeyD":
        paper.centerHoles();
        break;
      case "KeyE":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          runCommand(p, "svg");
        }
        break;
      case "KeyF":
        runCommand(p, "full");
        break;
      case "KeyH":
        runCommand(p, "help");
        break;
      case "KeyM":
        userInterface.toggle();
        break;
      case "KeyO":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          runCommand(p, "png");
        }
        break;
      case "KeyP":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          runCommand(p, "print");
        }
        break;
      case "KeyS":
        if (actionKeyIsPressed(event)) {
          event.preventDefault();
          runCommand(p, "json");
        } else {
          runCommand(p, "scissors");
        }
        break;
      case "KeyZ":
        if (actionKeyIsPressed(event) && event.shiftKey) {
          event.preventDefault();
          runCommand(p, "redo");
        } else if (actionKeyIsPressed(event)) {
          event.preventDefault();
          runCommand(p, "undo");
        }
        break;
      case "Space":
        runCommand(p, "overlay");
        break;
      case "ArrowLeft":
        runCommand(p, "rotateL");
        break;
      case "ArrowRight":
        runCommand(p, "rotateR");
        break;
      case "ArrowUp":
        runCommand(p, "flipX");
        break;
      case "ArrowDown":
        runCommand(p, "flipY");
        break;
      case "Digit0":
        if (localStorage.getItem("userJson")) {
          paper.loadPreset(JSON.parse(localStorage.getItem("userJson")));
          history.save(paper.toSnapshot());
        }
        break;
      case "Digit1":
        paper.loadPreset(PaperPresets.SQUARE);
        history.save(paper.toSnapshot());
        break;
      case "Digit2":
        paper.loadPreset(PaperPresets.RECT_LANDSCAPE);
        history.save(paper.toSnapshot());
        break;
      case "Digit3":
        paper.loadPreset(PaperPresets.RECT_PORTRAIT);
        history.save(paper.toSnapshot());
        break;
      case "Digit4":
        paper.loadPreset(PaperPresets.DIAMOND);
        history.save(paper.toSnapshot());
        break;
      case "Digit5":
        paper.loadPreset(PaperPresets.CIRCLE);
        history.save(paper.toSnapshot());
        break;
      case "Digit6":
        paper.loadPreset(PaperPresets.ELLIPSE_LANDSCAPE);
        history.save(paper.toSnapshot());
        break;
      case "Digit7":
        paper.loadPreset(PaperPresets.ELLIPSE_PORTRAIT);
        history.save(paper.toSnapshot());
        break;
      case "Digit8":
        paper.loadPreset(JSON.parse(JSON.stringify(PapercutPresets.chun)));
        history.save(paper.toSnapshot());
        break;
      case "Digit9":
        paper.loadPreset(JSON.parse(JSON.stringify(PapercutPresets.portrait)));
        history.save(paper.toSnapshot());
        break;
    }
  };

  p.windowResized = (event) => {
    if (capture.state !== "capturing") p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

P5Capture.setDefaultOptions({
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
