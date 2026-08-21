


export function toBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        uint8Array[i] = binary.charCodeAt(i);
    }
    return uint8Array;
}