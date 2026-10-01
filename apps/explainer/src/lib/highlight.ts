import { colors, syntax } from '../theme';

// 一个只为视频准备的极简语法高亮：
// 覆盖 TS / TSX / Vue 模板 / HTML / Shell 的常见形态即可，不追求完整语法。

export type Token = { text: string; color: string };
export type Line = Token[];

const NUMBER = '#b5cea8';

const RULES: ReadonlyArray<readonly [RegExp, string]> = [
    [/^\/\/.*/, syntax.muted],
    [/^#\s.*/, syntax.muted],
    [/^<!--.*?-->/, syntax.muted],
    [/^(['"`])(?:\\.|(?!\1).)*\1/, syntax.string],
    [/^(?:import|from|export|function|const|let|return|default|async|await|new|setup)\b/, syntax.keyword],
    [/^(?:npm|npx)\b/, syntax.identifier],
    [/^<\/?[A-Za-z][\w.-]*/, syntax.tag],
    [/^\/?>/, syntax.tag],
    [/^[A-Za-z_$][\w$]*(?=\s*\()/, syntax.identifier],
    [/^\d+(?:\.\d+)*/, NUMBER],
    [/^[{}()[\]]/, syntax.punctuation],
    [/^\s+/, syntax.text],
    [/^[A-Za-z_$][\w$-]*/, syntax.text],
    [/^./, syntax.text],
];

function tokenizeLine(line: string): Line {
    const tokens: Line = [];
    let rest = line;

    while (rest.length > 0) {
        for (const [pattern, color] of RULES) {
            const match = pattern.exec(rest);
            if (!match || match[0].length === 0) continue;

            const last = tokens.at(-1);
            if (last && last.color === color) {
                last.text += match[0];
            } else {
                tokens.push({ text: match[0], color });
            }
            rest = rest.slice(match[0].length);
            break;
        }
    }

    return tokens;
}

export function highlight(code: string): Line[] {
    return code.split('\n').map(tokenizeLine);
}

/** 代码按"可见字符数"截断，换行也计为 1 个字符 */
export function sliceLines(lines: Line[], visible: number): { lines: Line[]; cursorLine: number } {
    const result: Line[] = [];
    let remaining = visible;
    let cursorLine = 0;

    for (let i = 0; i < lines.length; i++) {
        if (remaining <= 0 && i > 0) break;

        const line: Line = [];
        for (const token of lines[i]) {
            if (remaining <= 0) break;
            const chars = Array.from(token.text);
            const take = Math.min(chars.length, remaining);
            line.push({ text: chars.slice(0, take).join(''), color: token.color });
            remaining -= take;
        }

        result.push(line);
        cursorLine = i;
        remaining -= 1; // 换行
    }

    return { lines: result, cursorLine };
}

export function totalChars(code: string): number {
    return Array.from(code).length;
}

export { colors as codeColors };
