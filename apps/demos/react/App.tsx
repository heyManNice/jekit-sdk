import { useJekit } from 'jekit-react';

export function App() {
    const jekit = useJekit();
    return (
        <>
            <p>网站总访问量: {jekit.sitePv} 次</p>
            <p>网站总访客数: {jekit.siteUv} 人</p>
            <p>页面总访问量: {jekit.pagePv} 次</p>
            <p>页面总访客数: {jekit.pageUv} 人</p>
            <p>今日网站总访问量: {jekit.sitePvToday} 次</p>
            <p>今日网站总访客数: {jekit.siteUvToday} 人</p>
            <p>今日页面总访问量: {jekit.pagePvToday} 次</p>
            <p>今日页面总访客数: {jekit.pageUvToday} 人</p>
        </>
    )
}