import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONFIG & STATE ---
const CONFIG = {
  planetRadius: 18,
  weeks: 52,
  daysPerWeek: 7,
  autoRotateSpeed: 0.8,
  elevationScale: 1.0,
  currentMode: 'sphere', // 'sphere' | 'ring' | 'grid'
  currentTheme: 'tokyo',
  audioEnabled: false
};

const THEMES = {
  tokyo: {
    name: 'Tokyo Night Rainbow',
    bg: 0x030611,
    planetBody: 0x0c0f24,
    coreGlow: 0x00d9ff,
    atmosphere: 0xa855f7,
    ambient: 0x334155,
    levels: [
      { color: 0x181b2e, emissive: 0x090a14, height: 0.4 },
      { color: 0x059669, emissive: 0x024732, height: 1.8 },
      { color: 0x00d9ff, emissive: 0x007799, height: 3.4 },
      { color: 0xa855f7, emissive: 0x581c87, height: 5.2 },
      { color: 0xff2d95, emissive: 0x991b5b, height: 7.5 }
    ]
  },
  cyber: {
    name: 'Cyberpunk Neon',
    bg: 0x020208,
    planetBody: 0x110d1c,
    coreGlow: 0x00f0ff,
    atmosphere: 0xff007f,
    ambient: 0x3b1d3d,
    levels: [
      { color: 0x1a1a2e, emissive: 0x0a0a14, height: 0.4 },
      { color: 0x00f0ff, emissive: 0x006677, height: 1.8 },
      { color: 0xff007f, emissive: 0x880044, height: 3.4 },
      { color: 0x9d00ff, emissive: 0x440077, height: 5.2 },
      { color: 0xfcee0a, emissive: 0x888000, height: 7.5 }
    ]
  },
  matrix: {
    name: 'Emerald Matrix',
    bg: 0x010804,
    planetBody: 0x031709,
    coreGlow: 0x00ff66,
    atmosphere: 0x10b981,
    ambient: 0x064e3b,
    levels: [
      { color: 0x0b1f12, emissive: 0x040d07, height: 0.4 },
      { color: 0x065f46, emissive: 0x022c20, height: 1.8 },
      { color: 0x059669, emissive: 0x044e36, height: 3.4 },
      { color: 0x10b981, emissive: 0x065f46, height: 5.2 },
      { color: 0x00ff66, emissive: 0x009933, height: 7.5 }
    ]
  },
  solar: {
    name: 'Solar Flare',
    bg: 0x0a0402,
    planetBody: 0x1f0b04,
    coreGlow: 0xffaa00,
    atmosphere: 0xef4444,
    ambient: 0x451a03,
    levels: [
      { color: 0x24140d, emissive: 0x120804, height: 0.4 },
      { color: 0xb45309, emissive: 0x451a03, height: 1.8 },
      { color: 0xf59e0b, emissive: 0x78350f, height: 3.4 },
      { color: 0xef4444, emissive: 0x7f1d1d, height: 5.2 },
      { color: 0xffe600, emissive: 0x998800, height: 7.5 }
    ]
  },
  frost: {
    name: 'Deep Frost',
    bg: 0x020814,
    planetBody: 0x081b33,
    coreGlow: 0x38bdf8,
    atmosphere: 0x60a5fa,
    ambient: 0x1e3a5f,
    levels: [
      { color: 0x0f2338, emissive: 0x07111c, height: 0.4 },
      { color: 0x0284c7, emissive: 0x034a70, height: 1.8 },
      { color: 0x38bdf8, emissive: 0x0284c7, height: 3.4 },
      { color: 0x93c5fd, emissive: 0x3b82f6, height: 5.2 },
      { color: 0xffffff, emissive: 0x93c5fd, height: 7.5 }
    ]
  }
};

// --- INITIALIZE THREE.JS SCENE ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(THEMES[CONFIG.currentTheme].bg);
scene.fog = new THREE.FogExp2(THEMES[CONFIG.currentTheme].bg, 0.0035);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(45, 25, 48);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 24;
controls.maxDistance = 140;
controls.autoRotate = true;
controls.autoRotateSpeed = CONFIG.autoRotateSpeed;

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(THEMES[CONFIG.currentTheme].ambient, 1.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
sunLight.position.set(60, 40, 50);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(THEMES[CONFIG.currentTheme].coreGlow, 2.0);
rimLight.position.set(-60, -20, -50);
scene.add(rimLight);

const planetPointLight = new THREE.PointLight(THEMES[CONFIG.currentTheme].coreGlow, 1.5, 60);
planetPointLight.position.set(0, 0, 0);
scene.add(planetPointLight);

// --- CELESTIAL GROUPS ---
const worldGroup = new THREE.Group();
scene.add(worldGroup);

const planetGroup = new THREE.Group();
worldGroup.add(planetGroup);

// --- PLANET CORE & ATMOSPHERE ---
let planetCoreMesh;
let atmosphereMesh;

function createPlanetSphere() {
  const geom = new THREE.SphereGeometry(CONFIG.planetRadius, 64, 64);
  const mat = new THREE.MeshStandardMaterial({
    color: THEMES[CONFIG.currentTheme].planetBody,
    roughness: 0.7,
    metalness: 0.2,
    wireframe: false
  });
  planetCoreMesh = new THREE.Mesh(geom, mat);
  planetGroup.add(planetCoreMesh);

  // Subtle Wireframe overlay
  const wireGeom = new THREE.SphereGeometry(CONFIG.planetRadius + 0.05, 32, 32);
  const wireMat = new THREE.MeshBasicMaterial({
    color: THEMES[CONFIG.currentTheme].coreGlow,
    wireframe: true,
    transparent: true,
    opacity: 0.08
  });
  const wireMesh = new THREE.Mesh(wireGeom, wireMat);
  planetCoreMesh.add(wireMesh);

  // Atmospheric Glow Shell (Fresnel Shader)
  const atmGeom = new THREE.SphereGeometry(CONFIG.planetRadius * 1.15, 48, 48);
  const atmMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 glowColor;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.8);
        gl_FragColor = vec4(glowColor, intensity * 0.75);
      }
    `,
    uniforms: {
      glowColor: { value: new THREE.Color(THEMES[CONFIG.currentTheme].atmosphere) }
    },
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  atmosphereMesh = new THREE.Mesh(atmGeom, atmMat);
  planetGroup.add(atmosphereMesh);
}

// --- SATURN-LIKE PARTICLE RINGS ---
let ringParticles;
function createPlanetaryRings() {
  const particleCount = 2400;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const innerR = CONFIG.planetRadius * 1.45;
  const outerR = CONFIG.planetRadius * 2.35;
  const c1 = new THREE.Color(THEMES[CONFIG.currentTheme].coreGlow);
  const c2 = new THREE.Color(THEMES[CONFIG.currentTheme].atmosphere);

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = innerR + Math.random() * (outerR - innerR);
    const height = (Math.random() - 0.5) * 0.8;

    positions[i * 3] = Math.cos(angle) * dist;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * dist;

    const lerpFactor = (dist - innerR) / (outerR - innerR);
    const pCol = c1.clone().lerp(c2, lerpFactor);
    colors[i * 3] = pCol.r;
    colors[i * 3 + 1] = pCol.g;
    colors[i * 3 + 2] = pCol.b;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.38,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  ringParticles = new THREE.Points(geom, mat);
  ringParticles.rotation.x = THREE.MathUtils.degToRad(25);
  ringParticles.rotation.z = THREE.MathUtils.degToRad(-15);
  planetGroup.add(ringParticles);
}

// --- ORBITING SATELLITE & TRAIL ---
let satelliteGroup;
let satelliteAngle = 0;
function createSatellite() {
  satelliteGroup = new THREE.Group();
  
  // Probe Body
  const bodyGeom = new THREE.BoxGeometry(0.8, 0.8, 1.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.8 });
  const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
  satelliteGroup.add(bodyMesh);

  // Solar Wings
  const wingGeom = new THREE.BoxGeometry(3.6, 0.08, 0.8);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x00d9ff, metalness: 0.6 });
  const wingMesh = new THREE.Mesh(wingGeom, wingMat);
  satelliteGroup.add(wingMesh);

  // Blinking Beacon
  const beaconLight = new THREE.PointLight(0xff2d95, 2, 8);
  beaconLight.position.set(0, 0.6, 0);
  satelliteGroup.add(beaconLight);

  worldGroup.add(satelliteGroup);
}

// --- BACKGROUND STARFIELD ---
function createStarfield() {
  const starCount = 3500;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  const starColors = [new THREE.Color(0xffffff), new THREE.Color(0x00d9ff), new THREE.Color(0xa855f7), new THREE.Color(0xff2d95)];

  for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 500;
    const y = (Math.random() - 0.5) * 500;
    const z = (Math.random() - 0.5) * 500;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const col = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const stars = new THREE.Points(geom, mat);
  scene.add(stars);
}

// --- CONTRIBUTION DATA & BARS GENERATION ---
const contributionBars = [];
const daysData = [];

function generateYearData() {
  daysData.length = 0;
  const today = new Date();
  let totalCommits = 0;
  let maxDay = 0;

  for (let w = 0; w < CONFIG.weeks; w++) {
    for (let d = 0; d < CONFIG.daysPerWeek; d++) {
      const dayOffset = (CONFIG.weeks - 1 - w) * 7 + (6 - d);
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);

      // Realistic pseudo-random commit distribution
      const noise = Math.sin(w * 0.4) * Math.cos(d * 0.8);
      const rand = Math.random();
      let count = 0;
      let level = 0;

      if (rand > 0.35 + noise * 0.15) {
        if (rand > 0.92) { count = Math.floor(Math.random() * 8) + 12; level = 4; }
        else if (rand > 0.78) { count = Math.floor(Math.random() * 5) + 7; level = 3; }
        else if (rand > 0.55) { count = Math.floor(Math.random() * 4) + 3; level = 2; }
        else { count = Math.floor(Math.random() * 2) + 1; level = 1; }
      }

      totalCommits += count;
      if (count > maxDay) maxDay = count;

      daysData.push({
        week: w,
        day: d,
        date: date,
        count: count,
        level: level,
        index: w * 7 + d
      });
    }
  }

  // Update UI Stats Banner
  document.getElementById('stat-total').textContent = totalCommits;
  document.getElementById('stat-max').textContent = maxDay;
  document.getElementById('stat-streak').textContent = `${Math.floor(Math.random() * 18) + 24} DAYS`;
}

// Create 3D Meshes for all 364/365 days
const barsGroup = new THREE.Group();
planetGroup.add(barsGroup);

function buildContributionMeshes() {
  // Clear old meshes
  while (barsGroup.children.length > 0) {
    const obj = barsGroup.children[0];
    barsGroup.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
  }
  contributionBars.length = 0;

  const currentThemeData = THEMES[CONFIG.currentTheme];
  const boxGeom = new THREE.BoxGeometry(0.75, 1, 0.75);
  // Shift origin to bottom of box
  boxGeom.translate(0, 0.5, 0);

  daysData.forEach((item) => {
    const levelInfo = currentThemeData.levels[item.level];
    const mat = new THREE.MeshStandardMaterial({
      color: levelInfo.color,
      emissive: levelInfo.emissive,
      emissiveIntensity: item.level > 0 ? 0.7 : 0.2,
      roughness: 0.3,
      metalness: 0.4
    });

    const mesh = new THREE.Mesh(boxGeom, mat);
    mesh.userData = {
      ...item,
      baseHeight: levelInfo.height,
      origColor: levelInfo.color,
      origEmissive: levelInfo.emissive
    };

    barsGroup.add(mesh);
    contributionBars.push(mesh);
  });

  updateBarLayoutPositions(false);
}

// Calculate target positions based on current mode
function updateBarLayoutPositions(animate = true) {
  const currentThemeData = THEMES[CONFIG.currentTheme];

  contributionBars.forEach((mesh) => {
    const item = mesh.userData;
    const h = Math.max(0.4, item.baseHeight * CONFIG.elevationScale);
    let targetPos = new THREE.Vector3();
    let targetRot = new THREE.Euler();

    if (CONFIG.currentMode === 'sphere') {
      // Cylindrical/spherical Fibonacci projection
      const total = contributionBars.length;
      const phi = Math.acos(1 - (2 * (item.index + 0.5)) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * item.index;

      const r = CONFIG.planetRadius;
      targetPos.x = r * Math.sin(phi) * Math.cos(theta);
      targetPos.y = r * Math.cos(phi);
      targetPos.z = r * Math.sin(phi) * Math.sin(theta);

      // Align box normal pointing outward from sphere center
      const normal = targetPos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
      targetRot.setFromQuaternion(quaternion);

    } else if (CONFIG.currentMode === 'ring') {
      // Halo Ringworld
      const ringRadius = CONFIG.planetRadius * 1.8;
      const angle = (item.week / CONFIG.weeks) * Math.PI * 2;
      const trackWidth = (item.day - 3) * 1.1;

      targetPos.x = Math.cos(angle) * ringRadius;
      targetPos.y = trackWidth;
      targetPos.z = Math.sin(angle) * ringRadius;

      targetRot.set(0, -angle + Math.PI / 2, 0);

    } else if (CONFIG.currentMode === 'grid') {
      // Cyber City Grid
      const spacing = 1.1;
      const startX = -(CONFIG.weeks * spacing) / 2;
      const startZ = -(CONFIG.daysPerWeek * spacing) / 2;

      targetPos.x = startX + item.week * spacing;
      targetPos.y = 0;
      targetPos.z = startZ + item.day * spacing;

      targetRot.set(0, 0, 0);
    }

    if (!animate) {
      mesh.position.copy(targetPos);
      mesh.rotation.copy(targetRot);
      mesh.scale.set(1, h, 1);
    } else {
      mesh.userData.targetPos = targetPos;
      mesh.userData.targetRot = targetRot;
      mesh.userData.targetScaleY = h;
    }
  });

  // Toggle Planet sphere visibility in Grid mode
  if (planetCoreMesh && atmosphereMesh && ringParticles) {
    const isSphere = CONFIG.currentMode === 'sphere';
    planetCoreMesh.visible = isSphere;
    atmosphereMesh.visible = isSphere;
    ringParticles.visible = isSphere;
  }
}

// --- INTERACTIVE RAYCASTER & TOOLTIP ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-1000, -1000);
let hoveredBar = null;
const tooltip = document.getElementById('tooltip');
const tooltipDate = document.getElementById('tooltip-date');
const tooltipWeekday = document.getElementById('tooltip-weekday');
const tooltipCount = document.getElementById('tooltip-count');
const tooltipTier = document.getElementById('tooltip-tier');
const tooltipCoords = document.getElementById('tooltip-coords');
const tooltipDot = document.getElementById('tooltip-dot');

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY - 15}px`;
}

window.addEventListener('mousemove', onMouseMove);

function updateRaycaster() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(contributionBars);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    if (hoveredBar !== hitMesh) {
      // Restore previous
      if (hoveredBar) {
        hoveredBar.material.emissive.setHex(hoveredBar.userData.origEmissive);
        hoveredBar.material.emissiveIntensity = hoveredBar.userData.level > 0 ? 0.7 : 0.2;
        hoveredBar.scale.set(1, hoveredBar.userData.baseHeight * CONFIG.elevationScale, 1);
      }

      hoveredBar = hitMesh;
      hoveredBar.material.emissive.setHex(0xffffff);
      hoveredBar.material.emissiveIntensity = 1.6;
      hoveredBar.scale.set(1.4, (hoveredBar.userData.baseHeight * CONFIG.elevationScale) * 1.25, 1.4);

      // Play SFX blip
      playHoverBlip(hoveredBar.userData.level);

      // Populate Tooltip
      const d = hoveredBar.userData;
      const dateStr = d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
      const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const tierNames = [
        'TIER 0 · NO DETECTED PULSES',
        'TIER 1 · INITIAL COMMITS',
        'TIER 2 · STEADY REPO ORBIT',
        'TIER 3 · HEAVY CONTRIBUTION',
        'TIER 4 · CRITICAL MAXIMUM'
      ];

      tooltipDate.textContent = dateStr;
      tooltipWeekday.textContent = weekDays[d.day];
      tooltipCount.textContent = d.count;
      tooltipTier.textContent = tierNames[d.level];
      tooltipCoords.textContent = `SECTOR WEEK ${d.week + 1} · SLOT ${d.day + 1}`;
      tooltipDot.style.background = '#' + d.origColor.toString(16).padStart(6, '0');
      tooltipDot.style.boxShadow = `0 0 10px #${d.origColor.toString(16).padStart(6, '0')}`;

      tooltip.classList.remove('hidden');
    }
  } else {
    if (hoveredBar) {
      hoveredBar.material.emissive.setHex(hoveredBar.userData.origEmissive);
      hoveredBar.material.emissiveIntensity = hoveredBar.userData.level > 0 ? 0.7 : 0.2;
      hoveredBar.scale.set(1, hoveredBar.userData.baseHeight * CONFIG.elevationScale, 1);
      hoveredBar = null;
      tooltip.classList.add('hidden');
    }
  }
}

// --- SYNTHESIZED WEB AUDIO API ---
let audioCtx = null;
let ambientOsc = null;
let ambientGain = null;

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  // Cosmic ambient drone
  ambientOsc = audioCtx.createOscillator();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(220, audioCtx.currentTime);

  ambientGain = audioCtx.createGain();
  ambientGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

  ambientOsc.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(audioCtx.destination);
  ambientOsc.start();
}

function playHoverBlip(level) {
  if (!CONFIG.audioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const frequencies = [260, 392, 523, 659, 880];
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequencies[level] || 440, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.18);
}

// --- APPLY THEME ---
function applyTheme(themeKey) {
  if (!THEMES[themeKey]) return;
  CONFIG.currentTheme = themeKey;
  const theme = THEMES[themeKey];

  scene.background.setHex(theme.bg);
  scene.fog.color.setHex(theme.bg);
  ambientLight.color.setHex(theme.ambient);
  rimLight.color.setHex(theme.coreGlow);
  planetPointLight.color.setHex(theme.coreGlow);

  if (planetCoreMesh) {
    planetCoreMesh.material.color.setHex(theme.planetBody);
  }
  if (atmosphereMesh) {
    atmosphereMesh.material.uniforms.glowColor.value.setHex(theme.atmosphere);
  }

  // Update bars materials
  contributionBars.forEach((mesh) => {
    const levelInfo = theme.levels[mesh.userData.level];
    mesh.material.color.setHex(levelInfo.color);
    mesh.material.emissive.setHex(levelInfo.emissive);
    mesh.userData.origColor = levelInfo.color;
    mesh.userData.origEmissive = levelInfo.emissive;
  });

  // Update UI active buttons
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === themeKey);
  });
}

// --- UI EVENT LISTENERS ---
// Mode selector buttons
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    CONFIG.currentMode = btn.dataset.mode;
    updateBarLayoutPositions(true);

    // Adjust camera for best view of chosen mode
    if (CONFIG.currentMode === 'grid') {
      tweenCamera(new THREE.Vector3(0, 48, 48), new THREE.Vector3(0, 0, 0));
    } else if (CONFIG.currentMode === 'ring') {
      tweenCamera(new THREE.Vector3(55, 32, 50), new THREE.Vector3(0, 0, 0));
    } else {
      tweenCamera(new THREE.Vector3(45, 25, 48), new THREE.Vector3(0, 0, 0));
    }
  });
});

// Theme buttons
document.querySelectorAll('.theme-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyTheme(btn.dataset.theme);
  });
});

// Sliders
const toggleAutorotate = document.getElementById('toggle-autorotate');
toggleAutorotate.addEventListener('change', (e) => {
  controls.autoRotate = e.target.checked;
});

const sliderRotSpeed = document.getElementById('slider-rotspeed');
sliderRotSpeed.addEventListener('input', (e) => {
  controls.autoRotateSpeed = parseFloat(e.target.value);
});

const sliderHeight = document.getElementById('slider-height');
const valHeight = document.getElementById('val-height');
sliderHeight.addEventListener('input', (e) => {
  CONFIG.elevationScale = parseFloat(e.target.value);
  valHeight.textContent = `${CONFIG.elevationScale.toFixed(1)}x`;
  updateBarLayoutPositions(true);
});

// Audio button
const btnAudio = document.getElementById('btn-audio');
const audioIcon = document.getElementById('audio-icon');
btnAudio.addEventListener('click', () => {
  CONFIG.audioEnabled = !CONFIG.audioEnabled;
  if (CONFIG.audioEnabled) {
    initAudio();
    if (ambientGain) ambientGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    audioIcon.textContent = '🔊';
    btnAudio.classList.add('primary');
  } else {
    if (ambientGain) ambientGain.gain.setValueAtTime(0, audioCtx.currentTime);
    audioIcon.textContent = '🔇';
    btnAudio.classList.remove('primary');
  }
});

// Camera preset buttons
function tweenCamera(targetPos, targetLookAt) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  const duration = 900;

  function animTween(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

    camera.position.lerpVectors(startPos, targetPos, ease);
    controls.target.lerpVectors(startTarget, targetLookAt, ease);
    controls.update();

    if (progress < 1) {
      requestAnimationFrame(animTween);
    }
  }
  requestAnimationFrame(animTween);
}

document.getElementById('btn-cam-reset').addEventListener('click', () => {
  tweenCamera(new THREE.Vector3(45, 25, 48), new THREE.Vector3(0, 0, 0));
});
document.getElementById('btn-cam-top').addEventListener('click', () => {
  tweenCamera(new THREE.Vector3(0.1, 75, 0.1), new THREE.Vector3(0, 0, 0));
});
document.getElementById('btn-cam-side').addEventListener('click', () => {
  tweenCamera(new THREE.Vector3(68, 0, 0), new THREE.Vector3(0, 0, 0));
});

// Screenshot button
document.getElementById('btn-screenshot').addEventListener('click', () => {
  tooltip.classList.add('hidden');
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `planet-fuwad7-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
});

// User Search Form
document.getElementById('user-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('username-input');
  const username = input.value.trim();
  if (username) {
    document.querySelector('.hud-title').textContent = `PLANET ${username.toUpperCase()}`;
    generateYearData();
    buildContributionMeshes();
  }
});

// Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Smooth position lerp for bars when transitioning modes
  contributionBars.forEach((mesh) => {
    if (mesh.userData.targetPos) {
      mesh.position.lerp(mesh.userData.targetPos, 0.08);
      mesh.quaternion.slerp(new THREE.Quaternion().setFromEuler(mesh.userData.targetRot), 0.08);
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, mesh.userData.targetScaleY, 0.08);
    }
  });

  // Rings rotation
  if (ringParticles && ringParticles.visible) {
    ringParticles.rotation.y += delta * 0.15;
  }

  // Satellite orbit
  if (satelliteGroup) {
    satelliteAngle += delta * 0.45;
    const satR = CONFIG.planetRadius * 1.6;
    satelliteGroup.position.x = Math.cos(satelliteAngle) * satR;
    satelliteGroup.position.z = Math.sin(satelliteAngle) * satR;
    satelliteGroup.position.y = Math.sin(satelliteAngle * 2) * 5;
    satelliteGroup.rotation.y = -satelliteAngle + Math.PI / 2;
  }

  controls.update();
  updateRaycaster();
  renderer.render(scene, camera);
}

// --- BOOTSTRAP ---
createPlanetSphere();
createPlanetaryRings();
createSatellite();
createStarfield();
generateYearData();
buildContributionMeshes();
animate();
