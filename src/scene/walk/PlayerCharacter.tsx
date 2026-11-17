import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Box3, Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const MODEL_URL = `${import.meta.env.BASE_URL}models/RobotExpressive.glb`;
const TARGET_HEIGHT = 1.7;

type PlayerCharacterProps = {
  moving: MutableRefObject<boolean>;
  running: MutableRefObject<boolean>;
  visible: boolean;
};

export function CapsuleFallback() {
  return (
    <group scale={[1, 0.947, 1]}>
      <mesh position={[0, 0.69, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.75, 4, 8]} />
        <meshStandardMaterial color="#1d4f91" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.37, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#e8bc98" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.57, 0.02]} castShadow>
        <sphereGeometry args={[0.225, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshStandardMaterial color="#263238" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function PlayerCharacter({ moving, running, visible }: PlayerCharacterProps) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const model = useMemo(() => clone(scene), [scene]);
  const root = useRef<Group>(null);
  const { actions } = useAnimations(animations, root);
  const activeAction = useRef<string>('');

  useEffect(() => {
    const idle = actions.Idle;
    if (!idle) return;
    idle.reset().fadeIn(0.2).play();
    model.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(model);
    const height = bounds.max.y - bounds.min.y;
    if (root.current && height > 0) {
      const scale = TARGET_HEIGHT / height;
      root.current.scale.setScalar(scale);
      root.current.position.y = -bounds.min.y * scale;
    }
    activeAction.current = 'Idle';
    return () => { idle.stop(); };
  }, [actions, model]);

  useFrame(() => {
    const nextName = moving.current ? (running.current ? 'Running' : 'Walking') : 'Idle';
    if (nextName === activeAction.current) return;
    const nextAction = actions[nextName];
    const previousAction = actions[activeAction.current];
    if (!nextAction) return;
    nextAction.reset().play();
    if (previousAction) previousAction.crossFadeTo(nextAction, 0.2, true);
    activeAction.current = nextName;
  });

  useEffect(() => {
    if (actions.Walking) actions.Walking.timeScale = 0.9;
    if (actions.Running) actions.Running.timeScale = 1.15;
  }, [actions]);

  return (
    <group ref={root} visible={visible}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
