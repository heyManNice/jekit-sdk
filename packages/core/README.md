# jekit-core

## 如何使用?

- 安装依赖
```bash
npm install jekit-core
```

- 按需导入接口
```typescript
import {
    greet,
    spaGreet,
    device,
    stats,
    history,
    source,
} from 'jekit-core';
```

- 按需导入枚举值
```typescript
import {
    whereWasIFromOption,
    whichBrowserOption,
    whichOsOption,
    dimensionOption,
    visitorStatusOption,
    rangeOption,
    metricOption,
    scopeOption,
} from 'jekit-core';
```

## 接口介绍
详细信息请查看接口TS类型定义
### - greet
上报信息并且获得最新网站的统计信息
### - spaGreet
上报信息并且获得最新网站的统计信息（支持SPA页面版本）
### - device
获取服务器的运行状态
### - stats
获取某个网站的基础指标
### - history
获取某个网站的某个指标的历史记录
### - source
或者某个网站或者某个网页的来源渠道数值