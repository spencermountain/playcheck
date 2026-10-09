import probe from './probe.js'
import inspectEbml from './inspect/ebml.js'
import inspectMp4 from './inspect/mp4.js'
import inputs from './inputs.js'
import analyze from './analyze.js'
import loadCompatibility from './compat/index.js'
import { summarize } from './_lib.js'
import { listRules } from './checks/index.js'

const check = async (input, kind, options = {}) => {
  if (options.os && !['macos', 'windows', 'linux', 'ios', 'android'].includes(options.os)) { throw new Error('Unknown target OS') }
  if (options.timeout !== undefined && (!Number.isFinite(options.timeout) || options.timeout <= 0)) { throw new Error('timeout must be a positive number') }
  const compatibility = await loadCompatibility(options.overrides)
  const browsers = options.browsers || Object.keys(compatibility.browsers)
  if (!Array.isArray(browsers) || !browsers.length || browsers.some((browser) => !compatibility.browsers[browser])) {
    throw new Error('browsers must be a nonempty array of known browser names')
  }
  const discovered = await inputs(input)
  const files = discovered.errors.map((error) => ({ file: error.file, ...summarize([], [error]) }))
  const skipped = []
  for (const file of discovered.files) {
    try {
      const metadata = await probe(file, options)
      let structure
      if (metadata.format?.format_name?.split(',').includes('mov')) { structure = await inspectMp4(file) }
      if (metadata.format?.format_name?.includes('matroska')) { structure = await inspectEbml(file) }
      const result = analyze(metadata, { compatibility, browsers, file, structure, os: options.os })
      if (kind !== 'all' && result.streams.length && result.kind !== kind) {
        skipped.push(file)
        continue
      }
      files.push({ file, ...result })
    } catch (error) {
      files.push({ file, ...summarize([], [{ file, message: error.message }]) })
    }
  }
  if (!files.length) { throw new Error(`No ${kind} files found (${skipped.length} skipped)`) }
  return {
    schemaVersion: 1,
    targetOs: options.os || null,
    compatibility: { generatedAt: compatibility.generatedAt, upstreamUpdatedAt: compatibility.upstreamUpdatedAt, source: compatibility.source, sha256: compatibility.sha256, browsers: Object.fromEntries(browsers.map((browser) => [browser, compatibility.browsers[browser]])), overrides: options.overrides || null },
    files, skipped,
    coverage: { mode: 'metadata-and-container-headers', limitations: ['No full decode or corruption scan', 'Container/profile combinations are not comprehensively verified', 'No server, device, or actual-browser playback test'] },
    ...summarize(files.flatMap((file) => file.issues), files.flatMap((file) => file.errors))
  }
}
const checkAudio = (input, options) => check(input, 'audio', options)
const checkVideo = (input, options) => check(input, 'video', options)
const checkAll = (input, options) => check(input, 'all', options)

export { checkAudio, checkVideo, checkAll, listRules, loadCompatibility }
