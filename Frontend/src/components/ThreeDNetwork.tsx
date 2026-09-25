import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

// ─── Single Node with rotating wireframe + 3D label ──────────────────────
interface NodeProps {
  position: [number, number, number];
  color: string;
  label: string;
}

const Node = ({ position, color, label }: NodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Float the whole group up and down
    groupRef.current.position.y = position[1] + Math.sin(t * 0.7 + position[0]) * 0.18;
    // Spin the wireframe sphere itself
    meshRef.current.rotation.y += 0.01;
    meshRef.current.rotation.x += 0.005;
  });

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} />
      </mesh>

      {/* Wireframe sphere that spins */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>

      {/* 3D label — lives inside the canvas, rotates with the scene */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.16}
        color={color}
        anchorX="center"
        anchorY="top"
        letterSpacing={0.1}
        outlineWidth={0.01}
        outlineColor="#050B14"
      >
        {label}
      </Text>
    </group>
  );
};

// ─── Connection lines ────────────────────────────────────────────────────
const NODES = [
  { position: [0, 0, 0]      as [number, number, number], color: '#00F0FF', label: 'PLATFORMOPS' },
  { position: [-2, 1, -2]    as [number, number, number], color: '#7B2CBF', label: 'JENKINS' },
  { position: [2, 2, -1]     as [number, number, number], color: '#00BFFF', label: 'AMAZON ECR' },
  { position: [-3, -1, 1]    as [number, number, number], color: '#FFB800', label: 'DEV' },
  { position: [1, -2, 2]     as [number, number, number], color: '#00FFA3', label: 'STAGING' },
  { position: [3, 0, 1]      as [number, number, number], color: '#FF3366', label: 'PRODUCTION' },
  { position: [0, 3, -3]     as [number, number, number], color: '#00F0FF', label: 'KUBERNETES' },
];

const Connections = () => {
  const lines = useMemo(() => {
    const pairs: Array<{ points: [number, number, number][]; color: string }> = [];
    const idx = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,6],[2,5],[3,4]];
    idx.forEach(([i, j]) => {
      pairs.push({ points: [NODES[i].position, NODES[j].position], color: NODES[i].color });
    });
    return pairs;
  }, []);

  return (
    <>
      {lines.map((l, i) => (
        <Line key={i} points={l.points} color={l.color} opacity={0.15} transparent lineWidth={1} />
      ))}
    </>
  );
};

// ─── Scene ──────────────────────────────────────────────────────────────
const NetworkScene = () => (
  <>
    <ambientLight intensity={0.5} />
    <pointLight position={[5, 5, 5]} intensity={1.5} color="#00F0FF" />
    <pointLight position={[-5, -5, -5]} intensity={0.6} color="#7B2CBF" />

    {NODES.map((node, i) => (
      <Node key={i} {...node} />
    ))}
    <Connections />

    <OrbitControls
      enableZoom={false}
      autoRotate
      autoRotateSpeed={0.5}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 4}
      enablePan={false}
    />
  </>
);

// ─── Export ─────────────────────────────────────────────────────────────
export default function ThreeDNetwork() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 9], fov: 50 }} gl={{ antialias: true }}>
        <fog attach="fog" args={['#050B14', 6, 18]} />
        <NetworkScene />
      </Canvas>
    </div>
  );
}
