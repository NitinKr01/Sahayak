/** Decode any recorded blob (webm/ogg) into mono 16-bit PCM WAV, which is
 * what the Sarvam STT API expects. */
export async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    return encodeWav(audioBuffer)
  } finally {
    void ctx.close()
  }
}

function encodeWav(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate
  const ch0 = buffer.getChannelData(0)
  let data = ch0
  if (buffer.numberOfChannels > 1) {
    const ch1 = buffer.getChannelData(1)
    data = new Float32Array(ch0.length)
    for (let i = 0; i < ch0.length; i++) data[i] = (ch0[i] + ch1[i]) / 2
  }

  const bytesPerSample = 2
  const dataSize = data.length * bytesPerSample
  const out = new ArrayBuffer(44 + dataSize)
  const view = new DataView(out)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < data.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, data[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([out], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

export function base64ToBlobUrl(b64: string, mime = 'audio/wav'): string {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}
