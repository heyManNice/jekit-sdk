import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CodeView } from '../components/CodeView';
import { Accent, Kicker, Reveal } from '../components/Text';
import { Window } from '../components/Window';
import { clamp, countUp, cursorVisible, formatNumber, progress, typed, typedEnd } from '../lib/anim';
import { totalChars } from '../lib/highlight';
import { colors, fonts, syntax } from '../theme';

// 镜头 4：一条命令 + 几行代码，页脚出现访问量。
// 代码与 llms.txt / packages/react README 中的官方写法保持一致。

const COMMAND = 'npm install jekit-react';

const CODE = `import { useJekit } from 'jekit-react'

export function Footer() {
  const { sitePv, sitePvToday } = useJekit('—')

  return (
    <footer>
      本站总访问量 {sitePv} 次 · 今日 {sitePvToday} 次
    </footer>
  )
}`;

const CMD_AT = 18;
const CMD_SPEED = 0.9;
const CMD_DONE = typedEnd(COMMAND, CMD_AT, CMD_SPEED);
const INSTALLED_AT = CMD_DONE + 14;
const CODE_AT = INSTALLED_AT + 10;
const CODE_SPEED = 4.2;
const CODE_DONE = CODE_AT + Math.ceil(totalChars(CODE) / CODE_SPEED);
const RESULT_AT = CODE_DONE + 8;

const SITE_PV = 1_284_306;
const TODAY_PV = 3_917;

export const Install: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const editor = spring({ frame: frame - 4, fps, config: { damping: 200 } });
    const browser = spring({ frame: frame - (INSTALLED_AT - 6), fps, config: { damping: 200 } });
    const loaded = progress(frame, RESULT_AT, 10);
    const command = typed(COMMAND, frame, CMD_AT, CMD_SPEED);

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans }}>
            <div style={{ position: 'absolute', top: 72, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Reveal>
                    <Kicker>零门槛接入</Kicker>
                </Reveal>
                <Reveal delay={4}>
                    <div style={{ fontSize: 60, fontWeight: 800, color: colors.textHeading }}>
                        一条命令，<Accent>几行代码</Accent>
                    </div>
                </Reveal>
            </div>

            <div style={{ position: 'absolute', top: 270, left: 120, right: 120, display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                {/* 左：终端 + 编辑器 */}
                <div style={{ opacity: editor, transform: `translateY(${(1 - editor) * 50}px)` }}>
                    <Window width={900} height={700} variant="editor" tabs={['Footer.tsx']}>
                        <div
                            style={{
                                padding: '16px 28px',
                                borderBottom: `1px solid ${colors.controlBorder}`,
                                background: colors.bg,
                                fontFamily: fonts.mono,
                                fontSize: 24,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                height: 74,
                            }}
                        >
                            <span style={{ color: colors.positive }}>❯</span>
                            <span style={{ whiteSpace: 'pre' }}>
                                <span style={{ color: syntax.identifier }}>{command.slice(0, 3)}</span>
                                <span style={{ color: colors.text }}>{command.slice(3)}</span>
                            </span>
                            {frame < INSTALLED_AT ? (
                                <span style={{ width: 12, height: 26, background: colors.primary, opacity: cursorVisible(frame) ? 1 : 0 }} />
                            ) : (
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        color: colors.positive,
                                        fontSize: 20,
                                        opacity: progress(frame, INSTALLED_AT, 8),
                                    }}
                                >
                                    ✓ installed
                                </span>
                            )}
                        </div>
                        <div style={{ padding: '26px 28px' }}>
                            <CodeView
                                code={CODE}
                                chars={frame < CODE_AT ? 0 : (frame - CODE_AT) * CODE_SPEED}
                                fontSize={25}
                                lineNumbers
                                cursor={frame >= CODE_AT}
                                focusLines={frame > RESULT_AT ? [0, 3, 7] : undefined}
                            />
                        </div>
                    </Window>
                </div>

                {/* 右：浏览器预览 */}
                <div style={{ opacity: browser, transform: `translateY(${(1 - browser) * 50}px)` }}>
                    <Window width={732} height={700} variant="browser" url="https://your-blog.com">
                        <MockSite frame={frame} loaded={loaded} />
                    </Window>
                </div>
            </div>
        </AbsoluteFill>
    );
};

const MockSite: React.FC<{ frame: number; loaded: number }> = ({ frame, loaded }) => {
    const pv = countUp(frame, RESULT_AT, 34, SITE_PV, Math.round(SITE_PV * 0.6));
    const today = countUp(frame, RESULT_AT, 34, TODAY_PV, 0);
    const highlight = interpolate(frame, [RESULT_AT, RESULT_AT + 10, RESULT_AT + 60], [0, 1, 0.35], clamp);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0b1220' }}>
            <div style={{ padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0' }}>My Blog</div>
                <div style={{ display: 'flex', gap: 22, fontSize: 18, color: '#64748b' }}>
                    <span>文章</span>
                    <span>归档</span>
                    <span>关于</span>
                </div>
            </div>
            <div style={{ padding: '10px 36px', flex: 1 }}>
                <div style={{ height: 180, borderRadius: 14, background: 'linear-gradient(135deg, #1e293b, #0f172a)', marginBottom: 26 }} />
                {[0.92, 0.75, 0.84, 0.6].map((w, i) => (
                    <div key={i} style={{ height: 16, width: `${w * 100}%`, borderRadius: 8, background: '#1e293b', marginBottom: 16 }} />
                ))}
            </div>
            <div
                style={{
                    margin: 20,
                    padding: '22px 26px',
                    borderRadius: 12,
                    textAlign: 'center',
                    fontSize: 22,
                    color: '#cbd5e1',
                    border: `1px solid ${colors.primary}${Math.round(highlight * 200).toString(16).padStart(2, '0')}`,
                    background: `${colors.primary}${Math.round(highlight * 30).toString(16).padStart(2, '0')}`,
                    boxShadow: `0 0 ${highlight * 40}px ${colors.primary}33`,
                }}
            >
                本站总访问量{' '}
                <b style={{ color: loaded > 0 ? colors.primary : '#64748b', fontFamily: fonts.mono }}>
                    {loaded > 0 ? formatNumber(pv) : '—'}
                </b>{' '}
                次 · 今日{' '}
                <b style={{ color: loaded > 0 ? colors.primary : '#64748b', fontFamily: fonts.mono }}>
                    {loaded > 0 ? formatNumber(today) : '—'}
                </b>{' '}
                次
            </div>
        </div>
    );
};

export const INSTALL_DURATION = RESULT_AT + 70;
