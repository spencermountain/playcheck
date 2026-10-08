<div align="center">
  <div><b>playcheck</b></div>
  <div>Determine if media files play properly in browsers</div>
  <div><code>npm install playcheck</code></div>
  <div align="center">
    <sub>
      by
      <a href="https://github.com/spencermountain">Spencer Kelly</a>
    </sub>
  </div>
  <img height="25px" src="https://user-images.githubusercontent.com/399657/68221824-09809d80-ffb8-11e9-9ef0-6ed3574b0ce8.png"/>
</div>
<!--2nd row-->
<div align="center">
  <div>
    <a href="https://npmjs.org/package/playcheck">
    <img src="https://img.shields.io/npm/v/playcheck.svg?style=flat-square" />
  </a>
  </div>
</div>

This script is a sort of *linter* for audio and video files - to inspect their internals and determine if they will play properly in modern browsers (and which ones).

This question is surprisingly difficult to get an answer to
* not just because all of the arcane details about codecs,
* not just because of the stone-age tooling,
* but mostly - because it's hard to get straight-answers about browser support.

This library is for validating only, and does not make any modifications to any files.

### Usage
```bash
npx playcheck /path/to/movies
npx playcheck /path/to/movies/my-movie.mp4

npx playcheck /path/to/music/ballads --json
```

### Js API
```js
import { checkAudio, checkVideo, checkAll } from 'playcheck'

const {status, issues, warnings, failures} = await checkVideo('./Simpsons/S02/')

```

MIT - PRs welcome
