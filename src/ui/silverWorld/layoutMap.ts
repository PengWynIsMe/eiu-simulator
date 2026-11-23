import type { WaypointLayoutMap } from '../../silverWorld/waypoint';
import { createRoomWaypoint } from '../../silverWorld/waypoint';
import { getClassroom } from '../../data/phase2';
import {
  toLocal as b8ToLocal,
  B8_ENTRANCE_SOUTH_OUTSIDE,
  B8_ENTRANCE_NORTH_OUTSIDE,
  B8_ELEVATOR_POS_WORLD,
  B8_ENTRANCE_SOUTH_INSIDE,
  B8_ENTRANCE_NORTH_INSIDE,
} from '../../scene/interior/layouts/b8';

/**
 * Dựng layoutMap phục vụ thuật toán nextWaypoint từ hằng export của b8.ts
 * và các phòng được khai báo trong classrooms.json.
 */
export function getSilverWaypointLayoutMap(): WaypointLayoutMap {
  const b8RoomCodes = ['406.B8', '206.B8', '207.B8', '208.B8', '311.B8'];
  const rooms = b8RoomCodes
    .map((code) => getClassroom(code))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((room) => createRoomWaypoint(room, b8ToLocal));

  return {
    b8: {
      buildingId: 'b8',
      entrances: [
        { x: B8_ENTRANCE_SOUTH_OUTSIDE[0], z: B8_ENTRANCE_SOUTH_OUTSIDE[1] },
        { x: B8_ENTRANCE_NORTH_OUTSIDE[0], z: B8_ENTRANCE_NORTH_OUTSIDE[1] },
      ],
      elevator: { x: B8_ELEVATOR_POS_WORLD[0], z: B8_ELEVATOR_POS_WORLD[1] },
      exitDoors: [
        { x: B8_ENTRANCE_SOUTH_INSIDE[0], z: B8_ENTRANCE_SOUTH_INSIDE[1] },
        { x: B8_ENTRANCE_NORTH_INSIDE[0], z: B8_ENTRANCE_NORTH_INSIDE[1] },
      ],
      rooms,
    },
  };
}
