import { Cookie, Fingerprint, History, IdCard, Link, MapPin, Monitor, MousePointerClick } from 'lucide-react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Accent, Strike } from '../components/Text';
import { clamp, progress, useSpring } from '../lib/anim';
import { colors, fonts } from '../theme';

// 镜头 1：抛出问题 —— 常见统计工具会带走的数据，逐个被划掉

const CHIPS = [
    { label: '完整 URL', icon: Link, x: -620, y: -250 },
    { label: 'Cookie', icon: Cookie, x: 560, y: -265 },
    { label: '访客 ID', icon: IdCard, x: -40, y: -370 },
    { label: 'IP 地址', icon: MapPin, x: -730, y: 20 },
    { label: '设备指纹', icon: Fingerprint, x: 700, y: 10 },
    { label: '完整 Referrer', icon: History, x: -560, y: 280 },
    { label: 'UserAgent', icon: Monitor, x: 560, y: 290 },
    { label: '点击流', icon: MousePointerClick, x: 10, y: 380 },
];

const STRIKE_AT = 58;
const ANSWER_AT = 92;

export const Hook: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const question = useSpring(4);
    const questionOut = progress(frame, ANSWER_AT - 6, 14);
    const answer = useSpring(ANSWER_AT);

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans, alignItems: 'center', justifyContent: 'center' }}>
            {CHIPS.map((chip, i) => {
                const enter = spring({ frame: frame - 10 - i * 3, fps, config: { damping: 14, mass: 0.6 } });
                const strikeStart = STRIKE_AT + i * 3;
                const leave = progress(frame, ANSWER_AT - 10 + i * 1.5, 18);
                const Icon = chip.icon;
                const float = Math.sin((frame + i * 17) / 22) * 6;

                return (
                    <div
                        key={chip.label}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) translate(${chip.x * (0.85 + enter * 0.15)}px, ${chip.y * (0.85 + enter * 0.15) + float + leave * 120
                                }px) scale(${0.8 + enter * 0.2})`,
                            opacity: enter * (1 - leave),
                            filter: `blur(${leave * 8}px)`,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '16px 26px',
                                borderRadius: 14,
                                border: `1px solid ${colors.strongBorder}`,
                                background: `${colors.surfaceFloating}d9`,
                                color: colors.textSecondary,
                                fontSize: 30,
                                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                            }}
                        >
                            <Icon size={30} color={colors.textLabel} strokeWidth={1.8} />
                            <Strike start={strikeStart}>{chip.label}</Strike>
                        </div>
                    </div>
                );
            })}

            <div
                style={{
                    position: 'absolute',
                    textAlign: 'center',
                    opacity: question * (1 - questionOut),
                    transform: `translateY(${(1 - question) * 30 - questionOut * 30}px)`,
                    filter: `blur(${questionOut * 10}px)`,
                }}
            >
                <div style={{ fontSize: 40, color: colors.textSubtle, marginBottom: 20 }}>一次普通的页面访问</div>
                <div style={{ fontSize: 84, fontWeight: 800, color: colors.textHeading }}>
                    统计工具都<Accent>带走了什么？</Accent>
                </div>
            </div>

            <div
                style={{
                    position: 'absolute',
                    textAlign: 'center',
                    opacity: answer,
                    transform: `scale(${interpolate(answer, [0, 1], [0.92, 1], clamp)})`,
                    filter: `blur(${(1 - answer) * 12}px)`,
                }}
            >
                <div style={{ fontSize: 40, color: colors.textSubtle, marginBottom: 20 }}>Jekit 的回答</div>
                <div style={{ fontSize: 108, fontWeight: 800, color: colors.textHeading, letterSpacing: '0.02em' }}>
                    <Accent>几乎什么都不带走。</Accent>
                </div>
            </div>
        </AbsoluteFill>
    );
};
