import { Sky } from '@react-three/drei';

export const SHADOWS_ENABLED = true;

export default function Environment() {
  return (
    <>
      <color attach="background" args={['#d6e6f7']} />
      <fog attach="fog" args={['#d6e6f7', 750, 2400]} />
      <Sky
        distance={3000}
        sunPosition={[220, 200, 140]}
        turbidity={5}
        rayleigh={0.3}
        mieCoefficient={0.003}
        mieDirectionalG={0.8}
      />
      <hemisphereLight args={['#ffffff', '#8fa382', 1.0]} />
      <directionalLight
        position={[220, 260, 140]}
        intensity={1.6}
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
