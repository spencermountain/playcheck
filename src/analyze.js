import presentation from './checks/presentation.js'
import resolveSupport from './compat/resolve.js'
import containerConcern, { identifyContainer } from './checks/container.js'
import structureRules from './checks/structure.js'
import { summarize, suggestion } from './_lib.js'

const aliases = { libopus: 'opus' }
const analyze = (metadata, { compatibility, browsers, file, structure, os } = {}) => {
  const streams = (metadata.streams || []).filter((stream) => ['audio', 'video'].includes(stream.codec_type) && !stream.disposition?.attached_pic)
  const kind = streams.some((stream) => stream.codec_type === 'video') ? 'video' : 'audio'
  const containerType = identifyContainer(metadata, structure)
  const context = (stream) => ({ container: containerType, codec: stream.codec_name, profile: stream.profile, tag: stream.codec_tag_string, pixelFormat: stream.pix_fmt, os })
  const issues = []
  const assessments = streams.map((stream) => {
    let capability = aliases[stream.codec_name] || stream.codec_name
    if (metadata.format?.format_name === 'wav' && ['pcm_u8', 'pcm_s16le'].includes(stream.codec_name)) { capability = 'wav' }
    const support = Object.fromEntries(browsers.map((browser) => [browser, resolveSupport(compatibility, capability, browser, context(stream))]))
    return { capability, stream: stream.index, support }
  })
  const add = (rule, severity, message, extra = {}) => issues.push({ rule, severity, message, file, ...extra })
  const assess = (stream, assessment) => {
    const { support } = assessment
    const values = Object.values(support)
    if (values.some((entry) => entry.status !== 'supported')) {
      // Only fail when every track of this type is unsupported in the same browser.
      const alternatives = assessments.filter((item, index) => streams[index].codec_type === stream.codec_type)
      const unsupported = browsers.some((browser) => alternatives.every((item) => item.support[browser].status === 'unsupported'))
      let severity = 'warning'
      if (unsupported) { severity = 'error' }
      add('codec-support', severity, `${stream.codec_name}: browser support is limited, conditional, or unknown.`, { stream: stream.index, evidence: { codec: stream.codec_name, profile: stream.profile }, support })
    }
  }
  if (!streams.length) { add('no-media', 'error', 'No playable audio or video streams were found.') }
  streams.forEach((stream, index) => {
    assess(stream, assessments[index])
    presentation.forEach((rule) => {
      if (rule.check(stream, containerType)) {
        const support = Object.fromEntries(browsers.map((browser) => [browser, resolveSupport(compatibility, rule.id, browser, context(stream))]))
        if (Object.values(support).every((entry) => entry.status === 'supported')) { return }
        add(rule.id, rule.severity, rule.message, {
          stream: stream.index, category: rule.category, evidence: rule.evidence(stream),
          support,
          fix: suggestion(rule.fix, file, streams, stream)
        })
      }
    })
  })
  const container = containerConcern(metadata, streams, structure)
  if (container) {
    add('container-support', 'warning', container.message, {
      evidence: container.evidence,
      support: Object.fromEntries(browsers.map((browser) => [browser, { status: 'unknown' }]))
    })
  }
  if (structure && !structure.container) {
    structureRules.forEach((rule) => {
      if (rule.check(structure)) {
        add(rule.id, rule.severity, rule.message, {
          category: rule.category, evidence: structure,
          support: Object.fromEntries(browsers.map((browser) => [browser, { status: 'conditional', note: 'File structure or delivery concern shared across browsers.' }])),
          fix: suggestion(rule.fix, file, streams)
        })
      }
    })
  }
  return { kind, container: containerType, structure, streams, format: metadata.format || {}, assessments, ...summarize(issues) }
}

export default analyze
