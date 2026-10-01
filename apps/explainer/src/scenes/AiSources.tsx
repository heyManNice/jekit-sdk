import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Accent, Kicker, Reveal } from '../components/Text';
import { clamp, progress } from '../lib/anim';
import { aiBrands, jekitLogo } from '../lib/assets';
import { AI_SOURCE_COUNT, SEARCH_ENGINE_COUNT } from '../lib/jekit';
import { colors, fonts } from '../theme';

// 镜头 6：AI 来源统计 —— AI 品牌图标在 Jekit 周围依次点亮并环绕

const RADIUS_X = 660;
const RADIUS_Y = 255;
const CENTER_Y = 560;

export const AiSources: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width } = useVideoConfig();
    const cx = width / 2;

    const core = spring({ frame: frame - 6, fps, config: { damping: 12, mass: 0.8 } });
    const rotation = interpolate(frame, [0, 240], [0, 0.6], clamp) - 0.2;
    const statsIn = progress(frame, 110, 18);

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans }}>
            <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Reveal>
                    <Kicker>AI 搜索时代</Kicker>
                </Reveal>
                <Reveal delay={4}>
                    <div style={{ fontSize: 62, fontWeight: 800, color: colors.textHeading }}>
                        看清有多少访客，<Accent>来自 AI</Accent>
                    </div>
                </Reveal>
            </div>

            {/* 轨道 */}
            <svg width={width} height={1080} style={{ position: 'absolute', inset: 0 }}>
                <ellipse
                    cx={cx}
                    cy={CENTER_Y}
                    rx={RADIUS_X}
                    ry={RADIUS_Y}
                    fill="none"
                    stroke={colors.primary}
                    strokeOpacity={0.18}
                    strokeDasharray="6 10"
                    strokeWidth={2}
                    style={{ opacity: core }}
                />
                {aiBrands.map((_, i) => {
                    const lit = progress(frame, 22 + i * 5, 14);
                    const angle = (i / aiBrands.length) * Math.PI * 2 + rotation;
                    const x = cx + Math.cos(angle) * RADIUS_X;
                    const y = CENTER_Y + Math.sin(angle) * RADIUS_Y;
                    return (
                        <line
                            key={i}
                            x1={cx}
                            y1={CENTER_Y}
                            x2={cx + (x - cx) * lit}
                            y2={CENTER_Y + (y - CENTER_Y) * lit}
                            stroke={colors.primary}
                            strokeOpacity={0.22 * (1 - progress(frame, 60 + i * 5, 30) * 0.6)}
                            strokeWidth={1.5}
                        />
                    );
                })}
            </svg>

            {/* 中心 */}
            <div
                style={{
                    position: 'absolute',
                    left: cx,
                    top: CENTER_Y,
                    transform: `translate(-50%, -50%) scale(${core})`,
                    width: 260,
                    height: 260,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: `radial-gradient(circle, ${colors.surfaceActive} 0%, ${colors.surface} 70%)`,
                    border: `1px solid ${colors.primary}55`,
                    boxShadow: `0 0 120px ${colors.primary}33, inset 0 0 40px ${colors.primary}22`,
                }}
            >
                <Img src={jekitLogo} style={{ width: 170 }} />
            </div>

            {/* 品牌 */}
            {aiBrands.map((brand, i) => {
                const p = spring({ frame: frame - 22 - i * 5, fps, config: { damping: 13, mass: 0.6 } });
                const angle = (i / aiBrands.length) * Math.PI * 2 + rotation;
                const x = cx + Math.cos(angle) * RADIUS_X;
                const y = CENTER_Y + Math.sin(angle) * RADIUS_Y;
                const depth = (Math.sin(angle) + 1) / 2; // 0 = 远，1 = 近

                return (
                    <div
                        key={brand.name}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            transform: `translate(-50%, -50%) scale(${p * (0.82 + depth * 0.28)})`,
                            opacity: p * (0.6 + depth * 0.4),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                            zIndex: Math.round(depth * 10),
                        }}
                    >
                        <div
                            style={{
                                width: 92,
                                height: 92,
                                borderRadius: 24,
                                display: 'grid',
                                placeItems: 'center',
                                // 图标颜色深浅不一（ChatGPT、Grok 为白色），统一铺深色底并加描边保证可读
                                background: `linear-gradient(160deg, ${colors.surfaceFloating}, ${colors.surface})`,
                                border: `1px solid ${colors.strongBorder}`,
                                boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 0 4px ${colors.primary}${p > 0.9 ? '22' : '00'}`,
                            }}
                        >
                            <Img src={brand.icon} style={{ width: 58, height: 58, objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 600, color: colors.textSecondary, whiteSpace: 'nowrap' }}>{brand.name}</div>
                    </div>
                );
            })}

            <div
                style={{
                    position: 'absolute',
                    bottom: 44,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 90,
                    opacity: statsIn,
                    transform: `translateY(${(1 - statsIn) * 20}px)`,
                }}
            >
                {[
                    { n: AI_SOURCE_COUNT, label: '个 AI 渠道' },
                    { n: SEARCH_ENGINE_COUNT, label: '个搜索引擎' },
                    { n: 0, label: '字节原始 Referrer 上传', zero: true },
                ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                        <span style={{ fontSize: 58, fontWeight: 900, fontFamily: fonts.mono, color: s.zero ? colors.positive : colors.primary }}>{s.n}</span>
                        <span style={{ fontSize: 26, color: colors.textSubtle }}>{s.label}</span>
                    </div>
                ))}
            </div>
        </AbsoluteFill>
    );
};
