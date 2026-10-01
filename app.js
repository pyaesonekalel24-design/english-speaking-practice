import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


// ============================================================
// SCENE
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x000000);

scene.fog = new THREE.FogExp2(
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
    0.1,
    1000000
  );

camera.position.set(
  0,
  20,
  500
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
  .appendChild(renderer.domElement);


// ============================================================
// LIGHT
// ============================================================

const ambientLight =
  new THREE.AmbientLight(
    0xffffff,
    0.12
  );

scene.add(ambientLight);


// ============================================================
// SUN
// ============================================================

const sunGeometry =
  new THREE.SphereGeometry(
    45,
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

scene.add(sun);


// Sun glow

const glowGeometry =
  new THREE.SphereGeometry(
    58,
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

scene.add(sunGlow);


// Sun light

const sunLight =
  new THREE.PointLight(
    0xffffff,
    2.5,
    0,
    1
  );

scene.add(sunLight);


// ============================================================
// PLANETS
// ============================================================

const planets = [];


function createPlanet(
  name,
  radius,
  distance,
  color,
  speed
) {

  const geometry =
    new THREE.SphereGeometry(
      radius,
      32,
      32
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position.x =
    distance;

  scene.add(mesh);

  planets.push({
    name,
    mesh,
    distance,
    speed
  });

  return mesh;
}


createPlanet(
  "Mercury",
  4,
  100,
  0xaaaaaa,
  0.012
);


createPlanet(
  "Venus",
  7,
  150,
  0xd9a066,
  0.009
);


createPlanet(
  "Earth",
  9,
  210,
  0x3377ff,
  0.007
);


createPlanet(
  "Mars",
  6,
  280,
  0xcc4422,
  0.005
);


createPlanet(
  "Jupiter",
  22,
  430,
  0xc9905c,
  0.0025
);


const saturn =
  createPlanet(
    "Saturn",
    18,
    570,
    0xd8c18a,
    0.0018
  );


createPlanet(
  "Uranus",
  13,
  720,
  0x66ccdd,
  0.0012
);


createPlanet(
  "Neptune",
  13,
  860,
  0x3366dd,
  0.0009
);


// ============================================================
// SATURN RINGS
// ============================================================

const ringGeometry =
  new THREE.RingGeometry(
    25,
    38,
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

saturn.add(rings);


// ============================================================
// ORBITS
// ============================================================

function createOrbit(radius) {

  const points = [];

  const segments = 128;

  for (
    let i = 0;
    i <= segments;
    i++
  ) {

    const angle =
      (i / segments) *
      Math.PI *
      2;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) *
          radius,

        0,

        Math.sin(angle) *
          radius
      )
    );
  }

  const geometry =
    new THREE.BufferGeometry()
      .setFromPoints(points);

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

  scene.add(orbit);
}


for (const planet of planets) {

  createOrbit(
    planet.distance
  );

}


// ============================================================
// STARS
// ============================================================

const starCount = 12000;

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

scene.add(stars);


// ============================================================
// PLAYER
// ============================================================

const velocity =
  new THREE.Vector3();

const direction =
  new THREE.Vector3();

let flying = false;


// Base speed

let normalSpeed = 180;


// Speed limits

const MIN_SPEED = 30;
const MAX_SPEED = 1000;


// ============================================================
// KEYBOARD
// ============================================================

const keys = {};


document.addEventListener(
  "keydown",
  event => {

    keys[event.code] = true;

  }
);


document.addEventListener(
  "keyup",
  event => {

    keys[event.code] = false;

  }
);


// ============================================================
// MOUSE LOOK
// ============================================================

let yaw = 0;
let pitch = 0;


document.addEventListener(
  "mousemove",
  event => {

    if (!flying) return;

    const sensitivity =
      0.002;

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

    flying = true;

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
// MOBILE BUTTON HELPER
// ============================================================

function bindMobileButton(
  id,
  key
) {

  const button =
    document.getElementById(id);

  if (!button) return;


  const start = event => {

    event.preventDefault();

    keys[key] = true;

  };


  const stop = event => {

    event.preventDefault();

    keys[key] = false;

  };


  button.addEventListener(
    "touchstart",
    start,
    { passive: false }
  );

  button.addEventListener(
    "touchend",
    stop,
    { passive: false }
  );

  button.addEventListener(
    "touchcancel",
    stop,
    { passive: false }
  );


  // Also supports mouse testing
  // on desktop

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


// Movement buttons

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


// Vertical buttons

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

let lookTouch = null;


renderer.domElement.addEventListener(
  "touchstart",
  event => {

    if (!flying) return;

    // Ignore touches on buttons

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
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    };

  },
  { passive: false }
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
      0.004;


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
  { passive: false }
);


renderer.domElement.addEventListener(
  "touchend",
  event => {

    if (!event.touches.length) {

      lookTouch = null;

    }

  }
);


// ============================================================
// MOBILE SPEED / PINCH
// ============================================================

const zoomInButton =
  document.getElementById(
    "zoomInButton"
  );

const zoomOutButton =
  document.getElementById(
    "zoomOutButton"
  );


zoomInButton.addEventListener(
  "click",
  () => {

    normalSpeed =
      Math.min(
        MAX_SPEED,
        normalSpeed * 1.35
      );

  }
);


zoomOutButton.addEventListener(
  "click",
  () => {

    normalSpeed =
      Math.max(
        MIN_SPEED,
        normalSpeed / 1.35
      );

  }
);


// Actual pinch gesture

let pinchDistance = null;


renderer.domElement.addEventListener(
  "touchstart",
  event => {

    if (
      event.touches.length === 2
    ) {

      const a =
        event.touches[0];

      const b =
        event.touches[1];

      pinchDistance =
        Math.hypot(
          a.clientX -
            b.clientX,

          a.clientY -
            b.clientY
        );

    }

  },
  { passive: true }
);


renderer.domElement.addEventListener(
  "touchmove",
  event => {

    if (
      event.touches.length !== 2 ||
      pinchDistance === null
    ) {
      return;
    }


    const a =
      event.touches[0];

    const b =
      event.touches[1];


    const currentDistance =
      Math.hypot(
        a.clientX -
          b.clientX,

        a.clientY -
          b.clientY
      );


    const difference =
      currentDistance -
      pinchDistance;


    if (
      Math.abs(difference) > 8
    ) {

      if (difference > 0) {

        normalSpeed =
          Math.min(
            MAX_SPEED,
            normalSpeed * 1.03
          );

      } else {

        normalSpeed =
          Math.max(
            MIN_SPEED,
            normalSpeed / 1.03
          );

      }


      pinchDistance =
        currentDistance;

    }

  },
  { passive: true }
);


renderer.domElement.addEventListener(
  "touchend",
  () => {

    pinchDistance = null;

  }
);


// ============================================================
// PLANET MOTION
// ============================================================

function updatePlanets() {

  for (
    const planet of planets
  ) {

    const angle =
      performance.now() *
      0.001 *
      planet.speed;


    planet.mesh.position.x =
      Math.cos(angle) *
      planet.distance;


    planet.mesh.position.z =
      Math.sin(angle) *
      planet.distance;


    planet.mesh.rotation.y +=
      0.002;

  }

}


// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(delta) {

  if (!flying) return;


  direction.set(
    0,
    0,
    0
  );


  // Forward

  if (
    keys["KeyW"]
  ) {

    direction.z -= 1;

  }


  // Back

  if (
    keys["KeyS"]
  ) {

    direction.z += 1;

  }


  // Left

  if (
    keys["KeyA"]
  ) {

    direction.x -= 1;

  }


  // Right

  if (
    keys["KeyD"]
  ) {

    direction.x += 1;

  }


  // Up

  if (
    keys["Space"]
  ) {

    direction.y += 1;

  }


  // Down

  if (
    keys["ShiftLeft"] ||
    keys["ShiftRight"]
  ) {

    direction.y -= 1;

  }


  if (
    direction.lengthSq() > 0
  ) {

    direction.normalize();


    const movement =
      direction.clone();


    movement.applyQuaternion(
      camera.quaternion
    );


    velocity.copy(
      movement
    );


    camera.position.addScaledVector(
      velocity,
      normalSpeed *
        delta
    );

  } else {

    velocity.multiplyScalar(
      0.92
    );

  }

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

  let closest = null;

  let closestDistance =
    Infinity;


  for (
    const planet of planets
  ) {

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


  if (
    closest &&
    closestDistance < 120
  ) {

    planetInfo.classList.remove(
      "hidden"
    );


    planetName.textContent =
      closest.name;


    planetDistance.textContent =
      Math.round(
        closestDistance
      ) +
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

  speedDisplay.textContent =
    "Speed: " +
    Math.round(
      normalSpeed
    );


  locationDisplay.textContent =
    "Distance from Sun: " +
    Math.round(
      camera.position.length()
    );

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


  updatePlanets();

  updatePlayer(delta);

  checkNearbyPlanet();

  updateHUD();


  renderer.render(
    scene,
    camera
  );

}


document
  .getElementById(
    "loading"
  )
  .classList.add(
    "hidden"
  );


animate();
