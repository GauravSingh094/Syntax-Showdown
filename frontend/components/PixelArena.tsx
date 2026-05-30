"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function InfiniteGrid() {
  const meshRef = useRef<THREE.GridHelper>(null!);
  
  useFrame((state) => {
    // Infinite scrolling effect
    meshRef.current.position.z = (state.clock.elapsedTime * 2) % 2;
  });

  return (
    <gridHelper 
      ref={meshRef}
      args={[100, 50, "#4f46e5", "#111"]} 
      rotation={[Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
    />
  );
}

function VoxelGroup() {
  const groupRef = useRef<THREE.Group>(null!);
  
  const voxels = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20 - 5
      ] as [number, number, number],
      color: ["#6366f1", "#06b6d4", "#a855f7", "#ffffff"][Math.floor(Math.random() * 4)],
      scale: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.01 + 0.005
    }));
  }, []);

  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    
    // Pulse effect
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      mesh.rotation.x += 0.01;
      mesh.scale.setScalar((Math.sin(state.clock.elapsedTime + i) * 0.1 + 1) * voxels[i].scale);
    });
  });

  return (
    <group ref={groupRef}>
      {voxels.map((v, i) => (
        <mesh key={i} position={v.position}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={v.color} 
            emissive={v.color} 
            emissiveIntensity={0.5} 
            roughness={0} 
            metalness={1} 
          />
        </mesh>
      ))}
    </group>
  );
}

export default function PixelArena() {
  return (
    <div className="absolute inset-0 -z-10 bg-[#000] overflow-hidden">
      <Canvas camera={{ position: [0, 2, 10], fov: 60 }}>
        <fog attach="fog" args={["#000", 5, 25]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#6366f1" />
        <pointLight position={[-10, -10, 5]} intensity={1.5} color="#06b6d4" />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={2} decay={2} distance={30} />
        
        <VoxelGroup />
        <InfiniteGrid />
        
        {/* Glow Sphere */}
        <mesh position={[0, 0, -15]}>
          <sphereGeometry args={[10, 32, 32]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.2} transparent opacity={0.1} />
        </mesh>
      </Canvas>
      
      {/* Post Processing Simulation (CSS Gradients) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000]/0 via-[#000]/20 to-[#000]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
    </div>
  );
}
