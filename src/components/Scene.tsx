import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Tunnel from './Tunnel';
import Particles from './Particles';
import Effects from './Effects';
import { getPathJS } from '../utils/pathEngine';

interface SceneProps {
  speed: number;
  warpActive: boolean;
}

export default function Scene({ speed, warpActive }: SceneProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const distance = useRef(0);

  // Camera sway and parallax based on pointer
  useFrame((state, delta) => {
    distance.current += delta * speed;

    // Subtle auto-sway
    const time = state.clock.getElapsedTime();
    const autoSwayX = Math.sin(time * 0.5) * 0.05;
    const autoSwayY = Math.cos(time * 0.3) * 0.05;

    // Calculate curve look-ahead
    const posCam = getPathJS(45, distance.current); // At Camera
    const posAhead = getPathJS(15, distance.current); // 30 units ahead of camera
    
    const dx = posAhead.x - posCam.x;
    const dz = posAhead.z - posCam.z; // Local Z direction
    const dyWorld = -dz; // Local Z matches World -Y
    
    // Look angles to face the curve
    const lookRight = dx / 30.0;
    const lookUp = dyWorld / 30.0;

    // Mouse parallax mixed with look ahead
    const { pointer } = state;
    targetRotation.current.x = (pointer.y * Math.PI) * 0.05 - lookUp * 0.6;
    targetRotation.current.y = (pointer.x * Math.PI) * 0.05 + lookRight * 0.6;

    // Smooth camera group rotation
    if (groupRef.current) {
      groupRef.current.rotation.x += (targetRotation.current.x + autoSwayX - groupRef.current.rotation.x) * 4 * delta;
      groupRef.current.rotation.y += (-targetRotation.current.y + autoSwayY - groupRef.current.rotation.y) * 4 * delta;
    }
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 10, 60]} />

      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 0, 5]} intensity={0.5} />

      <group ref={groupRef}>
        <group position={[0, 0, -40]} rotation={[Math.PI / 2, 0, 0]}>
          <Tunnel speed={speed} warpActive={warpActive} />
          <Particles speed={speed} warpActive={warpActive} />
        </group>
      </group>

      <Effects warpActive={warpActive} speed={speed} />
    </>
  );
}
