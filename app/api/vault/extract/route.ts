import { NextRequest, NextResponse } from 'next/server';
import { PNG } from 'pngjs';
import { extractBits, decryptPayload } from '@/lib/stego';

const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB — safely under Vercel's 4.5MB serverless limit

export async function POST(request: NextRequest) {
    let buffer: Buffer | null = null;
    let extractedBuffer: Buffer | null = null;
    let decryptedBuffer: Buffer | null = null;

    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode') as string;
        const file = formData.get('file') as File;
        
        if (!passcode || !file) {
            return NextResponse.json({ error: 'Missing required extraction protocol parameters' }, { status: 400 });
        }

        // Server-side file size enforcement
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 413 });
        }

        buffer = Buffer.from(await file.arrayBuffer());
        const png = PNG.sync.read(buffer);

            const secretText = decryptedBuffer.toString('utf8');

            return NextResponse.json({ success: true, payload: secretText }, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                    'Pragma': 'no-cache',
                }
            });
        } catch {
            // Plausible Deniability: ambiguous response — do not reveal whether
            // the file has no hidden data or the passcode was simply wrong.
            return NextResponse.json({ 
                success: false, 
                message: 'No secure payload detected or invalid passcode.' 
            }, {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                    'Pragma': 'no-cache',
                }
            });
        }

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'No secure payload detected or invalid passcode.' 
        }, { status: 200 });
    } finally {
        // Zero all sensitive buffers regardless of success/failure
        if (buffer) { buffer.fill(0); buffer = null; }
        if (extractedBuffer) { extractedBuffer.fill(0); extractedBuffer = null; }
        if (decryptedBuffer) { decryptedBuffer.fill(0); decryptedBuffer = null; }
    }
}
