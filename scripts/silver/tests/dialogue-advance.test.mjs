export default {
  'dialogueAdvance: may trang thai thuan tuy (evaluateDialogueTrigger)': async ({ assert, load }) => {
    const mod = await load('/src/ui/dialogueAdvance.ts');
    const { evaluateDialogueTrigger } = mod;

    // 1. Đang chạy chữ: luôn trả về 'skip'
    assert.equal(
      evaluateDialogueTrigger({ isTyping: true, hasOptions: false, canContinue: true, disabled: false }),
      'skip',
      'Đang chạy chữ không có options -> skip',
    );
    assert.equal(
      evaluateDialogueTrigger({ isTyping: true, hasOptions: true, canContinue: true, disabled: false }),
      'skip',
      'Đang chạy chữ CÓ options -> vẫn skip (hiện hết chữ trước)',
    );
    assert.equal(
      evaluateDialogueTrigger({ isTyping: true, hasOptions: false, canContinue: false, disabled: false }),
      'skip',
      'Đang chạy chữ kể cả canContinue false -> skip',
    );

    // 2. Chữ đã hiện hết & không có lựa chọn: trả về 'next'
    assert.equal(
      evaluateDialogueTrigger({ isTyping: false, hasOptions: false, canContinue: true, disabled: false }),
      'next',
      'Chữ đã hiện hết, không có options, canContinue true -> next',
    );
    assert.equal(
      evaluateDialogueTrigger({ isTyping: false, hasOptions: false, canContinue: false, disabled: false }),
      'none',
      'Chữ đã hiện hết nhưng canContinue false -> none',
    );

    // 3. Chữ đã hiện hết & CÓ lựa chọn: trả về 'none' (bắt buộc người dùng phải chọn)
    assert.equal(
      evaluateDialogueTrigger({ isTyping: false, hasOptions: true, canContinue: true, disabled: false }),
      'none',
      'Chữ đã hiện hết nhưng có options -> none (không tự sang câu)',
    );

    // 4. Khi disabled (modal, alertdialog, confirm đang mở): luôn trả về 'none'
    assert.equal(
      evaluateDialogueTrigger({ isTyping: true, hasOptions: false, canContinue: true, disabled: true }),
      'none',
      'Disabled khi đang typing -> none',
    );
    assert.equal(
      evaluateDialogueTrigger({ isTyping: false, hasOptions: false, canContinue: true, disabled: true }),
      'none',
      'Disabled khi đã hiện hết -> none',
    );
  },

  'dialogueAdvance: phat hien keo chuot xoay nhin (isDragGesture)': async ({ assert, load }) => {
    const mod = await load('/src/ui/dialogueAdvance.ts');
    const { isDragGesture } = mod;

    // 1. Click nhanh không di chuyển: dist <= 6, duration <= 300 -> false (không phải drag)
    assert.equal(
      isDragGesture({ x: 100, y: 100, time: 0 }, { x: 100, y: 100, time: 50 }),
      false,
      'Click đứng yên 50ms -> không phải drag',
    );
    assert.equal(
      isDragGesture({ x: 100, y: 100, time: 0 }, { x: 104, y: 103, time: 150 }),
      false,
      'Click di chuyển 5px (3-4-5) trong 150ms -> không phải drag',
    );
    assert.equal(
      isDragGesture({ x: 0, y: 0, time: 0 }, { x: 6, y: 0, time: 300 }),
      false,
      'Chạm đúng ngưỡng biên 6px và 300ms -> không phải drag',
    );

    // 2. Kéo chuột xoay nhìn (> 6px): -> true (là drag, phải bỏ qua)
    assert.equal(
      isDragGesture({ x: 100, y: 100, time: 0 }, { x: 107, y: 100, time: 100 }),
      true,
      'Di chuyển 7px trong 100ms -> là drag',
    );
    assert.equal(
      isDragGesture({ x: 100, y: 100, time: 0 }, { x: 150, y: 130, time: 200 }),
      true,
      'Di chuyển 58px trong 200ms -> là drag',
    );

    // 3. Nhấn giữ lâu (> 300ms): -> true (long press/drag, phải bỏ qua)
    assert.equal(
      isDragGesture({ x: 100, y: 100, time: 0 }, { x: 100, y: 100, time: 301 }),
      true,
      'Giữ 301ms không di chuyển -> tính là giữ chuột (drag)',
    );
    assert.equal(
      isDragGesture({ x: 100, y: 100, time: 0 }, { x: 102, y: 101, time: 500 }),
      true,
      'Giữ 500ms di chuyển 2.2px -> là drag',
    );
  },

  'dialogueAdvance: loc cac thanh phan tuong tac khac (shouldIgnoreTarget)': async ({ assert, load }) => {
    const mod = await load('/src/ui/dialogueAdvance.ts');
    const { shouldIgnoreTarget } = mod;

    // Giả lập mock DOM element đơn giản
    function createMockElement({ tag = 'div', attrs = {}, parent = null } = {}) {
      const el = {
        tagName: tag.toUpperCase(),
        getAttribute: (k) => attrs[k] ?? null,
        closest: (selector) => {
          let curr = el;
          const parts = selector.split(',').map((s) => s.trim().toLowerCase());
          while (curr) {
            const curTag = curr.tagName.toLowerCase();
            for (const part of parts) {
              if (part === curTag) return curr;
              if (part.startsWith('[') && part.endsWith(']')) {
                const match = part.slice(1, -1).split('=');
                const attrName = match[0].trim();
                const attrVal = match[1] ? match[1].replace(/["']/g, '').trim() : null;
                const actual = curr.getAttribute(attrName);
                if (attrVal !== null ? actual === attrVal : actual !== null) return curr;
              }
            }
            curr = curr.parentElement;
          }
          return null;
        },
        parentElement: parent,
      };
      return el;
    }

    // 1. Canvas / Ground / Body / Vùng trống -> không bỏ qua
    const canvas = createMockElement({ tag: 'canvas' });
    assert.equal(shouldIgnoreTarget(canvas), false, 'Canvas không bị bỏ qua');

    const emptyDiv = createMockElement({ tag: 'div' });
    assert.equal(shouldIgnoreTarget(emptyDiv), false, 'Div trống không bị bỏ qua');

    // 2. Nút Tiếp hoặc khung thoại có data-dialogue-advance="true" -> không bỏ qua
    const nextBtn = createMockElement({
      tag: 'button',
      attrs: { 'data-dialogue-advance': 'true' },
    });
    assert.equal(shouldIgnoreTarget(nextBtn), false, 'Nút Tiếp có data-dialogue-advance không bị bỏ qua');

    const textSpan = createMockElement({
      tag: 'span',
      parent: nextBtn,
    });
    assert.equal(shouldIgnoreTarget(textSpan), false, 'Text bên trong nút Tiếp không bị bỏ qua');

    // 3. Nút lựa chọn (option) có data-dialogue-option="true" -> phải bỏ qua
    const optionBtn = createMockElement({
      tag: 'button',
      attrs: { 'data-dialogue-option': 'true' },
    });
    assert.equal(shouldIgnoreTarget(optionBtn), true, 'Nút lựa chọn option bị bỏ qua');

    // 4. Nút tương tác khác (Thoát, Menu 3 chấm, VI/EN, Đứng dậy) -> phải bỏ qua
    const exitBtn = createMockElement({ tag: 'button' });
    assert.equal(shouldIgnoreTarget(exitBtn), true, 'Nút bấm khác (không có advance) bị bỏ qua');

    const link = createMockElement({ tag: 'a' });
    assert.equal(shouldIgnoreTarget(link), true, 'Thẻ link bị bỏ qua');

    const input = createMockElement({ tag: 'input' });
    assert.equal(shouldIgnoreTarget(input), true, 'Thẻ input bị bỏ qua');

    // 5. Phần tử nằm trong hộp thoại xác nhận / modal [role="dialog"] hoặc [role="alertdialog"] -> phải bỏ qua
    const dialogModal = createMockElement({
      tag: 'div',
      attrs: { role: 'dialog' },
    });
    const insideModalDiv = createMockElement({
      tag: 'div',
      parent: dialogModal,
    });
    assert.equal(shouldIgnoreTarget(insideModalDiv), true, 'Phần tử trong dialog modal bị bỏ qua');
  },

  'dialogueAdvance: chuoi goi y nho o goc khung (getDialogueHintText)': async ({ assert, load }) => {
    const mod = await load('/src/ui/dialogueAdvance.ts');
    const { getDialogueHintText } = mod;

    // Đang chạy chữ: VI "Chạm để hiện hết", EN "Tap to show all"
    assert.equal(getDialogueHintText(true, false, 'vi'), 'Chạm để hiện hết');
    assert.equal(getDialogueHintText(true, false, 'en'), 'Tap to show all');
    assert.equal(getDialogueHintText(true, true, 'vi'), 'Chạm để hiện hết');
    assert.equal(getDialogueHintText(true, true, 'en'), 'Tap to show all');

    // Đã hiện hết và không có lựa chọn: VI "Chạm để tiếp", EN "Tap to continue"
    assert.equal(getDialogueHintText(false, false, 'vi'), 'Chạm để tiếp');
    assert.equal(getDialogueHintText(false, false, 'en'), 'Tap to continue');

    // Đã hiện hết và CÓ lựa chọn: rỗng (để hiện danh sách lựa chọn)
    assert.equal(getDialogueHintText(false, true, 'vi'), '');
    assert.equal(getDialogueHintText(false, true, 'en'), '');
  },
};
