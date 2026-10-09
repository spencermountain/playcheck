import { mkdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const directory = resolve('tests/fixtures')
import cases from './fixtures.js'
import generateStructure from './fixtures-structure.js'

await mkdir(directory, { recursive: true })
const results = []
for (const { name, input, output } of cases) {
  const file = resolve(directory, name)
  const existing = await stat(file).catch((error) => {
    if (error.code !== 'ENOENT') { throw error }
  })
  if (existing) {
    results.push({ file: name, status: 'skipped', message: 'Already exists' })
    continue
  }
  const result = spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-n', ...input, '-t', '0.5', ...output, resolve(directory, name)], { encoding: 'utf8' })
  results.push({ file: name, status: result.status === 0 ? 'created' : 'error', message: result.error?.message || result.stderr.trim() })
}
results.push(...await generateStructure(directory))
console.log(JSON.stringify(results, null, 2))
if (results.some((result) => result.status === 'error')) { process.exitCode = 2 }
