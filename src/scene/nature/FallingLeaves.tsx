import { useEffect, useMemo } from 'react';
import {
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { GRASS } from '../groundLevels';
import { windTime } from './wind';
import { useSnowStore } from '../../store/useSnowStore';

/** Số lá tối đa (ngân sách PLAN mục 5). */
export const LEAF_COUNT = 300;
/** Hộp lá rơi quanh camera: 40 × 15 × 40 m. */
const BOX_XZ = 40;
const BOX_Y = 15;
/** Camera cao hơn mức này (nhìn tổng quan) thì ẩn lá. */
const HIDE_ABOVE_Y = 60;

const VERTEX_SHADER = /* glsl */ `
uniform float windTime;
uniform vec3 uCenter;
uniform float uGround;
uniform float uBoxXZ;
uniform float uBoxY;
attribute vec4 aSeed;  // x, y, z trong [0,1] + pha
attribute vec2 aMisc;  // tốc độ rơi (m/s), độ pha màu
varying float vMix;
varying float vShade;

mat3 rotY(float a) { float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

float wrap(float v, float size) { return v - size * floor(v / size); }

void main() {
  float t = windTime;
  float phase = aSeed.w * 6.2831853;
  // Rơi theo y rồi lặp lại từ trên cao khi chạm đất.
  float fall = wrap(aSeed.y * uBoxY - t * aMisc.x, uBoxY);
  // Đung đưa ngang + trôi theo hướng gió.
  float swayX = sin(t * 1.3 + phase) * 0.7 + t * 0.35;
  float swayZ = cos(t * 1.1 + phase * 1.7) * 0.7 + t * 0.2;
  // Lưới cố định trong thế giới: chỉ dời tâm hộp theo camera, lá không trượt theo camera.
  float originX = uCenter.x - uBoxXZ * 0.5;
  float originZ = uCenter.z - uBoxXZ * 0.5;
  float wx = originX + wrap(aSeed.x * uBoxXZ + swayX - originX, uBoxXZ);
  float wz = originZ + wrap(aSeed.z * uBoxXZ + swayZ - originZ, uBoxXZ);
  vec3 local = rotY(t * 1.8 + phase) * (rotX(t * 2.6 + phase * 2.0) * position);
  vec3 world = vec3(wx, uGround + fall, wz) + local;
  vMix = aMisc.y;
  vShade = 0.75 + 0.25 * abs(sin(t * 2.6 + phase * 2.0));
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vMix;
varying float vShade;
void main() {
  gl_FragColor = vec4(mix(uColorA, uColorB, vMix) * vShade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Lá rơi lác đác quanh camera. Toàn bộ chuyển động trong vertex shader theo windTime; CPU chỉ cập nhật tâm hộp. */
export default function FallingLeaves() {
  const assets = useMemo(() => {
    const geo = new PlaneGeometry(0.08, 0.05);
    const seed = new Float32Array(LEAF_COUNT * 4);
    const misc = new Float32Array(LEAF_COUNT * 2);
    // Số giả ngẫu nhiên cố định (LCG) để mỗi lần mở trang lá rơi giống nhau.
    let s = 20261123;
    const rnd = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = 0; i < LEAF_COUNT; i++) {
      seed[i * 4] = rnd();
      seed[i * 4 + 1] = rnd();
      seed[i * 4 + 2] = rnd();
      seed[i * 4 + 3] = rnd();
      misc[i * 2] = 0.4 + rnd() * 0.4;
      misc[i * 2 + 1] = rnd() < 0.5 ? 0 : 0.35 + rnd() * 0.65;
    }
    geo.setAttribute('aSeed', new InstancedBufferAttribute(seed, 4));
    geo.setAttribute('aMisc', new InstancedBufferAttribute(misc, 2));

    const center = new Vector3();
    const mat = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: DoubleSide,
      uniforms: {
        windTime,
        uCenter: { value: center },
        uGround: { value: GRASS },
        uBoxXZ: { value: BOX_XZ },
        uBoxY: { value: BOX_Y },
        uColorA: { value: new Color('#5d9a3a') },
        uColorB: { value: new Color('#d8b640') },
      },
    });
    const mesh = new InstancedMesh(geo, mat, LEAF_COUNT);
    mesh.frustumCulled = false;
    mesh.raycast = () => undefined;
    return { geo, mat, mesh, center };
  }, []);

  useEffect(
    () => () => {
      assets.geo.dispose();
      assets.mat.dispose();
      assets.mesh.dispose();
    },
    [assets],
  );

  const isSnowing = useSnowStore((s) => s.isSnowing);

  useFrame(({ camera }) => {
    if (isSnowing) {
      if (assets.mesh.visible) assets.mesh.visible = false;
      return;
    }
    const show = camera.position.y < HIDE_ABOVE_Y;
    if (assets.mesh.visible !== show) assets.mesh.visible = show;
    if (!show) return;
    assets.center.set(camera.position.x, 0, camera.position.z);
  });

  return <primitive object={assets.mesh} />;
}
