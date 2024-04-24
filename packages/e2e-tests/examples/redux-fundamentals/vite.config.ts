import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const base =
    command === 'serve' ? '' : '/recording/test/examples/redux-fundamentals/dist/'
  return {
    base,
    plugins: [react()],
    build: {
      sourcemap: true,
    },
  }
})
