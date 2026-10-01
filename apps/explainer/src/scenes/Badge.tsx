import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Accent, Kicker, Reveal } from '../components/Text';
import { Window } from '../components/Window';
import { clamp, cursorVisible, progress, typed, typedEnd } from '../lib/anim';
import { badgeDataUri } from '../lib/jekit';
import { colors, fonts, syntax } from '../theme';

// 镜头 8：一行 Markdown，GitHub README 里就有访问量徽章。
// 徽章 SVG 由 functions/badge 的真实渲染器生成。

const MARKDOWN = '![](https://badge.jekit.cn/flat/pv?url=your-site.com)';
const TYPE_AT = 20;
const SPEED = 1.6;
const TYPED_DONE = typedEnd(MARKDOWN, TYPE_AT, SPEED);
const BADGE_AT = TYPED_DONE + 8;

const SHOWCASE = [
    { label: '站点PV', value: '1284306', style: 'flat' },
    { label: '今日站点UV', value: '1062', style: 'flat-square', color: '#06b6d4' },
    { label: 'TTFB P75', value: '120ms', style: 'plastic', color: '#7c3aed' },
    { label: 'PAGE PV', value: '38217', style: 'for-the-badge', color: '#0891b2' },
    { label: '接入天数', value: '365', style: 'flat', color: '#e05d44' },
] as const;

export const Badge: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const win = spring({ frame: frame - 6, fps, config: { damping: 200 } });
    const badge = spring({ frame: frame - BADGE_AT, fps, config: { damping: 11, mass: 0.6 } });
    const md = typed(MARKDOWN, frame, TYPE_AT, SPEED);

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans }}>
            <div style={{ position: 'absolute', top: 72, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Reveal>
                    <Kicker>开源作者最爱</Kicker>
                </Reveal>
                <Reveal delay={4}>
                    <div style={{ fontSize: 60, fontWeight: 800, color: colors.textHeading }}>
                        一行 Markdown，<Accent>README 也有访问量</Accent>
                    </div>
                </Reveal>
            </div>

            <div
                style={{
                    position: 'absolute',
                    top: 270,
                    left: '50%',
                    transform: `translateX(-50%) translateY(${(1 - win) * 50}px)`,
                    opacity: win,
                }}
            >
                <Window width={1400} height={560} variant="browser" url="github.com/you/awesome-project">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
                        <div style={{ padding: 36, borderRight: `1px solid ${colors.controlBorder}`, background: colors.bg }}>
                            <div style={{ fontSize: 18, color: colors.textMuted, fontFamily: fonts.mono, marginBottom: 20 }}>README.md</div>
                            <div style={{ fontFamily: fonts.mono, fontSize: 24, lineHeight: 1.8, color: syntax.text }}>
                                <div style={{ color: syntax.keyword }}># awesome-project</div>
                                <div style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                    <span style={{ color: syntax.string }}>{md}</span>
                                    {frame < BADGE_AT + 20 ? (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: 12,
                                                height: 26,
                                                verticalAlign: 'text-bottom',
                                                background: colors.primary,
                                                opacity: cursorVisible(frame) ? 1 : 0,
                                            }}
                                        />
                                    ) : null}
                                </div>
                                <div style={{ color: colors.textMuted, marginTop: 14 }}>A delightful library for ...</div>
                            </div>
                        </div>
                        <div style={{ padding: 36, background: '#0d1117' }}>
                            <div style={{ fontSize: 40, fontWeight: 700, color: '#e6edf3', paddingBottom: 14, borderBottom: '1px solid #30363d' }}>
                                awesome-project
                            </div>
                            <div
                                style={{
                                    marginTop: 22,
                                    height: 40,
                                    transformOrigin: 'left center',
                                    transform: `scale(${interpolate(badge, [0, 1], [0.4, 1.6], clamp)})`,
                                    opacity: badge,
                                }}
                            >
                                <Img src={badgeDataUri('站点PV', '1284306', 'flat')} style={{ height: 20 }} />
                            </div>
                            <div style={{ marginTop: 34, fontSize: 22, color: '#8b949e' }}>A delightful library for ...</div>
                            {[0.9, 0.7, 0.8].map((w, i) => (
                                <div key={i} style={{ height: 14, width: `${w * 100}%`, borderRadius: 7, background: '#21262d', marginTop: 18 }} />
                            ))}
                        </div>
                    </div>
                </Window>
            </div >

            <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34 }}>
                {SHOWCASE.map((b, i) => {
                    const p = progress(frame, BADGE_AT + 26 + i * 5, 14);
                    return (
                        <div key={b.style + b.label} style={{ opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
                            <Img
                                src={badgeDataUri(b.label, b.value, b.style, 'color' in b ? b.color : undefined)}
                                style={{ height: b.style === 'for-the-badge' ? 56 : b.style === 'plastic' ? 36 : 40 }}
                            />
                        </div>
                    );
                })}
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: 40,
                    width: '100%',
                    textAlign: 'center',
                    fontSize: 22,
                    color: colors.textMuted,
                    opacity: progress(frame, BADGE_AT + 50, 14),
                }}
            >
                4 种 Shields 风格 · 16 个指标 · 中英文自适应宽度
            </div>
        </AbsoluteFill >
    );
};
