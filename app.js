import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* =========================================================
   BASIC SETUP
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.001,
  1000000
);

camera.position.set(0, 20, 1200);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById("game").appendChild(renderer.domElement);

/* =========================================================
   LIGHTING
========================================================= */

const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 3, 0, 1);
scene.add(sunLight);

/* =========================================================
   SCALE
========================================================= */

// 1 game unit = 150,000 km
// 1 AU ≈ 1000 game units

const KM_PER_UNIT = 150000;
const AU_IN_UNITS = 149597870 / KM_PER_UNIT;

/* =========================================================
   SUN
========================================================= */

const SUN_RADIUS = 695700 / KM_PER_UNIT;

const sunGeometry = new THREE.SphereGeometry(
  SUN_RADIUS,
  48,
  48
);

const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffcc33,
});

const sun = new THREE.Mesh(
  sunGeometry,
  sunMaterial
);

scene.add(sun);

sunLight.position.copy(sun.position);

/* =========================================================
   PLANET DATA
   NASA-based real values
========================================================= */

const planetData = [
  {
    name: "Mercury",
    radius: 2439.7 / KM_PER_UNIT,
    distance: 0.3871,
    orbitDays: 87.97,
    rotationDays: 58.646,
    eccentricity: 0.2056,
    color: 0x9a8f83,
  },

  {
    name: "Venus",
    radius: 6051.8 / KM_PER_UNIT,
    distance: 0.7233,
    orbitDays: 224.70,
    rotationDays: -243.025,
    eccentricity: 0.0068,
    color: 0xd8b26a,
  },

  {
    name: "Earth",
    radius: 6371.0 / KM_PER_UNIT,
    distance: 1.0000,
    orbitDays: 365.256,
    rotationDays: 0.9973,
    eccentricity: 0.0167,
    color: 0x2f6fff,
  },

  {
    name: "Mars",
    radius: 3389.5 / KM_PER_UNIT,
    distance: 1.5237,
    orbitDays: 686.98,
    rotationDays: 1.026,
    eccentricity: 0.0934,
    color: 0xb84a32,
  },

  {
    name: "Jupiter",
    radius: 69911 / KM_PER_UNIT,
    distance: 5.2028,
    orbitDays: 4332.59,
    rotationDays: 0.4135,
    eccentricity: 0.0489,
    color: 0xc99b6d,
  },

  {
    name: "Saturn",
    radius: 58232 / KM_PER_UNIT,
    distance: 9.5388,
    orbitDays: 10759.22,
    rotationDays: 0.4440,
    eccentricity: 0.0565,
    color: 0xd8c39a,
  },

  {
    name: "Uranus",
    radius: 25362 / KM_PER_UNIT,
    distance: 19.1914,
    orbitDays: 30688.5,
    rotationDays: -0.7183,
    eccentricity: 0.0463,
    color: 0x8bd3e6,
  },

  {
    name: "Neptune",
    radius: 24622 / KM_PER_UNIT,
    distance: 30.0611,
    orbitDays: 60182,
    rotationDays: 0.6713,
    eccentricity: 0.0095,
    color: 0x4169e1,
  },
];

/* =========================================================
   PLANETS
========================================================= */

const planets = [];

for (let i = 0; i < planetData.length; i++) {
  const data = planetData[i];

  const geometry = new THREE.SphereGeometry(
    data.radius,
    32,
    32
  );

  const material = new THREE.MeshStandardMaterial({
    color: data.color,
    roughness: 1,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  scene.add(mesh);

  const planet = {
    ...data,
    mesh,
    angle: Math.random() * Math.PI * 2,
    orbit: null,
    label: null,
    labelLine: null,
    labelOffset: new THREE.Vector2(),
  };

  planet.orbit = createOrbit(
    data.distance,
    data.eccentricity
  );

  scene.add(planet.orbit);

  createPlanetLabel(planet);

  planets.push(planet);
}

/* =========================================================
   SATURN RINGS
========================================================= */

const saturn = planets.find(
  (planet) => planet.name === "Saturn"
);

if (saturn) {
  const ringGeometry = new THREE.RingGeometry(
    saturn.radius * 1.35,
    saturn.radius * 2.3,
    64
  );

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xbba989,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
  });

  const rings = new THREE.Mesh(
    ringGeometry,
    ringMaterial
  );

  rings.rotation.x = Math.PI / 2;

  saturn.mesh.add(rings);
}

/* =========================================================
   EARTH MOON
========================================================= */

const earth = planets.find(
  (planet) => planet.name === "Earth"
);

let moon = null;

if (earth) {
  const moonRadius = 1737.4 / KM_PER_UNIT;
  const moonDistance = 384400 / KM_PER_UNIT;

  const moonGeometry = new THREE.SphereGeometry(
    moonRadius,
    24,
    24
  );

  const moonMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 1,
  });

  const moonMesh = new THREE.Mesh(
    moonGeometry,
    moonMaterial
  );

  scene.add(moonMesh);

  moon = {
    name: "Moon",
    mesh: moonMesh,
    distance: moonDistance,
    orbitDays: 27.321661,
    angle: 0,
    orbit: createMoonOrbit(moonDistance),
    label: null,
    labelLine: null,
    labelOffset: new THREE.Vector2(0, -45),
  };

  scene.add(moon.orbit);

  createPlanetLabel(moon);
}

/* =========================================================
   ORBIT CREATION
========================================================= */

function createOrbit(aAU, eccentricity) {
  const points = [];

  const a = aAU * AU_IN_UNITS;
  const b = a * Math.sqrt(1 - eccentricity * eccentricity);

  const focusOffset = a * eccentricity;

  for (let i = 0; i <= 256; i++) {
    const angle = (i / 256) * Math.PI * 2;

    const x = a * Math.cos(angle) - focusOffset;
    const z = b * Math.sin(angle);

    points.push(
      new THREE.Vector3(x, 0, z)
    );
  }

  const geometry =
    new THREE.BufferGeometry().setFromPoints(points);

  const material =
    new THREE.LineBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.35,
    });

  return new THREE.LineLoop(
    geometry,
    material
  );
}

function createMoonOrbit(radius) {
  const points = [];

  for (let i = 0; i <= 128; i++) {
    const angle =
      (i / 128) * Math.PI * 2;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      )
    );
  }

  const geometry =
    new THREE.BufferGeometry().setFromPoints(points);

  const material =
    new THREE.LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.4,
    });

  return new THREE.LineLoop(
    geometry,
    material
  );
}

/* =========================================================
   LABEL SYSTEM
========================================================= */

const labelLayer =
  document.getElementById("labelLayer");

const labelItems = [];

function createPlanetLabel(object) {
  const label = document.createElement("div");

  label.className = "planetLabel";

  const text = document.createElement("div");

  text.className = "planetLabelText";
  text.textContent = object.name;

  const line = document.createElement("div");

  line.className = "planetLabelLine";

  label.appendChild(text);
  label.appendChild(line);

  labelLayer.appendChild(label);

  object.label = label;
  object.labelLine = line;

  if (!object.labelOffset) {
    const index = labelItems.length;

    const angle =
      (index / 8) * Math.PI * 2;

    object.labelOffset =
      new THREE.Vector2(
        Math.cos(angle) * 35,
        Math.sin(angle) * 35
      );
  }

  labelItems.push(object);
}

const tempProjected =
  new THREE.Vector3();

function updateLabels() {
  if (!labelsVisible) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  for (const object of labelItems) {
    if (!object.mesh.visible) {
      object.label.style.display = "none";
      continue;
    }

    const worldPosition =
      new THREE.Vector3();

    object.mesh.getWorldPosition(
      worldPosition
    );

    tempProjected.copy(worldPosition);

    tempProjected.project(camera);

    // Behind camera
    if (tempProjected.z > 1) {
      object.label.style.display = "none";
      continue;
    }

    let x =
      (tempProjected.x * 0.5 + 0.5) *
      width;

    let y =
      (-tempProjected.y * 0.5 + 0.5) *
      height;

    const offset =
      object.labelOffset ||
      new THREE.Vector2(30, 30);

    const targetX = x;
    const targetY = y;

    x += offset.x;
    y += offset.y;

    // Keep label on screen
    x = THREE.MathUtils.clamp(
      x,
      70,
      width - 70
    );

    y = THREE.MathUtils.clamp(
      y,
      25,
      height - 25
    );

    object.label.style.display = "flex";

    object.label.style.left =
      `${x}px`;

    object.label.style.top =
      `${y}px`;

    // Draw pointer line back toward planet
    const dx = targetX - x;
    const dy = targetY - y;

    const length =
      Math.sqrt(dx * dx + dy * dy);

    const angle =
      Math.atan2(dy, dx);

    object.labelLine.style.width =
      `${Math.min(Math.max(length, 15), 150)}px`;

    object.labelLine.style.transform =
      `rotate(${angle}rad)`;
  }
}

/* =========================================================
   SIMULATION
========================================================= */

const SIMULATION_DAYS_PER_SECOND = 30;

let simulationDays = 0;

function updatePlanets(delta) {
  simulationDays +=
    delta *
    SIMULATION_DAYS_PER_SECOND;

  for (const planet of planets) {
    const a =
      planet.distance * AU_IN_UNITS;

    const e =
      planet.eccentricity;

    const b =
      a * Math.sqrt(1 - e * e);

    const focusOffset =
      a * e;

    const angularSpeed =
      (Math.PI * 2) /
      planet.orbitDays;

    planet.angle +=
      angularSpeed *
      delta *
      SIMULATION_DAYS_PER_SECOND;

    const x =
      a * Math.cos(planet.angle) -
      focusOffset;

    const z =
      b * Math.sin(planet.angle);

    planet.mesh.position.set(
      x,
      0,
      z
    );

    /* Planet rotation */

    const rotationDirection =
      planet.rotationDays < 0
        ? -1
        : 1;

    const rotationSpeed =
      (Math.PI * 2) /
      Math.abs(planet.rotationDays);

    planet.mesh.rotation.y +=
      rotationSpeed *
      delta *
      SIMULATION_DAYS_PER_SECOND *
      rotationDirection;
  }

  /* Moon */

  if (earth && moon) {
    moon.angle +=
      (Math.PI * 2 / moon.orbitDays) *
      delta *
      SIMULATION_DAYS_PER_SECOND;

    const earthPosition =
      earth.mesh.position;

    moon.mesh.position.set(
      earthPosition.x +
        Math.cos(moon.angle) *
          moon.distance,

      0,

      earthPosition.z +
        Math.sin(moon.angle) *
          moon.distance
    );

    moon.mesh.rotation.y =
      moon.angle;
  }
}

/* =========================================================
   PLAYER MOVEMENT
========================================================= */

const CHILL_SPEED = 180;
const SONIC_SPEED = 360;
const POOP_SPEED = 720;

let currentSpeedMode = "chill";

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
};

function getCurrentSpeed() {
  if (currentSpeedMode === "sonic") {
    return SONIC_SPEED;
  }

  if (currentSpeedMode === "poop") {
    return POOP_SPEED;
  }

  return CHILL_SPEED;
}

function updatePlayer(delta) {
  const speed =
    getCurrentSpeed();

  const direction =
    new THREE.Vector3();

  const forward =
    new THREE.Vector3();

  camera.getWorldDirection(forward);

  const right =
    new THREE.Vector3();

  right.crossVectors(
    forward,
    camera.up
  ).normalize();

  if (keys.forward) {
    direction.add(forward);
  }

  if (keys.backward) {
    direction.sub(forward);
  }

  if (keys.right) {
    direction.sub(right);
  }

  if (keys.left) {
    direction.add(right);
  }

  if (keys.up) {
    direction.y += 1;
  }

  if (keys.down) {
    direction.y -= 1;
  }

  const isMoving =
    direction.lengthSq() > 0;

  if (isMoving) {
    direction.normalize();

    camera.position.addScaledVector(
      direction,
      speed * delta
    );
  }

  return isMoving;
}

/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

window.addEventListener(
  "keydown",
  (event) => {
    if (event.code === "KeyW") {
      keys.forward = true;
    }

    if (event.code === "KeyS") {
      keys.backward = true;
    }

    if (event.code === "KeyA") {
      keys.left = true;
    }

    if (event.code === "KeyD") {
      keys.right = true;
    }

    if (event.code === "Space") {
      keys.up = true;
      event.preventDefault();
    }

    if (event.code === "ShiftLeft") {
      keys.down = true;
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    if (event.code === "KeyW") {
      keys.forward = false;
    }

    if (event.code === "KeyS") {
      keys.backward = false;
    }

    if (event.code === "KeyA") {
      keys.left = false;
    }

    if (event.code === "KeyD") {
      keys.right = false;
    }

    if (event.code === "Space") {
      keys.up = false;
    }

    if (event.code === "ShiftLeft") {
      keys.down = false;
    }
  }
);

/* =========================================================
   MOUSE LOOK
========================================================= */

let isPointerLocked = false;

renderer.domElement.addEventListener(
  "click",
  () => {
    if (!isMobile()) {
      renderer.domElement.requestPointerLock();
    }
  }
);

document.addEventListener(
  "pointerlockchange",
  () => {
    isPointerLocked =
      document.pointerLockElement ===
      renderer.domElement;
  }
);

document.addEventListener(
  "mousemove",
  (event) => {
    if (!isPointerLocked) {
      return;
    }

    const sensitivity = 0.002;

    camera.rotation.order = "YXZ";

    camera.rotation.y -=
      event.movementX *
      sensitivity;

    camera.rotation.x -=
      event.movementY *
      sensitivity;

    camera.rotation.x =
      THREE.MathUtils.clamp(
        camera.rotation.x,
        -Math.PI / 2,
        Math.PI / 2
      );
  }
);

/* =========================================================
   MOBILE TOUCH LOOK
========================================================= */

let touchLookActive = false;
let lastTouchX = 0;
let lastTouchY = 0;

renderer.domElement.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) {
      return;
    }

    const touch =
      event.touches[0];

    touchLookActive = true;

    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  },
  { passive: false }
);

renderer.domElement.addEventListener(
  "touchmove",
  (event) => {
    if (!touchLookActive) {
      return;
    }

    if (event.touches.length !== 1) {
      return;
    }

    const touch =
      event.touches[0];

    const dx =
      touch.clientX -
      lastTouchX;

    const dy =
      touch.clientY -
      lastTouchY;

    lastTouchX =
      touch.clientX;

    lastTouchY =
      touch.clientY;

    const sensitivity = 0.004;

    camera.rotation.order =
      "YXZ";

    camera.rotation.y -=
      dx * sensitivity;

    camera.rotation.x -=
      dy * sensitivity;

    camera.rotation.x =
      THREE.MathUtils.clamp(
        camera.rotation.x,
        -Math.PI / 2,
        Math.PI / 2
      );

    event.preventDefault();
  },
  { passive: false }
);

renderer.domElement.addEventListener(
  "touchend",
  () => {
    touchLookActive = false;
  }
);

/* =========================================================
   MOBILE MOVEMENT BUTTONS
========================================================= */

function bindHoldButton(
  elementId,
  keyName
) {
  const element =
    document.getElementById(elementId);

  const start = (event) => {
    event.preventDefault();
    keys[keyName] = true;
  };

  const stop = (event) => {
    event.preventDefault();
    keys[keyName] = false;
  };

  element.addEventListener(
    "touchstart",
    start,
    { passive: false }
  );

  element.addEventListener(
    "touchend",
    stop,
    { passive: false }
  );

  element.addEventListener(
    "touchcancel",
    stop,
    { passive: false }
  );

  element.addEventListener(
    "mousedown",
    start
  );

  element.addEventListener(
    "mouseup",
    stop
  );

  element.addEventListener(
    "mouseleave",
    stop
  );
}

bindHoldButton(
  "moveForward",
  "forward"
);

bindHoldButton(
  "moveBackward",
  "backward"
);

bindHoldButton(
  "moveLeft",
  "left"
);

bindHoldButton(
  "moveRight",
  "right"
);

bindHoldButton(
  "upButton",
  "up"
);

bindHoldButton(
  "downButton",
  "down"
);

/* =========================================================
   SPEED SYSTEM
========================================================= */

const speedButtons =
  document.querySelectorAll(
    ".speedButton"
  );

speedButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        currentSpeedMode =
          button.dataset.speed;

        updateSpeedButtons();
      }
    );
  }
);

function updateSpeedButtons() {
  speedButtons.forEach(
    (button) => {
      button.classList.toggle(
        "active",
        button.dataset.speed ===
          currentSpeedMode
      );
    }
  );
}

/* =========================================================
   ENERGY SYSTEM
========================================================= */

let energy = 100;

function updateEnergy(
  delta,
  isMoving
) {
  const sunDistance =
    camera.position.length();

  const refillDistance = 180;

  if (
    sunDistance <=
    refillDistance
  ) {
    energy +=
      30 * delta;
  }

  if (
    isMoving &&
    currentSpeedMode === "sonic"
  ) {
    energy -=
      4 * delta;
  }

  if (
    isMoving &&
    currentSpeedMode === "poop"
  ) {
    energy -=
      12 * delta;
  }

  energy =
    THREE.MathUtils.clamp(
      energy,
      0,
      100
    );

  if (energy <= 0) {
    currentSpeedMode = "chill";
    updateSpeedButtons();
  }

  document.getElementById(
    "energyBar"
  ).style.width =
    `${energy}%`;

  document.getElementById(
    "energyPercent"
  ).textContent =
    `${Math.round(energy)}%`;
}

/* =========================================================
   DISTANCE FROM SUN
========================================================= */

function updateDistanceDisplay() {
  const distance =
    camera.position.length();

  const au =
    distance / AU_IN_UNITS;

  document.getElementById(
    "distanceDisplay"
  ).textContent =
    `DISTANCE FROM SUN: ${au.toFixed(3)} AU`;
}

/* =========================================================
   PLANET PROXIMITY
========================================================= */

const planetInfo =
  document.getElementById(
    "planetInfo"
  );

function updatePlanetInfo() {
  let closest = null;
  let closestDistance = Infinity;

  for (const planet of planets) {
    const distance =
      camera.position.distanceTo(
        planet.mesh.position
      );

    if (
      distance <
      closestDistance
    ) {
      closestDistance = distance;
      closest = planet;
    }
  }

  if (
    moon &&
    camera.position.distanceTo(
      moon.mesh.position
    ) < closestDistance
  ) {
    closest =
      moon;

    closestDistance =
      camera.position.distanceTo(
        moon.mesh.position
      );
  }

  if (
    closest &&
    closestDistance < 15
  ) {
    planetInfo.textContent =
      `YOU ARE NEAR ${closest.name.toUpperCase()}`;

    planetInfo.classList.add(
      "visible"
    );
  } else {
    planetInfo.classList.remove(
      "visible"
    );
  }
}

/* =========================================================
   DISPLAY SETTINGS
========================================================= */

let labelsVisible = true;
let orbitsVisible = true;
let uiVisible = true;

const game =
  document.getElementById(
    "game"
  );

function updateLabelVisibility() {
  labelLayer.style.display =
    labelsVisible
      ? "block"
      : "none";
}

function updateOrbitVisibility() {
  for (const planet of planets) {
    if (planet.orbit) {
      planet.orbit.visible =
        orbitsVisible;
    }
  }

  if (moon && moon.orbit) {
    moon.orbit.visible =
      orbitsVisible;
  }
}

/* LABEL ON */

document
  .getElementById("labelsOn")
  .addEventListener(
    "click",
    () => {
      labelsVisible = true;

      document
        .getElementById("labelsOn")
        .classList.add("active");

      document
        .getElementById("labelsOff")
        .classList.remove("active");

      updateLabelVisibility();
    }
  );

/* LABEL OFF */

document
  .getElementById("labelsOff")
  .addEventListener(
    "click",
    () => {
      labelsVisible = false;

      document
        .getElementById("labelsOff")
        .classList.add("active");

      document
        .getElementById("labelsOn")
        .classList.remove("active");

      updateLabelVisibility();
    }
  );

/* ORBITS ON */

document
  .getElementById("orbitsOn")
  .addEventListener(
    "click",
    () => {
      orbitsVisible = true;

      document
        .getElementById("orbitsOn")
        .classList.add("active");

      document
        .getElementById("orbitsOff")
        .classList.remove("active");

      updateOrbitVisibility();
    }
  );

/* ORBITS OFF */

document
  .getElementById("orbitsOff")
  .addEventListener(
    "click",
    () => {
      orbitsVisible = false;

      document
        .getElementById("orbitsOff")
        .classList.add("active");

      document
        .getElementById("orbitsOn")
        .classList.remove("active");

      updateOrbitVisibility();
    }
  );

/* =========================================================
   FULL VIEW / UI OFF
========================================================= */

const uiToggleButton =
  document.getElementById(
    "uiToggleButton"
  );

function setUIVisible(visible) {
  uiVisible = visible;

  if (visible) {
    game.classList.remove(
      "cinematic"
    );

    uiToggleButton.style.opacity =
      "0";

    uiToggleButton.style.pointerEvents =
      "none";

    /*
      Restore whatever orbit state
      the player selected.
    */
    updateOrbitVisibility();
    updateLabelVisibility();

  } else {
    game.classList.add(
      "cinematic"
    );

    uiToggleButton.style.opacity =
      "1";

    uiToggleButton.style.pointerEvents =
      "auto";

    /*
      Full view means:
      no orbit lines
      no labels
      no HUD
      no controls
      no crosshair
    */

    for (const planet of planets) {
      if (planet.orbit) {
        planet.orbit.visible = false;
      }
    }

    if (moon && moon.orbit) {
      moon.orbit.visible = false;
    }
  }
}

document
  .getElementById("hideUIButton")
  .addEventListener(
    "click",
    () => {
      setUIVisible(false);
    }
  );

uiToggleButton.addEventListener(
  "click",
  () => {
    setUIVisible(true);
  }
);

/* =========================================================
   START GAME
========================================================= */

document
  .getElementById("startButton")
  .addEventListener(
    "click",
    () => {
      document.getElementById(
        "startScreen"
      ).style.display = "none";

      setUIVisible(true);
    }
  );

/* =========================================================
   MOBILE CHECK
========================================================= */

function isMobile() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
}

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
  "resize",
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);

/* =========================================================
   ANIMATION LOOP
========================================================= */

const clock =
  new THREE.Clock();

function animate() {
  requestAnimationFrame(
    animate
  );

  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );

  const isMoving =
    updatePlayer(delta);

  updatePlanets(delta);

  updateEnergy(
    delta,
    isMoving
  );

  updateDistanceDisplay();

  updatePlanetInfo();

  updateLabels();

  renderer.render(
    scene,
    camera
  );
}

animate();
