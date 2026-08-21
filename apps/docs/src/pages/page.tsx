import { Link } from "react-router";
import { ArrowRight, ChartSpline } from "lucide-react";
import { Integrations } from "@/views/integrations";
import { Features } from "@/views/features";
import { AnimatedMetricValue } from "@/components/animated-metric-value";
import { GlowCard } from "@/components/glow-card";
import { useDevicePolling, useMetricsUI } from "@/stores/server-status";

import bgEarth from "@/images/bg-earth.webp";
import jekit from "@/images/jekit.webp";

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
                <GlowCard className="inline-block px-3 py-2 rounded text-xs bg-linear-to-r from-[#14D6E9]/20 to-[#00F8DB]/20" tabIndex={-1} aria-label="Jekit是免费的公共统计基础工具">
                    <span className="text-primary">
                        Jekit&nbsp;
                    </span>
                    /&nbsp;免费的公共统计基础工具
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
                <p className="text[#A7AFBB] mt-3 leading-loose" tabIndex={-1} aria-label="Jekit 是一个免费的公共统计基础工具，支持 CDN 引入、NPM 引入，支持 Vue 、React。支持公开查看基础计数、历史趋势、来源渠道（搜索引擎和 AI ）、操作系统类别、浏览器类别和网站性能指标（ TTFB 和 PLT ）。">
                    <img src={jekit} className="inline" alt="jekit" style={{ height: '20px' }} /> 是一个免费的公共统计基础工具，支持 <H>CDN</H> 引入、<H>NPM</H> 引入，支持 <H>Vue</H> 、<H>React</H>。支持公开查看基础计数、历史趋势、来源渠道（<H>搜索引擎</H>、<H>AI</H> ）、操作系统类别、浏览器类别和网站性能指标（ <H>TTFB</H>、<H>PLT</H> ）。
                </p>

                {/* 两个按钮 */}
                <div className="mt-8 flex gap-6 max-sm:justify-center">
                    <Link data-main-content="true" aria-label="快速开始" to="/docs/guide/ai/" className="flex hover:scale-110 transition-all cursor-pointer items-center gap-2 bg-linear-to-r from-[#14D6E9] to-[#00F8DB] text-black px-4 py-2 rounded-md">
                        <span>快速开始</span>
                        <ArrowRight size={18} />
                    </Link>
                    <Link to="/stats/" aria-label="查看文档" className="flex  hover:scale-110 hover:bg-[#00F8DB] hover:text-black transition-all cursor-pointer items-center gap-2 border border-[#00F8DB]/20 px-4 py-2 rounded-md">
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
        <section className="max-sm:px-5" tabIndex={-1} aria-label={"服务器运行状态面板：" + metricsUI.map(m => `指标 ${m.label.split('/').join('与')}的值是${m.value.split('/').join('和')}`).join("，")}>
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
                                        value={item.value}
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

import { usePageTitle } from "@/hooks/use-page-title";
export default function Index() {
    usePageTitle("首页 - 查看 Jekit 的功能特性和服务器状态");
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