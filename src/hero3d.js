/**
 * Hero 3D scene: a gold Scales of Justice standing in a columned hall,
 * with drifting gold dust, light shafts, ripple rings and bloom.
 *
 * Source file — the site loads the bundled build in assets/js/hero3d.min.js.
 * After editing, run `npm run build` (or `npm run dev` for a live server).
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  FogExp2,
  Group,
  HalfFloatType,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SpotLight,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Timer,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const hero = document.getElementById('home');
const canvas = document.getElementById('hero-canvas');

if (hero && canvas) {
  try {
    init();
  } catch (err) {
    console.warn('3D hero disabled:', err);
    hero.classList.add('hero--no-webgl');
  }
}

function init() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const lowPower = coarsePointer || (navigator.hardwareConcurrency || 8) <= 4;
  const useBloom = !lowPower;

  /* ---------- renderer, scene, camera ---------- */
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !useBloom, // the bloom composer gets its own multisampled target
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const BG = 0x04070d;
  const scene = new Scene();
  scene.background = new Color(BG);
  scene.fog = new FogExp2(BG, 0.05);

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();

  const camera = new PerspectiveCamera(34, 1, 0.1, 80);
  const FOG_DENSITY = 0.05;
  const LOOK_Y = 2.15;
  let camDist = 13;

  /* ---------- materials ---------- */
  const gold = new MeshStandardMaterial({ color: 0xe9b949, metalness: 1, roughness: 0.2 });
  const goldSoft = new MeshStandardMaterial({ color: 0xd8a43c, metalness: 1, roughness: 0.36 });
  const goldPan = new MeshStandardMaterial({ color: 0xe9b949, metalness: 1, roughness: 0.24, side: DoubleSide });
  const goldGlow = new MeshStandardMaterial({
    color: 0xffd47e,
    emissive: 0xffa933,
    emissiveIntensity: 1.6,
    metalness: 0.7,
    roughness: 0.3,
  });
  const stone = new MeshStandardMaterial({ color: 0x1b2438, metalness: 0.3, roughness: 0.55 });

  const additive = (opts) =>
    new MeshBasicMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, ...opts });

  const stage = new Group();
  scene.add(stage);

  /* ---------- the scales of justice ---------- */
  const lathe = (points, segments, material) =>
    new Mesh(new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments), material);

  const scales = new Group();
  stage.add(scales);

  // stepped, flared pedestal
  scales.add(
    lathe(
      [
        [0, 0], [1.16, 0], [1.2, 0.05], [1.2, 0.12], [1.08, 0.17], [0.96, 0.19], [0.92, 0.25],
        [0.74, 0.29], [0.68, 0.36], [0.5, 0.4], [0.44, 0.47], [0.28, 0.56], [0.19, 0.7],
        [0.14, 0.9], [0.115, 1.05],
      ],
      96,
      gold,
    ),
  );

  const shaft = new Mesh(new CylinderGeometry(0.075, 0.1, 2.3, 48), gold);
  shaft.position.y = 2.2;
  scales.add(shaft);

  [1.06, 1.9, 2.75].forEach((y, i) => {
    const ring = new Mesh(new TorusGeometry(i === 0 ? 0.14 : 0.105, 0.022, 16, 64), goldSoft);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    scales.add(ring);
  });

  // capital, pivot and finial
  scales.add(lathe([[0.07, 3.3], [0.12, 3.34], [0.17, 3.42], [0.13, 3.48], [0.0, 3.5]], 48, gold));
  const pivot = new Mesh(new SphereGeometry(0.1, 32, 16), gold);
  pivot.position.y = 3.56;
  scales.add(pivot);
  scales.add(
    lathe(
      [[0, 3.6], [0.06, 3.62], [0.09, 3.7], [0.05, 3.8], [0.035, 3.9], [0.075, 3.98], [0.04, 4.07], [0, 4.2]],
      32,
      gold,
    ),
  );
  const crown = new Mesh(new SphereGeometry(0.055, 24, 16), goldGlow);
  crown.position.y = 4.24;
  scales.add(crown);

  // balance beam (thicker in the middle), pivoting on the column
  const PIVOT_Y = 3.56;
  const HALF = 1.9;
  const beam = new Group();
  beam.position.y = PIVOT_Y;
  scales.add(beam);

  const beamProfile = [];
  for (let i = 0; i <= 24; i++) {
    const y = -HALF + (2 * HALF * i) / 24;
    const k = 1 - Math.abs(y) / HALF;
    beamProfile.push(new Vector2(0.026 + 0.05 * k * k, y));
  }
  const beamGeo = new LatheGeometry(beamProfile, 32);
  beamGeo.rotateZ(-Math.PI / 2);
  beam.add(new Mesh(beamGeo, gold));

  for (const side of [-1, 1]) {
    const knob = new Mesh(new SphereGeometry(0.065, 24, 16), gold);
    knob.position.x = side * HALF;
    beam.add(knob);
  }
  const medallion = new Mesh(new TorusGeometry(0.21, 0.028, 16, 72), goldGlow);
  beam.add(medallion);
  const medallionCore = new Mesh(new SphereGeometry(0.075, 24, 16), gold);
  beam.add(medallionCore);

  // pans hang from the beam ends and always stay level
  const CHAIN = 1.45;
  const PAN_R = 0.62;
  const PAN_D = 0.2;
  const up = new Vector3(0, 1, 0);

  function buildPan() {
    const pan = new Group();
    const bowlProfile = [];
    for (let i = 0; i <= 18; i++) {
      const t = (i / 18) * (Math.PI / 2);
      bowlProfile.push(new Vector2(PAN_R * Math.sin(t), PAN_D * (1 - Math.cos(t))));
    }
    const bowl = new Mesh(new LatheGeometry(bowlProfile, 64), goldPan);
    bowl.position.y = -CHAIN - PAN_D;
    pan.add(bowl);

    const rim = new Mesh(new TorusGeometry(PAN_R, 0.02, 12, 96), goldSoft);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -CHAIN;
    pan.add(rim);

    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
      const end = new Vector3(Math.cos(a) * (PAN_R - 0.02), -CHAIN, Math.sin(a) * (PAN_R - 0.02));
      const chain = new Mesh(new CylinderGeometry(0.009, 0.009, end.length(), 6), goldSoft);
      chain.position.copy(end).multiplyScalar(0.5);
      chain.quaternion.setFromUnitVectors(up, end.clone().normalize());
      pan.add(chain);
    }
    const hook = new Mesh(new SphereGeometry(0.04, 16, 12), gold);
    pan.add(hook);
    scales.add(pan);
    return pan;
  }
  const panLeft = buildPan();
  const panRight = buildPan();

  /* ---------- halo behind the scales ---------- */
  const haloColor = new Color(0xffc45c).multiplyScalar(2.2);
  const halo = new Mesh(new TorusGeometry(2.3, 0.012, 8, 240), additive({ color: haloColor, opacity: 0.6 }));
  halo.position.set(0, 2.45, -1.1);
  stage.add(halo);

  const dotTexture = radialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.35, 'rgba(255,255,255,0.6)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  const dotRingGeo = new BufferGeometry();
  const DOTS = 96;
  const dotPos = new Float32Array(DOTS * 3);
  for (let i = 0; i < DOTS; i++) {
    const a = (i / DOTS) * Math.PI * 2;
    dotPos.set([Math.cos(a) * 2.62, Math.sin(a) * 2.62, 0], i * 3);
  }
  dotRingGeo.setAttribute('position', new BufferAttribute(dotPos, 3));
  const dotRing = new Points(
    dotRingGeo,
    new PointsMaterial({
      color: new Color(0xffd27a).multiplyScalar(1.6),
      size: 0.075,
      map: dotTexture,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  dotRing.position.copy(halo.position);
  stage.add(dotRing);

  /* ---------- floor, glow and ripples ---------- */
  const floor = new Mesh(
    new CircleGeometry(30, 72),
    new MeshStandardMaterial({ color: 0x070b15, metalness: 0.7, roughness: 0.5 }),
  );
  floor.rotation.x = -Math.PI / 2;
  stage.add(floor);

  const glowTexture = radialTexture([
    [0, 'rgba(255,214,140,1)'],
    [0.22, 'rgba(255,180,80,0.5)'],
    [1, 'rgba(255,160,60,0)'],
  ]);
  const floorGlow = new Mesh(new PlaneGeometry(7.5, 7.5), additive({ map: glowTexture, opacity: 0.6 }));
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = 0.006;
  stage.add(floorGlow);

  for (const [inner, outer, opacity] of [[1.34, 1.36, 0.7], [1.62, 1.63, 0.35]]) {
    const ring = new Mesh(
      new RingGeometry(inner, outer, 160),
      additive({ color: new Color(0xffc35a).multiplyScalar(1.5), opacity, side: DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.008;
    stage.add(ring);
  }

  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const ripple = new Mesh(
      new RingGeometry(0.985, 1, 160),
      additive({ color: new Color(0xffc35a).multiplyScalar(1.4), opacity: 0, side: DoubleSide }),
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.01;
    stage.add(ripple);
    ripples.push(ripple);
  }

  /* ---------- colonnade ---------- */
  const COLUMNS = lowPower ? 9 : 13;
  const ARC_R = 8.6;
  const parts = [
    { geo: new BoxGeometry(1.05, 0.26, 1.05), mat: stone, y: 0.13 },
    { geo: new CylinderGeometry(0.46, 0.52, 0.3, 40), mat: stone, y: 0.41 },
    { geo: flutedShaft(0.3, 0.35, 6.2), mat: stone, y: 3.66 },
    { geo: new TorusGeometry(0.33, 0.035, 12, 48).rotateX(Math.PI / 2), mat: goldGlow, y: 6.78 },
    { geo: new CylinderGeometry(0.5, 0.33, 0.32, 40), mat: stone, y: 6.96 },
    { geo: new BoxGeometry(1.1, 0.18, 1.1), mat: stone, y: 7.21 },
  ];
  const dummy = new Object3D();
  for (const part of parts) {
    const mesh = new InstancedMesh(part.geo, part.mat, COLUMNS);
    for (let i = 0; i < COLUMNS; i++) {
      const a = MathUtils.lerp(-1.3, 1.3, i / (COLUMNS - 1));
      dummy.position.set(Math.sin(a) * ARC_R, part.y, -Math.cos(a) * ARC_R + 1.2);
      dummy.rotation.set(0, -a, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    stage.add(mesh);
  }

  /* ---------- light shafts ---------- */
  const shaftMaterial = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(0xffd08a) },
      uOpacity: { value: 0.16 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vFacing;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vFacing = abs(dot(n, normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      varying float vFacing;
      void main() {
        float a = pow(vFacing, 2.6) * smoothstep(0.0, 0.55, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
        a *= 0.82 + 0.18 * sin(uTime * 0.9 + vUv.x * 12.566);
        gl_FragColor = vec4(uColor, a * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const lightShaft = new Mesh(new ConeGeometry(2.4, 10, 48, 1, true), shaftMaterial);
  lightShaft.position.set(0, 5.2, 0.2);
  stage.add(lightShaft);

  /* ---------- gold dust ---------- */
  const DUST = lowPower ? 650 : 1700;
  const DUST_H = 9;
  const dustGeo = new BufferGeometry();
  const dPos = new Float32Array(DUST * 3);
  const dScale = new Float32Array(DUST);
  const dSpeed = new Float32Array(DUST);
  const dPhase = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const r = Math.sqrt(Math.random()) * 11;
    const a = Math.random() * Math.PI * 2;
    dPos.set([Math.cos(a) * r, Math.random() * DUST_H, Math.sin(a) * r - 1], i * 3);
    dScale[i] = 0.35 + Math.random() * 1.1;
    dSpeed[i] = 0.12 + Math.random() * 0.38;
    dPhase[i] = Math.random() * 100;
  }
  dustGeo.setAttribute('position', new BufferAttribute(dPos, 3));
  dustGeo.setAttribute('aScale', new BufferAttribute(dScale, 1));
  dustGeo.setAttribute('aSpeed', new BufferAttribute(dSpeed, 1));
  dustGeo.setAttribute('aPhase', new BufferAttribute(dPhase, 1));
  const dustMaterial = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 34 },
      uHeight: { value: DUST_H },
      uColor: { value: new Color(0xffcf73).multiplyScalar(1.8) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      uniform float uHeight;
      attribute float aScale;
      attribute float aSpeed;
      attribute float aPhase;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * aSpeed, uHeight);
        p.x += sin(uTime * 0.3 + aPhase) * 0.3;
        p.z += cos(uTime * 0.25 + aPhase * 1.3) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aScale / -mv.z;
        float fade = smoothstep(0.0, 1.2, p.y) * (1.0 - smoothstep(uHeight - 2.5, uHeight, p.y));
        vAlpha = fade * (0.55 + 0.45 * sin(uTime * 1.8 + aPhase * 6.0));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float s = pow(smoothstep(0.5, 0.0, d), 2.2);
        gl_FragColor = vec4(uColor, s * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  stage.add(new Points(dustGeo, dustMaterial));

  /* ---------- floating section marks ---------- */
  const glyphs = [];
  ['§', '¶', '§', '§', '¶', '§', '¶'].forEach((ch, i) => {
    const sprite = new Sprite(
      new SpriteMaterial({
        map: glyphTexture(ch),
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    const size = 0.42 + (i % 3) * 0.14;
    sprite.scale.set(size, size, 1);
    sprite.userData = {
      angle: (i / 7) * Math.PI * 2,
      radius: 3.3 + (i % 3) * 0.9,
      height: 1.2 + ((i * 1.7) % 3.6),
      speed: 0.05 + (i % 4) * 0.012,
    };
    stage.add(sprite);
    glyphs.push(sprite);
  });

  /* ---------- lights ---------- */
  const hemi = new HemisphereLight(0x8ea4ff, 0x0a0d16, 0.55);
  const key = new SpotLight(0xffe2ae, 140, 32, Math.PI / 6, 0.65, 1.4);
  key.position.set(-3.5, 9.5, 6.5);
  key.target.position.set(0, 2, 0);
  const rim = new PointLight(0x4f7dff, 30, 18, 2);
  rim.position.set(3.6, 4.6, -3.4);
  const warm = new PointLight(0xffb45c, 12, 10, 2);
  warm.position.set(0, 2.8, 3.2);
  scene.add(hemi, key, key.target, rim, warm);
  const lightLevels = [
    [hemi, hemi.intensity],
    [key, key.intensity],
    [rim, rim.intensity],
    [warm, warm.intensity],
  ];

  /* ---------- post-processing ---------- */
  let composer = null;
  if (useBloom) {
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new Vector2(1, 1), 0.62, 0.55, 0.78));
    composer.addPass(new OutputPass());
  }

  /* ---------- layout ---------- */
  const stackedLayout = window.matchMedia('(max-width: 900px)');
  function layout() {
    const w = Math.max(1, hero.clientWidth);
    const h = Math.max(1, hero.clientHeight);
    const aspect = w / h;
    const portrait = stackedLayout.matches; // same breakpoint as the CSS hero layout

    renderer.setSize(w, h, false);
    dustMaterial.uniforms.uSize.value = 34 * renderer.getPixelRatio();
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }

    camera.aspect = aspect;
    if (portrait) {
      // phones: the balance fills the band above the text (see .hero__inner padding)
      const vh = window.innerHeight;
      const unitsPerPx = Math.max(4.75 / (vh * 0.32), 6.4 / w);
      camDist = 17;
      camera.fov = Math.min(75, MathUtils.radToDeg(2 * Math.atan((h * unitsPerPx) / 2 / camDist)));
      const centerPx = Math.min(h * 0.45, 70 + vh * 0.2);
      camera.setViewOffset(w, h, 0, h * 0.5 - centerPx, w, h);
    } else {
      camDist = 13;
      camera.fov = 34;
      const shift = MathUtils.clamp((aspect - 1) * 0.25 + 0.12, 0.12, 0.23);
      camera.setViewOffset(w, h, -w * shift, h * 0.02, w, h);
    }
    scene.fog.density = (FOG_DENSITY * 13) / camDist;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(layout).observe(hero);
  layout();

  /* ---------- interaction ---------- */
  const pointer = new Vector2();
  const pointerSmooth = new Vector2();
  if (!coarsePointer) {
    window.addEventListener(
      'pointermove',
      (e) => {
        pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true },
    );
  }
  let scrollProgress = 0;
  const readScroll = () => {
    scrollProgress = MathUtils.clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
  };
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  // intro plays when the preloader doors open (or shortly after load as a fallback)
  let introStart = reduceMotion ? -Infinity : null;
  const startIntro = () => {
    if (introStart === null) introStart = elapsed;
  };
  window.addEventListener('site:revealed', startIntro, { once: true });
  setTimeout(startIntro, 4500);

  /* ---------- frame ---------- */
  const timer = new Timer();
  let elapsed = 0;
  const camPos = new Vector3();
  const lookAt = new Vector3(0, LOOK_Y, 0);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);

  function frame(dt) {
    elapsed += dt;
    const t = elapsed;
    const intro = introStart === null ? 0 : easeOut(MathUtils.clamp((t - introStart) / 2.8, 0, 1));

    pointerSmooth.lerp(pointer, 1 - Math.exp(-dt * 2.5));
    const px = pointerSmooth.x;
    const py = pointerSmooth.y;

    // camera: intro dolly + mouse parallax + scroll drift
    const dist = camDist * (1 + (1 - intro) * 0.55) + scrollProgress * 2.2;
    camPos.set(px * 0.9, 2.7 - py * 0.45 + scrollProgress * 1.4 + (1 - intro) * 1.2, dist);
    camera.position.copy(camPos);
    lookAt.y = LOOK_Y + scrollProgress * 0.6;
    camera.lookAt(lookAt);

    // the balance: gentle sway, swinging beam, pans that stay level
    scales.rotation.y = (1 - intro) * -1.5 + Math.sin(t * 0.3) * 0.32 + px * 0.28 + scrollProgress * 0.9;
    scales.position.y = (1 - intro) * -0.8 + Math.sin(t * 0.9) * 0.04;
    beam.rotation.z = Math.sin(t * 0.7) * 0.075;
    const a = beam.rotation.z;
    panLeft.position.set(-HALF * Math.cos(a), PIVOT_Y - HALF * Math.sin(a) - 0.07, 0);
    panRight.position.set(HALF * Math.cos(a), PIVOT_Y + HALF * Math.sin(a) - 0.07, 0);
    panLeft.rotation.z = Math.sin(t * 1.3) * 0.02;
    panRight.rotation.z = Math.sin(t * 1.3 + 1.1) * 0.02;
    medallion.rotation.y = t * 0.8;

    halo.rotation.z = t * 0.05;
    halo.scale.setScalar(0.2 + intro * 0.8);
    dotRing.rotation.z = -t * 0.08;
    dotRing.scale.setScalar(0.2 + intro * 0.8);

    ripples.forEach((ripple, i) => {
      const p = (t * 0.2 + i / ripples.length) % 1;
      const s = 1.35 + p * 4.4;
      ripple.scale.set(s, s, 1);
      ripple.material.opacity = (1 - p) * 0.55 * Math.min(1, p * 6) * intro;
    });

    glyphs.forEach((g) => {
      const d = g.userData;
      const ang = d.angle + t * d.speed;
      g.position.set(Math.cos(ang) * d.radius, d.height + Math.sin(t * 0.6 + d.angle) * 0.25, Math.sin(ang) * d.radius);
      g.material.opacity = 0.18 + 0.22 * intro * (0.6 + 0.4 * Math.sin(t + d.angle * 3));
    });

    shaftMaterial.uniforms.uTime.value = t;
    dustMaterial.uniforms.uTime.value = t;
    shaftMaterial.uniforms.uOpacity.value = 0.16 * (0.3 + 0.7 * intro);
    for (const [light, level] of lightLevels) light.intensity = level * (0.25 + 0.75 * intro);
    renderer.toneMappingExposure = 1.05 - scrollProgress * 0.35;

    if (composer) composer.render(dt);
    else renderer.render(scene, camera);
  }

  /* ---------- adaptive quality: step down if the device struggles ---------- */
  let quality = 2; // 2 = full, 1 = 1x pixel ratio, 0 = no bloom
  let sampled = 0;
  let slowFrames = 0;
  function adaptQuality(dt) {
    if (quality === 0 || sampled >= 300) return;
    sampled++;
    if (dt > 1 / 40) slowFrames++;
    if (sampled % 60 !== 0) return;
    if (slowFrames > 36) {
      quality--;
      if (quality === 1) {
        renderer.setPixelRatio(1);
      } else if (composer) {
        composer.dispose();
        composer = null;
      }
      layout();
    }
    slowFrames = 0;
  }

  /* ---------- loop: only runs while the hero is visible ---------- */
  let inView = true;
  let running = false;
  function syncLoop() {
    const shouldRun = inView && !document.hidden && !reduceMotion;
    if (shouldRun && !running) {
      running = true;
      timer.reset();
      requestAnimationFrame(tick);
    } else if (!shouldRun) {
      running = false;
    }
  }
  function tick(now) {
    if (!running) return;
    requestAnimationFrame(tick);
    timer.update(now);
    const dt = timer.getDelta();
    adaptQuality(dt);
    frame(Math.min(dt, 1 / 20));
  }
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncLoop();
  }).observe(hero);
  document.addEventListener('visibilitychange', syncLoop);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    hero.classList.add('hero--no-webgl');
  });

  // first frame, then reveal the canvas
  frame(1 / 60);
  if (reduceMotion) new ResizeObserver(() => frame(0)).observe(hero);
  syncLoop();
  canvas.classList.add('is-ready');
  window.dispatchEvent(new CustomEvent('hero3d:ready'));
}

/* ---------- helpers ---------- */
function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const gradient = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  g.fillStyle = gradient;
  g.fillRect(0, 0, 256, 256);
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function glyphTexture(ch) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = '600 92px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(255, 196, 92, 0.95)';
  g.shadowBlur = 16;
  g.fillStyle = '#ffdc93';
  g.fillText(ch, 64, 70);
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// Column shaft with 20 vertical flutes carved into the surface.
function flutedShaft(radiusTop, radiusBottom, height) {
  const geo = new CylinderGeometry(radiusTop, radiusBottom, height, 120, 1, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const k = 1 - 0.05 * Math.pow(Math.abs(Math.cos(Math.atan2(z, x) * 10)), 0.6);
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}
