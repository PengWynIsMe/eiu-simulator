export default { 'Vite loads TypeScript': async ({ assert, load }) => { const m = await load('/src/data/validate.ts'); assert.equal(m.num(3, 'x'), 3); } };
