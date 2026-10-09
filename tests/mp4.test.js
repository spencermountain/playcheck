import test from 'tape'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import inspectMp4 from '../src/inspect/mp4.js'

const box = (type, payload = Buffer.alloc(0)) => {
  const header = Buffer.alloc(8)
  header.writeUInt32BE(8 + payload.length)
  header.write(type, 4)
  return Buffer.concat([header, payload])
}
const inspect = async (bytes) => {
  const directory = await mkdtemp(join(tmpdir(), 'playcheck-box-'))
  const file = join(directory, 'sample.bin')
  await writeFile(file, bytes)
  return inspectMp4(file)
}

test('MP4 box ordering and fragmentation', async (t) => {
  const ftyp = box('ftyp', Buffer.from('isom\0\0\0\0isom'))
  const early = await inspect(Buffer.concat([ftyp, box('moov'), box('mdat')]))
  t.equal(early.status, 'complete')
  t.equal(early.faststart, true)
  t.equal(early.brand, 'isom')
  const late = await inspect(Buffer.concat([ftyp, box('mdat'), box('moov')]))
  t.equal(late.faststart, false)
  const fragmented = await inspect(Buffer.concat([ftyp, box('moov'), box('moof'), box('mdat')]))
  t.equal(fragmented.fragmented, true)
  t.end()
})

test('malformed and extended box lengths are bounded', async (t) => {
  const truncated = box('mdat')
  truncated.writeUInt32BE(1000)
  t.equal((await inspect(truncated)).status, 'invalid')
  const extended = Buffer.alloc(16)
  extended.writeUInt32BE(1)
  extended.write('free', 4)
  extended.writeBigUInt64BE(16n, 8)
  t.equal((await inspect(extended)).status, 'complete')
  const tiny = box('free')
  tiny.writeUInt32BE(4)
  t.equal((await inspect(tiny)).status, 'invalid')
  const rest = box('mdat')
  rest.writeUInt32BE(0)
  t.equal((await inspect(rest)).status, 'complete')
  t.equal((await inspect(Buffer.alloc(3))).status, 'invalid')
  t.end()
})
