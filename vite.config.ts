import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import reviewNotesPlugin from './scripts/review-notes-plugin.mjs';

export default defineConfig({
  // Đường dẫn tương đối để chạy được cả ở localhost lẫn GitHub Pages (/eiu-simulator/).
  base: './',
  plugins: [react(), tailwindcss(), reviewNotesPlugin()],
  // App ghi review/notes.json khi lưu góp ý — không để Vite tải lại trang vì file này đổi.
  server: { watch: { ignored: ['**/review/**'] } },
});
