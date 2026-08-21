// 模块级标志：仅在用户首次进入网站时为 true。
// 跨布局切换保持状态，避免 AppLayout ↔ DocsLayout 切换时动画被跳过。
export let isFirstLoad = true;

export function markFirstLoadDone() {
    isFirstLoad = false;
}
