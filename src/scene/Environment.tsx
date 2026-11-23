import { Sky } from '@react-three/drei';
import { useSnowStore } from '../store/useSnowStore';

export const SHADOWS_ENABLED = true;

export default function Environment() {
  const isSnowing = useSnowStore((s) => s.isSnowing);

  const bgColor = isSnowing ? '#cbd8e6' : '#d6e6f7';
  const fogColor = isSnowing ? '#cbd8e6' : '#d6e6f7';
  const fogNear = isSnowing ? 140 : 250;
  const fogFar = isSnowing ? 750 : 900;

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <Sky
        distance={3000}
        sunPosition={isSnowing ? [180, 140, 100] : [220, 200, 140]}
        turbidity={isSnowing ? 8 : 5}
        rayleigh={isSnowing ? 1.0 : 0.3}
        mieCoefficient={isSnowing ? 0.008 : 0.003}
        mieDirectionalG={0.8}
      />
      <hemisphereLight
        args={
          isSnowing
            ? ['#e2f1ff', '#cbd5e1', 1.05]
            : ['#ffffff', '#8fa382', 1.0]
        }
      />
      <directionalLight
        position={[220, 260, 140]}
        intensity={isSnowing ? 1.4 : 1.6}
        color={isSnowing ? '#f8fafc' : '#ffffff'}
        castShadow={SHADOWS_ENABLED}
        shadow-mapSize={SHADOWS_ENABLED ? [2048, 2048] : [256, 256]}
        shadow-normalBias={0.05}
        shadow-bias={-0.0002}
        shadow-camera-left={-280}
        shadow-camera-right={280}
        shadow-camera-top={280}
        shadow-camera-bottom={-280}
        shadow-camera-near={80}
        shadow-camera-far={540}
      />
    </>
  );
}
