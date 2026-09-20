/* ==========================================================================
   RadioDevelopmentBackground
   --------------------------------------------------------------------------
   Изолированный background-компонент для страницы «Разработка радиоустройств».

   Отвечает ТОЛЬКО за фон. Внутри нет hero, header, навигации, текстов,
   кнопок и карточек — только canvas-сцена и SCSS-слои (маска и виньетка).

   Сцена (один canvas, Canvas 2D API, без WebGL/библиотек):
     far    — техническая сетка (PCB/spectrum grid), редкий RF noise,
              очень тёмные волны, слабый холодный оттенок под 3D-слой
     middle — PCB-разводка: дорожки по 0°/45°/90°, пады, светящиеся узлы,
              редкие импульсы по линиям, secondary waveform,
              мягкие спектральные пики, radial RF burst
     front  — основной радиосигнал (sin + ВЧ-компонента + медленная AM + noise),
              его glow-ореол, локальное свечение самого сильного участка

   3D-слой (левитирующие радиоэлементы) живёт отдельно —
   см. RadioFloating3DObjects.jsx; этот компонент от него не зависит.

   Подключение:
     <RadioDevelopmentBackground />
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import "../../styles/components/Radio/RadioDevelopmentBackground.scss";

const TAU = Math.PI * 2;

/* --------------------------------------------------------------------------
   Палитра (зеркалит SCSS)
   -------------------------------------------------------------------------- */
const C = {
  bgTop: "5, 4, 3",
  bgMid: "3, 3, 2",
  bgBottom: "8, 6, 4",
  emberDeep: "122, 58, 12",
  ember: "170, 78, 14",
  signal: "216, 106, 22",
  signalHot: "255, 138, 32",
  signalBright: "255, 159, 50",
  signalLight: "255, 189, 99",
  signalPale: "255, 217, 154",
  core: "255, 241, 207",
  grid: "255, 198, 140",
};

/* --------------------------------------------------------------------------
   Мелкая математика
   -------------------------------------------------------------------------- */
const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rgba = (rgb, a) => `rgba(${rgb}, ${clamp01(a)})`;

const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0 || 1));
  return t * t * (3 - 2 * t);
};

/* Плавный value-noise: даёт «живое», но не дрожащее изменение */
const hash1 = (n, seed) => {
  const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise1 = (x, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash1(i, seed), hash1(i + 1, seed), u);
};

/* --------------------------------------------------------------------------
   Профиль качества под брейкпоинты
   -------------------------------------------------------------------------- */
const GLOW_LAYERS = [
  { width: 40, color: C.emberDeep, alpha: 0.02 }, // широкий дальний ореол
  { width: 23, color: C.ember, alpha: 0.028 }, // средний слой
  { width: 11.5, color: C.signal, alpha: 0.05 }, // сигнал
  { width: 4.6, color: C.signalHot, alpha: 0.13 }, // ядро
  { width: 1.6, color: C.signalLight, alpha: 0.5 }, // тонкое яркое ядро
];
const SECONDARY_LAYERS = [
  { width: 9.5, color: C.ember, alpha: 0.05 },
  { width: 2.2, color: C.signalHot, alpha: 0.14 },
];

function getProfile(width) {
  if (width < 768) {
    return {
      key: "mobile",
      dprCap: 1.25,
      peaks: 6,
      glints: 20,
      glowSet: [1, 3, 4],
      pointStep: 8,
      chunks: 10,
      gridStep: 22,
      traces: 4,
      tracePulses: 1,
      pulseGap: [9, 16],
      spikeGap: [6, 12],
      maxPulses: 1,
      glowStrength: 0.72,
    };
  }
  if (width < 1200) {
    return {
      key: "tablet",
      dprCap: 1.5,
      peaks: 9,
      glints: 44,
      glowSet: [1, 2, 3, 4],
      pointStep: 6,
      chunks: 12,
      gridStep: 24,
      traces: 7,
      tracePulses: 2,
      pulseGap: [6.5, 12],
      spikeGap: [3.5, 8],
      maxPulses: 1,
      glowStrength: 0.88,
    };
  }
  return {
    key: "desktop",
    dprCap: 1.5,
    peaks: 12,
    glints: 74,
    glowSet: [0, 1, 2, 3, 4],
    pointStep: 5,
    chunks: 16,
    gridStep: 26,
    traces: 10,
    tracePulses: 3,
    pulseGap: [4.5, 10],
    spikeGap: [2, 5],
    maxPulses: 2,
    glowStrength: 1,
  };
}

/* --------------------------------------------------------------------------
   PCB-трасса: манхэттенская разводка по грубой сетке (0° / ±45° / 90°),
   круглые/квадратные пады на концах, редкий импульс, бегущий по дорожке.
   -------------------------------------------------------------------------- */
const TRACE_DIRS = [
  [1, 0],
  [-1, 0],
  [0, -1],
  [0, 1],
  [0.72, -0.72],
  [-0.72, -0.72],
  [0.72, 0.72],
  [-0.72, 0.72],
];

function createTrace(w, h) {
  let x = rnd(0.36, 0.98) * w;
  let y = rnd(0.36, 0.98) * h;
  const pts = [[x, y]];
  let dir = TRACE_DIRS[Math.floor(Math.random() * 2)]; // первые сегменты — горизонтальные
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i += 1) {
    if (i > 0 && Math.random() < 0.8) {
      dir = TRACE_DIRS[Math.floor(Math.random() * TRACE_DIRS.length)];
      if (Math.random() < 0.35) dir = TRACE_DIRS[Math.floor(Math.random() * 2)];
    }
    const len = rnd(0.05, 0.2) * w;
    x = clamp(x + dir[0] * len, 0.3 * w, w * 1.01);
    y = clamp(y + dir[1] * len * 0.8, 0.34 * h, h * 0.985);
    if (Math.abs(x - pts[pts.length - 1][0]) < 2 && Math.abs(y - pts[pts.length - 1][1]) < 2) continue;
    pts.push([x, y]);
  }
  const lens = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(total);
  }
  return {
    pts,
    lens,
    total,
    alpha: rnd(0.05, 0.1),
    node: Math.random() < 0.55, // светящийся узел на одном из падов
    nodeIdx: pts.length > 2 ? 1 + Math.floor(Math.random() * (pts.length - 2)) : 0,
    pulse: null,
  };
}

function attachPulse(trace) {
  trace.pulse = {
    u: 0,
    speed: rnd(0.07, 0.15), // доля пути в секунду — спокойно
    wait: rnd(1, 10),
  };
}

/* Точка на полилинии дорожки по нормированной длине пути */
function pointOnTrace(trace, u) {
  const d = clamp(u, 0, 1) * trace.total;
  const lens = trace.lens;
  let i = 1;
  while (i < lens.length - 1 && lens[i] < d) i += 1;
  const i0 = i - 1;
  const i1 = i;
  const segLen = lens[i1] - lens[i0] || 1;
  const k = clamp01((d - lens[i0]) / segLen);
  const a = trace.pts[i0];
  const b = trace.pts[i1];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

/* --------------------------------------------------------------------------
   Фабрики элементов сцены (хранят нормированные координаты → переживают resize)
   -------------------------------------------------------------------------- */
function createPeak() {
  return {
    xr: lerp(0.43, 1.02, Math.pow(Math.random(), 0.9)),
    halfN: rnd(0.014, 0.06), // полуширина пика (доля ширины)
    heightN: rnd(0.07, 0.235), // высота (доля высоты)
    phase: Math.random() * TAU,
    breathSpeed: rnd(0.045, 0.16),
    delay: Math.random() < 0.32 ? rnd(0.6, 5) : 0, // «пустой» старт: пики появляются позже
    rise: rnd(2.5, 6),
    hold: rnd(6, 24),
    fall: rnd(3, 7.5),
    age: 0,
    hot: Math.random() < 0.3, // самые сильные области светлее
  };
}

function createGlint() {
  return {
    xr: rnd(0.26, 1.0),
    yr: rnd(0.05, 0.97),
    size: rnd(0.7, 1.6),
    vx: rnd(-2.4, 2.4),
    life: 0,
    dur: rnd(0.6, 3),
    alpha: rnd(0.045, 0.17),
    warm: Math.random() < 0.6,
  };
}

function createPulse() {
  const sat = [];
  const count = 1 + (Math.random() < 0.45 ? 1 : 0);
  for (let i = 0; i < count; i += 1) {
    sat.push({ rn: rnd(0.55, 0.78), an: rnd(-0.5, 0.5), br: rnd(0.35, 0.7) });
  }
  return {
    xr: lerp(0.4, 0.93, Math.pow(Math.random(), 0.85)),
    yr: rnd(0.16, 0.84),
    r0n: rnd(0.004, 0.022),
    rn: rnd(0.2, 0.55), // во сколько долей диагонали расширится
    speedN: rnd(0.03, 0.058), // доли диагонали в секунду — расширяется неспешно
    brightness: rnd(0.12, 0.26),
    rings: sat,
    life: 0,
  };
}

function createSpike() {
  const satellites = [];
  const n = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i += 1) {
    satellites.push({
      dx: rnd(-16, 16),
      dy: rnd(-4, 12),
      s: rnd(0.6, 1.4),
      a: rnd(0.25, 0.8),
    });
  }
  return {
    xr: rnd(0.24, 1.0),
    yr: rnd(0.08, 0.95),
    lenN: rnd(0.004, 0.013),
    life: 0,
    dur: rnd(0.4, 1.3),
    alpha: rnd(0.07, 0.19),
    satellites,
  };
}

/* ==========================================================================
   Компонент
   ========================================================================== */
export default function RadioDevelopmentBackground({
  className = "",
  intensity = 1,
  interactive = true,
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSupported, setCanvasSupported] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setCanvasSupported(false);
      return undefined;
    }

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hoverCapable =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ----------------------------------------------------------------------
       Метрики и кеши
       ---------------------------------------------------------------------- */
    let width = 0;
    let height = 0;
    let diag = 0;
    let dpr = 1;
    let profile = getProfile(window.innerWidth || 1280);
    let gridCanvas = null;
    let bgGrad = null;
    let hazeGrad = null;
    let coolGrad = null;
    let pendingResize = false;
    let resizeTimer = 0;

    const scene = {
      t: rnd(0, 60), // сдвиг по времени, чтобы фон не был «синхронным» при перезагрузке
      peaks: [],
      glints: [],
      spikes: [],
      pulses: [],
      traces: [],
      nextPulseIn: rnd(2, 5),
      nextSpikeIn: rnd(1.5, 4),
      swell: 0,
      swellOn: false,
      swellTimer: rnd(4, 12),
      pointer: { x: 0, y: 0, tx: 0, ty: 0, weight: 0, target: 0, active: false, moved: false },
      wave: { x: [], y: [], env: [], n: 0 },
      sec: { x: [], y: [], env: [], n: 0 },
      far: { x: [], y0: [], y1: [], n: 0 },
      chunkGain: [],
      traceGain: [],
      secGain: [],
      chunkI0: [],
      chunkI1: [],
    };

    /* ----------------------------------------------------------------------
       Размеры / кеши / раскладка
       ---------------------------------------------------------------------- */
    const buildGrid = () => {
      gridCanvas = document.createElement("canvas");
      gridCanvas.width = Math.max(1, Math.round(width * dpr));
      gridCanvas.height = Math.max(1, Math.round(height * dpr));
      const g = gridCanvas.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.lineWidth = 1;
      const step = profile.gridStep;
      for (let x = 0, i = 0; x <= width; x += step, i += 1) {
        const major = i % 4 === 0;
        g.strokeStyle = rgba(C.grid, major ? 0.05 : 0.017);
        const px = Math.round(x) + 0.5;
        g.beginPath();
        g.moveTo(px, 0);
        g.lineTo(px, height);
        g.stroke();
      }
      for (let y = 0, i = 0; y <= height; y += step, i += 1) {
        const major = i % 4 === 0;
        g.strokeStyle = rgba(C.grid, major ? 0.042 : 0.015);
        const py = Math.round(y) + 0.5;
        g.beginPath();
        g.moveTo(0, py);
        g.lineTo(width, py);
        g.stroke();
      }
    };

    const buildGradients = () => {
      bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, rgba(C.bgTop, 1));
      bgGrad.addColorStop(0.44, rgba(C.bgMid, 1));
      bgGrad.addColorStop(1, rgba(C.bgBottom, 1));

      const hx = width * 0.72;
      const hy = height * 0.58;
      hazeGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.max(width, height) * 0.62);
      hazeGrad.addColorStop(0, rgba(C.signal, 0.05));
      hazeGrad.addColorStop(0.42, rgba(C.ember, 0.026));
      hazeGrad.addColorStop(1, rgba(C.bgMid, 0));

      /* очень слабый холодный оттенок справа — среда для 3D-слоя */
      const cx = width * 0.68;
      const cy = height * 0.4;
      coolGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.52);
      coolGrad.addColorStop(0, "rgba(96, 190, 224, 0.035)");
      coolGrad.addColorStop(0.5, "rgba(52, 124, 160, 0.018)");
      coolGrad.addColorStop(1, rgba(C.bgMid, 0));
    };

    const layoutWaveArrays = () => {
      const step = profile.pointStep;
      const n = Math.ceil(width / step) + 1;
      scene.wave.x = new Array(n);
      scene.wave.y = new Array(n);
      scene.wave.env = new Array(n);
      scene.wave.n = n;
      for (let i = 0; i < n; i += 1) scene.wave.x[i] = Math.min(i * step, width);

      const sn = Math.ceil(width / (step + 2)) + 1;
      scene.sec.x = new Array(sn);
      scene.sec.y = new Array(sn);
      scene.sec.env = new Array(sn);
      scene.sec.n = sn;
      for (let i = 0; i < sn; i += 1) scene.sec.x[i] = Math.min(i * (step + 2), width);

      const fn = Math.ceil(width / 9) + 1;
      scene.far.x = new Array(fn);
      scene.far.y0 = new Array(fn);
      scene.far.y1 = new Array(fn);
      scene.far.n = fn;
      for (let i = 0; i < fn; i += 1) scene.far.x[i] = Math.min(i * 9, width);

      const chunks = profile.chunks;
      scene.chunkI0 = new Array(chunks);
      scene.chunkI1 = new Array(chunks);
      scene.chunkGain = new Array(chunks).fill(0);
      scene.traceGain = new Array(chunks).fill(0);
      scene.secGain = new Array(chunks).fill(0);
    };

    const layoutScene = () => {
      scene.peaks = new Array(profile.peaks).fill(0).map(() => createPeak());
      scene.glints = new Array(profile.glints).fill(0).map(() => {
        const g = createGlint();
        g.life = rnd(0, g.dur);
        return g;
      });
      scene.spikes = [];
      scene.pulses = [];
      scene.nextPulseIn = rnd(2.5, 6);
      scene.nextSpikeIn = rnd(1.5, 4);

      /* PCB-разводка: дорожки + пады + редкие импульсы по линиям */
      scene.traces = new Array(profile.traces).fill(0).map(() => createTrace(width, height));
      for (let i = 0; i < Math.min(profile.tracePulses, scene.traces.length); i += 1) {
        attachPulse(scene.traces[i]);
        scene.traces[i].pulse.wait = rnd(0, 3);
      }
    };

    const applyMetrics = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width || window.innerWidth || 1024));
      height = Math.max(320, Math.round(rect.height || window.innerHeight || 768));
      diag = Math.hypot(width, height);
      const nextProfile = getProfile(width);
      const profileChanged = nextProfile.key !== profile.key;
      profile = nextProfile;
      dpr = Math.min(window.devicePixelRatio || 1, profile.dprCap);

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildGrid();
      buildGradients();
      layoutWaveArrays();
      if (profileChanged || !scene.peaks.length) layoutScene();
      if (reduceMotion) paint();
    };

    /* ----------------------------------------------------------------------
       Обновление состояния сцены (медленное, спокойное)
       ---------------------------------------------------------------------- */
    const update = (dt) => {
      scene.t += dt;

      /* курсор: очень слабое, очень медленное влияние */
      const p = scene.pointer;
      p.weight += (p.target - p.weight) * Math.min(1, dt * 1.6);
      if (p.active) {
        const k = 1 - Math.exp(-2.4 * dt);
        p.x += (p.tx - p.x) * k;
        p.y += (p.ty - p.y) * k;
      }

      /* «дыхание» амплитуды: иногда сигнал становится сильнее */
      scene.swellTimer -= dt;
      if (scene.swellTimer <= 0) {
        scene.swellOn = !scene.swellOn;
        scene.swellTimer = scene.swellOn ? rnd(2.5, 5.5) : rnd(9, 20);
      }
      scene.swell += ((scene.swellOn ? 1 : 0) - scene.swell) * Math.min(1, dt * 0.45);

      /* спектральные пики: медленно дышат, появляются и исчезают */
      for (let i = 0; i < scene.peaks.length; i += 1) {
        const pk = scene.peaks[i];
        pk.age += dt;
        const end = pk.delay + pk.rise + pk.hold + pk.fall;
        if (pk.age >= end) scene.peaks[i] = createPeak();
      }

      /* импульсы по дорожкам: редкие, медленные */
      for (let i = 0; i < scene.traces.length; i += 1) {
        const tr = scene.traces[i];
        if (!tr.pulse) continue;
        const pv = tr.pulse;
        if (pv.u <= 0) {
          pv.wait -= dt;
          if (pv.wait <= 0) pv.u = 0.0001;
          continue;
        }
        pv.u += dt * pv.speed;
        if (pv.u >= 1) {
          pv.u = 0;
          pv.wait = rnd(7, 22); // после прохода — долгая пауза
        }
      }

      /* RF noise: редкие мелкие искры */
      for (let i = 0; i < scene.glints.length; i += 1) {
        const g = scene.glints[i];
        g.life += dt;
        if (g.life >= g.dur) scene.glints[i] = createGlint();
      }

      /* технические артефакты — короткие слабые всплески */
      scene.nextSpikeIn -= dt;
      if (scene.nextSpikeIn <= 0) {
        scene.nextSpikeIn = rnd(profile.spikeGap[0], profile.spikeGap[1]);
        if (scene.spikes.length < 3) scene.spikes.push(createSpike());
      }
      for (let i = scene.spikes.length - 1; i >= 0; i -= 1) {
        const s = scene.spikes[i];
        s.life += dt;
        if (s.life >= s.dur) scene.spikes.splice(i, 1);
      }

      /* RADIAL RF burst: появляются редко */
      scene.nextPulseIn -= dt;
      if (scene.nextPulseIn <= 0) {
        scene.nextPulseIn = rnd(profile.pulseGap[0], profile.pulseGap[1]);
        if (scene.pulses.length < profile.maxPulses) scene.pulses.push(createPulse());
      }
      for (let i = scene.pulses.length - 1; i >= 0; i -= 1) {
        const pu = scene.pulses[i];
        pu.life += dt;
        const travelled = (pu.rn * diag) / (pu.speedN * diag);
        if (pu.life >= travelled) scene.pulses.splice(i, 1);
      }
    };

    /* ----------------------------------------------------------------------
       Отрисовка
       ---------------------------------------------------------------------- */
    const strokeChunks = (xs, ys, i0, i1, gains, lineWidth, color, alphaBase) => {
      ctx.lineWidth = lineWidth;
      for (let c = 0; c < gains.length; c += 1) {
        const g = gains[c];
        if (g < 0.0035) continue;
        const a = clamp01(alphaBase * g);
        if (a < 0.002) continue;
        ctx.strokeStyle = rgba(color, a);
        ctx.beginPath();
        const from = Math.max(0, i0[c] - 1);
        ctx.moveTo(xs[from], ys[from]);
        for (let i = from + 1; i <= i1[c]; i += 1) ctx.lineTo(xs[i], ys[i]);
        ctx.stroke();
      }
    };

    const paint = () => {
      const t = scene.t;
      const strength = clamp01(intensity) * profile.glowStrength;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = coolGrad;
      ctx.fillRect(0, 0, width, height);

      /* --- far: техническая сетка ----------------------------------------- */
      if (gridCanvas) {
        ctx.globalAlpha = 0.86 + 0.14 * Math.sin(t * 0.06);
        ctx.drawImage(gridCanvas, 0, 0, width, height);
        ctx.globalAlpha = 1;
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      /* --- far: очень тёмные медленные волны ------------------------------ */
      const farEnv = (xN) => 0.22 + 0.78 * smoothstep(0.2, 0.72, xN);
      const farAmp = height * 0.055;
      for (let i = 0; i < scene.far.n; i += 1) {
        const x = scene.far.x[i];
        const xN = x / width;
        const p1 = xN * TAU * 0.85;
        scene.far.y0[i] =
          height * 0.795 -
          farAmp *
            farEnv(xN) *
            (Math.sin(p1 + t * 0.11) * 0.7 + Math.sin(p1 * 2.2 + t * 0.07 + 1.4) * 0.3);
        scene.far.y1[i] =
          height * 0.845 -
          farAmp *
            0.72 *
            farEnv(xN) *
            (Math.sin(p1 * 0.9 - t * 0.09 + 2.1) * 0.65 +
              Math.sin(p1 * 2.7 + t * 0.06) * 0.35);
      }
      ctx.strokeStyle = rgba(C.ember, 0.05 * strength);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(scene.far.x[0], scene.far.y0[0]);
      for (let i = 1; i < scene.far.n; i += 1) ctx.lineTo(scene.far.x[i], scene.far.y0[i]);
      ctx.stroke();
      ctx.strokeStyle = rgba(C.emberDeep, 0.075 * strength);
      ctx.beginPath();
      ctx.moveTo(scene.far.x[0], scene.far.y1[0]);
      for (let i = 1; i < scene.far.n; i += 1) ctx.lineTo(scene.far.x[i], scene.far.y1[i]);
      ctx.stroke();

      /* --- far: RF noise (очень мало) ------------------------------------- */
      for (let i = 0; i < scene.glints.length; i += 1) {
        const g = scene.glints[i];
        const k = Math.pow(Math.sin(Math.PI * clamp01(g.life / g.dur)), 1.6);
        const a = g.alpha * k * strength;
        if (a < 0.004) continue;
        const gx = g.xr * width + g.vx * g.life;
        if (gx < -4 || gx > width + 4) continue;
        ctx.fillStyle = rgba(g.warm ? C.signalBright : C.grid, a);
        ctx.fillRect(gx, g.yr * height, g.size * 1.2, g.size);
      }

      /* --- middle: PCB / circuit слой (дорожки, пады, импульсы по линиям) -- */
      const traceEnv = (xN) => smoothstep(0.27, 0.45, xN);
      for (let i = 0; i < scene.traces.length; i += 1) {
        const tr = scene.traces[i];
        const pts = tr.pts;

        /* дорожка: затухает влево, чтобы не спорить с зоной hero-текста */
        for (let s = 1; s < pts.length; s += 1) {
          const x0 = pts[s - 1][0];
          const y0 = pts[s - 1][1];
          const x1 = pts[s][0];
          const y1 = pts[s][1];
          const a = tr.alpha * strength * traceEnv((x0 + x1) / (2 * width));
          if (a < 0.004) continue;
          ctx.strokeStyle = rgba(C.ember, a);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }

        /* пады на концах дорожки */
        for (let s = 0; s < pts.length; s += 1) {
          if (s !== 0 && s !== pts.length - 1 && s !== tr.nodeIdx) continue;
          const pa = tr.alpha * 1.5 * strength * traceEnv(pts[s][0] / width);
          if (pa < 0.006) continue;
          ctx.strokeStyle = rgba(C.signal, pa);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pts[s][0], pts[s][1], s === tr.nodeIdx ? 3.4 : 2.4, 0, TAU);
          ctx.stroke();
          ctx.fillStyle = rgba(C.signalHot, pa * 0.9);
          ctx.beginPath();
          ctx.arc(pts[s][0], pts[s][1], 1.05, 0, TAU);
          ctx.fill();
        }

        /* один мягко светящийся узел на дорожку */
        if (tr.node) {
          const nx = pts[tr.nodeIdx][0];
          const ny = pts[tr.nodeIdx][1];
          const nk = traceEnv(nx / width);
          if (nk > 0.05) {
            const pulseK = 0.7 + 0.3 * Math.sin(t * 0.42 + i * 2.1);
            const R = 13 + 4 * pulseK;
            const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, R);
            ng.addColorStop(0, rgba(C.signalHot, 0.075 * strength * nk * pulseK));
            ng.addColorStop(0.45, rgba(C.ember, 0.03 * strength * nk));
            ng.addColorStop(1, rgba(C.emberDeep, 0));
            ctx.fillStyle = ng;
            ctx.fillRect(nx - R, ny - R, R * 2, R * 2);
          }
        }

        /* импульс, бегущий по дорожке */
        const pv = tr.pulse;
        if (!pv || pv.u <= 0) continue;
        const head = pointOnTrace(tr, pv.u);
        const hk = traceEnv(head[0] / width);
        if (hk <= 0.03) continue;
        const tail = pointOnTrace(tr, Math.max(0, pv.u - 0.05));
        const tg = ctx.createLinearGradient(head[0], head[1], tail[0], tail[1]);
        tg.addColorStop(0, rgba(C.signalLight, 0.3 * strength * hk));
        tg.addColorStop(1, rgba(C.signal, 0));
        ctx.strokeStyle = tg;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(head[0], head[1]);
        ctx.lineTo(tail[0], tail[1]);
        ctx.stroke();

        const blink = 0.72 + 0.28 * Math.sin(t * 8.5 + i);
        const pg = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 10);
        pg.addColorStop(0, rgba(C.signalPale, 0.26 * strength * hk * blink));
        pg.addColorStop(0.4, rgba(C.signalHot, 0.1 * strength * hk * blink));
        pg.addColorStop(1, rgba(C.ember, 0));
        ctx.fillStyle = pg;
        ctx.fillRect(head[0] - 10, head[1] - 10, 20, 20);
        ctx.fillStyle = rgba(C.core, 0.3 * strength * hk * blink);
        ctx.beginPath();
        ctx.arc(head[0], head[1], 1.1, 0, TAU);
        ctx.fill();
      }

      /* --- middle: спектральные пики (мягкие, 6–15 областей) -------------- */
      const baseline = height * 0.955;
      for (let i = 0; i < scene.peaks.length; i += 1) {
        const pk = scene.peaks[i];
        const env =
          smoothstep(pk.delay, pk.delay + pk.rise, pk.age) *
          (1 - smoothstep(pk.delay + pk.rise + pk.hold, pk.delay + pk.rise + pk.hold + pk.fall, pk.age));
        if (env < 0.01) continue;
        const breath = 0.5 + 0.5 * noise1(t * pk.breathSpeed + pk.phase * 3.1, pk.phase);
        const hh = pk.heightN * height * (0.42 + 0.58 * breath) * env * strength;
        const cx = pk.xr * width;
        const half = pk.halfN * width * 1.9;
        if (cx - half > width + 20 || cx + half < -20) continue;

        const grad = ctx.createLinearGradient(0, baseline - hh * 1.05, 0, baseline);
        grad.addColorStop(0, rgba(pk.hot ? C.signalBright : C.signal, (pk.hot ? 0.16 : 0.11) * env));
        grad.addColorStop(0.45, rgba(C.ember, 0.07 * env * (pk.hot ? 1.25 : 1)));
        grad.addColorStop(1, rgba(C.emberDeep, 0));

        ctx.fillStyle = grad;
        ctx.beginPath();
        const steps = 22;
        ctx.moveTo(cx - half, baseline);
        for (let s = 0; s <= steps; s += 1) {
          const u = (s / steps) * 2 - 1;
          const y = baseline - hh * Math.exp(-(u * u) * 3.4);
          ctx.lineTo(cx + u * half, y);
        }
        ctx.lineTo(cx + half, baseline);
        ctx.closePath();
        ctx.fill();
      }

      /* --- middle: radial RF burst ---------------------------------------- */
      for (let i = 0; i < scene.pulses.length; i += 1) {
        const pu = scene.pulses[i];
        const maxR = pu.rn * diag;
        const r = pu.r0n * diag + pu.speedN * diag * pu.life;
        const prog = clamp01(r / maxR);
        const fade = Math.pow(1 - prog, 1.7) * pu.brightness * strength;
        if (fade < 0.004) continue;
        const px = pu.xr * width;
        const py = pu.yr * height;
        const ringW = 3 + prog * 18;

        const drawRing = (radius, wid, alpha) => {
          if (radius <= 1) return;
          const grad = ctx.createRadialGradient(px, py, Math.max(0.5, radius - wid), px, py, radius + wid);
          grad.addColorStop(0, rgba(C.ember, 0));
          grad.addColorStop(0.4, rgba(C.signal, alpha * 0.5));
          grad.addColorStop(0.52, rgba(C.signalBright, alpha));
          grad.addColorStop(0.66, rgba(C.signal, alpha * 0.42));
          grad.addColorStop(1, rgba(C.ember, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, radius + wid, 0, TAU);
          ctx.fill();
        };

        drawRing(r, ringW, fade * 0.85);
        for (let k = 0; k < pu.rings.length; k += 1) {
          const rr = pu.rings[k];
          drawRing(r * rr.rn, ringW * 0.55, fade * rr.br * 0.42);
        }
        if (prog < 0.3) {
          const cg = ctx.createRadialGradient(px, py, 0, px, py, 40 + prog * 140);
          cg.addColorStop(0, rgba(C.signalHot, fade * 0.32));
          cg.addColorStop(0.4, rgba(C.signal, fade * 0.1));
          cg.addColorStop(1, rgba(C.emberDeep, 0));
          ctx.fillStyle = cg;
          ctx.fillRect(px - 200, py - 200, 400, 400);
        }
      }

      /* --- middle: secondary waveform -------------------------------------- */
      {
        const p = scene.pointer;
        const centerY = height * 0.63 + Math.sin(t * 0.1 + 0.7) * height * 0.012;
        const amp = height * 0.062 * (0.75 + 0.25 * Math.sin(t * 0.16 + 1.1));
        for (let i = 0; i < scene.sec.n; i += 1) {
          const x = scene.sec.x[i];
          const xN = x / width;
          const env = smoothstep(0.3, 0.72, xN);
          let pa = 1;
          if (p.weight > 0.002) {
            const dx = (x - p.x) / (width * 0.42);
            pa = 1 + 0.06 * Math.exp(-dx * dx) * p.weight;
          }
          const c1 = Math.sin(xN * TAU * 0.9 + t * 0.21);
          const c2 = Math.sin(xN * TAU * 2.4 + t * 0.33 + 1.7) * 0.34;
          const c3 = Math.sin(xN * TAU * 5.1 + t * 0.5) * 0.12;
          const nz = (noise1(xN * 2.6 + 4.1, 5) - 0.5) * 0.3;
          const v = (c1 * 0.68 + c2 + c3 + nz) * (1 + 0.16 * Math.sin(t * 0.19 + xN * 1.4));
          scene.sec.env[i] = env;
          scene.sec.y[i] = centerY - v * amp * env * pa;
        }
        const step = Math.max(1, Math.floor(scene.sec.n / profile.chunks));
        for (let c = 0; c < profile.chunks; c += 1) {
          scene.chunkI0[c] = Math.min(c * step, scene.sec.n - 1);
          scene.chunkI1[c] = Math.min((c + 1) * step, scene.sec.n - 1);
          scene.secGain[c] = Math.pow(scene.sec.env[Math.min(scene.sec.n - 1, scene.chunkI1[c])], 1.2);
        }
        SECONDARY_LAYERS.forEach((layer) => {
          strokeChunks(
            scene.sec.x,
            scene.sec.y,
            scene.chunkI0,
            scene.chunkI1,
            scene.secGain,
            layer.width,
            layer.color,
            layer.alpha * strength
          );
        });
      }

      /* --- front: основной радиосигнал ------------------------------------- */
      const p = scene.pointer;
      const pointerActive = p.weight > 0.002;
      const centerY = height * 0.5 + Math.sin(t * 0.13) * height * 0.018;
      const amSlow = 0.8 + 0.2 * Math.sin(t * 0.19 + 0.6);
      const ampBase = height * (profile.key === "mobile" ? 0.155 : 0.132) * amSlow * (1 + 0.34 * scene.swell);
      const head = (t * 0.032) % 1; // медленно проходящий «пакет» сигнала

      for (let i = 0; i < scene.wave.n; i += 1) {
        const x = scene.wave.x[i];
        const xN = x / width;
        /* сигнал «набирает силу» правее зоны hero-текста */
        const env = smoothstep(0.33, 0.7, xN);
        let pa = 1;
        let pull = 0;
        if (pointerActive) {
          const dx = (x - p.x) / (width * 0.45); // большой радиус влияния
          const w = Math.exp(-dx * dx) * p.weight;
          pa = 1 + 0.07 * w; // едва заметная деформация амплитуды
          pull = ((p.y - centerY) / height) * height * 0.055 * w;
        }
        const ph = xN * TAU * 1.16;
        const c1 = Math.sin(ph + t * 0.34 + xN * 0.55);
        const c2 = Math.sin(ph * 2.6 + t * 0.5 + 1.1 + xN * 0.3) * 0.25;
        const c3 = Math.sin(ph * 5.9 + t * 0.76 + xN * 0.15) * 0.11;
        const amMod = 1 + 0.17 * Math.sin(t * 0.23 + xN * 1.7);
        const slow = (noise1(xN * 3.1 + 7.3, 3) - 0.5) * 0.28;
        const micro = (noise1(xN * 16 + 31, 9) - 0.5) * 0.05;
        const v = (c1 * 0.62 + c2 + c3) * amMod + slow + micro;
        scene.wave.env[i] = env;
        scene.wave.y[i] = centerY - v * ampBase * env * pa + pull;
      }

      const chunkCount = profile.chunks;
      const perChunk = Math.max(3, Math.ceil(scene.wave.n / chunkCount));
      for (let c = 0; c < chunkCount; c += 1) {
        const i0 = c * perChunk;
        const i1 = Math.min(scene.wave.n - 1, i0 + perChunk);
        scene.chunkI0[c] = i0;
        scene.chunkI1[c] = i1;
        if (i0 >= scene.wave.n - 1) {
          scene.chunkGain[c] = 0;
          scene.traceGain[c] = 0;
          continue;
        }
        const env = scene.wave.env[(i0 + i1) >> 1];
        const envOp = Math.pow(env, 1.15);
        const midN = ((scene.wave.x[i0] + scene.wave.x[i1]) * 0.5) / width;
        const d = Math.min(Math.abs(midN - head), 1 - Math.abs(midN - head));
        const headBoost = 1 + 1.25 * Math.exp(-(d * d) / 0.0022);
        scene.chunkGain[c] = envOp * headBoost * (1 + 0.07 * p.weight);
        /* тихая «трасса»: доходит до левого края, но остаётся почти невидимой под hero */
        scene.traceGain[c] = 0.12 + 0.88 * envOp;
      }

      /* тихая базовая трасса — держит левую зону спокойной, но «живой» */
      strokeChunks(
        scene.wave.x,
        scene.wave.y,
        scene.chunkI0,
        scene.chunkI1,
        scene.traceGain,
        1.5,
        C.ember,
        0.1 * strength
      );

      /* glow: широкий ореол → средний слой → тонкое яркое ядро */
      profile.glowSet.forEach((idx) => {
        const layer = GLOW_LAYERS[idx];
        strokeChunks(
          scene.wave.x,
          scene.wave.y,
          scene.chunkI0,
          scene.chunkI1,
          scene.chunkGain,
          layer.width,
          layer.color,
          layer.alpha * strength
        );
      });

      /* --- front: локальное свечение самого сильного участка сигнала -------- */
      const hotN = lerp(0.67, 0.92, 0.5 + 0.5 * Math.sin(t * 0.085 + 1.6));
      const hi = clamp(Math.round(hotN * (scene.wave.n - 1)), 0, scene.wave.n - 1);
      const hx = scene.wave.x[hi];
      const hy = scene.wave.y[hi];
      const glowK = (0.72 + 0.62 * scene.swell) * strength;
      if (scene.wave.env[hi] > 0.35) {
        const R = Math.min(width, height * 1.45) * (profile.key === "mobile" ? 0.22 : 0.3);
        const g1 = ctx.createRadialGradient(hx, hy, 0, hx, hy, R);
        g1.addColorStop(0, rgba(C.signalHot, 0.085 * glowK));
        g1.addColorStop(0.34, rgba(C.signal, 0.05 * glowK));
        g1.addColorStop(1, rgba(C.emberDeep, 0));
        ctx.fillStyle = g1;
        ctx.fillRect(hx - R, hy - R, R * 2, R * 2);

        const g2 = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.3);
        g2.addColorStop(0, rgba(C.signalLight, 0.1 * glowK));
        g2.addColorStop(1, rgba(C.signal, 0));
        ctx.fillStyle = g2;
        ctx.fillRect(hx - R * 0.3, hy - R * 0.3, R * 0.6, R * 0.6);

        /* самая яркая точка — светло-белый используется крайне скупо */
        const coreA = (0.3 + 0.22 * Math.sin(t * 1.15)) * glowK;
        if (coreA > 0.02) {
          ctx.fillStyle = rgba(C.core, coreA);
          ctx.beginPath();
          ctx.arc(hx, hy, 1.5, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = rgba(C.signalPale, 0.22 * glowK);
        ctx.beginPath();
        ctx.arc(hx, hy, 3.1, 0, TAU);
        ctx.fill();
      }

      /* --- front: технические артефакты (короткие слабые всплески) --------- */
      for (let i = 0; i < scene.spikes.length; i += 1) {
        const s = scene.spikes[i];
        const k = Math.pow(Math.sin(Math.PI * clamp01(s.life / s.dur)), 2);
        const a = s.alpha * k * strength;
        if (a < 0.005) continue;
        const sx = s.xr * width;
        const sy = s.yr * height;
        const len = s.lenN * height;
        ctx.strokeStyle = rgba(C.signalLight, a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy - len);
        ctx.stroke();
        for (let k2 = 0; k2 < s.satellites.length; k2 += 1) {
          const sat = s.satellites[k2];
          ctx.fillStyle = rgba(C.signalBright, a * sat.a);
          ctx.fillRect(sx + sat.dx, sy + sat.dy, sat.s, sat.s);
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };

    /* ----------------------------------------------------------------------
       Цикл
       ---------------------------------------------------------------------- */
    let raf = 0;
    let last = 0;

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (pendingResize) {
        pendingResize = false;
        applyMetrics();
      }
      update(dt);
      paint();
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    /* ----------------------------------------------------------------------
       События: ресайз, видимость, курсор
       ---------------------------------------------------------------------- */
    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        pendingResize = true;
        if (reduceMotion) {
          pendingResize = false;
          applyMetrics();
        }
      }, 120);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!reduceMotion) start();
    };

    let pointerRaf = 0;
    const onPointerMove = (e) => {
      if (e.pointerType === "touch") return;
      if (profile.key === "mobile") return;
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        const p = scene.pointer;
        p.tx = e.clientX;
        p.ty = e.clientY;
        if (!p.moved) {
          p.moved = true;
          p.x = p.tx;
          p.y = p.ty;
          p.active = true;
        } else {
          p.active = true;
        }
        p.target = 1;
      });
    };
    const onPointerLeave = () => {
      scene.pointer.target = 0;
    };

    applyMetrics();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleResize) : null;
    if (resizeObserver) resizeObserver.observe(host);
    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", scheduleResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    const pointerEnabled = interactive && hoverCapable && !reduceMotion;
    if (pointerEnabled) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave, { passive: true });
      window.addEventListener("blur", onPointerLeave);
    }

    if (reduceMotion) {
      /* статичный, но осмысленный кадр: короткая «разгонка» времени */
      for (let i = 0; i < 110; i += 1) update(1 / 12);
      paint();
    } else {
      start();
    }

    return () => {
      stop();
      if (pointerRaf) cancelAnimationFrame(pointerRaf);
      window.clearTimeout(resizeTimer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={hostRef}
      className={[
        "radio-development-background",
        canvasSupported ? "" : "radio-development-background--fallback",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="radio-development-background__canvas" />
      <span className="radio-development-background__scrim" />
      <span className="radio-development-background__vignette" />
    </div>
  );
}
