import type { Material, WebGLProgramParametersWithUniforms } from 'three';

/** Uniform thời gian gió dùng chung cho mọi vật liệu — chỉ <WindClock/> được ghi vào. */
export const windTime = { value: 0 };

export interface WindOptions {
  /** Độ lệch ngang tối đa ở ngọn (đơn vị cục bộ của geometry, tính trước khi nhân scale instance). */
  strength: number;
  /** Chiều cao cục bộ (m) mà tại đó đạt đủ `strength`; thấp hơn thì lệch ít hơn (gốc đứng yên). */
  heightFalloff: number;
  /** Tùy chọn: thu nhỏ chiều cao theo khoảng cách tới camera, [gần, xa] (m); xa hơn = 0. */
  distanceFade?: readonly [number, number];
  /** Tùy chọn: ép pháp tuyến hướng lên để cỏ không bị tối ở mặt sau. */
  upNormal?: boolean;
}

/**
 * Gắn gió vào vertex shader của vật liệu (three.js onBeforeCompile).
 * Pha gió tính theo vị trí thế giới của instance nên các cây cạnh nhau đung đưa lệch pha nhau.
 * Biên độ nằm trong uniform riêng của từng vật liệu, nên nhiều vật liệu dùng chung 1 chương trình shader.
 */
export function applyWind(material: Material, opts: WindOptions): void {
  const fade = opts.distanceFade;
  const fadeCode = fade
    ? `float windFade = 1.0 - smoothstep(${fade[0].toFixed(1)}, ${fade[1].toFixed(1)}, length(windWorld.xz - cameraPosition.xz));
  transformed.y *= windFade;`
    : '';
  const key = `wind-${fade ? `f${fade[0]}-${fade[1]}` : 'n'}-${opts.upNormal ? 'up' : 'std'}`;

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.windTime = windTime;
    shader.uniforms.windStrength = { value: opts.strength };
    shader.uniforms.windHeight = { value: opts.heightFalloff };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float windTime;
uniform float windStrength;
uniform float windHeight;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
  vec4 windLocal = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    windLocal = instanceMatrix * windLocal;
  #endif
  vec4 windWorld = modelMatrix * windLocal;
  float windH = clamp(transformed.y / windHeight, 0.0, 1.0);
  float windK = windH * windH;
  float windPhase = windTime * 1.7 + windWorld.x * 0.15 + windWorld.z * 0.11;
  float windGust = sin(windPhase) + 0.45 * sin(windPhase * 2.3 + 1.7);
  // Độ lệch tính theo hướng THẾ GIỚI rồi quy về tọa độ cục bộ, để cây xoay ngẫu nhiên vẫn nghiêng cùng chiều gió.
  vec3 windDisp = vec3(windGust, 0.0, cos(windPhase * 0.8 + 0.6) * 0.6) * (windStrength * windK);
  #ifdef USE_INSTANCING
    windDisp = inverse(mat3(instanceMatrix)) * windDisp;
  #endif
  transformed += windDisp;
  ${fadeCode}
}`,
      );

    if (opts.upNormal) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);`,
      );
    }
  };
  material.customProgramCacheKey = () => key;
  material.needsUpdate = true;
}
