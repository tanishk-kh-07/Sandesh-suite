import { NextRequest, NextResponse } from 'next/server';
import { extractBits, decryptPayload } from '@/lib/stego';

const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB — safely under Vercel's 4.5MB serverless limit

/**
 * Locate the byte offset of the first audio sample in a WAV file.
 */
function findDataChunkOffset(buffer: Buffer): number {
    for (let i = 12; i < buffer.length - 8; i++) {
        if (buffer.toString('ascii', i, i + 4) === 'data') {
            return i + 8;
        }
    }
    return 44;
}

const PLAUSIBLE_DENY = NextResponse.json(
    { success: false, message: 'No secure payload detected or invalid passcode.' },
    {
        status: 200,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
        },
    }
);

export async function POST(request: NextRequest) {
    let buffer: Buffer | null = null;
    let extractedBuffer: Buffer | null = null;
    let decryptedBuffer: Buffer | null = null;

    try {
        const formData = await request.formData();

        const passcode = formData.get('passcode');
        const file = formData.get('file');

        if (typeof passcode !== 'string' || !passcode) {
            return NextResponse.json({ error: 'Missing passcode.' }, { status: 400 });
        }
        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Missing or invalid artifact file.' }, { status: 400 });
        }

        // Server-side file size enforcement
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `File exceeds maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB.` }, { status: 413 });
        }

        buffer = Buffer.from(await file.arrayBuffer());

        const dataOffset = findDataChunkOffset(buffer);

        // Extract only the audio sample region for LSB reading
        const audioSamples = buffer.subarray(dataOffset);

        // --- Plausible Deniability Block ---
        // Wrong passcode, missing payload, or corrupted data all return identical 200 OK
        try {
            // Read self-describing 32-bit header, then extract exactly that many bytes
            extractedBuffer = extractBits(audioSamples, 0);

            // Attempt AES-256-CTR decryption
            decryptedBuffer = decryptPayload(extractedBuffer, passcode);

            // The recovered payload is raw audio bytes — encode as base64 for JSON transport
            const base64Payload = decryptedBuffer.toString('base64');

            return NextResponse.json({ success: true, payload: base64Payload }, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                    'Pragma': 'no-cache',
                },
            });

        } catch {
            // Plausible Deniability: do not reveal if file had no payload or key was wrong
            return PLAUSIBLE_DENY;
        }

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error.';
        console.error('Audio Extract API Error:', msg);
        return PLAUSIBLE_DENY;
    } finally {
        // Zero-Persistence: wipe all sensitive buffers
        if (buffer) { buffer.fill(0); buffer = null; }
        if (extractedBuffer) { extractedBuffer.fill(0); extractedBuffer = null; }
        if (decryptedBuffer) { decryptedBuffer.fill(0); decryptedBuffer = null; }
    }
}
