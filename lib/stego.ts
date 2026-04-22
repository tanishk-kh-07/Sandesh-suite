import crypto from 'crypto';

// AES-256-CTR Crypto Engine
const SALT_BASE = 'sandesh_vault_salt';

// Generates an AES-256 key from a user passcode ensuring deterministic reproducibility.
function getDerivedKey(passcode: string): Buffer {
    return crypto.pbkdf2Sync(passcode, SALT_BASE, 100000, 32, 'sha256');
}

/**
 * Encrypt Buffer payload containing [4-byte Payload Header][16-byte IV][Ciphertext]
 * The 4-byte header encodes: [1-bit Spread Flag][31-bit Ciphertext Length]
 */
export function encryptPayload(data: Buffer | string, passcode: string, spread: boolean = false): Buffer {
    const key = getDerivedKey(passcode);
    const iv = crypto.randomBytes(16);
    
    const bufferData = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const encryptedText = Buffer.concat([cipher.update(bufferData), cipher.final()]);
    
    const lengthBuffer = Buffer.alloc(4);
    // MSB = spread flag, remaining 31 bits = length
    const headerValue = (encryptedText.length & 0x7FFFFFFF) | (spread ? 0x80000000 : 0);
    lengthBuffer.writeUInt32BE(headerValue, 0);
    
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
export function decryptPayload(payload: Buffer, passcode: string): Buffer {
    if (payload.length < 20) throw new Error('Payload too small. Matrix heavily corrupted or not Stego Artifact.');
    
    const key = getDerivedKey(passcode);
    
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
 * Encise a binary payload array of bits into another Uint8Array array using LSB replacement or Matching.
 * Offset tells us how many bits of header to skip (e.g. WAV header 44 bytes = 352 bits)
 * step defines how many bytes per embedded bit (Spread Spectrum)
 * matching: if true, uses +/- 1 instead of direct replacement (LSB Matching)
 */
export function embedBits(
    carrier: Uint8Array, 
    payload: Buffer, 
    startByteOffset: number = 0, 
    spread: boolean = false,
    matching: boolean = false
): Uint8Array {
    const bits: number[] = [];
    
    for (let i = 0; i < payload.length; i++) {
        const byte = payload[i];
        for (let b = 7; b >= 0; b--) {
            bits.push((byte >> b) & 1);
        }
    }
    
    const out = new Uint8Array(carrier);
    const step = spread ? 3 : 1; 
    
    let carrierIdx = startByteOffset;
    
    if ((bits.length * step + startByteOffset) > out.length) {
        throw new Error("Carrier capacity insufficient for payload!");
    }
    
    for (let i = 0; i < bits.length; i++) {
        const bit = bits[i];
        // Header (first 32 bits) is always contiguous for protocol reliability.
        // Payload (remaining bits) is spread if spread flag is active.
        const currentStep = i < 32 ? 1 : step;

        if (matching) {
            // LSB Matching (+/- 1)
            if ((out[carrierIdx] % 2) !== bit) {
                if (out[carrierIdx] === 0) out[carrierIdx]++;
                else if (out[carrierIdx] === 255) out[carrierIdx]--;
                else out[carrierIdx] += crypto.randomInt(2) === 1 ? 1 : -1;
            }
        } else {
            // Simple LSB Replacement
            out[carrierIdx] = (out[carrierIdx] & 0xFE) | bit;
        }
        carrierIdx += currentStep;
    }
    
    return out;
}

/**
 * Extracts a Buffer payload from LSB of carrier.
 * Automatically recovers payload length and spread flags from the 32-bit header.
 */
export function extractBits(carrier: Uint8Array, startByteOffset: number = 0): Buffer {
    let carrierIdx = startByteOffset;
    
    // Read 32 bits (4 bytes) to determine payload header (length + flags)
    // We start with step=1 to read the header reliably
    let headerBits: number[] = [];
    for (let i = 0; i < 32; i++) {
        headerBits.push(carrier[carrierIdx] & 1);
        carrierIdx++; // Header is always contiguous for reliability
    }
    
    const headerBuffer = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) {
        let byteVal = 0;
        for (let b = 0; b < 8; b++) {
            byteVal = (byteVal << 1) | headerBits[i * 8 + b];
        }
        headerBuffer[i] = byteVal;
    }
    
    const headerValue = headerBuffer.readUInt32BE(0);
    const spread = (headerValue & 0x80000000) !== 0;
    const cipherLength = headerValue & 0x7FFFFFFF;
    
    // Reset carrierIdx to after header and apply actual step
    const step = spread ? 3 : 1;
    carrierIdx = startByteOffset + 32; // Skip the 32 header bits (assuming header was contiguous)
    // Actually, if encryption used spread for the header too, we'd need to know. 
    // But for "Smart" extraction, let's keep header contiguous for protocol reliability.
    
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
    
    // We must return the final format [4-byte header][16-byte IV][Ciphertext] 
    return Buffer.concat([headerBuffer, extractedBuffer]);
}
