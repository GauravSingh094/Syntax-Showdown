"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function VoxelCube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.1} metalness={0.5} />
    </mesh>
  );
}

export default function PixelArena() {
  return (
    <div className="absolute inset-0 -z-10 bg-black overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        
        <VoxelCube position={[2, 1, -2]} color="#6366f1" />
        <VoxelCube position={[-2, -1, -3]} color="#06b6d4" />
        <VoxelCube position={[0, -2, -4]} color="#a855f7" />
        
        <gridHelper args={[20, 20, "#111", "#222"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80" />
    </div>
  );
}
