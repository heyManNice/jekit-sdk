import { Link } from "react-router";
import { ArrowRight, ChartSpline } from "lucide-react";
import { Integrations } from "@/views/integrations";
import { Features } from "@/views/features";
import { AnimatedMetricValue } from "@/components/animated-metric-value";
import { GlowCard } from "@/components/glow-card";
import { useDevicePolling, useMetricsUI } from "@/stores/server-status";

import bgEarth from "@/images/bg-earth.webp";
import jekit from "@/images/jekit.webp";
import { homeStructuredData } from "@/utils/structured-data";

// 强调文本
function H(props: {
    children: React.ReactNode
}) {
    return (
        <span className="text-[#01F2E0]">{props.children}</span>
    );
}

// 英雄
function Hero() {
    return (
        <section className="relative px-3 max-sm:px-5">
            <div className="pt-10 pb-6 flex-1 max-w-md relative z-10 max-sm:mx-auto max-sm:text-center">
                {/* 标题 */}
                <GlowCard className="inline-block px-3 py-2 rounded text-xs bg-linear-to-r from-[#14D6E9]/20 to-[#00F8DB]/20" tabIndex={-1} aria-label="Jekit 是免费、开源、隐私友好的网站统计工具">
                    <span className="text-primary">
                        Jekit&nbsp;
                    </span>
                    /&nbsp;免费的网站访问统计工具
                </GlowCard>

                {/* 主要标题 */}
                <h1 className="text-5xl font-extrabold leading-tight mt-3" tabIndex={-1} aria-label="极简统计，为开发者而生">
                    <span className="bg-linear-to-r from-[#02ffff] to-[#ffffff] bg-clip-text text-transparent font-extrabold">
                        极简统计，
                    </span>
                    <br />
                    <span>
                        为开发者而生
                    </span>
                </h1>

                {/* 详细信息 */}
                <p className="text-[#A7AFBB] mt-3 leading-loose" tabIndex={-1} aria-label="Jekit 是免费、开源、无 Cookie 的网站访问统计工具，可以通过 CDN、NPM、Vue 或 React 快速接入，查看访问量、访客数、来源渠道和网站性能指标。">
                    <img src={jekit} className="inline" alt="Jekit" style={{ height: '20px' }} /> 是免费、开源、无 Cookie 的网站访问统计工具，可以通过 <H>CDN</H>、<H>NPM</H>、<H>Vue</H> 或 <H>React</H> 快速接入，查看访问量、访客数、来源渠道（<H>搜索引擎</H>、<H>AI</H>）和网站性能指标（<H>TTFB</H>、<H>PLT</H>）。
                </p>

                {/* 两个按钮 */}
                <div className="mt-8 flex gap-6 max-sm:justify-center">
                    <Link data-main-content="true" aria-label="快速开始" to="/docs/guide/ai/" className="flex hover:scale-110 transition-all cursor-pointer items-center gap-2 bg-linear-to-r from-[#14D6E9] to-[#00F8DB] text-black px-4 py-2 rounded-md">
                        <span>快速开始</span>
                        <ArrowRight size={18} />
                    </Link>
                    <Link to="/stats/" aria-label="统计面板" className="flex  hover:scale-110 hover:bg-[#00F8DB] hover:text-black transition-all cursor-pointer items-center gap-2 border border-[#00F8DB]/20 px-4 py-2 rounded-md">
                        <span>统计面板</span>
                        <ChartSpline size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// 服务器实时运行状态
function ServerStatus() {
    useDevicePolling();
    const metricsUI = useMetricsUI();

    return (
        // 读屏只认纯文本，所以这里用 m.lines（纯文本行）拼接，用「，」代替视觉上的换行
        <section className="max-sm:px-5" tabIndex={-1} aria-label={"服务器运行状态面板：" + metricsUI.map(m => `指标 ${m.label.split('/').join('与')}的值是${m.lines.join('，')}`).join("，")}>
            {/* 区块标题 */}
            <p className="mb-4 text-md font-semibold tracking-wide text-[#dff9ff] max-md:text-center px-3">
                Jekit 官方服务器状态
            </p>

            {/* 指标面板 */}
            <div className="relative overflow-hidden rounded-xl bg-[#011122]/30 backdrop-blur-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                    {metricsUI.map((item) => {
                        const Icon = item.icon;
                        return (
                            <GlowCard
                                key={item.label}
                                className="min-h-24 px-5 py-4 border-r border-b border-[#083142]/65 last:border-r-0 nth-5:border-r-0 lg:nth-10:border-r-0 lg:nth-[n+6]:border-b-0"
                            >
                                {/* 图标和标签 */}
                                <div className="mb-2 flex items-center gap-2 text-xs text-[#9ac3ce]">
                                    <Icon size={14} className="text-primary shrink-0" />
                                    <span>{item.label}</span>
                                </div>
                                {/* 数值 */}
                                <div className={"text-[#ecffff] font-semibold leading-tight"}>
                                    <AnimatedMetricValue
                                        lines={item.lines}
                                        shouldAnimate={item.animateValue !== false}
                                    />
                                </div>
                            </GlowCard>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

import { usePageMeta } from "@/hooks/use-page-meta";
export default function Index() {
    // 首页沿用 utils/meta.ts 里的默认描述
    usePageMeta({
        title: "免费、开源、隐私友好的网站统计工具 | Jekit",
        announcement: "Jekit 首页",
        structuredData: homeStructuredData(),
    });
    return (
        <div className="bg-no-repeat bg-position-[right_0px_top_-72px] bg-size-[950px]" style={{
            backgroundImage: `url(${bgEarth})`,
        }}>
            <Hero />
            <ServerStatus />
            <Features />
            <Integrations />
        </div>
    );
}
