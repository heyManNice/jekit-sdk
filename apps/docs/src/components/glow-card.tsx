import {
    type ComponentPropsWithoutRef,
    forwardRef,
    useEffect,
    useMemo,
    useRef,
} from "react";

import { isMobileDevice } from "@/utils/device";


// ==================== 全局鼠标位置 ====================

// 页面上每张卡片都要跟随鼠标。若各自订阅 mousemove 再 setState，
// 一次鼠标移动就会触发「卡片数量」次 React 重渲染，外加同样次数的
// getBoundingClientRect（首页约 15 张、统计面板约 15 张）。
// 这里收敛成一个模块级数据源：mousemove 只记坐标，每帧统一派发一次。

interface MouseTarget {
    // 只读布局。集中安排在写样式之前，避免读写交替触发多次重排
    measure?(): void;
    // 只写样式
    render(): void;
}

const mouseTargets = new Set<MouseTarget>();
let mouseX = 0;
let mouseY = 0;
let mouseRaf = 0;

function flushMouse() {
    mouseRaf = 0;

    const targets = Array.from(mouseTargets);
    for (const target of targets) target.measure?.();
    for (const target of targets) target.render();
}

function handleMouseMove(event: MouseEvent) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    // mousemove 的触发频率可能高于屏幕刷新率，一帧只处理一次
    if (mouseRaf) return;
    mouseRaf = requestAnimationFrame(flushMouse);
}

// 订阅全局鼠标位置：第一个订阅者装上监听，最后一个订阅者摘掉
function subscribeMouse(target: MouseTarget): () => void {
    if (mouseTargets.size === 0) {
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }
    mouseTargets.add(target);

    return () => {
        mouseTargets.delete(target);

        if (mouseTargets.size > 0) return;
        window.removeEventListener("mousemove", handleMouseMove);
        if (mouseRaf) cancelAnimationFrame(mouseRaf);
        mouseRaf = 0;
    };
}


// ==================== 工具函数 ====================

// 根据百分比距离（0~100）计算内部边缘发光强度
function innerEdgeIntensity(distPct: number, threshold = 25): number {
    return Math.max(0, 5 - distPct / threshold);
}

// 根据像素距离计算外部边缘发光强度（distPx ≤ limit 时渐入）
function outerEdgeIntensity(distPx: number, limit = 60): number {
    return Math.max(0, 2 - distPx / limit);
}

// 上下边框的渐变：亮点沿 X 轴停在 --glow-x，向左右各 50% 淡出
function edgeGradientX(color: string): string {
    return `linear-gradient(90deg, transparent 0%, transparent max(0%, calc(var(--glow-x, 50%) - 50%)), `
        + `${color} var(--glow-x, 50%), `
        + `transparent min(100%, calc(var(--glow-x, 50%) + 50%)), transparent 100%)`;
}

// 左右边框的渐变：亮点沿 Y 轴停在 --glow-y，向上下各 50% 淡出
function edgeGradientY(color: string): string {
    return `linear-gradient(180deg, transparent 0%, transparent max(0%, calc(var(--glow-y, 50%) - 50%)), `
        + `${color} var(--glow-y, 50%), `
        + `transparent min(100%, calc(var(--glow-y, 50%) + 50%)), transparent 100%)`;
}

// 把当前鼠标位置换算成卡片上的一组 CSS 变量。
// 刻意不经过 React state：坐标变化只写 CSS 变量，不重建元素树、不做 diff。
function writeGlowVars(el: HTMLElement, rect: DOMRect) {
    const mx = mouseX;
    const my = mouseY;

    // 鼠标到卡片边界的最短距离（在卡片内部时为 0）
    const distDx = Math.max(rect.left - mx, 0, mx - rect.right);
    const distDy = Math.max(rect.top - my, 0, my - rect.bottom);
    const dist = Math.sqrt(distDx * distDx + distDy * distDy);

    // 距离衰减：0px 时 1，300px 时 0（平方曲线，越远衰减越快）
    const maxDist = 300;
    const alpha = dist >= maxDist ? 0 : (1 - dist / maxDist) ** 2;

    // 鼠标到四条边的外部距离（>0 表示鼠标在卡片外那一侧）
    const outTop = Math.max(0, rect.top - my);
    const outBottom = Math.max(0, my - rect.bottom);
    const outLeft = Math.max(0, rect.left - mx);
    const outRight = Math.max(0, mx - rect.right);

    let px: number;
    let py: number;
    let top: number;
    let bottom: number;
    let left: number;
    let right: number;

    if (outTop + outBottom + outLeft + outRight === 0) {
        // ── 内部：百分比位置 + 百分比强度 ──
        px = ((mx - rect.left) / rect.width) * 100;
        py = ((my - rect.top) / rect.height) * 100;
        top = innerEdgeIntensity(py);
        bottom = innerEdgeIntensity(100 - py);
        left = innerEdgeIntensity(px);
        right = innerEdgeIntensity(100 - px);
    } else {
        // ── 外部：以卡片边界为发光中心，用像素距离计算强度 ──
        const cx = Math.max(rect.left, Math.min(rect.right, mx));
        const cy = Math.max(rect.top, Math.min(rect.bottom, my));
        px = ((cx - rect.left) / rect.width) * 100;
        py = ((cy - rect.top) / rect.height) * 100;
        top = outerEdgeIntensity(outTop);
        bottom = outerEdgeIntensity(outBottom);
        left = outerEdgeIntensity(outLeft);
        right = outerEdgeIntensity(outRight);
    }

    const { style } = el;
    style.setProperty("--glow-x", `${px}%`);
    style.setProperty("--glow-y", `${py}%`);
    style.setProperty("--glow-alpha", String(alpha));
    // 边框亮度先乘上距离衰减，省掉一层嵌套的 opacity
    style.setProperty("--glow-top", String(top * alpha));
    style.setProperty("--glow-bottom", String(bottom * alpha));
    style.setProperty("--glow-left", String(left * alpha));
    style.setProperty("--glow-right", String(right * alpha));
}


// ==================== 组件 ====================

interface GlowCardProps extends ComponentPropsWithoutRef<"div"> {
    // 主光晕颜色，默认 cyan
    glowColor?: string;
    // 主光晕半径，单位 px
    glowSize?: number;
    // 边缘辉光颜色
    edgeGlowColor?: string;
    // 边缘辉光半径，单位 px
    edgeGlowSize?: number;
}

// 带有鼠标跟随光晕效果的卡片容器。
//
// - 以鼠标为中心的大范围柔光（营造氛围）
// - 鼠标附近小范围较亮辉光（模拟亚克力边缘反射）
// - **鼠标最近的一侧边框额外发光（支持从外部靠近时触发）**
// - 鼠标远离时平滑淡出
export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(function GlowCard({
    children,
    className = "",
    glowColor = "rgba(6, 230, 226, 0.01)",
    glowSize = 250,
    edgeGlowColor = "rgba(6, 230, 226, 0.1)",
    edgeGlowSize = 250,
    ...rest
}, ref) {
    // 手机端禁用光晕效果的能力判定。
    // 必须在所有 hooks 之后才能据此提前 return：窗口宽度跨越断点时判定会变化，
    // 若在 hooks 之前 return，hook 数量随之改变，React 会直接抛错导致整页崩白。
    // 用 useMemo 固定首次判定，避免同一实例在运行期来回切换形态。
    const isMobile = useMemo(() => isMobileDevice(), []);

    const cardRef = useRef<HTMLDivElement>(null);

    // 跟随全局鼠标更新 CSS 变量（手机端不订阅）
    useEffect(() => {
        const el = cardRef.current;
        if (isMobile || !el) return;

        // 每帧的布局读数：measure 阶段写进来，render 阶段取用
        let rect: DOMRect | null = null;

        return subscribeMouse({
            measure() {
                rect = el.getBoundingClientRect();
            },
            render() {
                if (rect) writeGlowVars(el, rect);
            },
        });
    }, [isMobile]);

    // 手机端直接渲染子元素，不带光晕图层（放在所有 hooks 之后才安全）
    if (isMobile) {
        return <div ref={ref} className={className} {...rest}>{children}</div>;
    }

    return (
        <div
            ref={(node) => {
                cardRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            }}
            className={`relative ${className}`}
            {...rest}
        >
            {/* 发光层独立容器 — 仅在此容器裁剪光晕，不影响子元素溢出 */}
            {/* 位置与亮度全部走 CSS 变量（由 writeGlowVars 写入），
                这里只留不随鼠标变化的部分 */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                {/* 图层 1：大面积柔光氛围 */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        opacity: "var(--glow-alpha, 0)",
                        background: `radial-gradient(${glowSize}px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${glowColor}, transparent 50%)`,
                    }}
                />

                {/* 图层 2：边缘辉光 — 鼠标附近较亮，模拟亚克力边缘反光 */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        opacity: "var(--glow-alpha, 0)",
                        background: `radial-gradient(${edgeGlowSize}px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${edgeGlowColor}, transparent 55%)`,
                    }}
                />

                {/* 图层 3~6：四边边框发光，亮点跟随鼠标在该边方向上的位置 */}
                {/* 上边框 — 亮点在 X 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute top-0 left-0 right-0 h-px"
                    style={{
                        opacity: "var(--glow-top, 0)",
                        background: edgeGradientX(edgeGlowColor),
                        boxShadow: `0 0 8px 1px ${edgeGlowColor}`,
                    }}
                />
                {/* 下边框 — 亮点在 X 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
                    style={{
                        opacity: "var(--glow-bottom, 0)",
                        background: edgeGradientX(edgeGlowColor),
                        boxShadow: `0 0 8px 1px ${edgeGlowColor}`,
                    }}
                />
                {/* 左边框 — 亮点在 Y 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-px"
                    style={{
                        opacity: "var(--glow-left, 0)",
                        background: edgeGradientY(edgeGlowColor),
                        boxShadow: `0 0 8px 1px ${edgeGlowColor}`,
                    }}
                />
                {/* 右边框 — 亮点在 Y 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute top-0 bottom-0 right-0 w-px"
                    style={{
                        opacity: "var(--glow-right, 0)",
                        background: edgeGradientY(edgeGlowColor),
                        boxShadow: `0 0 8px 1px ${edgeGlowColor}`,
                    }}
                />
            </div>

            {children}
        </div>
    );
});


// ==================== 全局背景辉光 ====================

// 全屏跟随鼠标的极淡背景辉光。
// 置于页面最底层，隐隐约约增强整体氛围。
export function BackgroundGlow() {
    const isMobile = useMemo(() => isMobileDevice(), []);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = glowRef.current;
        if (isMobile || !el) return;

        return subscribeMouse({
            // 全屏元素，不需要读布局
            render() {
                el.style.setProperty("--bg-glow-x", `${(mouseX / window.innerWidth) * 100}%`);
                el.style.setProperty("--bg-glow-y", `${(mouseY / window.innerHeight) * 100}%`);
            },
        });
    }, [isMobile]);

    if (isMobile) return null;

    return (
        <div
            ref={glowRef}
            className="pointer-events-none fixed inset-0"
            style={{
                zIndex: 1,
                background: "radial-gradient(1000px circle at var(--bg-glow-x, 50%) var(--bg-glow-y, 50%), rgba(6, 230, 226, 0.01), transparent 30%)",
            }}
        />
    );
}
