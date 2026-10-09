const rules = [
  {
    id: 'mp4-faststart', severity: 'warning', category: 'delivery',
    message: 'The MP4 index follows media data. Startup may require extra range requests or downloading the file.',
    check: (structure) => structure.faststart === false,
    fix: { allStreams: true, args: ['-c', 'copy', '-movflags', '+faststart'], note: 'Remuxes all tracks without re-encoding. The output container must support every track.' }
  },
  {
    id: 'mp4-structure-invalid', severity: 'error', category: 'playback',
    message: 'A top-level MP4 box is truncated or has an invalid size.',
    check: (structure) => structure.status === 'invalid'
  },
  {
    id: 'mp4-structure-limited', severity: 'warning', category: 'inspection',
    message: 'MP4 structure inspection reached its box limit; index placement remains unknown.',
    check: (structure) => structure.status === 'limited'
  }
]

export default rules
