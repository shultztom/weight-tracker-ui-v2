import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    base: "/weight-tracker-ui-v2/",
    plugins: [vue()],
})
