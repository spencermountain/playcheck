import { open } from 'node:fs/promises'

const vint = (buffer, offset, id = false) => {
  const first = buffer[offset]
  if (!first) { return null }
  let length = 1
  for (let mask = 128; !(first & mask); mask >>= 1) { length += 1 }
  if (length > 8 || offset + length > buffer.length) { return null }
  let value = BigInt(first & (255 >> length))
  if (id) { value = BigInt(first) }
  for (let i = 1; i < length; i += 1) { value = value * 256n + BigInt(buffer[offset + i]) }
  if (!id && value === (1n << BigInt(7 * length)) - 1n) { return null }
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) { return null }
  return { value: Number(value), length }
}
const inspectEbml = async (file) => {
  const handle = await open(file, 'r')
  try {
    const buffer = Buffer.alloc(65536)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    const data = buffer.subarray(0, bytesRead)
    if (bytesRead < 5 || data.readUInt32BE(0) !== 0x1a45dfa3) { return { status: 'unknown' } }
    const size = vint(data, 4)
    if (!size || 4 + size.length + size.value > bytesRead) { return { status: 'unknown' } }
    const end = 4 + size.length + size.value
    for (let offset = 4 + size.length; offset < end;) {
      const id = vint(data, offset, true)
      if (!id) { break }
      const length = vint(data, offset + id.length)
      if (!length) { break }
      const start = offset + id.length + length.length
      if (start + length.value > end) { break }
      if (id.value === 0x4282) {
        const container = data.toString('ascii', start, start + length.value)
        if (['webm', 'matroska'].includes(container)) { return { status: 'complete', container } }
      }
      offset = start + length.value
    }
    return { status: 'unknown' }
  } finally { await handle.close() }
}

export default inspectEbml
