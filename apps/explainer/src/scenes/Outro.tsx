import { BanknoteX, CodeXml, Globe, MegaphoneOff, ShieldCheck, UserRoundX } from 'lucide-react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Accent } from '../components/Text';
import { clamp, progress } from '../lib/anim';
import { jekitLogo } from '../lib/assets';
import { colors, fonts } from '../theme';

// 镜头 10：收尾 —— 特性标签 + Logo + 网址。标签与官网 features.tsx 保持一致。

const FEATURES = [
    { label: '完全免费', icon: BanknoteX },
    { label: '无需注册', icon: UserRoundX },
    { label: '无广告', icon: MegaphoneOff },
    { label: '无 Cookie', icon: ShieldCheck },
    { label: 'SDK 开源', icon: CodeXml },
    { label: '全球可用', icon: Globe },
];

export const Outro: React.FC<{ still?: boolean }> = ({ still = false }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const f = still ? 200 : frame;

    const logo = spring({ frame: f - 30, fps, config: { damping: 14, mass: 0.9 } });
    const ring = interpolate(f, [30, 90], [0, 1], { ...clamp });
    const url = progress(f, 56, 18);

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans, alignItems: 'center', justifyContent: 'center' }}>
            {/* 光环 */}
            <div
                style={{
                    position: 'absolute',
                    width: 900,
                    height: 900,
                    borderRadius: '50%',
                    border: `1px solid ${colors.primary}`,
                    opacity: (1 - ring) * 0.5,
                    transform: `scale(${0.4 + ring * 0.9})`,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    width: 1100,
                    height: 500,
                    borderRadius: '50%',
                    background: `radial-gradient(ellipse, ${colors.primary}30 0%, transparent 65%)`,
                    opacity: logo,
                    transform: 'translateY(-60px)',
                }}
            />

            <div style={{ display: 'flex', gap: 34, position: 'absolute', top: 210 }}>
                {FEATURES.map((item, i) => {
                    const p = spring({ frame: f - i * 4, fps, config: { damping: 200 } });
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                fontSize: 30,
                                color: colors.textSecondary,
                                opacity: p,
                                transform: `translateY(${(1 - p) * 24}px)`,
                            }}
                        >
                            <Icon size={28} color={colors.primary} strokeWidth={2} />
                            {item.label}
                        </div>
                    );
                })}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: logo,
                    transform: `scale(${0.85 + logo * 0.15})`,
                    filter: `blur(${(1 - logo) * 14}px)`,
                }}
            >
                <Img src={jekitLogo} style={{ width: 460 }} />
                <div style={{ marginTop: 26, fontSize: 46, fontWeight: 700, color: colors.textHeading, letterSpacing: '0.12em' }}>
                    见客统计
                </div>
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: 210,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 22,
                    opacity: url,
                    transform: `translateY(${(1 - url) * 20}px)`,
                }}
            >
                <div style={{ fontSize: 34, color: colors.textSubtle }}>隐私友好的公共网站统计</div>
                <div
                    style={{
                        padding: '16px 46px',
                        borderRadius: 999,
                        fontSize: 44,
                        fontWeight: 800,
                        fontFamily: fonts.mono,
                        border: `2px solid ${colors.primary}88`,
                        background: `${colors.primary}14`,
                        boxShadow: `0 0 50px ${colors.primary}30`,
                    }}
                >
                    <Accent>jekit.cn</Accent>
                </div>
            </div>
        </AbsoluteFill>
    );
};
