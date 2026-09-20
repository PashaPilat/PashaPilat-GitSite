/* ==========================================================================
   RadioFloating3DObjects
   --------------------------------------------------------------------------
   Изолированный 3D-слой фона страницы «Разработка радиоустройств».

   Это НЕ отдельная сцена-демка, а атмосферная надстройка над 2D PCB-фоном:
   несколько левитирующих радиоэлементов в стиле ghosted CAD / x-ray
   (тонкие яркие контуры + полупрозрачный объём + мягкое cyan-свечение).

   Принципы:
     - React Three Fiber canvas как overlay, pointer-events: none;
     - никаких источников света, теней и пост-обработки — только
       MeshBasicMaterial (ghost-объём, additive) и LineBasicMaterial (контуры);
     - мягкое свечение имитируется additive-слоями и sprite-ореолами;
     - объектов мало (3–5), геометрия умеренная, всё процедурное;
     - вся анимация очень медленная (левитация, медленный доворот, drift);
     - если WebGL/reduce-motion/мобильный — слой не рендерится вообще,
       2D-фон остаётся нетронутым.

   Подключение:
     <RadioFloating3DObjects />
   ========================================================================== */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/components/Radio/RadioFloating3DObjects.scss";

/* --------------------------------------------------------------------------
   Палитра 3D-слоя: холодный tech-blue / cyan, без кислотного неона
   -------------------------------------------------------------------------- */
const HOLO = {
  edgeBright: 0xd8f2ff, // почти бело-голубые акценты
  edgeMid: 0x76dcf6,
  edgeSoft: 0x2f9ec4,
  volume: 0x226f8f,
  halo: "#4fc4e6",
};

/* Общее состояние курсора: очень слабый parallax, только на desktop */
const pointer = { tx: 0, ty: 0 };
const view = { x: 0, y: 0 };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);

/* --------------------------------------------------------------------------
   Утилиты геометрии: контуры строим вручную (без three/examples),
   чтобы держать малое число draw call и не зависеть от версии three
   -------------------------------------------------------------------------- */
function segmentsFromLines(lines) {
  const arr = new Float32Array(lines.length * 6);
  lines.forEach((l, i) => arr.set(l, i * 6));
  return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(arr, 3));
}

/* 12 рёбер параллелепипеда — используется и как «контур», и как мелкие объекты */
function boxLines(cx, cy, cz, hx, hy, hz) {
  const p = [];
  for (let i = 0; i < 8; i += 1) {
    p.push([cx + (i & 4 ? hx : -hx), cy + (i & 2 ? hy : -hy), cz + (i & 1 ? hz : -hz)]);
  }
  const lines = [];
  for (let i = 0; i < 8; i += 1) {
    for (let b = 0; b < 3; b += 1) {
      if ((i & (1 << b)) === 0) {
        const j = i | (1 << b);
        lines.push([p[i][0], p[i][1], p[i][2], p[j][0], p[j][1], p[j][2]]);
      }
    }
  }
  return lines;
}

const lowerOpacity = (b, v) => Math.max(0.01, v * b);

/* --------------------------------------------------------------------------
   Материалы: полупрозрачность + additive, поэтому пересечения «светятся»
   -------------------------------------------------------------------------- */
function useHoloMaterials(brightness = 1) {
  return useMemo(() => {
    const b = clamp(brightness, 0.15, 1.2);
    return {
      edge: new THREE.LineBasicMaterial({
        color: HOLO.edgeBright,
        transparent: true,
        opacity: lowerOpacity(b, 0.4),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      edgeMid: new THREE.LineBasicMaterial({
        color: HOLO.edgeMid,
        transparent: true,
        opacity: lowerOpacity(b, 0.24),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      edgeSoft: new THREE.LineBasicMaterial({
        color: HOLO.edgeSoft,
        transparent: true,
        opacity: lowerOpacity(b, 0.12),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      volume: new THREE.MeshBasicMaterial({
        color: HOLO.volume,
        transparent: true,
        opacity: lowerOpacity(b, 0.05),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      volumeSoft: new THREE.MeshBasicMaterial({
        color: HOLO.volume,
        transparent: true,
        opacity: lowerOpacity(b, 0.085),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      wire: new THREE.MeshBasicMaterial({
        color: HOLO.edgeMid,
        wireframe: true,
        transparent: true,
        opacity: lowerOpacity(b, 0.05),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    };
  }, [brightness]);
}

/* --------------------------------------------------------------------------
   Ореол: мягкое cyan-свечение вокруг объекта (замена bloom-пайплайну)
   -------------------------------------------------------------------------- */
let haloTexture = null;
function getHaloTexture() {
  if (haloTexture || typeof document === "undefined") return haloTexture;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return null;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.22, "rgba(180,232,255,0.4)");
  grd.addColorStop(0.55, "rgba(110,196,232,0.1)");
  grd.addColorStop(1, "rgba(70,160,205,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  haloTexture = new THREE.CanvasTexture(c);
  haloTexture.colorSpace = THREE.SRGBColorSpace;
  return haloTexture;
}

function Halo({ scale = 4, opacity = 0.12, brightness = 1 }) {
  const tex = getHaloTexture();
  return (
    <sprite scale={[scale, scale, 1]}>
      <spriteMaterial
        map={tex}
        color={HOLO.halo}
        transparent
        opacity={opacity * brightness}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        dispose={null}
      />
    </sprite>
  );
}

/* ==========================================================================
   3D-объекты (процедурные, «инженерные», без фотомоделей)
   ========================================================================== */

/* Катушка индуктивности: спираль (tube) + контурная сетка + выводы */
function InductorCoil({ brightness = 1 }) {
  const m = useHoloMaterials(brightness);
  const geo = useMemo(() => {
    const turns = 5.25;
    const h = 1.42;
    const r = 0.4;
    const seg = 200;
    const pts = [];
    for (let i = 0; i <= seg; i += 1) {
      const k = i / seg;
      const a = k * Math.PI * 2 * turns;
      pts.push(new THREE.Vector3(Math.cos(a) * r, k * h - h / 2, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 200, 0.021, 5, false);
  }, []);
  const leads = useMemo(
    () =>
      segmentsFromLines([
        [0, -0.71, 0, 0, -1.16, 0],
        [0, 0.71, 0, 0, 1.16, 0],
        [0, -1.16, 0, 0.9, -1.16, 0],
        [0, 1.16, 0, -0.9, 1.16, 0],
      ]),
    []
  );
  return (
    <group>
      <mesh geometry={geo} material={m.volume} dispose={null} />
      <mesh geometry={geo} material={m.wire} dispose={null} />
      <lineSegments geometry={leads} material={m.edgeMid} dispose={null} />
      <Halo scale={2.9} opacity={0.13} brightness={brightness} />
    </group>
  );
}

/* Микросхема (SOIC): ghost-корпус, яркие рёбра, выводы, внутренний кристалл */
function ChipSOIC({ brightness = 1 }) {
  const m = useHoloMaterials(brightness);
  const { body, legs, die } = useMemo(() => {
    const lines = [
      ...boxLines(0, 0, 0, 0.74, 0.14, 0.44),
      ...boxLines(0, 0.005, 0, 0.5, 0.045, 0.26), // faint internal contour
    ];
    const legLines = [];
    for (let i = 0; i < 4; i += 1) {
      const z = -0.3 + i * 0.2;
      legLines.push(...boxLines(0.83, -0.19, z, 0.09, 0.06, 0.032));
      legLines.push(...boxLines(-0.83, -0.19, z, 0.09, 0.06, 0.032));
    }
    return {
      body: new THREE.BoxGeometry(1.48, 0.28, 0.88),
      legs: segmentsFromLines(legLines),
      die: segmentsFromLines(lines),
    };
  }, []);
  return (
    <group position={[0, -0.06, 0]}>
      <mesh geometry={body} material={m.volumeSoft} dispose={null} />
      {/* второй, чуть увеличенный контурный проход — мягкое свечение рёбер */}
      <group scale={1.035}>
        <lineSegments geometry={die} material={m.edgeSoft} dispose={null} />
      </group>
      <lineSegments geometry={die} material={m.edge} dispose={null} />
      <lineSegments geometry={legs} material={m.edgeMid} dispose={null} />
      <Halo scale={2.5} opacity={0.1} brightness={brightness} />
    </group>
  );
}

/* Фрагмент печатной платы: тонкая пластина, разводка и пады */
function PcbFragment({ brightness = 1 }) {
  const m = useHoloMaterials(brightness);
  const { plate, outline, traces, pads } = useMemo(() => {
    const w = 2.5;
    const d = 1.5;
    const traceLines = [];
    const padPoints = [];
    for (let k = 0; k < 11; k += 1) {
      let x = rnd(-1.05, 0.95);
      let z = rnd(-0.6, 0.6);
      let prev = [x, 0.05, z];
      padPoints.push(prev);
      const segs = 2 + Math.floor(Math.random() * 3);
      for (let s = 0; s < segs; s += 1) {
        const horiz = Math.random() < 0.66;
        const len = rnd(0.16, 0.5) * (Math.random() < 0.5 ? -1 : 1);
        if (horiz) x = clamp(x + len, -1.16, 1.16);
        else z = clamp(z + len * 0.6, -0.66, 0.66);
        const next = [x, 0.05, z];
        traceLines.push([prev[0], prev[1], prev[2], next[0], next[1], next[2]]);
        prev = next;
      }
      padPoints.push(prev);
    }
    const padLines = [];
    padPoints.forEach((p) => {
      padLines.push(...boxLines(p[0], p[1], p[2], 0.038, 0.016, 0.038));
    });
    return {
      plate: new THREE.BoxGeometry(w, 0.06, d),
      outline: segmentsFromLines(boxLines(0, 0, 0, w / 2, 0.03, d / 2)),
      traces: segmentsFromLines(traceLines),
      pads: segmentsFromLines(padLines),
    };
  }, []);
  return (
    <group rotation={[-1.02, 0, 0.22]}>
      <mesh geometry={plate} material={m.volume} dispose={null} />
      <lineSegments geometry={outline} material={m.edgeMid} dispose={null} />
      <lineSegments geometry={traces} material={m.edgeSoft} dispose={null} />
      <lineSegments geometry={pads} material={m.edgeMid} dispose={null} />
      <Halo scale={3.4} opacity={0.09} brightness={brightness} />
    </group>
  );
}

/* Кварцевый резонатор: строгая кристаллическая форма */
function QuartzCrystal({ brightness = 1 }) {
  const m = useHoloMaterials(brightness);
  const { body, edges } = useMemo(() => {
    const g = new THREE.OctahedronGeometry(0.4, 0);
    g.scale(0.78, 1.5, 0.78);
    const e = new THREE.EdgesGeometry(g, 1);
    e.scale(1.05, 1.05, 1.05);
    return { body: g, edges: e };
  }, []);
  return (
    <group>
      <mesh geometry={body} material={m.volumeSoft} dispose={null} />
      <lineSegments geometry={edges} material={m.edge} dispose={null} />
      <lineSegments geometry={edges} material={m.edgeSoft} dispose={null} scale={1.12} />
      <Halo scale={2.3} opacity={0.12} brightness={brightness} />
    </group>
  );
}

/* RF-модуль с меандровой антенной дорожкой */
function AntennaModule({ brightness = 1 }) {
  const m = useHoloMaterials(brightness);
  const { base, outline, meander } = useMemo(() => {
    const width = 0.62;
    const height = 0.98;
    const turns = 4;
    const lines = [];
    let x = -width / 2;
    let y = 0.1;
    const stepY = height / turns;
    const stepX = width / turns;
    for (let i = 0; i < turns; i += 1) {
      lines.push([x, y, 0, x + stepX, y, 0]);
      if (i < turns - 1) lines.push([x + stepX, y, 0, x + stepX, y + stepY, 0]);
      x += stepX;
      y += stepY;
    }
    lines.push([x, y, 0, x, y + 0.1, 0]); // вибратор
    return {
      base: new THREE.BoxGeometry(0.7, 0.15, 0.46),
      outline: segmentsFromLines(boxLines(0, 0, 0, 0.35, 0.075, 0.23)),
      meander: segmentsFromLines(lines),
    };
  }, []);
  return (
    <group>
      <mesh geometry={base} material={m.volume} dispose={null} />
      <lineSegments geometry={outline} material={m.edgeMid} dispose={null} />
      <group position={[0, 0.11, 0.1]} rotation={[-0.28, 0, 0]}>
        <lineSegments geometry={meander} material={m.edge} dispose={null} />
      </group>
      <Halo scale={2.2} opacity={0.11} brightness={brightness} />
    </group>
  );
}

/* ==========================================================================
   Каркас сцены
   ========================================================================== */

/* Левитация + медленный доворот + очень слабый parallax от курсора */
function FloatingObject({
  position,
  scale = 1,
  rotY = 0,
  spin = 0.05,
  bob = 0.15,
  phase = 0,
  pw = 1,
  children,
}) {
  const ref = useRef(null);
  const tRef = useRef(phase * 7 + 4);
  useFrame((_, delta) => {
    const d = Math.min(delta || 0.016, 0.05);
    tRef.current += d;
    const t = tRef.current;
    const g = ref.current;
    if (!g) return;
    g.position.x = position[0] + view.x * 0.3 * pw;
    g.position.y = position[1] + Math.sin(t * 0.23 + phase * 2) * bob + view.y * 0.2 * pw;
    g.position.z = position[2] + view.x * 0.04 * pw;
    g.rotation.y = rotY + t * spin + view.x * 0.05 * pw;
    g.rotation.x = Math.sin(t * 0.12 + phase * 1.7) * 0.06 + view.y * 0.025 * pw;
    g.rotation.z = Math.sin(t * 0.095 + phase * 2.3) * 0.05;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {children}
    </group>
  );
}

/* Курсор влияет на всю сцену очень слабо и очень плавно */
function PointerDriver({ enabled }) {
  useFrame((_, delta) => {
    const d = Math.min(delta || 0.016, 0.05);
    const k = Math.min(1, d * (enabled ? 0.85 : 2.5));
    view.x += ((enabled ? pointer.tx : 0) - view.x) * k;
    view.y += ((enabled ? pointer.ty : 0) - view.y) * k;
  });
  return null;
}

/* Держим объекты в кадре на узких (планшетных) пропорциях */
function CameraRig() {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  useEffect(() => {
    const aspect = width / Math.max(1, height);
    const z = clamp(9 * (1.7 / Math.max(0.95, aspect)), 9, 14);
    camera.position.set(0, 0, z);
    camera.updateProjectionMatrix();
  }, [camera, width, height]);
  return null;
}

/* Раскладка: 1 крупный справа, 1 средний ближе к центру, 2–3 в глубине.
   Левая треть экрана остаётся свободной — там живёт текст. */
const LAYOUT = {
  coil: {
    position: [2.6, 0.1, -0.5],
    scale: 1,
    rotY: 0.55,
    spin: 0.055,
    bob: 0.17,
    phase: 0.4,
    pw: 1,
    brightness: 1,
  },
  chip: {
    position: [0.82, -0.95, 0.95],
    scale: 1,
    rotY: -0.34,
    spin: 0.042,
    bob: 0.12,
    phase: 1.6,
    pw: 1.25,
    brightness: 0.85,
  },
  plate: {
    position: [3.15, 1.5, -2.4],
    scale: 1.05,
    rotY: 0.2,
    spin: 0.03,
    bob: 0.1,
    phase: 2.7,
    pw: 0.45,
    brightness: 0.42,
  },
  crystal: {
    position: [0.28, 1.12, -1.7],
    scale: 0.9,
    rotY: 0.35,
    spin: 0.07,
    bob: 0.14,
    phase: 3.4,
    pw: 0.6,
    brightness: 0.5,
  },
  antenna: {
    position: [0.02, 1.9, -2.9],
    scale: 0.95,
    rotY: -0.5,
    spin: 0.05,
    bob: 0.12,
    phase: 4.2,
    pw: 0.35,
    brightness: 0.36,
  },
};

const TIERS = {
  desktop: { objects: ["coil", "chip", "plate", "crystal", "antenna"], dpr: [1, 1.5] },
  tablet: { objects: ["coil", "chip", "plate"], dpr: [1, 1.25] },
  off: { objects: [], dpr: [1, 1] },
};

function ObjectContent({ id, brightness }) {
  if (id === "coil") return <InductorCoil brightness={brightness} />;
  if (id === "chip") return <ChipSOIC brightness={brightness} />;
  if (id === "plate") return <PcbFragment brightness={brightness} />;
  if (id === "crystal") return <QuartzCrystal brightness={brightness} />;
  if (id === "antenna") return <AntennaModule brightness={brightness} />;
  return null;
}

/* Если WebGL отсутствует или что-то падает — просто не рендерим 3D-слой,
   2D-фон и страница продолжают работать */
class LayerBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    if (this.props.onFail) this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    if (!window.WebGLRenderingContext) return false;
    const c = document.createElement("canvas");
    return !!(
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl")
    );
  } catch (err) {
    return false;
  }
}

const getTier = (w) => (w < 768 ? "off" : w < 1200 ? "tablet" : "desktop");

export default function RadioFloating3DObjects({ className = "" }) {
  const [tier, setTier] = useState("off");
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);
  const [parallax, setParallax] = useState(false);

  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hoverCapable =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const webgl = supportsWebGL();

    const apply = () => {
      const w = window.innerWidth || 1280;
      setTier(!webgl || reduceMotion ? "off" : getTier(w));
      setParallax(webgl && !reduceMotion && hoverCapable);
      setAllowMotion(!reduceMotion);
    };
    apply();

    let tid = 0;
    const onResize = () => {
      window.clearTimeout(tid);
      tid = window.setTimeout(apply, 220);
    };
    const onVisibility = () => setPaused(document.hidden);
    const onPointerMove = (e) => {
      if (e.pointerType === "touch") return;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    if (parallax || webgl) window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.clearTimeout(tid);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [parallax]);

  const config = TIERS[tier] || TIERS.off;

  /* mobile / нет WebGL / reduce-motion → только 2D-фон */
  if (tier === "off" || failed || !allowMotion) return null;

  return (
    <div
      className={["radio-floating-3d-objects", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <LayerBoundary onFail={() => setFailed(true)}>
        <Canvas
          className="radio-floating-3d-objects__canvas"
          style={{ pointerEvents: "none", display: "block", width: "100%", height: "100%" }}
          dpr={config.dpr}
          frameloop={paused ? "never" : "always"}
          flat
          camera={{ position: [0, 0, 9], fov: 38, near: 0.1, far: 40 }}
          gl={{
            antialias: false,
            alpha: true,
            stencil: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              (e) => {
                e.preventDefault();
                setFailed(true);
              },
              { once: true }
            );
          }}
        >
          <PointerDriver enabled={parallax} />
          <CameraRig />
          {config.objects.map((id) => {
            const cfg = LAYOUT[id];
            return (
              <FloatingObject
                key={id}
                position={cfg.position}
                scale={cfg.scale}
                rotY={cfg.rotY}
                spin={cfg.spin}
                bob={cfg.bob}
                phase={cfg.phase}
                pw={cfg.pw}
              >
                <ObjectContent id={id} brightness={cfg.brightness} />
              </FloatingObject>
            );
          })}
        </Canvas>
      </LayerBoundary>
      <span className="radio-floating-3d-objects__scrim" />
      <span className="radio-floating-3d-objects__fade" />
    </div>
  );
}
