// Tách token Java đơn giản (không thư viện). Một regex duy nhất quét từ trái sang phải
// nên chuỗi / chú thích chứa từ khóa không bị tô sai.
export type TokenKind = 'keyword' | 'type' | 'string' | 'number' | 'comment' | 'plain';

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set(['public', 'class', 'static', 'void', 'int', 'for', 'if', 'else', 'return', 'new', 'while', 'double', 'boolean', 'private']);
const TYPES = new Set(['String', 'System']);

// Thứ tự nhánh = độ ưu tiên: chú thích, chuỗi, số, từ.
const PATTERN = /(\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

export function tokenizeJava(source: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  const push = (kind: TokenKind, text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (kind === 'plain' && prev?.kind === 'plain') prev.text += text;
    else tokens.push({ kind, text });
  };
  for (const m of source.matchAll(PATTERN)) {
    const index = m.index ?? 0;
    push('plain', source.slice(last, index));
    const text = m[0];
    if (m[1] !== undefined) push('comment', text);
    else if (m[2] !== undefined) push('string', text);
    else if (m[3] !== undefined) push('number', text);
    else if (KEYWORDS.has(text)) push('keyword', text);
    else if (TYPES.has(text)) push('type', text);
    else push('plain', text);
    last = index + text.length;
  }
  push('plain', source.slice(last));
  return tokens;
}
