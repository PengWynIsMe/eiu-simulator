import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { characterConfig } from '../../data';
import { useWalkStore } from '../../store/useWalkStore';
import { useLessonStore } from '../../store/useLessonStore';

type PlayerCharacterProps = {
  moving: MutableRefObject<boolean>;
  running: MutableRefObject<boolean>;
  visible: boolean;
};

export function CapsuleFallback() {
  return (
    <group scale={0.79}>
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
  const skin = useWalkStore((s) => s.playerSkin);
  const seatId = useLessonStore((s) => s.seatId);
  const url = skin === 'playerAlt' ? characterConfig.roles.playerAlt : characterConfig.roles.player;
  const handle = useRef<CharacterHandle>(null);

  useFrame(() => {
    if (seatId) {
      handle.current?.play('sit');
    } else {
      handle.current?.play(moving.current ? (running.current ? 'run' : 'walk') : 'idle');
    }
  });

  return (
    <group visible={visible}>
      <CharacterModel key={url} ref={handle} url={url} clip="idle" castShadow />
    </group>
  );
}

useGLTF.preload(characterConfig.roles.player);
