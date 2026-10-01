import type { ReactNode } from 'react';
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Accent, Kicker, Reveal } from '../components/Text';
import { Card } from '../components/Window';
import { countUp, formatNumber, progress } from '../lib/anim';
import { icons } from '../lib/assets';
import { colors, fonts } from '../theme';

// 镜头 7：不只是计数器 —— 趋势、性能、来源、环境，全部公开可查
// 画面为示意数据，版式参照 apps/docs 的统计面板

// 确定性的伪随机，保证每次渲染曲线一致
function seeded(i: number): number {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const TREND = Array.from({ length: 30 }, (_, i) => 0.35 + i * 0.014 + seeded(i) * 0.22 + Math.sin(i / 3) * 0.06);

const SOURCES = [
    { name: 'Google', icon: icons.google, v: 0.34 },
    { name: '直接访问', icon: icons.direct, v: 0.24 },
    { name: 'ChatGPT', icon: icons.chatgpt, v: 0.16 },
    { name: 'Bing', icon: icons.bing, v: 0.11 },
    { name: 'DeepSeek', icon: icons.deepseek, v: 0.08 },
];

const BROWSERS = [
    { name: 'Chrome', icon: icons.chrome, v: 0.58 },
    { name: 'Edge', icon: icons.edge, v: 0.17 },
    { name: 'Safari', icon: icons.safari, v: 0.14 },
    { name: 'Firefox', icon: icons.firefox, v: 0.07 },
];

const SYSTEMS = [
    { name: 'Windows', icon: icons.windows, v: 0.46 },
    { name: 'Android', icon: icons.android, v: 0.21 },
    { name: 'iOS', icon: icons.ios, v: 0.16 },
    { name: 'macOS', icon: icons.macos, v: 0.11 },
];

export const Dashboard: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const panel = (i: number) => spring({ frame: frame - 14 - i * 6, fps, config: { damping: 200 } });

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans }}>
            <div style={{ position: 'absolute', top: 64, left: 120, right: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Reveal>
                        <Kicker>不只是计数器</Kicker>
                    </Reveal>
                    <Reveal delay={4}>
                        <div style={{ fontSize: 58, fontWeight: 800, color: colors.textHeading }}>
                            趋势 · 性能 · 来源 · 环境，<Accent>一屏看全</Accent>
                        </div>
                    </Reveal>
                </div>
                <Reveal delay={10}>
                    <div style={{ fontFamily: fonts.mono, fontSize: 24, color: colors.textLabel, padding: '10px 18px', borderRadius: 10, border: `1px solid ${colors.controlBorder}`, background: colors.surfaceSubtle }}>
                        jekit.cn/stats/?query=<span style={{ color: colors.primary }}>your-site.com</span>
                    </div>
                </Reveal>
            </div>

            <div
                style={{
                    position: 'absolute',
                    top: 270,
                    left: 120,
                    right: 120,
                    bottom: 70,
                    display: 'grid',
                    gridTemplateColumns: '1.55fr 1fr 1fr',
                    gridTemplateRows: '160px 1fr',
                    gap: 24,
                }}
            >
                <Panel p={panel(0)} style={{ gridColumn: '1 / 4' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', height: '100%' }}>
                        {[
                            { label: '网站总访问量', v: 1_284_306 },
                            { label: '网站总访客数', v: 216_548 },
                            { label: '今日访问量', v: 3_917 },
                            { label: '今日访客数', v: 1_062 },
                            { label: '历史记录', text: '无限期' },
                        ].map((s, i) => (
                            <div
                                key={s.label}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: '0 30px',
                                    borderLeft: i === 0 ? 'none' : `1px solid ${colors.controlBorder}`,
                                }}
                            >
                                <div style={{ fontSize: 22, color: colors.textLabel }}>{s.label}</div>
                                <div style={{ fontSize: 50, fontWeight: 800, fontFamily: fonts.mono, color: colors.textHeading, marginTop: 6 }}>
                                    {s.v !== undefined ? formatNumber(countUp(frame, 24 + i * 4, 40, s.v)) : <Accent>{s.text}</Accent>}
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel p={panel(1)} title="近 30 日访问趋势">
                    <TrendChart draw={progress(frame, 36, 50)} />
                </Panel>

                <Panel p={panel(2)} title="来源渠道">
                    <BarList items={SOURCES} grow={progress(frame, 48, 34)} color={colors.purple} />
                </Panel>

                <Panel p={panel(3)} title="网站性能 · P75">
                    <Perf frame={frame} />
                    <div style={{ height: 1, background: colors.controlBorder, margin: '26px 0' }} />
                    <MiniDist title="浏览器" items={BROWSERS} grow={progress(frame, 70, 30)} />
                    <div style={{ height: 30 }} />
                    <MiniDist title="操作系统" items={SYSTEMS} grow={progress(frame, 78, 30)} />
                </Panel>
            </div>
        </AbsoluteFill>
    );
};

const Panel: React.FC<{ p: number; title?: string; children: ReactNode; style?: React.CSSProperties }> = ({ p, title, children, style }) => (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>
        <Card style={{ height: '100%', padding: title ? '24px 30px' : 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {title ? <div style={{ fontSize: 24, fontWeight: 700, color: colors.textHeading, marginBottom: 18 }}>{title}</div> : null}
            <div style={{ flex: 1, position: 'relative' }}>{children}</div>
        </Card>
    </div>
);

const TrendChart: React.FC<{ draw: number }> = ({ draw }) => {
    const W = 760;
    const H = 400;
    const points = TREND.map((v, i) => [(i / (TREND.length - 1)) * W, H - v * H * 0.9] as const);
    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;
    const head = points[Math.min(points.length - 1, Math.floor(draw * (points.length - 1)))];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
            <defs>
                <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={colors.primary} stopOpacity={0.35} />
                    <stop offset="1" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
                <clipPath id="trend-clip">
                    <rect x={0} y={-20} width={W * draw} height={H + 40} />
                </clipPath>
            </defs>
            {[0.25, 0.5, 0.75].map((r) => (
                <line key={r} x1={0} x2={W} y1={H * r} y2={H * r} stroke={colors.gridBorder} strokeDasharray="4 8" />
            ))}
            <g clipPath="url(#trend-clip)">
                <path d={area} fill="url(#trend-fill)" />
                <path d={line} fill="none" stroke={colors.primary} strokeWidth={4} strokeLinejoin="round" />
            </g>
            {draw > 0.02 ? (
                <circle cx={head[0]} cy={head[1]} r={9} fill={colors.bg} stroke={colors.primaryHighlight} strokeWidth={4} />
            ) : null}
        </svg>
    );
};

type DistItem = { name: string; icon: string; v: number };

const BarList: React.FC<{ items: DistItem[]; grow: number; color: string }> = ({ items, grow, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {items.map((item) => (
            <div key={item.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: colors.textSecondary, marginBottom: 8 }}>
                    <Img src={item.icon} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                    {item.name}
                    <span style={{ marginLeft: 'auto', fontFamily: fonts.mono, color: colors.textHeading }}>{Math.round(item.v * 100 * grow)}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: colors.controlBorder }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${(item.v / items[0].v) * 100 * grow}%`,
                            borderRadius: 5,
                            background: `linear-gradient(90deg, ${color}, ${colors.primary})`,
                        }}
                    />
                </div>
            </div>
        ))}
    </div>
);

const MiniDist: React.FC<{ title: string; items: DistItem[]; grow: number }> = ({ title, items, grow }) => {
    const palette = [colors.primary, colors.ttfbEnd, colors.purple, colors.positive];
    return (
        <div>
            <div style={{ fontSize: 20, color: colors.textLabel, marginBottom: 12 }}>{title}</div>
            <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: colors.controlBorder }}>
                {items.map((item, i) => (
                    <div key={item.name} style={{ width: `${item.v * 100 * grow}%`, background: palette[i] }} />
                ))}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
                {items.map((item, i) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 17, color: colors.textSubtle }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: palette[i] }} />
                        <Img src={item.icon} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                        <span style={{ fontFamily: fonts.mono }}>{Math.round(item.v * 100 * grow)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Perf: React.FC<{ frame: number }> = ({ frame }) => (
    <div style={{ display: 'flex', gap: 20 }}>
        {[
            { label: 'TTFB', ms: 120, from: colors.ttfbStart, to: colors.ttfbEnd, at: 56 },
            { label: 'PLT', ms: 480, from: colors.pltStart, to: colors.pltEnd, at: 62 },
        ].map((m) => (
            <div key={m.label} style={{ flex: 1 }}>
                <div style={{ fontSize: 20, color: colors.textLabel }}>{m.label}</div>
                <div
                    style={{
                        fontSize: 46,
                        fontWeight: 800,
                        fontFamily: fonts.mono,
                        background: `linear-gradient(90deg, ${m.from}, ${m.to})`,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}
                >
                    {countUp(frame, m.at, 30, m.ms)}
                    <span style={{ fontSize: 24 }}>ms</span>
                </div>
            </div>
        ))}
    </div>
);
