import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Object3D,
} from 'three';
import {
  createBenchGeometry,
  createBikeGeometry,
  createBinGeometry,
  createLampHeadGeometry,
  createLampPostGeometry,
  createSignGeometry,
  createSignTexture,
} from './streetGeometry';
import { getStreetLayout, type Placement } from './streetLayout';

interface StreetObjects {
  /** Mọi object để thêm vào cảnh (tối đa 6 draw call). */
  objects: Object3D[];
  geometries: BufferGeometry[];
  materials: Material[];
  dispose: () => void;
}

const NO_RAYCAST = () => undefined;

/** Dựng 1 InstancedMesh tĩnh từ danh sách vị trí (ma trận ghi một lần, không đụng tới useFrame). */
function instanced(
  geo: BufferGeometry,
  mat: Material,
  items: readonly Placement[],
  colorOf?: (i: number) => Color,
): InstancedMesh {
  const mesh = new InstancedMesh(geo, mat, Math.max(1, items.length));
  const dummy = new Object3D();
  const m = new Matrix4();
  items.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(0, p.yaw, 0);
    dummy.updateMatrix();
    m.copy(dummy.matrix);
    mesh.setMatrixAt(i, m);
    if (colorOf) mesh.setColorAt(i, colorOf(i));
  });
  mesh.count = items.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) (mesh.instanceColor as InstancedBufferAttribute).needsUpdate = true;
  mesh.computeBoundingSphere();
  // Vật trang trí không nhận click/hover: click vẫn xuống Ground.
  mesh.raycast = NO_RAYCAST;
  return mesh;
}

function createStreetObjects(): StreetObjects {
  const layout = getStreetLayout();
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const objects: Object3D[] = [];
  const track = <T extends BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // 1-2. Đèn đường: cột + cần (xám đậm) và chụp đèn (emissive nhẹ ban ngày)
  const postMat = trackMat(new MeshLambertMaterial({ color: '#4a5058' }));
  objects.push(instanced(track(createLampPostGeometry()), postMat, layout.lamps));
  const headMat = trackMat(
    new MeshLambertMaterial({ color: '#d8d4c4', emissive: '#fff1c4', emissiveIntensity: 0.35 }),
  );
  objects.push(instanced(track(createLampHeadGeometry()), headMat, layout.lamps));

  // 3. Ghế đá
  const stoneMat = trackMat(new MeshLambertMaterial({ color: '#9aa0a6' }));
  objects.push(instanced(track(createBenchGeometry()), stoneMat, layout.benches));

  // 4. Thùng rác (màu đỉnh: thân xanh, nắp vàng)
  const binMat = trackMat(new MeshLambertMaterial({ vertexColors: true }));
  objects.push(instanced(track(createBinGeometry()), binMat, layout.bins));

  // 5. Xe máy: màu đỉnh trắng/đen × màu instance đỏ hoặc đen
  const red = new Color('#b3261e');
  const black = new Color('#1c1c1f');
  const bikeMat = trackMat(new MeshLambertMaterial({ vertexColors: true }));
  objects.push(
    instanced(track(createBikeGeometry()), bikeMat, layout.bikes, (i) => (layout.bikes[i]?.dark ? black : red)),
  );

  // 6. Biển "EIU" (1 geometry, 1 texture canvas)
  const tex = createSignTexture();
  const signMat = trackMat(new MeshLambertMaterial({ map: tex }));
  const sign = new Mesh(track(createSignGeometry()), signMat);
  sign.position.set(layout.sign.x, layout.sign.y, layout.sign.z);
  sign.rotation.y = layout.sign.yaw;
  sign.raycast = NO_RAYCAST;
  objects.push(sign);

  return {
    objects,
    geometries,
    materials,
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      tex.dispose();
      for (const o of objects) if (o instanceof InstancedMesh) o.dispose();
    },
  };
}

/**
 * Đồ phố xá tĩnh: đèn đường, ghế đá, thùng rác, xe máy đậu, biển "EIU".
 * Tất cả instanced, tổng 6 draw call, không shadow, không useFrame.
 */
export default function StreetProps() {
  const street = useMemo(createStreetObjects, []);
  useEffect(() => () => street.dispose(), [street]);
  return (
    <group>
      {street.objects.map((o) => (
        <primitive key={o.uuid} object={o} />
      ))}
    </group>
  );
}
