import React, { useRef } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EffectsProps {
  speed: number;
  warpActive: boolean;
}

export default function Effects({ speed, warpActive }: EffectsProps) {
  const aberrationOffset = useRef(new THREE.Vector2(0.002, 0.002));
  const dofBokehScale = useRef(2.0);

  // Smoothly interpolate post-processing values
  useFrame((state, delta) => {
    const targetAberration = warpActive ? 0.01 : 0.002;
    const targetBokeh = warpActive ? 5.0 : 2.0;

    // Smoothly step towards targets
    const lerpRate = delta * 5.0;
    
    aberrationOffset.current.x += (targetAberration - aberrationOffset.current.x) * lerpRate;
    aberrationOffset.current.y += (targetAberration - aberrationOffset.current.y) * lerpRate;
  });

  return (
    <EffectComposer multisampling={4}>
      <Bloom 
        luminanceThreshold={0.5} 
        luminanceSmoothing={0.9} 
        intensity={warpActive ? 3.0 : 1.5} 
        mipmapBlur 
      />
      <ChromaticAberration 
        blendFunction={BlendFunction.NORMAL} 
        offset={aberrationOffset.current} 
      />
      <DepthOfField 
        focusDistance={0.01} 
        focalLength={0.02} 
        bokehScale={warpActive ? 5 : 2} 
        height={480} 
      />
      <Noise premultiply opacity={0.03} />
    </EffectComposer>
  );
}
