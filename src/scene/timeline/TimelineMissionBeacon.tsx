import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CanvasTexture, DoubleSide, SRGBColorSpace, type Mesh } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { characterConfig } from '../../data';
import { b8UvToWorld, getRoomSpecForStage } from '../../data/timeline/curriculumPlans';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useLangStore } from '../../store/useLangStore';
import { drawSlide, SLIDE_H, SLIDE_W } from '../lesson/slideCanvas';
import { SIT_Y_OFFSET } from '../npc/sitPose';

const ELEVATOR_SPOT = b8UvToWorld(53.5, -188.35);

// Hướng Tây (-U = [-0.97398, 0.22663]) quay từ tường Đông về phía dãy bàn sinh viên
const FACE_WEST_YAW = Math.atan2(-0.97398, 0.22663);
// Hướng Đông (+U = [0.97398, -0.22663]) sinh viên nhìn về phía bảng & màn chiếu
const FACE_EAST_YAW = Math.atan2(0.97398, -0.22663);

function B8WallProjector({ maxU, isFloor4 }: { maxU: number; isFloor4: boolean }) {
  const liveSlide = useTimelineStore((s) => s.liveSlide);
  const liveCover = useTimelineStore((s) => s.liveCover);

  const screenPos = useMemo(() => b8UvToWorld(maxU - 0.175, -205.1), [maxU]);
  const framePos = useMemo(() => b8UvToWorld(maxU - 0.145, -205.1), [maxU]);
  const frontWallPos = useMemo(() => b8UvToWorld(maxU - 0.115, -205.1), [maxU]);
  const wbLeftPos = useMemo(() => b8UvToWorld(maxU - 0.132, -207.8), [maxU]);
  const wbRightPos = useMemo(() => b8UvToWorld(maxU - 0.132, -202.4), [maxU]);
  const podiumPos = useMemo(() => b8UvToWorld(maxU - 1.5, -204.2), [maxU]);
  const lightPos = useMemo(() => b8UvToWorld(maxU - 3.6, -205.1), [maxU]);

  const screenObj = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SLIDE_W;
    canvas.height = SLIDE_H;
    const ctx = canvas.getContext('2d');
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return { ctx, tex };
  }, []);

  useEffect(() => () => screenObj.tex.dispose(), [screenObj]);

  useEffect(() => {
    if (!screenObj.ctx) return;
    drawSlide(screenObj.ctx, { slide: liveSlide, cover: liveCover });
    screenObj.tex.needsUpdate = true;
  }, [screenObj, liveSlide, liveCover]);

  return (
    <group>
      {!isFloor4 && (
        <>
          <pointLight position={[lightPos[0], 3.15, lightPos[1]]} intensity={2.4} distance={14} decay={1.6} color="#fff7ed" />
          {/* Ốp tường trước sáng (tương tự phòng Lab 406.B8) + 2 bảng trắng & bàn giảng viên */}
          <mesh position={[frontWallPos[0], 1.89, frontWallPos[1]]} rotation-y={FACE_WEST_YAW}>
            <boxGeometry args={[9.8, 3.76, 0.02]} />
            <meshStandardMaterial color="#e5e4df" roughness={0.88} />
          </mesh>
          <mesh position={[wbLeftPos[0], 1.7, wbLeftPos[1]]} rotation-y={FACE_WEST_YAW}>
            <boxGeometry args={[2.24, 1.24, 0.025]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </mesh>
          <mesh position={[wbRightPos[0], 1.7, wbRightPos[1]]} rotation-y={FACE_WEST_YAW}>
            <boxGeometry args={[2.24, 1.24, 0.025]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </mesh>
          <mesh position={[podiumPos[0], 0.38, podiumPos[1]]} rotation-y={FACE_WEST_YAW}>
            <boxGeometry args={[1.4, 0.76, 0.7]} />
            <meshStandardMaterial color="#d6b88d" roughness={0.75} />
          </mesh>
          <mesh position={[framePos[0], 2.15, framePos[1]]} rotation-y={FACE_WEST_YAW}>
            <boxGeometry args={[2.22, 1.32, 0.04]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
        </>
      )}
      <mesh position={[screenPos[0], 2.15, screenPos[1]]} rotation-y={FACE_WEST_YAW}>
        <planeGeometry args={[2.1, 1.2]} />
        <meshBasicMaterial map={screenObj.tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function TimelineMissionBeacon() {
  const active = useTimelineStore((s) => s.active);
  const stage = useTimelineStore((s) => s.stage);
  const modalOpen = useTimelineStore((s) => s.modalOpen);
  const interior = useWalkStore((s) => s.interior);
  const lang = useLangStore((s) => s.lang);

  const ringRef = useRef<Mesh>(null);
  const beamRef = useRef<Mesh>(null);
  const teacherHandle = useRef<CharacterHandle>(null);
  const checkTimer = useRef(0);

  const spec = useMemo(() => getRoomSpecForStage(stage), [stage]);
  const beaconPos = useMemo(() => b8UvToWorld(spec.beaconUv[0], spec.beaconUv[1]), [spec]);
  const teacherPos = useMemo(() => b8UvToWorld(spec.maxU - 1.55, -205.55), [spec]);

  const classmateSpots = useMemo(() => {
    const pool = characterConfig.roles.students;
    const pick = (i: number) => pool[i % Math.max(1, pool.length)] ?? characterConfig.roles.playerAlt;
    return [
      { pos: b8UvToWorld(spec.maxU - 3.22, -203.8), url: pick(0) },
      { pos: b8UvToWorld(spec.maxU - 3.22, -206.6), url: pick(1) },
      { pos: b8UvToWorld(spec.maxU - 4.82, -207.8), url: pick(2) },
      { pos: b8UvToWorld(spec.maxU - 4.82, -202.4), url: pick(3) },
    ];
  }, [spec]);

  const isTargetFloor = interior?.buildingId === 'b8' && interior.floor === spec.floor;
  const targetWorld = isTargetFloor ? beaconPos : ELEVATOR_SPOT;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 4) * 0.16;
      ringRef.current.scale.set(s, s, 1);
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as { opacity: number };
      mat.opacity = 0.28 + Math.sin(t * 4) * 0.08;
    }

    if (teacherHandle.current) {
      const ts = useTimelineStore.getState();
      teacherHandle.current.play(ts.modalOpen ? 'interact' : 'idle');
    }

    checkTimer.current += Math.min(delta, 0.1);
    if (checkTimer.current < 0.2) return;
    checkTimer.current = 0;

    const ts = useTimelineStore.getState();
    const ws = useWalkStore.getState();
    if (!ts.active || ws.interior?.buildingId !== 'b8' || ws.interior.floor !== spec.floor) {
      ts.setNearbyMissionTarget(false);
      return;
    }
    const dist = Math.hypot(ws.playerPos.x - beaconPos[0], ws.playerPos.z - beaconPos[1]);
    ts.setNearbyMissionTarget(dist <= 5.0);
  });

  if (!active || interior?.buildingId !== 'b8' || stage === 'graduation' || stage === 'ielts-exam') {
    return null;
  }

  const isEnglishStage = stage === 'placement-speaking' || stage === 'english-class' || stage === 'english-exam';
  const teacherUrl = isEnglishStage ? characterConfig.roles.teacherAlt : characterConfig.roles.teacher;

  const showTeacher =
    isTargetFloor &&
    stage !== 'placement-written';
  const showClassmates =
    isTargetFloor &&
    (stage === 'english-class' || stage === 'major-theory' || stage === 'major-lab' || stage === 'major-exam');

  const color = isTargetFloor ? '#facc15' : '#38bdf8';

  return (
    <group>
      {/* Màn chiếu slide 3D trên tường trước của phòng học B8 */}
      {isTargetFloor && <B8WallProjector maxU={spec.maxU} isFloor4={spec.floor === 4} />}

      {/* Cột mốc sáng khi đang đi tìm phòng */}
      {!modalOpen && (
        <group position={[targetWorld[0], 0.05, targetWorld[1]]}>
          <mesh ref={ringRef} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.9, 1.35, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} side={DoubleSide} depthWrite={false} />
          </mesh>
          <mesh ref={beamRef} position-y={1.8}>
            <cylinderGeometry args={[0.14, 0.52, 3.6, 12, 1, true]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} side={DoubleSide} depthWrite={false} />
          </mesh>
          <Html position={[0, 2.5, 0]} center zIndexRange={[10, 0]}>
            <button
              type="button"
              onClick={() => {
                if (isTargetFloor) useTimelineStore.getState().triggerCurrentActivity();
              }}
              className="pointer-events-auto whitespace-nowrap rounded-full border border-amber-300/60 bg-slate-950/90 px-3 py-1 text-[11px] font-bold text-amber-200 shadow-lg"
            >
              {isTargetFloor
                ? spec.label[lang]
                : lang === 'vi'
                  ? `Đi thang máy lên Tầng ${spec.floor} (${spec.roomCode})`
                  : `Take Elevator to Floor ${spec.floor} (${spec.roomCode})`}
            </button>
          </Html>
        </group>
      )}

      {/* Giảng viên 3D đứng giảng trên bục */}
      {showTeacher && (
        <group position={[teacherPos[0], 0, teacherPos[1]]} rotation={[0, FACE_WEST_YAW, 0]}>
          <Suspense fallback={null}>
            <CharacterModel ref={teacherHandle} url={teacherUrl} clip="idle" castShadow />
          </Suspense>
        </group>
      )}

      {/* Các bạn học 3D ngồi trong lớp */}
      {showClassmates &&
        classmateSpots.map((mate, idx) => (
          <group key={idx} position={[mate.pos[0], SIT_Y_OFFSET, mate.pos[1]]} rotation={[0, FACE_EAST_YAW, 0]}>
            <Suspense fallback={null}>
              <CharacterModel url={mate.url} clip="sit" castShadow />
            </Suspense>
          </group>
        ))}
    </group>
  );
}
