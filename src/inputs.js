import { glob, stat } from 'node:fs/promises'
import { resolve, extname } from 'node:path'

const extensions = new Set('.mp4 .m4v .mov .mkv .webm .avi .mpg .mpeg .ts .mts .m2ts .3gp .ogv .mp3 .m4a .aac .wav .flac .ogg .oga .opus .aif .aiff .wma .wmv'.split(' '))
const inputs = async (input) => {
  const found = new Set()
  const errors = []
  const values = Array.isArray(input) ? input : [input]
  const addDirectory = async (directory, matches) => {
    for await (const entry of glob('**/*', { cwd: directory, withFileTypes: true })) {
      if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
        matches.add(resolve(entry.parentPath, entry.name))
      }
    }
  }
  for (const value of values) {
    if (typeof value !== 'string' || !value) { throw new Error('Expected a file, directory, or glob string') }
    const matches = new Set()
    let info
    try { info = await stat(value) } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') { throw error }
    }
    if (info?.isDirectory()) { await addDirectory(resolve(value), matches) }
    else if (info?.isFile()) { matches.add(resolve(value)) }
    else {
      for await (const match of glob(value, { withFileTypes: true })) {
        if (match.isFile()) { matches.add(resolve(match.parentPath, match.name)) }
        else if (match.isDirectory()) { await addDirectory(resolve(match.parentPath, match.name), matches) }
      }
    }
    if (!matches.size) { errors.push({ file: resolve(value), message: `No matching media files found for: ${value}` }) }
    matches.forEach((file) => found.add(file))
  }
  if (!found.size && !errors.length) { throw new Error('No matching media files found') }
  return { files: [...found].sort(), errors }
}

export default inputs
