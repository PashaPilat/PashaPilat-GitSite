// src/components/SmokeEffect.jsx
import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "../styles/components/SmokeEffect.scss";

const vertexShader = ` void main() {  gl_Position = vec4(position, 1.0); }`;
const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec4 u_color1;
  uniform vec4 u_color2;
  uniform float u_distortion;
  uniform float u_swirl;
  uniform float u_swirlIterations;
  uniform float u_scale;

  #define TWO_PI 6.28318530718

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float t = u_time * 0.1;

    uv *= u_scale * u_resolution;

    float n1 = noise(uv + t);
    float angle = n1 * TWO_PI;
    uv.x += u_distortion * cos(angle);
    uv.y += u_distortion * sin(angle);

    for (float i = 1.0; i <= u_swirlIterations; i++) {
      uv.x += u_swirl / i * cos(t + i * uv.y);
      uv.y += u_swirl / i * sin(t + i * uv.x);
    }

    // --- многослойный шум (fbm) ---
    float large = noise(uv * 0.6);
    float detail = noise(uv * 3.5 + t);
    float mixer = large * 0.8 + detail * 0.2;

    // --- маска дыма ---
    float smoke = pow(smoothstep(0.60, 0.95, mixer), 2.2);

    // --- цвет дыма ---
    vec3 c = mix(u_color1.rgb, u_color2.rgb, smoke);

    // --- прозрачность ---
    float alpha = smoke * 0.55;

    gl_FragColor = vec4(c, alpha);
  }
`;

function getCssColor(variableName) {
    const el = document.querySelector(".smoke-canvas");
    if (!el) return new THREE.Color("#fff"); // fallback белый
    const value = getComputedStyle(el).getPropertyValue(variableName).trim();
    return new THREE.Color(value || "#fff");
}

function SmokePlane() {
    const materialRef = useRef();

   useEffect(() => {
        if (!materialRef.current) return;

        materialRef.current.uniforms.u_color1.value.set( ...getCssColor("--color1").toArray(),  1 );
        materialRef.current.uniforms.u_color2.value.set( ...getCssColor("--color2").toArray(),  1 );
    }, []);

    useFrame(({ clock, size }) => {
        if (!materialRef.current) return;

        materialRef.current.uniforms.u_time.value = clock.elapsedTime;
        materialRef.current.uniforms.u_resolution.value.set(  size.width, size.height );
    });

    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent={true}
                blending={THREE.NormalBlending} // обычное наложение
                depthWrite={false}
                uniforms={{
                    u_time: { value: 0 },
                    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                    u_color1: { value: new THREE.Vector4(...getCssColor("--color1").toArray(), 1) },
                    u_color2: { value: new THREE.Vector4(...getCssColor("--color2").toArray(), 1) },
                    u_distortion: { value: 0.5 },
                    u_swirl: { value: 0.8 },
                    u_swirlIterations: { value: 10 },
                    u_scale: { value: 0.002 },
                }}
            />
        </mesh>
    );
}

export default function SmokeEffect() {
    return (
        <Canvas
            className="smoke-canvas"
            orthographic
            camera={{ position: [0, 0, 1], zoom: 1 }}
            style={{
                position: "fixed",
                top: 0,
                right: 0,        // ← было отсутствовало
                bottom: 0,       // ← было отсутствовало
                left: 0,
                zIndex: 0,
                background: "black", // фон чёрный
            }}
        >
            <SmokePlane />
        </Canvas>
    );
}
