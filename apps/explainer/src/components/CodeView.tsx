import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { cursorVisible } from '../lib/anim';
import { highlight, sliceLines } from '../lib/highlight';
import { colors, fonts } from '../theme';

type CodeViewProps = {
    code: string;
    /** 可见字符数；不传则全部显示 */
    chars?: number;
    fontSize?: number;
    lineHeight?: number;
    lineNumbers?: boolean;
    cursor?: boolean;
    /** 高亮的行号（从 0 开始），其余行变暗 */
    focusLines?: number[];
    style?: CSSProperties;
};

export const CodeView: React.FC<CodeViewProps> = ({
    code,
    chars = Number.POSITIVE_INFINITY,
    fontSize = 26,
    lineHeight = 1.7,
    lineNumbers = false,
    cursor = false,
    focusLines,
    style,
}) => {
    const frame = useCurrentFrame();
    const lines = useMemo(() => highlight(code), [code]);
    const visible = sliceLines(lines, chars);
    const showCursor = cursor && cursorVisible(frame);

    return (
        <div style={{ fontFamily: fonts.mono, fontSize, lineHeight, whiteSpace: 'pre', ...style }}>
            {visible.lines.map((line, i) => {
                const dimmed = focusLines !== undefined && !focusLines.includes(i);
                return (
                    <div key={i} style={{ display: 'flex', opacity: dimmed ? 0.35 : 1 }}>
                        {lineNumbers ? (
                            <span
                                style={{
                                    width: fontSize * 2,
                                    flexShrink: 0,
                                    color: colors.textMuted,
                                    opacity: 0.55,
                                    textAlign: 'right',
                                    marginRight: fontSize,
                                }}
                            >
                                {i + 1}
                            </span>
                        ) : null}
                        <span>
                            {line.map((token, j) => (
                                <span key={j} style={{ color: token.color }}>
                                    {token.text}
                                </span>
                            ))}
                            {i === visible.cursorLine && cursor ? (
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: fontSize * 0.55,
                                        height: fontSize * 1.15,
                                        marginLeft: 2,
                                        verticalAlign: 'text-bottom',
                                        background: colors.primary,
                                        opacity: showCursor ? 0.9 : 0,
                                    }}
                                />
                            ) : null}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
