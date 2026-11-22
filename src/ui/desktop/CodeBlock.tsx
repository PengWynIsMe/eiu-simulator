import { tokenizeJava, type TokenKind } from './tokenize';

// Màu kiểu IDE tối; `light` dùng cho nền sáng (thẻ slide).
const DARK: Record<TokenKind, string> = {
  keyword: 'text-purple-400',
  type: 'text-teal-300',
  string: 'text-orange-300',
  number: 'text-yellow-300',
  comment: 'text-slate-500 italic',
  plain: 'text-slate-100',
};
const LIGHT: Record<TokenKind, string> = {
  keyword: 'text-purple-700',
  type: 'text-teal-700',
  string: 'text-orange-600',
  number: 'text-yellow-700',
  comment: 'text-slate-400 italic',
  plain: 'text-slate-800',
};

export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** Các `<span>` đã tô màu (không bọc `<pre>`), để nhúng vào dòng code có ô input. */
export function CodeSpans({ code, light = false }: { code: string; light?: boolean }) {
  const palette = light ? LIGHT : DARK;
  return (
    <>
      {tokenizeJava(code).map((t, i) => (
        <span key={i} className={palette[t.kind]}>
          {t.text}
        </span>
      ))}
    </>
  );
}

export default function CodeBlock({ code, light = false }: { code: string; light?: boolean }) {
  return (
    <pre
      className={`overflow-x-auto rounded-xl p-3 text-[13px] leading-6 sm:text-sm ${light ? 'bg-slate-100' : 'bg-slate-900'}`}
      style={{ fontFamily: MONO }}
    >
      <code>
        <CodeSpans code={code} light={light} />
      </code>
    </pre>
  );
}
