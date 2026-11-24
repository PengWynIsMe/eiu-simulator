export default {
  'WorldDayCard timer lifecycle: cleanup huy timerHide khi StrictMode hoac doi canh giua luc fade': async ({ assert }) => {
    // Mô phỏng logic timer của WorldDayCard
    let activeCard = { title: 'Thẻ 1' };
    let fadeState = 'hidden';

    // Giả lập effect
    function runCardEffect(card, onSetCard, onSetFade) {
      if (!card) {
        onSetFade('hidden');
        return () => {};
      }

      onSetFade('in');
      let timerHide = null;
      const timerOut = setTimeout(() => {
        onSetFade('out');
        timerHide = setTimeout(() => {
          onSetFade('hidden');
          onSetCard(null);
        }, 600);
      }, 1200);

      return () => {
        clearTimeout(timerOut);
        if (timerHide) clearTimeout(timerHide);
      };
    }

    // 1. StrictMode simulation: mount -> cleanup ngay sau 50ms -> mount lại
    let cleanup = runCardEffect(activeCard, (c) => { activeCard = c; }, (f) => { fadeState = f; });
    assert.equal(fadeState, 'in', 'StrictMode mount lan 1: fadeState = in');
    cleanup(); // Cleanup do StrictMode unmount
    assert.equal(activeCard?.title, 'Thẻ 1', 'Cleanup khong lam mat activeCard');

    // Mount lan 2
    cleanup = runCardEffect(activeCard, (c) => { activeCard = c; }, (f) => { fadeState = f; });
    assert.equal(fadeState, 'in', 'StrictMode mount lan 2: fadeState = in');

    // Chờ 1250ms -> timerOut chay, fadeState thanh 'out', timerHide bat dau cho 600ms
    await new Promise((r) => setTimeout(r, 1250));
    assert.equal(fadeState, 'out', 'Sau 1250ms: dang o pha out (mo dan)');

    // 2. Đổi cảnh giữa lúc mờ (sau 1300ms, lúc timerHide dang pending)
    cleanup(); // Cleanup the 1 khi the 2 den
    let the2 = { title: 'Thẻ 2' };
    activeCard = the2;
    cleanup = runCardEffect(the2, (c) => { activeCard = c; }, (f) => { fadeState = f; });
    assert.equal(fadeState, 'in', 'Thẻ 2 đến: lap tuc reset fadeState ve in');

    // Chờ tiếp 700ms (vượt quá thời gian 600ms của timerHide của Thẻ 1)
    await new Promise((r) => setTimeout(r, 700));

    // Khẳng định: Thẻ 2 KHÔNG bị timerHide của Thẻ 1 xóa mất!
    assert.ok(activeCard !== null, 'activeCard van con, khong bi timerHide cua The 1 xoa');
    assert.equal(activeCard?.title, 'Thẻ 2', 'activeCard van la The 2');
    cleanup();
  },
};
