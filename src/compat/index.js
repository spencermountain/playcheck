import { readFile } from 'node:fs/promises'
import snapshot from './latest.json' with { type: 'json' }
import defaults from './overrides.json' with { type: 'json' }

import merge from './validate.js'

const loadCompatibility = async (path) => {
  const data = merge({ ...structuredClone(snapshot), rules: [] }, defaults)
  if (path) {
    merge(data, JSON.parse(await readFile(path, 'utf8')))
  }
  return data
}

export default loadCompatibility
