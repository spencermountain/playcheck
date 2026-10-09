const button = document.querySelector('#run')
const status = document.querySelector('#status')
const output = document.querySelector('#results')
const waitFor = (media, event, action) => new Promise((resolve, reject) => {
  const finish = (error) => {
    clearTimeout(timer)
    media.removeEventListener(event, done)
    media.removeEventListener('error', fail)
    if (error) { reject(error) } else { resolve() }
  }
  const done = () => finish()
  const fail = () => finish(new Error(`Media error ${media.error?.code}: ${media.error?.message || ''}`))
  const timer = setTimeout(() => finish(new Error(`Timed out waiting for ${event}`)), 6000)
  media.addEventListener(event, done, { once: true })
  media.addEventListener('error', fail, { once: true })
  Promise.resolve().then(action).catch(finish)
})
const run = async (file) => {
  const media = document.createElement(/\.(m4a|wav|ogg|mp3)$/.test(file) ? 'audio' : 'video')
  media.muted = true
  media.playsInline = true
  media.controls = true
  document.querySelector('#player').replaceChildren(media)
  const result = { file, loaded: false, played: false, sought: false }
  try {
    await waitFor(media, 'loadeddata', () => { media.src = `/media/${file}`; media.load() })
    result.loaded = true
    result.duration = media.duration
    await waitFor(media, 'timeupdate', () => media.play())
    result.played = media.currentTime > 0
    media.pause()
    const target = media.duration / 2
    await waitFor(media, 'seeked', () => { media.currentTime = target })
    result.sought = Math.abs(media.currentTime - target) < 0.1
  } catch (error) { result.error = error.message }
  finally { media.pause(); media.removeAttribute('src'); media.load() }
  return result
}
button.addEventListener('click', async () => {
  button.disabled = true
  try {
    const files = await (await fetch('/fixtures')).json()
    const report = { userAgent: navigator.userAgent, platform: navigator.platform, recordedAt: new Date().toISOString(), limitations: ['Muted playback; audibility and presentation not verified', 'Results apply only to this browser/device'], results: [] }
    for (const file of files) {
      status.textContent = `Checking ${file}`
      report.results.push(await run(file))
      output.textContent = JSON.stringify(report, null, 2)
    }
    const response = await fetch('/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) })
    if (!response.ok) { throw new Error('Could not save browser results') }
    const saved = await response.json()
    status.textContent = `Completed ${files.length} files. Saved ${saved.file}`
  } catch (error) { status.textContent = error.message }
  finally { button.disabled = false }
})
