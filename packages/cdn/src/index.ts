import { CdnJekit } from "./cdn-jekit";

if (typeof window !== 'undefined') {
    const run = () => {
        new CdnJekit();
    };
    // 等待 DOM 就绪后再初始化，确保查找 class 的元素存在
    if (document.readyState === 'complete') {
        run();
    } else {
        window.addEventListener('load', run);
    }
}