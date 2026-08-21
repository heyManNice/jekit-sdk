import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

export interface DropdownItem<T = number> {
    label: string;
    value: T;
}

interface DropdownProps<T = number> {
    items: readonly DropdownItem<T>[];
    selected: T;
    onSelect: (value: T) => void;
    className?: string;
    minWidth?: string;
}

// 通用下拉选择框
export function Dropdown<T = number>({
    items,
    selected,
    onSelect,
    className = "",
    minWidth = "min-w-37.5",
}: DropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const activeLabel = items.find((i) => i.value === selected)?.label ?? "";
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollPosRef = useRef(0);

    const handleClose = () => {
        if (scrollRef.current) {
            scrollPosRef.current = scrollRef.current.scrollTop;
        }
        setOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex ${minWidth} items-center justify-between gap-3 rounded border border-[#102336] bg-[#03101C]/90 px-3 py-2 text-left text-xs text-white transition-colors hover:border-primary/60 hover:text-primary ${className}`}
            >
                <span className="truncate">{activeLabel}</span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <>
                    {/* 点击外部关闭 */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={handleClose}
                    />
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                key="dropdown-list"
                                ref={(el) => {
                                    scrollRef.current = el;
                                    // 挂载时立即恢复上次滚动位置，先于动画
                                    if (el) el.scrollTop = scrollPosRef.current;
                                }}
                                initial={{ y: -8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -8, opacity: 0 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className={`absolute left-0 top-full z-20 mt-1 w-full rounded border border-[#102336] bg-[#03101C] shadow-lg max-h-40 overflow-y-auto`}
                            >
                                {items.map((item) => (
                                    <button
                                        key={String(item.value)}
                                        type="button"
                                        onClick={() => {
                                            onSelect(item.value);
                                            setOpen(false);
                                        }}
                                        className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#0A2740] ${item.value === selected
                                            ? "text-white"
                                            : "text-text-secondary"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
