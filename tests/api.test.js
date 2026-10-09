import test from 'tape'
import { checkAudio, checkVideo, checkAll } from '../src/index.js'
import analyze from '../src/analyze.js'

const compatibility = {
  features: {
    h264: { chrome: { status: 'supported' } },
    aac: { chrome: { status: 'supported' } }
  }
}
const video = { index: 0, codec_type: 'video', codec_name: 'h264', pix_fmt: 'yuv420p' }
const audio = { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2 }
const inspect = (streams) => analyze({ streams, format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2', tags: { major_brand: 'isom' } } }, { compatibility, browsers: ['chrome'] })

test('public entry points', (t) => {
  ;[checkAudio, checkVideo, checkAll].forEach((fn) => t.equal(typeof fn, 'function'))
  t.end()
})

test('ordinary AVC and AAC has no known failures', (t) => {
  const result = inspect([video, audio])
  t.equal(result.failures.length, 0)
  t.end()
})

test('video checks include incompatible audio', (t) => {
  const result = inspect([video, { ...audio, codec_name: 'made-up-codec' }])
  t.ok(result.issues.some((issue) => issue.rule === 'codec-support' && issue.stream === 1))
  t.end()
})

test('HDR and interlacing produce presentation warnings', (t) => {
  const result = inspect([{ ...video, color_transfer: 'smpte2084', field_order: 'tt' }])
  t.ok(result.warnings.some((issue) => issue.rule === 'hdr-color'))
  t.ok(result.warnings.some((issue) => issue.rule === 'interlaced-video'))
  t.end()
})

test('cover art does not turn audio into video', (t) => {
  const result = inspect([{ ...video, disposition: { attached_pic: 1 } }, audio])
  t.equal(result.kind, 'audio')
  t.end()
})

test('an empty media file is an error', (t) => {
  t.ok(inspect([]).failures.some((issue) => issue.rule === 'no-media'))
  t.end()
})
