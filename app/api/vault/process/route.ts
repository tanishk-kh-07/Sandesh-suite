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

        if (!passcode || typeof passcode !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid passcode' }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: 'Missing file upload' }, { status: 400 });
        }

        // Setup temporary file path
        const fileExtension = path.extname(file.name) || '.tmp';
        const tempFileName = `${crypto.randomUUID()}${fileExtension}`;
        tempFilePath = path.join(os.tmpdir(), tempFileName);

        // Save uploaded file buffer to temp directory
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(tempFilePath, buffer);

        // Calculate KDF (Key Stretching)
        const derivedKey = deriveKey(passcode);

        // Ensure C++ binary is compiled
        const binaryPath = await ensureBinaryCompiled();

        // Execute the compiled executable with derived key and AES-256-CTR mode
        const { stdout, stderr } = await execFileAsync(binaryPath, [derivedKey, tempFilePath, '--mode=aes-256-ctr']);

        if (stderr) {
            console.warn('C++ Execution Stderr:', stderr);
        }

        // Parse standard output as JSON
        const result = JSON.parse(stdout);
        cryptFilePath = result.outputPath;

        // Calculate Digital Seal (SHA-256 of the output file)
        let digitalSeal = '';
        if (cryptFilePath) {
            const cryptBuffer = await readFile(cryptFilePath);
            digitalSeal = crypto.createHash('sha256').update(cryptBuffer).digest('hex');
        }

        // Enhance result with Digital Seal
        const finalResult = {
            ...result,
            fingerprint: digitalSeal || 'N/A'
        };

        // Cleanup temporary files
        unlink(tempFilePath).catch(err => console.error(`Failed to delete temp file ${tempFilePath}:`, err));
        if (cryptFilePath) {
            unlink(cryptFilePath).catch(err => console.error(`Failed to delete crypt file ${cryptFilePath}:`, err));
        }

        return NextResponse.json({
            success: true,
            data: finalResult
        });

    } catch (error: any) {
        console.error('API Error:', error);
        
        // Cleanup if an error happened before cleanup phase
        if (tempFilePath) {
            unlink(tempFilePath).catch(() => {});
        }
        if (cryptFilePath) {
            unlink(cryptFilePath).catch(() => {});
        }

        return NextResponse.json({ error: 'Failed to process vault operation', details: error.message }, { status: 500 });
    }
}
