import { useEffect, useState } from 'react';

/** Chữ chạy dần `cps` ký tự/giây. Đổi `text` hoặc `active` từ false → true thì chạy lại từ đầu. */
export function useTypewriter(text: string, cps: number, active = true) {
  const [state, setState] = useState({ text: '', count: 0 });
  const count = state.text === text ? state.count : 0;
  const done = count >= text.length;

  useEffect(() => {
    if (!active || text.length === 0) return;
    const id = window.setInterval(() => {
      setState((s) => {
        const c = s.text === text ? s.count : 0;
        return c >= text.length ? s : { text, count: c + 1 };
      });
    }, 1000 / cps);
    return () => window.clearInterval(id);
  }, [text, cps, active]);

  const skip = () => setState({ text, count: text.length });
  return { shown: active ? text.slice(0, count) : '', done: active && done, skip };
}
