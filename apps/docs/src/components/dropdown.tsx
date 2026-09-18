import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import type { KeyboardEvent } from "react";

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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollPosRef = useRef(0);

    // 打开时把上次的滚动位置还原回来。
    // 这里必须用 useLayoutEffect 而不是内联 ref 回调：内联回调每次重渲染都会重新执行，
    // 而统计面板每 6 秒轮询一次，正在翻列表时会被弹回上次关闭时的位置。
    useLayoutEffect(() => {
        if (!open || !scrollRef.current) return;
        scrollRef.current.scrollTop = scrollPosRef.current;
    }, [open]);

    // 关闭前记下滚动位置，下次打开时接着看
    const close = () => {
        if (scrollRef.current) {
            scrollPosRef.current = scrollRef.current.scrollTop;
        }
        setOpen(false);
    };

    // 键盘关闭时把焦点还给触发按钮，否则焦点会掉到 body 上
    const closeAndRefocus = () => {
        close();
        triggerRef.current?.focus();
    };

    const toggle = () => {
        if (open) close();
        else setOpen(true);
    };

    // 上下键在选项间移动焦点（选项是 button，回车/空格原生可用），Esc 关闭
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            closeAndRefocus();
            return;
        }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

        event.preventDefault();
        const options = Array.from(
            scrollRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
        );
        if (options.length === 0) return;

        const current = options.indexOf(document.activeElement as HTMLButtonElement);
        const step = event.key === "ArrowDown" ? 1 : -1;
        // 焦点还在触发按钮上（index 为 -1）时，向下从第一项开始，向上从最后一项开始
        const next = current === -1
            ? (step === 1 ? 0 : options.length - 1)
            : (current + step + options.length) % options.length;
        options[next].focus();
    };

    return (
        <div
            className="relative"
            onKeyDown={handleKeyDown}
            onBlur={(event) => {
                // 焦点移出整个组件就收起，避免菜单悬空
                if (!event.currentTarget.contains(event.relatedTarget)) close();
            }}
        >
            {/* 触发按钮的层级要压过下面的全屏遮罩，
                否则打开期间它收不到 hover 样式，也点不到 */}
            <button
                ref={triggerRef}
                type="button"
                aria-expanded={open}
                onClick={toggle}
                className={`relative z-20 flex ${minWidth} items-center justify-between gap-3 rounded border border-control-border bg-surface/90 px-3 py-2 text-left text-xs text-white transition-colors hover:border-primary/60 hover:text-primary ${className}`}
            >
                <span className="truncate">{activeLabel}</span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* 点击外部关闭（不需要退出动画，收起了就别再拦截点击） */}
            {open && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={close}
                />
            )}

            {/* 列表单独包一个 AnimatePresence：原来外层还有一层 {open && ...}，
                关掉时整棵子树被同级卸载，exit 永远来不及播放 */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="dropdown-list"
                        ref={scrollRef}
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="surface-popover absolute left-0 top-full z-20 mt-1 w-full max-h-40 overflow-y-auto"
                    >
                        {items.map((item) => (
                            <button
                                key={String(item.value)}
                                type="button"
                                onClick={() => {
                                    onSelect(item.value);
                                    close();
                                }}
                                className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-surface-hover ${item.value === selected
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
        </div>
    );
}
