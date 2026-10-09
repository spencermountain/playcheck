const summarize = (issues, errors = []) => {
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  const failures = issues.filter((issue) => issue.severity === 'error')
  let status = 'passed'
  if (warnings.length) { status = 'warning' }
  if (failures.length) { status = 'failed' }
  if (errors.length) { status = 'error' }
  return { status, issues, warnings, failures, errors }
}

// Suggestions are POSIX shell commands; args remain portable for programmatic use.
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const suggestion = (fix, file, streams, stream) => {
  if (!fix || !file) { return undefined }
  const output = `${file}.fixed.mp4`
  const selected = streams.filter((item) => item.index === stream?.index || item.codec_type !== stream?.codec_type)
  const video = selected.find((item) => item.codec_type === 'video')
  const audio = selected.find((item) => item.codec_type === 'audio')
  let maps = [video, audio].filter(Boolean).flatMap((item) => ['-map', `0:${item.index}`])
  if (fix.allStreams) { maps = ['-map', '0'] }
  const args = ['-n', '-i', file, ...maps, ...fix.args, output]
  return { command: `ffmpeg ${args.map(quote).join(' ')}`, args, output, note: fix.note }
}

export { summarize, suggestion }
