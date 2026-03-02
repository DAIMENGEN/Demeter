import {defineConfig, loadEnv} from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 设置环境变量目录为父目录（Demeter）
  const envDir = path.resolve(__dirname, '..')

  // 加载环境变量（从父目录 Demeter 加载 .env 文件）
  const env = loadEnv(mode, envDir, '')

  return {
    // 指定环境变量目录，使 import.meta.env 可以正确读取父目录的 .env
    envDir,
    server: {
      host: env.VITE_HOST || "localhost",
      port: parseInt(env.VITE_PORT || "3000"),
    },
    resolve: {
      alias: {
        "@Webapp": "/src"
      }
    },
    plugins: [
      react()
    ]
  }
})
