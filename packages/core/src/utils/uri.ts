// 已知的追踪字段
const BLACK_LIST = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'dclid', 'fbclid', 'msclkid', 'ttclid', 'twclid', 'click_id'];

// 获取干净的请求 URI（不包含已知的追踪参数）
export function getCleanRequestUri(): string {
    const path = window.location.pathname;
    let search = window.location.search;
    let hash = window.location.hash;

    if (search) {
        const searchParams = new URLSearchParams(search);
        let changed = false;
        BLACK_LIST.forEach(key => {
            if (searchParams.has(key)) {
                searchParams.delete(key);
                changed = true;
            }
        });
        if (changed) {
            search = searchParams.toString() ? `?${searchParams.toString()}` : '';
        }
    }

    if (hash) {
        if (hash.includes('?') || BLACK_LIST.some(badKey => hash.includes(badKey))) {
            const qIndex = hash.indexOf('?');

            if (qIndex !== -1) {
                const hashPath = hash.substring(0, qIndex);
                const hashParams = new URLSearchParams(hash.substring(qIndex + 1));
                BLACK_LIST.forEach(key => hashParams.delete(key));

                const cleanHashQuery = hashParams.toString();
                hash = cleanHashQuery ? `${hashPath}?${cleanHashQuery}` : hashPath;
            } else {
                const hashParams = new URLSearchParams(hash.substring(1));
                BLACK_LIST.forEach(key => hashParams.delete(key));

                const cleanHashStr = hashParams.toString();
                hash = cleanHashStr ? `#${cleanHashStr}` : '';
            }
        }
    }

    return `${path}${search}${hash}`;
}