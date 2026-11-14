import { useEffect, useMemo } from 'react';
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Matrix4,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
} from 'three';
import {
  B11_BOUNDS,
  B11_ROTATION_Y,
  B11_TREE_BEDS,
  b11ToWorld,
} from '../interior/layouts/b11';
import { FLOOR_HEIGHT } from '../../data';
import { safeMerge } from '../kit/geometryHelpers';

const UP_VEC = new Vector3(0, 1, 0);

function makeOrientedBox(
  u: number,
  v: number,
  y: number,
  w: number,
  h: number,
  d: number,
  extraYaw = 0
): BufferGeometry {
  const geo = new BoxGeometry(w, h, d);
  const nonIdx = geo.index ? geo.toNonIndexed() : geo;
  if (geo !== nonIdx) geo.dispose();
  const [wx, wz] = b11ToWorld(u, v);
  nonIdx.rotateY(B11_ROTATION_Y + extraYaw);
  nonIdx.translate(wx, y, wz);
  return nonIdx;
}

function makeStrutBetween(
  p1: [number, number, number],
  p2: [number, number, number],
  radius: number
): BufferGeometry {
  const a = new Vector3(p1[0], p1[1], p1[2]);
  const b = new Vector3(p2[0], p2[1], p2[2]);
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);

  const raw = new CylinderGeometry(radius, radius, len, 6);
  const geo = raw.index ? raw.toNonIndexed() : raw;
  if (raw !== geo) raw.dispose();

  const quat = new Quaternion().setFromUnitVectors(UP_VEC, dir.normalize());
  const mat = new Matrix4().compose(mid, quat, new Vector3(1, 1, 1));
  geo.applyMatrix4(mat);
  return geo;
}

function createBannerTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Nền đen viền đỏ rực (theo ảnh 5565f085)
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 18;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  const words = ['HUMANITY', 'COMMUNITY', 'CREATIVITY', 'SUSTAINABILITY'];
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Vẽ chữ dọc từng cụm giá trị cốt lõi EIU
  const slotHeight = (canvas.height - 80) / words.length;
  words.forEach((word, idx) => {
    const cy = 40 + slotHeight * (idx + 0.5);
    ctx.save();
    ctx.translate(canvas.width / 2, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '700 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(word, 0, 0);
    ctx.restore();
  });

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Chi tiết kiến trúc ngoài trời & ngóc ngách đặc trưng của Block 11:
 * - Bồn cây xây đá nổi, cây xanh có giàn cọc chống kim loại 4 chân & bụi hoa lan ý trắng ở 2 sân trong
 * - Băng ghế đá gắn dọc hàng hiên tầng trệt
 * - Tháp buồng thang máy vượt tầng có kim thu sét trên mái (ảnh 3bb3d9af)
 * - Lam chắn nắng 5 thanh trắng & viền lam xanh dương mép sàn tầng 2–4 (ảnh 2c912454)
 * - Dàn nóng máy lạnh áp tường tầng 4, 2 mái kính đón sảnh phía Nam & băng rôn EIU đứng (ảnh 5565f085)
 */
export default function Block11Details() {
  const bannerTexture = useMemo(() => createBannerTexture(), []);

  useEffect(() => {
    return () => {
      bannerTexture?.dispose();
    };
  }, [bannerTexture]);

  const geometries = useMemo(() => {
    const B = B11_BOUNDS;
    const stoneParts: BufferGeometry[] = [];
    const soilParts: BufferGeometry[] = [];
    const trunkParts: BufferGeometry[] = [];
    const crownParts: BufferGeometry[] = [];
    const lilyWhiteParts: BufferGeometry[] = [];
    const steelParts: BufferGeometry[] = [];
    const creamParts: BufferGeometry[] = [];
    const blueTrimParts: BufferGeometry[] = [];
    const whiteLouverParts: BufferGeometry[] = [];
    const roofCapParts: BufferGeometry[] = [];
    const glassCanopyParts: BufferGeometry[] = [];
    const acUnitParts: BufferGeometry[] = [];
    const signOrangeParts: BufferGeometry[] = [];

    // 1. Nền đá xám sân trong & thềm 5 cửa vào Block 11
    stoneParts.push(makeOrientedBox((8.2 + 61.3) * 0.5, (-132.3 - 120.4) * 0.5, 0.17, 53.1, 0.04, 11.9));
    stoneParts.push(makeOrientedBox((69.55 + 108.05) * 0.5, (-132.3 - 120.9) * 0.5, 0.17, 38.5, 0.04, 11.4));
    stoneParts.push(makeOrientedBox(31.0, -101.8, 0.17, 6.2, 0.05, 3.3));
    stoneParts.push(makeOrientedBox(88.0, -101.8, 0.17, 6.2, 0.05, 3.3));
    stoneParts.push(makeOrientedBox(57.2, -149.2, 0.17, 5.0, 0.05, 2.4));
    stoneParts.push(makeOrientedBox(122.8, -125.6, 0.17, 2.6, 0.05, 4.6));
    stoneParts.push(makeOrientedBox(0.2, -126.5, 0.17, 2.4, 0.05, 6.5));

    // 2. Bồn cây xây đá nổi + đất trồng + cây cao + giàn chống 4 chân + khóm lan ý trắng
    const treeOffsets = [-2.3, 2.3];
    for (const bed of B11_TREE_BEDS) {
      const cu = (bed.minU + bed.maxU) * 0.5;
      const cv = (bed.minV + bed.maxV) * 0.5;
      const lenU = bed.maxU - bed.minU;
      const lenV = bed.maxV - bed.minV;

      // Viền đá bồn cây cao 0.45 m trên nền 0.17 m
      stoneParts.push(makeOrientedBox(cu, bed.minV + 0.12, 0.39, lenU, 0.45, 0.24));
      stoneParts.push(makeOrientedBox(cu, bed.maxV - 0.12, 0.39, lenU, 0.45, 0.24));
      stoneParts.push(makeOrientedBox(bed.minU + 0.12, cv, 0.39, 0.24, 0.45, lenV - 0.48));
      stoneParts.push(makeOrientedBox(bed.maxU - 0.12, cv, 0.39, 0.24, 0.45, lenV - 0.48));
      soilParts.push(makeOrientedBox(cu, cv, 0.35, lenU - 0.48, 0.36, lenV - 0.48));

      for (const du of treeOffsets) {
        const tu = cu + du;
        const tv = cv;
        const [wx, wz] = b11ToWorld(tu, tv);

        // Thân cây cao vươn từ bồn tầng trệt lên tán ở tầng 4 (~14.75 m)
        const rawTrunk = new CylinderGeometry(0.11, 0.16, 11.8, 7);
        const trunk = rawTrunk.index ? rawTrunk.toNonIndexed() : rawTrunk;
        if (rawTrunk !== trunk) rawTrunk.dispose();
        trunk.translate(wx, 0.45 + 5.9, wz);
        trunkParts.push(trunk);

        // Tán lá 2 tầng xanh mát ngang tầm tầng 4
        const rawCrown1 = new CylinderGeometry(0.65, 1.45, 2.0, 8);
        const c1 = rawCrown1.index ? rawCrown1.toNonIndexed() : rawCrown1;
        if (rawCrown1 !== c1) rawCrown1.dispose();
        c1.translate(wx, 12.6, wz);
        crownParts.push(c1);

        const rawCrown2 = new CylinderGeometry(0.2, 1.0, 1.5, 8);
        const c2 = rawCrown2.index ? rawCrown2.toNonIndexed() : rawCrown2;
        if (rawCrown2 !== c2) rawCrown2.dispose();
        c2.translate(wx, 14.0, wz);
        crownParts.push(c2);

        // Giàn cọc chống thép 4 chân chụm vào thân cây (đặc trưng sân trong B11)
        const baseSpread = 0.85;
        const legOffsets: [number, number][] = [
          [-baseSpread, -baseSpread],
          [baseSpread, -baseSpread],
          [-baseSpread, baseSpread],
          [baseSpread, baseSpread],
        ];
        for (const [lu, lv] of legOffsets) {
          const [bx, bz] = b11ToWorld(tu + lu, tv + lv);
          steelParts.push(makeStrutBetween([bx, 0.52, bz], [wx, 2.8, wz], 0.032));
        }

        // Bụi cây bụi thấp & hoa lan ý trắng dưới gốc
        const shrub = makeOrientedBox(tu - 0.85, tv + 0.55, 0.68, 0.9, 0.35, 0.7, 0.3);
        crownParts.push(shrub);
        const flower = makeOrientedBox(tu + 0.8, tv - 0.5, 0.72, 0.25, 0.28, 0.25, 0.4);
        lilyWhiteParts.push(flower);
      }
    }

    // 3. Băng ghế đá built-in dọc 2 hàng cột sân trong (ảnh dbfc837a & 8bd13e20)
    const benchPositionsU = [13.5, 21.0, 29.5, 38.0, 46.5, 76.0, 84.5, 93.0, 101.5];
    for (const bu of benchPositionsU) {
      stoneParts.push(makeOrientedBox(bu, B.vCyN + 0.35, 0.58, 2.6, 0.14, 0.55));
      stoneParts.push(makeOrientedBox(bu - 0.95, B.vCyN + 0.35, 0.34, 0.2, 0.36, 0.45));
      stoneParts.push(makeOrientedBox(bu + 0.95, B.vCyN + 0.35, 0.34, 0.2, 0.36, 0.45));

      stoneParts.push(makeOrientedBox(bu, B.vCyS - 0.35, 0.58, 2.6, 0.14, 0.55));
      stoneParts.push(makeOrientedBox(bu - 0.95, B.vCyS - 0.35, 0.34, 0.2, 0.36, 0.45));
      stoneParts.push(makeOrientedBox(bu + 0.95, B.vCyS - 0.35, 0.34, 0.2, 0.36, 0.45));
    }

    // 4. Đường viền lam xanh dương mép sàn tầng 2–4 & lam che nắng 5 thanh trên hành lang sân trong
    for (let fl = 1; fl <= 3; fl++) {
      const slabY = fl * FLOOR_HEIGHT - 0.08;
      // Viền xanh dương đặc trưng ảnh 2c912454 & 3bb3d9af
      blueTrimParts.push(makeOrientedBox((8.2 + 61.3) * 0.5, B.vCyN, slabY, 53.1, 0.18, 0.08));
      blueTrimParts.push(makeOrientedBox((8.2 + 61.3) * 0.5, -120.4, slabY, 53.1, 0.18, 0.08));
      blueTrimParts.push(makeOrientedBox((64.95 + 115.35) * 0.5, B.vCyN, slabY, 50.4, 0.18, 0.08));
      blueTrimParts.push(makeOrientedBox((64.95 + 115.35) * 0.5, -120.9, slabY, 50.4, 0.18, 0.08));

      // Thanh lam chắn nắng 5 tầng ngang sát trần hành lang (ảnh dbfc837a & 6cec9508)
      const louverBaseY = (fl - 1) * FLOOR_HEIGHT + 2.55;
      for (let blade = 0; blade < 5; blade++) {
        const ly = louverBaseY + blade * 0.22;
        whiteLouverParts.push(makeOrientedBox((8.2 + 61.3) * 0.5, B.vCyN - 0.05, ly, 52.8, 0.04, 0.14));
        whiteLouverParts.push(makeOrientedBox((8.2 + 61.3) * 0.5, -120.35, ly, 52.8, 0.04, 0.14));
        whiteLouverParts.push(makeOrientedBox((69.55 + 115.35) * 0.5, B.vCyN - 0.05, ly, 45.5, 0.04, 0.14));
        whiteLouverParts.push(makeOrientedBox((69.55 + 108.05) * 0.5, -120.85, ly, 38.2, 0.04, 0.14));
      }
    }

    // Lam chắn nắng cho tầng 4
    for (let blade = 0; blade < 5; blade++) {
      const ly = 3 * FLOOR_HEIGHT + 2.55 + blade * 0.22;
      whiteLouverParts.push(makeOrientedBox((8.2 + 61.3) * 0.5, B.vCyN - 0.05, ly, 52.8, 0.04, 0.14));
      whiteLouverParts.push(makeOrientedBox((8.2 + 61.3) * 0.5, -120.35, ly, 52.8, 0.04, 0.14));
      whiteLouverParts.push(makeOrientedBox((69.55 + 115.35) * 0.5, B.vCyN - 0.05, ly, 45.5, 0.04, 0.14));
      whiteLouverParts.push(makeOrientedBox((69.55 + 108.05) * 0.5, -120.85, ly, 38.2, 0.04, 0.14));
    }

    // 5. Tháp giếng thang máy vượt tầng + nắp mái chìa + kim thu sét trên nóc B11 (ảnh 3bb3d9af)
    const roofY = 4 * FLOOR_HEIGHT; // 15.2 m
    const elevCu = (B.uBridgeE + B.uElevE) * 0.5;
    const elevCv = -127.0;
    creamParts.push(makeOrientedBox(elevCu, elevCv, roofY + 2.2, 4.6, 4.4, 4.0));
    roofCapParts.push(makeOrientedBox(elevCu, elevCv, roofY + 4.55, 5.2, 0.3, 4.6));
    const [rodX, rodZ] = b11ToWorld(elevCu, elevCv);
    steelParts.push(makeStrutBetween([rodX, roofY + 4.7, rodZ], [rodX, roofY + 8.0, rodZ], 0.045));

    // 6. Cụm dàn nóng điều hòa áp góc sân trong tầng 4 (ảnh 2c912454)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        acUnitParts.push(
          makeOrientedBox(112.4 + col * 1.15, -121.35, 3 * FLOOR_HEIGHT + 1.1 + row * 1.05, 0.9, 0.72, 0.45)
        );
      }
    }

    // 7. Hai mái kính đón sảnh phía Nam + thanh giằng thép + biển cam "Block 11" (ảnh 5565f085)
    for (const cu of [31.0, 88.0]) {
      const canopyV = B.vSOut + 1.3;
      glassCanopyParts.push(makeOrientedBox(cu, canopyV, 3.65, 5.4, 0.08, 2.5));
      steelParts.push(makeOrientedBox(cu - 2.65, canopyV, 3.65, 0.1, 0.14, 2.55));
      steelParts.push(makeOrientedBox(cu + 2.65, canopyV, 3.65, 0.1, 0.14, 2.55));
      steelParts.push(makeOrientedBox(cu, B.vSOut + 2.52, 3.65, 5.4, 0.14, 0.1));

      // Thanh giằng treo chéo từ tường tầng 2 xuống mép ngoài mái kính
      for (const side of [-2.2, 2.2]) {
        const [aX, aZ] = b11ToWorld(cu + side, B.vSOut + 0.05);
        const [bX, bZ] = b11ToWorld(cu + side, B.vSOut + 2.3);
        steelParts.push(makeStrutBetween([aX, 5.2, aZ], [bX, 3.72, bZ], 0.035));
      }

      // Biển tên cam "TÒA NHÀ SỐ 11 / Block 11" cạnh cửa sảnh
      signOrangeParts.push(makeOrientedBox(cu - 3.3, B.vSOut + 0.06, 2.15, 0.55, 0.75, 0.06));
    }

    return {
      stoneGeo: safeMerge(stoneParts),
      soilGeo: safeMerge(soilParts),
      trunkGeo: safeMerge(trunkParts),
      crownGeo: safeMerge(crownParts),
      lilyGeo: safeMerge(lilyWhiteParts),
      steelGeo: safeMerge(steelParts),
      creamGeo: safeMerge(creamParts),
      blueTrimGeo: safeMerge(blueTrimParts),
      whiteLouverGeo: safeMerge(whiteLouverParts),
      roofCapGeo: safeMerge(roofCapParts),
      glassCanopyGeo: safeMerge(glassCanopyParts),
      acUnitGeo: safeMerge(acUnitParts),
      signOrangeGeo: safeMerge(signOrangeParts),
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geo) => geo?.dispose());
    };
  }, [geometries]);

  const bannerPos = useMemo(() => b11ToWorld(59.8, B11_BOUNDS.vSOut + 0.25), []);

  return (
    <group>
      {geometries.stoneGeo && (
        <mesh geometry={geometries.stoneGeo} receiveShadow castShadow>
          <meshStandardMaterial color="#b8bcc2" roughness={0.85} />
        </mesh>
      )}
      {geometries.soilGeo && (
        <mesh geometry={geometries.soilGeo} receiveShadow>
          <meshStandardMaterial color="#4a3728" roughness={0.95} />
        </mesh>
      )}
      {geometries.trunkGeo && (
        <mesh geometry={geometries.trunkGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#6d4c3d" roughness={0.9} />
        </mesh>
      )}
      {geometries.crownGeo && (
        <mesh geometry={geometries.crownGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#2f7d44" flatShading roughness={0.85} />
        </mesh>
      )}
      {geometries.lilyGeo && (
        <mesh geometry={geometries.lilyGeo} castShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      )}
      {geometries.steelGeo && (
        <mesh geometry={geometries.steelGeo} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.28} />
        </mesh>
      )}
      {geometries.creamGeo && (
        <mesh geometry={geometries.creamGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d8d1c5" flatShading roughness={0.78} />
        </mesh>
      )}
      {geometries.blueTrimGeo && (
        <mesh geometry={geometries.blueTrimGeo}>
          <meshStandardMaterial color="#0284c7" roughness={0.45} />
        </mesh>
      )}
      {geometries.whiteLouverGeo && (
        <mesh geometry={geometries.whiteLouverGeo} castShadow>
          <meshStandardMaterial color="#f1f5f9" roughness={0.55} />
        </mesh>
      )}
      {geometries.roofCapGeo && (
        <mesh geometry={geometries.roofCapGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#8d9196" flatShading roughness={0.65} />
        </mesh>
      )}
      {geometries.glassCanopyGeo && (
        <mesh geometry={geometries.glassCanopyGeo}>
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.45} roughness={0.15} metalness={0.2} />
        </mesh>
      )}
      {geometries.acUnitGeo && (
        <mesh geometry={geometries.acUnitGeo} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.15} />
        </mesh>
      )}
      {geometries.signOrangeGeo && (
        <mesh geometry={geometries.signOrangeGeo}>
          <meshStandardMaterial color="#ea580c" roughness={0.4} />
        </mesh>
      )}

      {/* Băng rôn giá trị cốt lõi EIU dọc mặt tiền Nam Block 11 (ảnh 5565f085) */}
      {bannerTexture && (
        <mesh position={[bannerPos[0], 9.4, bannerPos[1]]} rotation-y={B11_ROTATION_Y} castShadow>
          <boxGeometry args={[2.1, 9.0, 0.08]} />
          <meshStandardMaterial map={bannerTexture} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}
