import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginDir = resolve(root, 'integrations', 'halo')
const isWindows = process.platform === 'win32'
const command = isWindows ? 'gradlew.bat' : './gradlew'

const result = spawnSync(command, ['build'], {
  cwd: pluginDir,
  stdio: 'inherit',
  shell: isWindows,
})

if (result.error) {
  console.error(`Unable to start Halo build: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
