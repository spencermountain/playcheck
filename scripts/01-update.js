import { writeFile, rename } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { browsers, features } from '../src/compat/config.js'

const source = 'https://raw.githubusercontent.com/Fyrd/caniuse/main/data.json'
const destination = new URL('../src/compat/latest.json', import.meta.url)
const update = async () => {
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) { throw new Error(`Compatibility download failed: ${response.status}`) }
  const text = await response.text()
  const upstream = JSON.parse(text)
  const current = Object.keys(upstream.eras).indexOf('e0')
  if (current < 0) { throw new Error('Missing current browser era') }
  const latest = {}
  browsers.forEach((browser) => {
    const agent = upstream.agents[browser]
    const version = agent?.versions[current]
    if (!version) { throw new Error(`No current version for ${browser}`) }
    latest[browser] = { name: agent.browser, version }
  })
  const data = {}
  Object.entries(features).forEach(([name, key]) => {
    const feature = upstream.data[key]
    if (!feature) { throw new Error(`Missing upstream feature: ${key}`) }
    data[name] = Object.fromEntries(browsers.map((browser) => {
      const raw = feature.stats[browser]?.[latest[browser].version]
      if (!raw) { throw new Error(`Missing ${key}/${browser}/${latest[browser].version}`) }
      const tokens = raw.split(' ')
      let status = 'unknown'
      if (tokens.includes('y')) { status = 'supported' }
      if (tokens.includes('n')) { status = 'unsupported' }
      if (!tokens.includes('n') && (tokens.includes('a') || tokens.includes('x') || tokens.includes('d') || /#\d/.test(raw))) { status = 'conditional' }
      const notes = [...raw.matchAll(/#(\d+)/g)].map((match) => feature.notes_by_num?.[match[1]]).filter(Boolean)
      return [browser, { status, raw, note: [feature.notes, ...notes].filter(Boolean).join('\n'), source: `https://caniuse.com/${key}` }]
    }))
  })
  const output = { generatedAt: new Date().toISOString(), upstreamUpdatedAt: new Date(upstream.updated * 1000).toISOString(), source, sha256: createHash('sha256').update(text).digest('hex'), browsers: latest, features: data }
  // Replace only after every mapped feature has been validated. Overrides live separately.
  const temporary = new URL('./latest.json.tmp', destination)
  await writeFile(temporary, JSON.stringify(output, null, 2) + '\n')
  await rename(temporary, destination)
  console.log(JSON.stringify({ status: 'updated', browsers: latest, features: Object.keys(data), sha256: output.sha256 }, null, 2))
}

try { await update() } catch (error) {
  console.error(JSON.stringify({ status: 'error', message: error.message }))
  process.exitCode = 2
}
