import { useEffect, useMemo, useState } from 'react';
import { Sky } from '@react-three/drei';
import {
  Shape,
  Path,
  ExtrudeGeometry,
  BoxGeometry,
  BufferGeometry,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useWalkStore } from '../../store/useWalkStore';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { getInteriorLayout } from './layouts';
import { b3Layout } from './layouts/b3';
import { B11_BOUNDS } from './layouts/b11';
import { getFloorDoors } from './layouts/b8';
import InteriorFurniture, { getLocalFacingYaw } from './InteriorFurniture';
import SalixAlbaTrees, { type SalixAlbaInstance } from '../trees/SalixAlbaTrees';
import ClassroomNpcs from '../npc/ClassroomNpcs';
import Lesson406 from '../lesson/Lesson406';

function makeOrientedLocalBox(
  toWorld: (u: number, v: number) => Vec2,
  cu: number,
  cv: number,
  cy: number,
  wU: number,
  hY: number,
  wV: number
): BufferGeometry {
  const [x0, z0] = toWorld(0, 0);
  const [x1, z1] = toWorld(1, 0);
  const [wx, wz] = toWorld(cu, cv);
  const box = new BoxGeometry(wU, hY, wV);
  box.rotateY(-Math.atan2(z1 - z0, x1 - x0));
  box.translate(wx, cy, wz);
  return box;
}

function mergeAndDispose(geos: BufferGeometry[]): BufferGeometry | null {
  if (geos.length === 0) return null;
  const merged = BufferGeometryUtils.mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}

/** Đóng tường spandrel dưới chiếu nghỉ, vách ngăn hông lối đi và vách kính lấy sáng tầng trệt ở 2 khoang thang giữa Block 11. */
function addB11StairwellOuterClosure(
  solidGeos: BufferGeometry[],
  glassGeos: BufferGeometry[],
  toWorld: (u: number, v: number) => Vec2,
  dy: number
): void {
  for (const [vOut, vInnerLand] of [
    [B11_BOUNDS.vNOut, -144.8],
    [B11_BOUNDS.vSOut, -108.1],
  ] as const) {
    // Tường spandrel dưới chiếu nghỉ phía sau vế 1 (chừa trống lối thông u=55.6..58.8 dưới vế 2)
    solidGeos.push(makeOrientedLocalBox(toWorld, 60.0, vOut, dy + 1.08, 2.4, 2.16, 0.24));
    // Vách ngăn dọc dưới chiếu nghỉ tách gầm vế 1 với lối đi thông hướng B4/B8
    const midV = (vOut + vInnerLand) * 0.5;
    const spanV = Math.abs(vOut - vInnerLand);
    solidGeos.push(makeOrientedLocalBox(toWorld, 58.55, midV, dy + 1.06, 0.22, 2.12, spanV));
    // Vách kính lấy sáng tầng trệt phía trên chiếu nghỉ và lối thông
    glassGeos.push(makeOrientedLocalBox(toWorld, 58.4, vOut, dy + 3.02, 5.6, 1.56, 0.06));
  }
}

/** Cảnh quan khuôn viên bên ngoài cửa thoát B4/B8 để nhìn xuyên qua buồng thang giữa không bị khoảng trắng trống. */
function buildB11ExteriorBackdrop(toWorld: (u: number, v: number) => Vec2, groundY: number) {
  const grassGeos = [
    makeOrientedLocalBox(toWorld, 60, -168, groundY - 0.14, 140, 0.1, 40),
    makeOrientedLocalBox(toWorld, 60, -83.5, groundY - 0.14, 140, 0.1, 40),
  ];
  const pathGeos = [
    makeOrientedLocalBox(toWorld, 57.2, -157.5, groundY - 0.05, 4.2, 0.08, 19.0),
    makeOrientedLocalBox(toWorld, 57.2, -94.0, groundY - 0.05, 4.2, 0.08, 19.0),
    makeOrientedLocalBox(toWorld, 60, -149.2, groundY - 0.05, 120, 0.08, 2.4),
    makeOrientedLocalBox(toWorld, 60, -102.2, groundY - 0.05, 120, 0.08, 2.6),
  ];
  const facadeGeos = [
    makeOrientedLocalBox(toWorld, 60, -172, groundY + 6.0, 68, 12, 6),
    makeOrientedLocalBox(toWorld, 60, -79, groundY + 6.0, 68, 12, 6),
  ];
  const extSalixTrees: SalixAlbaInstance[] = [];
  const backdropSpots: readonly [number, number][] = [
    [53.2, -153],
    [61.4, -154.5],
    [53.5, -161],
    [61.0, -162],
    [53.2, -98],
    [61.4, -96.5],
    [53.5, -90],
    [61.0, -89],
  ];
  backdropSpots.forEach(([tu, tv], idx) => {
    const [wx, wz] = toWorld(tu, tv);
    extSalixTrees.push({
      x: wx,
      y: groundY - 0.1,
      z: wz,
      rotY: (idx * 1.61) % (Math.PI * 2),
      scaleXZ: 0.78,
      scaleY: 0.8 + (idx % 3) * 0.06,
    });
  });
  return {
    extGrassGeo: mergeAndDispose(grassGeos),
    extPathGeo: mergeAndDispose(pathGeos),
    extFacadeGeo: mergeAndDispose(facadeGeos),
    extSalixTrees,
  };
}

/** Dựng hình học bản sàn từ đa giác biên + các lỗ khoét giếng trời trong mặt phẳng (x, z). */
function buildSlabGeometry(
  boundaryPts: readonly Vec2[],
  holesPts: readonly (readonly Vec2[])[],
  depth: number,
  yBottom: number
): BufferGeometry | null {
  if (boundaryPts.length < 3) return null;
  const shape = new Shape();
  boundaryPts.forEach(([x, z], i) => {
    if (i === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();

  for (const holePts of holesPts) {
    if (holePts.length < 3) continue;
    const holePath = new Path();
    holePts.forEach(([hx, hz], hi) => {
      if (hi === 0) holePath.moveTo(hx, -hz);
      else holePath.lineTo(hx, -hz);
    });
    holePath.closePath();
    shape.holes.push(holePath);
  }

  const extrude = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  extrude.rotateX(-Math.PI / 2);
  extrude.translate(0, yBottom, 0);
  return extrude;
}

export default function InteriorScene() {
  const interior = useWalkStore((s) => s.interior);
  const buildingId = interior?.buildingId ?? 'b3';
  const floor = interior?.floor ?? 1;
  const [isTopDown, setIsTopDown] = useState(false);

  useEffect(() => {
    setIsTopDown(false);
  }, [buildingId]);

  useEffect(() => {
    const onTopDown = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      setIsTopDown(Boolean(detail?.enabled));
    };
    window.addEventListener('campussim:topdown-camera', onTopDown);
    return () => window.removeEventListener('campussim:topdown-camera', onTopDown);
  }, []);

  const layout = useMemo(() => getInteriorLayout(buildingId) ?? b3Layout, [buildingId]);
  const isB8 = buildingId.toLowerCase() === 'b8';
  const isB11 = buildingId.toLowerCase() === 'b11';
  const isB6 = buildingId.toLowerCase() === 'b6';
  const isTwinWing = isB8 || isB11;
  const isMultiFloor = isB8 || isB11 || isB6;

  // 1. Sàn tầng hiện tại (y = -0.15 .. 0)
  const floorGeometry = useMemo(() => {
    const floorPtsWorld: Vec2[] = layout.getFloorBoundaryPts(floor);
    const holesWorld = layout.getFloorHoles ? layout.getFloorHoles(floor) : [];
    return buildSlabGeometry(floorPtsWorld, holesWorld, 0.15, -0.15);
  }, [layout, floor]);

  useEffect(() => {
    return () => {
      floorGeometry?.dispose();
    };
  }, [floorGeometry]);

  // Sàn hội trường B3 bên dưới khi nhìn từ tầng 3
  const auditoriumFloorGeometry = useMemo(() => {
    if (buildingId.toLowerCase() !== 'b3' || floor !== 3) return null;

    const voidPtsWorld: Vec2[] = [
      layout.toWorld(-72, 12),
      layout.toWorld(-18, 12),
      layout.toWorld(-18, 40.1),
      layout.toWorld(-72, 40.1),
    ];

    const shape = new Shape();
    voidPtsWorld.forEach(([x, z], i) => {
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();

    const extrude = new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
    extrude.rotateX(-Math.PI / 2);
    extrude.translate(0, -FLOOR_HEIGHT - 0.1, 0);
    return extrude;
  }, [layout, floor, buildingId]);

  // Nền lát đá sân trong (B8 & B11 đều dùng trực tiếp bản sàn tầng 1 của multiFloorB11)
  const b8CourtyardGroundGeometry = null as BufferGeometry | null;

  // Các tầng còn lại (1–4 trừ tầng đang đứng) & mái chìa sân trong Block 11 / Block 8
  // Giúp đứng ở Tầng 1 nhìn lên vẫn thấy đủ Tầng 2, 3, 4 + mái; ẩn tầng trên khi bật C (nhìn từ trên xuống)
  const multiFloorB11 = useMemo(() => {
    if (!isMultiFloor) {
      return {
        otherFloorsGeo: null,
        otherSolidWallsGeo: null,
        otherGlassWallsGeo: null,
        roofOverhangGeo: null,
        elevatorTowerGeo: null,
        extGrassGeo: null,
        extPathGeo: null,
        extFacadeGeo: null,
        extSalixTrees: [] as SalixAlbaInstance[],
      };
    }

    const slabGeos: BufferGeometry[] = [];
    const solidGeos: BufferGeometry[] = [];
    const glassGeos: BufferGeometry[] = [];

    for (let otherF = 1; otherF <= layout.floors; otherF++) {
      if (otherF === floor) continue;
      if (isTopDown && otherF > floor) continue;

      const dy = (otherF - floor) * FLOOR_HEIGHT;
      const boundaryPts = layout.getFloorBoundaryPts(otherF);
      const holePts = layout.getFloorHoles ? layout.getFloorHoles(otherF) : [];
      const slabGeo = buildSlabGeometry(boundaryPts, holePts, 0.18, dy - 0.18);
      if (slabGeo) slabGeos.push(slabGeo);

      const walls = layout.getFloorWalls(otherF);
      for (const wall of walls) {
        if (wall.isRailing) continue;
        const [x1, z1] = layout.toWorld(wall.u1, wall.v1);
        const [x2, z2] = layout.toWorld(wall.u2, wall.v2);
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.hypot(dx, dz);
        if (length < 0.05) continue;

        const midX = (x1 + x2) / 2;
        const midZ = (z1 + z2) / 2;
        const angle = -Math.atan2(dz, dx);

        if (wall.isGlass) {
          const glassH = isB8 ? 1.5 : FLOOR_HEIGHT - 0.2;
          const glassCenterY = isB8 ? dy + 1.7 : dy + FLOOR_HEIGHT / 2;
          const glassThick = isB8 ? 0.04 : 0.06;
          const glassBox = new BoxGeometry(length, glassH, glassThick);
          glassBox.rotateY(angle);
          glassBox.translate(midX, glassCenterY, midZ);
          glassGeos.push(glassBox);
        } else {
          const wallBox = new BoxGeometry(length, FLOOR_HEIGHT, wall.thickness);
          wallBox.rotateY(angle);
          wallBox.translate(midX, dy + FLOOR_HEIGHT / 2, midZ);
          solidGeos.push(wallBox);
        }
      }

      if (isB11 && otherF === 1) {
        addB11StairwellOuterClosure(solidGeos, glassGeos, layout.toWorld, dy);
      }

      if (isB8) {
        const b8Doors = getFloorDoors(otherF);
        const lintelHeight = FLOOR_HEIGHT - 2.2;
        const lintelCenterY = dy + 2.2 + lintelHeight / 2;
        for (const d of b8Doors) {
          const [x1, z1] = layout.toWorld(d.u1, d.v);
          const [x2, z2] = layout.toWorld(d.u2, d.v);
          const dx = x2 - x1;
          const dz = z2 - z1;
          const length = Math.hypot(dx, dz);
          if (length < 0.05) continue;
          const midX = (x1 + x2) / 2;
          const midZ = (z1 + z2) / 2;
          const angle = -Math.atan2(dz, dx);

          const lintelBox = new BoxGeometry(length, lintelHeight, 0.2);
          lintelBox.rotateY(angle);
          lintelBox.translate(midX, lintelCenterY, midZ);
          solidGeos.push(lintelBox);
        }
      }
    }

    let roofOverhangGeo: BufferGeometry | null = null;
    let elevatorTowerGeo: BufferGeometry | null = null;

    if (!isTopDown) {
      const roofY = (layout.floors + 1 - floor) * FLOOR_HEIGHT;
      if (isB11) {
        const B = B11_BOUNDS;
        const roofOuterPts: Vec2[] = [
          layout.toWorld(B.uNwOut - 0.5, B.vNOut - 0.5),
          layout.toWorld(B.uNeOut + 0.5, B.vNOut - 0.5),
          layout.toWorld(B.uNeOut + 0.5, B.vCyN + 1.5),
          layout.toWorld(B.uEMainOut + 0.5, B.vCyN + 1.5),
          layout.toWorld(B.uEMainOut + 0.5, B.vSOut + 0.5),
          layout.toWorld(B.uWOut - 0.5, B.vSOut + 0.5),
          layout.toWorld(B.uWOut - 0.5, B.vCyN + 1.5),
          layout.toWorld(B.uNwOut - 0.5, B.vCyN + 1.5),
        ];
        // Hai ô giếng trời trên mái chừa phần mái chìa 1.5 m quanh hành lang tầng 4 & cầu nối giữa
        const roofHolesPts: Vec2[][] = [
          [
            layout.toWorld(9.7, -130.8),
            layout.toWorld(59.8, -130.8),
            layout.toWorld(59.8, -122.1),
            layout.toWorld(9.7, -122.1),
          ],
          [
            layout.toWorld(69.55, -130.8),
            layout.toWorld(113.85, -130.8),
            layout.toWorld(113.85, -122.1),
            layout.toWorld(69.55, -122.1),
          ],
        ];
        roofOverhangGeo = buildSlabGeometry(roofOuterPts, roofHolesPts, 0.34, roofY - 0.14);

        const towerCenter = layout.toWorld(67.25, -127.0);
        const yaw = getLocalFacingYaw(layout.toWorld, 0);
        const tower = new BoxGeometry(4.6, 3.0, 4.2);
        tower.rotateY(yaw);
        tower.translate(towerCenter[0], roofY + 1.5, towerCenter[1]);
        elevatorTowerGeo = tower;
      } else if (isB8) {
        const roofOuterPts: Vec2[] = [
          layout.toWorld(8.0, -211.2),
          layout.toWorld(121.4, -211.2),
          layout.toWorld(121.4, -165.0),
          layout.toWorld(8.0, -165.0),
        ];
        const roofHolesPts: Vec2[][] = [
          [
            layout.toWorld(14.7, -195.8),
            layout.toWorld(48.8, -195.8),
            layout.toWorld(48.8, -181.3),
            layout.toWorld(14.7, -181.3),
          ],
          [
            layout.toWorld(55.3, -195.3),
            layout.toWorld(113.7, -195.3),
            layout.toWorld(113.7, -180.8),
            layout.toWorld(55.3, -180.8),
          ],
        ];
        roofOverhangGeo = buildSlabGeometry(roofOuterPts, roofHolesPts, 0.34, roofY - 0.14);
      }
    }

    const otherFloorsGeo = slabGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(slabGeos) : null;
    const otherSolidWallsGeo = solidGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(solidGeos) : null;
    const otherGlassWallsGeo = glassGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(glassGeos) : null;

    slabGeos.forEach((g) => g.dispose());
    solidGeos.forEach((g) => g.dispose());
    glassGeos.forEach((g) => g.dispose());

    const ext = isB11
      ? buildB11ExteriorBackdrop(layout.toWorld, -(floor - 1) * FLOOR_HEIGHT)
      : {
          extGrassGeo: null,
          extPathGeo: null,
          extFacadeGeo: null,
          extSalixTrees: [] as SalixAlbaInstance[],
        };

    return {
      otherFloorsGeo,
      otherSolidWallsGeo,
      otherGlassWallsGeo,
      roofOverhangGeo,
      elevatorTowerGeo,
      ...ext,
    };
  }, [layout, floor, isB11, isB8, isMultiFloor, isTopDown]);

  useEffect(() => {
    return () => {
      multiFloorB11.otherFloorsGeo?.dispose();
      multiFloorB11.otherSolidWallsGeo?.dispose();
      multiFloorB11.otherGlassWallsGeo?.dispose();
      multiFloorB11.roofOverhangGeo?.dispose();
      multiFloorB11.elevatorTowerGeo?.dispose();
      multiFloorB11.extGrassGeo?.dispose();
      multiFloorB11.extPathGeo?.dispose();
      multiFloorB11.extFacadeGeo?.dispose();
    };
  }, [multiFloorB11]);

  // 2. Tường đặc và vách kính gộp theo tọa độ thế giới (B8 không có vách kính sân trong)
  const { solidWallsGeo, glassWallsGeo, baseboardsGeo } = useMemo(() => {
    const walls = layout.getFloorWalls(floor);
    const solidGeos: BufferGeometry[] = [];
    const glassGeos: BufferGeometry[] = [];
    const baseboardGeos: BufferGeometry[] = [];

    const wallHeight = FLOOR_HEIGHT;
    const baseboardHeight = 0.12;

    for (const wall of walls) {
      // Bỏ qua tường lan can vì đã được dựng bởi instancedMesh trong InteriorFurniture
      if (wall.isRailing) continue;

      const [x1, z1] = layout.toWorld(wall.u1, wall.v1);
      const [x2, z2] = layout.toWorld(wall.u2, wall.v2);

      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      if (length < 0.05) continue;

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const angle = -Math.atan2(dz, dx);

      if (wall.isGlass) {
        // Vách kính trong suốt (B3: toàn chiều cao; B8: ô cửa sổ y 0.95 → 2.45)
        const glassH = isB8 ? 1.5 : wallHeight - 0.2;
        const glassCenterY = isB8 ? 1.7 : wallHeight / 2;
        const glassThick = isB8 ? 0.04 : 0.06;
        const glassBox = new BoxGeometry(length, glassH, glassThick);
        glassBox.rotateY(angle);
        glassBox.translate(midX, glassCenterY, midZ);
        glassGeos.push(glassBox);

        if (!isB8) {
          const sillBox = new BoxGeometry(length, 0.08, 0.12);
          sillBox.rotateY(angle);
          sillBox.translate(midX, 0.04, midZ);
          baseboardGeos.push(sillBox);
        }
      } else {
        // Tường xây đặc
        const wallBox = new BoxGeometry(length, wallHeight, wall.thickness);
        wallBox.rotateY(angle);
        wallBox.translate(midX, wallHeight / 2, midZ);
        solidGeos.push(wallBox);

        // Len chân tường
        const baseBox = new BoxGeometry(length, baseboardHeight, wall.thickness + 0.04);
        baseBox.rotateY(angle);
        baseBox.translate(midX, baseboardHeight / 2, midZ);
        baseboardGeos.push(baseBox);
      }
    }

    if (isB11 && floor === 1) {
      addB11StairwellOuterClosure(solidGeos, glassGeos, layout.toWorld, 0);
    }

    // 2b. Lintel tường trên cửa phòng B8 (từ cao độ 2.2 m tới 3.8 m)
    if (isB8) {
      const b8Doors = getFloorDoors(floor);
      const lintelHeight = FLOOR_HEIGHT - 2.2; // 1.6 m
      const lintelCenterY = 2.2 + lintelHeight / 2; // 3.0 m
      for (const d of b8Doors) {
        const [x1, z1] = layout.toWorld(d.u1, d.v);
        const [x2, z2] = layout.toWorld(d.u2, d.v);
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.hypot(dx, dz);
        if (length < 0.05) continue;
        const midX = (x1 + x2) / 2;
        const midZ = (z1 + z2) / 2;
        const angle = -Math.atan2(dz, dx);

        const lintelBox = new BoxGeometry(length, lintelHeight, 0.2);
        lintelBox.rotateY(angle);
        lintelBox.translate(midX, lintelCenterY, midZ);
        solidGeos.push(lintelBox);
      }
    }

    const mergedSolid = solidGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(solidGeos) : null;
    const mergedGlass = glassGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(glassGeos) : null;
    const mergedBaseboards = baseboardGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(baseboardGeos) : null;

    solidGeos.forEach((g) => g.dispose());
    glassGeos.forEach((g) => g.dispose());
    baseboardGeos.forEach((g) => g.dispose());

    return {
      solidWallsGeo: mergedSolid,
      glassWallsGeo: mergedGlass,
      baseboardsGeo: mergedBaseboards,
    };
  }, [layout, floor, isB8, isB11]);

  // 3. Biển tên phòng nhỏ gắn tường
  const roomSigns = useMemo(() => {
    const rooms = layout.getFloorRooms(floor);
    const yaw = getLocalFacingYaw(layout.toWorld, 0);

    if (isB6) return [];
    return rooms
      .filter((r) => r.code.includes('.B') || r.code.startsWith('P.'))
      .map((room) => {
        const centerU = (room.minU + room.maxU) / 2;
        // Gắn ở mép hành lang
        const isNorth = isB11
          ? room.maxV <= -135.0
          : isB8
            ? room.maxV <= -200.0
            : room.minV === 0 || room.minV < 15;
        const edgeV = isNorth ? room.maxV : room.minV;
        const [worldX, worldZ] = layout.toWorld(centerU, edgeV);
        return {
          code: room.code,
          worldX,
          worldZ,
          yaw,
        };
      });
  }, [layout, floor, isB8, isB11, isB6]);

  // Tọa độ tâm tòa nhà để bố trí nguồn sáng
  const centerPos = useMemo(() => {
    if (isB11) return layout.toWorld(65.8, -125.8);
    if (isB8) return layout.toWorld(64.7, -188.1);
    if (isB6) return layout.toWorld(17.0, 24.0);
    return layout.toWorld(0, 20.0);
  }, [layout, isB8, isB11, isB6]);

  // Màu tường và sàn theo tài liệu thực tế của từng tòa
  const wallColor = isTwinWing ? '#42322c' : '#f8fafc'; // B8 & B11: nâu sẫm, B3: trắng sáng
  const baseboardColor = isTwinWing ? '#261e1b' : '#334155';
  const floorColor = isTwinWing ? '#cbd5e1' : isB6 ? '#475569' : '#f1f5f9'; // B8 & B11: gạch xám, B3: terrazzo sáng, B6: gạch xám đậm sảnh sang trọng

  return (
    <>
      <color attach="background" args={[isTwinWing ? '#8cc8f5' : '#0f172a']} />
      {isTwinWing && (
        <Sky
          distance={2000}
          sunPosition={[180, 160, 100]}
          turbidity={4}
          rayleigh={0.35}
          mieCoefficient={0.002}
          mieDirectionalG={0.8}
        />
      )}

      <group>
        {/* Chiếu sáng nội thất */}
        <ambientLight intensity={isTwinWing ? 0.8 : 0.8} color="#f8fafc" />
        {(isTwinWing || isB6) && <hemisphereLight args={['#e0f2fe', '#94a3b8', 0.85]} />}

        <directionalLight
          position={[centerPos[0] + 20, 45, centerPos[1] - 20]}
          intensity={isTwinWing ? 1.05 : 0.9}
          color="#fffbeb"
          castShadow={!isB6}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
          shadow-normalBias={0.03}
        />

      {!isB6 && <pointLight position={[centerPos[0], 3.5, centerPos[1]]} intensity={0.7} distance={35} color="#fef08a" />}
      {isB11 ? (
        <>
          {/* Đèn dọc 2 sân trong & cầu nối B11 */}
          <pointLight position={[layout.toWorld(34.7, -126.4)[0], 3.6, layout.toWorld(34.7, -126.4)[1]]} intensity={0.7} distance={42} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(90.0, -126.6)[0], 3.6, layout.toWorld(90.0, -126.6)[1]]} intensity={0.7} distance={42} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(63.1, -127.0)[0], 3.4, layout.toWorld(63.1, -127.0)[1]]} intensity={0.75} distance={20} color="#fffbeb" />
          <pointLight position={[layout.toWorld(118.4, -126.5)[0], 3.4, layout.toWorld(118.4, -126.5)[1]]} intensity={0.65} distance={24} color="#fffbeb" />
        </>
      ) : isB8 ? (
        <>
          {/* Đèn dọc 2 sân trong B8 */}
          <pointLight position={[layout.toWorld(31.7, -188.5)[0], 3.6, layout.toWorld(31.7, -188.5)[1]]} intensity={0.65} distance={30} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(84.5, -188.0)[0], 3.6, layout.toWorld(84.5, -188.0)[1]]} intensity={0.65} distance={35} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(53.5, -188.35)[0], 3.4, layout.toWorld(53.5, -188.35)[1]]} intensity={0.7} distance={15} color="#fffbeb" />
        </>
      ) : buildingId.toLowerCase() === 'b3' ? (
        <>
          <pointLight position={[layout.toWorld(16, 12)[0], 3.4, layout.toWorld(16, 12)[1]]} intensity={0.65} distance={20} color="#fef08a" />
          <pointLight position={[layout.toWorld(-20, 26)[0], 3.4, layout.toWorld(-20, 26)[1]]} intensity={0.55} distance={25} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(-50, 26)[0], 3.4, layout.toWorld(-50, 26)[1]]} intensity={0.55} distance={25} color="#e0f2fe" />
        </>
      ) : null}

      {/* 1. Mặt sàn thế giới */}
      {floorGeometry && (
        <mesh geometry={floorGeometry} receiveShadow>
          <meshStandardMaterial color={floorColor} roughness={0.45} metalness={0.05} />
        </mesh>
      )}

      {/* Sàn hội trường B3 nhìn từ tầng 3 */}
      {auditoriumFloorGeometry && (
        <mesh geometry={auditoriumFloorGeometry} receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      )}

      {/* Nền đá sân trong nhìn từ các tầng trên xuống */}
      {b8CourtyardGroundGeometry && (
        <mesh geometry={b8CourtyardGroundGeometry} receiveShadow>
          <meshStandardMaterial color={isB11 ? '#94a3b8' : '#c9c4bb'} roughness={0.7} />
        </mesh>
      )}

      {/* 2. Thân tường đặc */}
      {solidWallsGeo && (
        <mesh geometry={solidWallsGeo} castShadow receiveShadow>
          <meshStandardMaterial color={wallColor} roughness={0.85} flatShading />
        </mesh>
      )}

      {/* Len chân tường */}
      {baseboardsGeo && (
        <mesh geometry={baseboardsGeo} castShadow receiveShadow>
          <meshStandardMaterial color={baseboardColor} roughness={0.5} />
        </mesh>
      )}

      {/* 3. Vách kính trong suốt */}
      {glassWallsGeo && (
        <mesh geometry={glassWallsGeo}>
          <meshStandardMaterial
            color="#bae6fd"
            transparent
            opacity={0.35}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      )}

      {/* 2b. Kết cấu các tầng còn lại (nhìn lên thấy Tầng 2–4, mái chìa, tháp thang máy) */}
      {multiFloorB11.otherFloorsGeo && (
        <mesh geometry={multiFloorB11.otherFloorsGeo} receiveShadow>
          <meshStandardMaterial color={floorColor} roughness={0.55} />
        </mesh>
      )}
      {multiFloorB11.otherSolidWallsGeo && (
        <mesh geometry={multiFloorB11.otherSolidWallsGeo}>
          <meshStandardMaterial color={wallColor} roughness={0.85} flatShading />
        </mesh>
      )}
      {multiFloorB11.otherGlassWallsGeo && (
        <mesh geometry={multiFloorB11.otherGlassWallsGeo}>
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.35} roughness={0.1} metalness={0.2} />
        </mesh>
      )}
      {multiFloorB11.roofOverhangGeo && (
        <mesh geometry={multiFloorB11.roofOverhangGeo} receiveShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.65} />
        </mesh>
      )}
      {multiFloorB11.elevatorTowerGeo && (
        <mesh geometry={multiFloorB11.elevatorTowerGeo}>
          <meshStandardMaterial color="#d6cec2" roughness={0.72} />
        </mesh>
      )}
      {multiFloorB11.extGrassGeo && (
        <mesh geometry={multiFloorB11.extGrassGeo} receiveShadow>
          <meshStandardMaterial color="#65a30d" roughness={0.9} />
        </mesh>
      )}
      {multiFloorB11.extPathGeo && (
        <mesh geometry={multiFloorB11.extPathGeo} receiveShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.75} />
        </mesh>
      )}
      {multiFloorB11.extFacadeGeo && (
        <mesh geometry={multiFloorB11.extFacadeGeo}>
          <meshStandardMaterial color="#d6cec2" roughness={0.8} />
        </mesh>
      )}
      {isB11 && multiFloorB11.extSalixTrees.length > 0 && (
        <SalixAlbaTrees instances={multiFloorB11.extSalixTrees} castShadow={false} />
      )}

      {/* 4. Nội thất instancing */}
      <InteriorFurniture buildingId={buildingId} floor={floor} showUpperFloors={!isTopDown} />
      <ClassroomNpcs />
      <Lesson406 />

      {/* 5. Biển số phòng nhỏ gắn tường */}
      {roomSigns.map((sign, idx) => (
        <group key={idx} position={[sign.worldX, 2.3, sign.worldZ]} rotation-y={sign.yaw}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.35, 0.05]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.1, 0.25, 0.01]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.2} />
          </mesh>
        </group>
      ))}
      </group>
    </>
  );
}
