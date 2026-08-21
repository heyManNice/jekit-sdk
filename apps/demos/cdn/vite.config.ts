import { defineConfig } from 'vite';
import { helloScreen } from '../../hello-screen';

export default defineConfig({
    plugins: [helloScreen('Cdn Demo')],
});