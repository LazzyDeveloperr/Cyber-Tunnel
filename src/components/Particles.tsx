import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pathShaderChunk } from '../utils/pathEngine';

interface ParticlesProps {
  speed: number;
  warpActive: boolean;
}

export default function Particles({ speed, warpActive }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const count = 2000;
  
  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Create particles within a cylinder volume
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 4.5; // Slightly less than tunnel radius
      const y = Math.random() * 100 - 50; // Use local Y for depth
      
      pos[i * 3 + 0] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      
      scl[i] = Math.random() * 2.0;
    }
    return [pos, scl];
  }, [count]);

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uDistance: { value: 0 },
      uSpeed: { value: speed },
      uWarp: { value: 0 },
      uColor: { value: new THREE.Color('#00ffff') }
    };
  }, []);

  const vertexShader = `
    attribute float aScale;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uWarp;
    
    ${pathShaderChunk}
    
    void main() {
      vPosition = position;
      vec3 pos = position;
      
      // Move particles towards camera (Local +Y)
      float yOffset = uTime * 20.0;
      pos.y += yOffset;
      
      // Wrap around logic
      pos.y = mod(pos.y + 50.0, 100.0) - 50.0;
      
      float cameraLocalY = 45.0; 
      vec2 offset = getPath(pos.y) - getPath(cameraLocalY);
      
      pos.x += offset.x;
      pos.z += offset.y;
      
      // Warp speed stretch
      float stretch = 1.0 + uWarp * 10.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Points size depends on scale and distance
      gl_PointSize = aScale * (100.0 / -mvPosition.z) * (1.0 + uWarp * 2.0);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uWarp;
    
    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if (ll > 0.5) discard;
      
      // Glow and fade
      float alpha = (0.5 - ll) * 2.0;
      
      // Mix color based on warp
      vec3 color = mix(uColor, vec3(1.0, 1.0, 1.0), uWarp);
      
      gl_FragColor = vec4(color, alpha * (0.3 + uWarp * 0.7));
    }
  `;

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value += delta * speed;
      material.uniforms.uDistance.value += delta * speed;
      material.uniforms.uSpeed.value = speed;
      
      const targetWarp = warpActive ? 1.0 : 0.0;
      material.uniforms.uWarp.value += (targetWarp - material.uniforms.uWarp.value) * delta * 5.0;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={scales.length}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
