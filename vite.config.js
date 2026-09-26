import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 线上部署由反向代理域名访问，必须放开 host 限制，否则 Vite 会拒绝请求
// base: './' —— GitHub Pages 是子路径部署（https://<user>.github.io/<repo>/），
// 必须用相对路径，否则 /assets/xxx.js 会指向域名根目录导致 404
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
