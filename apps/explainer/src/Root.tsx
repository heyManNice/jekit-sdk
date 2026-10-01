import { AbsoluteFill, Composition, Folder } from 'remotion';
import { Background } from './components/Background';
import { Poster, PROMO_DURATION, Promo, SCENES } from './Promo';
import { VIDEO } from './theme';

export const RemotionRoot: React.FC = () => (
    <>
        <Composition id="JekitPromo" component={Promo} durationInFrames={PROMO_DURATION} {...VIDEO} />
        <Composition id="JekitPoster" component={Poster} durationInFrames={1} {...VIDEO} />

        {/* 单独预览每个分镜，方便在 Studio 里逐个打磨 */}
        <Folder name="Scenes">
            {SCENES.map((scene) => {
                const Scene = scene.component;
                const Wrapped: React.FC = () => (
                    <AbsoluteFill>
                        <Background />
                        <Scene />
                    </AbsoluteFill>
                );
                return <Composition key={scene.id} id={`Scene-${scene.id}`} component={Wrapped} durationInFrames={scene.frames} {...VIDEO} />;
            })}
        </Folder>
    </>
);
