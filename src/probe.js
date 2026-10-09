import { spawn } from 'node:child_process'

const probe = (file, options = {}) => new Promise((resolve, reject) => {
  const executable = options.ffprobePath || process.env.FFPROBE_PATH || 'ffprobe'
  const child = spawn(executable, ['-v', 'error', '-show_error', '-show_format', '-show_streams', '-of', 'json', file], {
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
  })
  let stdout = ''
  let stderr = ''
  let failure
  const stop = (message) => {
    failure ||= new Error(message)
    child.kill('SIGKILL')
  }
  const timer = setTimeout(() => stop('FFprobe timed out'), options.timeout ?? 30000)
  child.stdout.on('data', (chunk) => {
    if (stdout.length + chunk.length > 4 * 1024 * 1024) {
      stop('FFprobe output exceeded 4 MiB')
      return
    }
    stdout += chunk
  })
  child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-8192) })
  child.on('error', (error) => {
    clearTimeout(timer)
    reject(new Error(`Cannot run FFprobe (${executable}): ${error.message}`))
  })
  child.on('close', (code) => {
    clearTimeout(timer)
    if (failure || code !== 0) {
      reject(failure || new Error(stderr.trim() || `FFprobe exited with code ${code}`))
      return
    }
    try {
      resolve(JSON.parse(stdout))
    } catch {
      reject(new Error('FFprobe returned invalid JSON'))
    }
  })
})

export default probe
