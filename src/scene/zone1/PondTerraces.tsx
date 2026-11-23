import { Vector2 } from 'three';
import { GRASS, POND_RIM } from '../groundLevels';
import StaticInstances, { type StaticInstance } from '../kit/StaticInstances';
import { POND_ROTATION_Y } from './pondLayout';
import { POND_POT_RADIUS, POND_POTS, POND_STEP_COUNT, POND_STEP_DEPTH, POND_STEP_RISE, POND_TERRACES } from './pondTerraceLayout';

const concrete: StaticInstance[] = [];
const edges: StaticInstance[] = [];
for (const { minU, maxU, v, side } of POND_TERRACES) {
  const width = maxU - minU;
  const sections = Math.ceil(width / 2.1);
  const sectionWidth = width / sections;
  const edgeDepth = 0.075;
  for (let i = 0; i < POND_STEP_COUNT; i++) {
    const top = POND_RIM - i * POND_STEP_RISE;
    const height = top - GRASS;
    const outer = v + (i + 1) * POND_STEP_DEPTH * side;
    concrete.push({
      position: [(minU + maxU) / 2, GRASS + height / 2, outer - side * POND_STEP_DEPTH / 2],
      scale: [width, height, POND_STEP_DEPTH],
    });
    for (let j = 0; j < sections; j++) {
      edges.push({
        position: [minU + (j + 0.5) * sectionWidth, top - 0.035, outer - side * (edgeDepth / 2 - 0.004)],
        scale: [sectionWidth, 0.077, edgeDepth],
        color: j % 2 === 0 ? '#e7b94c' : '#64748b',
      });
    }
  }
}

const POT_HEIGHT = 0.35;
const potProfile = [
  new Vector2(0, 0), new Vector2(0.20, 0), new Vector2(0.29, 0.055),
  new Vector2(0.38, 0.18), new Vector2(POND_POT_RADIUS, POT_HEIGHT - 0.025),
  new Vector2(POND_POT_RADIUS, POT_HEIGHT), new Vector2(0.36, POT_HEIGHT),
  new Vector2(0.345, POT_HEIGHT - 0.058), new Vector2(0, POT_HEIGHT - 0.058),
];
const pots: StaticInstance[] = [];
const stems: StaticInstance[] = [];
const leaves: StaticInstance[] = [];
const flowers: StaticInstance[] = [];
const blooms = ['#db3885', '#f065a0', '#ed784a', '#f89c59'];

POND_POTS.forEach(({ u, v }, i) => {
  pots.push({
    position: [u, POND_RIM, v],
    scale: [1, 1, 1],
    color: i % 3 === 0 ? '#565158' : '#443e3b',
  });
  const plantScale = 0.78 + (i % 4) * 0.1;
  for (let j = 0; j < 6; j++) {
    const angle = i * 1.7 + j * 2.4;
    const branch = (0.38 + (j % 3) * 0.14) * plantScale;
    const lean = 0.22 + (j % 2) * 0.16;
    const dx = Math.sin(angle) * branch * Math.sin(lean);
    const dz = Math.cos(angle) * branch * Math.sin(lean);
    const dy = branch * Math.cos(lean);
    const y = POND_RIM + POT_HEIGHT - 0.06;
    stems.push({
      position: [u + dx / 2, y + dy / 2, v + dz / 2],
      scale: [0.015, branch, 0.015],
      rotation: [Math.atan2(dz, dy), 0, -Math.atan2(dx, Math.hypot(dy, dz))],
    });
    leaves.push({
      position: [u + dx, y + dy * 0.76, v + dz],
      scale: [0.24, 0.137, 0.19],
      rotation: [0, angle, 0],
      color: j % 2 === 0 ? '#50853b' : '#38632a',
    });
    for (const offset of [-1, 1]) {
      flowers.push({
        position: [u + dx + offset * 0.078, y + dy + offset * 0.035, v + dz],
        scale: [0.113, 0.085, 0.096],
        rotation: [0, angle, offset * 0.35],
        color: blooms[((i % 2) * 2 + (j % 2))] ?? blooms[0],
      });
    }
  }
});

export default function PondTerraces() {
  return (
    <group rotation-y={POND_ROTATION_Y}>
      <StaticInstances items={concrete} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </StaticInstances>
      <StaticInstances items={edges}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.8} />
      </StaticInstances>
      <StaticInstances items={pots}>
        <latheGeometry args={[potProfile, 10]} />
        <meshStandardMaterial roughness={0.78} flatShading />
      </StaticInstances>
      <StaticInstances items={stems}>
        <cylinderGeometry args={[0.75, 1, 1, 5]} />
        <meshStandardMaterial color="#6b5534" roughness={0.85} />
      </StaticInstances>
      <StaticInstances items={leaves}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.82} flatShading />
      </StaticInstances>
      <StaticInstances items={flowers}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.72} flatShading />
      </StaticInstances>
    </group>
  );
}
