import { NextRequest, NextResponse } from 'next/server';
import { PNG } from 'pngjs';
import { extractBits, decryptPayload } from '@/lib/stego';

const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB — safely under Vercel's 4.5MB serverless limit

function getPlausibleDenyResponse() {
    return NextResponse.json(
        { success: false, message: 'No secure payload detected or invalid passcode.' },
        {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
            },
        }
    );
}

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

        // Parse PNG and reconstruct RGB-only channel buffer (matching embedding strategy)
        const png = PNG.sync.read(buffer);
        const pixelData = png.data;
        const rgbLength = png.width * png.height * 3;
        const rgbBuffer = Buffer.alloc(rgbLength);

        for (let i = 0; i < png.width * png.height; i++) {
            rgbBuffer[i * 3 + 0] = pixelData[i * 4 + 0] ?? 0; // R
            rgbBuffer[i * 3 + 1] = pixelData[i * 4 + 1] ?? 0; // G
            rgbBuffer[i * 3 + 2] = pixelData[i * 4 + 2] ?? 0; // B
        }

        // --- Plausible Deniability Block ---
        // Any failure here (wrong passcode, corrupted carrier, no payload)
        // returns an identical 200 OK ambiguous response.
        try {
            // Read the 32-bit header from the first 32 LSBs, then extract the full encrypted payload
            extractedBuffer = extractBits(rgbBuffer, 0);

            // Attempt AES-256-CTR decryption — will throw on wrong key or tampered data
            decryptedBuffer = decryptPayload(extractedBuffer, passcode);

            const secretText = decryptedBuffer.toString('utf8');

            return NextResponse.json({ success: true, payload: secretText }, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                    'Pragma': 'no-cache',
                },
            });

        } catch {
            // Plausible Deniability: identical ambiguous response for wrong key AND clean carrier
            return getPlausibleDenyResponse();
        }

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error.';
        console.error('Vault Extract API Error:', msg);
        // Even outer errors return the deniable 200 response — never leak 500
        return getPlausibleDenyResponse();
    } finally {
        // Zero-Persistence: wipe all sensitive buffers
        if (buffer) { buffer.fill(0); buffer = null; }
        if (extractedBuffer) { extractedBuffer.fill(0); extractedBuffer = null; }
        if (decryptedBuffer) { decryptedBuffer.fill(0); decryptedBuffer = null; }
    }
}
