import { open } from 'node:fs/promises'

const maxBoxes = 4096
const inspectMp4 = async (file) => {
  const handle = await open(file, 'r')
  const result = { status: 'complete', fragmented: false, faststart: null, boxes: 0 }
  try {
    const { size } = await handle.stat()
    const header = Buffer.alloc(16)
    let offset = 0
    let moov
    let mdat
    for (; offset < size && result.boxes < maxBoxes; result.boxes += 1) {
      const { bytesRead } = await handle.read(header, 0, 16, offset)
      if (bytesRead < 8) { result.status = 'invalid'; break }
      let length = header.readUInt32BE(0)
      const type = header.toString('latin1', 4, 8)
      let headerSize = 8
      if (length === 1) {
        if (bytesRead < 16) { result.status = 'invalid'; break }
        const extended = header.readBigUInt64BE(8)
        if (extended > BigInt(Number.MAX_SAFE_INTEGER)) { result.status = 'invalid'; break }
        length = Number(extended)
        headerSize = 16
      } else if (length === 0) { length = size - offset }
      if (length < headerSize || length > size - offset) { result.status = 'invalid'; break }
      if (type === 'ftyp') {
        if (length < headerSize + 8) { result.status = 'invalid'; break }
        const brand = Buffer.alloc(4)
        const read = await handle.read(brand, 0, 4, offset + headerSize)
        if (read.bytesRead !== 4) { result.status = 'invalid'; break }
        result.brand = brand.toString('latin1').trim()
      }
      if (type === 'moov' && moov === undefined) { moov = offset }
      if (type === 'mdat' && mdat === undefined) { mdat = offset }
      if (type === 'moof') { result.fragmented = true }
      // Seek over payloads, including media data; never read them into memory.
      offset += length
    }
    if (result.status === 'complete' && offset < size) { result.status = 'limited' }
    result.moovOffset = moov ?? null
    result.mdatOffset = mdat ?? null
    if (result.status === 'complete' && moov !== undefined && mdat !== undefined && !result.fragmented) {
      result.faststart = moov < mdat
    }
    return result
  } finally {
    await handle.close()
  }
}

export default inspectMp4
