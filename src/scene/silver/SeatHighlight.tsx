import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, MeshStandardMaterial, PlaneGeometry } from 'three';
import { toWorld, yawOf } from './frame';
import type { Classroom } from '../../types';
import type { Activity } from '../../types/silverWorld';
import { isComputerLabRoom } from '../../silverWorld/seatAnchor';

export interface SeatHighlightProps {
  room?: Classroom | null;
  activity?: Activity | null;
  seated?: boolean;
  sitYOffset?: number;
}

/**
 * Viền ghế người chơi và màn hình máy tính nổi bật của người chơi:
 * - Viền ghế vàng nhấp nháy (pulsate wireframe) theo vị trí ghế người chơi khi chưa ngồi:
 *   + Lấy từ activity.seat (đặc biệt là 208.B8 và các hoạt động ngồi đã định vị)
 *   + Hoặc lấy từ room.playerSeat trong phòng học
 * - Màn hình máy người chơi sáng hơn các máy khác nhờ một mặt phẳng phủ (screen overlay) mỏng,
 *   chỉ hiển thị khi phòng là phòng máy tính (isComputerLabRoom). Ở phòng lý thuyết không có máy tính.
 */
export default function SeatHighlight({
  room,
  activity,
  seated = false,
  sitYOffset = 0.45,
}: SeatHighlightProps) {
  const wireMatRef = useRef<MeshStandardMaterial>(null);

  // Dữ liệu ghế người chơi
  const seatData = useMemo(() => {
    // 1. Ưu tiên activity.seat nếu có (ví dụ 208.B8 hoặc activity chỉ định ghế rõ ràng)
    if (activity?.seat) {
      const spot = activity.seat.spot;
      const facingYaw = Math.atan2(spot.facing[0], spot.facing[1]);
      const seatH = room?.chairSeatHeight ?? sitYOffset;

      let screenPos: readonly [number, number, number] | null = null;
      let screenYaw = 0;

      if (room && isComputerLabRoom(room)) {
        const seatId = room.playerSeat;
        const seat = room.seats.find((s) => s.id === seatId);
        if (seat) {
          const screenOffsetU = -room.studentFacing[0] * 0.0195;
          const screenOffsetV = -room.studentFacing[1] * 0.0195;
          const monitorCenterU = seat.deskU + room.studentFacing[0] * 0.15;
          const monitorCenterV = seat.v + room.studentFacing[1] * 0.15;
          const [screenX, screenZ] = toWorld(room.frame, monitorCenterU + screenOffsetU, monitorCenterV + screenOffsetV);
          screenPos = [screenX, 1.035, screenZ] as const;
          screenYaw = yawOf(room.frame, -room.studentFacing[0], -room.studentFacing[1]);
        }
      }

      return {
        seatPos: [spot.x, seatH, spot.z] as const,
        facingYaw,
        screenPos,
        screenYaw,
      };
    }

    // 2. Dữ liệu từ room.playerSeat
    if (room) {
      const seatId = room.playerSeat;
      const seat = room.seats.find((s) => s.id === seatId);
      if (!seat) return null;

      const [seatX, seatZ] = toWorld(room.frame, seat.u, seat.v);
      const facingYaw = yawOf(room.frame, room.studentFacing[0], room.studentFacing[1]);
      const seatH = room.chairSeatHeight ?? sitYOffset;

      let screenPos: readonly [number, number, number] | null = null;
      let screenYaw = 0;

      if (isComputerLabRoom(room)) {
        const screenOffsetU = -room.studentFacing[0] * 0.0195;
        const screenOffsetV = -room.studentFacing[1] * 0.0195;
        const monitorCenterU = seat.deskU + room.studentFacing[0] * 0.15;
        const monitorCenterV = seat.v + room.studentFacing[1] * 0.15;
        const [screenX, screenZ] = toWorld(room.frame, monitorCenterU + screenOffsetU, monitorCenterV + screenOffsetV);
        screenPos = [screenX, 1.035, screenZ] as const;
        screenYaw = yawOf(room.frame, -room.studentFacing[0], -room.studentFacing[1]);
      }

      return {
        seatPos: [seatX, seatH, seatZ] as const,
        facingYaw,
        screenPos,
        screenYaw,
      };
    }

    return null;
  }, [room, activity, sitYOffset]);

  useFrame((state) => {
    if (wireMatRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.9;
      wireMatRef.current.emissiveIntensity = pulse * 1.5;
    }
  });

  const seatBoxGeom = useMemo(() => new BoxGeometry(0.5, 0.08, 0.5), []);
  const screenOverlayGeom = useMemo(() => new PlaneGeometry(0.5, 0.3), []);

  useEffect(() => {
    return () => {
      seatBoxGeom.dispose();
      screenOverlayGeom.dispose();
    };
  }, [seatBoxGeom, screenOverlayGeom]);

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

      {/* 2. Mặt phẳng phủ sáng màn hình máy người chơi (glowing screen overlay) - CHỈ hiển thị ở phòng máy */}
      {seatData.screenPos && (
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
      )}
    </group>
  );
}
