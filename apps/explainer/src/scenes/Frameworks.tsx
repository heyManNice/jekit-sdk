import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CodeView } from '../components/CodeView';
import { Accent, SceneTitle } from '../components/Text';
import { Card } from '../components/Window';
import { progress } from '../lib/anim';
import { colors, fonts } from '../theme';
import reactLogo from '../../../docs/src/images/react.svg';
import vueLogo from '../../../docs/src/images/vue.svg';

// 镜头 5：同一套能力，覆盖主流技术栈

const ITEMS = [
    {
        name: 'React',
        logo: reactLogo,
        pkg: 'jekit-react',
        code: `const jekit =\n  useJekit()`,
    },
    {
        name: 'Vue',
        logo: vueLogo,
        pkg: 'jekit-vue',
        code: `const jekit =\n  useJekit()`,
    },
    {
        name: 'CDN',
        glyph: '</>',
        pkg: 'cdn.jekit.cn',
        code: `<span class=\n  "jk-site-pv">`,
    },
    {
        name: 'Halo',
        glyph: 'H',
        pkg: 'plugin-jekit-halo',
        code: `// 上传 JAR\n// 启用即可`,
    },
    {
        name: 'Core API',
        glyph: '{ }',
        pkg: 'jekit-core',
        code: `await stats()\nawait history()`,
    },
];

export const Frameworks: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill style={{ fontFamily: fonts.sans, alignItems: 'center' }}>
            <SceneTitle
                style={{ marginTop: 110 }}
                kicker="生态完整"
                size={64}
                title={
                    <>
                        你用什么写网站，<Accent>就用什么接入</Accent>
                    </>
                }
                subtitle="自动适配 SPA 路由 · 站点级与页面级指标 · 无需注册与 API Key"
            />

            <div style={{ position: 'absolute', top: 450, display: 'flex', gap: 28 }}>
                {ITEMS.map((item, i) => {
                    const p = spring({ frame: frame - 18 - i * 6, fps, config: { damping: 15, mass: 0.7 } });
                    const glow = progress(frame, 70 + i * 8, 12) * (1 - progress(frame, 86 + i * 8, 20));
                    return (
                        <div
                            key={item.name}
                            style={{
                                opacity: p,
                                transform: `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * (i - 2) * 3}deg)`,
                            }}
                        >
                            <Card
                                glow={glow > 0.05}
                                style={{
                                    width: 310,
                                    height: 400,
                                    padding: 32,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 18,
                                }}
                            >
                                <div
                                    style={{
                                        width: 84,
                                        height: 84,
                                        borderRadius: 20,
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: colors.bg,
                                        border: `1px solid ${colors.controlBorder}`,
                                    }}
                                >
                                    {item.logo ? (
                                        <Img src={item.logo} style={{ width: 52, height: 52 }} />
                                    ) : (
                                        <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 30, color: colors.primary }}>
                                            {item.glyph}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 36, fontWeight: 800, color: colors.textHeading }}>{item.name}</div>
                                <div style={{ fontFamily: fonts.mono, fontSize: 20, color: colors.textLabel }}>{item.pkg}</div>
                                <div
                                    style={{
                                        marginTop: 'auto',
                                        padding: '12px 14px',
                                        borderRadius: 10,
                                        background: colors.bg,
                                        border: `1px solid ${colors.controlBorder}`,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <CodeView code={item.code} fontSize={19} lineHeight={1.5} />
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};
