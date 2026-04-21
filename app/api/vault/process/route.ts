import { NextRequest, NextResponse } from 'next/server';
import { PNG } from 'pngjs';
import { encryptPayload, embedBits } from '@/lib/stego';

const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB — safely under Vercel's 4.5MB serverless limit

export async function POST(request: NextRequest) {
    let buffer: Buffer | null = null;
    let payloadBuffer: Buffer | null = null;
    let outputBuffer: Buffer | null = null;

    try {
        const formData = await request.formData();

        const passcode = formData.get('passcode');
        const file = formData.get('file');
        const secretText = formData.get('secretText');
        const isLsbMatchingRaw = formData.get('isLsbMatching');

        if (typeof passcode !== 'string' || !passcode) {
            return NextResponse.json({ error: 'Missing passcode.' }, { status: 400 });
        }
        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Missing or invalid carrier file.' }, { status: 400 });
        }
        if (typeof secretText !== 'string' || !secretText) {
            return NextResponse.json({ error: 'Missing secret payload.' }, { status: 400 });
        }

        // Server-side file size enforcement
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `Carrier file exceeds maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB.` }, { status: 413 });
        }

        const isLsbMatching = isLsbMatchingRaw === 'true';

        // Read file into buffer
        buffer = Buffer.from(await file.arrayBuffer());

        // Parse PNG and get raw RGBA pixel data
        const png = PNG.sync.read(buffer);
        const pixelData = png.data; // Uint8Array of RGBA channels

        // Encrypt the secret payload — produces [4-byte header][16-byte IV][ciphertext]
        payloadBuffer = encryptPayload(secretText, passcode, false);

        // Capacity check: 3 bits per pixel (RGB channels), ignoring Alpha
        const capacityBytes = Math.floor((png.width * png.height * 3) / 8);
        if (payloadBuffer.length > capacityBytes) {
            return NextResponse.json({
                error: `Carrier capacity insufficient. Payload is ${payloadBuffer.length} bytes but carrier can only hold ${capacityBytes} bytes.`
            }, { status: 422 });
        }

        // Embed into pixel data (LSB of R, G, B channels only — skip every 4th alpha byte)
        // We use the raw RGBA buffer but only write to non-alpha positions.
        // Strategy: build a channel-stripped buffer of RGB only, embed, then reconstruct RGBA.
        const rgbLength = png.width * png.height * 3;
        const rgbBuffer = Buffer.alloc(rgbLength);

        for (let i = 0; i < png.width * png.height; i++) {
            rgbBuffer[i * 3 + 0] = pixelData[i * 4 + 0] ?? 0; // R
            rgbBuffer[i * 3 + 1] = pixelData[i * 4 + 1] ?? 0; // G
            rgbBuffer[i * 3 + 2] = pixelData[i * 4 + 2] ?? 0; // B
        }

        // Embed bits into the RGB buffer
        const stegoRgb = embedBits(rgbBuffer, payloadBuffer, 0, false, isLsbMatching);

        // Write the stego RGB data back into the RGBA pixel array
        for (let i = 0; i < png.width * png.height; i++) {
            png.data[i * 4 + 0] = stegoRgb[i * 3 + 0] ?? 0; // R
            png.data[i * 4 + 1] = stegoRgb[i * 3 + 1] ?? 0; // G
            png.data[i * 4 + 2] = stegoRgb[i * 3 + 2] ?? 0; // B
            // Alpha channel (index 3) is untouched — preserving transparency
        }

        // Serialize back to PNG
        outputBuffer = PNG.sync.write(png);

        return new NextResponse(new Uint8Array(outputBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': 'attachment; filename="Pixel-Vault-Artifact.png"',
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'X-Content-Type-Options': 'nosniff',
            }
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown engine error.';
        console.error('Vault Process API Error:', msg);
        return NextResponse.json({
            error: 'Failed to process vault operation. Fatal engine panic.',
            details: msg,
        }, { status: 500 });
    } finally {
        // Zero-Persistence: wipe all sensitive buffers from memory
        if (buffer) { buffer.fill(0); buffer = null; }
        if (payloadBuffer) { payloadBuffer.fill(0); payloadBuffer = null; }
        if (outputBuffer) { outputBuffer.fill(0); outputBuffer = null; }
    }
}
