import { NextRequest, NextResponse } from 'next/server';
import { encryptPayload, embedBits } from '@/lib/stego';

const MAX_COVER_SIZE = 3.5 * 1024 * 1024;  // 3.5MB — safely under Vercel's 4.5MB serverless limit
const MAX_SECRET_SIZE = 3.5 * 1024 * 1024;  // 3.5MB — safely under Vercel's 4.5MB serverless limit

function findDataChunkIndex(buffer: Buffer) {
    // WAV files start with RIFF...WAVE. 'data' chunk contains the raw audio samples.
    for (let i = 12; i < buffer.length - 4; i++) {
        if (buffer.toString('ascii', i, i + 4) === 'data') {
            return i + 8; // skip 'data' identifier and the 4-byte chunk length
        }
    }
    return 44; // fallback to standard PCM WAV head size
}

export async function POST(request: NextRequest) {
    let audioBuffer: Buffer | null = null;
    let secretBuffer: Buffer | null = null;
    let payloadBuffer: Buffer | null = null;
    let modifiedWav: Buffer | null = null;

    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('coverFile') as File;


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

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process auditory vault operation. Fatal engine panic.', 
            details: error.message 
        }, { status: 500 });
    } finally {
        // Zero all sensitive buffers regardless of success/failure
        if (audioBuffer) { audioBuffer.fill(0); audioBuffer = null; }
        if (secretBuffer) { secretBuffer.fill(0); secretBuffer = null; }
        if (payloadBuffer) { payloadBuffer.fill(0); payloadBuffer = null; }
        if (modifiedWav) { modifiedWav.fill(0); modifiedWav = null; }
    }
}
