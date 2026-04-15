import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function ensureBinaryCompiled(): Promise<string> {
    const cppDir = path.join(process.cwd(), 'src', 'cpp');
    const sourceFilePath = path.join(cppDir, 'military_vault.cpp');
    const binaryFilePath = path.join(cppDir, 'military_vault');

    if (!fs.existsSync(cppDir)) {
        fs.mkdirSync(cppDir, { recursive: true });
    }

    // Try to compile it. In a real environment we might want to check the mtime 
    // of the source vs binary to skip compilation if it's up to date.
    // For this scenario we'll just check if it exists, and if not, compile it.
    if (!fs.existsSync(binaryFilePath)) {
        console.log('Compiling military_vault.cpp for Apple Silicon (arm64)...');
        try {
            // macOS specific Apple Silicon compilation
            await execAsync(`clang++ -arch arm64 -o "${binaryFilePath}" "${sourceFilePath}"`);
            console.log('Compilation successful.');
        } catch (error) {
            console.error('Compilation failed:', error);
            throw error;
        }
    }

    return binaryFilePath;
}
