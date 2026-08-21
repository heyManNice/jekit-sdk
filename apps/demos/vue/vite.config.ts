import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { helloScreen } from '../../hello-screen';

export default defineConfig({
    plugins: [vue(), helloScreen('Vue Demo')]
});