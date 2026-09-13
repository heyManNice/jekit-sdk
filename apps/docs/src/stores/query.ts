import { create } from "zustand";

const STORAGE_KEY = "jekit-stats-query";

// 从 localStorage 恢复上次的搜索值
function loadPersistedQuery(): { domain: string; path: string } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed.domain === "string" && typeof parsed.path === "string") {
                return { domain: parsed.domain, path: parsed.path };
            }
        }
    } catch {
        // ignore
    }
    return null;
}

// 保存搜索值到 localStorage
function persistQuery(domain: string, path: string) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ domain, path }));
    } catch {
        // ignore
    }
}

const HISTORY_KEY = "jekit-stats-history";
// 历史记录最多保留的条数
const HISTORY_LIMIT = 10;

// 从 localStorage 恢复历史记录
function loadHistory(): string[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is string => typeof item === "string");
            }
        }
    } catch {
        // ignore
    }
    return [];
}

// 保存历史记录到 localStorage
function persistHistory(history: string[]) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
        // ignore
    }
}

interface QueryState {
    domain: string;
    path: string;
    // 每次搜索递增，用于触发组件重新挂载
    version: number;
    // 子页面数量（由 stats 接口返回）
    subPageCount: number | null;
    // 站点注册时间戳（由 stats 接口返回）
    registeredAt: bigint | null;
    // 站点页面数量上限（由 stats 接口返回）
    pageLimitForSite: number | null;
    // 查询历史，新查询排在最前
    history: string[];
    search: (domain: string, path: string) => void;
    removeHistory: (url: string) => void;
    clearHistory: () => void;
    setStatsInfo: (subPageCount: number, registeredAt: bigint, pageLimitForSite: number) => void;
}

const persisted = loadPersistedQuery();

export const useQueryStore = create<QueryState>((set, get) => ({
    domain: persisted?.domain ?? "https://jekit.cn",
    path: persisted?.path ?? "/",
    version: 0,
    subPageCount: null,
    registeredAt: null,
    pageLimitForSite: null,
    history: loadHistory(),
    search: (domain: string, path: string) => {
        persistQuery(domain, path);

        // 同一条记录只保留最新的一次，超出上限的丢弃
        const url = `${domain}${path}`;
        const history = [url, ...get().history.filter((item) => item !== url)]
            .slice(0, HISTORY_LIMIT);
        persistHistory(history);

        set((state) => ({
            domain,
            path,
            version: state.version + 1,
            history,
        }));
    },
    removeHistory: (url: string) => {
        const history = get().history.filter((item) => item !== url);
        persistHistory(history);
        set({ history });
    },
    clearHistory: () => {
        persistHistory([]);
        set({ history: [] });
    },
    setStatsInfo: (subPageCount: number, registeredAt: bigint, pageLimitForSite: number) =>
        set({ subPageCount, registeredAt, pageLimitForSite }),
}));
