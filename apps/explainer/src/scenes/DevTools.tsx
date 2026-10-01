import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Accent, SceneTitle } from '../components/Text';
import { Window } from '../components/Window';
import { clamp, progress, useSpring } from '../lib/anim';
import { PAYLOAD_SIZE, hex, sampleBytes } from '../lib/jekit';
import { colors, fonts, syntax } from '../theme';

// 镜头 3：不用相信宣传，打开 DevTools 自己核对

const TABS = [
    { at: 0, label: 'Network · Payload' },
    { at: 70, label: 'Network · Headers' },
    { at: 130, label: 'Application · Cookies' },
];

export const DevTools: React.FC = () => {
    const frame = useCurrentFrame();
    const win = useSpring(8);
    const tab = TABS.findLastIndex((t) => frame >= t.at + 20);

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans, flexDirection: 'row', alignItems: 'center', padding: '0 120px', gap: 90 }}>
            <div style={{ width: 560 }}>
                <SceneTitle
                    align="left"
                    kicker="眼见为实"
                    size={68}
                    title={
                        <>
                            打开 DevTools
                            <br />
                            <Accent>自己核对</Accent>
                        </>
                    }
                    subtitle={
                        <>
                            不是"承诺不滥用"，
                            <br />
                            而是协议里根本装不下。
                        </>
                    }
                />
                <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {[
                        `请求体 ${PAYLOAD_SIZE} 字节二进制`,
                        'referrerPolicy: no-referrer',
                        'Cookies 面板：空',
                    ].map((t, i) => {
                        const on = progress(frame, TABS[i].at + 30, 14);
                        return (
                            <div
                                key={t}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    fontSize: 28,
                                    color: on > 0.5 ? colors.textHeading : colors.textMuted,
                                    opacity: 0.4 + on * 0.6,
                                }}
                            >
                                <span
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 8,
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 20,
                                        color: colors.bg,
                                        background: on > 0.5 ? colors.positive : colors.strongBorder,
                                        transform: `scale(${0.8 + on * 0.2})`,
                                    }}
                                >
                                    ✓
                                </span>
                                <span style={{ fontFamily: fonts.mono }}>{t}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div
                style={{
                    opacity: win,
                    transform: `perspective(2000px) rotateY(${(1 - win) * -12}deg) translateX(${(1 - win) * 80}px)`,
                }}
            >
                <Window width={1050} height={720} variant="plain" title="DevTools — jekit.cn">
                    <div style={{ display: 'flex', borderBottom: `1px solid ${colors.controlBorder}`, background: colors.surfaceSubtle }}>
                        {TABS.map((t, i) => (
                            <div
                                key={t.label}
                                style={{
                                    padding: '14px 26px',
                                    fontSize: 20,
                                    color: i === tab ? colors.primary : colors.textMuted,
                                    borderBottom: `2px solid ${i === tab ? colors.primary : 'transparent'}`,
                                }}
                            >
                                {t.label}
                            </div>
                        ))}
                    </div>
                    <div style={{ position: 'relative', height: 600 }}>
                        <Panel show={tab === 0} frame={frame} at={TABS[0].at}>
                            <PayloadPanel frame={frame} />
                        </Panel>
                        <Panel show={tab === 1} frame={frame} at={TABS[1].at}>
                            <HeadersPanel frame={frame - TABS[1].at} />
                        </Panel>
                        <Panel show={tab === 2} frame={frame} at={TABS[2].at}>
                            <CookiesPanel frame={frame - TABS[2].at} />
                        </Panel>
                    </div>
                </Window>
            </div>
        </AbsoluteFill>
    );
};

const Panel: React.FC<{ show: boolean; frame: number; at: number; children: ReactNode }> = ({ show, frame, at, children }) => {
    const p = interpolate(frame, [at + 20, at + 32], [0, 1], clamp);
    if (!show) return null;
    return (
        <div style={{ position: 'absolute', inset: 0, padding: 36, opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
            {children}
        </div>
    );
};

const Row: React.FC<{ k: string; v: ReactNode; vColor?: string; strike?: boolean }> = ({ k, v, vColor, strike }) => (
    <div style={{ display: 'flex', gap: 24, fontFamily: fonts.mono, fontSize: 24, lineHeight: 2 }}>
        <span style={{ color: colors.textLabel, minWidth: 260 }}>{k}</span>
        <span style={{ color: vColor ?? colors.text, textDecoration: strike ? 'line-through' : undefined }}>{v}</span>
    </div>
);

const PayloadPanel: React.FC<{ frame: number }> = ({ frame }) => {
    const scan = progress(frame, 34, 28);
    return (
        <div>
            <Row k="Request URL" v="https://api.jekit.cn/greet" vColor={syntax.string} />
            <Row k="Request Method" v="POST" />
            <Row k="Content-Length" v={`${PAYLOAD_SIZE}`} vColor={colors.primary} />
            <div style={{ marginTop: 28, fontSize: 20, color: colors.textMuted, fontFamily: fonts.mono }}>Request Payload · view source</div>
            <div
                style={{
                    marginTop: 14,
                    padding: '22px 26px',
                    borderRadius: 10,
                    background: colors.bg,
                    border: `1px solid ${colors.controlBorder}`,
                    fontFamily: fonts.mono,
                    fontSize: 34,
                    letterSpacing: '0.08em',
                    color: colors.primary,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {sampleBytes.map(hex).join(' ')}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${scan * 100}%`,
                        width: 90,
                        transform: 'translateX(-100%)',
                        background: `linear-gradient(90deg, transparent, ${colors.primary}40, transparent)`,
                        opacity: scan < 1 ? 1 : 0,
                    }}
                />
            </div>
        </div>
    );
};

const HeadersPanel: React.FC<{ frame: number }> = ({ frame }) => {
    const absent = progress(frame, 34, 14);
    return (
        <div>
            <div style={{ fontSize: 20, color: colors.textMuted, fontFamily: fonts.mono, marginBottom: 12 }}>Request Headers</div>
            <Row k="Origin" v="https://jekit.cn" vColor={syntax.string} />
            <Row k="Content-Length" v={`${PAYLOAD_SIZE}`} vColor={colors.primary} />
            <div style={{ opacity: absent }}>
                <Row k="Referer" v="（未发送）" vColor={colors.positive} />
                <Row k="Cookie" v="（未发送）" vColor={colors.positive} />
            </div>
            <div
                style={{
                    marginTop: 34,
                    padding: '18px 24px',
                    borderRadius: 10,
                    background: `${colors.positive}10`,
                    border: `1px solid ${colors.positive}44`,
                    fontFamily: fonts.mono,
                    fontSize: 22,
                    color: colors.textSecondary,
                    opacity: absent,
                }}
            >
                <span style={{ color: syntax.keyword }}>fetch</span>(url, {'{'} body: buffer,{' '}
                <span style={{ color: colors.positive }}>referrerPolicy: "no-referrer"</span> {'}'})
            </div>
        </div>
    );
};

const CookiesPanel: React.FC<{ frame: number }> = ({ frame }) => {
    const empty = progress(frame, 30, 14);
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 20, color: colors.textMuted, fontFamily: fonts.mono, paddingBottom: 12, borderBottom: `1px solid ${colors.controlBorder}` }}>
                <span>Name</span>
                <span>Value</span>
                <span>Domain</span>
            </div>
            <div
                style={{
                    height: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 18,
                    opacity: empty,
                    transform: `scale(${0.94 + empty * 0.06})`,
                }}
            >
                <div style={{ fontSize: 120, fontWeight: 900, fontFamily: fonts.mono, color: colors.strongBorder }}>∅</div>
                <div style={{ fontSize: 30, color: colors.textSubtle }}>没有任何 Cookie</div>
                <div style={{ fontSize: 22, color: colors.textMuted, fontFamily: fonts.mono }}>
                    整个 core 中没有一处 document.cookie
                </div>
            </div>
        </div>
    );
};
