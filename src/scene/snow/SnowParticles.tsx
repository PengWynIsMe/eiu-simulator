import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSnowStore } from '../../store/useSnowStore';

const BOX_XZ = 160.0;
const BOX_Y = 65.0;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform vec3 uCenter;
uniform float uBoxXZ;
uniform float uBoxY;
uniform vec2 uWind;
attribute vec4 aSeed; // x: phase, y: speed, z: size, w: swayAmp

varying float vAlpha;

float wrap(float v, float size) {
  return v - size * floor(v / size);
}

void main() {
  float t = uTime;
  float phase = aSeed.x * 6.2831853;
  float speed = aSeed.y;
  float size = aSeed.z;
  float swayAmp = aSeed.w;

  // Rơi từ trên xuống trong hộp chiều cao uBoxY
  float fall = wrap(position.y - t * speed, uBoxY);

  // Đung đưa ngang theo gió nhẹ và nhiễu loạn không khí
  float swayX = sin(t * 1.5 + phase) * swayAmp + sin(t * 0.45) * 1.2 + uWind.x * t * 0.2;
  float swayZ = cos(t * 1.25 + phase * 1.3) * swayAmp + cos(t * 0.35) * 0.9 + uWind.y * t * 0.2;

  // Lưới tọa độ wrapping bao quanh vị trí camera
  float halfXZ = uBoxXZ * 0.5;
  float originX = uCenter.x - halfXZ;
  float originZ = uCenter.z - halfXZ;

  float wx = originX + wrap(position.x + swayX - originX, uBoxXZ);
  float wz = originZ + wrap(position.z + swayZ - originZ, uBoxXZ);
  float wy = (uCenter.y - uBoxY * 0.45) + fall;

  // Giữ hạt không tụt sâu dưới đất (độ cao tối thiểu 0.2m)
  wy = max(wy, 0.2);

  vec4 worldPos = vec4(wx, wy, wz, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;

  // Tỷ lệ kích thước hạt tuyết theo khoảng cách tới camera
  float dist = -mvPosition.z;
  gl_PointSize = size * (240.0 / max(dist, 1.0));
  gl_PointSize = clamp(gl_PointSize, 1.5, 34.0);

  // Mờ dần khi hạt quá gần mặt kính camera hoặc ra rìa biên hộp
  float nearFade = smoothstep(1.5, 4.0, dist);
  float farFade = 1.0 - smoothstep(uBoxXZ * 0.38, uBoxXZ * 0.52, dist);
  vAlpha = nearFade * farFade * 0.9;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying float vAlpha;

void main() {
  // Hạt tuyết hình tròn mờ biên mềm mại, tâm sáng
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float core = 1.0 - smoothstep(0.0, 0.22, dist);
  float halo = 1.0 - smoothstep(0.12, 0.5, dist);
  float shape = mix(halo * 0.72, 1.0, core);
  vec3 snowColor = mix(vec3(0.92, 0.96, 1.0), vec3(1.0), core);

  gl_FragColor = vec4(snowColor, vAlpha * shape);
}
`;

export default function SnowParticles() {
  const isSnowing = useSnowStore((s) => s.isSnowing);
  const { camera } = useThree();
  const pointsRef = useRef<Points>(null);

  // Phát hiện thiết bị di động để tự động giảm số lượng hạt tuyết, đảm bảo ≥30 FPS
  const particleCount = useMemo(() => {
    if (typeof window === 'undefined') return 4000;
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    return isMobile ? 1800 : 4800;
  }, []);

  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount * 4);

    // Dùng PRNG cố định để phân bố hạt tuyết đều và tự nhiên
    let seed = 20261225;
    const rnd = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (rnd() - 0.5) * BOX_XZ;
      positions[i * 3 + 1] = rnd() * BOX_Y;
      positions[i * 3 + 2] = (rnd() - 0.5) * BOX_XZ;

      // aSeed: [phase, speed (m/s), size, swayAmp]
      seeds[i * 4] = rnd(); // phase
      seeds[i * 4 + 1] = 1.4 + rnd() * 1.8; // tốc độ rơi 1.4 - 3.2 m/s
      seeds[i * 4 + 2] = 0.8 + rnd() * 1.4; // kích thước hạt
      seeds[i * 4 + 3] = 0.5 + rnd() * 1.1; // biên độ lắc
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new Float32BufferAttribute(seeds, 4));

    const mat = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new Vector3() },
        uBoxXZ: { value: BOX_XZ },
        uBoxY: { value: BOX_Y },
        uWind: { value: new Vector2(0.35, 0.2) },
      },
    });

    return { geometry: geo, material: mat };
  }, [particleCount]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (!isSnowing) return;
    const uniforms = material.uniforms;
    if (uniforms.uTime) {
      (uniforms.uTime as { value: number }).value += delta;
    }
    if (uniforms.uCenter) {
      ((uniforms.uCenter as { value: Vector3 }).value).copy(camera.position);
    }
  });

  if (!isSnowing) return null;

  return (
    <primitive
      object={
        pointsRef.current ??
        new Points(geometry, material)
      }
      ref={pointsRef}
      frustumCulled={false}
    />
  );
}
