import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { AbsoluteFill } from 'remotion';
import { Background } from './components/Background';
import { easeInOut } from './lib/anim';
import { AiInstall } from './scenes/AiInstall';
import { AiSources } from './scenes/AiSources';
import { Badge } from './scenes/Badge';
import { Dashboard } from './scenes/Dashboard';
import { DevTools } from './scenes/DevTools';
import { Frameworks } from './scenes/Frameworks';
import { Hook } from './scenes/Hook';
import { INSTALL_DURATION, Install } from './scenes/Install';
import { Outro } from './scenes/Outro';
import { TenBytes } from './scenes/TenBytes';

// 分镜表：调整节奏只需要改这里的帧数，总时长会自动重新计算
export const SCENES = [
    { id: 'hook', component: Hook, frames: 150 },
    { id: 'ten-bytes', component: TenBytes, frames: 300 },
    { id: 'devtools', component: DevTools, frames: 210 },
    { id: 'install', component: Install, frames: INSTALL_DURATION },
    { id: 'frameworks', component: Frameworks, frames: 150 },
    { id: 'ai-sources', component: AiSources, frames: 200 },
    { id: 'dashboard', component: Dashboard, frames: 190 },
    { id: 'badge', component: Badge, frames: 200 },
    { id: 'ai-install', component: AiInstall, frames: 210 },
    { id: 'outro', component: Outro, frames: 150 },
] as const;

const TRANSITION = 16;

// 转场交替使用淡入与滑动，避免单调
function presentationFor(index: number) {
    return index % 3 === 1 ? slide({ direction: 'from-right' }) : fade();
}

export const PROMO_DURATION =
    SCENES.reduce((sum, s) => sum + s.frames, 0) - TRANSITION * (SCENES.length - 1);

export const Promo: React.FC = () => (
    <AbsoluteFill>
        <Background />
        <TransitionSeries>
            {SCENES.flatMap((scene, i) => {
                const Scene = scene.component;
                const items = [
                    <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.frames} name={scene.id}>
                        <Scene />
                    </TransitionSeries.Sequence>,
                ];
                if (i < SCENES.length - 1) {
                    items.push(
                        <TransitionSeries.Transition
                            key={`${scene.id}-transition`}
                            presentation={presentationFor(i)}
                            timing={linearTiming({ durationInFrames: TRANSITION, easing: easeInOut })}
                        />,
                    );
                }
                return items;
            })}
        </TransitionSeries>
    </AbsoluteFill>
);

/** 封面：直接取片尾画面的静止状态 */
export const Poster: React.FC = () => (
    <AbsoluteFill>
        <Background />
        <Outro still />
    </AbsoluteFill>
);
