import { usePageTitle } from "@/hooks/use-page-title";

import DashboardHeader from "./views/DashboardHeader";
import OverviewCards from "./views/OverviewCards";
import PerfEnvSection from "./views/PerfEnvSection";
import SourceAnalysis from "./views/SourceAnalysis";
import TrendAnalysis from "./views/TrendAnalysis";

export default function Stats() {
    usePageTitle("统计 - 查看接入站点的统计信息");
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