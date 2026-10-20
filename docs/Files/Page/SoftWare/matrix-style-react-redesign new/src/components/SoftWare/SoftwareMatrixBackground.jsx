import React, { useEffect, useRef, useState } from 'react';
import '../../styles/software.scss';

/* ------------------------------------------------------------------ */
/*  Glyph set                                                          */
/* ------------------------------------------------------------------ */

const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SYMBOLS = '<>[]{}+=*/\\_|:;.-';
const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
// ALNUM twice -> digits/letters dominate, kana is an accent (~25%)
const GLYPHS = (ALNUM + ALNUM + SYMBOLS + KANA).split('');
const GLYPH_COUNT = GLYPHS.length;

/* ------------------------------------------------------------------ */
/*  Palette / constants                                                */
/* ------------------------------------------------------------------ */

const BG = '#020403';
// per-frame backdrop re-draw alpha -> 2-3 frame afterglow, no mud
const FADE_ALPHA = 0.62;
const HEAD_RARE = '#c8ffd8';
const FONT_FAMILY =
  '"JetBrains Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/* Stream budget per layer @1920px. Scaled by viewport width + profile. */
const LAYERS = [
  {
    // far — deep, low contrast, slightly out of focus
    font: [9, 11],
    speed: [0.15, 0.32],
    alpha: [0.26, 0.44],
    len: [22, 46],
    count: 150,
    maxOcc: 3,
    color: '#0b4a24',
    head: '#12a84a',
    blur: 0.45, // baked softness -> reads as distance
    tailCurve: 0.62, // flatter ramp = less contrast
    glowChance: 0.05,
    glowSize: 2.2,
    glowAlpha: 0.16,
    sparkGlow: false,
    brightHeadChance: 0,
    parallax: 0.6,
  },
  {
    // mid — main body of the rain
    font: [12, 15],
    speed: [0.38, 0.75],
    alpha: [0.55, 0.85],
    len: [18, 42],
    count: 150,
    maxOcc: 3,
    color: '#12a84a',
    head: '#39ff88',
    blur: 0,
    tailCurve: 0.8,
    glowChance: 0.34,
    glowSize: 2.7,
    glowAlpha: 0.34,
    sparkGlow: true,
    brightHeadChance: 0.07,
    parallax: 2.5,
  },
  {
    // front — bigger, brighter, faster, most glow
    font: [16, 21],
    speed: [0.8, 1.3],
    alpha: [0.8, 1],
    len: [14, 34],
    count: 150,
    maxOcc: 3,
    color: '#19d866',
    head: '#7affad',
    blur: 0,
    tailCurve: 0.92, // punchiest falloff = closest
    glowChance: 0.85,
    glowSize: 3.3,
    glowAlpha: 0.5,
    sparkGlow: true,
    brightHeadChance: 0.18,
    parallax: 6.5,
  },
];

const FONT_CACHE = {};
function fontFor(size) {
  return FONT_CACHE[size] || (FONT_CACHE[size] = `${size}px ${FONT_FAMILY}`);
}

const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => (a + Math.random() * (b - a + 1)) | 0;
const randGlyph = () => (Math.random() * GLYPH_COUNT) | 0;

function hexRgba(hex, a) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

/* ------------------------------------------------------------------ */
/*  Glyph atlas                                                        */
/* ------------------------------------------------------------------ */

const ATLAS_COLS = 16;

function makeAtlas(size, color, dpr, blur) {
  const cwCssRaw = size * 1.2;
  const chCssRaw = size * 1.45;
  const swDev = Math.ceil(cwCssRaw * dpr);
  const shDev = Math.ceil(chCssRaw * dpr);
  const cw = swDev / dpr;
  const ch = shDev / dpr;
  const rows = Math.ceil(GLYPH_COUNT / ATLAS_COLS);

  const cv = document.createElement('canvas');
  cv.width = swDev * ATLAS_COLS;
  cv.height = shDev * rows;

  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.font = fontFor(size);
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillStyle = color;
  // depth-of-field for the far layer, baked once (free at render time)
  if (blur > 0) {
    try {
      c.filter = `blur(${blur}px)`;
    } catch (e) {
      /* no filter support -> crisp far layer, still fine */
    }
  }
  for (let i = 0; i < GLYPH_COUNT; i++) {
    const col = i % ATLAS_COLS;
    const row = (i / ATLAS_COLS) | 0;
    c.fillText(GLYPHS[i], col * cw + cw * 0.5, row * ch + ch * 0.06);
  }

  return { cv, cw, ch, swDev, shDev };
}

/* Soft radial halo, baked once */
function makeGlowSprite(color) {
  const s = 96;
  const cv = document.createElement('canvas');
  cv.width = s;
  cv.height = s;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, hexRgba(color, 0.62));
  g.addColorStop(0.18, hexRgba(color, 0.3));
  g.addColorStop(0.42, hexRgba(color, 0.1));
  g.addColorStop(0.72, hexRgba(color, 0.025));
  g.addColorStop(1, hexRgba(color, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
  return cv;
}

/* Fine grain */
function makeNoiseTile() {
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = s;
  cv.height = s;
  const c = cv.getContext('2d');
  const img = c.createImageData(s, s);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 30;
    d[i + 1] = 86;
    d[i + 2] = 56;
    d[i + 3] = (Math.random() * 26) | 0;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

/* ------------------------------------------------------------------ */
/*  Atmospheric backdrop                                               */
/* ------------------------------------------------------------------ */
function makeBackdrop(w, h, profile) {
  const q = 0.5;
  const cv = document.createElement('canvas');
  cv.width = Math.max(2, Math.round(w * q));
  cv.height = Math.max(2, Math.round(h * q));
  const c = cv.getContext('2d');
  c.setTransform(cv.width / w, 0, 0, cv.height / h, 0, 0);

  const base = c.createLinearGradient(0, 0, w * 0.35, h);
  base.addColorStop(0, '#041009');
  base.addColorStop(0.45, '#030907');
  base.addColorStop(1, '#010302');
  c.fillStyle = base;
  c.fillRect(0, 0, w, h);

  const spots = [
    [0.78, 0.26, 0.62, 'rgba(18,168,74,0.16)'],
    [0.56, 0.72, 0.58, 'rgba(15,95,47,0.15)'],
    [0.96, 0.58, 0.42, 'rgba(57,255,136,0.07)'],
    [0.34, 0.12, 0.45, 'rgba(18,168,74,0.05)'],
  ];
  const R = Math.max(w, h);
  for (let i = 0; i < spots.length; i++) {
    const [sx, sy, sr, col] = spots[i];
    const x = w * sx;
    const y = h * sy;
    const r = R * sr;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(0.55, col.replace(/[\d.]+\)$/, '0.03)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  const horizon = c.createLinearGradient(0, 0, 0, h * 0.42);
  horizon.addColorStop(0, 'rgba(19,120,60,0.1)');
  horizon.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = horizon;
  c.fillRect(0, 0, w, h * 0.42);

  const noise = c.createPattern(makeNoiseTile(), 'repeat');
  if (noise) {
    c.globalAlpha = 0.5;
    c.fillStyle = noise;
    c.fillRect(0, 0, w, h);
    c.globalAlpha = 1;
  }

  if (profile === 'mobile') {
    const top = c.createLinearGradient(0, 0, 0, h * 0.6);
    top.addColorStop(0, 'rgba(0,0,0,0.6)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = top;
    c.fillRect(0, 0, w, h * 0.6);
  } else {
    const left = c.createLinearGradient(0, 0, w * 0.72, 0);
    left.addColorStop(0, 'rgba(0,0,0,0.72)');
    left.addColorStop(0.35, 'rgba(0,0,0,0.45)');
    left.addColorStop(0.7, 'rgba(0,0,0,0.12)');
    left.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = left;
    c.fillRect(0, 0, w, h);
  }

  const vig = c.createRadialGradient(
    w * 0.6,
    h * 0.45,
    Math.min(w, h) * 0.2,
    w * 0.6,
    h * 0.45,
    R * 0.78
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = vig;
  c.fillRect(0, 0, w, h);

  return cv;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SoftwareMatrixBackground({ className = '', intensity = 1 }) {
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let ctx = null;
    try {
      ctx = canvas.getContext('2d', { alpha: false });
    } catch (e) {
      ctx = null;
    }
    if (!ctx) {
      setFallback(true);
      return undefined;
    }

    const host = canvas.parentElement || canvas;
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fineMq = window.matchMedia('(hover: hover) and (pointer: fine)');

    let width = 1;
    let height = 1;
    let profile = 'desktop';
    let speedScale = 1;
    let glowScale = 1;
    let mouseEnabled = false;
    let streams = [];
    let atlases = [];
    let backdrop = null;
    let haze = null;
    let hazeSpots = [];
    const busy = [null, null, null];
    const cols = [0, 0, 0];
    const colW = [0, 0, 0];

    let quality = 1;
    let avgMs = 16.7;

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: false };

    function densityAt(nx) {
      if (profile === 'mobile') return 0.65 + 0.35 * nx;
      const a = profile === 'desktop' ? 0.16 : 0.08;
      const b = profile === 'desktop' ? 0.7 : 0.6;
      let t = (nx - a) / (b - a);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return 0.34 + 0.66 * t * t * (3 - 2 * t);
    }

    function release(s) {
      if (s.col >= 0 && busy[s.layer][s.col] > 0) busy[s.layer][s.col] -= 1;
      s.col = -1;
      s.active = false;
    }

    function spawn(s, initial) {
      const L = LAYERS[s.layer];
      const n = cols[s.layer];
      const b = busy[s.layer];

      let col = (Math.random() * n) | 0;
      let best = -1;
      let bestScore = -1;
      let fallbackCol = col;
      let fallbackOcc = 255;

      for (let t = 0; t < 18; t++) {
        let c = (Math.random() * n) | 0;
        if (t > 0 && Math.random() < 0.45) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const c2 = c + side;
          if (c2 >= 0 && c2 < n && b[c2] > 0 && b[c2] < L.maxOcc) c = c2;
        }
        if (b[c] < fallbackOcc) {
          fallbackOcc = b[c];
          fallbackCol = c;
        }
        if (b[c] >= L.maxOcc) continue;
        const score = Math.random() * densityAt((c + 0.5) / n) * (b[c] === 0 ? 1 : 0.6);
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
        if (b[c] === 0 && Math.random() < 0.7) break;
      }
      col = best >= 0 ? best : fallbackCol;

      const nx = (col + 0.5) / n;
      b[col] += 1;

      const d = densityAt(nx);
      const sizeIdx = irand(0, 2);
      const A = atlases[s.layer];

      s.col = col;
      s.x = (col + 0.5) * colW[s.layer];
      s.fontSize = A.sizes[sizeIdx];
      s.cellH = Math.round(s.fontSize * 1.12);
      s.tail = A.tail[sizeIdx];
      s.headA = A.head[sizeIdx];
      s.rareA = A.rare[sizeIdx];
      s.speed = rand(L.speed[0], L.speed[1]) * speedScale;
      s.len = irand(L.len[0], L.len[1]);
      s.alpha = rand(L.alpha[0], L.alpha[1]) * (0.5 + 0.5 * d);
      s.headY = initial ? Math.random() * height : -Math.random() * height * 0.35;
      s.lastRow = Math.floor(s.headY / s.cellH);
      s.fade = initial ? 1 : 0;
      s.dying = false;
      s.life = Math.random() < 0.3 ? rand(3000, 10000) : -1;
      s.brightHead = Math.random() < L.brightHeadChance;
      s.glow = glowScale > 0 && Math.random() < L.glowChance;
      s.mutate = rand(0.015, 0.06);
      s.lenTimer = rand(1500, 4500);
      s.spark = -1;
      s.sparkA = 0;
      s.active = true;

      const cells = s.cells;
      for (let i = 0; i < cells.length; i++) cells[i] = randGlyph();
    }

    function build() {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width || window.innerWidth));
      height = Math.max(1, Math.round(rect.height || window.innerHeight));

      const reduced = reducedMq.matches;
      const portrait = height > width;
      let density;
      let dprCap;

      if (width >= 1200) {
        profile = 'desktop';
        density = 1;
        dprCap = 1.5;
        glowScale = 1;
      } else if (width >= 768) {
        profile = 'tablet';
        density = 0.55;
        dprCap = 1.25;
        glowScale = 0.6;
      } else {
        profile = 'mobile';
        density = portrait ? 0.26 : 0.34;
        dprCap = 1.25;
        glowScale = 0.45;
      }

      speedScale = reduced ? 0.12 : 1;
      if (reduced) density *= 0.4;
      density *= Math.max(0, Math.min(2, intensity));
      mouseEnabled = fineMq.matches && !reduced;
      quality = 1;
      avgMs = 16.7;

      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      backdrop = makeBackdrop(width, height, profile);
      ctx.drawImage(backdrop, 0, 0, width, height);
      haze = makeGlowSprite('#12a84a');
      hazeSpots = [
        { x: 0.74, y: 0.3, r: 0.85, a: 0.05, sx: 0.06, sy: 0.05, p: 0 },
        { x: 0.52, y: 0.66, r: 0.7, a: 0.035, sx: 0.05, sy: 0.04, p: 2.1 },
        { x: 0.93, y: 0.5, r: 0.5, a: 0.03, sx: 0.04, sy: 0.06, p: 4.2 },
      ];

      atlases = LAYERS.map((L) => {
        const lo = L.font[0];
        const hi = L.font[1];
        const sizes = [lo, Math.round((lo + hi) / 2), hi];
        const tail = sizes.map((sz) => makeAtlas(sz, L.color, dpr, L.blur));
        const head = sizes.map((sz) => makeAtlas(sz, L.head, dpr, L.blur));
        const rare =
          L.brightHeadChance > 0
            ? sizes.map((sz) => makeAtlas(sz, HEAD_RARE, dpr, L.blur))
            : head;
        return {
          sizes,
          tail,
          head,
          rare,
          glow: makeGlowSprite(L.head),
          glowRare: makeGlowSprite(HEAD_RARE),
        };
      });

      const spacing = profile === 'mobile' && portrait ? 1.4 : 1.05;
      streams = [];

      for (let l = 0; l < LAYERS.length; l++) {
        const L = LAYERS[l];
        colW[l] = L.font[1] * spacing;
        cols[l] = Math.max(1, Math.ceil(width / colW[l]));
        busy[l] = new Uint8Array(cols[l]);

        const count = Math.max(12, Math.round(L.count * (width / 1920) * density));
        const maxRows = Math.max(Math.ceil(height / (L.font[0] * 1.1)) + 4, L.len[1] + 8);

        for (let i = 0; i < count; i++) {
          const s = {
            layer: l,
            rank: (i + 1) / count,
            cells: new Uint8Array(maxRows),
            col: -1,
            x: 0,
            fontSize: 12,
            cellH: 13,
            tail: null,
            headA: null,
            rareA: null,
            headY: 0,
            lastRow: 0,
            speed: 0,
            len: 10,
            alpha: 0.5,
            fade: 0,
            active: false,
            wait: Math.random() * 2200,
            brightHead: false,
            glow: false,
            mutate: 0.02,
            lenTimer: 0,
            life: -1,
            dying: false,
            spark: -1,
            sparkA: 0,
          };
          if (Math.random() < 0.85) spawn(s, true);
          streams.push(s);
        }
      }
    }

    /* ---------------- frame loop ------------------------------------ */
    let raf = 0;
    let last = performance.now();

    function frame(now) {
      raf = requestAnimationFrame(frame);

      let dt = now - last;
      last = now;
      if (dt > 50) dt = 50;
      if (dt < 0) dt = 0;
      const dtF = dt / 16.667;

      avgMs += (dt - avgMs) * 0.05;
      if (avgMs > 23 && quality > 0.4) quality -= 0.015;
      else if (avgMs < 17.5 && quality < 1) quality += 0.008;

      mouse.x += (mouse.tx - mouse.x) * 0.07;
      mouse.y += (mouse.ty - mouse.y) * 0.07;
      const mOn = mouseEnabled && mouse.on;
      const mxPx = mouse.x * width;
      const myPx = mouse.y * height;
      const R = Math.min(width, height) * 0.16;
      const R2 = R * R;

      ctx.globalAlpha = FADE_ALPHA;
      ctx.drawImage(backdrop, 0, 0, width, height);

      if (haze && glowScale > 0) {
        ctx.globalCompositeOperation = 'lighter';
        const t = now * 0.00006;
        for (let i = 0; i < hazeSpots.length; i++) {
          const s = hazeSpots[i];
          const r = Math.max(width, height) * s.r;
          const cx = width * (s.x + Math.sin(t + s.p) * s.sx);
          const cy = height * (s.y + Math.cos(t * 0.8 + s.p) * s.sy);
          ctx.globalAlpha = s.a * glowScale;
          ctx.drawImage(haze, cx - r * 0.5, cy - r * 0.5, r, r);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;

      let curLayer = -1;
      let L = LAYERS[0];
      let A = atlases[0];
      let px = 0;
      let py = 0;
      let curve = L.tailCurve;
      let glowSize = L.glowSize;
      let glowAlpha = L.glowAlpha;
      let sparkGlowOn = L.sparkGlow;

      for (let n = 0; n < streams.length; n++) {
        const s = streams[n];

        if (s.layer !== curLayer) {
          curLayer = s.layer;
          L = LAYERS[curLayer];
          A = atlases[curLayer];
          curve = L.tailCurve;
          glowSize = L.glowSize;
          glowAlpha = L.glowAlpha;
          sparkGlowOn = L.sparkGlow;
          const par = mouseEnabled ? L.parallax : 0;
          px = (mouse.x - 0.5) * par;
          py = (mouse.y - 0.5) * par * 0.5;
        }

        if (s.rank > quality) {
          if (s.active) release(s);
          s.wait = 600;
          continue;
        }

        if (!s.active) {
          s.wait -= dt;
          if (s.wait > 0) continue;
          spawn(s, false);
        }

        s.headY += s.speed * dtF;

        if (s.dying) {
          s.fade -= dt / 900;
          if (s.fade <= 0) {
            release(s);
            s.wait = rand(300, 3600);
            continue;
          }
        } else {
          if (s.fade < 1) s.fade = Math.min(1, s.fade + dt / 700);
          if (s.life > 0) {
            s.life -= dt;
            if (s.life <= 0) s.dying = true;
          }
        }
        if (s.headY - s.len * s.cellH > height) {
          release(s);
          s.wait = rand(300, 4200);
          continue;
        }

        const headRow = Math.floor(s.headY / s.cellH);
        const cells = s.cells;
        const rows = cells.length;

        if (headRow !== s.lastRow) {
          s.lastRow = headRow;
          if (headRow >= 0 && headRow < rows && Math.random() < 0.7) cells[headRow] = randGlyph();
        }
        if (Math.random() < s.mutate * dtF) {
          const r = headRow - ((Math.random() * s.len) | 0);
          if (r >= 0 && r < rows) cells[r] = randGlyph();
        }
        s.lenTimer -= dt;
        if (s.lenTimer <= 0) {
          s.lenTimer = rand(1500, 4500);
          const nl = s.len + irand(-4, 4);
          s.len = Math.max(L.len[0], Math.min(L.len[1] + 4, nl));
        }
        if (s.sparkA > 0) {
          s.sparkA -= dt / 500;
        } else if (Math.random() < 0.006 * dtF) {
          s.spark = headRow - irand(2, Math.max(2, s.len - 2));
          s.sparkA = 1;
        }

        const x = s.x + px;
        const base = s.alpha * s.fade;
        const len = s.len;
        const cellH = s.cellH;
        const tailA = s.tail;
        const headA = s.brightHead ? s.rareA : s.headA;

        for (let i = 0; i < len; i++) {
          const row = headRow - i;
          if (row < 0) break;
          if (row >= rows) continue;
          const y = row * cellH + py;
          if (y > height) continue;
          if (y < -cellH) break;

          let a;
          let atlas;
          if (i === 0) {
            a = 1;
            atlas = headA;
          } else if (i === 1) {
            a = 0.7;
            atlas = s.headA;
          } else {
            const t = 1 - i / len;
            a = curve * t * Math.sqrt(t);
            atlas = tailA;
          }
          a *= base;

          let isSpark = false;
          if (row === s.spark && s.sparkA > 0 && i > 1) {
            const sa = s.sparkA * base;
            if (sa > a) {
              a = sa;
              atlas = s.headA;
              isSpark = true;
            }
          }

          if (mOn) {
            const dx = x - mxPx;
            const dy = y - myPx;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              let k = 1 - Math.sqrt(d2) / R;
              k *= k;
              a += k * 0.35 * s.fade;
            }
          }

          if (a < 0.025) continue;
          if (a > 1) a = 1;

          const g = cells[row];
          const sx = (g % ATLAS_COLS) * atlas.swDev;
          const sy = ((g / ATLAS_COLS) | 0) * atlas.shDev;

          const headGlow = i === 0 && s.glow;
          const tailGlow = isSpark && sparkGlowOn && s.sparkA > 0.35;
          if (headGlow || tailGlow) {
            const gs = s.fontSize * (tailGlow ? glowSize * 0.72 : glowSize);
            ctx.globalAlpha = a * (tailGlow ? glowAlpha * 0.6 : glowAlpha) * glowScale;
            ctx.drawImage(
              s.brightHead && headGlow ? A.glowRare : A.glow,
              x - gs * 0.5,
              y + s.fontSize * 0.5 - gs * 0.5,
              gs,
              gs
            );
          }

          ctx.globalAlpha = a;
          ctx.drawImage(
            atlas.cv,
            sx,
            sy,
            atlas.swDev,
            atlas.shDev,
            x - atlas.cw * 0.5,
            y,
            atlas.cw,
            atlas.ch
          );
        }
      }
    }

    /* ---------------- events ---------------------------------------- */
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 120);
    };
    const onMove = (e) => {
      if (!mouseEnabled) return;
      mouse.on = true;
      mouse.tx = e.clientX / width;
      mouse.ty = e.clientY / height;
    };
    const onLeave = (e) => {
      if (e && e.relatedTarget) return;
      mouse.on = false;
      mouse.tx = 0.5;
      mouse.ty = 0.5;
    };
    const onVisibility = () => {
      last = performance.now();
    };
    const onMotionChange = () => build();

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    if (reducedMq.addEventListener) reducedMq.addEventListener('change', onMotionChange);
    else if (reducedMq.addListener) reducedMq.addListener(onMotionChange);

    build();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      if (reducedMq.removeEventListener) reducedMq.removeEventListener('change', onMotionChange);
      else if (reducedMq.removeListener) reducedMq.removeListener(onMotionChange);
      streams = [];
      atlases = [];
    };
  }, [intensity]);

  const cls =
    'software-matrix-background' +
    (fallback ? ' software-matrix-background--fallback' : '') +
    (className ? ` ${className}` : '');

  return (
    <div className={cls} aria-hidden="true">
      <canvas ref={canvasRef} className="software-matrix-background__canvas" />
    </div>
  );
}
