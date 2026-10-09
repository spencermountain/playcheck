<div align="center">
  <div><b>playcheck</b></div>
  <div>ensure media files play properly in browsers</div>
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

<!-- spacer -->
<img height="20px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

The `<video>` and `<audio>` tags were introduced in 2008, in the HTML5 spec - the idea was to point to a media file, and the browser will just play it.

In practice, reliable playback has proven difficult, based on complex media file internals, and the messy real-world.

Still 18 years later, different variants of different codecs are being adjusted and supported at a near-monthly rate, across all different browsers and platforms.

<!-- spacer -->
<div align="center">
  <img height="25px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
</div>
<div align="center">
  <img height="50px" src="https://user-images.githubusercontent.com/399657/68221632-b9094000-ffb7-11e9-99e0-b48edd6cdf8a.png"/>
</div>

This is a ***linter*** for audio and video files - a tool to inspect internal details and determine if given files are likely to play properly in modern browsers, of have any concerns.


<!-- spacer -->
<img height="20px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

This is surprisingly difficult to get an answer to
* not just because all of the arcane details about codecs,
* not just because of the stone-age tooling,
* but mostly - because it's hard to get straight-answers about browser support

This library is for validating only, and does not make any modifications to any files.

#### Dependencies

[FFmpeg](https://www.ffmpeg.org/) must be installed, same with [Nodejs 24+](https://nodejs.org/en).

```bash
# macOS
brew install ffmpeg

# Debian / Ubuntu
sudo apt install ffmpeg
```

## Usage
```bash
npx playcheck /path/to/movies
npx playcheck /path/to/movies/my-movie.mp4

npx playcheck /path/to/music/ballads --json
```

#### Js API
```js
import { checkAudio, checkVideo, checkGlob } from 'playcheck'

const resport = await checkVideo(input, {
  browsers: ['chrome', 'firefox', 'safari']
})
console.log(report.issues)
// [{
//   rule: 'mp4-faststart',
//   severity: 'warning',
//   message: 'The MP4 index follows media data. Startup may require extra requests or downloading file.',
//   file: './tests/fixtures/late-index.mp4',
//   category: 'delivery',
//   evidence: [Object],
//   support: [Object],
//   fix: [Object]
// }]
```

---


### Details

Browser support is determined at time of each release, and not a live lookup.

Support information may lag behind browser changes.
Develppers can run `pnpm run update` to refresh the snapshot;

The following checks run where applicable to the file and its streams.

**Container and streams**

- Presence of audio or video streams, excluding attached cover art (`no-media`).
- Codec support in each target browser, accounting for alternative tracks of the same type (`codec-support`).
- Container and codec combinations, using file metadata and headers to identify formats such as MP4, MOV, WebM, and Matroska (`container-support`).
- MP4 index placement: whether the `moov` index follows media data and may delay startup; fragmented files are excluded from this warning (`mp4-faststart`).
- Truncated or invalid top-level MP4 box sizes (`mp4-structure-invalid`).
- MP4 inspection reaching its box limit, leaving index placement unknown (`mp4-structure-limited`).

**Video**

- HEVC in MP4 using the `hev1` sample-entry tag, which may need additional playback verification (`hevc-sample-entry`).
- H.264 pixel formats outside 8-bit 4:2:0 (`h264-pixel-format`).
- VP9 profiles or pixel formats outside profile 0 / 8-bit 4:2:0 (`vp9-profile`).
- HDR transfer metadata indicating PQ or HLG (`hdr-color`).
- Interlaced video, which may display combing artifacts (`interlaced-video`).

**Audio, including audio tracks in video files**

- AAC profiles other than LC, or an unknown AAC profile (`aac-profile`).
- Audio codecs outside the common AAC, MP3, Opus, Vorbis, FLAC, and 8-bit unsigned / 16-bit little-endian PCM set (`unusual-audio`).
- More than two audio channels, where playback or downmixing depends on the browser and device (`multichannel-audio`).


MIT - PRs welcome
