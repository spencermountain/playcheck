const rules = [
  {
    id: 'hevc-sample-entry', severity: 'warning', category: 'playback',
    message: 'HEVC uses hev1; hvc1 is generally the safer Apple delivery target. Retagging alone may not be valid for every bitstream.',
    check: (stream, container) => container === 'mp4' && stream.codec_name === 'hevc' && stream.codec_tag_string === 'hev1',
    evidence: (stream) => ({ tag: stream.codec_tag_string }),
    source: 'https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices/'
  },
  {
    id: 'aac-profile', severity: 'warning', category: 'playback',
    message: 'AAC outside the LC profile needs profile-specific browser verification.',
    check: (stream) => stream.codec_name === 'aac' && stream.profile !== 'LC',
    evidence: (stream) => ({ profile: stream.profile || 'unknown' }),
    fix: { args: ['-c:v', 'copy', '-c:a', 'aac', '-profile:a', 'aac_low'], note: 'Re-encodes audio as AAC-LC; copied video must be MP4-compatible.' }
  },
  {
    id: 'vp9-profile', severity: 'warning', category: 'playback',
    message: 'VP9 outside profile 0 / 8-bit 4:2:0 may need additional decoder capabilities.',
    check: (stream) => stream.codec_name === 'vp9' && (stream.profile !== 'Profile 0' || stream.pix_fmt !== 'yuv420p'),
    evidence: (stream) => ({ profile: stream.profile, pixelFormat: stream.pix_fmt })
  },
  {
    id: 'unusual-audio', severity: 'warning', category: 'playback',
    message: 'This audio codec needs explicit browser support verification.',
    check: (stream) => stream.codec_type === 'audio' && !['aac', 'mp3', 'opus', 'vorbis', 'flac', 'pcm_u8', 'pcm_s16le'].includes(stream.codec_name),
    evidence: (stream) => ({ codec: stream.codec_name }),
    fix: { args: ['-c:v', 'copy', '-c:a', 'aac'], note: 'Converts the selected audio track to AAC; copied video must be MP4-compatible.' }
  },
  {
    id: 'hdr-color', severity: 'warning', category: 'presentation',
    message: 'HDR color may require tone mapping or an HDR-capable playback environment.',
    check: (stream) => ['smpte2084', 'arib-std-b67'].includes(stream.color_transfer),
    evidence: (stream) => ({ transfer: stream.color_transfer })
  },
  {
    id: 'interlaced-video', severity: 'warning', category: 'presentation',
    message: 'Interlaced video may show combing artifacts in browsers.',
    check: (stream) => ['tt', 'bb', 'tb', 'bt'].includes(stream.field_order),
    evidence: (stream) => ({ fieldOrder: stream.field_order }),
    fix: { args: ['-vf', 'bwdif', '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac'], note: 'Deinterlaces and re-encodes the selected video and audio tracks; quality and metadata may change.' }
  },
  {
    id: 'h264-pixel-format', severity: 'warning', category: 'playback',
    message: 'H.264 outside 8-bit 4:2:0 has limited browser decoding support.',
    check: (stream) => stream.codec_name === 'h264' && Boolean(stream.pix_fmt) && !['yuv420p', 'yuvj420p'].includes(stream.pix_fmt),
    evidence: (stream) => ({ pixelFormat: stream.pix_fmt }),
    fix: { args: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-c:a', 'aac'], note: 'Re-encodes to 8-bit 4:2:0. Not suitable for preserving HDR; quality may change.' }
  },
  {
    id: 'multichannel-audio', severity: 'warning', category: 'presentation',
    message: 'Multichannel playback and downmixing depend on the browser and audio device.',
    check: (stream) => stream.codec_type === 'audio' && Number(stream.channels) > 2,
    evidence: (stream) => ({ channels: stream.channels, layout: stream.channel_layout }),
    fix: { args: ['-c:v', 'copy', '-c:a', 'aac', '-ac', '2'], note: 'Downmixes to stereo. Copied video must already be MP4-compatible.' }
  }
]

export default rules
