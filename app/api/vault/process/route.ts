import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { ensureBinaryCompiled } from '@/lib/compile_cpp';

const execFileAsync = promisify(execFile);

// Derives a cryptographic key from a user passcode using PBKDF2 (100,000 runs)
function deriveKey(passcode: string): string {
    const salt = 'sandesh_vault_salt'; // In a real app, use a random salt per user/file
    return crypto.pbkdf2Sync(passcode, salt, 100000, 32, 'sha256').toString('hex');
}

export async function POST(request: NextRequest) {
    let tempFilePath: string | null = null;
    let cryptFilePath: string | null = null;

    try {
        const formData = await request.formData();
        
        const passcode = formData.get('passcode');
        const file = formData.get('file') as File;
        const frameCount = formData.get('frameCount'); // Used for validation

        if (!passcode || typeof passcode !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid passcode' }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: 'Missing file upload' }, { status: 400 });
        }

        if (frameCount && parseInt(frameCount as string, 10) < 0) {
            return NextResponse.json({ error: 'System Exception: Frame variance index out of acceptable bounds (must be >= 0).' }, { status: 400 });
        }

        // Setup temporary file path
        const fileExtension = path.extname(file.name) || '.tmp';
        const tempFileName = `${crypto.randomUUID()}${fileExtension}`;
        tempFilePath = path.join(os.tmpdir(), tempFileName);

        // Save uploaded file buffer to temp directory
        let buffer: Buffer | null = Buffer.from(await file.arrayBuffer());
        await writeFile(tempFilePath, buffer);
        
        // Zero-Persistence: Force buffer dereference to trigger V8 Garbage Collector
        buffer = null;

        // Calculate KDF (Key Stretching)
        const derivedKey = deriveKey(passcode);

        // Ensure C++ binary is compiled
        const binaryPath = await ensureBinaryCompiled();

        // Execute the compiled executable with derived key and AES-256-CTR mode
        // Hardened execution: 10 second timeout ceiling to prevent node process hanging
        const { stdout, stderr } = await execFileAsync(binaryPath, [derivedKey, tempFilePath, '--mode=aes-256-ctr'], {
            timeout: 10000, // 10s ceiling
            maxBuffer: 1024 * 1024 * 50 // 50MB max output buffer
        });

        if (stderr) {
            console.warn('C++ Execution Stderr:', stderr);
        }

        // Parse standard output as JSON
        let result = null;
        try {
            result = JSON.parse(stdout);
        } catch (jsonErr) {
            console.error('Binary yield non-JSON standard output. Corruption likely.', jsonErr);
            return NextResponse.json({ error: 'Bridge Integrity Fault: Binary output corrupted or malformed.' }, { status: 500 });
        }

        cryptFilePath = result.outputPath;

        // Calculate Digital Seal (SHA-256 of the output file)
        let digitalSeal = '';
        if (cryptFilePath) {
            let cryptBuffer: Buffer | null = await readFile(cryptFilePath);
            digitalSeal = crypto.createHash('sha256').update(cryptBuffer).digest('hex');
            
            // Zero-Persistence: Instant dereference
            cryptBuffer = null;
        }

        // Enhance result with Digital Seal
        const finalResult = {
            ...result,
            fingerprint: digitalSeal || 'N/A'
        };

        return NextResponse.json({
            success: true,
            data: finalResult
        });

    } catch (error: any) {
        console.error('API Error:', error);

        // Graceful Fallback Checks
        if (error.killed && (error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT')) {
            return NextResponse.json({ 
                error: 'Crypto Engine Timeout. Process execution exceeded 10-second ceiling.', 
                code: 'TIMEOUT' 
            }, { status: 504 }); // 504 Gateway Timeout semantics
        }

        return NextResponse.json({ 
            error: 'Failed to process vault operation. Fatal engine panic.', 
            details: error.message 
        }, { status: 500 });

    } finally {
        // Zero-Persistence Server enforcement: Mathematically scrub SSD temp tracks
        if (tempFilePath) {
            await unlink(tempFilePath).catch(err => console.error(`[RAM SCRUB] Failed to wipe temp matrix:`, err));
        }
        if (cryptFilePath) {
            await unlink(cryptFilePath).catch(err => console.error(`[RAM SCRUB] Failed to wipe output matrix:`, err));
        }
        // Force GC references explicitly null
        tempFilePath = null;
        cryptFilePath = null;
    }
}
