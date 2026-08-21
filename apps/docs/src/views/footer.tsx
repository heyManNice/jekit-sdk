import { useJekit } from 'jekit-react';
import psb from '@/images/psb.webp';

// 页脚

export function Footer() {
    const jekit = useJekit();

    return (
        <footer className="text-sm text-text-muted pb-4 flex flex-col items-center justify-center gap-1 px-4 lg:flex-row lg:gap-2">
            <div className="flex items-center gap-2">
                <img className="inline" width={12} height={12} src={psb} />
                <a target="__blank" href="https://beian.mps.gov.cn/#/query/webSearch">{import.meta.env.VITE_POLICY_RECORD ?? '公安备案号信息未设置'}</a>
            </div>
            <span className="hidden lg:inline">-</span>
            <a target="__blank" href="https://beian.miit.gov.cn/">{import.meta.env.VITE_ICP_RECORD ?? 'ICP 备案号信息未设置'}</a>
            <span className="hidden lg:inline">-</span>
            <span className="flex items-center gap-2">
                <span>共 {jekit.sitePv} 次访问</span>
                <a target="__blank" href="https://jekit.cn">@见客统计</a>
            </span>
        </footer>
    );
}
