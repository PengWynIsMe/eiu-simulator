import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, MeshStandardMaterial, PlaneGeometry } from 'three';
import { toWorld, yawOf } from './frame';
import type { Classroom } from '../../types';
import type { Activity } from '../../types/silverWorld';

export interface SeatHighlightProps {
  room: Classroom;
  activity?: Activity | null;
  seated?: boolean;
}

/**
 * Viền ghế người chơi và màn hình máy tính nổi bật của người chơi:
 * - Viền ghế vàng nhấp nháy (pulsate wireframe) theo vị trí ghế người chơi (room.playerSeat) khi chưa ngồi.
 * - Màn hình máy người chơi sáng hơn các máy khác nhờ một mặt phẳng phủ (screen overlay) mỏng, không z-fighting.
 */
export default function SeatHighlight({ room, activity, seated = false }: SeatHighlightProps) {
  const wireMatRef = useRef<MeshStandardMaterial>(null);

  // 1. Dữ liệu ghế người chơi
  const seatData = useMemo(() => {
    const seatId = room.playerSeat;
    const seat = room.seats.find((s) => s.id === seatId);
    if (!seat) return null;

    const [seatX, seatZ] = toWorld(room.frame, seat.u, seat.v);
    const facingYaw = yawOf(room.frame, room.studentFacing[0], room.studentFacing[1]);
    const seatH = room.chairSeatHeight ?? 0.45;

    // 2. Dữ liệu màn hình máy tính của người chơi (nằm trên bàn trước mặt ghế)
    // Tọa độ bàn: deskU = seat.deskU. Màn hình đặt tại deskU + 0.15, cao 0.75 m.
    // Mặt màn hình cách tâm 0.0165 m về phía ghế người chơi (hướng -studentFacing).
    // Đẩy thêm 0.003 m về phía trước để tránh z-fighting với mặt code của InstancedMesh.
    const screenOffsetU = -room.studentFacing[0] * 0.0195;
    const screenOffsetV = -room.studentFacing[1] * 0.0195;
    const monitorCenterU = seat.deskU + room.studentFacing[0] * 0.15;
    const monitorCenterV = seat.v + room.studentFacing[1] * 0.15;

    const screenLocalU = monitorCenterU + screenOffsetU;
    const screenLocalV = monitorCenterV + screenOffsetV;
    const [screenX, screenZ] = toWorld(room.frame, screenLocalU, screenLocalV);
    const screenY = 0.75 + 0.285; // Bàn 0.75 m + tâm màn hình 0.285 m = 1.035 m

    // Hướng nhìn của mặt màn hình (hướng về phía người chơi)
    const screenYaw = yawOf(room.frame, -room.studentFacing[0], -room.studentFacing[1]);

    return {
      seatPos: [seatX, seatH, seatZ] as const,
      facingYaw,
      screenPos: [screenX, screenY, screenZ] as const,
      screenYaw,
    };
  }, [room]);

  useFrame((state) => {
    if (wireMatRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.9;
      wireMatRef.current.emissiveIntensity = pulse * 1.5;
    }
  });

  const seatBoxGeom = useMemo(() => new BoxGeometry(0.5, 0.08, 0.5), []);
  const screenOverlayGeom = useMemo(() => new PlaneGeometry(0.5, 0.3), []);

  if (!seatData) return null;

  // Hiển thị viền ghế khi chưa ngồi và hoạt động có trigger === 'sit'
  const showSeatPrompt = !seated && (!activity || activity.trigger === 'sit');

  return (
    <group>
      {/* 1. Viền ghế nhấp nháy cho ghế người chơi */}
      {showSeatPrompt && (
        <group position={seatData.seatPos} rotation={[0, seatData.facingYaw, 0]}>
          <mesh geometry={seatBoxGeom}>
            <meshStandardMaterial
              ref={wireMatRef}
              color="#f5b700"
              emissive="#f5b700"
              emissiveIntensity={1.2}
              wireframe
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )}

      {/* 2. Mặt phẳng phủ sáng màn hình máy người chơi (glowing screen overlay) */}
      <group position={seatData.screenPos} rotation={[0, seatData.screenYaw, 0]}>
        <mesh geometry={screenOverlayGeom}>
          <meshBasicMaterial
            color="#e0f2fe"
            transparent
            opacity={0.4}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-2}
          />
        </mesh>
      </group>
    </group>
  );
}
