import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    plugins: [
        dts({
            entryRoot: "src",
            outDirs: 'dist',
            insertTypesEntry: true,
            exclude: [
                'src/tests/**',
            ],
        }),
    ],
    build: {
        lib: {
            entry: "src/index.ts",
            formats: [
                'es',
            ]
        },
        sourcemap: false,
        emptyOutDir: true,
    },
});
