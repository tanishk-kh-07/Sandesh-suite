import { NextRequest, NextResponse } from 'next/server';
import { encryptPayload, embedBits } from '@/lib/stego';

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
    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('coverFile') as File;
        const frameCountStr = formData.get('frameCount') as string;
        const secretFile = formData.get('secretFile') as File;

        if (!passcode || !file || !frameCountStr || !secretFile) {
            return NextResponse.json({ error: 'Missing required audio matrix parameters' }, { status: 400 });
        }

        const frameCount = parseInt(frameCountStr, 10);
        if (frameCount < 0) {
            return NextResponse.json({ error: 'System Exception: Frame variance index out of acceptable bounds.' }, { status: 400 });
        }

        // Buffer the cover and payload
        const audioBuffer = Buffer.from(await file.arrayBuffer());
        const secretBuffer = Buffer.from(await secretFile.arrayBuffer());
        
        // Use base64 encoding to easily represent the binary file in the UI later
        const secretBase64 = secretBuffer.toString('base64');
        const payloadBuffer = encryptPayload(secretBase64, passcode, frameCount);

        const dataOffset = findDataChunkIndex(audioBuffer);
        
        // Embed Bits into WAV audio Buffer
        // We inject the LSB directly in the audio sample byte stream, bypassing format logic safely.
        const modifiedWav = Buffer.from(embedBits(new Uint8Array(audioBuffer), payloadBuffer, dataOffset, false));

        return new NextResponse(new Uint8Array(modifiedWav), {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Disposition': 'attachment; filename="Audio-Vault-Artifact.wav"'
            }
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process auditory vault operation. Fatal engine panic.', 
            details: error.message 
        }, { status: 500 });
    }
}
