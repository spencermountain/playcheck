const resolveSupport = (data, capability, browser, context = {}) => {
  let result = data.features[capability]?.[browser]
  if (!result && ['vp8', 'vp9'].includes(capability) && context.container === 'webm') {
    const webm = data.features.webm?.[browser]
    if (webm) {
      result = { ...webm, status: 'conditional', note: 'WebM support is recorded; codec/profile-specific playback needs verification.' }
    }
  }
  result ||= { status: 'unknown', note: 'No compatibility evidence recorded.' }
  // Later entries win; user overrides follow built-in entries.
  for (const rule of data.rules || []) {
    if (rule.capability === capability && rule.browser === browser && Object.entries(rule.match).every(([key, value]) => context[key] === value)) {
      const { match, capability: name, browser: target, ...evidence } = rule
      result = { ...evidence, manual: true, match }
    }
  }
  return result
}

export default resolveSupport
