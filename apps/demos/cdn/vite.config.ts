import { defineConfig } from 'vite';
import { helloScreen } from '../../hello-screen.ts';

export default defineConfig({
    plugins: [helloScreen('Cdn Demo')],
});
