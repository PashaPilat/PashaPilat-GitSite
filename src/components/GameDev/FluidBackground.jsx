import React, { useEffect, useRef, useState } from "react";
import "../../styles/components/GameDev/FluidBackground.scss";

/** GameDev background: WebGL2 velocity and dye simulation. */

const BASE_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const CLEAR_SHADER = `#version 300 es
precision mediump float;
precision mediump sampler2D;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
out vec4 fragColor;
void main() {
  fragColor = value * texture(uTexture, vUv);
}`;

const SPLAT_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
out vec4 fragColor;
void main() {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  float falloff = exp(-dot(p, p) / max(radius, 1e-6));
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + falloff * color, 1.0);
}`;

const ADVECTION_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;
out vec4 fragColor;

vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main() {
  vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
  vec4 result = bilerp(uSource, coord, dyeTexelSize);
  float decay = 1.0 + dissipation * dt;
  fragColor = result / decay;
}`;

const DIVERGENCE_SHADER = `#version 300 es
precision mediump float;
precision mediump sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const CURL_SHADER = `#version 300 es
precision mediump float;
precision mediump sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`;

const VORTICITY_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
out vec4 fragColor;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy;
  fragColor = vec4(vel + force * dt, 0.0, 1.0);
}`;

const PRESSURE_SHADER = `#version 300 es
precision mediump float;
precision mediump sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
out vec4 fragColor;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float C = texture(uPressure, vUv).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SUBTRACT_SHADER = `#version 300 es
precision mediump float;
precision mediump sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

const DISPLAY_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTexelSize;
uniform float uTime;
out vec4 fragColor;

// Local pigment mass at a UV — drives the height field for 3D relief
float massAt(vec2 uv) {
  vec3 c = texture(uTexture, uv).rgb;
  float redAmt = max(c.r, 0.0);
  float blackAmt = max(c.b, 0.0);
  return redAmt + blackAmt * 1.25;
}

/*
  Dye channel semantics:
    r = red pigment amount
    g = ember / hot marker (rare, only inside dense cores)
    b = black ink (soot) amount  →  darkens, never glows
*/

vec3 redPalette(float t, float heat) {
  vec3 bg      = vec3(0.020, 0.008, 0.004);
  vec3 deep    = vec3(0.055, 0.010, 0.006);
  vec3 ink     = vec3(0.110, 0.016, 0.010);
  vec3 blood   = vec3(0.280, 0.032, 0.016);
  vec3 red     = vec3(0.430, 0.055, 0.022);
  vec3 ember   = vec3(0.820, 0.180, 0.040);
  vec3 hot     = vec3(1.000, 0.320, 0.070);

  vec3 col = bg;
  col = mix(col, deep, smoothstep(0.02, 0.14, t));
  col = mix(col, ink, smoothstep(0.12, 0.32, t));
  col = mix(col, blood, smoothstep(0.28, 0.55, t));
  col = mix(col, red, smoothstep(0.50, 0.82, t));

  float core = smoothstep(0.62, 0.98, t);
  float emberAmt = core * heat * 0.42;
  col = mix(col, ember, emberAmt * 0.28);
  col = mix(col, hot, emberAmt * emberAmt * 0.12);

  float rim = smoothstep(0.05, 0.18, t) * (1.0 - smoothstep(0.22, 0.48, t));
  col += vec3(0.22, 0.03, 0.015) * rim * 0.35;
  return col;
}

vec3 blackPalette(float t) {
  // Cold dense soot — reads as a separate heavy pigment, not shadow
  vec3 bg    = vec3(0.020, 0.008, 0.004);
  vec3 grey  = vec3(0.045, 0.026, 0.022);
  vec3 soot  = vec3(0.028, 0.014, 0.012);
  vec3 core  = vec3(0.008, 0.004, 0.004);

  vec3 col = bg;
  col = mix(col, grey, smoothstep(0.02, 0.20, t));
  col = mix(col, soot, smoothstep(0.18, 0.46, t));
  col = mix(col, core, smoothstep(0.42, 0.85, t));
  return col;
}

void main() {
  vec4 data = texture(uTexture, vUv);

  float redAmt = max(data.r, 0.0);
  float blackAmt = max(data.b, 0.0);
  float emberAmt = max(data.g, 0.0);

  // Total pigment mass (both fluids contribute to body)
  float density = redAmt + blackAmt * 1.25;
  float d = pow(clamp(density * 0.9, 0.0, 2.2), 0.78);
  d = clamp(d, 0.0, 1.0);

  // Which pigment dominates locally → hard-ish contrast between streams
  float blackness = blackAmt * 1.35 / max(redAmt + blackAmt * 1.35, 0.0001);
  blackness = smoothstep(0.30, 0.78, blackness);

  float heat = clamp(redAmt * 0.45 + emberAmt * 0.6, 0.0, 1.0);
  heat = pow(heat, 1.55) * (1.0 - blackness * 0.9);

  vec3 color = mix(redPalette(d, heat), blackPalette(d), blackness);

  // ------------------------------------------------------------------
  // 3D VOLUME — treat pigment mass as a height field and shade it.
  // Sample neighbouring mass to build a surface normal, then apply
  // diffuse + specular + subsurface + self-shadow. Purely visual,
  // no geometry — makes clubs read as rounded, layered volumes.
  // ------------------------------------------------------------------
  vec2 tx = uTexelSize * 2.0;
  float hL = massAt(vUv - vec2(tx.x, 0.0));
  float hR = massAt(vUv + vec2(tx.x, 0.0));
  float hD = massAt(vUv - vec2(0.0, tx.y));
  float hU = massAt(vUv + vec2(0.0, tx.y));
  float hC = redAmt + blackAmt * 1.25;

  // Height scaled so dense cores bulge toward the viewer
  float relief = 2.4;
  vec3 normal = normalize(vec3((hL - hR) * relief, (hD - hU) * relief, 1.0));

  // Two light rigs: key from upper-left, cool rim from lower-right
  vec3 keyDir = normalize(vec3(-0.55, 0.68, 0.72));
  vec3 rimDir = normalize(vec3(0.6, -0.5, 0.35));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  float diff = clamp(dot(normal, keyDir), 0.0, 1.0);
  // Wet-pigment specular highlight (subtle, wider on red than soot)
  vec3 halfV = normalize(keyDir + viewDir);
  float spec = pow(clamp(dot(normal, halfV), 0.0, 1.0), 22.0);
  spec *= (1.0 - blackness * 0.85);

  // Backlit rim → coiling clubs get a glowing translucent edge
  float rim = pow(clamp(dot(normal, rimDir), 0.0, 1.0), 2.2);
  float fresnel = pow(1.0 - clamp(normal.z, 0.0, 1.0), 3.0);

  // Subsurface: light bleeding through thin red pigment
  float thin = smoothstep(0.08, 0.5, d) * (1.0 - smoothstep(0.6, 1.0, d));
  float subsurf = thin * (1.0 - blackness);

  // Soft self-shadow: dense volume in front darkens what is behind it
  float occ = massAt(vUv + vec2(-tx.x, tx.y) * 2.2);
  float shadow = clamp((occ - hC) * 1.6, 0.0, 1.0);
  shadow = 1.0 - shadow * 0.45 * smoothstep(0.05, 0.4, d);

  // Compose lighting — keep dark mass dominant, light only sculpts form
  float ambient = 0.55;
  float shade = ambient + diff * 0.85;
  shade *= shadow;
  color *= shade;

  // Rounded volumetric core boost (viewer-facing bulge)
  color += color * normal.z * 0.18 * smoothstep(0.1, 0.7, d);

  // Specular sheen — wet ink surface
  color += vec3(0.9, 0.45, 0.28) * spec * 0.35 * smoothstep(0.12, 0.6, d);

  // Translucent backlit rim glow (red pigment only)
  color += vec3(0.55, 0.10, 0.04) * rim * fresnel * 0.5 * (1.0 - blackness) * smoothstep(0.05, 0.35, d);

  // Subsurface warm bleed inside red streams
  color += vec3(0.42, 0.07, 0.02) * subsurf * 0.4;

  // Soft core bloom only for red pigment
  float bloom = pow(d, 2.6) * 0.32 * (1.0 - blackness);
  color += vec3(0.40, 0.05, 0.015) * bloom;

  // Left readability mask — calm area under page copy
  float leftMask = smoothstep(0.0, 0.48, vUv.x);
  float leftDark = mix(0.18, 1.0, leftMask);
  color *= leftDark;

  float edgeX = smoothstep(0.0, 0.07, vUv.x) * smoothstep(1.0, 0.93, vUv.x);
  float edgeY = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
  float vignette = mix(0.5, 1.0, edgeX * edgeY);
  vignette *= mix(0.55, 1.0, smoothstep(0.04, 0.58, vUv.x));
  color *= vignette;

  float presence = smoothstep(0.02, 0.1, d);
  vec3 bg = vec3(0.020, 0.008, 0.004);
  color = mix(bg, color, presence);

  fragColor = vec4(color, 1.0);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "Shader compile failed");
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || "Program link failed");
  }
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  const uniforms = {};
  for (let i = 0; i < uniformCount; i += 1) {
    const info = gl.getActiveUniform(program, i);
    uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms, vs, fs };
}

function createFBO(gl, w, h, internalFormat, format, type, filter) {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    texelSizeX: 1 / w,
    texelSizeY: 1 / h,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    },
  };
}

function createDoubleFBO(gl, w, h, internalFormat, format, type, filter) {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, filter);
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, filter);
  return {
    width: w,
    height: h,
    texelSizeX: 1 / w,
    texelSizeY: 1 / h,
    get read() {
      return fbo1;
    },
    set read(v) {
      fbo1 = v;
    },
    get write() {
      return fbo2;
    },
    set write(v) {
      fbo2 = v;
    },
    swap() {
      const tmp = fbo1;
      fbo1 = fbo2;
      fbo2 = tmp;
    },
  };
}

function getResolutions(width) {
  if (width < 600) {
    return { sim: 144, dye: 288, pressure: 12 };
  }
  if (width < 1024) {
    return { sim: 224, dye: 448, pressure: 16 };
  }
  return { sim: 288, dye: 576, pressure: 20 };
}

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!isRenderTargetSupported(gl, internalFormat, format, type)) {
    switch (internalFormat) {
      case gl.R16F:
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      case gl.RG16F:
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
      default:
        return null;
    }
  }
  return { internalFormat, format };
}

function isRenderTargetSupported(gl, internalFormat, format, type) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(fbo);
  return status === gl.FRAMEBUFFER_COMPLETE;
}

export default function FluidBackground() {
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    let gl;
    try {
      gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setFallback(true);
      return undefined;
    }

    const extColorBufferFloat = gl.getExtension("EXT_color_buffer_float");
    const extTextureFloatLinear = gl.getExtension("OES_texture_float_linear");
    const halfFloatTexType = gl.HALF_FLOAT;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (extColorBufferFloat) {
      formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    }

    if (!formatRGBA || !formatRG || !formatR) {
      setFallback(true);
      return undefined;
    }

    const filtering = extTextureFloatLinear ? gl.LINEAR : gl.NEAREST;

    let programs;
    try {
      programs = {
        clear: createProgram(gl, BASE_VERTEX, CLEAR_SHADER),
        splat: createProgram(gl, BASE_VERTEX, SPLAT_SHADER),
        advection: createProgram(gl, BASE_VERTEX, ADVECTION_SHADER),
        divergence: createProgram(gl, BASE_VERTEX, DIVERGENCE_SHADER),
        curl: createProgram(gl, BASE_VERTEX, CURL_SHADER),
        vorticity: createProgram(gl, BASE_VERTEX, VORTICITY_SHADER),
        pressure: createProgram(gl, BASE_VERTEX, PRESSURE_SHADER),
        gradientSubtract: createProgram(gl, BASE_VERTEX, GRADIENT_SUBTRACT_SHADER),
        display: createProgram(gl, BASE_VERTEX, DISPLAY_SHADER),
      };
    } catch {
      setFallback(true);
      return undefined;
    }

    const blitBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, blitBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(target, clear = false) {
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    let dye;
    let velocity;
    let divergence;
    let curl;
    let pressure;
    let pressureIterations = 20;
    let lastW = 0;
    let lastH = 0;
    let simWidth = 0;
    let simHeight = 0;
    let dyeWidth = 0;
    let dyeHeight = 0;

    const config = {
      // Low dissipation keeps a long-lived dense mass instead of fading fog
      densityDissipation: reducedMotion ? 0.04 : 0.1,
      velocityDissipation: reducedMotion ? 0.18 : 0.28,
      pressure: 0.8,
      // Lower curl → slower, calmer swirls (was 14)
      curl: reducedMotion ? 4 : 7,
      splatRadius: 0.42,
      // Gentler pour through the funnel (was 1760)
      splatForce: reducedMotion ? 560 : 1250,
      dyeSplatBoost: 1.35,
    };

    function getSimResolution(box, res) {
      let aspect = box.width / Math.max(box.height, 1);
      if (aspect < 1) aspect = 1 / aspect;
      const min = Math.round(res);
      const max = Math.round(res * aspect);
      if (box.width > box.height) return { width: max, height: min };
      return { width: min, height: max };
    }

    function initFramebuffers(cssW, cssH) {
      const res = getResolutions(cssW);
      pressureIterations = res.pressure;
      const simRes = getSimResolution({ width: cssW, height: cssH }, res.sim);
      const dyeRes = getSimResolution({ width: cssW, height: cssH }, res.dye);
      simWidth = simRes.width;
      simHeight = simRes.height;
      dyeWidth = dyeRes.width;
      dyeHeight = dyeRes.height;

      const texType = halfFloatTexType;
      const rgba = formatRGBA;
      const rg = formatRG;
      const r = formatR;
      const filter = filtering;

      if (!dye) {
        dye = createDoubleFBO(gl, dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filter);
      } else if (dye.width !== dyeWidth || dye.height !== dyeHeight) {
        destroyDouble(dye);
        dye = createDoubleFBO(gl, dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filter);
      }

      if (!velocity) {
        velocity = createDoubleFBO(gl, simWidth, simHeight, rg.internalFormat, rg.format, texType, filter);
      } else if (velocity.width !== simWidth || velocity.height !== simHeight) {
        destroyDouble(velocity);
        velocity = createDoubleFBO(gl, simWidth, simHeight, rg.internalFormat, rg.format, texType, filter);
      }

      if (divergence) destroyFBO(divergence);
      if (curl) destroyFBO(curl);
      if (pressure) destroyDouble(pressure);

      divergence = createFBO(gl, simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(gl, simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(gl, simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function destroyFBO(f) {
      if (!f) return;
      gl.deleteTexture(f.texture);
      gl.deleteFramebuffer(f.fbo);
    }

    function destroyDouble(d) {
      if (!d) return;
      destroyFBO(d.read);
      destroyFBO(d.write);
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      if (cssW !== lastW || cssH !== lastH || !dye) {
        lastW = cssW;
        lastH = cssH;
        initFramebuffers(cssW, cssH);
      }
    }

    function splat(x, y, dx, dy, color) {
      const aspect = canvas.width / Math.max(canvas.height, 1);

      gl.useProgram(programs.splat.program);
      gl.uniform1i(programs.splat.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(programs.splat.uniforms.aspectRatio, aspect);
      gl.uniform2f(programs.splat.uniforms.point, x, y);
      gl.uniform3f(programs.splat.uniforms.color, dx, dy, 0);
      gl.uniform1f(programs.splat.uniforms.radius, correctRadius(config.splatRadius / 100.0));
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(programs.splat.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(programs.splat.uniforms.color, color.r, color.g, color.b);
      // Dye splat larger than velocity — soft dissolving ink body
      gl.uniform1f(
        programs.splat.uniforms.radius,
        correctRadius((config.splatRadius * 2.1) / 100.0)
      );
      blit(dye.write);
      dye.swap();
    }

    function correctRadius(radius) {
      const aspect = canvas.width / Math.max(canvas.height, 1);
      if (aspect > 1) return radius * aspect;
      return radius;
    }

    function multipleSplats(amount) {
      // Seed a tall column spanning the full height (top → bottom) so the
      // stream reads as flowing through the entire screen from frame one.
      // Follow the requested pigment order: red, black, red, red, ...
      const seedSeq = ["red", "black", "red", "red"];
      for (let i = 0; i < amount; i += 1) {
        const t = i / Math.max(amount - 1, 1);
        const type = seedSeq[i % seedSeq.length];
        const color = inkColor(0.7 + Math.random() * 0.45, type);
        const x = 0.58 + Math.random() * 0.12 + Math.sin(t * 6.0) * 0.03;
        // y from ~0.95 (top) down to ~0.1 (bottom)
        const y = 0.95 - t * 0.85 + (Math.random() - 0.5) * 0.05;
        const dx = (Math.random() - 0.4) * 16;
        const dy = -16 - Math.random() * 30;
        splat(x, y, dx, dy, color);
      }
      // Extra dense core near the top source
      for (let i = 0; i < 4; i += 1) {
        splat(
          0.6 + Math.random() * 0.06,
          0.9 - Math.random() * 0.1,
          (Math.random() - 0.5) * 12,
          -28 - Math.random() * 24,
          inkColor(1.0, i % 2 === 0 ? "red" : "black")
        );
      }
    }

    /**
     * Two distinct pigments injected in alternating steps:
     *  - "red"   → r channel (glowing crimson body)
     *  - "black" → b channel (heavy soot, darkens, never glows)
     * Keeping them in separate channels preserves contrast instead of
     * saturating into one uniform red blob over time.
     */
    function inkColor(intensity = 1, type = "red") {
      if (type === "black") {
        return {
          r: (0.015 + Math.random() * 0.025) * intensity,
          g: 0,
          b: (0.42 + Math.random() * 0.34) * intensity,
        };
      }
      // Rare hotter red accent
      const hot = Math.random() > 0.84;
      if (hot) {
        return {
          r: (0.5 + Math.random() * 0.4) * intensity,
          g: (0.07 + Math.random() * 0.1) * intensity,
          b: (0.005 + Math.random() * 0.01) * intensity,
        };
      }
      return {
        r: (0.26 + Math.random() * 0.32) * intensity,
        g: (0.015 + Math.random() * 0.035) * intensity,
        b: (0.004 + Math.random() * 0.008) * intensity,
      };
    }

    function step(dt) {
      gl.disable(gl.BLEND);

      gl.useProgram(programs.curl.program);
      gl.uniform2f(programs.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.curl.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      gl.useProgram(programs.vorticity.program);
      gl.uniform2f(programs.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.vorticity.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(programs.vorticity.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(programs.vorticity.uniforms.curl, config.curl);
      gl.uniform1f(programs.vorticity.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(programs.divergence.program);
      gl.uniform2f(programs.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.divergence.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      gl.useProgram(programs.clear.program);
      gl.uniform1i(programs.clear.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(programs.clear.uniforms.value, config.pressure);
      blit(pressure.write);
      pressure.swap();

      gl.useProgram(programs.pressure.program);
      gl.uniform2f(programs.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.pressure.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < pressureIterations; i += 1) {
        gl.uniform1i(programs.pressure.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gl.useProgram(programs.gradientSubtract.program);
      gl.uniform2f(
        programs.gradientSubtract.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
      gl.uniform1i(programs.gradientSubtract.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(programs.gradientSubtract.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(programs.advection.program);
      gl.uniform2f(programs.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform2f(
        programs.advection.uniforms.dyeTexelSize,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
      const velocityId = velocity.read.attach(0);
      gl.uniform1i(programs.advection.uniforms.uVelocity, velocityId);
      gl.uniform1i(programs.advection.uniforms.uSource, velocityId);
      gl.uniform1f(programs.advection.uniforms.dt, dt);
      gl.uniform1f(programs.advection.uniforms.dissipation, config.velocityDissipation);
      blit(velocity.write);
      velocity.swap();

      gl.uniform2f(programs.advection.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(programs.advection.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(programs.advection.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(programs.advection.uniforms.dissipation, config.densityDissipation);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.BLEND);
      gl.useProgram(programs.display.program);
      gl.uniform1i(programs.display.uniforms.uTexture, dye.read.attach(0));
      gl.uniform2f(
        programs.display.uniforms.uResolution,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight
      );
      // Texel size of the dye texture → used to build surface normals (3D relief)
      gl.uniform2f(programs.display.uniforms.uTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1f(programs.display.uniforms.uTime, performance.now() * 0.001);
      blit(null);
    }

    // Pointer / auto-emitter state
    const pointer = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      moved: false,
      down: false,
      color: inkColor(0.35, "red"),
    };

    /**
     * Stepwise (pulsed) emitter.
     * Instead of one endless pour, ink is injected in discrete steps that
     * alternate between RED and BLACK pigment, separated by short pauses.
     * This keeps permanent contrast inside the mass — it never degrades
     * into a single uniform red stain.
     */
    // Source sits ABOVE the visible top so the stream falls through the
    // whole screen (y=1 is top, y=0 is bottom in sim UV space).
    const EMITTER_Y = 1.06;
    // Injection order requested: 1 red, 1 black, 2 red → repeat.
    const PULSE_SEQUENCE = ["red", "black", "red", "red"];

    const emitter = {
      x: 0.62,
      y: EMITTER_Y,
      targetX: 0.62,
      targetY: EMITTER_Y,
      phase: Math.random() * Math.PI * 2,
      burstT: 0,
      // pulse state machine
      type: "red",
      seqIndex: 0,
      pulseT: 0,
      pulseDur: 0,
      gapT: 0,
      active: false,
    };

    function nextPulse() {
      // Deterministic cycle: red → black → red → red → ...
      emitter.type = PULSE_SEQUENCE[emitter.seqIndex % PULSE_SEQUENCE.length];
      emitter.seqIndex += 1;
      // Longer, calmer steps + longer pauses → slower, distinct clubs
      emitter.pulseDur = 0.7 + Math.random() * 1.1;
      emitter.pulseT = emitter.pulseDur;
      emitter.gapT = 0.4 + Math.random() * 0.7;
      emitter.active = true;
      // Shift entry point slightly per step so clubs do not stack identically
      emitter.phase += 0.6 + Math.random() * 1.2;
    }

    function updateEmitter(dt, time) {
      emitter.phase += dt * (reducedMotion ? 0.1 : 0.2);
      // Slow horizontal drift of the source, kept above the visible top edge
      emitter.targetX =
        0.62 + Math.sin(time * 0.07 + emitter.phase) * 0.05 + Math.sin(time * 0.043) * 0.025;
      emitter.targetY =
        EMITTER_Y + Math.cos(time * 0.05 + emitter.phase * 0.7) * 0.03;
      emitter.x += (emitter.targetX - emitter.x) * Math.min(1, dt * 0.8);
      emitter.y += (emitter.targetY - emitter.y) * Math.min(1, dt * 0.8);

      if (reducedMotion) {
        emitter.burstT -= dt;
        if (emitter.burstT <= 0) {
          emitter.burstT = 3.2 + Math.random() * 2.8;
          nextPulse();
          splat(emitter.x, emitter.y, 1.2, -12, inkColor(0.4, emitter.type));
        }
        return;
      }

      // Advance pulse / gap timers
      if (emitter.active) {
        emitter.pulseT -= dt;
        if (emitter.pulseT <= 0) emitter.active = false;
      } else {
        emitter.gapT -= dt;
        if (emitter.gapT <= 0) nextPulse();
      }

      // Gentler pour through the "funnel" — swirls must stay slow
      const forceScale = config.splatForce * 0.00042;
      const dx =
        (Math.sin(time * 0.28 + emitter.phase) * 9 + Math.sin(time * 0.64) * 4) * forceScale * 24;

      if (emitter.active) {
        // Envelope: soft start, dense middle, soft release → club shape
        const k = 1 - emitter.pulseT / Math.max(emitter.pulseDur, 0.0001);
        const envelope = Math.sin(Math.min(Math.max(k, 0), 1) * Math.PI);
        const pour = 0.3 + envelope * 0.75;
        // Downward drop through the whole screen, but slow
        const dy = (-34 - pour * 18 - Math.sin(time * 0.2) * 6) * forceScale * 24;

        // Black pigment is "heavier" → slightly stronger downward impulse
        const heavy = emitter.type === "black" ? 1.15 : 1.0;

        if (Math.random() < 0.7) {
          const c = inkColor((0.78 + pour * 0.6) * config.dyeSplatBoost, emitter.type);
          splat(
            emitter.x + (Math.random() - 0.5) * 0.045,
            emitter.y + (Math.random() - 0.5) * 0.03,
            dx * (0.6 + Math.random() * 0.5),
            dy * heavy * (0.85 + Math.random() * 0.3),
            c
          );
        }

        // Side clubs share the pigment of the current step
        emitter.burstT -= dt;
        if (emitter.burstT <= 0) {
          emitter.burstT = 0.9 + Math.random() * 1.8;
          const side = Math.random() > 0.5 ? 1 : -1;
          splat(
            emitter.x + side * (0.03 + Math.random() * 0.06),
            emitter.y - 0.02 - Math.random() * 0.08,
            side * (10 + Math.random() * 22) * forceScale * 20,
            (-18 - Math.random() * 30) * forceScale * 20,
            inkColor(1.0 * config.dyeSplatBoost, emitter.type)
          );
        }
      }

      // Occasional mid-column feed — uses the opposite pigment so the long
      // vertical stream keeps visible red/black separation top to bottom.
      if (Math.random() < 0.05) {
        const deepType = emitter.type === "red" ? "black" : "red";
        splat(
          0.56 + Math.random() * 0.14,
          0.45 + Math.random() * 0.35,
          (Math.random() - 0.5) * 10,
          -5 - Math.random() * 13,
          inkColor(0.6 * config.dyeSplatBoost, deepType)
        );
      }
    }

    function applyPointerInput() {
      if (!pointer.moved) return;
      pointer.moved = false;
      if (isTouch) return;
      const strength = 0.35;
      splat(
        pointer.x,
        pointer.y,
        pointer.dx * config.splatForce * 0.00008 * strength,
        pointer.dy * config.splatForce * 0.00008 * strength,
        // Neutral dark pigment — mouse must not tint the mass red
        { r: 0.012, g: 0.0, b: 0.05 }
      );
    }

    function onPointerMove(e) {
      if (isTouch) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
      pointer.dx = (x - pointer.x) * 80;
      pointer.dy = (y - pointer.y) * 80;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = Math.abs(pointer.dx) + Math.abs(pointer.dy) > 0.15;
    }

    let raf = 0;
    let running = true;
    let lastTime = performance.now();
    let bootstrapped = false;

    function frame(now) {
      if (!running) return;
      const dtRaw = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      // Slow cinematic pace — multi-second evolution, not boiling motion
      // Overall fluid movement halved (was 0.08 / 0.336)
      const dt = reducedMotion ? dtRaw * 0.04 : dtRaw * 0.168;
      const time = now * 0.001;

      resizeCanvas();
      if (!bootstrapped && dye) {
        multipleSplats(12);
        bootstrapped = true;
      }

      updateEmitter(dt, time);
      applyPointerInput();
      if (!reducedMotion || Math.random() < 0.35) {
        step(dt);
      }
      render();
      raf = requestAnimationFrame(frame);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onPointerMove);

      destroyDouble(dye);
      destroyDouble(velocity);
      destroyDouble(pressure);
      destroyFBO(divergence);
      destroyFBO(curl);

      Object.values(programs).forEach((p) => {
        if (p.vs) gl.deleteShader(p.vs);
        if (p.fs) gl.deleteShader(p.fs);
        if (p.program) gl.deleteProgram(p.program);
      });
      gl.deleteBuffer(blitBuffer);
      gl.deleteBuffer(indexBuffer);
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    };
  }, []);

  if (fallback) {
    return <div className="gamedev-fluid gamedev-fluid--fallback" aria-hidden="true" />;
  }

  return (
    <div className="gamedev-fluid" aria-hidden="true">
      <canvas ref={canvasRef} className="gamedev-fluid__canvas" />
    </div>
  );
}
