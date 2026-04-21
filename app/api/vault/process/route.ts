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
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('file') as File;


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
