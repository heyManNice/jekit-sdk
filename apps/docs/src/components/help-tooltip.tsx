import { CircleHelp } from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface HelpTooltipProps {
    /** 悬浮说明内容（桌面 tooltip 与手机弹窗共用） */
    content: ReactNode;
    /** 图标尺寸 */
    size?: number;
    /** 额外类名（默认 inline-flex） */
    className?: string;
}

// 文字后方的 ? 悬浮说明图标
// 桌面：鼠标悬浮显示 tooltip；手机：点击弹出说明弹窗
export function HelpTooltip({
    content,
    size = 13,
    className = "inline-flex",
}: HelpTooltipProps) {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const iconRef = useRef<HTMLSpanElement>(null);

    // 检测是否为触屏设备
    useEffect(() => {
        setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }, []);

    const showTooltip = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            setTooltipPos({
                top: rect.bottom + 8,
                left: rect.left + rect.width / 2,
            });
            setTooltipVisible(true);
        }
    };
    const hideTooltip = () => setTooltipVisible(false);

    const handleClick = () => {
        if (isMobile) {
            setShowMobileModal(true);
        }
    };

    return (
        <>
            <span
                ref={iconRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onClick={handleClick}
                className={className}
            >
                <CircleHelp size={size} className="text-[#65dfe9] cursor-help" />
            </span>

            {/* 桌面版 — Portal tooltip → body */}
            {!isMobile && createPortal(
                <AnimatePresence>
                    {tooltipVisible && (
                        <motion.div
                            key="help-tooltip"
                            className="fixed z-9999"
                            style={{ top: tooltipPos.top, left: tooltipPos.left }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                            <div className="-translate-x-1/2 w-56 rounded border border-[#102336] bg-[#03101C] px-3 py-2 text-xs text-text-secondary shadow-lg">
                                {content}
                                {/* 小三角 */}
                                <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#102336]" />
                                <span className="absolute -top-0.75 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#03101C]" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {/* 手机版 — 点击弹窗 */}
            {isMobile && createPortal(
                <AnimatePresence>
                    {showMobileModal && (
                        <motion.div
                            key="help-mobile-modal"
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setShowMobileModal(false)}
                        >
                            <motion.div
                                key="help-mobile-dialog"
                                className="w-full max-w-sm rounded border border-[#102336] bg-[#03101C] p-5 shadow-2xl"
                                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="mb-4 text-xs text-text-secondary leading-relaxed">
                                    {content}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowMobileModal(false)}
                                    className="w-full rounded border border-primary bg-[#013F4C] py-2 text-xs text-primary transition-colors hover:bg-[#01505E]"
                                >
                                    确定
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
}
