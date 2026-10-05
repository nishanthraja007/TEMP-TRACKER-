import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { EventTrack } from '../types';

interface GlobeProps {
  tracks?: EventTrack[];
}

// Convert lat/lon on spherical earth (radius R) to 3D Cartesian coordinates
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function EarthSphere() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base Globe */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#060913"
          roughness={0.7}
          metalness={0.2}
          wireframe={false}
        />
      </Sphere>

      {/* Atmospheric Glow Shell */}
      <Sphere args={[2.08, 32, 32]}>
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Coordinate Lat/Lon Wireframe Grid */}
      <Sphere args={[2.01, 24, 24]}>
        <meshBasicMaterial
          color="#22d3ee"
          wireframe
          transparent
          opacity={0.08}
        />
      </Sphere>
    </group>
  );
}

function TrackArcs({ tracks }: { tracks: EventTrack[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  // Build curved splines for each track path
  const arcCurves = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];
    return tracks.map((trk) => {
      const pts = trk.path.map(([lon, lat]) => latLonToVector3(lat, lon, 2.04));
      if (pts.length < 2) return null;
      const curve = new THREE.CatmullRomCurve3(pts);
      const points = curve.getPoints(30);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const color = trk.type === 'heatwave' ? '#ff5a36' : trk.type === 'rainfall' ? '#3b82f6' : '#a78bfa';
      return { geometry, color, head: pts[pts.length - 1], id: trk.id };
    }).filter(Boolean);
  }, [tracks]);

  return (
    <group ref={groupRef}>
      {arcCurves.map((arc, i) => (
        <group key={arc?.id || i}>
          {arc && (
            <>
              {/* @ts-ignore */}
              <line geometry={arc.geometry}>
                <lineBasicMaterial color={arc.color} transparent opacity={0.85} linewidth={2} />
              </line>
              {/* Hotspot centroid sphere */}
              <mesh position={arc.head}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color={arc.color} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

export default function Globe({ tracks = [] }: GlobeProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 1.5, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#22d3ee" />

        <EarthSphere />
        <TrackArcs tracks={tracks} />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3.0}
          maxDistance={7.0}
          autoRotate={false}
        />
      </Canvas>
      <div className="absolute bottom-3 left-4 text-[10px] font-mono text-[#8a8a93] pointer-events-none">
        Interactive 3D South Asia Anomaly Sphere • Drag to rotate
      </div>
    </div>
  );
}
