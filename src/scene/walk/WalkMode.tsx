import { useEffect, useMemo, useRef } from 'react';
import { Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { CapsuleFallback } from './PlayerCharacter';
import PlayerCharacter from './PlayerCharacter';
import { campus } from '../../data';
import { useWalkStore } from '../../store/useWalkStore';
import type { Vec2 } from '../../types';
import { isPointInPond } from '../zone1/pondLayout';
import {
  resolveInteriorPosition,
  getNearInteractive,
  getActiveRoom,
  INSIDE_ENTRANCE,
  OUTSIDE_ENTRANCE,
  ELEVATOR_SPAWN_WORLD,
  type InteractivePoint,
  type RoomArea,
} from '../interior/b3Layout';

const WALK_SPEED = 5;
const RUN_SPEED = 12;
const PLAYER_RADIUS = 0.4;
const START: Vec2 = [245, -28];
const BRIDGES: readonly { start: Vec2; end: Vec2 }[] = [
  { start: [123, -72.6], end: [134.7, 38.4] },
  { start: [106.8, -70.8], end: [118.5, 40.1] },
];

// Lưu vị trí nhân vật xuyên suốt các lần mount/unmount của WalkMode khi chuyển cảnh
let globalPlayerPos: Vec2 = [START[0], START[1]];
let globalCameraYaw: number = Math.PI;
let globalFacingYaw: number = Math.PI;

function pointInPolygon(x: number, z: number, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];
    if (!current || !previous) continue;
    const [xi, zi] = current;
    const [xj, zj] = previous;
    const crosses = (zi > z) !== (zj > z)
      && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function distanceToSegment(x: number, z: number, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - (a[0] + t * dx), z - (a[1] + t * dz));
}

function isOnBridge(x: number, z: number): boolean {
  for (const bridge of BRIDGES) {
    if (distanceToSegment(x, z, bridge.start, bridge.end) <= 1.6) return true;
  }
  return false;
}

function resolvePosition(x: number, z: number, previousX: number, previousZ: number, output: Vec2): void {
  output[0] = x;
  output[1] = z;
  if (!pointInPolygon(x, z, campus.layout.boundary)) { output[0] = previousX; output[1] = previousZ; return; }
  if (!isOnBridge(x, z) && isPointInPond(x, z, PLAYER_RADIUS)) { output[0] = previousX; output[1] = previousZ; return; }

  for (const building of campus.buildings) {
    const inside = pointInPolygon(output[0], output[1], building.shape.outer);
    let closestDistance = Number.POSITIVE_INFINITY;
    let closestX = previousX;
    let closestZ = previousZ;
    const points = building.shape.outer;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (!a || !b) continue;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
      const candidateX = a[0] + dx * t;
      const candidateZ = a[1] + dz * t;
      const distance = Math.hypot(x - candidateX, z - candidateZ);
      if (distance < closestDistance) { closestDistance = distance; closestX = candidateX; closestZ = candidateZ; }
    }
    if (!inside && closestDistance >= PLAYER_RADIUS) continue;
    const outwardX = inside ? closestX - output[0] : output[0] - closestX;
    const outwardZ = inside ? closestZ - output[1] : output[1] - closestZ;
    const length = Math.hypot(outwardX, outwardZ) || 1;
    output[0] = closestX + (outwardX / length) * PLAYER_RADIUS;
    output[1] = closestZ + (outwardZ / length) * PLAYER_RADIUS;
    if (pointInPolygon(output[0], output[1], building.shape.outer)) { output[0] = previousX; output[1] = previousZ; }
  }
}

export default function WalkMode() {
  const { camera, gl } = useThree();

  const currentInterior = useWalkStore.getState().interior;
  if (currentInterior && (globalPlayerPos[0] === START[0] && globalPlayerPos[1] === START[1])) {
    globalPlayerPos = [INSIDE_ENTRANCE[0], INSIDE_ENTRANCE[1]];
    globalCameraYaw = Math.PI / 2;
    globalFacingYaw = Math.PI / 2;
  }

  const player = useRef<[number, number, number]>([globalPlayerPos[0], 0.6, globalPlayerPos[1]]);
  const cameraYaw = useRef(globalCameraYaw);
  const facingYaw = useRef(globalFacingYaw);
  const distance = useRef(8);
  const moving = useRef(false);
  const running = useRef(false);
  const keys = useRef(new Set<string>());
  const resolvedPosition = useRef<Vec2>([globalPlayerPos[0], globalPlayerPos[1]]);
  const isDragging = useRef(false);
  const previousPointerX = useRef(0);
  const body = useRef<Group>(null);
  const target = useMemo(() => new Vector3(), []);
  const desiredCamera = useMemo(() => new Vector3(), []);
  const forward = useMemo(() => new Vector3(), []);

  // Trạng thái interior trước đó để phát hiện chuyển cảnh
  const prevInterior = useRef<{ buildingId: string; floor: number } | null>(currentInterior ? { ...currentInterior } : null);
  const lastInteractiveId = useRef<string | null | undefined>(undefined);
  const lastRoomCode = useRef<string | null | undefined>(undefined);
  const currentInteractive = useRef<InteractivePoint | null>(null);

  // Lắng nghe thay đổi trạng thái interior (vào / ra / đổi tầng)
  useEffect(() => {
    const unsub = useWalkStore.subscribe((state) => {
      const cur = state.interior;
      const prev = prevInterior.current;

      if (!prev && cur) {
        // Vừa bước vào bên trong Block 3 -> đặt vị trí ở sảnh tầng 1
        player.current[0] = INSIDE_ENTRANCE[0];
        player.current[1] = 0.6;
        player.current[2] = INSIDE_ENTRANCE[1];
        cameraYaw.current = Math.PI / 2;
        facingYaw.current = Math.PI / 2;
        globalPlayerPos = [INSIDE_ENTRANCE[0], INSIDE_ENTRANCE[1]];
        globalCameraYaw = Math.PI / 2;
        globalFacingYaw = Math.PI / 2;
      } else if (prev && !cur) {
        // Vừa bước ra ngoài khuôn viên -> đặt vị trí trước cửa Block 3 quay mặt ra đường
        player.current[0] = OUTSIDE_ENTRANCE[0];
        player.current[1] = 0.6;
        player.current[2] = OUTSIDE_ENTRANCE[1];
        cameraYaw.current = -Math.PI / 2;
        facingYaw.current = -Math.PI / 2;
        globalPlayerPos = [OUTSIDE_ENTRANCE[0], OUTSIDE_ENTRANCE[1]];
        globalCameraYaw = -Math.PI / 2;
        globalFacingYaw = -Math.PI / 2;
      } else if (prev && cur && prev.floor !== cur.floor) {
        // Đổi tầng thang máy -> đặt vị trí trước cửa thang máy tầng mới
        player.current[0] = ELEVATOR_SPAWN_WORLD[0];
        player.current[1] = 0.6;
        player.current[2] = ELEVATOR_SPAWN_WORLD[1];
        cameraYaw.current = Math.PI;
        facingYaw.current = Math.PI;
        globalPlayerPos = [ELEVATOR_SPAWN_WORLD[0], ELEVATOR_SPAWN_WORLD[1]];
        globalCameraYaw = Math.PI;
        globalFacingYaw = Math.PI;
      }

      prevInterior.current = cur ? { ...cur } : null;
      lastInteractiveId.current = undefined;
      lastRoomCode.current = undefined;
      currentInteractive.current = null;
      window.dispatchEvent(
        new CustomEvent('campussim:interior-proximity', {
          detail: {
            interactive: null,
            activeRoom: null,
          },
        })
      );
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) event.preventDefault();
      keys.current.add(key);

      // Phím E để tương tác cửa hoặc thang máy
      if (key === 'e' && !event.repeat) {
        const interactive = currentInteractive.current;
        if (interactive) {
          if (interactive.type === 'exterior-door') {
            useWalkStore.getState().enterInterior('b3');
          } else if (interactive.type === 'interior-door') {
            useWalkStore.getState().exitInterior();
          } else if (interactive.type === 'elevator') {
            window.dispatchEvent(new CustomEvent('campussim:open-elevator'));
          }
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const onBlur = () => keys.current.clear();
    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 0) {
        isDragging.current = true;
        previousPointerX.current = event.clientX;
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging.current) return;
      cameraYaw.current -= (event.clientX - previousPointerX.current) * 0.005;
      previousPointerX.current = event.clientX;
    };
    const onPointerUp = () => { isDragging.current = false; };
    const onWheel = (event: WheelEvent) => { distance.current = Math.max(4, Math.min(20, distance.current + event.deltaY * 0.01)); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    gl.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    gl.domElement.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      gl.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      gl.domElement.removeEventListener('wheel', onWheel);
      useWalkStore.getState().setMoveInput(0, 0);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pressed = keys.current;
    const input = useWalkStore.getState().moveInput;
    const interiorState = useWalkStore.getState().interior;
    const isInterior = interiorState !== null;

    const xInput = Math.max(-1, Math.min(1, input.x + Number(pressed.has('d') || pressed.has('arrowright')) - Number(pressed.has('a') || pressed.has('arrowleft'))));
    const yInput = Math.max(-1, Math.min(1, input.y + Number(pressed.has('w') || pressed.has('arrowup')) - Number(pressed.has('s') || pressed.has('arrowdown'))));
    running.current = pressed.has('shift');
    const forwardX = Math.cos(cameraYaw.current);
    const forwardZ = Math.sin(cameraYaw.current);
    const strafeX = -forwardZ;
    const strafeZ = forwardX;
    const inputLength = Math.hypot(xInput, yInput);
    moving.current = inputLength > 0.05;

    if (moving.current) {
      const norm = Math.max(1, inputLength);
      const dx = (strafeX * xInput + forwardX * yInput) / norm;
      const dz = (strafeZ * xInput + forwardZ * yInput) / norm;
      const speed = running.current ? RUN_SPEED : WALK_SPEED;
      const targetX = player.current[0] + dx * speed * dt;
      const targetZ = player.current[2] + dz * speed * dt;

      if (isInterior) {
        // Va chạm nội thất theo từng tầng
        const resolved = resolveInteriorPosition(
          targetX,
          targetZ,
          player.current[0],
          player.current[2],
          interiorState.floor,
          PLAYER_RADIUS
        );
        player.current[0] = resolved[0];
        player.current[2] = resolved[1];
      } else {
        // Va chạm ngoài khuôn viên
        resolvePosition(targetX, targetZ, player.current[0], player.current[2], resolvedPosition.current);
        player.current[0] = resolvedPosition.current[0];
        player.current[2] = resolvedPosition.current[1];
      }

      const targetFacingYaw = Math.atan2(dz, dx);
      const yawDifference = Math.atan2(Math.sin(targetFacingYaw - facingYaw.current), Math.cos(targetFacingYaw - facingYaw.current));
      facingYaw.current += yawDifference * (1 - Math.exp(-10 * dt));
    }

    if (body.current) {
      body.current.position.set(player.current[0], player.current[1] + (moving.current ? Math.sin(performance.now() * 0.012) * 0.035 : 0), player.current[2]);
      // This model faces local +Z, so add π to keep its back toward the trailing camera.
      body.current.rotation.y = -facingYaw.current + Math.PI / 2;
    }

    globalPlayerPos[0] = player.current[0];
    globalPlayerPos[1] = player.current[2];
    globalCameraYaw = cameraYaw.current;
    globalFacingYaw = facingYaw.current;

    // --- Điều khiển Camera ---
    target.set(player.current[0], player.current[1] + (isInterior ? 0.9 : 1.1), player.current[2]);
    forward.set(Math.cos(cameraYaw.current), 0, Math.sin(cameraYaw.current));

    if (isInterior) {
      // Trong nội thất: camera đặt cao hơn và chúc xuống dốc hơn (khoảng 50°) để nhìn vào phòng không bị che bởi tường
      const interiorCamDist = 5.2;
      const interiorCamHeight = 6.0;
      desiredCamera.set(
        player.current[0] - forward.x * interiorCamDist,
        player.current[1] + interiorCamHeight,
        player.current[2] - forward.z * interiorCamDist
      );
      camera.position.lerp(desiredCamera, 1 - Math.exp(-6 * dt));
      camera.lookAt(target.x, target.y + 0.2, target.z);
    } else {
      // Ngoài khuôn viên: camera góc nghiêng bình thường
      desiredCamera.set(
        player.current[0] - forward.x * distance.current,
        player.current[1] + 3.4,
        player.current[2] - forward.z * distance.current
      );
      camera.position.lerp(desiredCamera, 1 - Math.exp(-4 * dt));
      camera.lookAt(target.x, target.y + 0.4, target.z);
    }

    // --- Kiểm tra tương tác và thông tin phòng (phát event sang UI) ---
    const interactive = getNearInteractive(player.current[0], player.current[2], isInterior ? interiorState.floor : null);
    currentInteractive.current = interactive;

    let activeRoom: RoomArea | null = null;
    if (isInterior) {
      activeRoom = getActiveRoom(player.current[0], player.current[2], interiorState.floor);
    }

    const interId = interactive ? interactive.id : null;
    const roomCode = activeRoom ? activeRoom.code : null;

    if (interId !== lastInteractiveId.current || roomCode !== lastRoomCode.current) {
      lastInteractiveId.current = interId;
      lastRoomCode.current = roomCode;
      window.dispatchEvent(
        new CustomEvent('campussim:interior-proximity', {
          detail: {
            interactive,
            activeRoom,
          },
        })
      );
    }
  });

  return (
    <group ref={body}>
      <Suspense fallback={<CapsuleFallback />}>
        <PlayerCharacter moving={moving} running={running} />
      </Suspense>
    </group>
  );
}
