import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = process.argv[2];
if (!dir) {
    console.error('请提供要复制的文件夹名，例如：npm run postbuild -- core');
    process.exit(1);
}

const rootDir = resolve(import.meta.dirname, '..', 'packages', dir);
if (!existsSync(rootDir)) {
    console.error(`找不到文件夹: ${rootDir}`);
    process.exit(1);
}

const distDir = resolve(rootDir, 'dist');
if (!existsSync(distDir)) {
    console.error(`找不到文件夹: ${distDir}`);
    process.exit(1);
}

const rootPackage = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'package.json'), 'utf-8'));
const workspacePackage = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
const publishPackage = JSON.parse(readFileSync(resolve(rootDir, 'package-dist.json'), 'utf-8'));

const coreVersion = rootPackage.version ?? '0.0';
// Workspace 包使用合法 SemVer（如 2.0.0），发布版本仍只取原有的首段修订号。
const libRevision = String(workspacePackage.version ?? '0').split('.')[0];

async function main() {
    await mkdir(distDir, { recursive: true });

    const outputPackage = {
        name: `jekit-${dir}`,
        version: `${coreVersion}.${libRevision}`,
        ...publishPackage,
    };

    writeFileSync(
        resolve(distDir, 'package.json'),
        JSON.stringify(outputPackage, null, 2),
        'utf-8',
    );
    await copyFile(resolve(rootDir, 'README.md'), resolve(distDir, 'README.md'));
    console.log(`postbuild succeed for ${outputPackage.name}@${outputPackage.version}`);
}

await main();
