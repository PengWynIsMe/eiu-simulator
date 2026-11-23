import { Instance, Instances, Text } from '@react-three/drei';
import { canteenDepth, canteenLayout, canteenWidth, tableCenters } from './layouts/canteen';

const signs = [
  { vi: 'Giải khát', en: 'Drinks' },
  { vi: 'Món cơm', en: 'Rice dishes' },
  { vi: 'Món nước', en: 'Noodles' },
  { vi: 'Món ăn', en: 'Food' },
  { vi: 'Thu ngân', en: 'Cashier' },
];

export default function CanteenFurniture({ showRoof }: { showRoof: boolean }) {
  return (
    <group position={[canteenLayout.origin[0], 0, canteenLayout.origin[1]]} rotation-y={canteenLayout.rotationY}>
      {showRoof && <>
        <mesh position={[canteenWidth / 2, 5.3, canteenDepth / 2]}><boxGeometry args={[canteenWidth, 0.18, canteenDepth]} /><meshStandardMaterial color="#85909d" roughness={0.8} /></mesh>
        <Instances limit={40}><boxGeometry /><meshStandardMaterial color="#334155" metalness={0.35} roughness={0.6} />
          {Array.from({ length: 9 }, (_, i) => <Instance key={i} position={[4 + i * (canteenWidth - 8) / 8, 5, canteenDepth / 2]} scale={[0.24, 0.32, canteenDepth]} />)}
          {[7, 17, 27].map(v => <Instance key={v} position={[canteenWidth / 2, 4.85, v]} scale={[canteenWidth, 0.2, 0.2]} />)}
        </Instances>
        <Instances limit={30}><boxGeometry /><meshStandardMaterial color="#fff7df" emissive="#fff2d1" emissiveIntensity={0.6} />
          {[10, 22, 34, 46, 58].flatMap(u => [10, 20, 30].map(v => <Instance key={`${u}-${v}`} position={[u, 4.72, v]} scale={[1.4, 0.08, 0.18]} />))}
        </Instances>
      </>}
      {signs.map((sign, i) => {
        const u = 7 + i * (canteenWidth - 14) / 4;
        return <group key={sign.en} position={[u, 0, 3]}>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[8.5, 1.1, 2.8]} /><meshStandardMaterial color={i === 4 ? '#403a36' : '#a08c78'} roughness={0.8} /></mesh>
          <mesh position={[0, 1.12, 0]}><boxGeometry args={[8.7, 0.12, 3]} /><meshStandardMaterial color="#34312f" roughness={0.5} /></mesh>
          <mesh position={[0, 3.05, 0]}><boxGeometry args={[7.5, 0.9, 0.15]} /><meshStandardMaterial color="#a17c53" /></mesh>
          <Text position={[0, 3.05, 0.09]} fontSize={0.29} color="#ffffff" anchorX="center" anchorY="middle">{`${sign.vi} / ${sign.en}`}</Text>
          {i === 4 && <mesh position={[0, 1.35, 0]}><boxGeometry args={[0.6, 0.45, 0.2]} /><meshStandardMaterial color="#242b30" /></mesh>}
        </group>;
      })}
      <Instances limit={tableCenters.length}><boxGeometry /><meshStandardMaterial color="#51443b" roughness={0.8} />
        {tableCenters.map(([u, v], i) => <Instance key={i} position={[u, 0.76, v]} scale={[2.3, 0.12, 1.3]} />)}
      </Instances>
      <Instances limit={tableCenters.length * 10}><boxGeometry /><meshStandardMaterial color="#343331" roughness={0.75} />
        {tableCenters.flatMap(([u, v], i) => [
          <Instance key={`${i}-leg1`} position={[u - 0.85, 0.38, v]} scale={[0.12, 0.76, 0.9]} />,
          <Instance key={`${i}-leg2`} position={[u + 0.85, 0.38, v]} scale={[0.12, 0.76, 0.9]} />,
          ...[-1, 1].flatMap(side => [-0.6, 0.6].flatMap((du, j) => [
            <Instance key={`${i}-${side}-${j}-seat`} position={[u + du, 0.45, v + side * 0.95]} scale={[0.48, 0.12, 0.48]} />,
            <Instance key={`${i}-${side}-${j}-back`} position={[u + du, 0.75, v + side * 1.15]} scale={[0.48, 0.6, 0.1]} />,
          ])),
        ])}
      </Instances>
    </group>
  );
}
