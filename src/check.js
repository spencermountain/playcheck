import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import probe from './probe.js'
import inspectEbml from './inspect/ebml.js'
import inspectMp4 from './inspect/mp4.js'
import analyze from './analyze.js'
import loadCompatibility from './compat/index.js'
import { summarize } from './_lib.js'

const configure = async (options) => {
  if (options.os && !['macos', 'windows', 'linux', 'ios', 'android'].includes(options.os)) { throw new Error('Unknown target OS') }
  if (options.timeout !== undefined && (!Number.isFinite(options.timeout) || options.timeout <= 0)) { throw new Error('timeout must be a positive number') }
  const compatibility = await loadCompatibility(options.overrides)
  const browsers = options.browsers || Object.keys(compatibility.browsers)
  if (!Array.isArray(browsers) || !browsers.length || browsers.some((browser) => !compatibility.browsers[browser])) {
    throw new Error('browsers must be a nonempty array of known browser names')
  }
  const details = {
    schemaVersion: 1,
    targetOs: options.os || null,
    compatibility: { generatedAt: compatibility.generatedAt, upstreamUpdatedAt: compatibility.upstreamUpdatedAt, source: compatibility.source, sha256: compatibility.sha256, browsers: Object.fromEntries(browsers.map((browser) => [browser, compatibility.browsers[browser]])), overrides: options.overrides || null },
    coverage: { mode: 'metadata-and-container-headers', limitations: ['No full decode or corruption scan', 'Container/profile combinations are not comprehensively verified', 'No server, device, or actual-browser playback test'] }
  }
  return { compatibility, browsers, details }
}

const checkFile = async (input, kind, options, config) => {
  if (typeof input !== 'string' || !input) { throw new Error('Expected one file path') }
  const file = resolve(input)
  try {
    if (!(await stat(file)).isFile()) { throw new Error('Expected one file; use checkGlob() for directories or patterns') }
    const metadata = await probe(file, options)
    let structure
    if (metadata.format?.format_name?.split(',').includes('mov')) { structure = await inspectMp4(file) }
    if (metadata.format?.format_name?.includes('matroska')) { structure = await inspectEbml(file) }
    const result = analyze(metadata, { ...config, file, structure, os: options.os })
    if (kind !== 'all' && result.streams.length && result.kind !== kind) { throw new Error(`Expected ${kind}, found ${result.kind}`) }
    return { file, ...config.details, ...result }
  } catch (error) {
    return { file, ...config.details, ...summarize([], [{ file, message: error.message }]) }
  }
}

export { configure, checkFile }
