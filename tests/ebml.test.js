import test from 'tape'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import inspectEbml from '../src/inspect/ebml.js'

test('EBML identifies the document type without trusting the extension', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'playcheck-ebml-'))
  for (const type of ['webm', 'matroska']) {
    const content = Buffer.concat([Buffer.from([0x42, 0x82, 0x80 | type.length]), Buffer.from(type)])
    const file = join(dir, `${type}.mp4`)
    await writeFile(file, Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x80 | content.length]), content]))
    t.equal((await inspectEbml(file)).container, type)
  }
  const file = join(dir, 'broken.webm')
  await writeFile(file, Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0xff]))
  t.equal((await inspectEbml(file)).status, 'unknown')
  t.end()
})
