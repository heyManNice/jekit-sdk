// 数据导出工具（JSON / CSV / Excel）

export interface ExportRow {
    metric: string;
    data: { date: string; value: number }[];
}

// 触发浏览器下载
export function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 收集所有指标中出现过的日期（去重并升序）
function collectDates(rows: ExportRow[]): string[] {
    return [...new Set(rows.flatMap((r) => r.data.map((d) => d.date)))].sort();
}

// CSV 字段转义（含逗号 / 引号 / 换行时用双引号包裹）
function escapeCsv(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// 构建 CSV：第一列是日期，后续每列是一个指标
export function buildCsv(rows: ExportRow[]): string {
    const header = ["日期", ...rows.map((r) => r.metric)].map(escapeCsv).join(",");
    const body = collectDates(rows).map((date) => {
        const cells = [date];
        for (const r of rows) {
            const found = r.data.find((d) => d.date === date);
            cells.push(found ? String(found.value) : "");
        }
        return cells.map(escapeCsv).join(",");
    });
    return [header, ...body].join("\n");
}

// 生成简易 XLSX (HTML table 方式，Excel 可打开)
export function buildXlsHtml(rows: ExportRow[]): string {
    const head = `<tr><th>日期</th>${rows.map((r) => `<th>${r.metric}</th>`).join("")}</tr>`;
    const body = collectDates(rows).map((date) => {
        const cells = rows.map((r) => {
            const found = r.data.find((d) => d.date === date);
            return `<td>${found?.value ?? ""}</td>`;
        });
        return `<tr><td>${date}</td>${cells.join("")}</tr>`;
    });
    return `<html><head><meta charset="utf-8"><style>table,th,td{border:1px solid #333;border-collapse:collapse}th,td{padding:4px 8px;text-align:left}</style></head><body><table>${head}${body.join("")}</table></body></html>`;
}
