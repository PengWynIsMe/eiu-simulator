import { CanvasTexture, SRGBColorSpace, type Material } from 'three';
import { BOOK_STEP_COUNT } from './bookStairLayout';

const BOOKS = [
  ['ADAM SMITH', '#9f2d34', '#fff3df'],
  ['GLOBAL LOGISTICS', '#227449', '#fffaf0'],
  ['OWN YOUR FUTURE', '#b83139', '#fff7ed'],
  ['BRIDGING THE SOFT SKILLS GAP', '#292c46', '#fff6cf'],
  ['TALK LIKE TED', '#e3ded4', '#242436'],
  ['THE BASICS', '#aa3641', '#fff6ea'],
  ['BLUE OCEAN STRATEGY', '#dce6e5', '#16436d'],
  ['2 BIG TO FAIL', '#c8c6be', '#293b50'],
  ['BRINGING OUT THE BEST IN PEOPLE', '#e9ddcd', '#533f34'],
  ['THE ESSENTIALS', '#254b49', '#f1f5df'],
  ['STRATEGY', '#392f48', '#fff1d2'],
  ['LEADERSHIP', '#607981', '#fff9ea'],
  ['GETTING THINGS DONE', '#d6d6c5', '#273745'],
  ['ECONOMICS', '#44604c', '#fff1cf'],
  ['THINKING BIG', '#d7b258', '#342829'],
  ['COMMUNICATION', '#395872', '#f2f6fa'],
  ['BUILDING TEAMS', '#ded8c7', '#2b3338'],
  ['MANAGEMENT', '#963738', '#fff1d2'],
  ['MARKETING', '#1c4667', '#f8fafc'],
  ['BUSINESS IN ACTION', '#e1c58a', '#3c302c'],
] as const;

const ATLAS_ROWS = 32;
let atlas: CanvasTexture | undefined;

/** Một atlas dùng chung suốt vòng đời app, chỉ khởi tạo khi cảnh cần gáy sách. */
export function getBookSpineAtlas(): CanvasTexture {
  if (atlas) return atlas;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const rowHeight = canvas.height / ATLAS_ROWS;
  const ctx = canvas.getContext('2d');
  BOOKS.forEach(([title, background, ink], i) => {
    if (!ctx) return;
    const top = i * rowHeight;
    const middle = top + rowHeight / 2;
    ctx.fillStyle = background;
    ctx.fillRect(0, top, canvas.width, rowHeight);
    ctx.fillStyle = ink;
    ctx.fillRect(37, top + 9, 3, rowHeight - 18);
    ctx.fillRect(canvas.width - 40, top + 9, 3, rowHeight - 18);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 23px Arial, Helvetica, sans-serif';
    ctx.fillText(title, canvas.width / 2, middle, canvas.width - 112);
  });
  atlas = new CanvasTexture(canvas);
  atlas.colorSpace = SRGBColorSpace;
  atlas.anisotropy = 4;
  return atlas;
}

export const BOOK_ATLAS_ROW_INDEXES = Float32Array.from({ length: BOOK_STEP_COUNT }, (_, i) => i);

export function applyBookAtlasRows(shader: Parameters<Material['onBeforeCompile']>[0]) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float bookRow;')
    .replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
       vMapUv.y = 1.0 - (bookRow + mix(0.94, 0.06, vMapUv.y)) / ${ATLAS_ROWS.toFixed(1)};`,
    );
}
