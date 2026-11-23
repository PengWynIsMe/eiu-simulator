export default {
  'lessonSignal caches snapshot for unchanged state and updates result ID properly': async ({ assert, load }) => {
    const { getLessonSignal } = await load('/src/silverWorld/lessonSignal.ts');
    const { useLessonStore } = await load('/src/store/useLessonStore.ts');

    // 1. Khởi động bài học
    useLessonStore.getState().startLesson('nmlt-01');

    // Gọi 2 lần cùng state trả cùng tham chiếu (cùng object identity)
    const sig1 = getLessonSignal();
    const sig2 = getLessonSignal();
    assert.equal(sig1, sig2, 'Hai lần gọi getLessonSignal khi state không đổi phải trả cùng tham chiếu');

    // 2. Kết quả mới thì result.id tăng
    useLessonStore.setState({ lastResult: { correct: true, output: 'ok' } });
    const sigResult1 = getLessonSignal();
    assert.ok(sigResult1.result !== null, 'result phải khác null');
    assert.equal(sigResult1.result.correct, true);
    const id1 = sigResult1.result.id;

    // 3. Đặt lại null thì result null
    useLessonStore.setState({ lastResult: null });
    const sigNull = getLessonSignal();
    assert.equal(sigNull.result, null, 'Đặt lastResult null thì result trong signal phải là null');

    // 4. Hai kết quả liên tiếp cùng đúng/sai vẫn khác id
    useLessonStore.setState({ lastResult: { correct: true, output: 'first' } });
    const sigConsecutive1 = getLessonSignal();
    assert.ok(sigConsecutive1.result !== null);
    const idFirst = sigConsecutive1.result.id;
    assert.ok(idFirst > id1, 'id lần nộp sau phải lớn hơn lần nộp trước');

    useLessonStore.setState({ lastResult: { correct: true, output: 'second' } });
    const sigConsecutive2 = getLessonSignal();
    assert.ok(sigConsecutive2.result !== null);
    const idSecond = sigConsecutive2.result.id;
    assert.notEqual(idFirst, idSecond, 'Hai kết quả liên tiếp cùng correct: true vẫn phải khác id');
    assert.ok(idSecond > idFirst, 'id của kết quả thứ 2 phải lớn hơn id của kết quả thứ 1');

    // Dọn dẹp store
    useLessonStore.getState().endLesson();
  },
};
