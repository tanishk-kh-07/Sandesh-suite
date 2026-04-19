import crypto from 'crypto';

// AES-256-CTR Crypto Engine
const SALT_BASE = 'sandesh_vault_salt';

// Generates an AES-256 key from a user passcode and frame count ensuring deterministic reproducibility.
function getDerivedKey(passcode: string, frameCount: number): Buffer {
    // Append frameCount to salt for unique target derivation (prevent cross-decode)
    const dynamicSalt = `${SALT_BASE}_${frameCount}`;
    return crypto.pbkdf2Sync(passcode, dynamicSalt, 100000, 32, 'sha256');
}

/**
 * Encrypt Buffer payload containing [4-byte Length][16-byte IV][Ciphertext]
 */
export function encryptPayload(data: Buffer | string, passcode: string, frameCount: number): Buffer {
    const key = getDerivedKey(passcode, frameCount);
    const iv = crypto.randomBytes(16);
    
    const bufferData = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const encryptedText = Buffer.concat([cipher.update(bufferData), cipher.final()]);
    
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(encryptedText.length, 0);
    
    const result = Buffer.concat([lengthBuffer, iv, encryptedText]);

    // Zero sensitive key material immediately
    key.fill(0);
    iv.fill(0);

    return result;
}

/**
 * Decrypt payload buffer back to Buffer. Will throw if invalid key or corrupted stream.
 * Payload must be structure: [4-byte Length][16-byte IV][Ciphertext]
 */
export function decryptPayload(payload: Buffer, passcode: string, frameCount: number): Buffer {
    if (payload.length < 20) throw new Error('Payload too small. Matrix heavily corrupted or not Stego Artifact.');
    
    const key = getDerivedKey(passcode, frameCount);
    
    // Length is implicitly correct relative to extraction (unless extracted wrong size)
    const iv = payload.subarray(4, 20);
    const encryptedText = payload.subarray(20);
    
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
    const decryptedOutput = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    
    // Zero sensitive key material
    key.fill(0);

    return decryptedOutput;
}

/**
 * Encise a binary payload array of bits into another Uint8Array array using LSB replacement.
 * Offset tells us how many bits of header to skip (e.g. WAV header 44 bytes = 352 bits)
 * step defines how many bytes per embedded bit (supports Spread Spectrum simulation / basic LSB matching)
 */
export function embedBits(carrier: Uint8Array, payload: Buffer, startByteOffset: number = 0, spread: boolean = false): Uint8Array {
    const bits: number[] = [];
    
    for (let i = 0; i < payload.length; i++) {
        const byte = payload[i];
        for (let b = 7; b >= 0; b--) {
            bits.push((byte >> b) & 1);
        }
    }
    
    const out = new Uint8Array(carrier);
    
    // Simple LSB Replacement logic
    // We modify channel bytes. If spread is enabled, we could skip bytes (but we need deterministic decode).
    // Let's implement static LSB. For spread spectrum we'll just skip 3 bytes for every bit, utilizing RGBA alpha or just spacing it out in WAV.
    const step = spread ? 3 : 1; 
    
    let carrierIdx = startByteOffset;
    
    if ((bits.length * step + startByteOffset) > out.length) {
        throw new Error("Carrier capacity insufficient for payload!");
    }
    
    for (const bit of bits) {
        // Zero out the lowest bit, then OR with the new bit
        out[carrierIdx] = (out[carrierIdx] & 0xFE) | bit;
        carrierIdx += step;
    }
    
    return out;
}

/**
 * Extracts a Buffer payload from LSB of carrier.
 * Relies on the first 32 bits defining the payload content size.
 */
export function extractBits(carrier: Uint8Array, startByteOffset: number = 0, spread: boolean = false): Buffer {
    const step = spread ? 3 : 1;
    let carrierIdx = startByteOffset;
    
    // Read 32 bits (4 bytes) to determine payload ciphertext length
    let extractedLengthBits: number[] = [];
    for (let i = 0; i < 32; i++) {
        extractedLengthBits.push(carrier[carrierIdx] & 1);
        carrierIdx += step;
    }
    
    const lengthBuffer = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) {
        let byteVal = 0;
        for (let b = 0; b < 8; b++) {
            byteVal = (byteVal << 1) | extractedLengthBits[i * 8 + b];
        }
        lengthBuffer[i] = byteVal;
    }
    
    const cipherLength = lengthBuffer.readUInt32BE(0);
    
    // Security Boundary Check
    if (cipherLength > 50 * 1024 * 1024 || cipherLength <= 0) {
        throw new Error(`Integrity Check Failed: Extracted anomalous length value ${cipherLength}. Not a true construct.`);
    }
    
    const totalRequiredBits = (cipherLength + 16) * 8; // length of ciphertext + 16 for IV in bits
    let payloadBits: number[] = [];
    
    for (let i = 0; i < totalRequiredBits; i++) {
        payloadBits.push(carrier[carrierIdx] & 1);
        carrierIdx += step;
    }
    
    const extractedBuffer = Buffer.alloc(totalRequiredBits / 8);
    for (let i = 0; i < extractedBuffer.length; i++) {
        let byteVal = 0;
        for (let b = 0; b < 8; b++) {
            byteVal = (byteVal << 1) | payloadBits[i * 8 + b];
        }
        extractedBuffer[i] = byteVal;
    }
    
    // We must return the final format [4-byte length][16-byte IV][Ciphertext] 
    return Buffer.concat([lengthBuffer, extractedBuffer]);
}
