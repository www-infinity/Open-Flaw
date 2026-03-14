/* background3d.js — ∞ Infinity animated 3D background
   Requires Three.js to be loaded before this script.
   Creates:
     • A full-screen particle field (neural-net look) behind all content
     • A slow-rotating Lemniscate of Bernoulli (∞ symbol)
     • Mouse parallax camera drift
     • window.Bg3D public API for AI / spin event reactions */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('[∞ Bg3D] Three.js not loaded — skipping 3D background');
    return;
  }

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // ── Renderer ───────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);   // transparent — CSS body bg shows through

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, W() / H(), 0.1, 500);
  camera.position.z = 45;

  // ── Particle field ─────────────────────────────────────────────────────────
  const N   = 900;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);

  // Brand colour palette  [R, G, B]  (0–1)
  const palette = [
    [0.957, 0.773, 0.094],   // gold   #f5c518
    [0.000, 0.831, 1.000],   // cyan   #00d4ff
    [0.000, 0.902, 0.463],   // green  #00e676
    [0.533, 0.533, 0.627],   // dim    #8080a0
  ];

  for (let i = 0; i < N; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 110;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 75;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    const c = palette[i % palette.length];
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }

  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('color',    new THREE.BufferAttribute(col, 3));

  const pm = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(pg, pm);
  scene.add(particles);

  // ── Neural-network line connections ────────────────────────────────────────
  const NODES = 70, MAX_D = 16;
  const npos  = [];
  for (let i = 0; i < NODES; i++) {
    npos.push(new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 55,
      (Math.random() - 0.5) * 35,
    ));
  }

  const lp = [], lc = [];
  for (let i = 0; i < NODES; i++) {
    for (let j = i + 1; j < NODES; j++) {
      const d = npos[i].distanceTo(npos[j]);
      if (d < MAX_D) {
        lp.push(npos[i].x, npos[i].y, npos[i].z,
                npos[j].x, npos[j].y, npos[j].z);
        const a = (1 - d / MAX_D) * 0.55;
        // gradient: gold → cyan
        lc.push(0.957 * a, 0.773 * a, 0.094 * a,
                0.000,     0.831 * a, a);
      }
    }
  }

  if (lp.length > 0) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
    lg.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(lc), 3));
    const lm = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.20,
    });
    scene.add(new THREE.LineSegments(lg, lm));
  }

  // ── Lemniscate of Bernoulli (∞ symbol) ────────────────────────────────────
  const STEPS = 240, a = 7.5;
  const ipts  = [];
  for (let i = 0; i <= STEPS; i++) {
    const t           = (i / STEPS) * Math.PI * 2;
    const denominator = 1 + Math.sin(t) * Math.sin(t);
    ipts.push(new THREE.Vector3(
      a * Math.cos(t) / denominator,
      a * Math.sin(t) * Math.cos(t) / denominator,
      0,
    ));
  }

  const infinityLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ipts),
    new THREE.LineBasicMaterial({ color: 0xf5c518, transparent: true, opacity: 0.60 }),
  );
  infinityLine.scale.set(2.0, 2.0, 1.0);
  infinityLine.position.set(0, 0, -18);
  scene.add(infinityLine);

  // ── Mouse parallax ─────────────────────────────────────────────────────────
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / W() - 0.5) * 2;
    my = (e.clientY / H() - 0.5) * 2;
  });

  // ── Resize handler ─────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });

  // ── Speed multiplier (for AI / win pulse effects) ──────────────────────────
  let speedMult = 1.0;

  // ── Public API ─────────────────────────────────────────────────────────────
  window.Bg3D = {
    /** Temporarily boost rotation speed (e.g. on slot win) */
    pulse() {
      speedMult = 5;
      setTimeout(() => { speedMult = 1; }, 1200);
    },
    /** Set visual theme for current activity */
    setTheme(theme) {
      if (theme === 'ai') {
        pm.opacity = 0.65;
        speedMult  = 1.6;
      } else if (theme === 'win') {
        pm.opacity = 0.75;
        speedMult  = 3.0;
        setTimeout(() => { pm.opacity = 0.45; speedMult = 1; }, 1800);
      } else {
        pm.opacity = 0.45;
        speedMult  = 1.0;
      }
    },
  };

  // ── Animation loop ─────────────────────────────────────────────────────────
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.005 * speedMult;

    particles.rotation.y = t * 0.06;
    particles.rotation.x = t * 0.02;

    infinityLine.rotation.z = t * 0.28;
    infinityLine.rotation.y = Math.sin(t * 0.45) * 0.35;

    camera.position.x += (mx * 5 - camera.position.x) * 0.03;
    camera.position.y += (-my * 3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();
