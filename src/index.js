import inputs from './inputs.js'
import { configure, checkFile } from './check.js'
import { summarize } from './_lib.js'
import { listRules } from './checks/index.js'
import loadCompatibility from './compat/index.js'

const checkAudio = async (file, options = {}) => checkFile(file, 'audio', options, await configure(options))
const checkVideo = async (file, options = {}) => checkFile(file, 'video', options, await configure(options))

const checkGlob = async (input, options = {}) => {
  const kind = options.kind || 'all'
  if (!['all', 'audio', 'video'].includes(kind)) { throw new Error('kind must be all, audio, or video') }
  const config = await configure(options)
  const discovered = await inputs(input)
  const files = discovered.errors.map((error) => ({ file: error.file, ...config.details, ...summarize([], [error]) }))
  for (const file of discovered.files) {
    const result = await checkFile(file, 'all', options, config)
    if (kind === 'all' || result.kind === kind || result.errors.length || !result.streams?.length) { files.push(result) }
  }
  if (!files.length) { throw new Error(`No ${kind} files found`) }
  return { files }
}

export { checkAudio, checkVideo, checkGlob, listRules, loadCompatibility }
