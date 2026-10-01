import type { CSSProperties, ReactNode } from 'react';
import { colors, fonts } from '../theme';

type WindowProps = {
    children: ReactNode;
    width: number;
    height: number;
    /** browser：带地址栏；editor：带文件标签；plain：只有标题 */
    variant?: 'browser' | 'editor' | 'plain';
    title?: string;
    url?: string;
    tabs?: string[];
    activeTab?: number;
    style?: CSSProperties;
    bodyStyle?: CSSProperties;
};

const BAR_HEIGHT = 52;

export const Window: React.FC<WindowProps> = ({
    children,
    width,
    height,
    variant = 'plain',
    title,
    url,
    tabs,
    activeTab = 0,
    style,
    bodyStyle,
}) => (
    <div
        style={{
            width,
            height,
            borderRadius: 18,
            overflow: 'hidden',
            background: `${colors.surface}f2`,
            border: `1px solid ${colors.strongBorder}`,
            boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px ${colors.primary}10, 0 0 80px ${colors.primary}14`,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: fonts.sans,
            ...style,
        }}
    >
        <div
            style={{
                height: BAR_HEIGHT,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 20px',
                background: colors.surfaceSubtle,
                borderBottom: `1px solid ${colors.controlBorder}`,
            }}
        >
            <div style={{ display: 'flex', gap: 9 }}>
                {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                    <span key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c, opacity: 0.9 }} />
                ))}
            </div>

            {variant === 'browser' ? (
                <div
                    style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 8,
                        background: colors.bg,
                        border: `1px solid ${colors.controlBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0 14px',
                        color: colors.textSubtle,
                        fontSize: 18,
                        fontFamily: fonts.mono,
                    }}
                >
                    <span style={{ color: colors.positive, fontSize: 14 }}>●</span>
                    {url}
                </div>
            ) : null}

            {variant === 'editor' && tabs ? (
                <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-end' }}>
                    {tabs.map((tab, i) => (
                        <div
                            key={tab}
                            style={{
                                padding: '10px 20px',
                                fontSize: 18,
                                fontFamily: fonts.mono,
                                color: i === activeTab ? colors.textHeading : colors.textMuted,
                                background: i === activeTab ? colors.surface : 'transparent',
                                borderTopLeftRadius: 8,
                                borderTopRightRadius: 8,
                                borderTop: i === activeTab ? `2px solid ${colors.primary}` : '2px solid transparent',
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                </div>
            ) : null}

            {variant === 'plain' && title ? (
                <div style={{ flex: 1, textAlign: 'center', color: colors.textSubtle, fontSize: 18, marginRight: 60 }}>
                    {title}
                </div>
            ) : null}
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', ...bodyStyle }}>{children}</div>
    </div>
);

/** 圆角描边小卡片 */
export const Card: React.FC<{ children: ReactNode; style?: CSSProperties; glow?: boolean }> = ({
    children,
    style,
    glow,
}) => (
    <div
        style={{
            borderRadius: 14,
            border: `1px solid ${glow ? `${colors.primary}66` : colors.controlBorder}`,
            background: `${colors.surfaceSubtle}e6`,
            boxShadow: glow ? `0 0 40px ${colors.primary}22, inset 0 0 24px ${colors.primary}0f` : undefined,
            fontFamily: fonts.sans,
            ...style,
        }}
    >
        {children}
    </div>
);
