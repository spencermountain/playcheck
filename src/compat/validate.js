const statuses = ['supported', 'unsupported', 'conditional', 'unknown']
const fields = ['container', 'codec', 'profile', 'tag', 'pixelFormat', 'os']
const validate = (value, dated = false) => {
  if (!value || !statuses.includes(value.status) || typeof value.note !== 'string' || !value.note || typeof value.source !== 'string' || !value.source) {
    throw new Error('Override needs status, note, and source')
  }
  if (dated && (!/^\d{4}-\d{2}-\d{2}$/.test(value.verifiedAt || '') || !Number.isFinite(Date.parse(value.verifiedAt)))) {
    throw new Error('Targeted override needs verifiedAt (YYYY-MM-DD)')
  }
}
const merge = (data, overrides) => {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides) || (!overrides.features && !overrides.rules)) { throw new Error('Overrides need features or rules') }
  if (overrides.features !== undefined && (!overrides.features || typeof overrides.features !== 'object' || Array.isArray(overrides.features))) { throw new Error('features must be an object') }
  Object.entries(overrides.features || {}).forEach(([feature, browsers]) => {
    if (['__proto__', 'constructor', 'prototype'].includes(feature) || !browsers || typeof browsers !== 'object' || Array.isArray(browsers)) { throw new Error(`Invalid feature: ${feature}`) }
    Object.entries(browsers).forEach(([browser, value]) => {
      if (!Object.hasOwn(data.browsers, browser)) { throw new Error(`Unknown browser: ${browser}`) }
      validate(value)
      data.features[feature] ||= {}
      data.features[feature][browser] = { ...value, manual: true }
    })
  })
  if (overrides.rules !== undefined && !Array.isArray(overrides.rules)) { throw new Error('Override rules must be an array') }
  for (const rule of overrides.rules || []) {
    validate(rule, true)
    if (!rule.capability || !Object.hasOwn(data.browsers, rule.browser) || !rule.match || typeof rule.match !== 'object' || Array.isArray(rule.match) || !Object.keys(rule.match).length) { throw new Error('Targeted override needs capability, browser, and match') }
    if (Object.entries(rule.match).some(([key, value]) => !fields.includes(key) || typeof value !== 'string' || !value)) { throw new Error('Invalid override match field') }
    data.rules.push(rule)
  }
  return data
}

export default merge
