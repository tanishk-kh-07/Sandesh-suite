import { NextRequest, NextResponse } from 'next/server';
import { PNG } from 'pngjs';
import { encryptPayload, embedBits } from '@/lib/stego';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('file') as File;
        const frameCountStr = formData.get('frameCount') as string;
        const secretText = formData.get('secretText') as string;
        const isLsbMatching = formData.get('isLsbMatching') === 'true';

        if (!passcode || !file || !frameCountStr || !secretText) {
            return NextResponse.json({ error: 'Missing required matrix parameters' }, { status: 400 });
        }

        const frameCount = parseInt(frameCountStr, 10);
        if (frameCount < 0) {
            return NextResponse.json({ error: 'System Exception: Frame variance index out of acceptable bounds (must be >= 0).' }, { status: 400 });
        }

        // Buffer the dropped file
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Decode PNG Structure
        const png = PNG.sync.read(buffer);

        // Encrypt logic
        const payloadBuffer = encryptPayload(secretText, passcode, frameCount);

        // Embed Bits into PNG
        // The PNG.sync array is RGBA. Enforce spread=false for simple LSB that matches extraction.
        png.data = Buffer.from(embedBits(new Uint8Array(png.data), payloadBuffer, 0, false));

        // Generate output PNG Buffer
        const outputBuffer = PNG.sync.write(png);

        // Zero-Persistence Server enforcement: Send back the true buffer for download
        // Client UI will create an ObjectURL to download
        return new NextResponse(new Uint8Array(outputBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': 'attachment; filename="Pixel-Vault-Artifact.png"'
            }
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process vault operation. Fatal engine panic.', 
            details: error.message 
        }, { status: 500 });
    }
}
