'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Environment, ContactShadows, Html, PresentationControls, Float } from '@react-three/drei';
import * as THREE from 'three';

interface FoodViewer3DProps {
  imageSrc: string;
}

function FoodSlab({ imageSrc }: { imageSrc: string }) {
  const texture = useTexture(imageSrc);
  
  // Basic setup without forcing mipmap filters that degrade non-power-of-two images
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  
  // Calculate aspect ratio dynamically based on the actual uploaded photo!
  // texture.image is typed as 'unknown' in some Three.js versions, so we cast it to any
  const img = texture.image as any;
  const imageAspect = img.width / img.height;
  
  // Base height is roughly 4.8 units
  let height = 4.8;
  let width = height * imageAspect;

  // If the image is landscape and becomes too wide for the phone screen, 
  // scale it down so it fits perfectly horizontally.
  const MAX_WIDTH = 4.2;
  if (width > MAX_WIDTH) {
    width = MAX_WIDTH;
    height = width / imageAspect;
  }

  return (
    <group>
      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.2}>
        {/* Main image plane (front) */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} side={THREE.FrontSide} />
        </mesh>

        {/* Sleek backing card to give it substance without weird box UV stretching */}
        <mesh position={[0, 0, 0]} castShadow>
          <planeGeometry args={[width + 0.1, height + 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} side={THREE.DoubleSide} />
        </mesh>
      </Float>
    </group>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Html>
  );
}

export default function FoodViewer3D({ imageSrc }: FoodViewer3DProps) {
  if (!imageSrc) {
    return <div className="text-[10rem] flex items-center justify-center h-full">🍽️</div>;
  }

  return (
    // Changed from h-[60vh] relative to absolute inset-0 to fill the ENTIRE screen behind the menu card
    <div className="absolute inset-0 bg-[#000000] cursor-grab active:cursor-grabbing">
      {/* Moved camera down (y: -0.8) so the food shifts UP on the screen, avoiding the bottom card */}
      <Canvas dpr={[1, 2]} camera={{ position: [0, -0.8, 6.5], fov: 45 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[2, 5, 2]} intensity={0.5} />
        <Environment preset="city" />

        <Suspense fallback={<Loader />}>
          <FoodSlab imageSrc={imageSrc} />
          
          <ContactShadows 
            position={[0, -3.2, 0]} 
            opacity={0.5} 
            scale={10} 
            blur={2} 
            far={4} 
            color="#000000"
          />
        </Suspense>

        {/* Robust, constrained camera controls that handle mobile touch perfectly */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={4} 
          maxDistance={9}
          minPolarAngle={Math.PI / 2 - 0.2} // Limit up/down tilt
          maxPolarAngle={Math.PI / 2 + 0.2}
          minAzimuthAngle={-0.5} // Limit left/right spin
          maxAzimuthAngle={0.5}
          enableDamping={true} // Gives it that smooth, bouncy feel
          dampingFactor={0.05}
        />
      </Canvas>
      
      {/* Overlay hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 pointer-events-none">
        <p className="text-white/80 text-xs font-medium flex items-center gap-2">
          👆 Swipe to interact
        </p>
      </div>
    </div>
  );
}
