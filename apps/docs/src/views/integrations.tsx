import {
    ArrowRight,
    SquareArrowOutUpRight,
} from "lucide-react";
import vue from "@/images/vue.svg";
import react from "@/images/react.svg";
import { GlowCard } from "@/components/glow-card";
import {
    Link,
} from "react-router";

interface IntegrationItem {
    title: string;
    href: string;
    ariaLabel: string;
    subtitle: string;
    icon: React.ReactNode;
    snippet: React.ReactNode;
}

export function Integrations() {
    const items: IntegrationItem[] = [
        {
            title: "CDN 引入",
            href: "/docs/guide/cdn/",
            ariaLabel: "通过 CDN 引入 Jekit 教程",
            subtitle: "jekit-cdn",
            icon: <svg className="scale-125" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9348" width="23" height="23"><path d="M843.776 319.488l-323.072-189.44c-5.632-3.072-12.8-3.072-18.432 0L179.2 319.488c-5.632 3.072-8.704 9.216-8.704 15.36v378.368c0 6.144 3.584 12.288 8.704 15.36l323.072 189.44c5.632 3.072 12.8 3.072 18.432 0l323.072-189.44c5.632-3.072 8.704-9.216 8.704-15.36V335.36c0-6.656-3.072-12.288-8.704-15.872zM410.624 481.792c7.168-8.704 12.288-18.944 14.848-29.696h172.032c3.072 13.312 9.728 25.088 19.456 34.304l-89.088 154.112c-5.12-1.024-10.752-2.048-16.384-2.048-3.584 0-6.656 0.512-9.728 1.024L410.624 481.792z m101.888-282.624l104.448 183.808c-8.192 8.192-13.824 17.92-17.408 29.184H423.936c-3.584-10.752-9.728-20.48-17.408-28.672l105.984-184.32z m-286.72 496.128L334.848 506.88c6.144 1.536 12.288 2.56 18.432 2.56 8.704 0 16.384-1.536 24.064-4.096l40.448 70.144 46.592 80.896c-12.288 10.24-20.992 24.064-25.088 39.424l-213.504-0.512z m337.92-34.816l88.064-153.6c5.632 1.536 11.776 2.56 17.92 2.56s11.776-1.024 17.92-2.048l107.008 187.904H583.68c-3.584-13.312-10.24-25.088-19.968-34.816z m252.928-8.704l-93.696-164.864c27.648-27.648 29.184-72.704 2.56-102.4-14.336-15.872-34.304-24.576-55.296-24.576-6.144 0-12.288 1.024-17.92 2.56l-96.768-169.984 261.12 153.088v306.176zM206.848 345.6s244.736-143.36 263.68-154.112L371.2 362.496c-6.144-1.536-11.776-2.56-17.92-2.56-41.472 0-74.752 33.792-74.752 74.752 0 19.456 7.68 37.888 20.992 51.712l-93.184 161.28v-302.08h0.512z m304.64 536.576l-249.344-145.92H440.32c9.216 30.208 37.376 52.736 70.656 52.736s61.44-22.016 70.656-52.736h178.176l-248.32 145.92z" fill="#FF6A00" p-id="9349"></path></svg>,
            snippet: (
                <>
                    <span className="text-[#808080]">{'<'}</span>
                    <span className="text-[#4AD987]">script</span>
                    <span className="text-[#6cc2fc]"> src</span>
                    <span className="text-[#808080]">=</span>
                    <span className="text-[#6cc2fc]">"https://..." async</span>
                    <span className="text-[#808080]">{'></'}</span>
                    <span className="text-[#4AD987]">script</span>
                    <span className="text-[#d3d3d3]">{'>'}</span>
                </>
            )
        },
        {
            title: "Vue 支持",
            href: "/docs/guide/vue/",
            ariaLabel: "在 Vue 项目中使用 Jekit 教程",
            subtitle: "jekit-vue",
            icon: <img src={vue} alt="Vue" style={{ width: 23, height: 23 }} />,
            snippet: (
                <>
                    <span className="text-[#C586C0]">import</span>
                    <span className="text-[#FFB30E]"> {'{'} </span>
                    <span className="text-[#4AD987]">useJekit</span>
                    <span className="text-[#FFB30E]"> {'}'} </span>
                    <span className="text-[#4AD987]">from</span>
                    <span className="text-[#6cc2fc]"> "jekit-vue"</span>
                    <span className="text-[#d3d3d3]">;</span>
                </>
            )
        },
        {
            title: "React 支持",
            href: "/docs/guide/react/",
            ariaLabel: "在 React 项目中使用 Jekit 教程",
            subtitle: "jekit-react",
            icon: <img src={react} alt="React" style={{ width: 23, height: 23 }} />,
            snippet: (
                <>
                    <span className="text-[#C586C0]">import</span>
                    <span className="text-[#FFB30E]"> {'{'} </span>
                    <span className="text-[#4AD987]">useJekit</span>
                    <span className="text-[#FFB30E]"> {'}'} </span>
                    <span className="text-[#C586C0]">from</span>
                    <span className="text-[#6cc2fc]"> "jekit-react"</span>
                    <span className="text-[#d3d3d3]">;</span>
                </>
            )
        }
    ];

    return (
        <section className="max-sm:px-5 mt-8">
            <div className="mb-4 flex items-end justify-between gap-4 max-md:flex-col max-md:items-start px-3">
                <div>
                    <p className="mb-2 text-xs">多种接入方式</p>
                    <h2 className="text-md font-bold max-sm:text-xl">几行代码即可接入</h2>
                </div>
                <Link to="/docs/intro/what-this-is/" className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary max-md:ml-0">
                    <span>查看文档</span>
                    <ArrowRight size={16} />
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {items.map((item) => (
                    <Link key={item.title} to={item.href} aria-label={item.ariaLabel} className="group">
                        <GlowCard className="rounded overflow-hidden bg-[#011122]/50 p-3 flex flex-col gap-2 select-none">
                            <div className="flex items-center gap-5 text-sm font-medium text-[#dff9ff]">
                                <div className="flex p-2 items-center justify-center rounded bg-[#06D9D6]/5">
                                    {item.icon}
                                </div>
                                <div>
                                    <div>{item.title}</div>
                                    <div className="mt-1 text-xs text-text-secondary">{item.subtitle}</div>
                                </div>
                                <div className="ml-auto mr-2 text-text-secondary transition-colors group-hover:text-primary" title="查看详细信息">
                                    <SquareArrowOutUpRight size={18} />
                                </div>
                            </div>
                            <pre tabIndex={-1} className="mt-3 text-sm bg-[#022037]/30 p-1 rounded text-[#06D9D6] overflow-x-auto select-text">
                                {item.snippet}
                            </pre>
                        </GlowCard>
                    </Link>
                ))}
            </div>
        </section>
    );

}