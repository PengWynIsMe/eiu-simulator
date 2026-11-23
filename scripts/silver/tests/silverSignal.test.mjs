export default {
  'maps step types to modes correctly'({ assert, load }) {
    return load('/src/silverWorld/silverSignal.ts').then(({ toClassSignal }) => {
      const baseView = {
        chapterId: '2.2',
        itemIndex: 0,
        itemCount: 5,
        item: {
          id: 'session:cse-103:lab:1',
          kind: 'session',
          courseCode: 'CSE 103',
          minutes: 45,
          scene: {
            id: 'CSE 103/lab-1',
            title: { vi: 'Thực hành 1', en: 'Lab 1' },
            place: '406.B8',
            minutes: 45,
            steps: [],
          },
        },
        stepIndex: 0,
        stepCount: 6,
        step: {
          id: 'step-say',
          type: 'say',
          speaker: 'teacher',
          text: { vi: 'Chào cả lớp', en: 'Hello class' },
        },
        feedback: null,
        attempts: 0,
        hint: null,
        canContinue: true,
      };

      // say -> talk
      const sigSay = toClassSignal(baseView, null, { lang: 'vi' });
      assert.equal(sigSay.mode, 'talk');
      assert.equal(sigSay.speaker, 'teacher');
      assert.equal(sigSay.slide, null);
      assert.equal(sigSay.result, null);
      assert.equal(sigSay.cover.title, 'Thực hành 1');

      // choice -> talk
      const sigChoice = toClassSignal({
        ...baseView,
        step: {
          id: 'step-choice',
          type: 'choice',
          speaker: 'han',
          text: { vi: 'Hôm nay học gì?', en: 'What today?' },
          options: [],
        },
      }, null, { lang: 'en' });
      assert.equal(sigChoice.mode, 'talk');
      assert.equal(sigChoice.speaker, 'han');
      assert.equal(sigChoice.cover.title, 'Lab 1');

      // slide -> slide
      const sigSlide = toClassSignal({
        ...baseView,
        step: {
          id: 'step-slide',
          type: 'slide',
          title: { vi: 'Biến trong Java', en: 'Java Variables' },
          body: { vi: 'Giải thích biến', en: 'Variables explain' },
          code: 'int a = 5;',
        },
      }, null, { lang: 'vi' });
      assert.equal(sigSlide.mode, 'slide');
      assert.ok(sigSlide.slide);
      assert.equal(sigSlide.slide.title, 'Biến trong Java');
      assert.equal(sigSlide.slide.code, 'int a = 5;');

      // question -> question
      const sigQuestion = toClassSignal({
        ...baseView,
        step: {
          id: 'step-q',
          type: 'question',
          prompt: { vi: 'Câu hỏi', en: 'Question' },
          options: [],
          answerId: 'opt-a',
          explainCorrect: { vi: 'Đúng', en: 'Correct' },
          explainWrong: { vi: 'Sai', en: 'Wrong' },
        },
      }, null, { lang: 'vi' });
      assert.equal(sigQuestion.mode, 'question');

      // order -> question
      const sigOrder = toClassSignal({
        ...baseView,
        step: {
          id: 'step-order',
          type: 'order',
          prompt: { vi: 'Sắp xếp', en: 'Order' },
          items: [],
          answer: [],
          explainCorrect: { vi: 'Đúng', en: 'Correct' },
          explainWrong: { vi: 'Sai', en: 'Wrong' },
        },
      }, null, { lang: 'vi' });
      assert.equal(sigOrder.mode, 'question');

      // code -> exercise
      const sigCode = toClassSignal({
        ...baseView,
        step: {
          id: 'step-code',
          type: 'code',
          title: { vi: 'Bài tập', en: 'Exercise' },
          instruction: { vi: 'Điền vào chỗ trống', en: 'Fill in' },
          template: 'int x = ___',
          answers: ['10'],
          outputCorrect: '10',
          outputWrong: '0',
          hint: { vi: 'Gợi ý', en: 'Hint' },
          explainWrong: { vi: 'Sai rồi', en: 'Wrong' },
        },
      }, null, { lang: 'vi' });
      assert.equal(sigCode.mode, 'exercise');

      // cảnh cuối của môn -> end
      const sigEnd = toClassSignal(baseView, null, { isCourseEnd: true });
      assert.equal(sigEnd.mode, 'end');
    });
  },

  'tracker increments result.id on feedback changes'({ assert, load }) {
    return load('/src/silverWorld/silverSignal.ts').then(({ createSilverSignalTracker }) => {
      const tracker = createSilverSignalTracker({ getLang: () => 'vi' });
      const initial = tracker.getSignal();
      assert.equal(initial.mode, 'idle');
      assert.equal(initial.result, null);

      const view = {
        chapterId: '2.2',
        itemIndex: 0,
        itemCount: 1,
        item: {
          id: 'session:cse-103:lab:1',
          kind: 'session',
          courseCode: 'CSE 103',
          minutes: 45,
          scene: { id: 'lab-1', title: { vi: 'Lab 1', en: 'Lab 1' }, place: '406.B8', minutes: 45, steps: [] },
        },
        stepIndex: 2,
        stepCount: 5,
        step: {
          id: 'q1',
          type: 'question',
          prompt: { vi: 'Câu 1', en: 'Q 1' },
          options: [],
          answerId: 'a',
          explainCorrect: { vi: 'Đúng', en: 'Correct' },
          explainWrong: { vi: 'Sai', en: 'Wrong' },
        },
        feedback: null,
        attempts: 0,
        hint: null,
        canContinue: false,
      };

      // Before answer: result is null
      const sig1 = tracker.update(view);
      assert.equal(sig1.result, null);

      // Wrong answer submitted
      const sig2 = tracker.update({
        ...view,
        feedback: { kind: 'graded', correct: false, explain: { vi: 'Sai', en: 'Wrong' }, revealed: false },
        attempts: 1,
      });
      assert.ok(sig2.result);
      assert.equal(sig2.result.id, 1);
      assert.equal(sig2.result.correct, false);

      // Same feedback in next render: id does NOT increase
      const sig3 = tracker.update({
        ...view,
        feedback: { kind: 'graded', correct: false, explain: { vi: 'Sai', en: 'Wrong' }, revealed: false },
        attempts: 1,
      });
      assert.equal(sig3.result.id, 1);

      // Correct answer submitted: id increments to 2
      const sig4 = tracker.update({
        ...view,
        feedback: { kind: 'graded', correct: true, explain: { vi: 'Đúng', en: 'Correct' }, revealed: false },
        attempts: 2,
      });
      assert.equal(sig4.result.id, 2);
      assert.equal(sig4.result.correct, true);

      // Next step (no feedback yet): result is null
      const sig5 = tracker.update({
        ...view,
        stepIndex: 3,
        step: { id: 'next-step', type: 'say', speaker: 'teacher', text: { vi: 'Tốt', en: 'Good' } },
        feedback: null,
      });
      assert.equal(sig5.result, null);

      // Another feedback on next step: id increments to 3
      const sig6 = tracker.update({
        ...view,
        stepIndex: 3,
        feedback: { kind: 'choice', optionId: 'opt-1' },
      });
      assert.equal(sig6.result.id, 3);
      assert.equal(sig6.result.correct, true);
    });
  },
};
