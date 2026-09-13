import { usePageMeta } from "@/hooks/use-page-meta";

import DashboardHeader from "./views/DashboardHeader";
import OverviewCards from "./views/OverviewCards";
import PerfEnvSection from "./views/PerfEnvSection";
import SourceAnalysis from "./views/SourceAnalysis";
import TrendAnalysis from "./views/TrendAnalysis";

export default function Stats() {
    usePageMeta({
        title: "统计 - 查看接入站点的统计信息",
        description: "查看接入 Jekit 的站点实时数据：访问量趋势、来源构成、性能指标与运行环境。",
    });
    return (
        <>
            <DashboardHeader />
            <OverviewCards />
            <PerfEnvSection />
            <SourceAnalysis />
            <TrendAnalysis />
        </>
    );
}