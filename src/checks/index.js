import presentation from './presentation.js'
import structure from './structure.js'

const rules = [
  { id: 'no-media', severity: 'error', category: 'playback', message: 'No playable audio or video streams were found.' },
  { id: 'codec-support', severity: 'warning', category: 'playback', message: 'Check codec support in current browsers.' },
  { id: 'container-support', severity: 'warning', category: 'playback', message: 'Check container and codec combinations.' },
  ...presentation,
  ...structure
]

const listRules = () => rules.map(({ check, evidence, ...rule }) => rule)

export { rules, listRules }
