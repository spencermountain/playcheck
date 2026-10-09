import test from 'tape'
import resolveSupport from '../src/compat/resolve.js'

const data = {
  features: { hevc: { edge: { status: 'conditional' } } },
  rules: [{ capability: 'hevc', browser: 'edge', match: { container: 'mp4', tag: 'hev1' }, status: 'unsupported', note: 'Reproduction', source: 'https://example.com/issue', verifiedAt: '2026-10-08' }]
}
test('targeted overrides do not leak across containers, tags, or browsers', (t) => {
  t.equal(resolveSupport(data, 'hevc', 'edge', { container: 'mp4', tag: 'hev1' }).status, 'unsupported')
  t.equal(resolveSupport(data, 'hevc', 'edge', { container: 'mp4', tag: 'hvc1' }).status, 'conditional')
  t.equal(resolveSupport(data, 'hevc', 'edge', { container: 'webm', tag: 'hev1' }).status, 'conditional')
  t.equal(resolveSupport(data, 'hevc', 'chrome', { container: 'mp4', tag: 'hev1' }).status, 'unknown')
  t.end()
})
