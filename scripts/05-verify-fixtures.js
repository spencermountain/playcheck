import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { checkAll, loadCompatibility, listRules } from '../src/index.js'
import analyze from '../src/analyze.js'
import expectations from '../tests/fixtures/expectations.json' with { type: 'json' }

const directory = fileURLToPath(new URL('../tests/fixtures/', import.meta.url))
const output = await mkdtemp(join(tmpdir(), 'playcheck-fixes-'))
const options = { browsers: ['chrome'] }
const results = new Map()
const inspect = async (name) => {
  if (!results.has(name)) { results.set(name, await checkAll(join(directory, name), options)) }
  const result = results.get(name)
  assert.equal(result.errors.length, 0, `${name}: inspection failed`)
  return result
}
const checked = new Set()
for (const { rule, fail, pass } of expectations) {
  const failure = await inspect(fail)
  const success = await inspect(pass)
  const issue = failure.issues.find((item) => item.rule === rule)
  assert.ok(issue, `${fail} should trigger ${rule}`)
  assert.ok(!success.issues.some((item) => item.rule === rule), `${pass} should clear ${rule}`)
  checked.add(rule)
  if (issue.fix) {
    const args = [...issue.fix.args]
    args[args.length - 1] = join(output, `${rule}.mp4`)
    const converted = spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', args, { encoding: 'utf8' })
    assert.equal(converted.status, 0, converted.stderr)
    const fixed = await checkAll(args.at(-1), options)
    assert.equal(fixed.errors.length, 0)
    assert.ok(!fixed.issues.some((item) => item.rule === rule), `Fix should clear ${rule}`)
  }
}
// HE-AAC encoding is not available on every FFmpeg build; model its metadata explicitly.
const compatibility = await loadCompatibility()
const metadata = { format: { format_name: 'aac' }, streams: [{ index: 0, codec_type: 'audio', codec_name: 'aac', profile: 'HE-AAC' }] }
assert.ok(analyze(metadata, { compatibility, ...options }).issues.some((item) => item.rule === 'aac-profile'))
metadata.streams[0].profile = 'LC'
assert.ok(!analyze(metadata, { compatibility, ...options }).issues.some((item) => item.rule === 'aac-profile'))
checked.add('aac-profile')
assert.ok(analyze({ streams: [] }, { compatibility, ...options }).failures.some((item) => item.rule === 'no-media'))
assert.ok(!analyze(metadata, { compatibility, ...options }).issues.some((item) => item.rule === 'no-media'))
checked.add('no-media')
assert.deepEqual([...checked].sort(), listRules().map((rule) => rule.id).sort())
console.log(JSON.stringify({ status: 'passed', rules: checked.size, mediaFiles: results.size, metadataOnly: ['aac-profile', 'no-media'], fixes: 'All suggestions in media expectations verified' }, null, 2))
