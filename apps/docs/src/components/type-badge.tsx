interface TypeBadgeProps {
    label: string;
    color: string;
    className?: string;
}

// 文章类型彩色标签
export function TypeBadge({ label, color, className = "" }: TypeBadgeProps) {
    return (
        <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full ${className}`}
            style={{
                color,
                backgroundColor: `color-mix(in srgb, ${color} 9%, transparent)`,
            }}
        >
            {label}
        </span>
    );
}
