import {
    type ComponentPropsWithoutRef,
    forwardRef,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { isMobileDevice } from "@/utils/device";


// ==================== 工具函数 ====================

// 根据百分比距离（0~100）计算内部边缘发光强度
function innerEdgeIntensity(distPct: number, threshold = 25): number {
    return Math.max(0, 5 - distPct / threshold);
}

// 根据像素距离计算外部边缘发光强度（distPx ≤ limit 时渐入）
function outerEdgeIntensity(distPx: number, limit = 60): number {
    return Math.max(0, 2 - distPx / limit);
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
    // 手机端直接渲染子元素，禁用光晕效果
    if (isMobileDevice()) {
        return <div ref={ref} className={className} {...rest}>{children}</div>;
    }

    const cardRef = useRef<HTMLDivElement>(null);
    // 全局鼠标位置（视口坐标）
    const [mousePos, setMousePos] = useState({ x: -9999, y: -9999 });

    // 全局追踪鼠标
    useEffect(() => {
        const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    // === 计算发光强度 ===
    const { pos, edges, distAlpha } = useMemo(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        const result = {
            pos: { x: 50, y: 50 },
            edges: { top: 0, bottom: 0, left: 0, right: 0 },
            distAlpha: 0,
        };
        if (!rect) return result;

        const mx = mousePos.x;
        const my = mousePos.y;

        // 鼠标到卡片边界的最短距离（内部为 0）
        const distDx = Math.max(rect.left - mx, 0, mx - rect.right);
        const distDy = Math.max(rect.top - my, 0, my - rect.bottom);
        const dist = Math.sqrt(distDx * distDx + distDy * distDy);
        // 距离衰减：0px 时 1，300px 时 0（平方曲线，越远衰减越快）
        const maxDist = 300;
        result.distAlpha = dist >= maxDist ? 0 : (1 - dist / maxDist) ** 2;

        // 鼠标到四条边的外部距离（像素，>0 表示鼠标在卡片外部那侧）
        const outT = Math.max(0, rect.top - my);     // 鼠标在卡片上方
        const outB = Math.max(0, my - rect.bottom);  // 鼠标在卡片下方
        const outL = Math.max(0, rect.left - mx);    // 鼠标在卡片左侧
        const outR = Math.max(0, mx - rect.right);   // 鼠标在卡片右侧

        const isInside = outT + outB + outL + outR === 0;

        if (isInside) {
            // ── 内部：百分比位置 + 百分比强度 ──
            const px = ((mx - rect.left) / rect.width) * 100;
            const py = ((my - rect.top) / rect.height) * 100;
            result.pos = { x: px, y: py };
            result.edges = {
                top: innerEdgeIntensity(py),
                bottom: innerEdgeIntensity(100 - py),
                left: innerEdgeIntensity(px),
                right: innerEdgeIntensity(100 - px),
            };
        } else {
            // ── 外部：以卡片边界为发光中心，用像素距离计算强度 ──
            const cx = Math.max(rect.left, Math.min(rect.right, mx));
            const cy = Math.max(rect.top, Math.min(rect.bottom, my));
            const px = ((cx - rect.left) / rect.width) * 100;
            const py = ((cy - rect.top) / rect.height) * 100;
            result.pos = { x: px, y: py };

            result.edges = {
                top: outerEdgeIntensity(outT),
                bottom: outerEdgeIntensity(outB),
                left: outerEdgeIntensity(outL),
                right: outerEdgeIntensity(outR),
            };
        }
        return result;
    }, [mousePos]);

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
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                {/* 图层 1：大面积柔光氛围 */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        opacity: distAlpha,
                        background: `radial-gradient(${glowSize}px circle at ${pos.x}% ${pos.y}%, ${glowColor}, transparent 50%)`,
                    }}
                />

                {/* 图层 2：边缘辉光 — 鼠标附近较亮，模拟亚克力边缘反光 */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        opacity: distAlpha,
                        background: `radial-gradient(${edgeGlowSize}px circle at ${pos.x}% ${pos.y}%, ${edgeGlowColor}, transparent 55%)`,
                    }}
                />

                {/* 图层 3~6：四边边框发光，亮点跟随鼠标在该边方向上的位置 */}
                {/* 上边框 — 亮点在 X 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute top-0 left-0 right-0 h-px"
                    style={{
                        opacity: edges.top * distAlpha,
                        background: `linear-gradient(90deg, transparent 0%, transparent ${Math.max(0, pos.x - 50)}%, ${edgeGlowColor} ${pos.x}%, transparent ${Math.min(100, pos.x + 50)}%, transparent 100%)`,
                        boxShadow: `0 0 8px 1px ${edgeGlowColor}`,
                    }}
                />
                {/* 下边框 — 亮点在 X 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
                    style={{
                        opacity: edges.bottom * distAlpha,
                        background: `linear-gradient(90deg, transparent 0%, transparent ${Math.max(0, pos.x - 50)}%, ${edgeGlowColor} ${pos.x}%, transparent ${Math.min(100, pos.x + 50)}%, transparent 100%)`,
                        boxShadow: `0 0 8px 1px ${edgeGlowColor}`,
                    }}
                />
                {/* 左边框 — 亮点在 Y 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-px"
                    style={{
                        opacity: edges.left * distAlpha,
                        background: `linear-gradient(180deg, transparent 0%, transparent ${Math.max(0, pos.y - 50)}%, ${edgeGlowColor} ${pos.y}%, transparent ${Math.min(100, pos.y + 50)}%, transparent 100%)`,
                        boxShadow: `${edgeGlowColor} 0 0 8px 1px`,
                    }}
                />
                {/* 右边框 — 亮点在 Y 方向跟随鼠标 */}
                <div
                    className="pointer-events-none absolute top-0 bottom-0 right-0 w-px"
                    style={{
                        opacity: edges.right * distAlpha,
                        background: `linear-gradient(180deg, transparent 0%, transparent ${Math.max(0, pos.y - 50)}%, ${edgeGlowColor} ${pos.y}%, transparent ${Math.min(100, pos.y + 50)}%, transparent 100%)`,
                        boxShadow: `${edgeGlowColor} 0 0 8px 1px`,
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
    const [pos, setPos] = useState({ x: 50, y: 50 });
    const isMobile = useMemo(() => isMobileDevice(), []);

    useEffect(() => {
        if (isMobile) return;
        const onMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setPos({ x, y });
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, [isMobile]);

    if (isMobile) return null;

    return (
        <div
            className="pointer-events-none fixed inset-0"
            style={{
                zIndex: 1,
                background: `radial-gradient(1000px circle at ${pos.x}% ${pos.y}%, rgba(6, 230, 226, 0.01), transparent 30%)`,
            }}
        />
    );
}
