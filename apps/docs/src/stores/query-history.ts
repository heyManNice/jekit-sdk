import { create } from "zustand";

const HISTORY_KEY = "jekit-stats-history";
const HISTORY_LIMIT = 10;

function loadHistory(): string[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];

        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string")
            : [];
    } catch {
        return [];
    }
}

function persistHistory(history: readonly string[]) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
        // 隐私模式或存储空间不可用时，内存状态仍可正常工作。
    }
}

interface QueryHistoryState {
    history: string[];
    addHistory: (url: string) => void;
    removeHistory: (url: string) => void;
    clearHistory: () => void;
}

// 当前查询以地址栏为唯一来源；store 只保存与查询结果无关的本地历史记录。
export const useQueryHistoryStore = create<QueryHistoryState>((set, get) => ({
    history: loadHistory(),
    addHistory: (url) => {
        const history = [url, ...get().history.filter((item) => item !== url)]
            .slice(0, HISTORY_LIMIT);
        persistHistory(history);
        set({ history });
    },
    removeHistory: (url) => {
        const history = get().history.filter((item) => item !== url);
        persistHistory(history);
        set({ history });
    },
    clearHistory: () => {
        persistHistory([]);
        set({ history: [] });
    },
}));
