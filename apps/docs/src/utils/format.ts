// 通用时间戳格式化工具。
// 约定：入参均为 unix 毫秒时间戳（bigint / number），
// 内部统一用 Number(ts) 转成 Date（与原有各实现保持一致）。

const pad = (n: number) => String(n).padStart(2, "0");

// 时间戳 → YYYY-MM-DD；ts 为空时返回 fallback（默认 "----------"）
export function fmtDate(
    ts: bigint | number | null | undefined,
    fallback = "----------",
): string {
    if (!ts) return fallback;
    const d = new Date(Number(ts));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 时间戳 → YYYY-MM-DD HH:mm；ts 为空时返回 "--"
export function fmtDateTime(ts: bigint | number | null | undefined): string {
    if (!ts) return "--";
    const d = new Date(Number(ts));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 时间戳 → MM-DD（趋势图 x 轴标签用）
export function fmtMonthDay(ts: bigint | number): string {
    const d = new Date(Number(ts));
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
