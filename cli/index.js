#!/usr/bin/env node
import packageInfo from '../package.json' with { type: 'json' }
import { parseArgs } from 'node:util'
import { checkGlob, listRules, loadCompatibility } from '../src/index.js'
import format from './format.js'

const main = async () => {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    version: { type: 'boolean' }, json: { type: 'boolean' }, audio: { type: 'boolean' }, video: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' }, overrides: { type: 'string' },
    os: { type: 'string' }, browsers: { type: 'string' }, ffprobe: { type: 'string' }, 'fail-on': { type: 'string', default: 'error' }
  } })
  if (values.version) {
    console.log(values.json ? JSON.stringify({ name: packageInfo.name, version: packageInfo.version }) : packageInfo.version)
    return
  }
  if (values.help) {
    const usage = { usage: 'playcheck <file|directory|glob>... [--json] [--audio|--video]', commands: ['rules', 'support'], options: ['--overrides file.json', '--browsers chrome,firefox,safari', '--ffprobe /path/to/ffprobe', '--os macos|windows|linux|ios|android', '--fail-on error|warning'] }
    console.log(values.json ? JSON.stringify(usage, null, 2) : `${usage.usage}\nCommands: ${usage.commands.join(', ')}\n${usage.options.join('\n')}`)
    return
  }
  if (positionals.length === 1 && ['rules', 'support'].includes(positionals[0])) {
    const result = positionals[0] === 'rules' ? listRules() : await loadCompatibility(values.overrides)
    if (values.json) { console.log(JSON.stringify(result, null, 2)) }
    else if (Array.isArray(result)) { console.log(result.map((rule) => `${rule.severity.padEnd(7)} ${rule.id}: ${rule.message}`).join('\n')) }
    else {
      console.log(`Compatibility snapshot: ${result.generatedAt}`)
      console.log(Object.entries(result.browsers).map(([key, browser]) => `${key} ${browser.version}`).join(', '))
      result.rules.forEach((rule) => console.log(`Override ${rule.capability}/${rule.browser} ${JSON.stringify(rule.match)}: ${rule.status} (${rule.verifiedAt})`))
      Object.entries(result.features).forEach(([feature, browsers]) => console.log(`${feature}: ${Object.entries(browsers).map(([browser, support]) => `${browser} ${support.status}`).join(', ')}`))
    }
    return
  }
  if (!positionals.length) { throw new Error('Provide a file, directory, or glob. Use --help for usage.') }
  if (values.audio && values.video) { throw new Error('Choose either --audio or --video') }
  if (!['error', 'warning'].includes(values['fail-on'])) { throw new Error('--fail-on must be error or warning') }
  let kind = 'all'
  if (values.audio) { kind = 'audio' }
  if (values.video) { kind = 'video' }
  const report = await checkGlob(positionals, {
    kind,
    os: values.os, overrides: values.overrides, browsers: values.browsers?.split(','), ffprobePath: values.ffprobe
  })
  console.log(values.json ? JSON.stringify(report, null, 2) : format(report, { color: process.stdout.isTTY && !('NO_COLOR' in process.env) }))
  if (report.files.some((file) => file.errors.length)) { process.exitCode = 2 }
  else if (report.files.some((file) => file.issues.some((issue) => issue.severity === 'error' || (values['fail-on'] === 'warning' && issue.severity === 'warning')))) { process.exitCode = 1 }
}

try { await main() } catch (error) {
  if (process.argv.includes('--json')) { console.log(JSON.stringify({ status: 'error', errors: [{ message: error.message }] })) }
  else { console.error(error.message) }
  process.exitCode = 2
}
