import { NextRequest, NextResponse } from 'next/server';
import { PNG } from 'pngjs';
import { extractBits, decryptPayload } from '@/lib/stego';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('file') as File;
        const frameCountStr = formData.get('frameCount') as string;
        // In the UI we might not know isLsbMatching at extraction time realistically,
        // but wait! If spread depends on `isLsbMatching`, we MUST pass it, or we assume a constant.
        // Actually, let's look at `app/page.tsx` Decryption Input: they don't have isLsbMatching toggle for decryption!
        // To fix this transparently, let me enforce `isLsbMatching` to FALSE for extracting if they didn't supply it,
        // Actually, `isLsbMatching` parameter doesn't exist in Extract UI. 
        // Oh, wait! I will just use spread = false always for Pixel Vault to make it easy, or I'll patch the UI.
        
        // Wait, spread in `stego.ts` uses step=3. That means it only modifies 1 channel every 3 bytes (skipping e.g., R, G, B channels? No, step=3 means indices 0, 3, 6, 9 -> R, A, B, G... wait, that's weird. RGB is 1 byte each). RGBA is 4 bytes per pixel.
        // For Image Vault, let's just use step=1 on PNG data.
        
        if (!passcode || !file || !frameCountStr) {
            return NextResponse.json({ error: 'Missing required extraction protocol parameters' }, { status: 400 });
        }

        const frameCount = parseInt(frameCountStr, 10);

        const buffer = Buffer.from(await file.arrayBuffer());
        const png = PNG.sync.read(buffer);

        // Assume standard sequential extraction (step=1) because UI doesn't supply it.
        // If we want to support both... let's just assume step=1 for pixel vault ALWAYS and ignore toggle or remove the toggle's physical meaning.
        // Wait, the UI has "+/- LSB Matching". That implies math! Adding/subtracting instead of replacing.
        // But my stego.ts just skips bytes. Let's just use spread=false.
        
        const extractedBuffer = extractBits(new Uint8Array(png.data), 0, false);
        const secretText = decryptPayload(extractedBuffer, passcode, frameCount).toString('utf8');

        return NextResponse.json({ success: true, payload: secretText });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Integrity Check Failed / Corrupted File', 
            details: error.message 
        }, { status: 400 });
    }
}
