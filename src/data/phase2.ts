// Giai đoạn 2: nạp + kiểm tra nhân vật, phòng học, buổi học, tuyến NPC. Xuất qua ./index.
import charactersRaw from './characters.json';
import classroomsRaw from './classrooms.json';
import npcRoutesRaw from './npc-routes.json';
import nmlt01Raw from './lessons/nmlt-01.json';
import type {
  CharacterClip,
  CharacterConfig,
  Classroom,
  DialogueOption,
  Lesson,
  LessonStep,
  LocalPoint,
  NpcRoutes,
  Vec2,
  WallBoard,
} from '../types';
import type { SpeakerId } from '../types/silver';
import { arr, fail, num, obj, oneOf, optStr, str, vec2 } from './validate';

const CLIPS: readonly CharacterClip[] = ['idle', 'walk', 'run', 'sit', 'yes', 'no', 'interact', 'raiseHand'];
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

function characters(v: unknown): CharacterConfig {
  const o = obj(v, 'characters.json');
  const clipsObj = obj(o.clips, 'characters.clips');
  const roles = obj(o.roles, 'characters.roles');
  const role = (k: string) => asset(str(roles[k], `characters.roles.${k}`));
  const clips = {} as Record<CharacterClip, string>;
  for (const c of CLIPS) clips[c] = str(clipsObj[c], `characters.clips.${c}`);

  let story: Partial<Record<SpeakerId, string>> | undefined;
  if (o.story !== undefined) {
    const storyObj = obj(o.story, 'characters.story');
    story = {};
    for (const [k, val] of Object.entries(storyObj)) {
      story[k as SpeakerId] = asset(str(val, `characters.story.${k}`));
    }
  }

  return {
    scale: num(o.scale, 'characters.scale'),
    height: num(o.height, 'characters.height'),
    radius: num(o.radius, 'characters.radius'),
    eyeHeight: num(o.eyeHeight, 'characters.eyeHeight'),
    clips,
    roles: {
      player: role('player'),
      playerAlt: role('playerAlt'),
      teacher: role('teacher'),
      teacherAlt: role('teacherAlt'),
      guard: role('guard'),
      worker: role('worker'),
      students: arr(roles.students, 'characters.roles.students').map((s, i) => asset(str(s, `characters.roles.students[${i}]`))),
    },
    story,
  };
}

const point = (v: unknown, path: string): LocalPoint => {
  const o = obj(v, path);
  return { u: num(o.u, `${path}.u`), v: num(o.v, `${path}.v`) };
};

function board(v: unknown, path: string): WallBoard {
  const o = obj(v, path);
  return {
    ...point(o, path),
    width: num(o.width, `${path}.width`),
    height: num(o.height, `${path}.height`),
    bottom: num(o.bottom, `${path}.bottom`),
    facing: vec2(o.facing, `${path}.facing`),
  };
}

function classroom(v: unknown, path: string): Classroom {
  const o = obj(v, path);
  const b = obj(o.bounds, `${path}.bounds`);
  const projector = obj(o.projector, `${path}.projector`);
  const size = arr(projector.size, `${path}.projector.size`).map((n, i) => num(n, `${path}.projector.size[${i}]`));
  if (size.length !== 3) fail(`${path}.projector.size`, '[rộng, cao, sâu]');
  const desk = obj(o.teacherDesk, `${path}.teacherDesk`);
  const studentDesk = obj(o.desk, `${path}.desk`);
  const spots = obj(o.teacherSpots, `${path}.teacherSpots`);
  const aisle = obj(o.aisle, `${path}.aisle`);
  const seats = arr(o.seats, `${path}.seats`).map((s, i) => {
    const so = obj(s, `${path}.seats[${i}]`);
    return { ...point(so, `${path}.seats[${i}]`), id: str(so.id, `${path}.seats[${i}].id`), deskU: num(so.deskU, `${path}.seats[${i}].deskU`) };
  });
  const seatIds = new Set(seats.map((s) => s.id));
  const seatRef = (x: unknown, p: string) => {
    const id = str(x, p);
    if (!seatIds.has(id)) fail(p, `id ghế có trong seats (không có "${id}")`);
    return id;
  };
  const playerSeat = seatRef(o.playerSeat, `${path}.playerSeat`);
  const npcSeats = arr(o.npcSeats, `${path}.npcSeats`).map((s, i) => seatRef(s, `${path}.npcSeats[${i}]`));
  if (npcSeats.includes(playerSeat)) fail(`${path}.npcSeats`, 'không chứa ghế người chơi');
  const companionSeat = o.companionSeat === undefined
    ? undefined
    : seatRef(o.companionSeat, `${path}.companionSeat`);
  if (companionSeat && (npcSeats.includes(companionSeat) || companionSeat === playerSeat)) {
    fail(`${path}.companionSeat`, 'ghế thật, không thuộc npcSeats và khác playerSeat');
  }
  return {
    code: str(o.code, `${path}.code`),
    name: str(o.name, `${path}.name`),
    buildingId: str(o.buildingId, `${path}.buildingId`),
    floor: num(o.floor, `${path}.floor`),
    frame: oneOf(o.frame, ['b11', 'b8'], `${path}.frame`),
    bounds: {
      minU: num(b.minU, `${path}.bounds.minU`),
      maxU: num(b.maxU, `${path}.bounds.maxU`),
      minV: num(b.minV, `${path}.bounds.minV`),
      maxV: num(b.maxV, `${path}.bounds.maxV`),
    },
    door: point(o.door, `${path}.door`),
    doorWorld: vec2(o.doorWorld, `${path}.doorWorld`),
    centerWorld: vec2(o.centerWorld, `${path}.centerWorld`),
    arrival: point(o.arrival, `${path}.arrival`),
    studentFacing: vec2(o.studentFacing, `${path}.studentFacing`),
    whiteboard: board(o.whiteboard, `${path}.whiteboard`),
    projectorScreen: board(o.projectorScreen, `${path}.projectorScreen`),
    projector: { ...point(projector, `${path}.projector`), y: num(projector.y, `${path}.projector.y`), size: [size[0] ?? 0, size[1] ?? 0, size[2] ?? 0] },
    teacherDesk: {
      ...point(desk, `${path}.teacherDesk`),
      width: num(desk.width, `${path}.teacherDesk.width`),
      depth: num(desk.depth, `${path}.teacherDesk.depth`),
      height: num(desk.height, `${path}.teacherDesk.height`),
      facing: vec2(desk.facing, `${path}.teacherDesk.facing`),
    },
    teacherSpots: { lecture: point(spots.lecture, `${path}.teacherSpots.lecture`), desk: point(spots.desk, `${path}.teacherSpots.desk`) },
    desk: {
      depth: num(studentDesk.depth, `${path}.desk.depth`),
      width: num(studentDesk.width, `${path}.desk.width`),
      height: num(studentDesk.height, `${path}.desk.height`),
    },
    chairSeatHeight: num(o.chairSeatHeight, `${path}.chairSeatHeight`),
    aisle: { minV: num(aisle.minV, `${path}.aisle.minV`), maxV: num(aisle.maxV, `${path}.aisle.maxV`) },
    ceilingLights: arr(o.ceilingLights, `${path}.ceilingLights`).map((p, i) => point(p, `${path}.ceilingLights[${i}]`)),
    airConditioners: arr(o.airConditioners, `${path}.airConditioners`).map((p, i) => {
      const ac = obj(p, `${path}.airConditioners[${i}]`);
      return { ...point(ac, `${path}.airConditioners[${i}]`), y: num(ac.y, `${path}.airConditioners[${i}].y`) };
    }),
    seats,
    playerSeat,
    ...(companionSeat ? { companionSeat } : {}),
    ...(o.standPoint === undefined ? {} : { standPoint: point(o.standPoint, `${path}.standPoint`) }),
    npcSeats,
  };
}

function options(v: unknown, path: string): DialogueOption[] {
  const list = arr(v, path).map((x, i) => {
    const o = obj(x, `${path}[${i}]`);
    return { id: str(o.id, `${path}[${i}].id`), text: str(o.text, `${path}[${i}].text`), reply: optStr(o.reply, `${path}[${i}].reply`) };
  });
  if (list.length === 0) fail(path, 'ít nhất 1 lựa chọn');
  return list;
}

function step(v: unknown, path: string): LessonStep {
  const o = obj(v, path);
  const id = str(o.id, `${path}.id`);
  const type = oneOf(o.type, ['dialogue', 'lecture', 'question', 'exercise', 'summary'], `${path}.type`);
  const speaker = () => oneOf(o.speaker, ['teacher', 'player'], `${path}.speaker`);
  switch (type) {
    case 'dialogue':
      return { type, id, speaker: speaker(), text: str(o.text, `${path}.text`), options: options(o.options, `${path}.options`) };
    case 'lecture':
      return {
        type,
        id,
        slides: arr(o.slides, `${path}.slides`).map((s, i) => {
          const so = obj(s, `${path}.slides[${i}]`);
          return { title: str(so.title, `${path}.slides[${i}].title`), code: optStr(so.code, `${path}.slides[${i}].code`), body: str(so.body, `${path}.slides[${i}].body`) };
        }),
      };
    case 'question': {
      const opts = options(o.options, `${path}.options`);
      const answerId = str(o.answerId, `${path}.answerId`);
      if (!opts.some((x) => x.id === answerId)) fail(`${path}.answerId`, 'id có trong options');
      return {
        type,
        id,
        speaker: speaker(),
        prompt: str(o.prompt, `${path}.prompt`),
        code: optStr(o.code, `${path}.code`),
        options: opts,
        answerId,
        explainCorrect: str(o.explainCorrect, `${path}.explainCorrect`),
        explainWrong: str(o.explainWrong, `${path}.explainWrong`),
      };
    }
    case 'exercise': {
      const template = str(o.template, `${path}.template`);
      if (template.split('___').length !== 2) fail(`${path}.template`, 'đúng 1 chỗ trống "___"');
      return {
        type,
        id,
        title: str(o.title, `${path}.title`),
        instruction: str(o.instruction, `${path}.instruction`),
        template,
        answers: arr(o.answers, `${path}.answers`).map((a, i) => str(a, `${path}.answers[${i}]`)),
        outputCorrect: str(o.outputCorrect, `${path}.outputCorrect`),
        outputWrong: str(o.outputWrong, `${path}.outputWrong`),
        hint: str(o.hint, `${path}.hint`),
        explainWrong: str(o.explainWrong, `${path}.explainWrong`),
      };
    }
    case 'summary':
      return { type, id, speaker: speaker(), text: str(o.text, `${path}.text`) };
  }
}

function lesson(v: unknown, path: string, roomCodes: Set<string>): Lesson {
  const o = obj(v, path);
  const roomCode = str(o.roomCode, `${path}.roomCode`);
  if (!roomCodes.has(roomCode)) fail(`${path}.roomCode`, `mã phòng có trong classrooms.json (không có "${roomCode}")`);
  const steps = arr(o.steps, `${path}.steps`).map((s, i) => step(s, `${path}.steps[${i}]`));
  if (steps.at(-1)?.type !== 'summary') fail(`${path}.steps`, 'bước cuối là summary');
  return {
    id: str(o.id, `${path}.id`),
    course: str(o.course, `${path}.course`),
    title: str(o.title, `${path}.title`),
    time: str(o.time, `${path}.time`),
    roomCode,
    teacherName: str(o.teacherName, `${path}.teacherName`),
    durationMinutes: num(o.durationMinutes, `${path}.durationMinutes`),
    passportStamp: str(o.passportStamp, `${path}.passportStamp`),
    steps,
  };
}

function npcRoutesData(v: unknown): NpcRoutes {
  const o = obj(v, 'npc-routes.json');
  const pts = (x: unknown, p: string): Vec2[] => arr(x, p).map((q, i) => vec2(q, `${p}[${i}]`));
  return {
    routes: arr(o.routes, 'npc-routes.routes').map((r, i) => {
      const p = `npc-routes.routes[${i}]`;
      const ro = obj(r, p);
      if (typeof ro.loop !== 'boolean') fail(`${p}.loop`, 'true | false');
      return {
        id: str(ro.id, `${p}.id`),
        kind: oneOf(ro.kind, ['internal', 'footway', 'bridge'], `${p}.kind`),
        loop: ro.loop,
        sideOffset: num(ro.sideOffset, `${p}.sideOffset`),
        length: num(ro.length, `${p}.length`),
        points: pts(ro.points, `${p}.points`),
      };
    }),
    guards: arr(o.guards, 'npc-routes.guards').map((g, i) => {
      const p = `npc-routes.guards[${i}]`;
      const go = obj(g, p);
      return { id: str(go.id, `${p}.id`), position: vec2(go.position, `${p}.position`), facing: vec2(go.facing, `${p}.facing`), note: str(go.note, `${p}.note`) };
    }),
    groups: arr(o.groups, 'npc-routes.groups').map((g, i) => {
      const p = `npc-routes.groups[${i}]`;
      const go = obj(g, p);
      return { id: str(go.id, `${p}.id`), position: vec2(go.position, `${p}.position`), size: num(go.size, `${p}.size`), note: str(go.note, `${p}.note`) };
    }),
  };
}

export const characterConfig: CharacterConfig = characters(charactersRaw);

const classrooms = arr(obj(classroomsRaw, 'classrooms.json').classrooms, 'classrooms').map((c, i) => classroom(c, `classrooms[${i}]`));
const classroomByCode = new Map(classrooms.map((c) => [c.code, c]));

const lessons = [lesson(nmlt01Raw, 'lessons/nmlt-01.json', new Set(classroomByCode.keys()))];
const lessonById = new Map(lessons.map((l) => [l.id, l]));

export const npcRoutes: NpcRoutes = npcRoutesData(npcRoutesRaw);

export function getClassroom(code: string): Classroom | undefined {
  return classroomByCode.get(code);
}

export function getLesson(id: string): Lesson | undefined {
  return lessonById.get(id);
}

/** Danh sách buổi học có sẵn (để UI hiện nút "Bắt đầu buổi học"). */
export function getLessons(): readonly Lesson[] {
  return lessons;
}
