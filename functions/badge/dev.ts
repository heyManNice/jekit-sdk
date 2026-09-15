import worker from './main';
const port = 3004;

// @ts-ignore
Bun.serve({
    port,
    fetch(req: Request) {
        const env = {};
        const ctx = {
            waitUntil: (p: Promise<unknown>) => p,
            passThroughOnException: () => { },
        };
        return worker.fetch(req, env, ctx);
    },
});

console.log(`Local Edge Server running on http://localhost:${port}`);