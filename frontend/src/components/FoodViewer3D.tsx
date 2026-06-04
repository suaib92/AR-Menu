'use client';

import { useRef } from 'react';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Environment, Center, SoftShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

interface FoodViewer3DProps {
  imageSrc: string;
}

function FoodPlate({ imageSrc }: { imageSrc: string }) {
  // Load the food image as a texture
  const texture = useTexture(imageSrc);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  // A simple plate geometry
  return (
    <group>
      {/* The Food/Plate surface */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* A wide, slightly thick cylinder to represent a plate/pedestal */}
        <cylinderGeometry args={[2, 2.1, 0.2, 64]} />
        <meshStandardMaterial 
          map={texture} 
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
      
      {/* Plate rim / base underneath to give it depth */}
      <mesh castShadow receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.2, 1.8, 0.3, 64]} />
        <meshStandardMaterial color="#f8f9fa" metalness={0.2} roughness={0.1} />
      </mesh>

      {/* Shadow catcher plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function FoodViewer3D({ imageSrc }: FoodViewer3DProps) {
  if (!imageSrc || imageSrc.startsWith('http') === false && !imageSrc.startsWith('/')) {
     return <div className="text-[10rem]">{imageSrc || '🍽️'}</div>;
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
      <Canvas shadows camera={{ position: [0, 4, 5], fov: 45 }}>
        <SoftShadows size={10} samples={16} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow 
          position={[5, 5, 5]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 2, -5]} intensity={0.5} color="#8b5cf6" />
        
        <Environment preset="studio" />
        
        <Center>
          <Suspense fallback={<Html center><div className="text-white font-bold animate-pulse whitespace-nowrap">Loading 3D View...</div></Html>}>
            <FoodPlate imageSrc={imageSrc} />
          </Suspense>
        </Center>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2 + 0.1} // Don't let them go too far underneath
          autoRotate={true}
          autoRotateSpeed={1.0}
        />
      </Canvas>
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-medium text-white/80 tracking-wide flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
           Drag to rotate • Pinch to zoom
        </div>
      </div>
    </div>
  );
}
