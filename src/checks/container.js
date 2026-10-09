// These are recognized combinations, not a guarantee of browser decoder support.
const combinations = {
  mp3: ['mp3'], flac: ['flac'], aac: ['aac'],
  wav: ['pcm_u8', 'pcm_s16le'], ogg: ['vorbis', 'opus', 'flac', 'theora']
}
const mp4Brands = new Set(['isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'M4A', 'M4V', 'avc1'])

const identifyContainer = (metadata, structure) => {
  if (structure?.container) { return structure.container }
  const format = metadata.format?.format_name || ''
  const brand = structure?.brand || metadata.format?.tags?.major_brand?.trim()
  if (format.split(',').includes('mov')) {
    if (brand === 'qt') { return 'mov' }
    if (mp4Brands.has(brand)) { return 'mp4' }
    return 'iso-bmff'
  }
  if (format.includes(',')) { return 'unknown' }
  return format
}

const containerConcern = (metadata, streams, structure) => {
  const format = metadata.format?.format_name || ''
  const brand = structure?.brand || metadata.format?.tags?.major_brand?.trim()
  const container = identifyContainer(metadata, structure)
  let codecs = combinations[container]
  if (container === 'webm') { codecs = ['vp8', 'vp9', 'av1', 'opus', 'vorbis'] }
  if (format.split(',').includes('mov') && mp4Brands.has(brand)) { codecs = ['h264', 'hevc', 'av1', 'aac', 'mp3'] }
  if (codecs && streams.every((stream) => codecs.includes(stream.codec_name))) { return null }
  return {
    message: 'This container/codec combination has not been verified for browser playback.',
    evidence: { format, brand, codecs: streams.map((stream) => stream.codec_name) }
  }
}

export { identifyContainer }
export default containerConcern
