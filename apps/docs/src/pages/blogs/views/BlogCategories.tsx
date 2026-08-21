import { categories } from "../blog-data";

interface BlogCategoriesProps {
    active: string;
    onChange: (category: string) => void;
}

// 博客分类筛选标签
export default function BlogCategories({ active, onChange }: BlogCategoriesProps) {
    return (
        <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onChange(cat)}
                    className={`px-4 py-1.5 rounded text-sm cursor-pointer transition-colors border ${active === cat
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-[#081A2B] bg-[#03101C]/90 text-text-muted hover:text-text-primary"
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
