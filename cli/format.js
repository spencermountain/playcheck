const format = (report, { color = false } = {}) => {
  const paint = (text, code) => {
    if (!color) { return text }
    return `\u001b[${code}m${text}\u001b[0m`
  }
  const lines = []
  report.files.forEach((file) => {
    lines.push(`${file.file} — ${file.status}`)
    file.issues.forEach((issue) => {
      let code = 33
      if (issue.severity === 'error') { code = 31 }
      lines.push(`  ${paint(issue.severity, code)} ${issue.rule}: ${issue.message}`)
      if (issue.support) {
        lines.push(`    ${Object.entries(issue.support).map(([browser, support]) => `${browser}: ${support.status}`).join(', ')}`)
      }
      if (issue.fix) { lines.push(`    Suggested fix (POSIX shell): ${issue.fix.command}`, `    ${issue.fix.note}`) }
    })
    file.errors.forEach((error) => lines.push(`  ${paint('error', 31)} ${error.message}`))
  })
  lines.push(`\n${report.files.length} files, ${report.failures.length} errors, ${report.warnings.length} warnings, ${report.errors.length} inspection failures, ${report.skipped.length} skipped`)
  lines.push('Metadata inspection only; a pass is not a playback guarantee.')
  return lines.join('\n')
}

export default format
