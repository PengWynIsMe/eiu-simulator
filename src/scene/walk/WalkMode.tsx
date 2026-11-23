import { useEffect, useMemo, useRef } from 'react';
import { dampHeight, getGroundHeight } from './groundHeight';
import { Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, PerspectiveCamera, type Group } from 'three';
import { CapsuleFallback } from './PlayerCharacter';
import PlayerCharacter from './PlayerCharacter';
import { campus, FLOOR_HEIGHT, getClassroom } from '../../data';
import { useCampusStore } from '../../store/useCampusStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useLessonStore } from '../../store/useLessonStore';
import type { Vec2 } from '../../types';
import { isPointInPond } from '../zone1/pondLayout';
import { isOnPondPot } from '../zone1/pondTerraceLayout';
import { b11ToLocal, b11ToWorld } from '../interior/layouts/b11';
import { SIT_Y_OFFSET, localDirToYaw } from '../npc/sitPose';
import {
  getInteriorLayout,
  getExteriorInteractive,
  type InteractivePoint,
  type RoomArea,
} from '../interior/layouts';

/** Phải khớp `near` của <Canvas> trong App.tsx. */
const OUTDOOR_CAMERA_NEAR = 0.35;
const OUTDOOR_CAMERA_FAR = 2000;
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
let globalCameraPitch = -0.08;
let globalFacingYaw: number = Math.PI;

// Tự động kích hoạt WalkMode và đặt người chơi trước thang máy tầng 4 B11 khi bắt đầu buổi học
useLessonStore.subscribe((state, prev) => {
  if (prev.phase === 'idle' && state.phase === 'goToClass') {
    const room = getClassroom('406.B11');
    if (!room) return;
    const [arrX, arrZ] = b11ToWorld(room.arrival.u, room.arrival.v);
    const [doorX, doorZ] = b11ToWorld(room.door.u, room.door.v);
    const yaw = Math.atan2(doorZ - arrZ, doorX - arrX);
    globalPlayerPos = [arrX, arrZ];
    globalCameraYaw = yaw;
    globalFacingYaw = yaw;
    useWalkStore.setState({
      walkMode: true,
      interior: { buildingId: 'b11', floor: 4 },
      moveInput: { x: 0, y: 0 },
      playerPos: { x: arrX, z: arrZ, y: 0.0, floor: 4 },
    });
  }
});

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
  if (isOnPondPot(x, z, PLAYER_RADIUS)) {
    output[0] = previousX;
    output[1] = previousZ;
    return;
  }

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
  if (typeof window !== 'undefined') {
    (window as unknown as { __gl?: typeof gl }).__gl = gl;
  }

  const currentInterior = useWalkStore.getState().interior;
  const selectedId = useCampusStore.getState().selectedBuildingId;

  if (currentInterior && (globalPlayerPos[0] === START[0] && globalPlayerPos[1] === START[1])) {
    const layout = getInteriorLayout(currentInterior.buildingId);
    const defaultInside = layout?.defaultInsideEntrance ?? START;
    globalPlayerPos = [defaultInside[0], defaultInside[1]];
    globalCameraYaw = Math.PI / 2;
    globalFacingYaw = Math.PI / 2;
  } else if (!currentInterior && selectedId && globalPlayerPos[0] === START[0] && globalPlayerPos[1] === START[1]) {
    const selectedLayout = getInteriorLayout(selectedId);
    if (selectedLayout) {
      globalPlayerPos = [selectedLayout.defaultOutsideEntrance[0], selectedLayout.defaultOutsideEntrance[1]];
      globalCameraYaw = -Math.PI / 2;
      globalFacingYaw = -Math.PI / 2;
    }
  }

  const initialY = currentInterior ? 0.0 : getGroundHeight(globalPlayerPos[0], globalPlayerPos[1]);
  const player = useRef<[number, number, number]>([globalPlayerPos[0], initialY, globalPlayerPos[1]]);
  const cameraYaw = useRef(globalCameraYaw);
  const cameraPitch = useRef(globalCameraPitch);
  const viewMode = useRef<0 | 1 | 2>(0); // sau vai → FPS → từ trên xuống
  const facingYaw = useRef(globalFacingYaw);
  const outdoorDistance = useRef(8);
  const indoorDesiredDistance = useRef(4.0);
  const indoorActualDistance = useRef(4.0);
  const moving = useRef(false);
  const running = useRef(false);
  const keys = useRef(new Set<string>());
  const resolvedPosition = useRef<Vec2>([globalPlayerPos[0], globalPlayerPos[1]]);
  const isDragging = useRef(false);
  const previousPointerX = useRef(0);
  const previousPointerY = useRef(0);
  const lookPointerId = useRef<number | null>(null);
  const body = useRef<Group>(null);
  const target = useMemo(() => new Vector3(), []);
  const desiredCamera = useMemo(() => new Vector3(), []);
  const desiredLookAt = useMemo(() => new Vector3(), []);
  const forward = useMemo(() => new Vector3(), []);
  const wallCollisionHoldDist = useRef(4.0);
  const wallCollisionHoldTimer = useRef(0);
  const lastPosSyncTime = useRef(0);
  const seatPromptVisible = useRef(false);

  // Danh sách các đoạn tường đặc 2D để kiểm tra camera chắn tầm nhìn
  const currentFloorWallLines = useRef<{ p1x: number; p1z: number; p2x: number; p2z: number }[]>([]);

  const updateCachedWalls = (buildingId: string, floor: number) => {
    const layout = getInteriorLayout(buildingId);
    if (layout) {
      const walls = layout.getFloorWalls(floor);
      currentFloorWallLines.current = walls
        .filter((w) => !w.isRailing)
        .map((w) => {
          const [p1x, p1z] = layout.toWorld(w.u1, w.v1);
          const [p2x, p2z] = layout.toWorld(w.u2, w.v2);
          return { p1x, p1z, p2x, p2z };
        });
    } else {
      currentFloorWallLines.current = [];
    }
  };

  if (currentInterior) {
    updateCachedWalls(currentInterior.buildingId, currentInterior.floor);
  }

  // Trạng thái interior trước đó để phát hiện chuyển cảnh
  const prevInterior = useRef<{ buildingId: string; floor: number } | null>(currentInterior ? { ...currentInterior } : null);
  const pendingStairTransition = useRef<{ targetFloor: number; deltaY: number } | null>(null);
  const lastInteractiveId = useRef<string | null | undefined>(undefined);
  const lastRoomCode = useRef<string | null | undefined>(undefined);
  const currentInteractive = useRef<InteractivePoint | null>(null);
  const currentActiveRoom = useRef<RoomArea | null>(null);
  const lastUsedInteractive = useRef<InteractivePoint | null>(null);
  const isTopDownView = useRef(false);
  const stairArrival = useRef<{ stairCode: string; floor: number } | null>(null);

  // Lắng nghe sự kiện chuyển góc nhìn từ trên xuống để so sánh sơ đồ
  useEffect(() => {
    const onTopDown = (event: Event) => {
      const custom = event as CustomEvent<{ enabled: boolean }>;
      isTopDownView.current = custom.detail.enabled;
    };
    const onSetPose = (event: Event) => {
      const custom = event as CustomEvent<{ x: number; z: number; yaw?: number; pitch?: number; y?: number }>;
      player.current[0] = custom.detail.x;
      player.current[2] = custom.detail.z;
      if (custom.detail.y !== undefined) player.current[1] = custom.detail.y;
      if (custom.detail.yaw !== undefined) {
        cameraYaw.current = custom.detail.yaw;
        facingYaw.current = custom.detail.yaw;
      }
      if (custom.detail.pitch !== undefined) {
        cameraPitch.current = custom.detail.pitch;
      }
    };
    const onStairMove = (event: Event) => {
      const custom = event as CustomEvent<{ stairCode: string; floor: number }>;
      stairArrival.current = custom.detail;
    };
    const onElevatorMove = () => { stairArrival.current = null; };
    window.addEventListener('campussim:topdown-camera', onTopDown);
    window.addEventListener('campussim:set-player-pose', onSetPose);
    window.addEventListener('campussim:stair-move', onStairMove);
    window.addEventListener('campussim:elevator-move', onElevatorMove);
    return () => {
      window.removeEventListener('campussim:topdown-camera', onTopDown);
      window.removeEventListener('campussim:set-player-pose', onSetPose);
      window.removeEventListener('campussim:stair-move', onStairMove);
      window.removeEventListener('campussim:elevator-move', onElevatorMove);
    };
  }, []);

  // Lắng nghe bắt đầu buổi học (goToClass) và đứng dậy khi ngồi
  useEffect(() => {
    const unsubLesson = useLessonStore.subscribe((state, prev) => {
      if (prev.phase === 'idle' && state.phase === 'goToClass') {
        const room = getClassroom('406.B11');
        if (!room) return;
        useWalkStore.setState({
          walkMode: true,
          interior: { buildingId: 'b11', floor: 4 },
          moveInput: { x: 0, y: 0 },
        });

        const [arrX, arrZ] = b11ToWorld(room.arrival.u, room.arrival.v);
        const [doorX, doorZ] = b11ToWorld(room.door.u, room.door.v);
        const yaw = Math.atan2(doorZ - arrZ, doorX - arrX);

        player.current[0] = arrX;
        player.current[1] = 0.0;
        player.current[2] = arrZ;
        cameraYaw.current = yaw;
        facingYaw.current = yaw;
        globalPlayerPos = [arrX, arrZ];
        globalCameraYaw = yaw;
        globalFacingYaw = yaw;
        updateCachedWalls('b11', 4);
        useWalkStore.getState().setPlayerPos({
          x: arrX,
          z: arrZ,
          y: 0.0,
          floor: 4,
        });
      } else if (prev.seatId && !state.seatId) {
        // Đứng dậy: đặt nhân vật ở lối đi cạnh ghế
        const room = getClassroom('406.B11');
        if (room) {
          const [standX, standZ] = b11ToWorld(91.8, -142.0);
          player.current[0] = standX;
          player.current[1] = 0.0;
          player.current[2] = standZ;
          globalPlayerPos = [standX, standZ];
        }
      }
    });

    const onEscapeCapture = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const lesson = useLessonStore.getState();
        if (lesson.desktopOpen) {
          event.stopPropagation();
          event.preventDefault();
          lesson.closeDesktop();
        } else if (lesson.seatId) {
          event.stopPropagation();
          event.preventDefault();
          lesson.standUp();
          const room = getClassroom('406.B11');
          if (room) {
            const [standX, standZ] = b11ToWorld(91.8, -142.0);
            player.current[0] = standX;
            player.current[1] = 0.0;
            player.current[2] = standZ;
            globalPlayerPos = [standX, standZ];
          }
        }
      }
    };
    window.addEventListener('keydown', onEscapeCapture, true);

    return () => {
      unsubLesson();
      window.removeEventListener('keydown', onEscapeCapture, true);
    };
  }, []);

  // Lắng nghe thay đổi trạng thái interior (vào / ra / đổi tầng)
  useEffect(() => {
    const unsub = useWalkStore.subscribe((state) => {
      const cur = state.interior;
      const prev = prevInterior.current;
      if (prev?.buildingId === cur?.buildingId && prev?.floor === cur?.floor) return;
      // Record the transition before setPlayerPos synchronously notifies subscribers.
      prevInterior.current = cur ? { ...cur } : null;

      if (!prev && cur) {
        // Vừa bước vào bên trong tòa nhà
        pendingStairTransition.current = null;
        const layout = getInteriorLayout(cur.buildingId);
        const lastPt = lastUsedInteractive.current;
        const isLessonStart = useLessonStore.getState().phase === 'goToClass' && cur.buildingId.toLowerCase() === 'b11' && cur.floor === 4;
        let spawnPos: Vec2;
        let spawnYaw: number;
        if (isLessonStart) {
          const room = getClassroom('406.B11');
          if (room) {
            spawnPos = b11ToWorld(room.arrival.u, room.arrival.v);
            const doorPos = b11ToWorld(room.door.u, room.door.v);
            spawnYaw = Math.atan2(doorPos[1] - spawnPos[1], doorPos[0] - spawnPos[0]);
          } else {
            spawnPos = lastPt?.spawnPosWorld ?? layout?.defaultInsideEntrance ?? START;
            spawnYaw = lastPt?.spawnYaw ?? Math.PI / 2;
          }
        } else {
          spawnPos = lastPt?.spawnPosWorld ?? layout?.defaultInsideEntrance ?? START;
          spawnYaw = lastPt?.spawnYaw ?? Math.PI / 2;
        }

        player.current[0] = spawnPos[0];
        player.current[1] = 0.0;
        player.current[2] = spawnPos[1];
        cameraYaw.current = spawnYaw;
        facingYaw.current = spawnYaw;
        globalPlayerPos = [spawnPos[0], spawnPos[1]];
        globalCameraYaw = spawnYaw;
        globalFacingYaw = spawnYaw;
        updateCachedWalls(cur.buildingId, cur.floor);
        useWalkStore.getState().setPlayerPos({
          x: spawnPos[0],
          z: spawnPos[1],
          y: 0.0,
          floor: cur.floor,
        });
      } else if (prev && !cur) {
        // Vừa bước ra ngoài khuôn viên
        pendingStairTransition.current = null;
        const prevLayout = getInteriorLayout(prev.buildingId);
        const lastPt = lastUsedInteractive.current;
        const spawnPos = lastPt?.spawnPosWorld ?? prevLayout?.defaultOutsideEntrance ?? START;
        const spawnYaw = lastPt?.spawnYaw ?? -Math.PI / 2;

        player.current[0] = spawnPos[0];
        player.current[1] = getGroundHeight(spawnPos[0], spawnPos[1]);
        player.current[2] = spawnPos[1];
        cameraYaw.current = spawnYaw;
        facingYaw.current = spawnYaw;
        globalPlayerPos = [spawnPos[0], spawnPos[1]];
        globalCameraYaw = spawnYaw;
        globalFacingYaw = spawnYaw;
        currentFloorWallLines.current = [];
      } else if (prev && cur && prev.floor !== cur.floor) {
        const stairTx = pendingStairTransition.current;
        if (stairTx && stairTx.targetFloor === cur.floor) {
          // Đi bộ qua cầu thang giữa các tầng (B11/B8/B3) -> giữ nguyên vị trí X/Z & góc nhìn, chỉ dời cao độ theo tầng mới
          pendingStairTransition.current = null;
          player.current[1] += stairTx.deltaY;
          updateCachedWalls(cur.buildingId, cur.floor);
          stairArrival.current = null;
        } else if (useLessonStore.getState().phase === 'goToClass' && cur.buildingId.toLowerCase() === 'b11' && cur.floor === 4) {
          const room = getClassroom('406.B11');
          if (room) {
            const arrPos = b11ToWorld(room.arrival.u, room.arrival.v);
            const doorPos = b11ToWorld(room.door.u, room.door.v);
            const spawnYaw = Math.atan2(doorPos[1] - arrPos[1], doorPos[0] - arrPos[0]);
            player.current[0] = arrPos[0];
            player.current[1] = 0.0;
            player.current[2] = arrPos[1];
            cameraYaw.current = spawnYaw;
            facingYaw.current = spawnYaw;
            globalPlayerPos = [arrPos[0], arrPos[1]];
            globalCameraYaw = spawnYaw;
            globalFacingYaw = spawnYaw;
            updateCachedWalls(cur.buildingId, cur.floor);
            useWalkStore.getState().setPlayerPos({
              x: arrPos[0],
              z: arrPos[1],
              y: 0.0,
              floor: cur.floor,
            });
            stairArrival.current = null;
          }
        } else {
          pendingStairTransition.current = null;
          const layout = getInteriorLayout(cur.buildingId);
          const stair = stairArrival.current;
          const rooms = layout?.getFloorRooms(cur.floor) ?? [];
          const stairRooms = rooms.filter((room) => room.code.startsWith('Thang bộ'));
          const named = stair ? stairRooms.find((room) => room.code === stair.stairCode) : undefined;
          const originLocal = stair ? layout?.toLocal(player.current[0], player.current[2]) : undefined;
          const chosen = named ?? (stair && stairRooms.length > 0
            ? stairRooms.reduce((nearest, room) => {
              if (!originLocal) return nearest;
              const nearestDistance = Math.hypot((nearest.minU + nearest.maxU) / 2 - originLocal[0], (nearest.minV + nearest.maxV) / 2 - originLocal[1]);
              const roomDistance = Math.hypot((room.minU + room.maxU) / 2 - originLocal[0], (room.minV + room.maxV) / 2 - originLocal[1]);
              return roomDistance < nearestDistance ? room : nearest;
            })
            : undefined);
          const spawnPos = chosen && layout
            ? layout.toWorld((chosen.minU + chosen.maxU) / 2, (chosen.minV + chosen.maxV) / 2)
            : layout?.elevator.spawnWorld ?? [0, 0];
          const hallway = chosen && layout
            ? rooms.filter((room) => /hành lang/i.test(`${room.code} ${room.name}`)).reduce<RoomArea | null>((nearest, room) => {
              if (!nearest) return room;
              const centerU = (chosen.minU + chosen.maxU) / 2;
              const centerV = (chosen.minV + chosen.maxV) / 2;
              const nearestDistance = Math.hypot((nearest.minU + nearest.maxU) / 2 - centerU, (nearest.minV + nearest.maxV) / 2 - centerV);
              const roomDistance = Math.hypot((room.minU + room.maxU) / 2 - centerU, (room.minV + room.maxV) / 2 - centerV);
              return roomDistance < nearestDistance ? room : nearest;
            }, null)
            : null;
          const hallwayPos = hallway && layout
            ? layout.toWorld((hallway.minU + hallway.maxU) / 2, (hallway.minV + hallway.maxV) / 2)
            : null;
          const spawnYaw = hallwayPos
            ? Math.atan2(hallwayPos[1] - spawnPos[1], hallwayPos[0] - spawnPos[0])
            : layout?.elevator.facingYaw ?? Math.PI;

          player.current[0] = spawnPos[0];
          player.current[1] = 0.0;
          player.current[2] = spawnPos[1];
          cameraYaw.current = spawnYaw;
          facingYaw.current = spawnYaw;
          globalPlayerPos = [spawnPos[0], spawnPos[1]];
          globalCameraYaw = spawnYaw;
          globalFacingYaw = spawnYaw;
          updateCachedWalls(cur.buildingId, cur.floor);
          stairArrival.current = null;
        }
      }

      lastInteractiveId.current = undefined;
      lastRoomCode.current = undefined;
      currentInteractive.current = null;
      lastUsedInteractive.current = null;
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
    const originalTouchAction = gl.domElement.style.touchAction;
    gl.domElement.style.touchAction = 'none';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) event.preventDefault();
      keys.current.add(key);

      // Phím E để tương tác ghế hoặc cửa hoặc thang máy
      if (key === 'e' && !event.repeat) {
        const lesson = useLessonStore.getState();
        if (seatPromptVisible.current && !lesson.seatId) {
          const room = getClassroom('406.B11');
          if (room) {
            lesson.sitDown(room.playerSeat);
            return;
          }
        }

        const interactive = currentInteractive.current;
        if (interactive && !(currentActiveRoom.current?.code.startsWith('Thang bộ') && interactive.type === 'elevator')) {
          lastUsedInteractive.current = interactive;
          if (interactive.type === 'exterior-door' && interactive.buildingId) {
            useWalkStore.getState().enterInterior(interactive.buildingId);
          } else if (interactive.type === 'interior-door') {
            useWalkStore.getState().exitInterior();
          } else if (interactive.type === 'elevator') {
            window.dispatchEvent(new CustomEvent('campussim:open-elevator'));
          }
        }
      }

      // Phím C xoay vòng sau vai → FPS → trên xuống.
      if (key === 'c' && !event.repeat) {
        if (viewMode.current === 1 && document.pointerLockElement === gl.domElement) document.exitPointerLock();
        viewMode.current = ((viewMode.current + 1) % 3) as 0 | 1 | 2;
        isTopDownView.current = viewMode.current === 2;
        cameraPitch.current = 0;
        window.dispatchEvent(new CustomEvent('campussim:view-mode', { detail: { mode: viewMode.current } }));
        window.dispatchEvent(
          new CustomEvent('campussim:topdown-camera', {
            detail: { enabled: isTopDownView.current },
          })
        );
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const onBlur = () => keys.current.clear();
    const onPointerDown = (event: PointerEvent) => {
      if (viewMode.current === 1) {
        if (event.pointerType === 'touch') {
          if (event.clientX >= window.innerWidth / 2) {
            lookPointerId.current = event.pointerId;
            previousPointerX.current = event.clientX;
            previousPointerY.current = event.clientY;
            gl.domElement.setPointerCapture(event.pointerId);
          }
        } else if (event.button === 0) {
          void gl.domElement.requestPointerLock().catch(() => undefined);
        }
        return;
      }
      if (event.button === 0) {
        isDragging.current = true;
        previousPointerX.current = event.clientX;
        previousPointerY.current = event.clientY;
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (viewMode.current === 1 && event.pointerType === 'touch') {
        if (lookPointerId.current !== event.pointerId) return;
        const deltaX = event.clientX - previousPointerX.current;
        const deltaY = event.clientY - previousPointerY.current;
        previousPointerX.current = event.clientX;
        previousPointerY.current = event.clientY;
        cameraYaw.current += deltaX * 0.0022;
        cameraPitch.current = Math.max(-1.396, Math.min(1.396, cameraPitch.current - deltaY * 0.0022));
        return;
      }
      if (viewMode.current === 1 && document.pointerLockElement === gl.domElement) {
        cameraYaw.current += event.movementX * 0.0022;
        cameraPitch.current = Math.max(-1.396, Math.min(1.396, cameraPitch.current - event.movementY * 0.0022));
        return;
      }
      if (!isDragging.current) return;
      cameraYaw.current -= (event.clientX - previousPointerX.current) * 0.005;
      if (useWalkStore.getState().interior !== null) {
        cameraPitch.current = Math.max(
          -0.45,
          Math.min(1.08, cameraPitch.current + (event.clientY - previousPointerY.current) * 0.0045)
        );
      }
      previousPointerX.current = event.clientX;
      previousPointerY.current = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      isDragging.current = false;
      if (lookPointerId.current === event.pointerId) {
        lookPointerId.current = null;
        if (gl.domElement.hasPointerCapture(event.pointerId)) gl.domElement.releasePointerCapture(event.pointerId);
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (useWalkStore.getState().interior !== null) {
        indoorDesiredDistance.current = Math.max(2.0, Math.min(6.0, indoorDesiredDistance.current + event.deltaY * 0.005));
      } else {
        outdoorDistance.current = Math.max(3.0, Math.min(12.0, outdoorDistance.current + event.deltaY * 0.01));
      }
    };
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
      gl.domElement.style.touchAction = originalTouchAction;
      useWalkStore.getState().setMoveInput(0, 0);
    };
  }, [gl, gl.domElement]);

  // Thoát chế độ đi bộ khi đang ở trong nhà: trả near và fov về giá trị ngoài trời cho CameraRig.
  useEffect(() => {
    return () => {
      camera.near = OUTDOOR_CAMERA_NEAR;
      camera.far = OUTDOOR_CAMERA_FAR;
      if ('fov' in camera) {
        (camera as PerspectiveCamera).fov = 45;
      }
      camera.updateProjectionMatrix();
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
    };
  }, [camera, gl.domElement]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pressed = keys.current;
    const input = useWalkStore.getState().moveInput;
    const interiorState = useWalkStore.getState().interior;
    const isInterior = interiorState !== null;

    // 1. Ghi playerPos tối đa 5 lần/giây
    const nowMs = performance.now();
    if (nowMs - lastPosSyncTime.current >= 200) {
      lastPosSyncTime.current = nowMs;
      useWalkStore.getState().setPlayerPos({
        x: player.current[0],
        z: player.current[2],
        y: player.current[1],
        floor: isInterior ? interiorState.floor : null,
      });
    }

    // 2. Kiểm tra tới lớp (406.B11) & nhắc ghế
    const room406 = getClassroom('406.B11');
    if (isInterior && interiorState.buildingId.toLowerCase() === 'b11' && interiorState.floor === 4 && room406) {
      const [localU, localV] = b11ToLocal(player.current[0], player.current[2]);
      const inBounds =
        localU >= room406.bounds.minU &&
        localU <= room406.bounds.maxU &&
        localV >= room406.bounds.minV &&
        localV <= room406.bounds.maxV;
      if (inBounds && useLessonStore.getState().phase === 'goToClass') {
        useLessonStore.getState().arriveAtClass();
      }

      const seat = room406.seats.find((s) => s.id === room406.playerSeat);
      if (seat) {
        const [seatWorldX, seatWorldZ] = b11ToWorld(seat.u, seat.v);
        const distToSeat = Math.hypot(player.current[0] - seatWorldX, player.current[2] - seatWorldZ);
        const lesson = useLessonStore.getState();
        const canSit = !lesson.seatId && (lesson.phase === 'findSeat' || lesson.phase === 'goToClass');
        const isNear = distToSeat <= 1.2 && canSit;

        if (isNear !== seatPromptVisible.current) {
          seatPromptVisible.current = isNear;
          window.dispatchEvent(new CustomEvent('campussim:seat-prompt', { detail: { visible: isNear } }));
        }
      }
    } else if (seatPromptVisible.current) {
      seatPromptVisible.current = false;
      window.dispatchEvent(new CustomEvent('campussim:seat-prompt', { detail: { visible: false } }));
    }

    // 3. Lerp FOV khi chạy nhanh (Shift) (+5 độ)
    if ('fov' in camera) {
      const persCam = camera as PerspectiveCamera;
      const lesson = useLessonStore.getState();
      const targetFov = running.current && moving.current && !lesson.seatId ? 50 : 45;
      if (Math.abs(persCam.fov - targetFov) > 0.02) {
        persCam.fov += (targetFov - persCam.fov) * (1 - Math.exp(-8 * dt));
        persCam.updateProjectionMatrix();
      }
    }

    // 4. Nếu đang ngồi vào máy: khóa di chuyển, cố định vị trí & điều khiển camera ngồi
    const lesson = useLessonStore.getState();
    const isSitting = Boolean(lesson.seatId);

    if (isSitting && room406) {
      moving.current = false;
      running.current = false;

      const seat = room406.seats.find((s) => s.id === room406.playerSeat);
      if (seat) {
        const [seatX, seatZ] = b11ToWorld(seat.u, seat.v);
        player.current[0] = seatX;
        player.current[1] = SIT_Y_OFFSET;
        player.current[2] = seatZ;

        const yaw = localDirToYaw(room406.studentFacing[0], room406.studentFacing[1]);
        facingYaw.current = -yaw + Math.PI / 2;

        if (body.current) {
          body.current.visible = viewMode.current !== 1;
          body.current.position.set(seatX, SIT_Y_OFFSET, seatZ);
          body.current.rotation.y = yaw;
        }

        // Camera ngồi:
        // Desktop open: tiến sát màn hình (u=92.0 nhìn u=92.45)
        // Normal sitting: sau vai ngang mắt 1.55 m, nhìn màn hình + bảng + TV tường Đông
        const camU = lesson.desktopOpen ? 92.0 : 91.15;
        const camY = lesson.desktopOpen ? 1.08 : 1.55;
        const camV = lesson.desktopOpen ? -141.0 : -140.85;

        const tgtU = lesson.desktopOpen ? 92.45 : 96.4;
        const tgtY = lesson.desktopOpen ? 1.05 : 1.35;
        const tgtV = lesson.desktopOpen ? -141.0 : -142.0;

        const [camX, camZ] = b11ToWorld(camU, camV);
        const [tgtX, tgtZ] = b11ToWorld(tgtU, tgtV);

        desiredCamera.set(camX, camY, camZ);
        desiredLookAt.set(tgtX, tgtY, tgtZ);

        const sitSpeed = 1 - Math.exp(-6 * dt);
        camera.position.lerp(desiredCamera, sitSpeed);
        target.lerp(desiredLookAt, sitSpeed);
        camera.lookAt(target.x, target.y, target.z);

        globalPlayerPos[0] = seatX;
        globalPlayerPos[1] = seatZ;
        return;
      }
    }

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
        // Va chạm nội thất theo từng tòa, từng tầng và cao độ cầu thang
        const layout = getInteriorLayout(interiorState.buildingId);
        if (layout) {
          const resolved = layout.resolvePosition(
            targetX,
            targetZ,
            player.current[0],
            player.current[2],
            interiorState.floor,
            PLAYER_RADIUS,
            player.current[1]
          );
          player.current[0] = resolved[0];
          player.current[2] = resolved[1];
        } else {
          player.current[0] = targetX;
          player.current[2] = targetZ;
        }
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

    // Trong nhà: đi theo cầu thang bộ nhiều tầng (stepStairHeight) hoặc bám sàn y = 0.
    if (isInterior) {
      const layout = getInteriorLayout(interiorState.buildingId);
      if (layout?.stepStairHeight) {
        const stairRes = layout.stepStairHeight(
          player.current[0],
          player.current[2],
          player.current[1],
          interiorState.floor
        );
        player.current[1] = stairRes.y;
        if (
          stairRes.transitionToFloor !== undefined &&
          stairRes.transitionToFloor !== interiorState.floor &&
          pendingStairTransition.current === null
        ) {
          const deltaY = (interiorState.floor - stairRes.transitionToFloor) * FLOOR_HEIGHT;
          pendingStairTransition.current = {
            targetFloor: stairRes.transitionToFloor,
            deltaY,
          };
          window.dispatchEvent(new CustomEvent('campussim:stair-walk-floor'));
          useWalkStore.getState().setInteriorFloor(stairRes.transitionToFloor);
        }
      } else {
        player.current[1] = 0.0;
      }
    } else {
      player.current[1] = dampHeight(player.current[1], getGroundHeight(player.current[0], player.current[2]), dt);
    }

    if (body.current) {
      body.current.visible = viewMode.current !== 1;
      body.current.position.set(player.current[0], player.current[1] + (moving.current ? Math.abs(Math.sin(performance.now() * 0.012)) * 0.035 : 0), player.current[2]);
      // This model faces local +Z, so add π to keep its back toward the trailing camera.
      body.current.rotation.y = -facingYaw.current + Math.PI / 2;
    }

    globalPlayerPos[0] = player.current[0];
    globalPlayerPos[1] = player.current[2];
    globalCameraYaw = cameraYaw.current;
    globalCameraPitch = cameraPitch.current;
    globalFacingYaw = facingYaw.current;

    // --- Điều khiển Camera ---
    const wantedNear = viewMode.current === 1 ? (isInterior ? 0.2 : 0.35) : (isInterior ? 0.2 : OUTDOOR_CAMERA_NEAR);
    const wantedFar = viewMode.current === 1 ? (isInterior ? 400 : 1500) : (isInterior ? 400 : OUTDOOR_CAMERA_FAR);
    if (camera.near !== wantedNear || camera.far !== wantedFar) {
      camera.near = wantedNear;
      camera.far = wantedFar;
      camera.updateProjectionMatrix();
    }

    if (isTopDownView.current && isInterior) {
      const layout = getInteriorLayout(interiorState.buildingId);
      if (layout) {
        if (interiorState.buildingId.toLowerCase() === 'b8') {
          const center = layout.toWorld(64.7, -188.1);
          camera.position.set(center[0], 95, center[1]);
          // Đặt trục up theo -B8_EV để Bắc lên trên, Nam xuống dưới, Tây sang trái, Đông sang phải (khớp 100% sơ đồ)
          camera.up.set(-0.22663, 0, -0.97398);
          camera.lookAt(center[0], 0, center[1]);
        } else if (interiorState.buildingId.toLowerCase() === 'b11') {
          const center = layout.toWorld(65.8, -125.8);
          camera.position.set(center[0], 124, center[1]);
          // Đặt trục up theo -B11_EV để Bắc lên trên, Nam xuống dưới, Tây sang trái, Đông sang phải (khớp 100% sơ đồ B11)
          camera.up.set(-0.16885, 0, -0.98564);
          camera.lookAt(center[0], 0, center[1]);
        } else {
          const center = layout.toWorld(0, 20.0);
          camera.position.set(center[0], 90, center[1]);
          camera.up.set(Math.sin(layout.rotationY), 0, -Math.cos(layout.rotationY));
          camera.lookAt(center[0], 0, center[1]);
        }
        return;
      }
    }

    forward.set(Math.cos(cameraYaw.current), 0, Math.sin(cameraYaw.current));

    if (viewMode.current === 2 && !isInterior) {
      const ground = player.current[1];
      camera.up.set(0, 1, 0);
      camera.position.lerp(desiredCamera.set(player.current[0] - forward.x * 8, ground + 3.4, player.current[2] - forward.z * 8), 1 - Math.exp(-4 * dt));
      camera.lookAt(player.current[0], ground + 1.5, player.current[2]);
      return;
    }

    // Đảm bảo camera.up luôn là [0, 1, 0] khi ở góc nhìn thông thường (người thứ 3)
    camera.up.set(0, 1, 0);

    // Camera ngoài trời dùng near = 5 (chống nhấp nháy mặt đất, T03). Trong nhà camera chỉ cách nhân vật ~4 m
    // nên phải hạ near, nếu không nhân vật và tường gần bị cắt mất khỏi hình.
    if (viewMode.current === 1) {
      camera.position.set(player.current[0], player.current[1] + 1.6, player.current[2]);
      const cosPitch = Math.cos(cameraPitch.current);
      forward.set(Math.cos(cameraYaw.current) * cosPitch, Math.sin(cameraPitch.current), Math.sin(cameraYaw.current) * cosPitch);
      target.set(camera.position.x + forward.x, camera.position.y + forward.y, camera.position.z + forward.z);
      camera.lookAt(target);
    } else if (isInterior) {
      // Trong nội thất: camera sau vai hỗ trợ xoay nhìn ngang + ngước nhìn lên các tầng trên
      const pitch = cameraPitch.current;
      const cosP = Math.max(0.25, Math.cos(pitch));
      const sinP = Math.sin(pitch);
      const px = player.current[0];
      const py = player.current[1];
      const pz = player.current[2];
      const desiredDist = indoorDesiredDistance.current;
      const desiredHorizDist = desiredDist * cosP;
      const desiredCamX = px - forward.x * desiredHorizDist;
      const desiredCamZ = pz - forward.z * desiredHorizDist;

      // Kiểm tra giao đoạn thẳng 2D giữa nhân vật và camera với các đoạn tường đặc của tầng
      let minT = 1.0;
      const d1x = desiredCamX - px;
      const d1z = desiredCamZ - pz;
      const wallLines = currentFloorWallLines.current;

      for (let i = 0; i < wallLines.length; i++) {
        const line = wallLines[i];
        if (!line) continue;
        const d2x = line.p2x - line.p1x;
        const d2z = line.p2z - line.p1z;
        const cross = d1x * d2z - d1z * d2x;
        if (Math.abs(cross) < 1e-6) continue;

        const dx = line.p1x - px;
        const dz = line.p1z - pz;
        const t1 = (dx * d2z - dz * d2x) / cross;
        const t2 = (dx * d1z - dz * d1x) / cross;

        if (t1 > 0.05 && t1 < minT && t2 >= 0.0 && t2 <= 1.0) {
          minT = t1;
        }
      }

      // Kéo camera sát nhân vật nếu có tường chắn phía sau (giữ khoảng cách nhỏ nhất trong 0.3 s rồi mới nới ra)
      let targetDist = desiredDist;
      if (minT < 0.999) {
        targetDist = Math.max(0.45, minT * desiredDist - 0.28);
        wallCollisionHoldDist.current = targetDist;
        wallCollisionHoldTimer.current = 0.3;
      } else if (wallCollisionHoldTimer.current > 0) {
        wallCollisionHoldTimer.current -= dt;
        targetDist = Math.min(desiredDist, wallCollisionHoldDist.current);
      }

      const lerpSpeed = targetDist < indoorActualDistance.current ? 25 : 10;
      indoorActualDistance.current += (targetDist - indoorActualDistance.current) * (1 - Math.exp(-lerpSpeed * dt));

      const actualDist = indoorActualDistance.current;
      const horizDist = actualDist * cosP;
      const pivotY = py + 1.45;
      const camY = Math.max(py + 0.35, Math.min(py + 3.15, pivotY - sinP * actualDist));

      desiredCamera.set(
        px - forward.x * horizDist,
        camY,
        pz - forward.z * horizDist
      );
      camera.position.lerp(desiredCamera, 1 - Math.exp(-14 * dt));

      const lookDist = Math.max(4.0, actualDist);
      desiredLookAt.set(
        desiredCamera.x + forward.x * cosP * lookDist,
        desiredCamera.y + sinP * lookDist,
        desiredCamera.z + forward.z * cosP * lookDist
      );
      target.lerp(desiredLookAt, 1 - Math.exp(-16 * dt));
      camera.lookAt(target.x, target.y, target.z);
    } else {
      // Ngoài khuôn viên: camera góc nghiêng bình thường
      target.set(player.current[0], player.current[1] + 1.1, player.current[2]);
      desiredCamera.set(
        player.current[0] - forward.x * outdoorDistance.current,
        player.current[1] + 3.4,
        player.current[2] - forward.z * outdoorDistance.current
      );
      camera.position.lerp(desiredCamera, 1 - Math.exp(-6 * dt));
      camera.lookAt(target.x, target.y + 0.4, target.z);
    }

    // --- Kiểm tra tương tác và thông tin phòng (phát event sang UI) ---
    let interactive: InteractivePoint | null = null;
    let activeRoom: RoomArea | null = null;

    if (isInterior) {
      const layout = getInteriorLayout(interiorState.buildingId);
      if (layout) {
        interactive = layout.getNearInteractive(player.current[0], player.current[2], interiorState.floor);
        if (interactive?.type === 'interior-door' && Math.abs(player.current[1]) > 0.8) {
          interactive = null;
        }
        if (seatPromptVisible.current && !interactive) {
          interactive = {
            id: 'seat-406',
            type: 'interior-door',
            label: 'Ngồi vào máy (E)',
            buildingId: 'b11',
            worldPos: [player.current[0], player.current[2]],
            radius: 1.2,
          };
        }
        activeRoom = layout.getActiveRoom(player.current[0], player.current[2], interiorState.floor);
      }
    } else {
      interactive = getExteriorInteractive(player.current[0], player.current[2]);
    }

    currentInteractive.current = interactive;
    currentActiveRoom.current = activeRoom;

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
        <PlayerCharacter moving={moving} running={running} visible={viewMode.current !== 1} />
      </Suspense>
    </group>
  );
}
