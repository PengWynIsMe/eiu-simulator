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
  // T07: tách thư viện ra chunk riêng — trình duyệt giữ cache khi chỉ code app đổi.
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['react', 'react-dom', 'zustand', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    // three.js (~690 kB) là một khối không chia nhỏ được nữa.
    chunkSizeWarningLimit: 800,
  },
});
