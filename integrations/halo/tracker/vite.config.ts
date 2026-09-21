import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'build/dist',
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: 'src/index.ts',
      name: 'JekitHalo',
      formats: ['iife'],
      fileName: () => 'jekit-halo.min.js',
      cssFileName: 'jekit-halo',
    },
    minify: true,
  },
})
