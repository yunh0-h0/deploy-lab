import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 5173번을 다른 프로그램이 쓰고 있으면 다른 번호로 몰래 바꾸지 않고 멈춘다.
    // 서버의 ALLOWED_ORIGIN이 정확한 주소(http://localhost:5173)를 기대하기 때문이다.
    strictPort: true,
  },
})
