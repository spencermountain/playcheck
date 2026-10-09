const video = ['-f', 'lavfi', '-i', 'testsrc2=size=64x64:rate=10']
const sound = ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100']
const hevc = ['-c:v', 'libx265', '-preset', 'ultrafast', '-x265-params', 'pools=1:log-level=error', '-movflags', '+faststart']
const cases = [
  { name: 'vp8.webm', input: video, output: ['-c:v', 'libvpx', '-b:v', '50k'] },
  { name: 'vp9.webm', input: video, output: ['-c:v', 'libvpx-vp9', '-b:v', '50k'] },
  { name: 'vp9-profile2.webm', input: video, output: ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p10le', '-profile:v', '2', '-b:v', '50k'] },
  { name: 'matroska.mkv', input: video, output: ['-c:v', 'libx264'] },
  { name: 'hevc-hev1.mp4', input: video, output: [...hevc, '-tag:v', 'hev1'] },
  { name: 'hevc-hvc1.mp4', input: video, output: [...hevc, '-tag:v', 'hvc1'] },
  { name: 'hdr-metadata.mp4', input: video, output: [...hevc, '-x265-params', 'pools=1:log-level=error:colorprim=9:transfer=16:colormatrix=9', '-pix_fmt', 'yuv420p10le', '-tag:v', 'hvc1', '-color_trc', 'smpte2084', '-color_primaries', 'bt2020', '-colorspace', 'bt2020nc'] },
  { name: 'ac3.m4a', input: sound, output: ['-c:a', 'ac3', '-b:a', '96k'] },
  { name: 'pcm.wav', input: sound, output: ['-c:a', 'pcm_s16le'] },
  { name: 'opus.ogg', input: sound, output: ['-c:a', 'libopus', '-b:a', '24k'] },
  { name: 'late-index.mp4', input: ['-f', 'lavfi', '-i', 'testsrc2=size=64x64:rate=10'], output: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p'] },
  { name: 'fragmented.mp4', input: ['-f', 'lavfi', '-i', 'testsrc2=size=64x64:rate=10'], output: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+frag_keyframe+empty_moov'] },
  { name: 'baseline.mp4', input: ['-f', 'lavfi', '-i', 'testsrc2=size=64x64:rate=10'], output: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'] },
  { name: 'h264-444.mp4', input: ['-f', 'lavfi', '-i', 'testsrc2=size=64x64:rate=10'], output: ['-c:v', 'libx264', '-pix_fmt', 'yuv444p'] },
  { name: 'interlaced.mp4', input: ['-f', 'lavfi', '-i', 'testsrc2=size=64x64:rate=20'], output: ['-vf', 'tinterlace=interleave_top', '-c:v', 'libx264', '-flags', '+ilme+ildct', '-x264-params', 'tff=1'] },
  { name: 'stereo.m4a', input: ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100'], output: ['-c:a', 'aac', '-ac', '2', '-b:a', '32k'] },
  { name: 'surround.m4a', input: ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=5.1:sample_rate=48000'], output: ['-c:a', 'aac', '-b:a', '64k'] }
]

export default cases
