import { usePageMeta } from "@/hooks/use-page-meta";

import DashboardHeader from "./views/DashboardHeader";
import OverviewCards from "./views/OverviewCards";
import PerfEnvSection from "./views/PerfEnvSection";
import SourceAnalysis from "./views/SourceAnalysis";
import TrendAnalysis from "./views/TrendAnalysis";

export default function Stats() {
    usePageMeta({
        title: "网站访问统计查询 | Jekit",
        announcement: "网站统计查询",
        description: "查看接入 Jekit 的站点实时数据：访问量趋势、来源构成、性能指标与运行环境。",
    });
    return (
        <>
            <section className="px-3 pt-8 max-sm:px-5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                    网站访问统计查询
                </h1>
                <p className="mt-2 text-sm text-text-secondary">
                    输入已接入 Jekit 的网站地址，查看访问量趋势、来源渠道、运行环境和网站性能指标。
                </p>
            </section>
            <DashboardHeader />
            <OverviewCards />
            <PerfEnvSection />
            <SourceAnalysis />
            <TrendAnalysis />
        </>
    );
}
