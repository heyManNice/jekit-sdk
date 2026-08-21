// 文档 / 博客内容加载骨架屏
export function ContentSkeleton() {
    return (
        <div className="content-skeleton">
            {/* 标题 */}
            <div className="skeleton-line skeleton-heading" />
            {/* 段落行 */}
            <div className="skeleton-line ml-auto" style={{ width: "30%" }} />
            <div className="skeleton-line" style={{ width: "100%" }} />
            <div className="skeleton-line" style={{ width: "92%" }} />
            <div className="skeleton-line" style={{ width: "78%" }} />
            {/* 代码块占位 */}
            <div className="skeleton-block" />
            {/* 更多段落 */}
            <div className="skeleton-line" style={{ width: "85%" }} />
            <div className="skeleton-line" style={{ width: "60%" }} />
            {/* 多个短行 */}
            <div className="skeleton-line" style={{ width: "45%" }} />
            <div className="skeleton-line" style={{ width: "70%" }} />
        </div>
    );
}
