// Lưu/đọc ghi chú góp ý.
// - Khi `npm run dev`: đọc/ghi thẳng review/notes.json qua plugin Vite (/__review/notes).
// - Bản build (GitHub Pages): ghi chú gửi thành GitHub Issue (mở trang tạo Issue điền sẵn) để cả nhóm cùng thấy;
//   bản sao lưu trong trình duyệt + "Tải file ghi chú" cho người không có tài khoản GitHub.
// - Mọi bản đều đọc thêm Issue góp ý từ GitHub (API công khai, repo public) → thấy ghim của mọi người.
import type { ReviewCategory, ReviewNote, ReviewStatus, Vec3 } from '../types';
import { arr, num, obj, oneOf, optStr, str } from './validate';

export const REVIEW_CATEGORIES: readonly { id: ReviewCategory; label: string }[] = [
  { id: 'vi-tri', label: 'Sai vị trí' },
  { id: 'hinh-dang', label: 'Sai hình dáng' },
  { id: 'mau', label: 'Sai màu / vật liệu' },
  { id: 'so-tang', label: 'Sai số tầng / chiều cao' },
  { id: 'thieu', label: 'Thiếu công trình' },
  { id: 'khac', label: 'Khác' },
];

const STATUSES: readonly ReviewStatus[] = ['mo', 'da-sua'];
const ENDPOINT = '/__review/notes';
const LOCAL_KEY = 'campussim.reviewNotes';
const AUTHOR_KEY = 'campussim.reviewAuthor';
const REPO = 'PengWynIsMe/eiu-simulator';
const ISSUE_PREFIX = '[Góp ý]';
const NOTE_MARKER = 'campussim-note';

/** Ghi được thẳng vào file trong repo (chỉ khi chạy `npm run dev`). */
export const canWriteRepoFile = import.meta.env.DEV;

function vec3(v: unknown, path: string): Vec3 {
  const a = arr(v, path);
  return [num(a[0], `${path}[0]`), num(a[1], `${path}[1]`), num(a[2], `${path}[2]`)];
}

function parseNote(v: unknown, path: string): ReviewNote {
  const o = obj(v, path);
  const cam = obj(o.camera, `${path}.camera`);
  return {
    id: str(o.id, `${path}.id`),
    createdAt: str(o.createdAt, `${path}.createdAt`),
    author: str(o.author, `${path}.author`),
    targetId: o.targetId === null ? null : str(o.targetId, `${path}.targetId`),
    point: vec3(o.point, `${path}.point`),
    camera: { position: vec3(cam.position, `${path}.camera.position`), target: vec3(cam.target, `${path}.camera.target`) },
    category: oneOf(o.category, REVIEW_CATEGORIES.map((c) => c.id), `${path}.category`),
    text: str(o.text, `${path}.text`),
    status: oneOf(o.status, STATUSES, `${path}.status`),
    resolution: optStr(o.resolution, `${path}.resolution`),
    source: o.source === undefined ? undefined : oneOf(o.source, ['local', 'github'] as const, `${path}.source`),
    issueUrl: optStr(o.issueUrl, `${path}.issueUrl`),
  };
}

export function parseNotes(v: unknown): ReviewNote[] {
  return arr(v, 'notes').map((n, i) => parseNote(n, `notes[${i}]`));
}

export async function loadNotes(): Promise<ReviewNote[]> {
  if (canWriteRepoFile) {
    const res = await fetch(ENDPOINT);
    return parseNotes(await res.json());
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? parseNotes(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export async function saveNotes(notes: ReviewNote[]): Promise<void> {
  if (canWriteRepoFile) {
    const res = await fetch(ENDPOINT, { method: 'PUT', body: JSON.stringify(notes) });
    if (!res.ok) throw new Error(`Không lưu được ghi chú: ${res.status}`);
    return;
  }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
  } catch {
    // Trình duyệt chặn lưu (chế độ riêng tư) — vẫn tải file được.
  }
}

/** Tải toàn bộ ghi chú thành file JSON để gửi cho chủ dự án. */
export function downloadNotesFile(notes: ReviewNote[], author: string): void {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `gop-y-${author || 'an-danh'}-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Đọc file ghi chú (của đồng nghiệp) và gộp vào danh sách hiện có, bỏ trùng theo id. */
export async function mergeNotesFile(file: File, current: ReviewNote[]): Promise<ReviewNote[]> {
  const incoming = parseNotes(JSON.parse(await file.text()));
  const ids = new Set(current.map((n) => n.id));
  return [...current, ...incoming.filter((n) => !ids.has(n.id))];
}

export function loadAuthor(): string {
  try {
    return localStorage.getItem(AUTHOR_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveAuthor(name: string): void {
  try {
    localStorage.setItem(AUTHOR_KEY, name);
  } catch {
    // bỏ qua
  }
}

export function newNoteId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---- GitHub Issues: góp ý dùng chung ----

function categoryLabel(id: ReviewCategory): string {
  return REVIEW_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Link mở trang tạo Issue đã điền sẵn (người gửi bấm Submit trên GitHub). */
export function issueUrlFor(note: ReviewNote, targetName: string): string {
  const data: ReviewNote = { ...note, source: undefined, issueUrl: undefined };
  const title = `${ISSUE_PREFIX} ${targetName} — ${categoryLabel(note.category)}`;
  const body = [
    `**Vật thể:** ${targetName}${note.targetId ? ` (\`${note.targetId}\`)` : ''}`,
    `**Loại:** ${categoryLabel(note.category)}`,
    `**Người góp ý:** ${note.author}`,
    '',
    note.text,
    '',
    `<!-- ${NOTE_MARKER}`,
    JSON.stringify(data),
    '-->',
  ].join('\n');
  const q = new URLSearchParams({ title, body, labels: 'gop-y' });
  return `https://github.com/${REPO}/issues/new?${q.toString()}`;
}

interface GithubIssue {
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  pull_request?: unknown;
}

function isGithubIssue(v: unknown): v is GithubIssue {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.title === 'string' && typeof o.state === 'string' && typeof o.html_url === 'string';
}

const NOTE_RE = new RegExp(`<!--\\s*${NOTE_MARKER}\\s*([\\s\\S]*?)-->`);

/** Đọc mọi Issue góp ý (mở + đã đóng). Issue đã đóng = đã sửa. Lỗi mạng → ném lỗi để store báo. */
export async function loadGithubNotes(): Promise<ReviewNote[]> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/issues?state=all&per_page=100`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`Không đọc được góp ý trên GitHub (${res.status})`);
  const list: unknown = await res.json();
  if (!Array.isArray(list)) return [];
  return list.filter(isGithubIssue).flatMap((issue) => {
    if (issue.pull_request || !issue.title.startsWith(ISSUE_PREFIX)) return [];
    const match = NOTE_RE.exec(issue.body ?? '');
    if (!match?.[1]) return [];
    try {
      const note = parseNote(JSON.parse(match[1]), issue.html_url);
      return [{ ...note, status: issue.state === 'closed' ? 'da-sua' : 'mo', source: 'github', issueUrl: issue.html_url } satisfies ReviewNote];
    } catch {
      return [];
    }
  });
}

/** Gộp ghi chú cục bộ + GitHub, bỏ trùng theo id (ưu tiên bản GitHub vì có trạng thái thật). */
export function mergeNoteSources(local: ReviewNote[], github: ReviewNote[]): ReviewNote[] {
  const ids = new Set(github.map((n) => n.id));
  return [...github, ...local.filter((n) => !ids.has(n.id))];
}
