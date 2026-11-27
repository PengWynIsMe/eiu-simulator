import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group } from 'three';
import { useExploreStore } from '../../store/useExploreStore';

interface CampusBikeProps {
  moving: MutableRefObject<boolean>;
  visible: boolean;
}

type Vec3Tuple = readonly [number, number, number];

const UP = new Vector3(0, 1, 0);

function computeTubeTransform(from: Vec3Tuple, to: Vec3Tuple) {
  const a = new Vector3(from[0], from[1], from[2]);
  const b = new Vector3(to[0], to[1], to[2]);
  const dir = b.clone().sub(a);
  const length = dir.length();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const quat = new Quaternion().setFromUnitVectors(UP, dir.normalize());
  return {
    position: [mid.x, mid.y, mid.z] as Vec3Tuple,
    quaternion: quat,
    length,
  };
}

interface TubeProps {
  from: Vec3Tuple;
  to: Vec3Tuple;
  radius: number;
  color: string;
  metalness?: number;
  roughness?: number;
}

function Tube({ from, to, radius, color, metalness = 0.25, roughness = 0.35 }: TubeProps) {
  const tx = useMemo(() => computeTubeTransform(from, to), [from, to]);
  return (
    <mesh position={tx.position} quaternion={tx.quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, tx.length, 8]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function SpokedWheel({ wheelRef, z }: { wheelRef: React.RefObject<Group>; z: number }) {
  return (
    <group ref={wheelRef} position={[0, 0.28, z]}>
      {/* Lốp cao su */}
      <mesh rotation-y={Math.PI / 2} castShadow>
        <torusGeometry args={[0.245, 0.036, 10, 22]} />
        <meshStandardMaterial color="#18181b" roughness={0.85} />
      </mesh>
      {/* Vành kim loại */}
      <mesh rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.205, 0.013, 6, 20]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Moay-ơ trung tâm */}
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, 0.09, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 6 nan hoa xuyên tâm */}
      {([0, Math.PI / 3, (Math.PI * 2) / 3] as const).map((ang) => (
        <mesh key={ang} rotation-x={ang}>
          <cylinderGeometry args={[0.006, 0.006, 0.41, 4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export default function CampusBike({ moving, visible }: CampusBikeProps) {
  const bikeStyle = useExploreStore((s) => s.bikeStyle);
  const bikeColor = useExploreStore((s) => s.bikeColor);
  const frontWheelRef = useRef<Group>(null);
  const rearWheelRef = useRef<Group>(null);
  const crankRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!visible || !moving.current) return;
    const dt = Math.min(delta, 0.05);
    const spin = dt * 15;
    if (frontWheelRef.current) frontWheelRef.current.rotation.x += spin;
    if (rearWheelRef.current) rearWheelRef.current.rotation.x += spin;
    if (crankRef.current) crankRef.current.rotation.x += spin * 0.65;
  });

  if (!visible) return null;

  const saddleLeather = bikeStyle === 'classic' ? '#92400e' : '#1e293b';

  return (
    <group>
      {/* Hai bánh có nan hoa */}
      <SpokedWheel wheelRef={rearWheelRef} z={-0.54} />
      <SpokedWheel wheelRef={frontWheelRef} z={0.56} />

      {/* Chắn bùn cong trước & sau */}
      <mesh position={[0, 0.28, -0.54]} rotation={[Math.PI * 0.16, Math.PI / 2, 0]}>
        <torusGeometry args={[0.295, 0.022, 6, 12, Math.PI * 0.72]} />
        <meshStandardMaterial color={bikeColor} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.28, 0.56]} rotation={[Math.PI * 0.12, Math.PI / 2, 0]}>
        <torusGeometry args={[0.295, 0.022, 6, 12, Math.PI * 0.68]} />
        <meshStandardMaterial color={bikeColor} roughness={0.35} />
      </mesh>

      {/* Khung sườn võng thấp (step-through) nối khớp kín mạch, không cấn chân */}
      {/* Càng sau dưới & trên hai bên */}
      <Tube from={[-0.055, 0.28, -0.54]} to={[-0.045, 0.28, -0.02]} radius={0.015} color={bikeColor} />
      <Tube from={[0.055, 0.28, -0.54]} to={[0.045, 0.28, -0.02]} radius={0.015} color={bikeColor} />
      <Tube from={[-0.055, 0.28, -0.54]} to={[-0.02, 0.56, -0.22]} radius={0.014} color={bikeColor} />
      <Tube from={[0.055, 0.28, -0.54]} to={[0.02, 0.56, -0.22]} radius={0.014} color={bikeColor} />

      {/* Ống đứng yên & ống chéo võng trước */}
      <Tube from={[0, 0.28, -0.02]} to={[0, 0.58, -0.22]} radius={0.021} color={bikeColor} />
      <Tube from={[0, 0.28, -0.02]} to={[0, 0.54, 0.38]} radius={0.023} color={bikeColor} />
      <Tube from={[0, 0.44, -0.12]} to={[0, 0.65, 0.33]} radius={0.017} color={bikeColor} />

      {/* Cổ phuộc & cặp phuộc trước */}
      <Tube from={[0, 0.52, 0.39]} to={[0, 0.74, 0.31]} radius={0.024} color={bikeColor} />
      <Tube from={[-0.055, 0.28, 0.56]} to={[-0.02, 0.54, 0.38]} radius={0.016} color={bikeColor} />
      <Tube from={[0.055, 0.28, 0.56]} to={[0.02, 0.54, 0.38]} radius={0.016} color={bikeColor} />

      {/* Cọc yên & Yên xe êm tại y = 0.68 m */}
      <Tube from={[0, 0.57, -0.22]} to={[0, 0.65, -0.25]} radius={0.014} color="#cbd5e1" metalness={0.7} />
      <mesh position={[0, 0.66, -0.25]} castShadow>
        <boxGeometry args={[0.17, 0.055, 0.25]} />
        <meshStandardMaterial color={saddleLeather} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.66, -0.14]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 0.1, 8]} />
        <meshStandardMaterial color={saddleLeather} roughness={0.75} />
      </mesh>

      {/* Pô-tăng & Ghi-đông uốn cong + tay nắm */}
      <Tube from={[0, 0.73, 0.31]} to={[0, 0.92, 0.24]} radius={0.015} color="#cbd5e1" metalness={0.75} />
      <Tube from={[-0.22, 0.93, 0.20]} to={[0, 0.92, 0.25]} radius={0.013} color="#cbd5e1" metalness={0.75} />
      <Tube from={[0.22, 0.93, 0.20]} to={[0, 0.92, 0.25]} radius={0.013} color="#cbd5e1" metalness={0.75} />
      <Tube from={[-0.22, 0.93, 0.20]} to={[-0.27, 0.92, 0.13]} radius={0.019} color={saddleLeather} roughness={0.85} />
      <Tube from={[0.22, 0.93, 0.20]} to={[0.27, 0.92, 0.13]} radius={0.019} color={saddleLeather} roughness={0.85} />

      {/* Đèn pha trước & đèn phản quang sau */}
      <mesh position={[0, 0.68, 0.41]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.045, 0.038, 0.06, 10]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.51, -0.66]}>
        <boxGeometry args={[0.06, 0.04, 0.03]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.9} />
      </mesh>

      {/* Đĩa xích & bàn đạp quay */}
      <group ref={crankRef} position={[0, 0.28, -0.02]}>
        <mesh position={[0.055, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.085, 0.085, 0.015, 14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[-0.08, -0.05, 0]}>
          <boxGeometry args={[0.02, 0.11, 0.025]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
        </mesh>
        <mesh position={[0.08, 0.05, 0]}>
          <boxGeometry args={[0.02, 0.11, 0.025]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
        </mesh>
        <mesh position={[-0.13, -0.1, 0]}>
          <boxGeometry args={[0.085, 0.022, 0.065]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0.13, 0.1, 0]}>
          <boxGeometry args={[0.085, 0.022, 0.065]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* Phụ kiện theo mẫu xe */}
      {bikeStyle === 'city' && (
        /* Giỏ nan thoáng phía trước (lòng rỗng, không phải khối hộp đặc) */
        <group position={[0, 0.76, 0.44]}>
          <mesh position={[0, -0.07, 0]} castShadow>
            <boxGeometry args={[0.26, 0.018, 0.19]} />
            <meshStandardMaterial color="#a16207" roughness={0.75} />
          </mesh>
          {/* Viền miệng giỏ (4 thanh) */}
          <mesh position={[0, 0.08, 0.095]}>
            <boxGeometry args={[0.28, 0.018, 0.018]} />
            <meshStandardMaterial color="#854d0e" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.08, -0.095]}>
            <boxGeometry args={[0.28, 0.018, 0.018]} />
            <meshStandardMaterial color="#854d0e" roughness={0.7} />
          </mesh>
          <mesh position={[-0.13, 0.08, 0]}>
            <boxGeometry args={[0.018, 0.018, 0.19]} />
            <meshStandardMaterial color="#854d0e" roughness={0.7} />
          </mesh>
          <mesh position={[0.13, 0.08, 0]}>
            <boxGeometry args={[0.018, 0.018, 0.19]} />
            <meshStandardMaterial color="#854d0e" roughness={0.7} />
          </mesh>
          {/* 4 cột góc */}
          {([-0.125, 0.125] as const).map((bx) =>
            ([-0.088, 0.088] as const).map((bz) => (
              <mesh key={`${bx}-${bz}`} position={[bx, 0.005, bz]}>
                <cylinderGeometry args={[0.009, 0.009, 0.15, 6]} />
                <meshStandardMaterial color="#854d0e" roughness={0.7} />
              </mesh>
            )),
          )}
          {/* Nan ngang giữa */}
          <mesh position={[0, 0.01, 0.092]}>
            <boxGeometry args={[0.26, 0.012, 0.012]} />
            <meshStandardMaterial color="#a16207" roughness={0.75} />
          </mesh>
        </group>
      )}

      {bikeStyle === 'classic' && (
        /* Baga chở đồ thanh mảnh phía sau */
        <group position={[0, 0.59, -0.54]}>
          <mesh>
            <boxGeometry args={[0.2, 0.025, 0.34]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
          </mesh>
          <Tube from={[-0.08, 0, -0.1]} to={[-0.055, -0.31, 0]} radius={0.009} color="#cbd5e1" metalness={0.7} />
          <Tube from={[0.08, 0, -0.1]} to={[0.055, -0.31, 0]} radius={0.009} color="#cbd5e1" metalness={0.7} />
        </group>
      )}

      {bikeStyle === 'sport' && (
        /* Bình nước thể thao gắn ống chéo */
        <group position={[0, 0.42, 0.15]} rotation-x={0.85}>
          <mesh castShadow>
            <cylinderGeometry args={[0.036, 0.036, 0.16, 10]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.022, 0.028, 0.03, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
        </group>
      )}

      {bikeStyle === 'ebike' && (
        /* Khối pin lithium tích hợp ống khung + màn hình nhỏ trên ghi-đông */
        <>
          <mesh position={[0, 0.41, 0.18]} rotation-x={0.92} castShadow>
            <boxGeometry args={[0.085, 0.28, 0.08]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.43, 0.19]} rotation-x={0.92}>
            <boxGeometry args={[0.09, 0.18, 0.02]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.65} />
          </mesh>
          <mesh position={[0, 0.96, 0.25]} rotation-x={-0.35}>
            <boxGeometry args={[0.09, 0.02, 0.055]} />
            <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.35} />
          </mesh>
        </>
      )}
    </group>
  );
}
