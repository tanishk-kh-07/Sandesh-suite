import { NextRequest, NextResponse } from 'next/server';
import { extractBits, decryptPayload } from '@/lib/stego';

function findDataChunkIndex(buffer: Buffer) {
    for (let i = 12; i < buffer.length - 4; i++) {
        if (buffer.toString('ascii', i, i + 4) === 'data') {
            return i + 8;
        }
    }
    return 44; 
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('file') as File;
        const frameCountStr = formData.get('frameCount') as string;
        
        if (!passcode || !file || !frameCountStr) {
            return NextResponse.json({ error: 'Missing required extraction protocol parameters' }, { status: 400 });
        }

        const frameCount = parseInt(frameCountStr, 10);
        const buffer = Buffer.from(await file.arrayBuffer());

        const dataOffset = findDataChunkIndex(buffer);
        
        // Extract LSB data back from the WAV binary payload.
        const extractedBuffer = extractBits(new Uint8Array(buffer), dataOffset, false);
        
        // Decrypt the payload
        const decodedBase64 = decryptPayload(extractedBuffer, passcode, frameCount).toString('utf8');
        
        return NextResponse.json({ success: true, payload: decodedBase64 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Integrity Check Failed / Corrupted File', 
            details: error.message 
        }, { status: 400 });
    }
}
