
export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    // Ensure even length for Int16Array compatibility
    const padding = len % 2;
    const bytes = new Uint8Array(len + padding);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    // data.buffer might be larger than data if it's a slice of a larger buffer, 
    // so we must use data.byteOffset and data.byteLength
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// Function to convert an AudioBuffer to a WAV file Blob
export function createWavBlob(audioBuffer: AudioBuffer): Blob {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2; // 2 bytes per sample
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample;
    let offset = 0;

    const writeString = (str: string) => {
        for (i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    // RIFF header
    writeString('RIFF');
    offset += 4;
    view.setUint32(offset, 36 + length, true);
    offset += 4;
    writeString('WAVE');
    offset += 4;

    // fmt chunk
    writeString('fmt ');
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true); // PCM
    offset += 2;
    view.setUint16(offset, numOfChan, true);
    offset += 2;
    view.setUint32(offset, audioBuffer.sampleRate, true);
    offset += 4;
    view.setUint32(offset, audioBuffer.sampleRate * 2 * numOfChan, true); // byte rate
    offset += 4;
    view.setUint16(offset, numOfChan * 2, true); // block align
    offset += 2;
    view.setUint16(offset, 16, true); // bits per sample
    offset += 2;

    // data chunk
    writeString('data');
    offset += 4;
    view.setUint32(offset, length, true);
    offset += 4;

    for (i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    let sampleIndex = 0;
    while (offset < 44 + length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][sampleIndex]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
        sampleIndex++;
    }

    return new Blob([view], { type: 'audio/wav' });
}

export function sliceAudioBuffer(buffer: AudioBuffer, start: number, end: number, ctx: AudioContext): AudioBuffer {
    const rate = buffer.sampleRate;
    const startOffset = Math.max(0, Math.floor(start * rate));
    const endOffset = Math.min(buffer.length, Math.floor(end * rate));
    const frameCount = Math.max(0, endOffset - startOffset);

    // Create a new buffer with the trimmed length
    // If exact length is 0, create a tiny buffer to avoid errors, but effectively empty
    const actualFrameCount = frameCount === 0 ? 1 : frameCount;
    const newBuffer = ctx.createBuffer(buffer.numberOfChannels, actualFrameCount, rate);

    if (frameCount > 0) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const oldData = buffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                newData[i] = oldData[startOffset + i];
            }
        }
    }
    return newBuffer;
}
