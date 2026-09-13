import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    type KeyboardEvent,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import { GlowCard } from "@/components/glow-card";

interface SearchHistoryInputProps {
    // 输入框当前内容
    value: string;
    // 输入内容变化
    onChange: (value: string) => void;
    // 回车或选中历史记录时触发
    onSubmit: (value: string) => void;
    // 历史记录，新的在前
    history: readonly string[];
    // 删除单条历史记录
    onRemoveHistory: (item: string) => void;
    // 清空全部历史记录
    onClearHistory: () => void;
    placeholder?: string;
    ariaLabel?: string;
}

// 带历史记录下拉的搜索输入框
//
// 下拉列表渲染在 GlowCard 外侧：GlowCard 的 overflow-hidden 会裁剪内部溢出内容，
// 若把下拉放在卡片内部会导致列表被切掉。
export function SearchHistoryInput({
    value,
    onChange,
    onSubmit,
    history,
    onRemoveHistory,
    onClearHistory,
    placeholder = "输入 URL",
    ariaLabel = "输入 URL",
}: SearchHistoryInputProps) {
    // 下拉是否展开
    const [open, setOpen] = useState(false);
    // 键盘高亮项的下标，-1 表示没有高亮
    const [activeIndex, setActiveIndex] = useState(-1);
    // 聚焦之后用户是否手动改过输入内容
    // 输入框一进来就带着上次查询的地址，若直接按它过滤会把其它记录全部滤掉
    const [edited, setEdited] = useState(false);
    const listId = useId();
    const listRef = useRef<HTMLDivElement>(null);

    // 只在用户主动输入时才过滤，否则展示全部历史记录
    const keyword = edited ? value.trim().toLowerCase() : "";
    const items = keyword
        ? history.filter((item) => item.toLowerCase().includes(keyword))
        : history;
    const visible = open && items.length > 0;

    // 过滤条件变化后，旧的选中项已经失效
    useEffect(() => {
        setActiveIndex(-1);
    }, [keyword]);

    // 键盘移动高亮时让选中项保持可见
    useEffect(() => {
        if (activeIndex < 0) return;

        const node = listRef.current?.children[activeIndex];
        if (node instanceof HTMLElement) {
            node.scrollIntoView({ block: "nearest" });
        }
    }, [activeIndex]);

    // 关闭下拉并清除高亮
    const close = () => {
        setOpen(false);
        setActiveIndex(-1);
    };

    const submit = (text: string) => {
        onSubmit(text);
        close();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        // 上下键移动高亮
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (!visible) {
                if (history.length > 0) setOpen(true);
                return;
            }

            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((current) => {
                const next = current + step;
                if (next < 0) return items.length - 1;
                if (next >= items.length) return 0;
                return next;
            });
            return;
        }

        // 回车：有高亮项就提交高亮项，否则提交当前输入
        if (event.key === "Enter") {
            event.preventDefault();

            const picked = visible && activeIndex >= 0 ? items[activeIndex] : undefined;
            if (picked !== undefined) {
                onChange(picked);
                submit(picked);
                return;
            }

            submit(value);
            return;
        }

        if (event.key === "Escape") {
            close();
        }
    };

    return (
        <div className="relative mt-5 max-w-180">
            {/* 搜索框本体 */}
            <GlowCard className="flex items-stretch gap-0 overflow-hidden rounded border border-[#102336] bg-[#03101C]/90 max-sm:flex-col transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2">
                    <span className="sr-only">{ariaLabel}</span>
                    <input
                        type="text"
                        data-main-content="true"
                        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                        value={value}
                        placeholder={placeholder}
                        aria-label={ariaLabel}
                        role="combobox"
                        aria-expanded={visible}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                        autoComplete="off"
                        onChange={(event) => {
                            setEdited(true);
                            // 选中历史记录或搜索之后下拉会关闭，继续输入时应当重新展开
                            setOpen(true);
                            onChange(event.target.value);
                        }}
                        onFocus={() => {
                            setEdited(false);
                            setOpen(true);
                        }}
                        onBlur={close}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        type="button"
                        className="flex shrink-0 items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:text-primary"
                        aria-label="执行搜索"
                        onClick={() => submit(value)}
                    >
                        <Search size={18} />
                    </button>
                </div>
            </GlowCard>

            {/* 历史记录下拉 */}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        key="search-history"
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 z-30 mt-1 overflow-hidden rounded border border-[#102336] bg-[#03101C] shadow-lg"
                    >
                        {/* 下拉头部 */}
                        <div className="flex items-center justify-between border-b border-[#102336] px-3 py-1.5 text-xs text-text-muted">
                            <span>最近查询</span>
                            <button
                                type="button"
                                className="transition-colors hover:text-primary"
                                // 阻止默认行为，避免输入框失焦导致点击还没触发下拉就关了
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={onClearHistory}
                            >
                                清空
                            </button>
                        </div>

                        {/* 历史记录列表 */}
                        <div
                            ref={listRef}
                            id={listId}
                            role="listbox"
                            aria-label="历史查询记录"
                            className="max-h-60 overflow-y-auto"
                        >
                            {items.map((item, index) => (
                                <div
                                    key={item}
                                    id={`${listId}-${index}`}
                                    role="option"
                                    aria-label={item}
                                    aria-selected={index === activeIndex}
                                    className={`group flex items-center gap-2 px-3 py-2 text-xs transition-colors ${index === activeIndex
                                        ? "bg-[#0A2740] text-white"
                                        : "text-text-secondary"
                                        }`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                        onChange(item);
                                        submit(item);
                                    }}
                                >
                                    <span className="min-w-0 flex-1 truncate">{item}</span>
                                    {/* 删除单条记录，仅鼠标可用，不参与键盘导航 */}
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        aria-label={`删除历史记录 ${item}`}
                                        className="shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onRemoveHistory(item);
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
