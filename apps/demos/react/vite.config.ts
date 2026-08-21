import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { helloScreen } from '../../hello-screen';

export default defineConfig({
    plugins: [react(), helloScreen('React Demo')]
});