import { NextRequest, NextResponse } from 'next/server';
import { encryptPayload, embedBits } from '@/lib/stego';

const MAX_COVER_SIZE = 3.5 * 1024 * 1024;  // 3.5MB — safely under Vercel's 4.5MB serverless limit
const MAX_SECRET_SIZE = 3.5 * 1024 * 1024; // 3.5MB

/**
 * Locate the byte offset of the first audio sample in a WAV file.
 * Scans for the 'data' chunk header and skips past the 8-byte chunk descriptor.
 * Falls back to the standard 44-byte PCM header if not found.
 */
function findDataChunkOffset(buffer: Buffer): number {
    for (let i = 12; i < buffer.length - 8; i++) {
        if (buffer.toString('ascii', i, i + 4) === 'data') {
            return i + 8; // skip 'data' (4 bytes) + chunk size (4 bytes)
        }
    }
    return 44; // standard PCM WAV header fallback
}

export async function POST(request: NextRequest) {
    let audioBuffer: Buffer | null = null;
    let secretBuffer: Buffer | null = null;
    let payloadBuffer: Buffer | null = null;
    let modifiedWav: Buffer | null = null;

    try {
        const formData = await request.formData();

        const passcode = formData.get('passcode');
        const coverFile = formData.get('coverFile');
        const secretFile = formData.get('secretFile');
        const isSpreadSpectrumRaw = formData.get('isSpreadSpectrum');

        if (typeof passcode !== 'string' || !passcode) {
            return NextResponse.json({ error: 'Missing passcode.' }, { status: 400 });
        }
        if (!(coverFile instanceof File)) {
            return NextResponse.json({ error: 'Missing or invalid cover audio file.' }, { status: 400 });
        }
        if (!(secretFile instanceof File)) {
            return NextResponse.json({ error: 'Missing or invalid secret audio file.' }, { status: 400 });
        }

        // Server-side size enforcement
        if (coverFile.size > MAX_COVER_SIZE) {
            return NextResponse.json({
                error: `Cover file exceeds maximum allowed size of ${(MAX_COVER_SIZE / 1024 / 1024).toFixed(1)}MB.`
            }, { status: 413 });
        }
        if (secretFile.size > MAX_SECRET_SIZE) {
            return NextResponse.json({
                error: `Secret file exceeds maximum allowed size of ${(MAX_SECRET_SIZE / 1024 / 1024).toFixed(1)}MB.`
            }, { status: 413 });
        }

        // Server-side 30x ratio enforcement (belt-and-suspenders after frontend check)
        if (coverFile.size < secretFile.size * 30) {
            return NextResponse.json({
                error: 'Cover file must be at least 30x larger than the secret file for optimal steganography.'
            }, { status: 422 });
        }

        const isSpreadSpectrum = isSpreadSpectrumRaw === 'true';

        audioBuffer = Buffer.from(await coverFile.arrayBuffer());
        secretBuffer = Buffer.from(await secretFile.arrayBuffer());

        const dataOffset = findDataChunkOffset(audioBuffer);
        const audioSamples = audioBuffer.subarray(dataOffset);

        // Encrypt the secret file raw bytes — produces [4-byte header][16-byte IV][ciphertext]
        payloadBuffer = encryptPayload(secretBuffer, passcode, isSpreadSpectrum);

        // Capacity check: 1 bit per audio sample byte
        const capacityBytes = Math.floor(audioSamples.length / 8);
        if (payloadBuffer.length > capacityBytes) {
            return NextResponse.json({
                error: `Cover audio capacity insufficient. Payload is ${payloadBuffer.length} bytes but carrier can hold ${capacityBytes} bytes.`
            }, { status: 422 });
        }

        // Embed payload bits into the audio sample LSBs
        const stegoSamples = embedBits(audioSamples, payloadBuffer, 0, isSpreadSpectrum, false);

        // Reconstruct the full WAV: original header + modified audio samples
        modifiedWav = Buffer.concat([
            audioBuffer.subarray(0, dataOffset),
            Buffer.from(stegoSamples),
        ]);

        return new NextResponse(new Uint8Array(modifiedWav), {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Disposition': 'attachment; filename="Audio-Vault-Artifact.wav"',
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'X-Content-Type-Options': 'nosniff',
            }
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown engine error.';
        console.error('Audio Process API Error:', msg);
        return NextResponse.json({
            error: 'Failed to process auditory vault operation. Fatal engine panic.',
            details: msg,
        }, { status: 500 });
    } finally {
        // Zero-Persistence: wipe all sensitive buffers
        if (audioBuffer) { audioBuffer.fill(0); audioBuffer = null; }
        if (secretBuffer) { secretBuffer.fill(0); secretBuffer = null; }
        if (payloadBuffer) { payloadBuffer.fill(0); payloadBuffer = null; }
        if (modifiedWav) { modifiedWav.fill(0); modifiedWav = null; }
    }
}
