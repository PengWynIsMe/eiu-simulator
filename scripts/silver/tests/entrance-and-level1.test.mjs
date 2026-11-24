import { readFileSync } from 'node:fs';

export default {
  '1.1/greet-han choices change Han dialogues in CSE 103 lab-1 and 2.2': async ({ assert, load }) => {
    const { resolveStep } = await load('/src/silver/run.ts');
    const cse103 = JSON.parse(readFileSync('src/data/silver/content/cse-103.json', 'utf8'));
    const ch22 = JSON.parse(readFileSync('src/data/silver/chapters/2.2.json', 'utf8'));

    // 1. CSE 103 lab-1 Han dialogue step
    const lab1 = cse103.sessions[0].scene;
    const hanStep = lab1.steps.find((s) => s.id === 'han');
    assert.ok(hanStep, 'Tìm thấy step han trong CSE 103 lab-1');

    // Chưa chơi 1.1/greet-han: câu chào ban đầu
    const withoutSeen = resolveStep(hanStep, { seen: new Set(), flags: {} });
    assert.equal(withoutSeen.text.vi, 'Chào bạn, mình là Han. Máy của bạn biết chào rồi kìa!');

    // Đã chơi 1.1/greet-han: câu biến thể hồi ức
    const withSeen = resolveStep(hanStep, { seen: new Set(['1.1/greet-han']), flags: {} });
    assert.equal(withSeen.text.vi, 'Hồi đó tập chào nhau, giờ tới lượt máy chào tụi mình.');

    // 2. Chapter 2.2 Han dialogue step (sau khi thi ở 2.2/closing)
    const closingScene = ch22.closing[0];
    const han22Step = closingScene.steps.find((s) => s.speaker === 'han' && s.variants?.length);
    assert.ok(han22Step, 'Tìm thấy step han trong 2.2 closing');

    // Biến thể lựa chọn practice ("Nice to meet you!")
    const withPractice = resolveStep(han22Step, {
      seen: new Set(['1.1/greet-han']),
      flags: { '1.1/han': 'practice' },
    });
    assert.match(withPractice.text.vi, /hồi tập “Nice to meet you” mình còn run hơn thế nhiều/);

    // Biến thể lựa chọn joke ("ba lần cho chắc ăn")
    const withJoke = resolveStep(han22Step, {
      seen: new Set(['1.1/greet-han']),
      flags: { '1.1/han': 'joke' },
    });
    assert.match(withJoke.text.vi, /may là không phải nói “Nice to meet you” ba lần/);
  },

  'examiner model in 1.1/final replaces teacher': async ({ assert, load }) => {
    const { characterConfig } = await load('/src/data/phase2.ts');
    const stages = JSON.parse(readFileSync('src/data/silver/stages.json', 'utf8')).stages;

    const finalStage = stages.find((s) => s.sceneId === '1.1/final');
    assert.ok(finalStage, 'Cảnh 1.1/final tồn tại trong stages.json');

    const examinerActor = finalStage.actors.find((a) => a.speaker === 'examiner');
    assert.ok(examinerActor, '1.1/final có diễn viên examiner');
    assert.equal(examinerActor.pose, 'idle');
    assert.equal(examinerActor.spot, undefined, 'Examiner đứng lớp không có spot riêng (thay vị trí teacher)');

    assert.ok(characterConfig.story?.examiner, 'characterConfig có model cho examiner');
    assert.match(characterConfig.story.examiner, /character-female-d\.glb/);
  },

  'all 13 entrance and 1.1 stages have reachable targets and valid triggers': async ({ assert, load }) => {
    const { getStage } = await load('/src/data/silver/stages.ts');
    const entranceStages = [
      'entrance/meet-thanh',
      'entrance/listening',
      'entrance/reading',
      'entrance/writing',
      'entrance/speaking',
      'entrance/result',
    ];
    const level1Stages = [
      '1.1/greet-han',
      '1.1/skills',
      '1.1/philosophy',
      '1.1/pe',
      '1.1/midterm',
      '1.1/final',
      '1.1/after',
    ];

    for (const sceneId of [...entranceStages, ...level1Stages]) {
      const stage = getStage(sceneId);
      assert.ok(stage, `Stage ${sceneId} phải tồn tại`);
      assert.ok(['sit', 'talk', 'look'].includes(stage.trigger), `Stage ${sceneId} có trigger hợp lệ`);
      assert.ok(stage.target, `Stage ${sceneId} có target`);
      assert.ok(stage.arrival, `Stage ${sceneId} có arrival`);
    }
  },

  'choice step triggers talk signal and nodding response': async ({ assert, load }) => {
    const { toClassSignal, createSilverSignal } = await load('/src/silverWorld/silverSignal.ts');

    const mockPlayView = {
      chapterId: 'entrance',
      stepIndex: 1,
      stepCount: 2,
      canContinue: true,
      feedback: null,
      item: {
        id: 'entrance/meet-thanh',
        kind: 'scene',
        minutes: 1.5,
        scene: {
          id: 'entrance/meet-thanh',
          title: { vi: 'Trước cửa B8', en: 'In front of B8' },
          place: 'b8',
          minutes: 1.5,
          steps: [],
        },
      },
      step: {
        id: 'ask',
        type: 'choice',
        speaker: 'thanh',
        text: { vi: 'Xin lỗi...', en: 'Excuse me...' },
        options: [{ id: 'warm', text: { vi: 'Đi chung nhé?', en: 'Together?' } }],
      },
    };

    // Kiểm tra toClassSignal chuyển choice thành mode: 'talk' với speaker
    const signal = toClassSignal(mockPlayView, 'vi', null);
    assert.equal(signal.mode, 'talk');
    assert.equal(signal.speaker, 'thanh');

    // Kiểm tra createSilverSignal phát sinh result.id mới khi chọn đáp án
    let currentPlay = mockPlayView;
    const silverStore = {
      getState: () => ({ play: currentPlay }),
      subscribe: (fn) => {
        silverStore._listener = fn;
        return () => {};
      },
    };
    const langStore = {
      getState: () => ({ lang: 'vi' }),
      subscribe: () => () => {},
    };

    const handle = createSilverSignal(silverStore, langStore);
    const initialSignal = handle.getSignal();
    assert.equal(initialSignal.result, null);

    // Người chơi chọn đáp án
    currentPlay = {
      ...mockPlayView,
      feedback: { kind: 'choice', optionId: 'warm' },
    };
    silverStore._listener();

    const answeredSignal = handle.getSignal();
    assert.ok(answeredSignal.result !== null, 'Phải có result khi feedback choice được cập nhật');
    assert.equal(answeredSignal.result.correct, true);
    assert.equal(answeredSignal.mode, 'talk');
    assert.equal(answeredSignal.speaker, 'thanh');
  },
};
