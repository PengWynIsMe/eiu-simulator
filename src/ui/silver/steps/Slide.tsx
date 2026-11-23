import type { SlideStep } from '../../../types/silver';
import { useT } from '../../text';
import CodeBlock from '../../desktop/CodeBlock';

interface SlideProps {
  step: SlideStep;
}

/** Bước trình bày kiến thức: tiêu đề, khối code (nếu có) và nội dung. */
export default function Slide({ step }: SlideProps) {
  const tr = useT();

  return (
    <div className="w-full max-h-[50dvh] space-y-3 overflow-y-auto">
      <h3 className="text-lg font-bold text-[#0b3d91]">{tr(step.title)}</h3>
      {step.code && <CodeBlock code={step.code} />}
      <p className="whitespace-pre-line text-[15px] leading-6 text-slate-700">{tr(step.body)}</p>
    </div>
  );
}
