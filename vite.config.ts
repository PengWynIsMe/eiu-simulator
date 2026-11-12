import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Đường dẫn tương đối để chạy được cả ở localhost lẫn GitHub Pages (/eiu-simulator/).
  base: './',
  plugins: [react(), tailwindcss()],
});
