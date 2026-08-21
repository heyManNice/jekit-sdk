import {
    BookOpenText,
    Globe,
    ShieldCheck,
    Timer,
    Users,
} from "lucide-react";


export function Features() {
    const items = [
        {
            label: "完全免费",
            icon: ShieldCheck
        },
        {
            label: "无需注册",
            icon: Users
        },
        {
            label: "无广告",
            icon: Timer
        },
        {
            label: "SDK 开源",
            icon: BookOpenText
        },
        {
            label: "全球可用",
            icon: Globe
        }
    ];

    return (
        <section className="max-sm:px-5 mt-3">
            <div className="flex gap-x-7 gap-y-2 flex-wrap justify-center py-2">
                {items.map(item => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.label}
                            className={"flex items-center gap-3"}
                        >
                            <Icon size={12} color="#06D9D6" />
                            <span className="text-xs leading-none whitespace-nowrap">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
