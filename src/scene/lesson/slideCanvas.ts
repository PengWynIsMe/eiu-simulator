export const SLIDE_W = 1024;
export const SLIDE_H = 768;

const TITLE_COLOR = '#0b3d91';
const PAD = 56;
const SANS = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SF Mono", Menlo, Consolas, "Courier New", monospace';

export interface SlideCover {
  title: string;
  subtitle: string;
}

export interface SlideDrawContent {
  title: string;
  body: string;
  code?: string;
}

export interface SlideDrawTarget {
  slide: SlideDrawContent | null;
  cover: SlideCover;
}

/** Tự xuống dòng theo bề rộng; trả về số dòng đã vẽ. */
function wrapText(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number): number {
  let line = '';
  let n = 0;
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y + n * lineH);
      n++;
      line = word;
      if (n >= maxLines) return n;
    } else {
      line = test;
    }
  }
  if (line && n < maxLines) {
    g.fillText(line, x, y + n * lineH);
    n++;
  }
  return n;
}

/**
 * Vẽ 1 slide (hoặc bìa khi `slide` = null) lên canvas 1024 × 768.
 * Chỉ nhận { slide, cover } (cover bắt buộc).
 */
export function drawSlide(g: CanvasRenderingContext2D, { slide, cover }: SlideDrawTarget): void {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, SLIDE_W, SLIDE_H);
  g.fillStyle = TITLE_COLOR;
  g.fillRect(0, 0, SLIDE_W, 14);
  g.textBaseline = 'top';

  if (!slide) {
    g.fillStyle = TITLE_COLOR;
    g.font = `bold 78px ${SANS}`;
    g.fillText(cover.title, PAD, 270);
    g.fillStyle = '#475569';
    g.font = `52px ${SANS}`;
    g.fillText(cover.subtitle, PAD, 380);
    g.fillStyle = TITLE_COLOR;
    g.fillRect(PAD, 360, 180, 6);
    return;
  }

  g.fillStyle = TITLE_COLOR;
  g.font = `bold 60px ${SANS}`;
  const titleLines = wrapText(g, slide.title, PAD, 50, SLIDE_W - PAD * 2, 70, 2);
  let y = 50 + titleLines * 70 + 16;

  if (slide.code) {
    const lines = slide.code.split('\n');
    const lineH = 44;
    const h = lines.length * lineH + 40;
    g.fillStyle = '#0f172a';
    g.beginPath();
    g.roundRect(PAD, y, SLIDE_W - PAD * 2, h, 16);
    g.fill();
    g.font = `34px ${MONO}`;
    g.fillStyle = '#a7f3d0';
    lines.forEach((l, i) => g.fillText(l, PAD + 28, y + 20 + i * lineH));
    y += h + 30;
  }

  g.fillStyle = '#1e293b';
  g.font = `38px ${SANS}`;
  wrapText(g, slide.body, PAD, y, SLIDE_W - PAD * 2, 54, Math.max(1, Math.floor((SLIDE_H - y - 30) / 54)));
}
