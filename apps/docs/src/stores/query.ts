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
    search: (domain: string, path: string) => void;
    setStatsInfo: (subPageCount: number, registeredAt: bigint, pageLimitForSite: number) => void;
}

const persisted = loadPersistedQuery();

export const useQueryStore = create<QueryState>((set) => ({
    domain: persisted?.domain ?? "https://jekit.cn",
    path: persisted?.path ?? "/",
    version: 0,
    subPageCount: null,
    registeredAt: null,
    pageLimitForSite: null,
    search: (domain: string, path: string) => {
        persistQuery(domain, path);
        set((state) => ({
            domain,
            path,
            version: state.version + 1,
        }));
    },
    setStatsInfo: (subPageCount: number, registeredAt: bigint, pageLimitForSite: number) =>
        set({ subPageCount, registeredAt, pageLimitForSite }),
}));
