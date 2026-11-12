import { Sky } from '@react-three/drei';

export const SHADOWS_ENABLED = true;

export default function Environment() {
  return (
    <>
      <color attach="background" args={['#dcecf7']} />
      <fog attach="fog" args={['#dcecf7', 750, 2400]} />
      <Sky
        distance={3000}
        sunPosition={[220, 180, 140]}
        turbidity={8}
        rayleigh={0.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <hemisphereLight args={['#ffffff', '#768d66', 1.0]} />
      <directionalLight
        position={[220, 260, 140]}
        intensity={1.6}
        castShadow={SHADOWS_ENABLED}
        shadow-mapSize={SHADOWS_ENABLED ? [2048, 2048] : [256, 256]}
        shadow-bias={-0.0004}
        shadow-camera-left={-350}
        shadow-camera-right={350}
        shadow-camera-top={350}
        shadow-camera-bottom={-350}
        shadow-camera-near={50}
        shadow-camera-far={600}
      />
    </>
  );
}
