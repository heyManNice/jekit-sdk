const XML_ENTITIES: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
};

export function escapeXml(text: string): string {
    return text.replace(/[<>&'"]/g, (character) => XML_ENTITIES[character]);
}

/** 估算 11px 字体下中文、英文和数字的宽度，不依赖浏览器测量。 */
export function estimateTextWidth(text: string): number {
    let width = 0;

    for (const character of text) {
        const codePoint = character.codePointAt(0)!;

        if (/[ilI.,:;'!\s]/.test(character)) {
            width += 4.5;
        } else if (isChineseCharacter(codePoint)) {
            width += 11.5;
        } else if (/[MWmw]/.test(character)) {
            width += 9;
        } else if (/[A-Z]/.test(character)) {
            width += 7.5;
        } else {
            width += 6.5;
        }
    }

    return width;
}

function isChineseCharacter(codePoint: number): boolean {
    return (
        (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
        (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
        (codePoint >= 0x20000 && codePoint <= 0x323af) ||
        (codePoint >= 0x3000 && codePoint <= 0x303f) ||
        (codePoint >= 0xff01 && codePoint <= 0xff60)
    );
}
