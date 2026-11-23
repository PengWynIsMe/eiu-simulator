import { create } from 'zustand';

export default {
  'toClassSignal maps step types to modes correctly'({ assert, load }) {
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
      const sigSay = toClassSignal(baseView, 'vi', null);
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
      }, 'en', null);
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
      }, 'vi', null);
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
      }, 'vi', null);
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
      }, 'vi', null);
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
      }, 'vi', null);
      assert.equal(sigCode.mode, 'exercise');

      // cảnh cuối của môn -> end
      const sigEnd = toClassSignal(baseView, 'vi', null, true);
      assert.equal(sigEnd.mode, 'end');
    });
  },

  'createSilverSignal connects stores, keeps reference when state unchanged, and increments result.id on new feedback'({ assert, load }) {
    return load('/src/silverWorld/silverSignal.ts').then(({ createSilverSignal }) => {
      const fakeSilverStore = create(() => ({
        play: null,
      }));

      const fakeLangStore = create(() => ({
        lang: 'vi',
      }));

      const signalHandle = createSilverSignal(fakeSilverStore, fakeLangStore);

      try {
        // Initial idle signal
        const initial = signalHandle.getSignal();
        assert.equal(initial.mode, 'idle');
        assert.equal(initial.result, null);

        // Calling getSignal again returns exact same reference
        assert.equal(signalHandle.getSignal(), initial);

        const view = {
          chapterId: '2.2',
          itemIndex: 0,
          itemCount: 1,
          item: {
            id: 'session:cse-103:lab:1',
            kind: 'session',
            courseCode: 'CSE 103',
            minutes: 45,
            scene: { id: 'lab-1', title: { vi: 'Thực hành 1', en: 'Lab 1' }, place: '406.B8', minutes: 45, steps: [] },
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

        const notifications = [];
        const unsubscribe = signalHandle.subscribe((s) => notifications.push(s));

        // 1. Mount view without feedback
        fakeSilverStore.setState({ play: view });
        assert.equal(notifications.length, 1);
        const sig1 = signalHandle.getSignal();
        assert.equal(sig1.mode, 'question');
        assert.equal(sig1.result, null);
        assert.equal(sig1.cover.title, 'Thực hành 1');

        // Repeated getSignal calls return same reference
        assert.equal(signalHandle.getSignal(), sig1);

        // 2. Language changed -> updates text and notifies listener, keeping same step
        fakeLangStore.setState({ lang: 'en' });
        assert.equal(notifications.length, 2);
        const sigLang = signalHandle.getSignal();
        assert.equal(sigLang.cover.title, 'Lab 1');
        assert.equal(signalHandle.getSignal(), sigLang);

        // 3. User submits wrong answer (new feedback reference) -> result.id = 1
        const wrongFeedback1 = { kind: 'graded', correct: false, explain: { vi: 'Sai', en: 'Wrong' }, revealed: false };
        fakeSilverStore.setState({
          play: { ...view, feedback: wrongFeedback1, attempts: 1 },
        });
        const sigWrong1 = signalHandle.getSignal();
        assert.ok(sigWrong1.result);
        assert.equal(sigWrong1.result.id, 1);
        assert.equal(sigWrong1.result.correct, false);

        // Unchanged render -> same reference
        fakeSilverStore.setState({ play: fakeSilverStore.getState().play });
        assert.equal(signalHandle.getSignal(), sigWrong1);

        // 4. Retry -> feedback is null -> result is null
        fakeSilverStore.setState({
          play: { ...view, feedback: null, attempts: 1 },
        });
        const sigRetry = signalHandle.getSignal();
        assert.equal(sigRetry.result, null);

        // 5. User submits the exact same wrong answer again (new reference from store) -> result.id must increase to 2!
        const wrongFeedback2 = { kind: 'graded', correct: false, explain: { vi: 'Sai', en: 'Wrong' }, revealed: false };
        fakeSilverStore.setState({
          play: { ...view, feedback: wrongFeedback2, attempts: 2 },
        });
        const sigWrong2 = signalHandle.getSignal();
        assert.ok(sigWrong2.result);
        assert.equal(sigWrong2.result.id, 2);
        assert.equal(sigWrong2.result.correct, false);

        // 6. User reveals answer (revealed: true) -> does NOT count as new result, id stays 2
        const revealedFeedback = { kind: 'graded', correct: true, explain: { vi: 'Đáp án là a', en: 'Ans is a' }, revealed: true };
        fakeSilverStore.setState({
          play: { ...view, feedback: revealedFeedback, attempts: 2 },
        });
        const sigRevealed = signalHandle.getSignal();
        assert.ok(sigRevealed.result);
        assert.equal(sigRevealed.result.id, 2);

        unsubscribe();
      } finally {
        signalHandle.dispose();
      }
    });
  },
};
