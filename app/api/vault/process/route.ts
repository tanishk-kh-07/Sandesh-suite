import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { ensureBinaryCompiled } from '@/lib/compile_cpp';

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
    let tempFilePath: string | null = null;
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
        const tempFileName = `${randomUUID()}${fileExtension}`;
        tempFilePath = path.join(os.tmpdir(), tempFileName);

        // Save uploaded file buffer to temp directory
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(tempFilePath, buffer);

        // Ensure C++ binary is compiled
        const binaryPath = await ensureBinaryCompiled();

        // Execute the compiled executable
        const { stdout, stderr } = await execFileAsync(binaryPath, [passcode, tempFilePath]);

        if (stderr) {
            console.warn('C++ Execution Stderr:', stderr);
        }

        // Parse standard output as JSON
        const result = JSON.parse(stdout);

        // Delete the temporary file asynchronously after sending the response to not block
        unlink(tempFilePath).catch(err => console.error(`Failed to delete temp file ${tempFilePath}:`, err));

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('API Error:', error);
        
        // Cleanup if an error happened before cleanup phase
        if (tempFilePath) {
            unlink(tempFilePath).catch(() => {});
        }

        return NextResponse.json({ error: 'Failed to process vault operation', details: error.message }, { status: 500 });
    }
}
