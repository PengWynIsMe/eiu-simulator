import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { Matrix4 } from 'three';
import { canteenDepth, canteenLayout, canteenWidth, tableCenters } from './layouts/canteen';

const signs = [
  { vi: 'Giải khát', en: 'Drinks', color: '#3e9b6d' },
  { vi: 'Món cơm', en: 'Rice dishes', color: '#d5a52f' },
  { vi: 'Món nước', en: 'Noodles', color: '#3884b5' },
  { vi: 'Món ăn', en: 'Food', color: '#e2833e' },
  { vi: 'Thu ngân', en: 'Cashier', color: '#459b79' },
];
type Box = [number, number, number, number, number, number];

function BoxBatch({ boxes, color, emissive = false, metalness = 0 }: { boxes: Box[]; color: string; emissive?: boolean; metalness?: number }) {
  const matrices = useMemo(() => boxes.map(([x, y, z, w, h, d]) =>
    new Matrix4().makeScale(w, h, d).setPosition(x, y, z)), [boxes]);
  return <instancedMesh args={[undefined, undefined, matrices.length]} frustumCulled={false}
    onUpdate={mesh => { matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix)); mesh.instanceMatrix.needsUpdate = true; }}>
    <boxGeometry />
    <meshStandardMaterial color={color} roughness={0.6} metalness={metalness} emissive={emissive ? color : '#000000'} emissiveIntensity={emissive ? 0.55 : 0} />
  </instancedMesh>;
}

const steel: Box[] = [
  ...Array.from({ length: 9 }, (_, i): Box => [4 + i * (canteenWidth - 8) / 8, 5, canteenDepth / 2, 0.24, 0.32, canteenDepth]),
  ...[7, 17, 27].map((v): Box => [canteenWidth / 2, 4.85, v, canteenWidth, 0.2, 0.2]),
  ...[0.12, canteenWidth - 0.12].flatMap(u => Array.from({ length: 7 }, (_, i): Box => [u, 1.9, i * canteenDepth / 6, 0.14, 3.8, 0.14])),
];
const lights: Box[] = [7, 15, 23, 31, 39, 47, 55].flatMap(u =>
  [8, 15, 22, 29].map((v): Box => [u, 4.72, v, 2.5, 0.08, 0.18]));
const tops: Box[] = tableCenters.map(([u, v]) => [u, 0.76, v, 2.3, 0.12, 1.3]);
const backdropTrunks: Box[] = [-8, canteenWidth + 8].flatMap(u => [5, 15, 25, 35].map((v): Box => [u, 1.4, v, 0.45, 2.8, 0.45]));
const backdropCrowns: Box[] = [-8, canteenWidth + 8].flatMap(u => [5, 15, 25, 35].map((v): Box => [u, 3.5, v, 3.2, 2.8, 3.2]));
const chairs: Box[] = tableCenters.flatMap(([u, v]) => [
  [u - 0.85, 0.38, v, 0.12, 0.76, 0.9], [u + 0.85, 0.38, v, 0.12, 0.76, 0.9],
  ...[-1, 1].flatMap(side => [-0.6, 0.6].flatMap(du => [
    [u + du, 0.45, v + side * 0.95, 0.48, 0.12, 0.48],
    [u + du, 0.75, v + side * 1.15, 0.48, 0.6, 0.1],
  ])),
] as Box[]);

export default function CanteenFurniture({ showRoof }: { showRoof: boolean }) {
  return (
    <group position={[canteenLayout.origin[0], 0, canteenLayout.origin[1]]} rotation-y={canteenLayout.rotationY}>
      {[-8, canteenWidth + 8].map(u => <group key={u}>
        <mesh position={[u, -0.2, canteenDepth / 2]}><boxGeometry args={[15, 0.3, canteenDepth + 12]} /><meshStandardMaterial color="#9ec08d" roughness={0.9} /></mesh>
      </group>)}
      <BoxBatch boxes={backdropTrunks} color="#786957" />
      <BoxBatch boxes={backdropCrowns} color="#50853b" />
      {showRoof && <>
        <mesh position={[canteenWidth / 2, 5.3, canteenDepth / 2]}><boxGeometry args={[canteenWidth, 0.18, canteenDepth]} /><meshStandardMaterial color="#aab7bb" roughness={0.8} /></mesh>
        <BoxBatch boxes={steel} color="#647582" metalness={0.35} />
        <BoxBatch boxes={lights} color="#fffdf0" emissive />
        {[9, 19, 29].map(v => <mesh key={v} position={[canteenWidth / 2, 5.19, v]}>
          <boxGeometry args={[canteenWidth - 2, 0.04, 2.2]} /><meshBasicMaterial color="#e6f2ed" />
        </mesh>)}
      </>}
      {signs.map((sign, i) => {
        const u = 7 + i * (canteenWidth - 14) / 4;
        return <group key={sign.en} position={[u, 0, 3]}>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[8.5, 1.1, 2.8]} /><meshStandardMaterial color="#e6e8e4" roughness={0.7} /></mesh>
          <mesh position={[0, 1.12, 0]}><boxGeometry args={[8.7, 0.12, 3]} /><meshStandardMaterial color="#d8dde3" roughness={0.3} metalness={0.35} /></mesh>
          <mesh position={[0, 1.52, -0.45]}><boxGeometry args={[5.5, 0.75, 0.8]} /><meshStandardMaterial color="#bae6fd" transparent opacity={0.4} depthWrite={false} roughness={0.1} metalness={0.2} /></mesh>
          <mesh position={[0, 3.05, 0]}><boxGeometry args={[7.5, 0.9, 0.15]} /><meshStandardMaterial color={sign.color} emissive={sign.color} emissiveIntensity={0.45} /></mesh>
          <Text position={[0, 3.05, 0.09]} fontSize={0.35} color="#ffffff" anchorX="center" anchorY="middle">{`${sign.vi} / ${sign.en}`}</Text>
          {i === 4 && <mesh position={[0, 1.35, 0.6]}><boxGeometry args={[0.6, 0.45, 0.2]} /><meshStandardMaterial color="#334155" /></mesh>}
        </group>;
      })}
      <BoxBatch boxes={tops} color="#66554a" />
      <BoxBatch boxes={chairs} color="#4b4b48" />
    </group>
  );
}
