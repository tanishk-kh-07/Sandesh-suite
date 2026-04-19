import { NextRequest, NextResponse } from 'next/server';
import { PNG } from 'pngjs';
import { encryptPayload, embedBits } from '@/lib/stego';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB hard limit

export async function POST(request: NextRequest) {
    let buffer: Buffer | null = null;
    let payloadBuffer: Buffer | null = null;
    let outputBuffer: Buffer | null = null;

    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('file') as File;
        const frameCountStr = formData.get('frameCount') as string;
        const secretText = formData.get('secretText') as string;

        if (!passcode || !file || !frameCountStr || !secretText) {
            return NextResponse.json({ error: 'Missing required matrix parameters' }, { status: 400 });
        }

        // Server-side file size enforcement
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 413 });
        }

        const frameCount = parseInt(frameCountStr, 10);
        if (frameCount < 0) {
            return NextResponse.json({ error: 'System Exception: Frame variance index out of acceptable bounds (must be >= 0).' }, { status: 400 });
        }

        // Buffer the dropped file
        buffer = Buffer.from(await file.arrayBuffer());
        
        // Decode PNG Structure
        const png = PNG.sync.read(buffer);

        // Encrypt logic
        payloadBuffer = encryptPayload(secretText, passcode, frameCount);

        // Embed Bits into PNG
        // The PNG.sync array is RGBA. Enforce spread=false for simple LSB that matches extraction.
        png.data = Buffer.from(embedBits(new Uint8Array(png.data), payloadBuffer, 0, false));

        // Generate output PNG Buffer
        outputBuffer = PNG.sync.write(png);

        // Zero-Persistence Server enforcement: Send back the true buffer for download
        // Client UI will create an ObjectURL to download
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

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process vault operation. Fatal engine panic.', 
            details: error.message 
        }, { status: 500 });
    } finally {
        // Zero all sensitive buffers regardless of success/failure
        if (buffer) { buffer.fill(0); buffer = null; }
        if (payloadBuffer) { payloadBuffer.fill(0); payloadBuffer = null; }
        if (outputBuffer) { outputBuffer.fill(0); outputBuffer = null; }
    }
}
