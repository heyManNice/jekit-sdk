import { usePageMeta } from "@/hooks/use-page-meta";

import DashboardHeader from "./views/DashboardHeader";
import OverviewCards from "./views/OverviewCards";
import PerfEnvSection from "./views/PerfEnvSection";
import SourceAnalysis from "./views/SourceAnalysis";
import TrendAnalysis from "./views/TrendAnalysis";
import { statsStructuredData } from "@/utils/structured-data";
import { useStatsDashboard } from "./model/use-stats-dashboard";

export default function Stats() {
    const dashboard = useStatsDashboard();

    usePageMeta({
        title: "网站访问统计查询 | Jekit",
        announcement: "网站统计查询",
        description: "查看接入 Jekit 的站点实时数据：访问量趋势、来源构成、性能指标与运行环境。",
        structuredData: statsStructuredData(),
    });
    return (
        <>
            <DashboardHeader
                query={dashboard.query}
                history={dashboard.history}
                stats={dashboard.overview.data}
                onSearch={dashboard.submitQuery}
                onRemoveHistory={dashboard.removeHistory}
                onClearHistory={dashboard.clearHistory}
            />
            <OverviewCards
                resource={dashboard.overview}
                path={dashboard.query.path}
            />
            <PerfEnvSection
                performanceResource={dashboard.performance}
                browserResource={dashboard.browserSource}
                osResource={dashboard.osSource}
            />
            <SourceAnalysis resource={dashboard.searchSource} />
            <TrendAnalysis query={dashboard.query} refreshToken={dashboard.refreshToken} />
        </>
    );
}
