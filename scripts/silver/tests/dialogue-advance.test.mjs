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

  'dialogueAdvance: reducer theo doi chuoi su kien keo chuot (dragTrackerReducer)': async ({ assert, load }) => {
    const mod = await load('/src/ui/dialogueAdvance.ts');
    const { dragTrackerReducer, INITIAL_DRAG_STATE } = mod;

    // 1. Click nhe dung yen: down -> up trong 50ms, khong di chuyen -> wasDrag = false
    let s = dragTrackerReducer(INITIAL_DRAG_STATE, {
      type: 'down',
      button: 0,
      pointerType: 'mouse',
      x: 100,
      y: 100,
      time: 0,
    });
    assert.equal(s.tracking, true);
    assert.equal(s.wasDrag, false);

    s = dragTrackerReducer(s, { type: 'up', x: 100, y: 100, time: 50 });
    assert.equal(s.tracking, false);
    assert.equal(s.wasDrag, false, 'Click dung yen 50ms khong phai drag');

    // 2. Click di chuyen nhe duoi nguong (3px, 4px -> dist = 5px <= 6px) trong 150ms -> wasDrag = false
    s = dragTrackerReducer(INITIAL_DRAG_STATE, {
      type: 'down',
      button: 0,
      pointerType: 'touch',
      x: 100,
      y: 100,
      time: 0,
    });
    s = dragTrackerReducer(s, { type: 'move', x: 103, y: 104 });
    s = dragTrackerReducer(s, { type: 'up', x: 103, y: 104, time: 150 });
    assert.equal(s.wasDrag, false, 'Cham di chuyen 5px trong 150ms khong phai drag');

    // 3. Keo chuot xoay nhin 60px trong 100ms: down -> move -> up -> wasDrag = true
    s = dragTrackerReducer(INITIAL_DRAG_STATE, {
      type: 'down',
      button: 0,
      pointerType: 'mouse',
      x: 100,
      y: 100,
      time: 0,
    });
    s = dragTrackerReducer(s, { type: 'move', x: 160, y: 100 });
    assert.equal(s.maxDist, 60);
    s = dragTrackerReducer(s, { type: 'up', x: 160, y: 100, time: 100 });
    assert.equal(s.wasDrag, true, 'Keo 60px trong 100ms phai duoc danh dau wasDrag = true');

    // Sau khi click bi nuot, consume_click reset wasDrag ve false
    s = dragTrackerReducer(s, { type: 'consume_click' });
    assert.equal(s.wasDrag, false, 'consume_click phai reset wasDrag ve false');

    // 4. Keo roi quay lai diem cu (distance end - start nho nhung maxDist > 6px)
    s = dragTrackerReducer(INITIAL_DRAG_STATE, {
      type: 'down',
      button: 0,
      pointerType: 'mouse',
      x: 100,
      y: 100,
      time: 0,
    });
    s = dragTrackerReducer(s, { type: 'move', x: 150, y: 100 });
    s = dragTrackerReducer(s, { type: 'move', x: 100, y: 100 });
    s = dragTrackerReducer(s, { type: 'up', x: 100, y: 100, time: 100 });
    assert.equal(s.wasDrag, true, 'Keo roi quay ve vi tri cu van phai tinh la drag nho maxDist');

    // 5. Nhan giu lau > 300ms khong di chuyen (long press) -> wasDrag = true
    s = dragTrackerReducer(INITIAL_DRAG_STATE, {
      type: 'down',
      button: 0,
      pointerType: 'mouse',
      x: 100,
      y: 100,
      time: 0,
    });
    s = dragTrackerReducer(s, { type: 'up', x: 100, y: 100, time: 350 });
    assert.equal(s.wasDrag, true, 'Giu 350ms tinh la drag/long press');

    // 6. Pointer cancel (cu chi bi ngat/keo ra khoi man hinh) -> wasDrag = true
    s = dragTrackerReducer(INITIAL_DRAG_STATE, {
      type: 'down',
      button: 0,
      pointerType: 'mouse',
      x: 100,
      y: 100,
      time: 0,
    });
    s = dragTrackerReducer(s, { type: 'move', x: 120, y: 100 });
    s = dragTrackerReducer(s, { type: 'cancel' });
    assert.equal(s.wasDrag, true, 'Pointercancel phai danh dau wasDrag = true');

    // 7. Chuot phai (button = 2) -> khong tracking
    s = dragTrackerReducer(INITIAL_DRAG_STATE, {
      type: 'down',
      button: 2,
      pointerType: 'mouse',
      x: 100,
      y: 100,
      time: 0,
    });
    assert.equal(s.tracking, false, 'Chuot phai phai bi bo qua');
  },

  'dialogueAdvance: loc cac thanh phan tuong tac va ho tro ban 2D SilverLayer': async ({ assert, load }) => {
    const mod = await load('/src/ui/dialogueAdvance.ts');
    const { shouldIgnoreTarget } = mod;

    // Giả lập mock DOM element đơn giản
    function createMockElement({ tag = 'div', attrs = {}, parent = null, children = [] } = {}) {
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
        querySelector: (selector) => {
          const queue = [...children];
          while (queue.length > 0) {
            const node = queue.shift();
            if (node) {
              if (selector.startsWith('[') && selector.endsWith(']')) {
                const match = selector.slice(1, -1).split('=');
                const attrName = match[0].trim();
                const attrVal = match[1] ? match[1].replace(/["']/g, '').trim() : null;
                const actual = node.getAttribute(attrName);
                if (attrVal !== null ? actual === attrVal : actual !== null) return node;
              }
              if (node.children) queue.push(...node.children);
            }
          }
          return null;
        },
        parentElement: parent,
        children,
      };
      for (const ch of children) {
        ch.parentElement = el;
      }
      return el;
    }

    // 1. Canvas / Ground / Body / Vùng trống -> không bỏ qua
    const canvas = createMockElement({ tag: 'canvas' });
    assert.equal(shouldIgnoreTarget(canvas), false, 'Canvas khong bi bo qua');

    // 2. Nút Tiếp hoặc khung thoại có data-dialogue-advance="true" -> không bỏ qua
    const advanceFrame = createMockElement({
      tag: 'div',
      attrs: { 'data-dialogue-advance': 'true', role: 'button' },
    });
    assert.equal(shouldIgnoreTarget(advanceFrame), false, 'Khung thoai co advance khong bi bo qua');

    // 3. Trong che do 2D: container SilverLayer co role="dialog" va data-silver-overlay="true"
    // Cung chua khung thoai -> KHONG duoc coi la modal chan
    const advanceInside2D = createMockElement({
      tag: 'div',
      attrs: { 'data-dialogue-advance': 'true' },
    });
    const silver2DLayer = createMockElement({
      tag: 'div',
      attrs: { role: 'dialog', 'data-silver-overlay': 'true' },
      children: [advanceInside2D],
    });
    assert.ok(silver2DLayer, 'silver2DLayer hop le');
    assert.equal(
      shouldIgnoreTarget(advanceInside2D),
      false,
      'Khung thoai ben trong SilverLayer 2D khong bi bo qua boi role=dialog cua lop phu',
    );

    // 4. Modal alertdialog (ConfirmDialog Thoat / Bo qua) -> phai bo qua
    const alertDialog = createMockElement({
      tag: 'div',
      attrs: { role: 'alertdialog' },
    });
    const insideAlertDialog = createMockElement({
      tag: 'button',
      parent: alertDialog,
    });
    assert.equal(shouldIgnoreTarget(insideAlertDialog), true, 'Phan tu trong alertdialog bi bo qua');

    // 5. Modal dialog ngoai khong chua khung thoai (vi du LibraryHud, Interior modal) -> phai bo qua
    const externalDialog = createMockElement({
      tag: 'div',
      attrs: { role: 'dialog' },
      children: [],
    });
    const insideExternalDialog = createMockElement({
      tag: 'p',
      parent: externalDialog,
    });
    assert.equal(shouldIgnoreTarget(insideExternalDialog), true, 'Phan tu trong dialog ben ngoai bi bo qua');

    // 6. Nut lua chon option -> phai bo qua
    const optionBtn = createMockElement({
      tag: 'button',
      attrs: { 'data-dialogue-option': 'true' },
    });
    assert.equal(shouldIgnoreTarget(optionBtn), true, 'Nut option bi bo qua');

    // 7. Nut bam khac (Thoat, Menu...) -> phai bo qua
    const exitBtn = createMockElement({ tag: 'button' });
    assert.equal(shouldIgnoreTarget(exitBtn), true, 'Nut khac bi bo qua');
  },

  'dialogueAdvance: cooldown cap module chong kich hoat dup giua cac buoc': async ({ assert, load }) => {
    const mod = await load('/src/ui/dialogueAdvance.ts');
    const {
      DIALOGUE_TRIGGER_COOLDOWN_MS,
      resetGlobalDialogueCooldownForTest,
      setGlobalDialogueLastTriggerTimeForTest,
      getGlobalDialogueLastTriggerTime,
      evaluateDialogueTrigger,
    } = mod;

    resetGlobalDialogueCooldownForTest();
    assert.equal(getGlobalDialogueLastTriggerTime(), 0);
    assert.equal(DIALOGUE_TRIGGER_COOLDOWN_MS, 250);

    // Mo phong cau 1 (da xong chu): nguoi dung bam Enter -> next
    const action1 = evaluateDialogueTrigger({ isTyping: false, hasOptions: false, canContinue: true, disabled: false });
    assert.equal(action1, 'next');

    // Gia su triggerAdvance chay tai t = 1000
    setGlobalDialogueLastTriggerTimeForTest(1000);

    // Cau 2 lap tuc mount tai t = 1050 (moi qua 50ms): su kien tiep theo bi chan boi cooldown cap module
    const now2 = 1050;
    const cooldownActive = now2 - getGlobalDialogueLastTriggerTime() < DIALOGUE_TRIGGER_COOLDOWN_MS;
    assert.equal(cooldownActive, true, 'Cooldown 250ms phai chan su kien den trong 50ms');

    // Tai t = 1300 (> 250ms): cooldown da het, su kien duoc chap nhan
    const now3 = 1300;
    const cooldownExpired = now3 - getGlobalDialogueLastTriggerTime() >= DIALOGUE_TRIGGER_COOLDOWN_MS;
    assert.equal(cooldownExpired, true, 'Sau 300ms (>250ms), cooldown cho phep kich hoat');

    resetGlobalDialogueCooldownForTest();
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
