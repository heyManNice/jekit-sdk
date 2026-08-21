import {
    useEffect,
    useMemo,
} from "react";
import { create } from "zustand";
import { device } from "jekit-core";
import { fmtDateTime } from "@/utils/format";

import {
    CircleX,
    Clock3,
    Cpu,
    Gauge,
    Handshake,
    HardDrive,
    MemoryStick,
    Send,
    Server,
    Wifi,
} from "lucide-react";


// ==================== 类型定义 ====================

export type DeviceData = Awaited<ReturnType<typeof device>>;

// lucide 图标通用 props
type IconType = React.ComponentType<{ size?: number; className?: string }>;


// ==================== 指标配置 ====================

export interface MetricConfigItem {
    key: string;
    label: string;
    icon: IconType;
    animateValue?: boolean;
    compact?: boolean;
    renderValue: (data: DeviceData | null) => string;
}

export const metricsConfig: MetricConfigItem[] = [
    {
        key: "total_request",
        label: "总请求量 (包含查询)",
        icon: Send,
        renderValue: (data) => data?.totalRequest.toString() || '--'
    },
    {
        key: "qps_5m",
        label: "上报量 / QPS (5 Min)",
        icon: Handshake,
        renderValue: (data) => {
            if (!data) return "-- / --";
            const diffMs = new Date().getTime() - Number(data.whileStartTime);
            const diffSec = diffMs / 1000;
            const qps = (data.requestForWhile / diffSec).toFixed(2) || '--';
            return `${data.requestForWhile} / ${qps}`;
        }
    },
    {
        key: "cache_5m",
        label: "缓存命中量 / 命中率 (5 Min)",
        icon: Gauge,
        renderValue: (data) => {
            if (data?.requestForWhile == null) return "-- / --%";
            if (data.requestForWhile === 0) return "0 / 0%";
            const rate = ((data.cacheHitForWhile / data.requestForWhile) * 100).toFixed(0);
            return `${data.cacheHitForWhile} / ${rate}%`;
        }
    },
    {
        key: "dropped_requests",
        label: "总非法请求量",
        icon: CircleX,
        renderValue: (data) => data?.droppedRequests.toString() || "--"
    },
    {
        key: "http_sessions",
        label: "实时 HTTP 会话量",
        icon: Wifi,
        renderValue: (data) => `${data?.httpSessionsRealTime || '--'}`
    },
    {
        key: "mem",
        label: "内存实例 / 内存使用量",
        icon: MemoryStick,
        renderValue: (data) => {
            const instances = data?.siteInstanceInMem || '--';
            const memUsed = data?.processMemUsed
                ? `${(data.processMemUsed / 1024).toFixed(2)}`
                : '--';
            return `${instances} / ${memUsed} MB`;
        }
    },
    {
        key: "cpu",
        label: "CPU 使用率",
        icon: Cpu,
        renderValue: (data) => {
            if (data?.cpuUsed == null) return '--';
            return `${(data.cpuUsed / 100).toFixed(1)}%`;
        }
    },
    {
        key: "site_db",
        label: "总站点数 / 数据库使用量",
        icon: HardDrive,
        renderValue: (data) => {
            const total = data?.totalSite ?? '--';
            const disk = data?.diskUsed ?? '--';
            return `${total} / ${disk} KB`;
        }
    },
    {
        key: "uptime",
        label: "上次重启 / 首次上线时间",
        icon: Server,
        animateValue: false,
        // 首次上线时间为固定值（该字段暂无接口），保持写死展示
        renderValue: (data) => `${fmtDateTime(data?.serverStartTime)}<br/>2026-08-18 21:18`
    },
    {
        key: "backup",
        label: "上次落库 / 备份时间",
        icon: Clock3,
        compact: true,
        animateValue: false,
        renderValue: (data) => `${fmtDateTime(data?.lastSavedTime)}<br/>${fmtDateTime(data?.lastBackupTime)}`
    }
];


// ==================== Store ====================

interface ServerStatusState {
    // 最新的设备/服务器数据
    deviceData: DeviceData | null;
    // 是否正在请求中
    loading: boolean;
    // 错误信息
    error: Error | null;
    // 主动拉取一次数据
    fetchDeviceData: () => Promise<void>;
}

export const useServerStatusStore = create<ServerStatusState>((set) => ({
    deviceData: null,
    loading: false,
    error: null,
    fetchDeviceData: async () => {
        set({ loading: true, error: null });
        try {
            const res = await device();
            set({ deviceData: res, loading: false });
        } catch (err) {
            set({ error: err as Error, loading: false });
        }
    },
}));


// ==================== Hook：轮询拉取数据 ====================

// 开启对服务器状态的轮询，默认每 6 秒拉取一次。
// 在组件卸载时自动清理定时器。
export function useDevicePolling(intervalMs = 6000) {
    const fetchDeviceData = useServerStatusStore((s) => s.fetchDeviceData);

    useEffect(() => {
        fetchDeviceData();
        const timer = setInterval(fetchDeviceData, intervalMs);
        return () => clearInterval(timer);
    }, [fetchDeviceData, intervalMs]);
}


// ==================== Hook：计算指标 UI 数据 ====================

export interface MetricUIItem {
    label: string;
    icon: IconType;
    compact?: boolean;
    animateValue?: boolean;
    value: string;
}

// 根据当前设备数据计算所有指标的展示内容。
export function useMetricsUI(): MetricUIItem[] {
    const deviceData = useServerStatusStore((s) => s.deviceData);

    return useMemo(
        () =>
            metricsConfig.map((config) => ({
                label: config.label,
                icon: config.icon,
                compact: config.compact,
                animateValue: config.animateValue,
                value: config.renderValue(deviceData),
            })),
        [deviceData]
    );
}
