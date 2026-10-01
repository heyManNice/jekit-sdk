import {
    Easing,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    type SpringConfig,
} from 'remotion';

export const clamp = {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
} as const;

// 统一的"出场"缓动：快进慢出，接近 iOS / Apple 宣传片的手感
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

const SOFT_SPRING: Partial<SpringConfig> = { damping: 200, mass: 0.8 };

/** 从 delay 帧开始的 0→1 弹簧进度 */
export function useSpring(delay = 0, config: Partial<SpringConfig> = SOFT_SPRING): number {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    return spring({ frame: frame - delay, fps, config });
}

/** 在 [start, start + duration] 区间内的 0→1 缓动进度 */
export function progress(
    frame: number,
    start: number,
    duration: number,
    easing: (t: number) => number = easeOut,
): number {
    return interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing });
}

/** 打字机：按字符（而非 UTF-16 单元）截取，避免中文、emoji 被截断成乱码 */
export function typed(text: string, frame: number, start: number, charsPerFrame: number): string {
    const chars = Array.from(text);
    const count = Math.max(0, Math.floor((frame - start) * charsPerFrame));
    return chars.slice(0, count).join('');
}

/** 打字机结束的帧号 */
export function typedEnd(text: string, start: number, charsPerFrame: number): number {
    return start + Math.ceil(Array.from(text).length / charsPerFrame);
}

/** 数字滚动 */
export function countUp(frame: number, start: number, duration: number, to: number, from = 0): number {
    return Math.round(interpolate(progress(frame, start, duration), [0, 1], [from, to]));
}

export function formatNumber(value: number): string {
    return value.toLocaleString('en-US');
}

/** 光标闪烁：每 16 帧一个周期 */
export function cursorVisible(frame: number): boolean {
    return Math.floor(frame / 16) % 2 === 0;
}
