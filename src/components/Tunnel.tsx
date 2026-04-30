import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pathShaderChunk } from '../utils/pathEngine';

interface TunnelProps {
  speed: number;
  warpActive: boolean;
}

export default function Tunnel({ speed, warpActive }: TunnelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Custom vertex and fragment shaders for the tunnel
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistance: { value: 0 },
      uSpeed: { value: speed },
      uColor1: { value: new THREE.Color('#4d94ff') }, // Stellar Blue
      uColor2: { value: new THREE.Color('#9933ff') }, // Deep Space Purple
      uBgColor: { value: new THREE.Color('#000000') }, // Black Background
      uWarp: { value: 0 },
    }),
    []
  );

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uWarp;
    
    ${pathShaderChunk}

    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      
      float cameraLocalY = 45.0; 
      vec2 offset = getPath(pos.y) - getPath(cameraLocalY);
      
      pos.x += offset.x;
      pos.z += offset.y;

      // Warp effect: stretch the tunnel forward
      pos.z += sin(pos.y * 0.05) * uWarp * 10.0;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uSpeed;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uBgColor;
    uniform float uWarp;

    // Helper functions for noise
    float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    // 2D Noise based on Morgan McGuire @morgan3d
    float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // Smooth Interpolation
      vec2 u = smoothstep(0.,1.,f);

      // Mix 4 coorners percentages
      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
    }

    void main() {
      // Simulate moving forward by shifting UVs over time
      vec2 uv = vUv;
      uv.y -= uTime * 0.2; // Move texture forward
      
      // Create a grid/tech pattern
      vec2 repeatedUv = uv * vec2(10.0, 30.0);
      vec2 grid = abs(fract(repeatedUv) - 0.5) * 2.0;

      // grid is 0.0 at center, 1.0 at edges
      // Create lines by checking distance to edge
      float line = max(grid.x, grid.y);
      float techLine = smoothstep(0.96, 0.99, line);
      
      // Add noise to break up the grid
      float n = noise(uv * vec2(4.0, 15.0) + vec2(0.0, uTime * 0.5));
      techLine *= smoothstep(0.1, 0.8, n);

      // Neon glowing edges (sharper falloff)
      float glow = exp(-(1.0 - line) * 40.0) * 0.4;

      // Add energy rings that pulse down the tunnel
      float ring = smoothstep(0.98, 1.0, sin(uv.y * 20.0 + uTime * 5.0));
      glow += ring * 0.3 * n;

      // Mix line colors based on depth and noise
      vec3 lineColor = mix(uColor1, uColor2, sin(uv.x * 3.14 + uTime) * 0.5 + 0.5);
      
      // Add warp flash to line color
      lineColor = mix(lineColor, vec3(1.0), uWarp * 0.5 * n);

      // Final blending: background is black, lines glow
      float lineIntensity = clamp((techLine + glow) * 1.5, 0.0, 1.0);
      vec3 finalColor = mix(uBgColor, lineColor, lineIntensity);
      
      // Add fog fading into black at distance
      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = smoothstep(10.0, 60.0, depth);
      finalColor = mix(finalColor, vec3(0.0), fogFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * speed;
      materialRef.current.uniforms.uDistance.value += delta * speed;
      materialRef.current.uniforms.uSpeed.value = speed;
      
      // Smoothly transition warp uniform
      const targetWarp = warpActive ? 1.0 : 0.0;
      materialRef.current.uniforms.uWarp.value += (targetWarp - materialRef.current.uniforms.uWarp.value) * delta * 5.0;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* 
        A cylinder that is very long. We view it from the inside.
        args: [radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded]
      */}
      <cylinderGeometry args={[5, 5, 100, 32, 64, true]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent={true}
      />
    </mesh>
  );
}
