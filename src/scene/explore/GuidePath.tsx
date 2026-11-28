import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  ExtrudeGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
} from 'three';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { getGroundHeight } from '../walk/groundHeight';
import { resolveActiveGuideRoute } from './missionGuideResolver';

const MAX_DASHES = 120;
const OUTDOOR_DASH_STEP = 3.2;
const INDOOR_DASH_STEP = 1.65;
const NO_RAYCAST = () => undefined;

const COLOR_TARGET_BASE = new Color('#fde047');
const COLOR_TARGET_EMISSIVE = new Color('#f59e0b');
const COLOR_TRANSIT_BASE = new Color('#7dd3fc');
const COLOR_TRANSIT_EMISSIVE = new Color('#0284c7');

/** Tạo mũi tên chữ V (chevron) 3D mỏng, mũi nhọn hướng theo trục +Z sau khi xoay nằm ngang. */
function createChevronGeometry(): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(0, 0.44);
  shape.lineTo(0.56, -0.14);
  shape.lineTo(0.36, -0.32);
  shape.lineTo(0, 0.06);
  shape.lineTo(-0.36, -0.32);
  shape.lineTo(-0.56, -0.14);
  shape.closePath();

  const geo = new ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.055, 0);
  geo.computeVertexNormals();
  return geo;
}

/** Tạo mũi tên 3D nổi lơ lửng phía trên nhân vật, mũi nhọn hướng theo +Z. */
function createPointerArrowGeometry(): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(0, 0.42);
  shape.lineTo(0.32, -0.02);
  shape.lineTo(0.14, -0.02);
  shape.lineTo(0.14, -0.36);
  shape.lineTo(-0.14, -0.36);
  shape.lineTo(-0.14, -0.02);
  shape.lineTo(-0.32, -0.02);
  shape.closePath();

  const geo = new ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.016,
    bevelSegments: 1,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.035, 0);
  geo.computeVertexNormals();
  return geo;
}

export default function GuidePath() {
  const meshRef = useRef<InstancedMesh>(null);
  const pointerRef = useRef<Mesh>(null);
  const pointerYawRef = useRef(0);
  const hasPointerYawRef = useRef(false);
  const dummy = useMemo(() => new Object3D(), []);
  const mat4 = useMemo(() => new Matrix4(), []);

  const chevronGeo = useMemo(() => createChevronGeometry(), []);
  const pointerGeo = useMemo(() => createPointerArrowGeometry(), []);

  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#fde047',
        emissive: '#f59e0b',
        emissiveIntensity: 0.9,
        roughness: 0.28,
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  useEffect(() => {
    return () => {
      chevronGeo.dispose();
      pointerGeo.dispose();
      mat.dispose();
    };
  }, [chevronGeo, pointerGeo, mat]);

  useFrame((state, delta) => {
    const inst = meshRef.current;
    const pointer = pointerRef.current;
    if (!inst) return;

    const route = resolveActiveGuideRoute();
    if (!route || route.count < 2) {
      if (inst.count !== 0 || inst.visible) {
        inst.count = 0;
        inst.visible = false;
      }
      if (pointer && pointer.visible) {
        pointer.visible = false;
      }
      hasPointerYawRef.current = false;
      return;
    }

    const ws = useWalkStore.getState();
    const es = useExploreStore.getState();
    const isInterior = ws.interior !== null;

    // Tính tổng độ dài hành trình & kiểm tra đã tới nơi chưa
    let totalDist = 0;
    for (let i = 0; i < route.count - 1; i++) {
      const a = route.points[i];
      const b = route.points[i + 1];
      if (a && b) totalDist += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }

    if (route.isExplorePoi && ws.walkMode && !es.shuttleActive && totalDist <= route.arriveRadius) {
      const navTarget = es.navTarget;
      es.clearNavTarget();
      if (navTarget) {
        es.showToast({
          vi: `Đã tới nơi: ${navTarget.label.vi}`,
          en: `Arrived at: ${navTarget.label.en}`,
        });
      }
      inst.count = 0;
      inst.visible = false;
      if (pointer) pointer.visible = false;
      return;
    }

    if (totalDist < 1.35) {
      inst.count = 0;
      inst.visible = false;
      if (pointer) pointer.visible = false;
      return;
    }

    // Đổi màu giữa vàng ấm (tới phòng/đích) và xanh dương sáng (tới thang máy/cửa thoát)
    if (route.tone === 'transit') {
      mat.color.copy(COLOR_TRANSIT_BASE);
      mat.emissive.copy(COLOR_TRANSIT_EMISSIVE);
    } else {
      mat.color.copy(COLOR_TARGET_BASE);
      mat.emissive.copy(COLOR_TARGET_EMISSIVE);
    }

    const dashStep = isInterior ? INDOOR_DASH_STEP : OUTDOOR_DASH_STEP;
    const baseScale = isInterior ? 0.62 : 1.0;
    const startOffset = isInterior ? 0.95 : 1.6;
    const endTrim = isInterior ? 0.9 : 1.8;
    const elapsed = state.clock.elapsedTime;
    const phase = (elapsed * (isInterior ? 2.1 : 3.0)) % dashStep;

    let count = 0;
    let nextSampleDist = startOffset + phase;
    let accum = 0;

    for (let i = 0; i < route.count - 1 && count < MAX_DASHES; i++) {
      const a = route.points[i];
      const b = route.points[i + 1];
      if (!a || !b) continue;
      const segDx = b[0] - a[0];
      const segDz = b[1] - a[1];
      const segLen = Math.hypot(segDx, segDz);
      if (segLen < 0.05) continue;

      const ux = segDx / segLen;
      const uz = segDz / segLen;
      const yaw = Math.atan2(ux, uz);
      const segEnd = accum + segLen;

      while (nextSampleDist <= segEnd && nextSampleDist < totalDist - endTrim && count < MAX_DASHES) {
        const localD = nextSampleDist - accum;
        const px = a[0] + ux * localD;
        const pz = a[1] + uz * localD;
        const py = isInterior ? 0.06 : getGroundHeight(px, pz) + 0.16;
        const pulse = baseScale * (0.92 + 0.13 * Math.sin(elapsed * 5.2 - count * 0.65));

        dummy.position.set(px, py, pz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(pulse, 1, pulse);
        dummy.updateMatrix();
        mat4.copy(dummy.matrix);
        inst.setMatrixAt(count, mat4);
        count++;
        nextSampleDist += dashStep;
      }

      accum = segEnd;
    }

    inst.visible = count > 0;
    inst.count = count;
    inst.instanceMatrix.needsUpdate = true;

    // Mũi tên 3D nổi ngay phía trên đầu nhân vật, xoay mượt chỉ hướng chặng kế tiếp
    if (pointer) {
      const p0 = route.points[0];
      // Chọn điểm đích nhìn tới nằm cách nhân vật ít nhất 0.8 m dọc đường dẫn
      let aimX = p0 ? p0[0] : 0;
      let aimZ = p0 ? p0[1] : 0;
      for (let i = 1; i < route.count; i++) {
        const pt = route.points[i];
        if (!pt || !p0) continue;
        aimX = pt[0];
        aimZ = pt[1];
        if (Math.hypot(aimX - p0[0], aimZ - p0[1]) >= 0.8) break;
      }

      const showOverhead = (ws.walkMode || isInterior) && !es.shuttleActive && p0 !== undefined;
      if (showOverhead && p0) {
        const baseY = isInterior ? ws.playerPos.y : getGroundHeight(p0[0], p0[1]);
        const arrowY = baseY + 2.22 + Math.sin(elapsed * 4.2) * 0.08;
        // Tự ẩn mũi tên trên đầu nếu camera đang ở góc nhìn thứ nhất (FPS) rất sát đầu nhân vật
        const camDistSq =
          (state.camera.position.x - p0[0]) ** 2 +
          (state.camera.position.y - arrowY) ** 2 +
          (state.camera.position.z - p0[1]) ** 2;

        if (camDistSq < 1.35 * 1.35) {
          pointer.visible = false;
        } else {
          const adx = aimX - p0[0];
          const adz = aimZ - p0[1];
          const targetYaw = Math.atan2(adx, adz);
          if (!hasPointerYawRef.current) {
            pointerYawRef.current = targetYaw;
            hasPointerYawRef.current = true;
            pointer.position.set(p0[0], arrowY, p0[1]);
          } else {
            const safeDt = Math.min(delta, 0.05);
            let diff = targetYaw - pointerYawRef.current;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            pointerYawRef.current += diff * (1 - Math.exp(-10 * safeDt));

            const jumpDistSq =
              (p0[0] - pointer.position.x) ** 2 + (p0[1] - pointer.position.z) ** 2;
            if (jumpDistSq > 16) {
              pointer.position.set(p0[0], arrowY, p0[1]);
            } else {
              const posAlpha = 1 - Math.exp(-16 * safeDt);
              pointer.position.x += (p0[0] - pointer.position.x) * posAlpha;
              pointer.position.y += (arrowY - pointer.position.y) * posAlpha;
              pointer.position.z += (p0[1] - pointer.position.z) * posAlpha;
            }
          }
          pointer.rotation.set(0, pointerYawRef.current, 0);
          pointer.scale.setScalar(isInterior ? 0.82 : 1.0);
          pointer.visible = true;
        }
      } else {
        pointer.visible = false;
      }
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[chevronGeo, mat, MAX_DASHES]}
        visible={false}
        raycast={NO_RAYCAST}
        frustumCulled={false}
      />
      <mesh
        ref={pointerRef}
        geometry={pointerGeo}
        material={mat}
        visible={false}
        raycast={NO_RAYCAST}
      />
    </group>
  );
}
