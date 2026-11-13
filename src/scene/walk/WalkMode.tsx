import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { campus } from '../../data';
import { useWalkStore } from '../../store/useWalkStore';
import type { Vec2 } from '../../types';
import { isPointInPond } from '../zone1/pondLayout';

const WALK_SPEED = 5;
const RUN_SPEED = 12;
const PLAYER_RADIUS = 0.4;
const START: Vec2 = [245, -28];
const BRIDGES: readonly { start: Vec2; end: Vec2 }[] = [
  { start: [123, -72.6], end: [134.7, 38.4] },
  { start: [106.8, -70.8], end: [118.5, 40.1] },
];

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
  const player = useRef<[number, number, number]>([START[0], 0.6, START[1]]);
  const cameraYaw = useRef(Math.PI);
  const facingYaw = useRef(Math.PI);
  const distance = useRef(8);
  const moving = useRef(false);
  const running = useRef(false);
  const keys = useRef(new Set<string>());
  const resolvedPosition = useRef<Vec2>([START[0], START[1]]);
  const isDragging = useRef(false);
  const previousPointerX = useRef(0);
  const body = useRef<Group>(null);
  const target = useMemo(() => new Vector3(), []);
  const desiredCamera = useMemo(() => new Vector3(), []);
  const forward = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) event.preventDefault();
      keys.current.add(key);
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
      resolvePosition(player.current[0] + dx * speed * dt, player.current[2] + dz * speed * dt, player.current[0], player.current[2], resolvedPosition.current);
      player.current[0] = resolvedPosition.current[0];
      player.current[2] = resolvedPosition.current[1];
      const targetFacingYaw = Math.atan2(dz, dx);
      const yawDifference = Math.atan2(Math.sin(targetFacingYaw - facingYaw.current), Math.cos(targetFacingYaw - facingYaw.current));
      facingYaw.current += yawDifference * (1 - Math.exp(-10 * dt));
    }
    if (body.current) {
      body.current.position.set(player.current[0], player.current[1] + (moving.current ? Math.sin(performance.now() * 0.012) * 0.035 : 0), player.current[2]);
      // The character's front points along local -Z; face it toward movement, away from the trailing camera.
      body.current.rotation.y = -facingYaw.current - Math.PI / 2;
    }
    target.set(player.current[0], player.current[1] + 1.1, player.current[2]);
    forward.set(Math.cos(cameraYaw.current), 0, Math.sin(cameraYaw.current));
    desiredCamera.set(player.current[0] - forward.x * distance.current, player.current[1] + 3.4, player.current[2] - forward.z * distance.current);
    camera.position.lerp(desiredCamera, 1 - Math.exp(-4 * dt));
    camera.lookAt(target.x, target.y + 0.4, target.z);
  });

  return (
    <group ref={body}>
      <mesh position={[0, 0.69, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.75, 4, 8]} />
        <meshStandardMaterial color="#1d4f91" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.37, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#e8bc98" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.57, 0.02]} castShadow>
        <sphereGeometry args={[0.225, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshStandardMaterial color="#263238" roughness={0.9} />
      </mesh>
    </group>
  );
}
