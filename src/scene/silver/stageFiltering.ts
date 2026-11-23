import type { Classroom } from '../../types';
import type { SpeakerId } from '../../types/silver';
import type { StageActor, StageSpec } from '../../types/silverWorld';

/**
 * Lọc bỏ các model GLB của nhân vật cốt truyện (Han, Thành, Quyền...) khỏi danh sách sinh viên nền,
 * tránh việc sinh viên nền bị trùng ngoại hình với nhân vật cốt truyện trong cùng phòng học.
 */
export function filterBackgroundModels(
  rawModels: readonly string[],
  story?: Partial<Record<SpeakerId, string>>,
): string[] {
  if (!story) return [...rawModels];
  const storyUrls = new Set(Object.values(story));
  return rawModels.filter((url) => !storyUrls.has(url));
}

/**
 * Lọc bỏ khỏi danh sách npcSeats:
 * - Ghế của người chơi (room.playerSeat)
 * - Ghế của bạn học đồng hành nếu có (room.companionSeat)
 * - Ghế của tất cả các diễn viên cốt truyện tham gia cảnh có seatId (ví dụ Quyền 406-r1-s2)
 */
export function filterClassroomNpcSeats(
  room: Classroom,
  actorsOrStage?: readonly StageActor[] | StageSpec,
): string[] {
  const excluded = new Set<string>();
  if (room.playerSeat) excluded.add(room.playerSeat);
  if (room.companionSeat) excluded.add(room.companionSeat);

  const actors = Array.isArray(actorsOrStage)
    ? actorsOrStage
    : (actorsOrStage && 'actors' in actorsOrStage ? actorsOrStage.actors : undefined);

  if (actors) {
    for (const actor of actors) {
      if (actor.seatId) {
        excluded.add(actor.seatId);
      }
    }
  }

  return room.npcSeats.filter((seatId) => !excluded.has(seatId));
}

/**
 * Tạo bản sao Classroom an toàn cho một cảnh StageSpec, đảm bảo npcSeats
 * không chứa ghế của người chơi và các diễn viên trong cảnh.
 */
export function createSafeClassroomForStage(
  room: Classroom,
  stage?: StageSpec,
): Classroom {
  if (!stage) return room;
  return {
    ...room,
    npcSeats: filterClassroomNpcSeats(room, stage.actors),
  };
}
