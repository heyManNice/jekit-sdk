import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colors } from '../theme';

// 贯穿全片的背景：网格 + 缓慢漂移的两团辉光 + 暗角。
// 放在转场序列之外，切换场景时背景保持连续，不会跟着闪。
export const Background: React.FC = () => {
    const frame = useCurrentFrame();
    const t = frame / 30;

    const glowA = {
        x: -260 + Math.sin(t * 0.35) * 80,
        y: -520 + Math.cos(t * 0.27) * 50,
    };
    const glowB = {
        x: 1180 + Math.cos(t * 0.3) * 90,
        y: 420 + Math.sin(t * 0.22) * 70,
    };

    const mask = 'radial-gradient(ellipse 75% 65% at 50% 45%, #000 15%, transparent 78%)';

    return (
        <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: 'hidden' }}>
            <AbsoluteFill
                style={{
                    backgroundImage: [
                        `linear-gradient(${colors.gridBorder}66 1px, transparent 1px)`,
                        `linear-gradient(90deg, ${colors.gridBorder}66 1px, transparent 1px)`,
                    ].join(','),
                    backgroundSize: '72px 72px',
                    backgroundPosition: `0px ${(frame * 0.4) % 72}px`,
                    maskImage: mask,
                    WebkitMaskImage: mask,
                    opacity: 0.55,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    left: glowA.x,
                    top: glowA.y,
                    width: 1300,
                    height: 1300,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${colors.primary}26 0%, transparent 62%)`,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    left: glowB.x,
                    top: glowB.y,
                    width: 1100,
                    height: 1100,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${colors.purple}1c 0%, transparent 60%)`,
                }}
            />
            <AbsoluteFill
                style={{
                    background: 'radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
                }}
            />
        </AbsoluteFill>
    );
};
