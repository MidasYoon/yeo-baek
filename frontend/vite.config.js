import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 팀 공동 파일 (D-010). 합의한 뒤에만 고친다.
// /api로 시작하는 요청은 백엔드(8000)로 넘긴다 (D-011).
// uvicorn은 127.0.0.1에서만 기다리므로 localhost(::1로 찾을 수 있음) 대신 127.0.0.1을 쓴다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
