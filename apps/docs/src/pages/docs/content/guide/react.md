---
title: React 引入
---

## 如何使用？
- 安装依赖
```bash
npm install jekit-react
```

- 在组件中使用
```tsx
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
```

## 设置默认值

在 `useJekit` 函数中传递第一个参数，设置数据未加载成功时显示的默认值。
```tsx
const jekit = useJekit('----');
```

## 请求错误值
当请求发生错误时所有指标的值为 ```Err``` 