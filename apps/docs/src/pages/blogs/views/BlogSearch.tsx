import { Search } from "lucide-react";
import { GlowCard } from "@/components/glow-card";

interface BlogSearchProps {
    value: string;
    onChange: (value: string) => void;
}

// 博客搜索栏
export default function BlogSearch({ value, onChange }: BlogSearchProps) {
    return (
        <GlowCard className="relative mb-6 rounded border border-[#102336] bg-[#03101C]/90 overflow-hidden max-md:w-full md:w-[90%] transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
            <input
                type="text"
                data-main-content="true"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="搜索文章标题、内容或标签..."
                className="w-full bg-transparent pl-4 pr-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
            />
            <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
        </GlowCard>
    );
}
