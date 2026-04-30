import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';

export default function App() {
  const [speed, setSpeed] = useState(1);
  const [warpActive, setWarpActive] = useState(false);

  // Handle scroll to change speed
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      setSpeed((prev) => {
        let newSpeed = prev + (e.deltaY < 0 ? 0.05 : -0.05);
        return Math.max(0.2, Math.min(newSpeed, 10));
      });
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = () => setWarpActive(true);
  const handlePointerUp = () => setWarpActive(false);

  return (
    <div
      className="w-full h-screen bg-black overflow-hidden relative"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ antialias: true, pixelRatio: window.devicePixelRatio }}>
          <Scene speed={warpActive ? speed * 5 : speed} warpActive={warpActive} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start text-white font-mono select-none">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase">
            Wormhole
          </h1>
          <p className="opacity-80 text-sm mt-1 text-blue-200">Scroll: Adjust Speed | Click & Hold: Warp</p>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-80 uppercase tracking-widest text-blue-200">Velocity</div>
          <div className="text-2xl font-bold text-white">
            {((warpActive ? speed * 5 : speed) * 100).toFixed(0)} <span className="text-sm">km/s</span>
          </div>
        </div>
      </div>
      
      {/* Warp overlay filter */}
      <div 
        className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-700 ease-out mix-blend-screen bg-indigo-900 ${warpActive ? 'opacity-30' : 'opacity-0'}`}
      />

      {/* Cyberpunk Vignette & Scanlines */}
      <div className="absolute inset-0 z-10 pointer-events-none grid-pattern opacity-10 mix-blend-overlay"></div>
      <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)]"></div>
    </div>
  );
}
