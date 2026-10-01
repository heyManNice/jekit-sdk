import type { CSSProperties, ReactNode } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { clamp, useSpring } from '../lib/anim';
import { colors, fonts } from '../theme';

/** 青色渐变强调字 */
export const Accent: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
    <span
        style={{
            background: `linear-gradient(100deg, ${colors.primaryHighlight} 0%, ${colors.primary} 45%, ${colors.accent} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            ...style,
        }}
    >
        {children}
    </span>
);

/** 从下方带模糊浮现 */
export const Reveal: React.FC<{
    children: ReactNode;
    delay?: number;
    distance?: number;
    style?: CSSProperties;
}> = ({ children, delay = 0, distance = 36, style }) => {
    const p = useSpring(delay);
    return (
        <div
            style={{
                opacity: p,
                transform: `translateY(${(1 - p) * distance}px)`,
                filter: `blur(${(1 - p) * 10}px)`,
                ...style,
            }}
        >
            {children}
        </div>
    );
};

/** 场景标题：小标签 + 主标题 + 副标题，依次浮现 */
export const SceneTitle: React.FC<{
    kicker?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    delay?: number;
    align?: 'left' | 'center';
    size?: number;
    style?: CSSProperties;
}> = ({ kicker, title, subtitle, delay = 0, align = 'center', size = 76, style }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: align === 'center' ? 'center' : 'flex-start',
            textAlign: align,
            gap: 18,
            fontFamily: fonts.sans,
            ...style,
        }}
    >
        {kicker ? (
            <Reveal delay={delay} distance={20}>
                <Kicker>{kicker}</Kicker>
            </Reveal>
        ) : null}
        <Reveal delay={delay + 4}>
            <div
                style={{
                    fontSize: size,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    color: colors.textHeading,
                }}
            >
                {title}
            </div>
        </Reveal>
        {subtitle ? (
            <Reveal delay={delay + 10} distance={24}>
                <div style={{ fontSize: size * 0.36, color: colors.textSubtle, lineHeight: 1.6 }}>{subtitle}</div>
            </Reveal>
        ) : null}
    </div>
);

export const Kicker: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 18px',
            borderRadius: 999,
            border: `1px solid ${colors.primary}40`,
            background: `linear-gradient(90deg, ${colors.primary}1a, ${colors.primaryStrong}0d)`,
            color: colors.primary,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '0.08em',
            fontFamily: fonts.sans,
        }}
    >
        <span
            style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors.primary,
                boxShadow: `0 0 12px ${colors.primary}`,
            }}
        />
        {children}
    </div>
);

/** 文字划线删除效果，start 帧开始划线 */
export const Strike: React.FC<{ children: ReactNode; start: number; color?: string; style?: CSSProperties }> = ({
    children,
    start,
    color = colors.negative,
    style,
}) => {
    const frame = useCurrentFrame();
    const p = interpolate(frame, [start, start + 10], [0, 1], clamp);
    return (
        <span style={{ position: 'relative', display: 'inline-block', ...style }}>
            <span style={{ opacity: 1 - p * 0.55 }}>{children}</span>
            <span
                style={{
                    position: 'absolute',
                    left: -4,
                    right: -4,
                    top: '52%',
                    height: 4,
                    borderRadius: 2,
                    background: color,
                    transformOrigin: 'left center',
                    transform: `scaleX(${p})`,
                    boxShadow: `0 0 10px ${color}`,
                }}
            />
        </span>
    );
};
