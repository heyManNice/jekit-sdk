export function helloScreen(name: string) {
    return {
        name: 'hello-screen',
        config() {
            return {
                server: {
                    allowedHosts: ['lvh.me']
                }
            }
        },
        configureServer(server: any) {
            server.printUrls = () => {
                const port = server.config.server.port || 5173;
                console.clear();
                console.log('\x1b[36m%s\x1b[0m', '====================================');
                console.log('\x1b[32m%s\x1b[0m', ' 🎉 Jekit ' + name);
                console.log(` ➜  本地地址: \x1b[34mhttp://lvh.me:${port}\x1b[0m`);
                console.log('\x1b[36m%s\x1b[0m', '====================================');
            };
        },
    };
}