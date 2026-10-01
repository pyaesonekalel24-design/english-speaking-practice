```javascript
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const AU = 1000; // About 1 AU per 1,000 game units.
const SIMULATION_DAYS_PER_SECOND = 30;
const STAR_COUNT = 12000;

const canvas = document.getElementById("space");
const loadingScreen = document.getElementById("loadingScreen");
const startScreen = document.getElementById("startScreen");
const errorScreen = document.getElementById("errorScreen");
const gameUI = document.getElementById("gameUI");
const labelContainer = document.getElementById("planetLabels");
const lineGroup = document.getElementById("labelLineGroup");

let scene;
let camera;
let renderer;
let clock;
let started = false;
let simulationDays = 0;
let energy = 100;
let selectedSpeed = "chill";
let targetBody = null;
let yaw = 0;
let pitch = 0;
let dragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
let labelUpdateTimer = 0;

const speedModes = {
  chill: { speed: 180, drain: 0 },
  sonic: { speed: 360, drain: 2.5 },
  poop: { speed: 720, drain: 9 }
};

const pressedDirections = new Set();
const pointerDirections = new Map();
const bodyRecords = [];
const labelRecords = [];
const tempVector = new THREE.Vector3();
const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();
const upVector = new THREE.Vector3();
const moveVector = new THREE.Vector3();

const planetData = [
  {
    name: "MERCURY",
    radius: 0.0163,
    distanceAU: 0.3871,
    period: 87.97,
    rotation: 58.646,
    eccentricity: 0.2056,
    color: 0x9b8e80,
    phase: 0.3
  },
  {
    name: "VENUS",
    radius: 0.0405,
    distanceAU: 0.7233,
    period: 224.70,
    rotation: -243.025,
    eccentricity: 0.0068,
    color: 0xd6ad77,
    phase: 1.2
  },
  {
    name: "EARTH",
    radius: 0.0426,
    distanceAU: 1.0,
    period: 365.256,
    rotation: 0.9973,
    eccentricity: 0.0167,
    color: 0x4388cf,
    phase: 2.2
  },
  {
    name: "MARS",
    radius: 0.0227,
    distanceAU: 1.5237,
    period: 686.98,
    rotation: 1.026,
    eccentricity: 0.0934,
    color: 0xc95738,
    phase: 3.0
  },
  {
    name: "JUPITER",
    radius: 0.4673,
    distanceAU: 5.2028,
    period: 4332.59,
    rotation: 0.4135,
    eccentricity: 0.0489,
    color: 0xcaa579,
    phase: 3.8
  },
  {
    name: "SATURN",
    radius: 0.3893,
    distanceAU: 9.5388,
    period: 10759.22,
    rotation: 0.4440,
    eccentricity: 0.0565,
    color: 0xd6bd8a,
    phase: 4.6
  },
  {
    name: "URANUS",
    radius: 0.1695,
    distanceAU: 19.1914,
    period: 30688.5,
    rotation: -0.7183,
    eccentricity: 0.0463,
    color: 0x7dcaca,
    phase: 5.3
  },
  {
    name: "NEPTUNE",
    radius: 0.1646,
    distanceAU: 30.0611,
    period: 60182,
    rotation: 0.6713,
    eccentricity: 0.0095,
    color: 0x4779dc,
    phase: 5.9
  }
];

function showError(message) {
  loadingScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  errorScreen.classList.remove("hidden");
  document.getElementById("errorMessage").textContent = message;
}

function makeOrbitPoints(distanceAU, eccentricity, phase) {
  const semiMajor = distanceAU * AU;
  const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);
  const points = [];
  const count = 240;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + phase;
    const x = semiMajor * (Math.cos(angle) - eccentricity);
    const y = semiMinor * Math.sin(angle);
    points.push(new THREE.Vector3(x, y, 0));
  }

  return points;
}

function createOrbitLine(distanceAU, eccentricity, phase, opacity = 0.15) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    makeOrbitPoints(distanceAU, eccentricity, phase)
  );
  const material = new THREE.LineBasicMaterial({
    color: 0x8096ad,
    transparent: true,
    opacity
  });
  const line = new THREE.LineLoop(geometry, material);
  scene.add(line);
  return line;
}

function solveKepler(meanAnomaly, eccentricity) {
  let eccentricAnomaly = meanAnomaly;

  for (let i = 0; i < 5; i++) {
    eccentricAnomaly -=
      (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
  }

  return eccentricAnomaly;
}

function orbitalPosition(body, days) {
  const semiMajor = body.distanceAU * AU;
  const meanMotion = (Math.PI * 2) / body.period;
  const meanAnomaly = body.phase + meanMotion * days;
  const eccentricAnomaly = solveKepler(meanAnomaly, body.eccentricity);

  const x = semiMajor * (Math.cos(eccentricAnomaly) - body.eccentricity);
  const y =
    semiMajor *
    Math.sqrt(1 - body.eccentricity * body.eccentricity) *
    Math.sin(eccentricAnomaly);

  return new THREE.Vector3(x, y, 0);
}

function addStarField() {
  const positions = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i++) {
    const direction = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();

    const distance = 3000 + Math.random() * 5000;
    positions[i * 3] = direction.x * distance;
    positions[i * 3 + 1] = direction.y * distance;
    positions[i * 3 + 2] = direction.z * distance;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xdce8ff,
    size: 2.1,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.9
  });

  scene.add(new THREE.Points(geometry, material));
}

function addLabel(body) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "planet-label";
  button.textContent = body.name;
  button.setAttribute("aria-label", `Target ${body.name}`);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    targetBody = body;
    updateTargetReadout();
    updateLabels(true);
  });

  labelContainer.appendChild(button);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("class", "label-line");
  lineGroup.appendChild(line);

  labelRecords.push({ body, button, line });
}

function addPlanet(data, sharedGeometry) {
  const material = new THREE.MeshStandardMaterial({
    color: data.color,
    roughness: 0.92,
    metalness: 0
  });

  const mesh = new THREE.Mesh(sharedGeometry, material);
  mesh.scale.setScalar(data.radius);
  scene.add(mesh);

  const body = {
    ...data,
    mesh,
    position: new THREE.Vector3(),
    isMoon: false
  };

  bodyRecords.push(body);
  createOrbitLine(data.distanceAU, data.eccentricity, data.phase);
  addLabel(body);

  if (data.name === "SATURN") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(data.radius * 1.35, data.radius * 2.25, 48),
      new THREE.MeshBasicMaterial({
        color: 0xb8a47c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72
      })
    );
    ring.rotation.x = Math.PI / 2.35;
    mesh.add(ring);
  }

  return body;
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03060b);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.05,
    12000
  );
  camera.position.set(0, 20, 1200);
  camera.rotation.order = "YXZ";

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "low-power"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffd27b });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(4.65, 24, 16), sunMaterial);
  sun.position.set(0, 0, 0);
  scene.add(sun);

  const sunLight = new THREE.PointLight(0xffd28a, 1.7, 600, 1.5);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const sunBody = {
    name: "SUN",
    mesh: sun,
    position: new THREE.Vector3(),
    radius: 4.65,
    isSun: true
  };
  bodyRecords.push(sunBody);
  addLabel(sunBody);

  const planetGeometry = new THREE.SphereGeometry(1, 14, 10);
  const planets = {};

  for (const data of planetData) {
    planets[data.name] = addPlanet(data, planetGeometry);
  }

  const earth = planets.EARTH;
  const moonGeometry = new THREE.SphereGeometry(1, 12, 8);
  const moon = new THREE.Mesh(
    moonGeometry,
    new THREE.MeshStandardMaterial({ color: 0xa9a9a4, roughness: 1 })
  );
  moon.scale.setScalar(0.0116);
  scene.add(moon);

  const moonBody = {
    name: "MOON",
    mesh: moon,
    position: new THREE.Vector3(),
    radius: 0.0116,
    isMoon: true,
    parent: earth,
    moonDistance: 2.569,
    period: 27.321661,
    phase: 0.4
  };
  bodyRecords.push(moonBody);
  addLabel(moonBody);

  const moonOrbitGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 80 }, (_, i) => {
      const angle = (i / 80) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * moonBody.moonDistance,
        Math.sin(angle) * moonBody.moonDistance,
        0
      );
    })
  );
  const moonOrbit = new THREE.LineLoop(
    moonOrbitGeometry,
    new THREE.LineBasicMaterial({
      color: 0xa5b2c0,
      transparent: true,
      opacity: 0.35
    })
  );
  scene.add(moonOrbit);
  moonBody.orbitLine = moonOrbit;

  addStarField();
  clock = new THREE.Clock();

  updateOrbitalBodies(0);
}

function updateOrbitalBodies(deltaDays) {
  simulationDays += deltaDays;

  for (const body of bodyRecords) {
    if (body.isSun) continue;

    if (body.isMoon) {
      const angle = body.phase + (Math.PI * 2 * simulationDays) / body.period;
      body.position.copy(body.parent.position);
      body.position.x += Math.cos(angle) * body.moonDistance;
      body.position.y += Math.sin(angle) * body.moonDistance;
      body.mesh.position.copy(body.position);

      // Synchronous rotation: the same side of the Moon faces Earth.
      body.mesh.rotation.z = angle + Math.PI;
      body.orbitLine.position.copy(body.parent.position);
      continue;
    }

    body.position.copy(orbitalPosition(body, simulationDays));
    body.mesh.position.copy(body.position);

    if (body.rotation !== 0) {
      body.mesh.rotation.y +=
        ((Math.PI * 2 * SIMULATION_DAYS_PER_SECOND) / body.rotation) *
        (deltaDays / SIMULATION_DAYS_PER_SECOND);
    }
  }
}

function updateSpeedButtons() {
  document.querySelectorAll(".speed-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.speed === selectedSpeed);
  });
}

function updateTargetReadout() {
  const panel = document.getElementById("targetReadout");

  if (!targetBody) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  document.getElementById("targetName").textContent = targetBody.name;
}

function formatDistance(units) {
  const au = units / AU;
  if (au >= 0.01) return `${au.toFixed(2)} AU`;
  return `${Math.round(units * 150000).toLocaleString()} km`;
}

function updateHUD() {
  const sunDistance = camera.position.length();
  document.querySelector("#distanceReadout strong").textContent =
    `${(sunDistance / AU).toFixed(2)} AU`;

  const fill = document.getElementById("energyFill");
  fill.style.width = `${energy}%`;
  fill.style.background = energy < 25 ? "#ff9a73" : "#85d9a1";
  document.getElementById("energyPercent").textContent = `${Math.round(energy)}%`;

  const warning = document.getElementById("energyWarning");
  warning.textContent =
    energy < 20 && selectedSpeed !== "chill" ? "LOW ENERGY" : "";

  const targetDistance = document.getElementById("targetDistance");
  if (targetBody) {
    targetDistance.textContent = formatDistance(
      camera.position.distanceTo(targetBody.position)
    );
  }

  let nearest = null;
  let nearestDistance = Infinity;

  for (const body of bodyRecords) {
    if (body.isSun) continue;
    const distance = camera.position.distanceTo(body.position) - body.radius;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = body;
    }
  }

  const info = document.getElementById("planetInfo");
  if (nearest && nearestDistance <= 15) {
    info.classList.remove("hidden");
    document.getElementById("nearbyPlanetName").textContent = nearest.name;
    document.getElementById("nearbyPlanetDistance").textContent =
      `${Math.max(0, Math.round(nearestDistance * 150000)).toLocaleString()} km`;
  } else {
    info.classList.add("hidden");
  }
}

function updateLabels(force = false) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const margin = 9;
  const cameraInverse = camera.matrixWorldInverse;

  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  const candidates = [];

  for (const record of labelRecords) {
    const { body, button, line } = record;

    tempVector.copy(body.position).project(camera);
    const cameraSpace = body.position.clone().applyMatrix4(cameraInverse);

    const onScreen =
      cameraSpace.z < 0 &&
      tempVector.x >= -1 &&
      tempVector.x <= 1 &&
      tempVector.y >= -1 &&
      tempVector.y <= 1;

    let anchorX;
    let anchorY;

    if (onScreen) {
      anchorX = (tempVector.x * 0.5 + 0.5) * width;
      anchorY = (-tempVector.y * 0.5 + 0.5) * height;
    } else {
      let dx = cameraSpace.x;
      let dy = -cameraSpace.y;

      if (cameraSpace.z > 0) {
        dx *= -1;
        dy *= -1;
      }

      if (Math.abs(dx) + Math.abs(dy) < 0.001) dy = -1;

      const scale = Math.min(
        (width * 0.44) / Math.max(Math.abs(dx), 0.001),
        (height * 0.38) / Math.max(Math.abs(dy), 0.001)
      );

      anchorX = width / 2 + dx * scale;
      anchorY = height / 2 + dy * scale;
      anchorX = THREE.MathUtils.clamp(anchorX, margin + 4, width - margin - 4);
      anchorY = THREE.MathUtils.clamp(anchorY, margin + 4, height - margin - 4);
    }

    const distance = camera.position.distanceTo(body.position);
    const isTarget = body === targetBody;

    button.classList.toggle("offscreen", !onScreen);
    button.classList.toggle("targeted", isTarget);
    button.style.opacity = isTarget ? "1" : String(
      onScreen ? THREE.MathUtils.clamp(0.55 + 900 / (distance + 900), 0.55, 0.92) : 0.72
    );

    candidates.push({
      body,
      button,
      line,
      anchorX,
      anchorY,
      x: anchorX + 12,
      y: anchorY - 12,
      isTarget
    });
  }

  // Gently separate labels that would otherwise overlap on small screens.
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];
        if (Math.abs(a.x - b.x) < 90 && Math.abs(a.y - b.y) < 24) {
          const push = a.isTarget ? -12 : 12;
          b.y += push;
          a.y -= push * 0.35;
        }
      }
    }
  }

  for (const item of candidates) {
    const boxWidth = item.button.offsetWidth || 76;
    const boxHeight = item.button.offsetHeight || 23;

    item.x = THREE.MathUtils.clamp(item.x, margin, width - boxWidth - margin);
    item.y = THREE.MathUtils.clamp(item.y, margin + boxHeight / 2, height - margin - boxHeight / 2);
    item.button.style.left = `${item.x}px`;
    item.button.style.top = `${item.y}px`;

    const endX = item.x;
    const endY = item.y;
    item.line.setAttribute("x1", item.anchorX);
    item.line.setAttribute("y1", item.anchorY);
    item.line.setAttribute("x2", endX);
    item.line.setAttribute("y2", endY);
    item.line.classList.toggle("targeted", item.isTarget);
  }
}

function updateCameraRotation() {
  camera.rotation.set(pitch, yaw, 0, "YXZ");
}

function movePlayer(delta) {
  const moving =
    pressedDirections.has("forward") ||
    pressedDirections.has("back") ||
    pressedDirections.has("left") ||
    pressedDirections.has("right") ||
    pressedDirections.has("up") ||
    pressedDirections.has("down");

  if (!moving) {
    if (camera.position.length() < 180) {
      energy = Math.min(100, energy + delta * 9);
    }
    return;
  }

  camera.updateMatrixWorld();
  forwardVector.set(0, 0, -1).applyQuaternion(camera.quaternion);
  rightVector.set(1, 0, 0).applyQuaternion(camera.quaternion);
  upVector.set(0, 1, 0).applyQuaternion(camera.quaternion);

  moveVector.set(0, 0, 0);

  if (pressedDirections.has("forward")) moveVector.add(forwardVector);
  if (pressedDirections.has("back")) moveVector.sub(forwardVector);
  if (pressedDirections.has("right")) moveVector.add(rightVector);
  if (pressedDirections.has("left")) moveVector.sub(rightVector);
  if (pressedDirections.has("up")) moveVector.add(upVector);
  if (pressedDirections.has("down")) moveVector.sub(upVector);

  if (moveVector.lengthSq() > 0) {
    moveVector.normalize();

    const mode = speedModes[selectedSpeed];
    const distance = mode.speed * delta;
    camera.position.addScaledVector(moveVector, distance);

    if (mode.drain > 0) {
      energy = Math.max(0, energy - mode.drain * delta);
      if (energy <= 0) {
        selectedSpeed = "chill";
        updateSpeedButtons();
      }
    }
  }

  // Solar energy recharge while near the Sun.
  if (camera.position.length() < 180) {
    energy = Math.min(100, energy + delta * 9);
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (!renderer || !camera) return;

  const delta = Math.min(clock.getDelta(), 0.05);

  if (started) {
    updateOrbitalBodies(delta * SIMULATION_DAYS_PER_SECOND);
    movePlayer(delta);
    updateHUD();

    labelUpdateTimer += delta;
    if (labelUpdateTimer >= 0.1) {
      labelUpdateTimer = 0;
      updateLabels();
    }
  }

  renderer.render(scene, camera);
}

function beginGame() {
  started = true;
  loadingScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  gameUI.classList.remove("hidden");
  canvas.focus?.();
  clock.start();
  updateLabels(true);
}

function setupControls() {
  document.getElementById("startButton").addEventListener("click", beginGame);

  document.querySelectorAll(".speed-button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSpeed = button.dataset.speed;
      updateSpeedButtons();
    });
  });

  document.getElementById("clearTarget").addEventListener("click", () => {
    targetBody = null;
    updateTargetReadout();
    updateLabels(true);
  });

  document.querySelectorAll("[data-move]").forEach((button) => {
    const direction = button.dataset.move;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      pointerDirections.set(event.pointerId, direction);
      pressedDirections.add(direction);
      button.classList.add("active");
    });

    const release = (event) => {
      const heldDirection = pointerDirections.get(event.pointerId);
      if (!heldDirection) return;

      pointerDirections.delete(event.pointerId);
      pressedDirections.delete(heldDirection);
      button.classList.remove("active");
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (!started) return;
    dragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || !started) return;

    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    yaw -= dx * 0.0032;
    pitch -= dy * 0.0032;
    pitch = THREE.MathUtils.clamp(pitch, -Math.PI * 0.49, Math.PI * 0.49);
    updateCameraRotation();
  });

  const stopDragging = () => {
    dragging = false;
  };

  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);

  // Optional desktop fallback; touchscreen remains the primary control method.
  window.addEventListener("keydown", (event) => {
    const keys = {
      ArrowUp: "forward",
      ArrowDown: "back",
      ArrowLeft: "left",
      ArrowRight: "right",
      Space: "up",
      ShiftLeft: "down"
    };

    if (keys[event.code]) {
      event.preventDefault();
      pressedDirections.add(keys[event.code]);
    }
  });

  window.addEventListener("keyup", (event) => {
    const keys = {
      ArrowUp: "forward",
      ArrowDown: "back",
      ArrowLeft: "left",
      ArrowRight: "right",
      Space: "up",
      ShiftLeft: "down"
    };

    if (keys[event.code]) pressedDirections.delete(keys[event.code]);
  });
}

function resize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateLabels(true);
}

async function startApp() {
  try {
    createScene();
    setupControls();
    updateSpeedButtons();
    window.addEventListener("resize", resize);

    loadingScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");

    animate();
  } catch (error) {
    console.error(error);
    showError("Could not create the 3D scene. Please try reloading the page.");
  }
}

startApp();
```
