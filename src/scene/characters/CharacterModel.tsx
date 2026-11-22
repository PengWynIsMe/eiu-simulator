import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  type AnimationAction,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { characterConfig } from '../../data';
import type { CharacterClip } from '../../types';

const FADE = 0.2;

/** Điều khiển clip bằng lệnh (không setState) — gọi thoải mái trong useFrame. */
export interface CharacterHandle {
  /** Phát clip lặp. Gọi lại cùng clip chỉ cập nhật timeScale (rẻ). */
  play: (clip: CharacterClip, timeScale?: number) => void;
  /** Phát 1 lần rồi tự quay về `then` (mặc định idle). */
  playOnce: (clip: CharacterClip, then?: CharacterClip) => void;
  /** Tạm dừng mixer (LOD xa). */
  setPaused: (paused: boolean) => void;
  /**
   * Phát clip chỉ cho tay + đầu (lọc track arm-left/arm-right/head), chồng lên clip chính (vd `sit`):
   * chân, thân, root vẫn do clip chính điều khiển. Mặc định LoopOnce rồi mờ dần; `loop: true` lặp tới khi `stopUpper`.
   */
  playUpper: (clip: CharacterClip, opts?: UpperOptions) => void;
  /** Dừng clip nửa người trên (mờ dần), tay/đầu về lại theo clip chính. */
  stopUpper: () => void;
}

export interface UpperOptions {
  timeScale?: number;
  loop?: boolean;
}

/** Chỉ giữ track của các xương này; track root/torso/leg của clip phụ bỏ hẳn. */
const UPPER_BONES = new Set(['arm-left', 'arm-right', 'head']);
/**
 * three.js trộn các action trên cùng một track theo tỉ lệ weight/Σweight, nên 2 action weight 1 chỉ cho 50/50.
 * Weight lớn để clip phụ gần như thay hẳn tay/đầu của clip chính (xương không có trong clip phụ không bị ảnh hưởng).
 */
/** Clip nửa người trên dựng 1 lần cho mỗi clip gốc (useGLTF dùng chung `animations` giữa các bản clone). */
const upperCache = new WeakMap<AnimationClip, AnimationClip>();
const UPPER_WEIGHT = 64;
const UPPER_FADE_IN = 0.12;
const UPPER_FADE_OUT = 0.2;

interface CharacterModelProps {
  url: string;
  /** Clip theo prop (mặc định `idle`). Muốn đổi liên tục trong useFrame thì dùng ref handle. */
  clip?: CharacterClip;
  timeScale?: number;
  castShadow?: boolean;
}

interface PlayState {
  action: AnimationAction | null;
  clip: CharacterClip | null;
  once: AnimationAction | null;
  upper: AnimationAction | null;
  after: CharacterClip;
  paused: boolean;
}

/**
 * Nhân vật Kenney: 1 file GLB dùng chung cho nhiều bản (SkeletonUtils.clone), model nhìn về +Z,
 * chân ở y = 0, đã nhân `characterConfig.scale`. Group cha lo vị trí/hướng.
 */
const CharacterModel = forwardRef<CharacterHandle, CharacterModelProps>(function CharacterModel(
  { url, clip = 'idle', timeScale = 1, castShadow = false },
  ref,
) {
  const { scene, animations } = useGLTF(url);

  const model = useMemo(() => {
    const copy = clone(scene);
    copy.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m instanceof MeshStandardMaterial && m.map && m.map.magFilter !== NearestFilter) {
          m.map.magFilter = NearestFilter; // giữ khối sắc nét; vật liệu dùng chung giữa các bản nên chỉ đổi 1 lần
          m.map.needsUpdate = true;
        }
      }
    });
    return copy;
  }, [scene]);

  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const clipsByName = useMemo(() => {
    const map = new Map<string, AnimationClip>();
    for (const a of animations) map.set(a.name, a);
    return map;
  }, [animations]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- state gắn với vòng đời mixer
  const state = useMemo<PlayState>(() => ({ action: null, clip: null, once: null, upper: null, after: 'idle', paused: false }), [mixer]);

  const handle = useMemo(() => {
    const start = (name: CharacterClip, ts: number, once: boolean, fade: number) => {
      const source = clipsByName.get(characterConfig.clips[name]);
      if (!source) return;
      const action = mixer.clipAction(source);
      const prev = state.action;
      if (prev === action && !once && state.clip === name && state.once === null) {
        if (action.timeScale !== ts) action.timeScale = ts;
        return;
      }
      action.reset();
      action.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
      action.clampWhenFinished = once;
      action.timeScale = ts;
      if (fade > 0) action.fadeIn(fade);
      else action.setEffectiveWeight(1);
      action.play();
      if (prev && prev !== action) prev.fadeOut(FADE);
      state.action = action;
      state.clip = name;
      state.once = once ? action : null;
    };
    const upperClip = (name: CharacterClip): AnimationClip | null => {
      const key = characterConfig.clips[name];
      const source = clipsByName.get(key);
      if (!source) return null;
      const cached = upperCache.get(source);
      if (cached) return cached;
      const tracks = source.tracks.filter((t) => UPPER_BONES.has(t.name.split('.')[0] ?? '')).map((t) => t.clone());
      if (tracks.length === 0) return null;
      const made = new AnimationClip(`${key}#upper`, source.duration, tracks);
      upperCache.set(source, made);
      return made;
    };
    const stopUpper = () => {
      const up = state.upper;
      if (!up) return;
      state.upper = null;
      up.fadeOut(UPPER_FADE_OUT);
    };
    return {
      playUpper: (name: CharacterClip, opts?: UpperOptions) => {
        const clipUp = upperClip(name);
        if (!clipUp) return;
        const action = mixer.clipAction(clipUp);
        if (state.upper && state.upper !== action) state.upper.fadeOut(UPPER_FADE_OUT);
        const loop = opts?.loop === true;
        action.reset();
        action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
        action.clampWhenFinished = true;
        action.timeScale = opts?.timeScale ?? 1;
        action.weight = UPPER_WEIGHT;
        action.fadeIn(UPPER_FADE_IN);
        action.play();
        state.upper = action;
      },
      stopUpper,
      play: (name: CharacterClip, ts = 1) => start(name, ts, false, state.action ? FADE : 0),
      playOnce: (name: CharacterClip, then: CharacterClip = 'idle') => {
        state.after = then;
        start(name, 1, true, FADE);
      },
      setPaused: (paused: boolean) => {
        state.paused = paused;
      },
    };
  }, [mixer, clipsByName, state]);

  useImperativeHandle(ref, () => handle, [handle]);

  // Vòng đời mixer: dọn khi đổi model / tháo.
  useLayoutEffect(() => {
    const onFinished = (e: { action: AnimationAction }) => {
      if (e.action === state.upper) {
        state.upper = null;
        e.action.fadeOut(UPPER_FADE_OUT);
        return;
      }
      if (e.action === state.once) {
        state.once = null;
        handle.play(state.after);
      }
    };
    mixer.addEventListener('finished', onFinished);
    return () => {
      mixer.removeEventListener('finished', onFinished);
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      state.action = null;
      state.clip = null;
      state.once = null;
      state.upper = null;
    };
  }, [mixer, model, state, handle]);

  // Clip theo prop. Lần đầu (chưa có action) phát ngay không fade + áp tư thế luôn → không lộ chữ T.
  useLayoutEffect(() => {
    handle.play(clip, timeScale);
    mixer.update(0);
  }, [handle, mixer, clip, timeScale]);

  useLayoutEffect(() => {
    model.traverse((o) => {
      if (o instanceof Mesh) o.castShadow = castShadow;
    });
  }, [model, castShadow]);

  useFrame((_, delta) => {
    if (!state.paused) mixer.update(Math.min(delta, 0.1));
  });

  return (
    <group scale={characterConfig.scale}>
      <primitive object={model} />
    </group>
  );
});

export default CharacterModel;
