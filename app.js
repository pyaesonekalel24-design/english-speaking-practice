import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


// ============================================================
// REAL SOLAR SYSTEM SCALE
// ============================================================

// 1 game unit = 150,000 km
// 1 AU ≈ 1000 game units

const AU = 1000;


// ============================================================
// SIMULATION
// ============================================================

const SIMULATION_DAYS_PER_SECOND = 30;


// ============================================================
// SCENE
// ============================================================

const scene =
  new THREE.Scene();

scene.background =
  new THREE.Color(0x000000);

scene.fog =
  new THREE.FogExp2(
    0x000000,
    0.000015
  );


// ============================================================
// CAMERA
// ============================================================

const camera =
  new THREE.PerspectiveCamera(
    75,
    window.innerWidth /
      window.innerHeight,
    0.001,
    1000000
  );

camera.position.set(
  0,
  20,
  1200
);


// ============================================================
// RENDERER
// ============================================================

const renderer =
  new THREE.WebGLRenderer({
    antialias: true
  });

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

document
  .getElementById("game")
  .appendChild(
    renderer.domElement
  );


// ============================================================
// LIGHT
// ============================================================

const ambientLight =
  new THREE.AmbientLight(
    0xffffff,
    0.12
  );

scene.add(
  ambientLight
);


const sunLight =
  new THREE.PointLight(
    0xffffff,
    2.5,
    0,
    1
  );

scene.add(
  sunLight
);


// ============================================================
// SUN
// ============================================================

const SUN_RADIUS = 4.65;

const sunGeometry =
  new THREE.SphereGeometry(
    SUN_RADIUS,
    64,
    64
  );

const sunMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xffcc55
  });

const sun =
  new THREE.Mesh(
    sunGeometry,
    sunMaterial
  );

scene.add(
  sun
);


const glowGeometry =
  new THREE.SphereGeometry(
    SUN_RADIUS * 1.35,
    32,
    32
  );

const glowMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: 0.12
  });

const sunGlow =
  new THREE.Mesh(
    glowGeometry,
    glowMaterial
  );

scene.add(
  sunGlow
);


// ============================================================
// PLANET DATA
// ============================================================

const planetData = [

  {
    name: "Mercury",
    radius: 0.0163,
    distance: 0.3871 * AU,
    orbitDays: 87.97,
    rotationDays: 58.646,
    eccentricity: 0.2056,
    color: 0xaaaaaa
  },

  {
    name: "Venus",
    radius: 0.0405,
    distance: 0.7233 * AU,
    orbitDays: 224.70,
    rotationDays: -243.025,
    eccentricity: 0.0068,
    color: 0xd9a066
  },

  {
    name: "Earth",
    radius: 0.0426,
    distance: 1.0000 * AU,
    orbitDays: 365.256,
    rotationDays: 0.9973,
    eccentricity: 0.0167,
    color: 0x3377ff
  },

  {
    name: "Mars",
    radius: 0.0227,
    distance: 1.5237 * AU,
    orbitDays: 686.98,
    rotationDays: 1.026,
    eccentricity: 0.0934,
    color: 0xcc4422
  },

  {
    name: "Jupiter",
    radius: 0.4673,
    distance: 5.2028 * AU,
    orbitDays: 4332.59,
    rotationDays: 0.4135,
    eccentricity: 0.0489,
    color: 0xc9905c
  },

  {
    name: "Saturn",
    radius: 0.3893,
    distance: 9.5388 * AU,
    orbitDays: 10759.22,
    rotationDays: 0.4440,
    eccentricity: 0.0565,
    color: 0xd8c18a
  },

  {
    name: "Uranus",
    radius: 0.1695,
    distance: 19.1914 * AU,
    orbitDays: 30688.5,
    rotationDays: -0.7183,
    eccentricity: 0.0463,
    color: 0x66ccdd
  },

  {
    name: "Neptune",
    radius: 0.1646,
    distance: 30.0611 * AU,
    orbitDays: 60182,
    rotationDays: 0.6713,
    eccentricity: 0.0095,
    color: 0x3366dd
  }

];


const planets = [];


// ============================================================
// CREATE PLANETS
// ============================================================

function createPlanet(data) {

  const geometry =
    new THREE.SphereGeometry(
      data.radius,
      32,
      32
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.8,
      metalness: 0
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  scene.add(
    mesh
  );

  const planet = {

    ...data,

    mesh,

    orbitAngle:
      Math.random() *
      Math.PI *
      2,

    baseScale: 1

  };

  planets.push(
    planet
  );

  return planet;
}


for (
  const data of planetData
) {

  createPlanet(
    data
  );

}


// ============================================================
// SATURN RINGS
// ============================================================

const saturn =
  planets.find(
    planet =>
      planet.name ===
      "Saturn"
  );

const ringGeometry =
  new THREE.RingGeometry(
    0.42,
    0.65,
    64
  );

const ringMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xc8b98a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65
  });

const rings =
  new THREE.Mesh(
    ringGeometry,
    ringMaterial
  );

rings.rotation.x =
  Math.PI / 2;

saturn.mesh.add(
  rings
);


// ============================================================
// ORBITS
// ============================================================

function createOrbit(planet) {

  const points = [];

  const segments = 256;

  const a =
    planet.distance;

  const b =
    a *
    Math.sqrt(
      1 -
      planet.eccentricity *
      planet.eccentricity
    );

  const focusOffset =
    a *
    planet.eccentricity;

  for (
    let i = 0;
    i <= segments;
    i++
  ) {

    const angle =
      (i / segments) *
      Math.PI *
      2;

    const x =
      a *
      Math.cos(angle) -
      focusOffset;

    const z =
      b *
      Math.sin(angle);

    points.push(
      new THREE.Vector3(
        x,
        0,
        z
      )
    );

  }

  const geometry =
    new THREE.BufferGeometry()
      .setFromPoints(
        points
      );

  const material =
    new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.5
    });

  const orbit =
    new THREE.LineLoop(
      geometry,
      material
    );

  scene.add(
    orbit
  );

}


for (
  const planet of planets
) {

  createOrbit(
    planet
  );

}


// ============================================================
// EARTH + MOON
// ============================================================

const earth =
  planets.find(
    planet =>
      planet.name ===
      "Earth"
  );

const MOON_RADIUS =
  0.0116;

const MOON_DISTANCE =
  2.569;

const MOON_ORBIT_DAYS =
  27.321661;

const moonGeometry =
  new THREE.SphereGeometry(
    MOON_RADIUS,
    24,
    24
  );

const moonMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 1
  });

const moon =
  new THREE.Mesh(
    moonGeometry,
    moonMaterial
  );

scene.add(
  moon
);

let moonAngle = 0;


// Moon orbit line

const moonOrbitPoints = [];

const moonOrbitSegments = 96;

for (
  let i = 0;
  i <= moonOrbitSegments;
  i++
) {

  const angle =
    (i / moonOrbitSegments) *
    Math.PI *
    2;

  moonOrbitPoints.push(
    new THREE.Vector3(
      Math.cos(angle) *
        MOON_DISTANCE,
      0,
      Math.sin(angle) *
        MOON_DISTANCE
    )
  );

}

const moonOrbitGeometry =
  new THREE.BufferGeometry()
    .setFromPoints(
      moonOrbitPoints
    );

const moonOrbitMaterial =
  new THREE.LineBasicMaterial({
    color: 0x444444,
    transparent: true,
    opacity: 0.35
  });

const moonOrbit =
  new THREE.LineLoop(
    moonOrbitGeometry,
    moonOrbitMaterial
  );

scene.add(
  moonOrbit
);


// ============================================================
// STARS
// ============================================================

const starCount =
  12000;

const starPositions =
  new Float32Array(
    starCount * 3
  );

for (
  let i = 0;
  i < starCount;
  i++
) {

  const i3 =
    i * 3;

  const radius =
    3000 +
    Math.random() *
    5000;

  const theta =
    Math.random() *
    Math.PI *
    2;

  const phi =
    Math.acos(
      2 *
        Math.random() -
      1
    );

  starPositions[i3] =
    radius *
    Math.sin(phi) *
    Math.cos(theta);

  starPositions[i3 + 1] =
    radius *
    Math.cos(phi);

  starPositions[i3 + 2] =
    radius *
    Math.sin(phi) *
    Math.sin(theta);

}

const starGeometry =
  new THREE.BufferGeometry();

starGeometry.setAttribute(
  "position",

  new THREE.BufferAttribute(
    starPositions,
    3
  )
);

const starMaterial =
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    sizeAttenuation: true
  });

const stars =
  new THREE.Points(
    starGeometry,
    starMaterial
  );

scene.add(
  stars
);


// ============================================================
// PLAYER
// ============================================================

const velocity =
  new THREE.Vector3();

const direction =
  new THREE.Vector3();

let flying = false;


// ============================================================
// GAME MODE
// ============================================================

let gameMode =
  "space";


// space
// mars


const modeDisplay =
  document.getElementById(
    "modeDisplay"
  );


// ============================================================
// SPEED
// ============================================================

const CHILL_SPEED =
  180;

const SONIC_SPEED =
  CHILL_SPEED * 2;

const POOP_SPEED =
  CHILL_SPEED * 4;

let currentSpeedMode =
  "chill";

let energy =
  100;

const SONIC_DRAIN =
  7;

const POOP_DRAIN =
  22;

const SUN_REFILL_DISTANCE =
  180;


// ============================================================
// MARS LANDING SYSTEM
// ============================================================

const mars =
  planets.find(
    planet =>
      planet.name ===
      "Mars"
  );


// Distance at which the local Mars world begins.

const MARS_APPROACH_DISTANCE =
  140;


// Distance at which we consider the player
// to be inside the local Mars environment.

const MARS_LOCAL_DISTANCE =
  85;


// Local playable Mars radius.
//
// This is deliberately much larger than
// the astronomical Mars sphere.
//
// The transition lets us go from:
// astronomical scale
// ->
// human-scale exploration.

const LOCAL_MARS_RADIUS =
  55;


// Height above surface where walking starts.

const MARS_SURFACE_HEIGHT =
  2.2;


// Mars gravity.

const MARS_GRAVITY =
  8.5;


// Jump velocity.

const MARS_JUMP_SPEED =
  12;


// Mars movement speed.

const MARS_WALK_SPEED =
  22;


// Whether the player has entered
// the local Mars environment.

let marsLocalMode =
  false;


// Whether the player is actually
// standing on the surface.

let marsGrounded =
  false;


// Vertical velocity for Mars gravity.

let marsVerticalVelocity =
  0;


// Mars center is updated from the real
// astronomical Mars position.

const marsCenter =
  new THREE.Vector3();


// ============================================================
// LOCAL MARS SURFACE
// ============================================================

const marsSurfaceGroup =
  new THREE.Group();

marsSurfaceGroup.visible =
  false;

scene.add(
  marsSurfaceGroup
);


// Red Mars sphere.

const marsSurfaceGeometry =
  new THREE.SphereGeometry(
    LOCAL_MARS_RADIUS,
    96,
    64
  );

const marsSurfaceMaterial =
  new THREE.MeshStandardMaterial({

    color: 0x9b321f,

    roughness: 1,

    metalness: 0

  });

const marsSurface =
  new THREE.Mesh(
    marsSurfaceGeometry,
    marsSurfaceMaterial
  );

marsSurfaceGroup.add(
  marsSurface
);


// Slight darker lower layer gives
// the planet more depth.

const marsRockGeometry =
  new THREE.SphereGeometry(
    LOCAL_MARS_RADIUS * 0.985,
    64,
    48
  );

const marsRockMaterial =
  new THREE.MeshStandardMaterial({

    color: 0x672015,

    roughness: 1

  });

const marsRock =
  new THREE.Mesh(
    marsRockGeometry,
    marsRockMaterial
  );

marsRock.scale.set(
  1.002,
  1.002,
  1.002
);


// Don't use the rock yet.
// Keeping the object here makes future
// terrain expansion easier.

marsSurfaceGroup.add(
  marsRock
);


// ============================================================
// MARS TERRAIN DETAILS
// ============================================================

// A small number of large rocks.
// These are placed around the local surface
// to make the first landing zone less empty.

const marsRocks =
  new THREE.Group();

marsSurfaceGroup.add(
  marsRocks
);


function addMarsRock(
  latitude,
  longitude,
  size
) {

  const geometry =
    new THREE.DodecahedronGeometry(
      size,
      1
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x642216,
      roughness: 1
    });

  const rock =
    new THREE.Mesh(
      geometry,
      material
    );

  const lat =
    THREE.MathUtils.degToRad(
      latitude
    );

  const lon =
    THREE.MathUtils.degToRad(
      longitude
    );

  const radius =
    LOCAL_MARS_RADIUS +
    size * 0.35;

  rock.position.set(

    radius *
      Math.cos(lat) *
      Math.cos(lon),

    radius *
      Math.sin(lat),

    radius *
      Math.cos(lat) *
      Math.sin(lon)

  );

  rock.lookAt(
    rock.position.clone()
      .multiplyScalar(2)
  );

  marsRocks.add(
    rock
  );

}


addMarsRock(
  2,
  12,
  3.2
);

addMarsRock(
  -4,
  42,
  2.4
);

addMarsRock(
  5,
  78,
  4
);

addMarsRock(
  -3,
  125,
  2.8
);

addMarsRock(
  7,
  180,
  3.6
);

addMarsRock(
  -6,
  235,
  2.5
);

addMarsRock(
  3,
  285,
  4.2
);

addMarsRock(
  -5,
  330,
  2.6
);


// ============================================================
// KEYBOARD
// ============================================================

const keys = {};

document.addEventListener(
  "keydown",
  event => {

    keys[event.code] =
      true;

  }
);

document.addEventListener(
  "keyup",
  event => {

    keys[event.code] =
      false;

  }
);


// ============================================================
// MOUSE LOOK
// ============================================================

let yaw =
  0;

let pitch =
  0;

document.addEventListener(
  "mousemove",
  event => {

    if (!flying) return;

    const sensitivity =
      gameMode === "mars"
        ? 0.0018
        : 0.002;

    yaw -=
      event.movementX *
      sensitivity;

    pitch -=
      event.movementY *
      sensitivity;

    const limit =
      Math.PI / 2 -
      0.05;

    pitch =
      Math.max(
        -limit,

        Math.min(
          limit,
          pitch
        )
      );

    camera.rotation.order =
      "YXZ";

    camera.rotation.y =
      yaw;

    camera.rotation.x =
      pitch;

  }
);


// ============================================================
// START
// ============================================================

const startButton =
  document.getElementById(
    "startButton"
  );

startButton.addEventListener(
  "click",
  () => {

    document
      .getElementById(
        "startScreen"
      )
      .classList.add(
        "hidden"
      );

    flying =
      true;

    renderer.domElement
      .requestPointerLock?.();

  }
);


// Desktop click

renderer.domElement.addEventListener(
  "click",
  () => {

    if (!flying) return;

    renderer.domElement
      .requestPointerLock?.();

  }
);


// ============================================================
// SPEED BUTTONS
// ============================================================

const chillButton =
  document.getElementById(
    "chillButton"
  );

const sonicButton =
  document.getElementById(
    "sonicButton"
  );

const poopButton =
  document.getElementById(
    "poopButton"
  );


function updateSpeedButtons() {

  chillButton.classList.remove(
    "active"
  );

  sonicButton.classList.remove(
    "active"
  );

  poopButton.classList.remove(
    "active"
  );


  if (
    currentSpeedMode ===
    "chill"
  ) {

    chillButton.classList.add(
      "active"
    );

  }


  if (
    currentSpeedMode ===
    "sonic"
  ) {

    sonicButton.classList.add(
      "active"
    );

  }


  if (
    currentSpeedMode ===
    "poop"
  ) {

    poopButton.classList.add(
      "active"
    );

  }

}


function setSpeedMode(
  mode
) {

  if (
    energy <= 0 &&
    mode !== "chill"
  ) {

    currentSpeedMode =
      "chill";

    updateSpeedButtons();

    return;

  }

  currentSpeedMode =
    mode;

  updateSpeedButtons();

}


chillButton.addEventListener(
  "click",
  () => {

    setSpeedMode(
      "chill"
    );

  }
);


sonicButton.addEventListener(
  "click",
  () => {

    setSpeedMode(
      "sonic"
    );

  }
);


poopButton.addEventListener(
  "click",
  () => {

    setSpeedMode(
      "poop"
    );

  }
);


// ============================================================
// MOBILE BUTTON HELPER
// ============================================================

function bindMobileButton(
  id,
  key
) {

  const button =
    document.getElementById(
      id
    );

  if (!button) return;

  const start =
    event => {

      event.preventDefault();

      keys[key] =
        true;

    };


  const stop =
    event => {

      event.preventDefault();

      keys[key] =
        false;

    };


  button.addEventListener(
    "touchstart",
    start,
    {
      passive: false
    }
  );

  button.addEventListener(
    "touchend",
    stop,
    {
      passive: false
    }
  );

  button.addEventListener(
    "touchcancel",
    stop,
    {
      passive: false
    }
  );

  button.addEventListener(
    "mousedown",
    start
  );

  button.addEventListener(
    "mouseup",
    stop
  );

  button.addEventListener(
    "mouseleave",
    stop
  );

}


bindMobileButton(
  "forwardButton",
  "KeyW"
);

bindMobileButton(
  "backButton",
  "KeyS"
);

bindMobileButton(
  "leftButton",
  "KeyA"
);

bindMobileButton(
  "rightButton",
  "KeyD"
);

bindMobileButton(
  "upButton",
  "Space"
);

bindMobileButton(
  "downButton",
  "ShiftLeft"
);


// ============================================================
// MOBILE LOOK
// ============================================================

let lookTouch =
  null;

renderer.domElement.addEventListener(
  "touchstart",
  event => {

    if (!flying) return;

    if (
      event.target.closest(
        "#mobileControls"
      )
    ) {

      return;

    }

    const touch =
      event.touches[0];

    lookTouch = {

      id:
        touch.identifier,

      x:
        touch.clientX,

      y:
        touch.clientY

    };

  },
  {
    passive: false
  }
);


renderer.domElement.addEventListener(
  "touchmove",
  event => {

    if (
      !flying ||
      !lookTouch
    ) {

      return;

    }

    const touch =
      [...event.touches]
        .find(
          t =>
            t.identifier ===
            lookTouch.id
        );

    if (!touch) return;

    const dx =
      touch.clientX -
      lookTouch.x;

    const dy =
      touch.clientY -
      lookTouch.y;

    const sensitivity =
      gameMode === "mars"
        ? 0.003
        : 0.004;

    yaw -=
      dx *
      sensitivity;

    pitch -=
      dy *
      sensitivity;

    const limit =
      Math.PI / 2 -
      0.05;

    pitch =
      Math.max(
        -limit,

        Math.min(
          limit,
          pitch
        )
      );

    camera.rotation.order =
      "YXZ";

    camera.rotation.y =
      yaw;

    camera.rotation.x =
      pitch;

    lookTouch.x =
      touch.clientX;

    lookTouch.y =
      touch.clientY;

    event.preventDefault();

  },
  {
    passive: false
  }
);


renderer.domElement.addEventListener(
  "touchend",
  () => {

    lookTouch =
      null;

  }
);


// ============================================================
// ENERGY
// ============================================================

const energyFill =
  document.getElementById(
    "energyFill"
  );

const energyText =
  document.getElementById(
    "energyText"
  );


function updateEnergy(
  delta,
  isMoving
) {

  const distance =
    camera.position.length();

  // Sun charging only in space.

  if (
    gameMode === "space" &&
    distance <
    SUN_REFILL_DISTANCE
  ) {

    energy +=
      28 *
      delta;

  }


  if (
    gameMode === "space" &&
    isMoving &&
    currentSpeedMode ===
      "sonic"
  ) {

    energy -=
      SONIC_DRAIN *
      delta;

  }


  if (
    gameMode === "space" &&
    isMoving &&
    currentSpeedMode ===
      "poop"
  ) {

    energy -=
      POOP_DRAIN *
      delta;

  }


  energy =
    Math.max(
      0,

      Math.min(
        100,
        energy
      )
    );


  if (
    energy <= 0 &&
    currentSpeedMode !==
      "chill"
  ) {

    energy =
      0;

    currentSpeedMode =
      "chill";

    updateSpeedButtons();

  }


  energyFill.style.width =
    energy + "%";

  energyText.textContent =
    Math.round(
      energy
    ) + "%";

}


// ============================================================
// PLANETS
// ============================================================

function updatePlanets(
  delta
) {

  const daysPassed =
    delta *
    SIMULATION_DAYS_PER_SECOND;


  for (
    const planet of planets
  ) {

    const degreesPerDay =
      360 /
      planet.orbitDays;

    const orbitRadians =
      THREE.MathUtils.degToRad(
        degreesPerDay
      ) *
      daysPassed;

    planet.orbitAngle +=
      orbitRadians;

    const a =
      planet.distance;

    const e =
      planet.eccentricity;

    const b =
      a *
      Math.sqrt(
        1 -
        e *
        e
      );

    const focusOffset =
      a *
      e;

    planet.mesh.position.x =
      a *
      Math.cos(
        planet.orbitAngle
      ) -
      focusOffset;

    planet.mesh.position.z =
      b *
      Math.sin(
        planet.orbitAngle
      );


    // Rotation

    const rotationDays =
      planet.rotationDays;

    const rotationRadians =
      (
        Math.PI *
        2 *
        daysPassed
      ) /
      Math.abs(
        rotationDays
      );


    if (
      rotationDays > 0
    ) {

      planet.mesh.rotation.y +=
        rotationRadians;

    } else {

      planet.mesh.rotation.y -=
        rotationRadians;

    }

  }


  // Moon

  const moonDegreesPerDay =
    360 /
    MOON_ORBIT_DAYS;

  const moonOrbitRadians =
    THREE.MathUtils.degToRad(
      moonDegreesPerDay
    ) *
    daysPassed;

  moonAngle +=
    moonOrbitRadians;

  moon.position.x =
    earth.mesh.position.x +
    Math.cos(
      moonAngle
    ) *
    MOON_DISTANCE;

  moon.position.y =
    earth.mesh.position.y;

  moon.position.z =
    earth.mesh.position.z +
    Math.sin(
      moonAngle
    ) *
    MOON_DISTANCE;

  moon.rotation.y =
    moonAngle;

}


// ============================================================
// PLANET LABELS
// ============================================================

const labelLayer =
  document.getElementById(
    "labelLayer"
  );

const labelObjects = [];


for (
  const planet of planets
) {

  const element =
    document.createElement(
      "div"
    );

  element.className =
    "planetLabel";

  const text =
    document.createElement(
      "div"
    );

  text.className =
    "planetLabelText";

  text.textContent =
    planet.name;

  const line =
    document.createElement(
      "div"
    );

  line.className =
    "planetLabelLine";

  element.appendChild(
    text
  );

  element.appendChild(
    line
  );

  labelLayer.appendChild(
    element
  );

  labelObjects.push({
    planet,
    element
  });

}


function updatePlanetLabels() {

  const width =
    window.innerWidth;

  const height =
    window.innerHeight;

  const temp =
    new THREE.Vector3();


  for (
    const item of labelObjects
  ) {

    const planet =
      item.planet;

    temp.copy(
      planet.mesh.position
    );

    temp.project(
      camera
    );


    const behindCamera =
      temp.z > 1;


    const visible =
      !behindCamera &&
      temp.x > -1.15 &&
      temp.x < 1.15 &&
      temp.y > -1.15 &&
      temp.y < 1.15;


    if (!visible) {

      item.element.style.display =
        "none";

      continue;

    }


    const x =
      (temp.x * 0.5 + 0.5) *
      width;

    const y =
      (-temp.y * 0.5 + 0.5) *
      height;


    item.element.style.display =
      "flex";

    item.element.style.left =
      x + "px";

    item.element.style.top =
      y + "px";

  }

}


// ============================================================
// MARS APPROACH
// ============================================================

function getMarsDistance() {

  return camera.position.distanceTo(
    mars.mesh.position
  );

}


function updateMarsApproach() {

  const distance =
    getMarsDistance();


  if (
    distance <
    MARS_APPROACH_DISTANCE
  ) {

    marsMessage.classList.remove(
      "hidden"
    );

    if (
      distance >
      MARS_LOCAL_DISTANCE
    ) {

      marsMessageText.textContent =
        "Mars is getting close...";

    } else {

      marsMessageText.textContent =
        "MARS LOCAL ENVIRONMENT";

    }

  } else {

    marsMessage.classList.add(
      "hidden"
    );

  }


  // Smoothly enlarge Mars when entering
  // the local landing zone.

  const transitionStart =
    MARS_APPROACH_DISTANCE;

  const transitionEnd =
    MARS_LOCAL_DISTANCE;

  let amount =
    0;


  if (
    distance <
    transitionStart
  ) {

    amount =
      1 -
      THREE.MathUtils.clamp(
        (
          distance -
          transitionEnd
        ) /
        (
          transitionStart -
          transitionEnd
        ),
        0,
        1
      );

  }


  // Smooth interpolation.

  const smoothAmount =
    amount *
    amount *
    (
      3 -
      2 *
      amount
    );


  const desiredScale =
    THREE.MathUtils.lerp(
      1,
      LOCAL_MARS_RADIUS /
        mars.radius,
      smoothAmount
    );


  if (!marsLocalMode) {

    mars.mesh.scale.setScalar(
      desiredScale
    );

  }


  // Enter local mode.

  if (
    !marsLocalMode &&
    distance <=
      MARS_LOCAL_DISTANCE
  ) {

    enterMarsLocalMode();

  }

}


function enterMarsLocalMode() {

  marsLocalMode =
    true;

  gameMode =
    "mars";

  modeDisplay.textContent =
    "Mode: MARS";

  marsSurfaceGroup.visible =
    true;

  marsSurfaceGroup.position.copy(
    mars.mesh.position
  );

  mars.mesh.visible =
    false;

  // Put the player at the
  // local surface boundary if
  // they are already too close.

  const offset =
    camera.position.clone()
      .sub(
        marsCenter
      );

  if (
    offset.length() <
    LOCAL_MARS_RADIUS +
    MARS_SURFACE_HEIGHT
  ) {

    offset.normalize();

    if (
      offset.lengthSq() === 0
    ) {

      offset.set(
        0,
        1,
        0
      );

    }

    camera.position.copy(
      marsCenter
        .clone()
        .add(
          offset.multiplyScalar(
            LOCAL_MARS_RADIUS +
            MARS_SURFACE_HEIGHT
          )
        )
    );

  }

  marsVerticalVelocity =
    0;

  marsGrounded =
    false;

}


function exitMarsLocalMode() {

  marsLocalMode =
    false;

  gameMode =
    "space";

  modeDisplay.textContent =
    "Mode: SPACE FLIGHT";

  marsSurfaceGroup.visible =
    false;

  mars.mesh.visible =
    true;

  mars.mesh.scale.setScalar(
    1
  );

  marsVerticalVelocity =
    0;

  marsGrounded =
    false;

}


// ============================================================
// MARS GRAVITY
// ============================================================

function updateMarsGravity(
  delta
) {

  marsCenter.copy(
    mars.mesh.position
  );


  const radial =
    camera.position.clone()
      .sub(
        marsCenter
      );


  const distance =
    radial.length();


  if (
    distance === 0
  ) {

    return;

  }


  const up =
    radial.clone()
      .normalize();


  // Keep the player slightly above
  // the local surface.

  const surfaceHeight =
    LOCAL_MARS_RADIUS +
    MARS_SURFACE_HEIGHT;


  // Gravity while in local mode.

  if (
    !marsGrounded
  ) {

    marsVerticalVelocity -=
      MARS_GRAVITY *
      delta;

  }


  // Jump / upward movement.

  if (
    keys["Space"] &&
    marsGrounded
  ) {

    marsVerticalVelocity =
      MARS_JUMP_SPEED;

    marsGrounded =
      false;

  }


  // Horizontal movement follows
  // the camera's forward/right vectors,
  // then projects them onto Mars surface.

  const forward =
    new THREE.Vector3(
      0,
      0,
      -1
    )
      .applyQuaternion(
        camera.quaternion
      );


  const right =
    new THREE.Vector3(
      1,
      0,
      0
    )
      .applyQuaternion(
        camera.quaternion
      );


  // Project movement onto tangent plane.

  forward.sub(
    up.clone()
      .multiplyScalar(
        forward.dot(up)
      )
  );

  right.sub(
    up.clone()
      .multiplyScalar(
        right.dot(up)
      )
  );


  if (
    forward.lengthSq() > 0
  ) {

    forward.normalize();

  }

  if (
    right.lengthSq() > 0
  ) {

    right.normalize();

  }


  const localMove =
    new THREE.Vector3();


  if (
    keys["KeyW"]
  ) {

    localMove.add(
      forward
    );

  }


  if (
    keys["KeyS"]
  ) {

    localMove.sub(
      forward
    );

  }


  if (
    keys["KeyA"]
  ) {

    localMove.sub(
      right
    );

  }


  if (
    keys["KeyD"]
  ) {

    localMove.add(
      right
    );

  }


  if (
    localMove.lengthSq() > 0
  ) {

    localMove.normalize();

    camera.position.addScaledVector(
      localMove,
      MARS_WALK_SPEED *
      delta
    );

  }


  // Vertical gravity.

  camera.position.addScaledVector(
    up,
    marsVerticalVelocity *
    delta
  );


  // Surface collision.

  const newOffset =
    camera.position.clone()
      .sub(
        marsCenter
      );

  const newDistance =
    newOffset.length();


  if (
    newDistance <=
    surfaceHeight
  ) {

    newOffset.normalize();

    camera.position.copy(
      marsCenter
        .clone()
        .add(
          newOffset.multiplyScalar(
            surfaceHeight
          )
        )
    );

    marsVerticalVelocity =
      0;

    marsGrounded =
      true;

  }


  // If the player flies high enough
  // above Mars, return to space.

  if (
    newDistance >
    LOCAL_MARS_RADIUS +
    42
  ) {

    exitMarsLocalMode();

  }

}


// ============================================================
// SPACE PLAYER MOVEMENT
// ============================================================

function updateSpacePlayer(
  delta
) {

  direction.set(
    0,
    0,
    0
  );


  if (
    keys["KeyW"]
  ) {

    direction.z -= 1;

  }


  if (
    keys["KeyS"]
  ) {

    direction.z += 1;

  }


  if (
    keys["KeyA"]
  ) {

    direction.x -= 1;

  }


  if (
    keys["KeyD"]
  ) {

    direction.x += 1;

  }


  if (
    keys["Space"]
  ) {

    direction.y += 1;

  }


  if (
    keys["ShiftLeft"] ||
    keys["ShiftRight"]
  ) {

    direction.y -= 1;

  }


  const isMoving =
    direction.lengthSq() >
    0;


  if (isMoving) {

    direction.normalize();


    const movement =
      direction.clone();

    movement.applyQuaternion(
      camera.quaternion
    );


    velocity.copy(
      movement
    );


    let speed =
      CHILL_SPEED;


    if (
      currentSpeedMode ===
      "sonic"
    ) {

      speed =
        SONIC_SPEED;

    }


    if (
      currentSpeedMode ===
      "poop"
    ) {

      speed =
        POOP_SPEED;

    }


    camera.position.addScaledVector(
      velocity,
      speed *
      delta
    );

  } else {

    velocity.multiplyScalar(
      0.92
    );

  }


  return isMoving;

}


// ============================================================
// UNIFIED PLAYER UPDATE
// ============================================================

function updatePlayer(
  delta
) {

  if (!flying) {

    return false;

  }


  if (
    gameMode ===
    "mars"
  ) {

    updateMarsGravity(
      delta
    );

    return true;

  }


  return updateSpacePlayer(
    delta
  );

}


// ============================================================
// PLANET DETECTION
// ============================================================

const planetInfo =
  document.getElementById(
    "planetInfo"
  );

const planetName =
  document.getElementById(
    "planetName"
  );

const planetDistance =
  document.getElementById(
    "planetDistance"
  );


function checkNearbyPlanet() {

  let closest =
    null;

  let closestDistance =
    Infinity;


  for (
    const planet of planets
  ) {

    if (
      planet.name ===
      "Mars" &&
      marsLocalMode
    ) {

      continue;

    }


    const distance =
      camera.position.distanceTo(
        planet.mesh.position
      );


    if (
      distance <
      closestDistance
    ) {

      closestDistance =
        distance;

      closest =
        planet;

    }

  }


  const moonDistance =
    camera.position.distanceTo(
      moon.position
    );


  if (
    moonDistance <
    closestDistance
  ) {

    closestDistance =
      moonDistance;

    closest =
      {
        name: "Moon"
      };

  }


  if (
    closest &&
    closestDistance < 15
  ) {

    planetInfo.classList.remove(
      "hidden"
    );

    planetName.textContent =
      closest.name;

    planetDistance.textContent =
      Math.round(
        closestDistance *
        100
      ) /
      100 +
      " units away";

  } else {

    planetInfo.classList.add(
      "hidden"
    );

  }

}


// ============================================================
// HUD
// ============================================================

const speedDisplay =
  document.getElementById(
    "speed"
  );

const locationDisplay =
  document.getElementById(
    "location"
  );


function updateHUD() {

  let speedName =
    "CHILL";


  if (
    currentSpeedMode ===
    "sonic"
  ) {

    speedName =
      "SONIC";

  }


  if (
    currentSpeedMode ===
    "poop"
  ) {

    speedName =
      "U NEED TO POOP";

  }


  speedDisplay.textContent =
    "Speed: " +
    speedName;


  if (
    gameMode ===
    "mars"
  ) {

    const marsDistance =
      camera.position.distanceTo(
        marsCenter
      );

    locationDisplay.textContent =
      "Mars altitude: " +
      Math.max(
        0,
        marsDistance -
        LOCAL_MARS_RADIUS
      ).toFixed(1) +
      " units";

    return;

  }


  const distanceAU =
    camera.position.length() /
    AU;

  locationDisplay.textContent =
    "Distance from Sun: " +
    distanceAU.toFixed(2) +
    " AU";

}


// ============================================================
// RESIZE
// ============================================================

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


// ============================================================
// MARS MESSAGE ELEMENTS
// ============================================================

const marsMessage =
  document.getElementById(
    "marsMessage"
  );

const marsMessageText =
  document.getElementById(
    "marsMessageText"
  );


// ============================================================
// GAME LOOP
// ============================================================

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


  // Solar system continues moving.

  updatePlanets(
    delta
  );


  // Update Mars center after
  // orbital movement.

  marsCenter.copy(
    mars.mesh.position
  );


  // Mars local environment follows
  // the real astronomical Mars position.

  if (
    marsLocalMode
  ) {

    marsSurfaceGroup.position.copy(
      mars.mesh.position
    );

  }


  // Player.

  const isMoving =
    updatePlayer(
      delta
    );


  // Energy.

  updateEnergy(
    delta,
    isMoving
  );


  // Detect approach.

  if (
    gameMode ===
    "space"
  ) {

    updateMarsApproach();

  }


  // Planet labels.

  updatePlanetLabels();


  // Nearby planet popup.

  checkNearbyPlanet();


  // HUD.

  updateHUD();


  renderer.render(
    scene,
    camera
  );

}


// ============================================================
// START
// ============================================================

document
  .getElementById(
    "loading"
  )
  .classList.add(
    "hidden"
  );


updateSpeedButtons();

animate();
