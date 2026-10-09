import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const generateStructure = async (directory) => {
  const baseline = await readFile(join(directory, 'baseline.mp4'))
  const free = Buffer.from([0, 0, 0, 8, 102, 114, 101, 101])
  const invalid = Buffer.from([0, 0, 0, 100, 102, 114, 101, 101])
  const cases = [['invalid-box.mp4', invalid], ['box-limit.mp4', Buffer.concat(Array(4097).fill(free))]]
  const results = []
  for (const [name, tail] of cases) {
    try {
      await writeFile(join(directory, name), Buffer.concat([baseline, tail]), { flag: 'wx' })
      results.push({ file: name, status: 'created' })
    } catch (error) {
      if (error.code !== 'EEXIST') { throw error }
      results.push({ file: name, status: 'skipped' })
    }
  }
  return results
}

export default generateStructure
