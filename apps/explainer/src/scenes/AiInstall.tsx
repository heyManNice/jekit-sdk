import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Accent, Kicker, Reveal } from '../components/Text';
import { Window } from '../components/Window';
import { cursorVisible, progress, typed, typedEnd } from '../lib/anim';
import { colors, fonts } from '../theme';

// 镜头 9：让 AI 编程助手代劳 —— 依据 apps/docs/public/llms.txt 的接入规则

const PROMPT = '帮我给这个网站接入 Jekit 访问统计';
const PROMPT_AT = 16;
const PROMPT_SPEED = 0.7;
const SENT_AT = typedEnd(PROMPT, PROMPT_AT, PROMPT_SPEED) + 8;

const STEPS = [
    { text: '读取 jekit.cn/llms.txt 接入规则', mono: false },
    { text: '识别项目：React + Vite', mono: false },
    { text: 'npm install jekit-react', mono: true },
    { text: '在全站页脚加入 sitePv · sitePvToday', mono: false },
    { text: 'npm run typecheck && npm run build ✓', mono: true },
];
const STEP_GAP = 13;

export const AiInstall: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const win = spring({ frame: frame - 4, fps, config: { damping: 200 } });
    const done = progress(frame, SENT_AT + 20 + STEPS.length * STEP_GAP, 14);

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans, flexDirection: 'row', alignItems: 'center', padding: '0 120px', gap: 90 }}>
            <div style={{ width: 600 }}>
                <Reveal>
                    <Kicker>AI 友好</Kicker>
                </Reveal>
                <Reveal delay={4} style={{ marginTop: 22 }}>
                    <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.2, color: colors.textHeading }}>
                        一句话，
                        <br />
                        <Accent>让 AI 帮你装好</Accent>
                    </div>
                </Reveal>
                <Reveal delay={10} style={{ marginTop: 26 }}>
                    <div style={{ fontSize: 28, lineHeight: 1.7, color: colors.textSubtle }}>
                        官方提供 <span style={{ fontFamily: fonts.mono, color: colors.primary }}>llms.txt</span>，
                        <br />
                        Copilot、Cursor、Claude Code 等
                        <br />
                        读完就能按官方方案接入。
                    </div>
                </Reveal>
            </div>

            <div style={{ opacity: win, transform: `translateY(${(1 - win) * 50}px)` }}>
                <Window width={1000} height={720} variant="plain" title="AI 编程助手">
                    <div style={{ padding: 34, display: 'flex', flexDirection: 'column', gap: 26, height: '100%', boxSizing: 'border-box' }}>
                        {/* 用户消息 */}
                        <div style={{ alignSelf: 'flex-end', maxWidth: 720 }}>
                            <div
                                style={{
                                    padding: '18px 24px',
                                    borderRadius: 16,
                                    borderBottomRightRadius: 4,
                                    background: frame >= SENT_AT ? colors.surfaceActive : colors.surfaceFloating,
                                    border: `1px solid ${frame >= SENT_AT ? `${colors.primary}55` : colors.controlBorder}`,
                                    fontSize: 28,
                                    color: colors.textHeading,
                                    minHeight: 40,
                                }}
                            >
                                {typed(PROMPT, frame, PROMPT_AT, PROMPT_SPEED)}
                                {frame < SENT_AT ? (
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 3,
                                            height: 30,
                                            marginLeft: 3,
                                            verticalAlign: 'text-bottom',
                                            background: colors.primary,
                                            opacity: cursorVisible(frame) ? 1 : 0,
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>

                        {/* 助手执行步骤 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {STEPS.map((step, i) => {
                                const start = SENT_AT + 12 + i * STEP_GAP;
                                const p = progress(frame, start, 10);
                                const finished = frame > start + STEP_GAP - 2;
                                const spin = (frame * 12) % 360;
                                return (
                                    <div
                                        key={step.text}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 18,
                                            opacity: p,
                                            transform: `translateX(${(1 - p) * -20}px)`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                display: 'grid',
                                                placeItems: 'center',
                                                fontSize: 18,
                                                color: colors.bg,
                                                background: finished ? colors.positive : 'transparent',
                                                border: finished ? 'none' : `3px solid ${colors.primary}`,
                                                borderTopColor: finished ? undefined : 'transparent',
                                                transform: finished ? undefined : `rotate(${spin}deg)`,
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            {finished ? '✓' : ''}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: step.mono ? 24 : 26,
                                                fontFamily: step.mono ? fonts.mono : fonts.sans,
                                                color: step.mono ? colors.accent : colors.textSecondary,
                                                padding: step.mono ? '6px 14px' : 0,
                                                borderRadius: 8,
                                                background: step.mono ? colors.bg : 'transparent',
                                            }}
                                        >
                                            {step.text}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div
                            style={{
                                marginTop: 'auto',
                                padding: '20px 24px',
                                borderRadius: 14,
                                border: `1px solid ${colors.positive}55`,
                                background: `${colors.positive}10`,
                                fontSize: 24,
                                lineHeight: 1.6,
                                color: colors.textSecondary,
                                opacity: done,
                                transform: `translateY(${(1 - done) * 16}px)`,
                            }}
                        >
                            <span style={{ color: colors.positive, fontWeight: 700 }}>已完成接入。</span>
                            无需注册账号或 API Key；本地显示 <span style={{ fontFamily: fonts.mono }}>Err</span> 属正常，部署到公开域名后即可看到数据。
                        </div>
                    </div>
                </Window>
            </div>
        </AbsoluteFill>
    );
};
