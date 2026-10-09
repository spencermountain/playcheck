import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname } from 'node:path'
import { platform, release, arch } from 'node:os'
import cases from './fixtures.js'

const port = Number(process.env.PORT || 4179)
const origin = `http://127.0.0.1:${port}`
const directory = new URL('../tests/browser-results/', import.meta.url)
const files = new Set(cases.map((item) => item.name))
const types = { '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.wav': 'audio/wav', '.ogg': 'audio/ogg' }
await mkdir(directory, { recursive: true })
const respond = async (request, response) => {
  if (request.url === '/results' && request.method === 'POST') {
    if (request.headers.origin !== origin) { response.writeHead(403).end(); return }
    let text = ''
    for await (const chunk of request) {
      text += chunk
      if (text.length > 100000) { response.writeHead(413).end(); return }
    }
    const report = JSON.parse(text)
    if (typeof report.userAgent !== 'string' || !Array.isArray(report.results) || report.results.some((item) => !files.has(item.file))) { response.writeHead(400).end(); return }
    for (const result of report.results) {
      const data = await readFile(new URL(`../tests/fixtures/${result.file}`, import.meta.url))
      result.sha256 = createHash('sha256').update(data).digest('hex')
    }
    report.host = { platform: platform(), release: release(), arch: arch() }
    const file = `${Date.now()}.json`
    await writeFile(new URL(file, directory), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ file }))
    console.log(`Saved ${file}: ${report.userAgent}`)
    return
  }
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return }
  if (request.url === '/fixtures') { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify([...files])); return }
  let data
  let type
  if (request.url === '/' || request.url === '/client.js') {
    const name = request.url === '/' ? 'index.html' : 'client.js'
    data = await readFile(new URL(`./browser/${name}`, import.meta.url))
    type = name.endsWith('.js') ? 'text/javascript' : 'text/html'
  } else if (request.url.startsWith('/media/') && files.has(request.url.slice(7))) {
    const file = request.url.slice(7)
    data = await readFile(new URL(`../tests/fixtures/${file}`, import.meta.url))
    type = types[extname(file)]
  } else { response.writeHead(404).end(); return }
  response.setHeader('Content-Type', type)
  response.setHeader('Accept-Ranges', 'bytes')
  response.setHeader('Cache-Control', 'no-store')
  const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
  if (range) {
    const start = Number(range[1])
    const end = Math.min(Number(range[2] || data.length - 1), data.length - 1)
    if (start > end) { response.writeHead(416, { 'Content-Range': `bytes */${data.length}` }).end(); return }
    response.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Content-Length': end - start + 1 })
    data = data.subarray(start, end + 1)
  } else { response.setHeader('Content-Length', data.length) }
  response.end(request.method === 'HEAD' ? undefined : data)
}
const server = createServer((request, response) => {
  respond(request, response).catch((error) => { console.error(error.message); response.writeHead(500).end() })
})
server.listen(port, '127.0.0.1', () => console.log(`Open ${origin} and click Run playback checks.`))
