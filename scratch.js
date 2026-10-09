import { fileURLToPath } from 'node:url'
import { checkVideo } from './src/index.js'

// Run with `node scratch.js`, or pass a file, directory, or quoted glob.
const input = process.argv[2] || fileURLToPath(new URL('./tests/fixtures/late-index.mp4', import.meta.url))
const { issues, errors } = await checkVideo(input, {
  browsers: ['chrome', 'firefox', 'safari']
})

console.log({ issues, errors })
