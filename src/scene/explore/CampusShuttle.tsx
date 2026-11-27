import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, CatmullRomCurve3, PerspectiveCamera, SRGBColorSpace, Vector3, type Group } from 'three';
import { SHUTTLE_NARRATIONS, SHUTTLE_STOP_POS, SHUTTLE_WAYPOINTS } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { getGroundHeight } from '../walk/groundHeight';
import ContactShadow from './ContactShadow';

const BASE_SPEED_MPS = 11.5;

function createShuttleStopTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b3d91';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 240, 112);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('EIU SHUTTLE', 128, 54);
    ctx.font = '600 20px Arial, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('TRẠM XE ĐIỆN', 128, 92);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createMarqueeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('EIU CAMPUS TOUR', 128, 33);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function ShuttleWheel({ wheelRef, x, z }: { wheelRef: React.RefObject<Group>; x: number; z: number }) {
  return (
    <group ref={wheelRef} position={[x, 0.34, z]}>
      <mesh rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.22, 16]} />
        <meshStandardMaterial color="#18181b" roughness={0.85} />
      </mesh>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.21, 0.21, 0.23, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.08, 0.08, 0.24, 10]} />
        <meshStandardMaterial color="#0b3d91" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function CampusShuttle() {
  const shuttleRef = useRef<Group>(null);
  const wheel0Ref = useRef<Group>(null);
  const wheel1Ref = useRef<Group>(null);
  const wheel2Ref = useRef<Group>(null);
  const wheel3Ref = useRef<Group>(null);

  const { camera } = useThree();

  const curve = useMemo(() => {
    const pts = SHUTTLE_WAYPOINTS.map(([x, z]) => new Vector3(x, getGroundHeight(x, z), z));
    return new CatmullRomCurve3(pts, true, 'catmullrom', 0.35);
  }, []);

  const curveLength = useMemo(() => curve.getLength(), [curve]);
  const stopGroundY = useMemo(() => getGroundHeight(SHUTTLE_STOP_POS[0], SHUTTLE_STOP_POS[1]), []);
  const stopTex = useMemo(() => createShuttleStopTexture(), []);
  const marqueeTex = useMemo(() => createMarqueeTexture(), []);

  useEffect(() => () => {
    stopTex.dispose();
    marqueeTex.dispose();
  }, [stopTex, marqueeTex]);

  const posVec = useMemo(() => new Vector3(), []);
  const tanVec = useMemo(() => new Vector3(), []);
  const desiredCam = useMemo(() => new Vector3(), []);
  const desiredLook = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);

  const firstWp = SHUTTLE_WAYPOINTS[0] ?? [216.7, 2.1];
  const sim = useRef({
    t: 0.02,
    y: getGroundHeight(firstWp[0], firstWp[1]),
    wheelAngle: 0,
    lastSkipReq: 0,
    wasActive: false,
    telemetryTimer: 0,
    proximityTimer: 0,
    lastStopLandmark: '',
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const es = useExploreStore.getState();

    // Xử lý bấm "Điểm tiếp"
    if (es.shuttleSkipReq !== sim.current.lastSkipReq) {
      sim.current.lastSkipReq = es.shuttleSkipReq;
      const curIdx = SHUTTLE_NARRATIONS.findIndex((n) => sim.current.t >= n.tStart && sim.current.t < n.tEnd);
      const nextStop = SHUTTLE_NARRATIONS[(curIdx + 1) % SHUTTLE_NARRATIONS.length];
      if (nextStop) {
        sim.current.t = nextStop.tStart + 0.015;
      }
    }

    const mult = es.shuttleActive && es.shuttleSpeed === 4 ? 4 : 1;
    const speedMps = BASE_SPEED_MPS * mult;
    sim.current.t = (sim.current.t + (speedMps * dt) / curveLength) % 1;

    curve.getPointAt(sim.current.t, posVec);
    curve.getTangentAt(sim.current.t, tanVec);
    const targetY = getGroundHeight(posVec.x, posVec.z);
    sim.current.y += (targetY - sim.current.y) * Math.min(1, dt * 10);

    const yaw = Math.atan2(tanVec.x, tanVec.z);
    if (shuttleRef.current) {
      shuttleRef.current.position.set(posVec.x, sim.current.y, posVec.z);
      shuttleRef.current.rotation.y = yaw;
    }

    sim.current.wheelAngle += (speedMps * dt) / 0.34;
    const wa = sim.current.wheelAngle;
    if (wheel0Ref.current) wheel0Ref.current.rotation.x = wa;
    if (wheel1Ref.current) wheel1Ref.current.rotation.x = wa;
    if (wheel2Ref.current) wheel2Ref.current.rotation.x = wa;
    if (wheel3Ref.current) wheel3Ref.current.rotation.x = wa;

    // Kiểm tra người chơi ở gần trạm hoặc xe điện
    sim.current.proximityTimer += dt;
    if (sim.current.proximityTimer >= 0.2) {
      sim.current.proximityTimer = 0;
      const ws = useWalkStore.getState();
      if (ws.walkMode && !ws.interior && !es.shuttleActive) {
        const dShuttle = Math.hypot(ws.playerPos.x - posVec.x, ws.playerPos.z - posVec.z);
        const dStop = Math.hypot(ws.playerPos.x - SHUTTLE_STOP_POS[0], ws.playerPos.z - SHUTTLE_STOP_POS[1]);
        es.setNearbyShuttle(dShuttle <= 7 || dStop <= 5.5);
      } else {
        es.setNearbyShuttle(false);
      }
    }

    // Khi đang ngồi trên xe điện: điều khiển camera + cập nhật vị trí lên minimap + thuyết minh điểm đi qua
    if (es.shuttleActive) {
      sim.current.wasActive = true;
      camera.up.set(0, 1, 0);
      if ('fov' in camera) {
        const persCam = camera as PerspectiveCamera;
        const targetFov = es.shuttleCam === 'first' ? 56 : 48;
        if (Math.abs(persCam.fov - targetFov) > 0.05) {
          persCam.fov += (targetFov - persCam.fov) * Math.min(1, dt * 8);
          persCam.updateProjectionMatrix();
        }
      }

      if (es.shuttleCam === 'first') {
        desiredCam.set(
          posVec.x + tanVec.x * 1.15,
          sim.current.y + 1.85,
          posVec.z + tanVec.z * 1.15,
        );
        desiredLook.set(
          posVec.x + tanVec.x * 26,
          sim.current.y + 1.75,
          posVec.z + tanVec.z * 26,
        );
        camera.position.lerp(desiredCam, 1 - Math.exp(-14 * dt));
        lookTarget.lerp(desiredLook, 1 - Math.exp(-14 * dt));
      } else {
        desiredCam.set(
          posVec.x - tanVec.x * 8.2,
          sim.current.y + 3.8,
          posVec.z - tanVec.z * 8.2,
        );
        desiredLook.set(
          posVec.x + tanVec.x * 6,
          sim.current.y + 1.5,
          posVec.z + tanVec.z * 6,
        );
        camera.position.lerp(desiredCam, 1 - Math.exp(-7 * dt));
        lookTarget.lerp(desiredLook, 1 - Math.exp(-9 * dt));
      }
      camera.lookAt(lookTarget);

      sim.current.telemetryTimer += dt;
      if (sim.current.telemetryTimer >= 0.2) {
        sim.current.telemetryTimer = 0;
        const stop = SHUTTLE_NARRATIONS.find((n) => sim.current.t >= n.tStart && sim.current.t < n.tEnd) ?? SHUTTLE_NARRATIONS[0] ?? null;
        useWalkStore.getState().setPlayerPos({ x: posVec.x, z: posVec.z, y: sim.current.y, floor: null });
        es.setPlayerYaw(Math.atan2(tanVec.z, tanVec.x));
        es.setShuttleTelemetry(sim.current.t, stop ? { title: stop.title, text: stop.text } : null);
        if (stop && stop.landmarkId !== sim.current.lastStopLandmark) {
          sim.current.lastStopLandmark = stop.landmarkId;
          es.discoverPoi(stop.landmarkId);
        }
      }
    } else if (sim.current.wasActive) {
      sim.current.wasActive = false;
      sim.current.lastStopLandmark = '';
      // Đặt người chơi xuống cạnh xe an toàn về bên phải hướng xe chạy
      const sideX = posVec.x - tanVec.z * 3.2;
      const sideZ = posVec.z + tanVec.x * 3.2;
      es.requestTeleport([sideX, sideZ], Math.atan2(tanVec.z, tanVec.x));
    }
  });

  return (
    <group>
      {/* Trạm chờ xe điện cố định trên đại lộ Cổng chính */}
      <group position={[SHUTTLE_STOP_POS[0], stopGroundY, SHUTTLE_STOP_POS[1]]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[-1.4, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.6, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[1.4, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.6, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.65, 0]} castShadow>
          <boxGeometry args={[3.4, 0.14, 1.4]} />
          <meshStandardMaterial color="#0b3d91" roughness={0.45} />
        </mesh>
        <mesh position={[0, 2.1, 0.06]}>
          <planeGeometry args={[1.6, 0.78]} />
          <meshStandardMaterial map={stopTex} roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.1, -0.06]} rotation-y={Math.PI}>
          <planeGeometry args={[1.6, 0.78]} />
          <meshStandardMaterial map={stopTex} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[2.2, 0.12, 0.55]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
      </group>

      {/* Xe điện EIU thiết kế mới chạy theo tuyến kín */}
      <group ref={shuttleRef}>
        <ContactShadow radius={2.7} opacity={0.45} />

        {/* Sàn & khung gầm thấp */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.92, 0.24, 4.7]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
        {/* Sọc xanh EIU + đường chỉ vàng hai bên hông */}
        <mesh position={[0, 0.45, -0.1]}>
          <boxGeometry args={[1.95, 0.12, 4.4]} />
          <meshStandardMaterial color="#0b3d91" roughness={0.4} />
        </mesh>
        {/* Cản trước & cản sau */}
        <mesh position={[0, 0.34, 2.38]} castShadow>
          <boxGeometry args={[1.96, 0.16, 0.14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.34, -2.36]} castShadow>
          <boxGeometry args={[1.96, 0.16, 0.14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Mũi xe vát khí động học + lưới tản nhiệt */}
        <mesh position={[0, 0.72, 2.02]} castShadow>
          <boxGeometry args={[1.86, 0.48, 0.68]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.88, 1.98]} rotation-x={0.18} castShadow>
          <boxGeometry args={[1.82, 0.2, 0.65]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.66, 2.37]}>
          <boxGeometry args={[1.05, 0.24, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.71, 2.39]}>
          <boxGeometry args={[0.92, 0.03, 0.03]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.62, 2.39]}>
          <boxGeometry args={[0.92, 0.03, 0.03]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
        </mesh>

        {/* Đèn pha tròn trước & đèn hậu đỏ */}
        {([-0.68, 0.68] as const).map((lx) => (
          <group key={lx}>
            <mesh position={[lx, 0.69, 2.36]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.1, 0.1, 0.06, 12]} />
              <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.35} />
            </mesh>
            <mesh position={[lx, 0.62, -2.35]}>
              <boxGeometry args={[0.24, 0.12, 0.06]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.0} />
            </mesh>
          </group>
        ))}

        {/* Hốc vè chắn bùn trên 4 bánh */}
        {([-0.94, 0.94] as const).map((wx) =>
          ([1.55, -1.55] as const).map((wz) => (
            <mesh key={`fender-${wx}-${wz}`} position={[wx, 0.64, wz]}>
              <boxGeometry args={[0.24, 0.1, 0.76]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
          )),
        )}

        {/* Kính chắn gió nghiêng có viền đen & gương chiếu hậu */}
        <group position={[0, 1.48, 1.72]} rotation-x={-0.16}>
          <mesh>
            <boxGeometry args={[1.72, 0.82, 0.06]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.48} roughness={0.08} metalness={0.25} />
          </mesh>
          <mesh position={[-0.88, 0, 0]}>
            <boxGeometry args={[0.06, 0.84, 0.08]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.88, 0, 0]}>
            <boxGeometry args={[0.06, 0.84, 0.08]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
        <mesh position={[-1.02, 1.24, 1.78]}>
          <boxGeometry args={[0.08, 0.16, 0.1]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[1.02, 1.24, 1.78]}>
          <boxGeometry args={[0.08, 0.16, 0.1]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Bảng điều khiển & vô-lăng tài xế */}
        <mesh position={[-0.4, 0.96, 1.62]} rotation-x={-0.35}>
          <torusGeometry args={[0.16, 0.025, 6, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>

        {/* Mái che 2 lớp trắng-xanh + biển hiệu phát sáng trước trán xe */}
        <mesh position={[0, 2.08, -0.18]} castShadow>
          <boxGeometry args={[1.92, 0.1, 4.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.16, -0.18]} castShadow>
          <boxGeometry args={[1.76, 0.08, 4.15]} />
          <meshStandardMaterial color="#0b3d91" roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.1, 2.04]}>
          <boxGeometry args={[1.48, 0.24, 0.12]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 2.1, 2.11]}>
          <planeGeometry args={[1.38, 0.2]} />
          <meshBasicMaterial map={marqueeTex} />
        </mesh>

        {/* 6 cột mái & thanh vịn an toàn hai bên */}
        {([-0.88, 0.88] as const).map((x) =>
          ([1.62, -0.15, -2.0] as const).map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 1.32, z]} castShadow>
              <cylinderGeometry args={[0.036, 0.036, 1.5, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.4} />
            </mesh>
          )),
        )}
        {([-0.89, 0.89] as const).map((rx) => (
          <mesh key={`rail-${rx}`} position={[rx, 0.82, -0.55]}>
            <boxGeometry args={[0.04, 0.04, 3.3]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} />
          </mesh>
        ))}

        {/* 3 hàng ghế có tựa lưng + khung đỡ */}
        {([1.1, -0.08, -1.25] as const).map((z) => (
          <group key={z} position={[0, 0.66, z]}>
            <mesh position={[0, -0.09, 0]} castShadow>
              <boxGeometry args={[1.56, 0.12, 0.48]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.02, 0]} castShadow>
              <boxGeometry args={[1.54, 0.11, 0.46]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.28, -0.2]} rotation-x={-0.12} castShadow>
              <boxGeometry args={[1.54, 0.44, 0.1]} />
              <meshStandardMaterial color="#1e293b" roughness={0.65} />
            </mesh>
          </group>
        ))}

        {/* Bác tài xế (mũ lưỡi trai EIU) & 2 hành khách sinh viên */}
        <group position={[-0.4, 0.72, 1.1]}>
          <mesh position={[0, 0.28, 0]}>
            <capsuleGeometry args={[0.16, 0.3, 4, 8]} />
            <meshStandardMaterial color="#0b3d91" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color="#f1c27d" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.74, 0]}>
            <sphereGeometry args={[0.145, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.72, 0.12]} rotation-x={0.18}>
            <boxGeometry args={[0.18, 0.03, 0.12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
        </group>

        <group position={[0.4, 0.72, -0.08]}>
          <mesh position={[0, 0.27, 0]}>
            <capsuleGeometry args={[0.15, 0.28, 4, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.64, 0]}>
            <sphereGeometry args={[0.135, 10, 10]} />
            <meshStandardMaterial color="#f1c27d" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.72, -0.02]}>
            <sphereGeometry args={[0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshStandardMaterial color="#27272a" roughness={0.85} />
          </mesh>
        </group>

        <group position={[-0.35, 0.72, -1.25]}>
          <mesh position={[0, 0.27, 0]}>
            <capsuleGeometry args={[0.145, 0.28, 4, 8]} />
            <meshStandardMaterial color="#10b981" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.64, 0]}>
            <sphereGeometry args={[0.135, 10, 10]} />
            <meshStandardMaterial color="#e0ac69" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.72, -0.02]}>
            <sphereGeometry args={[0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#451a03" roughness={0.85} />
          </mesh>
        </group>

        {/* 4 bánh xe có mâm kim loại */}
        <ShuttleWheel wheelRef={wheel0Ref} x={-0.95} z={1.55} />
        <ShuttleWheel wheelRef={wheel1Ref} x={0.95} z={1.55} />
        <ShuttleWheel wheelRef={wheel2Ref} x={-0.95} z={-1.55} />
        <ShuttleWheel wheelRef={wheel3Ref} x={0.95} z={-1.55} />
      </group>
    </group>
  );
}
