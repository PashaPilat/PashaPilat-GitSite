import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../styles/components/Other/OtherProjectsBackground.scss';

/* =========================================================
   PALETTE  (turquoise / cyan on near-black)
   ========================================================= */
const C = {
  bg: '#020305',
  gridFine: 'rgba(40,220,230,0.10)',
  gridMajor: 'rgba(60,255,255,0.18)',
  cyan: '#2ee7f0',
  cyanBright: '#42f2ff',
  cyanPale: '#6af7ff',
  whiteCyan: '#d8ffff',
  white: '#f2ffff',
  wave: '#f5f7fa',
  core: '#04080f',
};

const DEG = Math.PI / 180;

/* =========================================================
   CAMERA / LAYOUT MODEL
   Camera looks along -Z with fixed pitch; a helper projects
   desired screen fractions (0..1) onto the ground plane, so
   every module matches the reference composition exactly.
   ========================================================= */
const CAM_H = 11;
const CAM_Z = 11;
const TARGET_Z = -1.5;
const VFOV = 40;
const DESIGN_ASPECT = 16 / 9;
const PITCH = Math.atan(CAM_H / (CAM_Z - TARGET_Z)); // downward pitch
const V_HALF = (VFOV / 2) * DEG;
const H_FULL = 2 * Math.atan(Math.tan(V_HALF) * DESIGN_ASPECT);
const H_HALF = H_FULL / 2;

// screen fraction -> ground point [x, z] at height h
function ground(sx, sy, h = 0) {
  const down = PITCH + (sy - 0.5) * VFOV * DEG;
  const d = (CAM_H - h) / Math.tan(down);
  const x = d * Math.tan((sx - 0.5) * H_FULL);
  const z = CAM_Z - d;
  return [x, z];
}

// world width covered by an sx range at given sy / height
function spanWidth(sy, sx0, sx1, h = 0) {
  const [x0] = ground(sx0, sy, h);
  const [x1] = ground(sx1, sy, h);
  return x1 - x0;
}

// billboard ring center (group center at height r, bottom tangent to ground)
function ringCenter(sx, sy, r) {
  const down = PITCH + (sy - 0.5) * VFOV * DEG;
  const d = (CAM_H - r) / Math.tan(down);
  const x = d * Math.tan((sx - 0.5) * H_FULL);
  const z = CAM_Z - d;
  return [x, r, z];
}

/* ---- reference composition (screen fractions) ---- */
const MAIN_K = 1.7 / 2.42; // scale of internal ring artwork (designed at r=2.42)
const MAIN_CONN_R = 2.28 * MAIN_K;
const MAIN = { sx: 0.7, sy: 0.22, r: 1.7, connR: MAIN_CONN_R, k: MAIN_K };
const TL = { sx: 0.29, sy: 0.085, r: 1.05 };
const TR = { sx: 0.895, sy: 0.105, r: 0.5, connR: 0.48 };

const MAIN_CENTER = ringCenter(MAIN.sx, MAIN.sy, MAIN.r);
const TL_CENTER = ringCenter(TL.sx, TL.sy, TL.r);
const TR_CENTER = ringCenter(TR.sx, TR.sy, TR.r);

// ring edge entry specs: [ring, screen-polar angle, screen point comes free]

function edgeScreen(
  sx,
  sy,
  r,
  center,
  connR,
  angleDeg
) {
  const a = angleDeg * DEG;
  const down = PITCH + (sy - 0.5) * VFOV * DEG;
  const d = (CAM_H - r) / Math.tan(down);
  const fw = connR / (2 * d * Math.tan(H_HALF));
  const fh = connR / (2 * d * Math.tan(V_HALF));
  return {
    cx: center[0],
    cy: center[1],
    cz: center[2],
    r: connR,
    angle: angleDeg,
    sx: sx + fw * Math.cos(a),
    sy: sy - fh * Math.sin(a),
  };
}

const ENTRIES = [
  edgeScreen(MAIN.sx, MAIN.sy, MAIN.r, MAIN_CENTER, MAIN.connR, 219),
  edgeScreen(MAIN.sx, MAIN.sy, MAIN.r, MAIN_CENTER, MAIN.connR, 193),
  edgeScreen(MAIN.sx, MAIN.sy, MAIN.r, MAIN_CENTER, MAIN.connR, 184),
  edgeScreen(MAIN.sx, MAIN.sy, MAIN.r, MAIN_CENTER, MAIN.connR, -30),
  edgeScreen(MAIN.sx, MAIN.sy, MAIN.r, MAIN_CENTER, MAIN.connR, -10),
  edgeScreen(TR.sx, TR.sy, TR.r, TR_CENTER, TR.connR, 194),
];

/* ---- traces defined as screen-fraction waypoints ---- */

const SCREEN_TRACES = [
  {
    // upper stepped line -> main ring 7:30 edge
    pts: [[0.22, 0.31], [0.4, 0.31], [0.4, ENTRIES[0].sy], [ENTRIES[0].sx, ENTRIES[0].sy]],
    pulse: { dur: 1.0, per: 6.5, ph: 0.4 },
  },
  {
    // middle stepped line -> 8:30 edge
    pts: [[0.25, 0.265], [0.42, 0.265], [0.42, ENTRIES[1].sy], [ENTRIES[1].sx, ENTRIES[1].sy]],
    pulse: { dur: 1.1, per: 7.5, ph: 2.6 },
  },
  {
    // lower stepped line -> 9 o'clock edge
    pts: [[0.3, 0.225], [0.44, 0.225], [0.44, ENTRIES[2].sy], [ENTRIES[2].sx, ENTRIES[2].sy]],
    pulse: { dur: 0.9, per: 8.5, ph: 4.8 },
  },
  {
    // left vertical: hash -> big dot -> control bars
    pts: [[0.05, 0.355], [0.05, 0.43], [0.105, 0.475]],
  },
  {
    // main ring 2 o'clock -> small top-right ring
    pts: [[ENTRIES[3].sx, ENTRIES[3].sy], [0.83, ENTRIES[3].sy], [0.83, ENTRIES[5].sy], [ENTRIES[5].sx, ENTRIES[5].sy]],
    pulse: { dur: 1.1, per: 9.5, ph: 1.4 },
  },
  {
    // main ring 3 o'clock -> far right glyph
    pts: [[ENTRIES[4].sx, ENTRIES[4].sy], [0.87, ENTRIES[4].sy], [0.87, 0.235], [0.955, 0.235]],
  },
  {
    // waveform frame -> equalizer
    pts: [[0.815, 0.73], [0.77, 0.8], [0.77, 0.845]],
    pulse: { dur: 0.8, per: 10, ph: 3.2 },
  },
];


const TRACES =
  SCREEN_TRACES.map((t) => ({
    path: t.pts.map(([sx, sy]) => ground(sx, sy, 0.012)),
    pulse: t.pulse,
  }));

/* ---- junction nodes: generated from trace bend indices + extras ---- */

const NODE_SPECS = [
  // trace bends / tips
  { trace: 0, idx: 1, s: 0.06, ph: 0.3, per: 4.2, tier: 2 },
  { trace: 0, idx: 2, s: 0.07, ph: 1.4, per: 5.1, tier: 1 },
  { trace: 0, idx: 3, s: 0.075, ph: 1.8, per: 3.8, tier: 0 },
  { trace: 1, idx: 1, s: 0.06, ph: 2.2, per: 4.8, tier: 2 },
  { trace: 1, idx: 2, s: 0.06, ph: 3.1, per: 5.6, tier: 1 },
  { trace: 1, idx: 3, s: 0.07, ph: 2.9, per: 4.4, tier: 1 },
  { trace: 2, idx: 1, s: 0.055, ph: 4.0, per: 6.1, tier: 2 },
  { trace: 2, idx: 2, s: 0.05, ph: 5.1, per: 6.3, tier: 2 },
  { trace: 2, idx: 3, s: 0.06, ph: 3.7, per: 5.2, tier: 1 },
  { trace: 3, idx: 1, s: 0.1, ph: 0.2, per: 3.6, tier: 0 }, // prominent left dot
  { trace: 3, idx: 2, s: 0.055, ph: 4.9, per: 5.7, tier: 2 },
  { trace: 4, idx: 1, s: 0.06, ph: 2.5, per: 5.8, tier: 2 },
  { trace: 4, idx: 2, s: 0.055, ph: 4.4, per: 6.4, tier: 2 },
  { trace: 4, idx: 3, s: 0.05, ph: 5.3, per: 6.0, tier: 2 },
  { trace: 5, idx: 1, s: 0.05, ph: 2.8, per: 5.3, tier: 2 },
  { trace: 5, idx: 3, s: 0.07, ph: 1.1, per: 4.9, tier: 2 },
  { trace: 6, idx: 1, s: 0.05, ph: 3.3, per: 5.5, tier: 1 },
  { trace: 0, idx: 0, s: 0.05, ph: 1.6, per: 4.7, tier: 1 },
];

/* ---- panel layouts ---- */
const PROFILE_POS = ground(0.085, 0.205);
const PROFILE_W = spanWidth(0.205, 0.0, 0.16); // 3.4
const DATA_POS = ground(0.115, 0.255);
const DATA_W = spanWidth(0.255, 0.0, 0.255);
const HASH_POS = ground(0.05, 0.33);
const CONTROL_LABEL_POS = ground(0.095, 0.445);
const CONTROL_BARS = [0.47, 0.495, 0.52].map((sy, i) => {
  const ends = [0.4, 0.36, 0.44];
  const [x0, z] = ground(0.105, sy);
  const [x1] = ground(ends[i], sy);
  return { x0, x1, z };
});

const WAVE_CENTER = ground(0.625, 0.68);
const WAVE_W = spanWidth(0.68, 0.435, 0.815);
const WAVE_D = (() => {
  const [, zTop] = ground(0.625, 0.59);
  const [, zBot] = ground(0.625, 0.77);
  return zBot - zTop;
})();
const WAVE_LABEL_POS = ground(0.43, 0.755);

const RULER_X = ground(0.27, 0.88)[0];
const RULER_Z0 = ground(0.27, 0.79)[1];
const RULER_Z1 = ground(0.27, 0.985)[1];

const EQ_Z = ground(0.62, 0.845)[1];
const EQ_X0 = ground(0.5, 0.845)[0];
const EQ_X1 = ground(0.99, 0.845)[0];

const GLYPH_POS = ground(0.955, 0.235);
const GLOW_MAIN = ground(MAIN.sx, MAIN.sy + 0.146);
const GLOW_WAVE = WAVE_CENTER;
const GLOW_CONTROL = ground(0.25, 0.49);

/* =========================================================
   CANVAS TEXTURE HELPERS
   ========================================================= */
function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return { cv, ctx: cv.getContext('2d') };
}

function toTexture(cv) {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function rr(
  ctx,
  x,
  y,
  w,
  h,
  r
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSpacedText(
  ctx,
  text,
  cx,
  cy,
  spacing
) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, cy);
    x += widths[i] + spacing;
  });
}

function makeLabelTexture(text, color = C.whiteCyan, size = 96) {
  const { cv, ctx } = makeCanvas(1024, 220);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.font = `700 ${size}px "Courier New", monospace`;
  ctx.fillStyle = color;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 14;
  drawSpacedText(ctx, text, cv.width / 2, cv.height / 2, 22);
  ctx.shadowBlur = 0;
  return toTexture(cv);
}

function makeHeaderBlock(kind) {
  const W = kind === 'profile' ? 1100 : 1400;
  const { cv, ctx } = makeCanvas(W, 200);
  const pad = 10;
  ctx.clearRect(0, 0, W, cv.height);
  if (kind === 'profile') {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(46,231,240,0.85)');
    g.addColorStop(0.7, 'rgba(46,231,240,0.45)');
    g.addColorStop(1, 'rgba(46,231,240,0.15)');
    ctx.fillStyle = g;
    ctx.fillRect(pad, pad, W - pad * 2, cv.height - pad * 2);
    ctx.fillStyle = 'rgba(216,255,255,0.95)';
    ctx.fillRect(W - 140, pad, 6, cv.height - pad * 2);
  } else {
    ctx.strokeStyle = 'rgba(106,247,255,0.85)';
    ctx.lineWidth = 5;
    ctx.strokeRect(pad, pad, W - pad * 2, cv.height - pad * 2);
    ctx.fillStyle = 'rgba(46,231,240,0.10)';
    ctx.fillRect(pad, pad, W - pad * 2, cv.height - pad * 2);
    ctx.fillStyle = 'rgba(216,255,255,0.9)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(W - 120 + i * 34, cv.height / 2 - 4, 18, 8);
    }
  }
  ctx.font = `700 96px "Courier New", monospace`;
  ctx.fillStyle = C.white;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 14;
  drawSpacedText(
    ctx,
    kind === 'profile' ? 'PROFILE' : 'DATA SOURCE',
    W / 2 - (kind === 'data' ? 60 : 0),
    cv.height / 2,
    kind === 'profile' ? 34 : 26
  );
  ctx.shadowBlur = 0;
  return toTexture(cv);
}

function makeHashTexture() {
  const { cv, ctx } = makeCanvas(256, 256);
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(106,247,255,0.9)';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 220, 220);
  ctx.fillStyle = 'rgba(216,255,255,0.95)';
  ctx.font = `700 150px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 18;
  ctx.fillText('#', 128, 132);
  return toTexture(cv);
}

function makeChipTexture() {
  const { cv, ctx } = makeCanvas(320, 200);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = 'rgba(216,255,255,0.9)';
  ctx.lineWidth = 8;
  rr(ctx, 28, 28, cv.width - 56, cv.height - 56, 24);
  ctx.stroke();
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(70, cv.height / 2);
  ctx.lineTo(cv.width - 70, cv.height / 2);
  ctx.stroke();
  ctx.fillStyle = C.cyanBright;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 16;
  ctx.fillRect(cv.width / 2 - 10, cv.height / 2 - 30, 20, 60);
  return toTexture(cv);
}

function makeNumbersTexture() {
  const { cv, ctx } = makeCanvas(512, 320);
  ctx.clearRect(0, 0, 512, 320);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.cyanPale;
  ctx.font = `700 62px "Courier New", monospace`;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 12;
  ctx.fillText('66.41', 256, 110);
  ctx.fillStyle = C.white;
  ctx.font = `700 118px "Courier New", monospace`;
  ctx.shadowBlur = 22;
  ctx.fillText('77.6%', 256, 220);
  ctx.shadowBlur = 0;
  return toTexture(cv);
}

function makeWaveFrameTexture(ratio) {
  const W = 1200;
  const H = Math.round(W / ratio);
  const { cv, ctx } = makeCanvas(W, H);
  ctx.clearRect(0, 0, W, H);
  const m = 14;
  ctx.strokeStyle = 'rgba(46,231,240,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.strokeStyle = 'rgba(216,255,255,0.95)';
  ctx.lineWidth = 7;
  const L = 46;
  const corners = [
    [m, m, 1, 1],
    [W - m, m, -1, 1],
    [m, H - m, 1, -1],
    [W - m, H - m, -1, -1],
  ];
  corners.forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + sx * L, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * L);
    ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(106,247,255,0.6)';
  ctx.lineWidth = 3;
  for (let i = 1; i < 8; i++) {
    const y = m + ((H - 2 * m) * i) / 8;
    ctx.beginPath();
    ctx.moveTo(m, y);
    ctx.lineTo(m + (i % 2 === 0 ? 26 : 14), y);
    ctx.stroke();
  }
  for (let i = 1; i < 16; i++) {
    const x = m + ((W - 2 * m) * i) / 16;
    ctx.beginPath();
    ctx.moveTo(x, H - m);
    ctx.lineTo(x, H - m - (i % 4 === 0 ? 24 : 12));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(46,231,240,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(m + 30, H / 2);
  ctx.lineTo(W - m - 20, H / 2);
  ctx.stroke();
  return toTexture(cv);
}

function makeMicroMarker(text) {
  const { cv, ctx } = makeCanvas(300, 140);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.font = `700 72px "Courier New", monospace`;
  ctx.fillStyle = 'rgba(106,247,255,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cv.width / 2, cv.height / 2);
  return toTexture(cv);
}

function makeGlyphTexture() {
  const { cv, ctx } = makeCanvas(256, 256);
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(106,247,255,0.7)';
  ctx.lineWidth = 7;
  rr(ctx, 36, 36, 184, 184, 18);
  ctx.stroke();
  ctx.fillStyle = C.whiteCyan;
  ctx.font = `700 104px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 14;
  ctx.fillText('07', 128, 134);
  return toTexture(cv);
}

function makeGlowTexture() {
  const { cv, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 128);
  g.addColorStop(0, 'rgba(120,245,255,0.9)');
  g.addColorStop(0.35, 'rgba(46,231,240,0.28)');
  g.addColorStop(1, 'rgba(46,231,240,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(cv);
}

function makeScanTexture() {
  const { cv, ctx } = makeCanvas(256, 64);
  const g = ctx.createLinearGradient(0, 0, cv.width, 0);
  g.addColorStop(0, 'rgba(106,247,255,0)');
  g.addColorStop(0.5, 'rgba(216,255,255,0.85)');
  g.addColorStop(1, 'rgba(106,247,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cv.width, cv.height);
  return toTexture(cv);
}

/* =========================================================
   LAYER 1 — BASE SURFACE (dark plane + grid)
   ========================================================= */
function BaseSurface() {
  const matRef = useRef(null);
  const shader = useMemo(
    () => ({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vWorld;
        float gridLine(vec2 uv, float scale) {
          vec2 g = abs(fract(uv * scale) - 0.5);
          return smoothstep(0.485, 0.5, max(g.x, g.y));
        }
        void main() {
          float breath = 0.82 + 0.18 * sin(uTime * 6.2832 / 8.0);
          vec2 uv = vWorld.xz;
          float fine = gridLine(uv, 1.42);
          float major = gridLine(uv, 0.284);
          vec3 colFine = vec3(0.157, 0.863, 0.902);
          vec3 colMajor = vec3(0.235, 1.0, 1.0);
          vec3 col = colFine * fine * 0.55 + colMajor * major;
          float a = (fine * 0.10 + major * 0.20) * breath;
          float scan = smoothstep(0.992, 1.0, fract(vWorld.z * 0.12 - uTime * 0.012));
          col += colMajor * scan * 0.10;
          a += scan * 0.05;
          gl_FragColor = vec4(col, a);
        }
      `,
    }),
    []
  );
  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += dt;
  });
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -5]}>
        <planeGeometry args={[90, 90]} />
        <meshBasicMaterial color={'#04070c'} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -5]}>
        <planeGeometry args={[90, 90]} />
        <shaderMaterial
          ref={matRef}
          args={[shader]}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   LAYER 1 — soft glow zones
   ========================================================= */
function GlowZones({ tier }) {
  const tex = useMemo(() => makeGlowTexture(), []);
  const refs = useRef([]);
  const zones = useMemo(() => {
    const z = [
      { x: GLOW_MAIN[0], z: GLOW_MAIN[1], s: 6.4, o: 0.09, ph: 0, per: 6 },
      { x: GLOW_WAVE[0], z: GLOW_WAVE[1], s: 5.4, o: 0.07, ph: 2.1, per: 7.5 },
      { x: GLOW_CONTROL[0], z: GLOW_CONTROL[1], s: 4.0, o: 0.03, ph: 4.0, per: 8 },
    ];
    if (tier < 2) z.splice(2, 1);
    return z;
  }, [tier]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const z = zones[i];
      (m.material).opacity =
        z.o * (0.75 + 0.25 * Math.sin((t * 6.28) / z.per + z.ph));
    });
  });
  return (
    <group>
      {zones.map((z, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          rotation-x={-Math.PI / 2}
          position={[z.x, 0.005, z.z]}
        >
          <planeGeometry args={[z.s, z.s]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={z.o}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   LAYER 1 — faint rectangular interface zones
   ========================================================= */
function ZoneOutlines() {
  const infoCenter = ground(0.1, 0.23);
  const controlCenter = ground(0.25, 0.49);
  const rects = [
    [infoCenter[0], infoCenter[1], 6.4, 2.2],
    [controlCenter[0], controlCenter[1], 7.6, 1.4],
    [WAVE_CENTER[0], WAVE_CENTER[1], WAVE_W + 0.5, WAVE_D + 0.5],
  ];
  return (
    <group>
      {rects.map(([x, z, w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.004, z]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color={C.cyan} transparent opacity={0.035} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   LAYER 1 — static PCB traces
   ========================================================= */
function buildTraceGeometry(paths) {
  const pts = [];
  paths.forEach((path) => {
    for (let i = 0; i < path.length - 1; i++) {
      pts.push(path[i][0], 0.012, path[i][1]);
      pts.push(path[i + 1][0], 0.012, path[i + 1][1]);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function StaticTraces() {
  const obj = useMemo(() => {
    const g = buildTraceGeometry(TRACES.map((t) => t.path));
    const m = new THREE.LineBasicMaterial({
      color: new THREE.Color(C.cyan),
      transparent: true,
      opacity: 0.32,
    });
    return new THREE.LineSegments(g, m);
  }, []);
  return <primitive object={obj} />;
}

/* =========================================================
   LAYER 1 — connectors lifting traces into billboard rings
   (rebuilt per frame to stay attached)
   ========================================================= */
function RingConnectors() {
  const geom = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(ENTRIES.length * 6), 3)
        .setUsage(THREE.DynamicDrawUsage)
    );
    return geometry;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(C.cyan),
        transparent: true,
        opacity: 0.3,
      }),
    []
  );
  useFrame(({ camera }) => {
    const q = camera.quaternion;
    const v = new THREE.Vector3();
    const center = new THREE.Vector3();
    const arr = geom.attributes.position.array;
    ENTRIES.forEach((e, i) => {
      const a = e.angle * DEG;
      center.set(e.cx, e.cy, e.cz);
      v.set(Math.cos(a) * e.r, Math.sin(a) * e.r, 0).applyQuaternion(q).add(center);
      const [gx, gz] = ground(e.sx, e.sy, 0.014);
      arr[i * 6 + 0] = gx;
      arr[i * 6 + 1] = 0.014;
      arr[i * 6 + 2] = gz;
      arr[i * 6 + 3] = v.x;
      arr[i * 6 + 4] = v.y;
      arr[i * 6 + 5] = v.z;
    });
    geom.attributes.position.needsUpdate = true;
  });

  return <lineSegments geometry={geom} material={mat} frustumCulled={false} />;
}

/* =========================================================
   LAYER 1 — dotted ruler row (upper right)
   ========================================================= */
function DottedRuler() {
  const obj = useMemo(() => {
    const pts = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const sx = 0.83 + t * (0.995 - 0.83);
      const [x, z] = ground(sx, 0.365 + t * 0.012);
      pts.push(x, 0.014, z - 0.07, x, 0.014, z + 0.07);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({
        color: new THREE.Color(C.cyanPale),
        transparent: true,
        opacity: 0.45,
      })
    );
  }, []);
  return <primitive object={obj} />;
}

/* =========================================================
   LAYER 2 — traveling pulse along a trace
   ========================================================= */
function TracePulse({
  path,
  duration,
  period,
  phase,
}) {
  const ref = useRef(null);
  const pathData = useMemo(() => {
    const segs = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = new THREE.Vector3(path[i][0], 0.09, path[i][1]);
      const b = new THREE.Vector3(path[i + 1][0], 0.09, path[i + 1][1]);
      const len = a.distanceTo(b);
      segs.push({ a, b, len });
      total += len;
    }
    return { segs, total };
  }, [path]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const cyc = (state.clock.elapsedTime + phase) % period;
    if (cyc > duration) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const p = cyc / duration;
    let dist = p * pathData.total;
    const pos = new THREE.Vector3();
    for (const s of pathData.segs) {
      if (dist <= s.len) {
        pos.lerpVectors(s.a, s.b, dist / s.len);
        break;
      }
      dist -= s.len;
    }
    g.position.copy(pos);
    const fade = Math.sin(p * Math.PI);
    ((g.children[0]).material).opacity =
      0.5 + 0.5 * fade;
    g.scale.setScalar(0.7 + fade * 0.6);
  });

  return (
    <group ref={ref}>
      <mesh rotation-x={-Math.PI / 2} rotation-z={45 * DEG}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshBasicMaterial
          color={C.white}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.11, 16]} />
        <meshBasicMaterial
          color={C.cyanBright}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   LAYER 2 — junction nodes (occasional soft flash)
   ========================================================= */
function JunctionNodes({ tier }) {
  const nodes = useMemo(
    () =>
      NODE_SPECS.map((sp) => {
        let x;
        let z;
        if (sp.trace !== undefined && sp.idx !== undefined) {
          [x, z] = TRACES[sp.trace].path[sp.idx];
        } else {
          [x, z] = ground(sp.sx, sp.sy);
        }
        return { x, z, s: sp.s, ph: sp.ph, per: sp.per, tier: sp.tier };
      }).filter((n) => n.tier <= tier),
    [tier]
  );
  const refs = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const n = nodes[i];
      const w = Math.sin((t / n.per) * 6.2832 + n.ph);
      const flash = Math.pow(Math.max(0, w), 8);
      (m.material).opacity = 0.4 + flash * 0.6;
      m.scale.setScalar(1 + flash * 0.7);
    });
  });

  return (
    <group>
      {nodes.map((n, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          rotation-x={-Math.PI / 2}
          position={[n.x, 0.1, n.z]}
        >
          <circleGeometry args={[n.s, 16]} />
          <meshBasicMaterial
            color={C.cyanPale}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   LAYER 2 — MAIN CIRCULAR GAUGE (camera-facing billboard)
   Artwork authored at outer radius 2.42, scaled by k.
   ========================================================= */
function MainRing({ center, k }) {
  const faceRef = useRef(null);
  const scannerRef = useRef(null);
  const arcRef = useRef(null);
  const numRef = useRef(null);
  const tickRefs = useRef(null);
  const markerRefs = useRef([]);
  const numbersTex = useMemo(() => makeNumbersTexture(), []);

  const ticks = useMemo(() => {
    const pts = [];
    const count = 72;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const major = i % 6 === 0;
      const r1 = major ? 2.22 : 2.3;
      const r2 = 2.42;
      pts.push(r1 * Math.cos(a), r1 * Math.sin(a), 0, r2 * Math.cos(a), r2 * Math.sin(a), 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({
        color: new THREE.Color(C.cyanPale),
        transparent: true,
        opacity: 0.55,
      })
    );
  }, []);

  const markers = useMemo(
    () => [
      { a: 40, r: 2.5, s: 0.06, ph: 0.7 },
      { a: 325, r: 2.6, s: 0.055, ph: 2.0 },
      { a: 270, r: 2.45, s: 0.05, ph: 3.9 },
      { a: 140, r: 2.15, s: 0.045, ph: 4.7 },
    ],
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (faceRef.current) faceRef.current.quaternion.copy(state.camera.quaternion);
    if (scannerRef.current) scannerRef.current.rotation.z -= dt * ((Math.PI * 2) / 13);
    if (arcRef.current) {
      (arcRef.current.material).opacity =
        0.62 + 0.18 * Math.sin((t * 6.28) / 4.0);
    }
    if (numRef.current) {
      const dip = Math.pow(Math.max(0, Math.sin(t * 0.9 + 1.3)), 24) * 0.35;
      (numRef.current.material).opacity =
        0.92 - dip + Math.sin(t * 2.1) * 0.03;
    }
    if (tickRefs.current) {
      (tickRefs.current.material).opacity =
        0.45 + 0.15 * Math.sin((t * 6.28) / 5.0);
    }
    markerRefs.current.forEach((mk, i) => {
      if (!mk) return;
      const f = 0.5 + 0.5 * Math.sin(t * 1.6 + markers[i].ph);
      (mk.material).opacity = 0.45 + f * 0.5;
    });
  });

  return (
    <group ref={faceRef} position={center}>
      <group scale={k}>
        <primitive ref={tickRefs} object={ticks} />
        <mesh>
          <ringGeometry args={[2.16, 2.2, 128]} />
          <meshBasicMaterial
            color={C.cyanPale}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* thick main arc — bottom sweep (8 o'clock -> 2 o'clock) */}
        <mesh rotation-z={-150 * DEG}>
          <ringGeometry args={[1.68, 1.92, 128, 1, 0, Math.PI * 1.05]} />
          <meshBasicMaterial
            color={C.cyan}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* pulsing secondary arc, upper-left */}
        <mesh ref={arcRef} rotation-z={128 * DEG}>
          <ringGeometry args={[1.66, 1.94, 64, 1, 0, Math.PI * 0.22]} />
          <meshBasicMaterial
            color={C.cyanBright}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* bright white short segment at top */}
        <mesh rotation-z={76 * DEG}>
          <ringGeometry args={[1.72, 1.9, 48, 1, 0, Math.PI * 0.16]} />
          <meshBasicMaterial
            color={C.white}
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* slow rotating scanner */}
        <mesh ref={scannerRef}>
          <ringGeometry args={[1.6, 2.0, 48, 1, 0, Math.PI * 0.1]} />
          <meshBasicMaterial
            color={C.whiteCyan}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[1.32, 1.34, 96]} />
          <meshBasicMaterial color={C.cyan} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.98, 1.0, 96]} />
          <meshBasicMaterial color={C.cyan} transparent opacity={0.14} side={THREE.DoubleSide} />
        </mesh>
        {/* dark core */}
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[1.32, 64]} />
          <meshBasicMaterial color={C.core} transparent opacity={0.92} />
        </mesh>
        {/* numbers */}
        <mesh ref={numRef} position={[0, 0, 0.02]}>
          <planeGeometry args={[1.55, 0.97]} />
          <meshBasicMaterial map={numbersTex} transparent opacity={0.92} depthWrite={false} />
        </mesh>
        {markers.map((mk, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) markerRefs.current[i] = el;
            }}
            position={[mk.r * Math.cos(mk.a * DEG), mk.r * Math.sin(mk.a * DEG), 0.03]}
          >
            <circleGeometry args={[mk.s, 16]} />
            <meshBasicMaterial
              color={C.cyanPale}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* =========================================================
   LAYER 2 — small billboard ring
   ========================================================= */
function SmallRing({
  center,
  r,
  phase = 0,
  chip = true,
}) {
  const faceRef = useRef(null);
  const ringRef = useRef(null);
  const chipRef = useRef(null);
  const chipTex = useMemo(() => makeChipTexture(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (faceRef.current) faceRef.current.quaternion.copy(state.camera.quaternion);
    if (ringRef.current) {
      (ringRef.current.material).opacity =
        0.45 + 0.25 * Math.sin((t * 6.28) / 5.5 + phase);
    }
    if (chipRef.current) chipRef.current.rotation.z = Math.sin(t / 15 + phase) * 0.6;
  });

  return (
    <group ref={faceRef} position={center}>
      <mesh ref={ringRef}>
        <ringGeometry args={[r, r + 0.022, 96]} />
        <meshBasicMaterial
          color={C.cyanPale}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[r * 0.82, r * 0.835, 64]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      {chip && (
        <mesh ref={chipRef} position={[0, r * 0.32, 0.02]}>
          <planeGeometry args={[r * 0.6, r * 0.38]} />
          <meshBasicMaterial map={chipTex} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/* =========================================================
   LAYER 2 — PROFILE / DATA SOURCE / hash panels
   ========================================================= */
function InfoPanels() {
  const profileTex = useMemo(() => makeHeaderBlock('profile'), []);
  const dataTex = useMemo(() => makeHeaderBlock('data'), []);
  const hashTex = useMemo(() => makeHashTexture(), []);
  const scanTex = useMemo(() => makeScanTexture(), []);
  const scanRef = useRef(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!scanRef.current) return;
    const cyc = t % 7;
    if (cyc > 1.1) {
      scanRef.current.visible = false;
      return;
    }
    scanRef.current.visible = true;
    const p = cyc / 1.1;
    scanRef.current.position.x = -DATA_W / 2 + p * DATA_W;
    (scanRef.current.material).opacity = Math.sin(p * Math.PI) * 0.5;
  });

  const profileD = PROFILE_W / 5.5;
  const dataD = DATA_W / 7;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[PROFILE_POS[0], 0.07, PROFILE_POS[1]]}>
        <planeGeometry args={[PROFILE_W, profileD]} />
        <meshBasicMaterial map={profileTex} transparent depthWrite={false} />
      </mesh>
      <group position={[DATA_POS[0], 0.07, DATA_POS[1]]}>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[DATA_W, dataD]} />
          <meshBasicMaterial map={dataTex} transparent depthWrite={false} />
        </mesh>
        <mesh ref={scanRef} rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
          <planeGeometry args={[0.62, dataD * 0.8]} />
          <meshBasicMaterial
            map={scanTex}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[HASH_POS[0], 0.07, HASH_POS[1]]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial map={hashTex} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* =========================================================
   LAYER 2 — CONTROL block
   ========================================================= */
function ControlBars() {
  const markerTex = useMemo(() => ['#1', '#2', '#3'].map((t) => makeMicroMarker(t)), []);
  const glowTex = useMemo(() => makeScanTexture(), []);
  const labelTex = useMemo(() => makeLabelTexture('CONTROL', C.whiteCyan, 100), []);
  const barRefs = useRef([]);
  const pulseRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    CONTROL_BARS.forEach((b, i) => {
      const ph = [0.6, 2.4, 4.2][i];
      const bar = barRefs.current[i];
      if (bar) {
        (bar.material).opacity =
          0.62 + 0.18 * Math.sin(t * 1.1 + ph);
      }
      const pulse = pulseRefs.current[i];
      if (pulse) {
        const cyc = (t + ph) % 5.5;
        if (cyc > 0.9) {
          pulse.visible = false;
        } else {
          pulse.visible = true;
          const p = cyc / 0.9;
          pulse.position.set(b.x0 + (b.x1 - b.x0) * p, 0.02, 0);
          (pulse.material).opacity = Math.sin(p * Math.PI) * 0.7;
        }
      }
    });
  });

  const h = 0.075;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[CONTROL_LABEL_POS[0], 0.07, CONTROL_LABEL_POS[1] - 0.35]}>
        <planeGeometry args={[1.85, 0.4]} />
        <meshBasicMaterial map={labelTex} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      {CONTROL_BARS.map((b, i) => {
        const len = b.x1 - b.x0;
        const cx = (b.x0 + b.x1) / 2;
        return (
          <group key={i} position={[0, 0.07, b.z]}>
            <mesh rotation-x={-Math.PI / 2} position={[b.x0 - 0.42, 0, 0]}>
              <planeGeometry args={[0.5, 0.24]} />
              <meshBasicMaterial map={markerTex[i]} transparent opacity={0.55} depthWrite={false} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[cx, 0, h]}>
              <planeGeometry args={[len, 0.012]} />
              <meshBasicMaterial color={C.cyan} transparent opacity={0.28} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[cx, 0, -h]}>
              <planeGeometry args={[len, 0.012]} />
              <meshBasicMaterial color={C.cyan} transparent opacity={0.28} />
            </mesh>
            <mesh
              ref={(el) => {
                if (el) barRefs.current[i] = el;
              }}
              rotation-x={-Math.PI / 2}
              position={[cx, 0.005, 0]}
            >
              <planeGeometry args={[len - 0.08, h]} />
              <meshBasicMaterial
                color={i === 1 ? C.cyanBright : C.cyan}
                transparent
                opacity={0.75}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[b.x1, 0.008, 0]}>
              <planeGeometry args={[0.05, h * 2]} />
              <meshBasicMaterial
                color={C.white}
                transparent
                opacity={0.95}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh
              ref={(el) => {
                if (el) pulseRefs.current[i] = el;
              }}
              rotation-x={-Math.PI / 2}
            >
              <planeGeometry args={[0.5, h * 2.1]} />
              <meshBasicMaterial
                map={glowTex}
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* =========================================================
   LAYER 2 — WAVEFORM block
   ========================================================= */
function WaveformBlock() {
  const frameTex = useMemo(() => makeWaveFrameTexture(WAVE_W / WAVE_D), [WAVE_W, WAVE_D]);
  const labelTex = useMemo(() => makeLabelTexture('WAVE LEVEL', C.cyanPale, 80), []);
  const N = 220;

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = -WAVE_W / 2 + 0.45 + (i / (N - 1)) * (WAVE_W - 0.8);
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const line = useMemo(
    () =>
      new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({ color: new THREE.Color(C.wave), transparent: true, opacity: 0.95 })
      ),
    [lineGeo]
  );
  const lineGlow = useMemo(
    () =>
      new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: new THREE.Color(C.cyanBright),
          transparent: true,
          opacity: 0.28,
        })
      ),
    [lineGeo]
  );

  const segCount = 26;
  const segRef = useRef(null);
  const segData = useMemo(
    () =>
      Array.from({ length: segCount }).map((_, i) => ({
        x: -WAVE_W / 2 + 0.35 + (i / (segCount - 1)) * (WAVE_W - 0.7),
        ph: Math.random() * 10,
        per: 2.4 + Math.random() * 2.6,
      })),
    []
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const mesh = segRef.current;
    if (!mesh) return;
    segData.forEach((s, i) => {
      dummy.position.set(s.x, 0, 0);
      dummy.scale.set(1, 0.6, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.04, 0.25, 0.27);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [segData, dummy, color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = lineGeo.attributes.position;
    for (let i = 0; i < N; i++) {
      const xn = i / (N - 1);
      const x = pos.getX(i);
      const env =
        Math.pow(Math.sin(Math.PI * xn), 0.55) *
        (0.65 + 0.35 * Math.sin(t * 0.6 + xn * 2.0));
      const amp = WAVE_D * 0.32;
      const y =
        (Math.sin(t * 4.8 + x * 7.0) * 0.17 +
          Math.sin(t * 8.6 + x * 14.5 + 2.0) * 0.12 +
          Math.sin(t * 12.5 + x * 23.0) * 0.07 +
          Math.sin(t * 2.1 + x * 3.7) * 0.16) *
        env *
        amp;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    const mesh = segRef.current;
    if (mesh) {
      segData.forEach((s, i) => {
        const f =
          0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin((t * 6.28) / s.per + s.ph), 2.2);
        color.setRGB(0.18 * f + 0.05, 0.9 * f, 0.94 * f);
        mesh.setColorAt(i, color);
        dummy.position.set(s.x, 0, 0);
        dummy.scale.set(1, 0.5 + f * 0.9, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={[WAVE_CENTER[0], 0.07, WAVE_CENTER[1]]}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[WAVE_W, WAVE_D]} />
        <meshBasicMaterial map={frameTex} transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.012, 0]}>
        <planeGeometry args={[WAVE_W - 0.2, WAVE_D - 0.18]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0.03} />
      </mesh>
      <primitive object={lineGlow} rotation-x={-Math.PI / 2} position={[0, 0.012, -0.05]} />
      <primitive object={line} rotation-x={-Math.PI / 2} position={[0, 0.016, -0.05]} />
      <instancedMesh
        ref={segRef}
        args={[undefined, undefined, segCount]}
        rotation-x={-Math.PI / 2}
        position={[0, 0.02, WAVE_D / 2 - 0.2]}
        frustumCulled={false}
      >
        <planeGeometry args={[0.09, 0.04]} />
        <meshBasicMaterial
          color={'#04080c'}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[WAVE_LABEL_POS[0] - WAVE_CENTER[0], 0.02, WAVE_D / 2 - 0.42]}
      >
        <planeGeometry args={[1.12, 0.24]} />
        <meshBasicMaterial map={labelTex} transparent opacity={0.75} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* =========================================================
   LAYER 2 — bottom-left vertical ruler
   ========================================================= */
function VerticalRuler() {
  const fillRef = useRef(null);
  const capRef = useRef(null);
  const depth = RULER_Z1 - RULER_Z0;
  const zMid = (RULER_Z0 + RULER_Z1) / 2;

  const ticks = useMemo(() => {
    const pts = [];
    const n = 13;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const z = RULER_Z0 + t * depth;
      pts.push(RULER_X - 0.32, 0, z, RULER_X - 0.32 + (i % 2 === 0 ? 0.2 : 0.11), 0, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({
        color: new THREE.Color(C.cyanPale),
        transparent: true,
        opacity: 0.55,
      })
    );
  }, [depth, zMid]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (fillRef.current) {
      (fillRef.current.material).opacity =
        0.4 + 0.18 * Math.sin(t * 0.8);
    }
    if (capRef.current) {
      const f = 0.5 + 0.5 * Math.sin(t * 0.7);
      capRef.current.position.z = zMid + (f - 0.5) * depth * 0.5;
      (capRef.current.material).opacity = 0.6 + f * 0.4;
    }
  });

  return (
    <group position={[0, 0.07, 0]}>
      <primitive object={ticks} rotation-x={-Math.PI / 2} />
      <mesh rotation-x={-Math.PI / 2} position={[RULER_X - 0.12, 0, zMid]}>
        <planeGeometry args={[0.015, depth]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0.3} />
      </mesh>
      <mesh ref={fillRef} rotation-x={-Math.PI / 2} position={[RULER_X + 0.05, 0.005, zMid + depth * 0.12]}>
        <planeGeometry args={[0.2, depth * 0.7]} />
        <meshBasicMaterial
          color={C.cyan}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={capRef} rotation-x={-Math.PI / 2} position={[RULER_X + 0.05, 0.012, zMid]}>
        <planeGeometry args={[0.22, 0.05]} />
        <meshBasicMaterial
          color={C.white}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   LAYER 2 — bottom-right segmented equalizer
   ========================================================= */
function EqualizerBar({ tier }) {
  const count = tier === 0 ? 14 : 26;
  const ref = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const xSpan = EQ_X1 - EQ_X0;

  const data = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const t = i / (count - 1);
        return {
          x: EQ_X0 + t * xSpan,
          env: Math.exp(-Math.pow((t - 0.62) / 0.32, 2)),
          ph: Math.random() * 10,
          per: 1.8 + Math.random() * 2.6,
        };
      }),
    [count, xSpan]
  );

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    data.forEach((d, i) => {
      dummy.position.set(d.x, 0, 0);
      dummy.scale.set(0.8, 0.6, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.02, 0.1, 0.11);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data, dummy, color]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    data.forEach((d, i) => {
      const sh = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin((t * 6.28) / d.per + d.ph), 2);
      const f = 0.12 + d.env * sh;
      color.setRGB(0.18 * f, 0.9 * f, 0.94 * f);
      mesh.setColorAt(i, color);
      dummy.position.set(d.x, 0, 0);
      dummy.scale.set(0.7 + sh * d.env * 0.5, 0.55 + d.env * sh * 1.4, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[0, 0.07, EQ_Z]}>
      <mesh rotation-x={-Math.PI / 2} position={[(EQ_X0 + EQ_X1) / 2, -0.005, 0]}>
        <planeGeometry args={[xSpan, 0.28]} />
        <meshBasicMaterial
          color={C.cyan}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[(EQ_X0 + EQ_X1) / 2, 0, -0.11]}>
        <planeGeometry args={[xSpan, 0.012]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0.25} />
      </mesh>
      <instancedMesh
        ref={ref}
        args={[undefined, undefined, count]}
        rotation-x={-Math.PI / 2}
        frustumCulled={false}
      >
        <planeGeometry args={[0.13, 0.055]} />
        <meshBasicMaterial
          color={'#04080c'}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}

/* =========================================================
   LAYER 2 — far-right glyph
   ========================================================= */
function FarGlyph() {
  const tex = useMemo(() => makeGlyphTexture(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[GLYPH_POS[0], 0.07, GLYPH_POS[1]]}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial map={tex} transparent opacity={0.7} depthWrite={false} />
    </mesh>
  );
}

/* =========================================================
   Camera rig — fixed framing model + very slight parallax
   ========================================================= */
function CameraRig({ tier }) {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (tier === 0) return;
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [tier]);

  useFrame(({ camera }) => {
    const px = tier === 0 ? 0 : mouse.current.x * 0.3;
    const py = tier === 0 ? 0 : mouse.current.y * 0.2;
    const tx = tier === 0 ? 1.0 : 0;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, px, 1.4, 0.016);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, CAM_H - py, 1.4, 0.016);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, CAM_Z + py * 0.3, 1.4, 0.016);
    camera.lookAt(tx, 0, TARGET_Z);
  });
  return null;
}

/* =========================================================
   SCENE — exactly two layers
   ========================================================= */
function Scene({ tier }) {
  const scale = tier === 0 ? 0.66 : tier === 1 ? 0.86 : 1;
  const offsetX = tier === 0 ? 0.9 : tier === 1 ? 0.3 : 0;

  return (
    <>
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 20, 46]} />
      <CameraRig tier={tier} />

      <group scale={scale} position={[offsetX, 0, 0]}>
        {/* ===== LAYER 1 — tilted desk surface ===== */}
        <group name="baseLayer">
          <BaseSurface />
          <GlowZones tier={tier} />
          <ZoneOutlines />
          <StaticTraces />
          <RingConnectors />
          {tier >= 1 && <DottedRuler />}
        </group>

        {/* ===== LAYER 2 — raised glowing HUD modules ===== */}
        <group name="hudLayer">
          <MainRing center={MAIN_CENTER} k={MAIN.k} />
          {tier >= 1 && <SmallRing center={TL_CENTER} r={TL.r} phase={0.5} />}
          {tier >= 2 && <SmallRing center={TR_CENTER} r={TR.r} phase={2.3} />}
          <InfoPanels />
          <ControlBars />
          <WaveformBlock />
          {tier >= 1 && <VerticalRuler />}
          <EqualizerBar tier={tier} />
          {tier >= 2 && <FarGlyph />}
          <JunctionNodes tier={tier} />
          {TRACES.filter((tr) => tr.pulse).map((tr, i) => {
            const p = tr.pulse;
            if (tier === 0 && i >= 2) return null;
            return (
              <TracePulse key={i} path={tr.path} duration={p.dur} period={p.per} phase={p.ph} />
            );
          })}
        </group>
      </group>
    </>
  );
}

/* =========================================================
   EXPORTED BACKGROUND
   ========================================================= */
export default function OtherProjectsBackground() {
  const [tier, setTier] = useState(2);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setTier(w < 768 ? 0 : w < 1100 ? 1 : 2);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="other-bg" aria-hidden="true">
      <Canvas
        className="other-bg__canvas"
        dpr={tier === 0 ? [1, 1.25] : [1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, CAM_H, CAM_Z], fov: VFOV, near: 0.1, far: 80 }}
      >
        <Scene tier={tier} />
      </Canvas>
      <div className="other-bg__left-mask" />
      <div className="other-bg__vignette" />
      <div className="other-bg__bottom-fade" />
    </div>
  );
}
