import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Accent, Kicker, Reveal } from '../components/Text';
import { clamp, countUp, progress } from '../lib/anim';
import {
    PAYLOAD_SIZE,
    SAMPLE_PATH,
    SAMPLE_PLT_MS,
    SAMPLE_REFERRER,
    SAMPLE_TTFB_MS,
    hex,
    hex32,
    payloadFields,
    sampleBytes,
    samplePathHash,
    samplePayload,
} from '../lib/jekit';
import { colors, fonts } from '../theme';

// 镜头 2：原始信息在浏览器内被"降维"成 7 个整数，最终编码为 10 个字节。
// 所有数值都来自 packages/core 的真实编码结果。

type FieldKey = (typeof payloadFields)[number]['key'];

const FIELD_META: Record<FieldKey, { raw: string; label: string; value: string; color: string }> = {
    visitorStatus: {
        raw: 'localStorage 布隆过滤器',
        label: '访客状态',
        value: `${samplePayload.visitorStatus}`,
        color: colors.primary,
    },
    whereWasIFrom: {
        raw: SAMPLE_REFERRER,
        label: '来源渠道',
        value: `${samplePayload.whereWasIFrom} · ChatGPT`,
        color: colors.purple,
    },
    theHashOfPath: {
        raw: SAMPLE_PATH,
        label: '页面哈希',
        value: hex32(samplePathHash),
        color: colors.ttfbEnd,
    },
    whichBrowser: {
        raw: 'Mozilla/5.0 … Chrome/140.0 …',
        label: '浏览器',
        value: `${samplePayload.whichBrowser} · Chrome`,
        color: colors.positive,
    },
    whichOS: {
        raw: 'Windows NT 10.0; Win64; x64',
        label: '操作系统',
        value: `${samplePayload.whichOS} · Windows`,
        color: colors.accent,
    },
    ttfb: {
        raw: `TTFB ${SAMPLE_TTFB_MS} ms`,
        label: 'TTFB',
        value: `${samplePayload.ttfb} × 10ms`,
        color: colors.ttfbStart,
    },
    plt: {
        raw: `PLT ${SAMPLE_PLT_MS} ms`,
        label: 'PLT',
        value: `${samplePayload.plt} × 10ms`,
        color: colors.pltStart,
    },
};

// 把字节下标映射回所属字段，用于给字节块上色
const byteOwner: FieldKey[] = payloadFields.flatMap((f) => Array.from({ length: f.bytes }, () => f.key));

const ROW_START = 26;
const ROW_GAP = 7;
const CONVERT_AT = 80;
const BYTES_AT = 150;
const BIG_AT = 214;

export const TenBytes: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const tableOut = progress(frame, BIG_AT - 8, 20);
    const big = spring({ frame: frame - BIG_AT, fps, config: { damping: 16, mass: 0.7 } });

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans, alignItems: 'center' }}>
            <Reveal delay={0} style={{ marginTop: 80, opacity: 1 - tableOut }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                    <Kicker>隐私写进协议</Kicker>
                    <div style={{ fontSize: 60, fontWeight: 800, color: colors.textHeading }}>
                        原始数据，<Accent>不出浏览器</Accent>
                    </div>
                </div>
            </Reveal>

            <div
                style={{
                    position: 'absolute',
                    top: 300,
                    width: 1500,
                    opacity: 1 - tableOut,
                    transform: `translateY(${-tableOut * 40}px) scale(${1 - tableOut * 0.04})`,
                    filter: `blur(${tableOut * 8}px)`,
                }}
            >
                {payloadFields.map((field, i) => {
                    const meta = FIELD_META[field.key];
                    const rowIn = spring({ frame: frame - ROW_START - i * ROW_GAP, fps, config: { damping: 200 } });
                    const convert = progress(frame, CONVERT_AT + i * 5, 18);
                    const arrow = progress(frame, CONVERT_AT - 8 + i * 5, 14);

                    return (
                        <div
                            key={field.key}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '560px 120px 1fr 140px',
                                alignItems: 'center',
                                height: 62,
                                opacity: rowIn,
                                transform: `translateX(${(1 - rowIn) * -40}px)`,
                                borderBottom: `1px solid ${colors.controlBorder}`,
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: fonts.mono,
                                    fontSize: 24,
                                    color: colors.textSubtle,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    opacity: 1 - convert * 0.55,
                                }}
                            >
                                <span style={{ textDecoration: convert > 0.5 ? 'line-through' : 'none', textDecorationColor: colors.negative }}>
                                    {meta.raw}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div
                                    style={{
                                        height: 2,
                                        width: 70 * arrow,
                                        background: `linear-gradient(90deg, transparent, ${meta.color})`,
                                        position: 'relative',
                                    }}
                                >
                                    <span
                                        style={{
                                            position: 'absolute',
                                            right: -6,
                                            top: -9,
                                            color: meta.color,
                                            fontSize: 18,
                                            opacity: arrow,
                                        }}
                                    >
                                        ▶
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 18,
                                    opacity: convert,
                                    transform: `translateX(${(1 - convert) * -20}px)`,
                                }}
                            >
                                <span style={{ fontSize: 24, color: colors.textLabel, width: 110 }}>{meta.label}</span>
                                <span style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: meta.color }}>
                                    {meta.value}
                                </span>
                            </div>
                            <div
                                style={{
                                    justifySelf: 'end',
                                    fontFamily: fonts.mono,
                                    fontSize: 22,
                                    color: meta.color,
                                    padding: '4px 12px',
                                    borderRadius: 6,
                                    border: `1px solid ${meta.color}55`,
                                    background: `${meta.color}12`,
                                    opacity: convert,
                                }}
                            >
                                {field.type} · {field.bytes}B
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 字节条：先在表格下方排开，随后放大居中 */}
            <ByteStrip frame={frame} big={big} />

            <div
                style={{
                    position: 'absolute',
                    top: 250,
                    width: '100%',
                    textAlign: 'center',
                    opacity: big,
                    transform: `translateY(${(1 - big) * 30}px)`,
                }}
            >
                <div style={{ fontSize: 34, color: colors.textSubtle, marginBottom: 6 }}>一次页面访问，上传的全部内容</div>
                <div style={{ fontSize: 190, fontWeight: 900, lineHeight: 1.05, color: colors.textHeading }}>
                    <Accent>{countUp(frame, BIG_AT, 26, PAYLOAD_SIZE)}</Accent>
                    <span style={{ fontSize: 96, marginLeft: 18 }}>字节</span>
                </div>
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: 110,
                    display: 'flex',
                    gap: 22,
                    opacity: progress(frame, BIG_AT + 30, 16),
                }}
            >
                {['无 URL', '无 Cookie', '无 IP 字段', '无访客 ID', '协议里没有 string 类型'].map((t, i) => (
                    <Reveal key={t} delay={BIG_AT + 30 + i * 4} distance={16}>
                        <div
                            style={{
                                padding: '10px 22px',
                                borderRadius: 999,
                                border: `1px solid ${colors.positive}55`,
                                background: `${colors.positive}10`,
                                color: colors.positive,
                                fontSize: 26,
                                fontWeight: 600,
                            }}
                        >
                            ✓ {t}
                        </div>
                    </Reveal>
                ))}
            </div>
        </AbsoluteFill>
    );
};

const ByteStrip: React.FC<{ frame: number; big: number }> = ({ frame, big }) => {
    const size = interpolate(big, [0, 1], [76, 112], clamp);
    const gap = interpolate(big, [0, 1], [10, 16], clamp);
    const top = interpolate(big, [0, 1], [800, 590], clamp);

    return (
        <div
            style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap,
            }}
        >
            {sampleBytes.map((byte, i) => {
                const owner = byteOwner[i];
                const color = FIELD_META[owner].color;
                const appear = progress(frame, BYTES_AT + i * 3, 12);
                const pulse = big > 0.5 ? 1 + Math.sin((frame - i * 4) / 9) * 0.015 : 1;

                return (
                    <div
                        key={i}
                        style={{
                            width: size,
                            height: size,
                            borderRadius: size * 0.16,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: fonts.mono,
                            fontSize: size * 0.4,
                            fontWeight: 700,
                            color,
                            border: `2px solid ${color}aa`,
                            background: `linear-gradient(180deg, ${color}26, ${color}0a)`,
                            boxShadow: `0 0 ${24 * appear}px ${color}40`,
                            opacity: appear,
                            transform: `translateY(${(1 - appear) * 30}px) scale(${(0.7 + appear * 0.3) * pulse})`,
                        }}
                    >
                        {hex(byte)}
                        <span style={{ fontSize: size * 0.15, color: colors.textMuted, fontWeight: 500 }}>{i}</span>
                    </div>
                );
            })}
        </div>
    );
};
