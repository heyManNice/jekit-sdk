---
title: 你喜爱的 Badge
---

## 这是什么？

Jekit Badge 可以把公开的统计数据生成为 SVG 徽章，适合放在网站、项目主页或者 README 中。
无需注册，也不需要额外创建令牌，只需要提供已经接入 Jekit 的网站地址。

![Jekit 站点访问量](https://badge.jekit.cn/flat/pv?url=https://jekit.cn/stats/)

## 如何使用？

Badge 地址由样式、指标和需要查询的网站 URL 组成：

```text
https://badge.jekit.cn/样式/指标?url=网站或页面地址
```

例如，查看 `https://jekit.cn/stats/` 所属站点的总访问量：

```text
https://badge.jekit.cn/flat/pv?url=https://jekit.cn/stats/
```

在 Markdown 中直接作为图片使用：

```text
![Jekit 站点访问量](https://badge.jekit.cn/flat/pv?url=https://jekit.cn/stats/)
```

在 HTML 中使用：

```html
<img
    src="https://badge.jekit.cn/flat/pv?url=https://jekit.cn/stats/"
    alt="Jekit 站点访问量"
>
```

## 选择一个指标

`PV` 表示访问量，`UV` 表示访客数。`p` 前缀表示当前页面，`t` 前缀表示今日。

| 指标 | 显示内容 |
| --- | --- |
| `pv` | 站点总访问量 |
| `ppv` | 当前页面总访问量 |
| `uv` | 站点总访客数 |
| `puv` | 当前页面总访客数 |
| `tpv` | 站点今日访问量 |
| `tppv` | 当前页面今日访问量 |
| `tuv` | 站点今日访客数 |
| `tpuv` | 当前页面今日访客数 |
| `ttfb` | 站点今日 TTFB P75 |
| `plt` | 站点今日 PLT P75 |

查询页面指标时，请在 `url` 中提供完整的页面地址：

```text
https://badge.jekit.cn/flat/ppv?url=https://jekit.cn/stats/
```

## 选择一个样式

Badge 提供四种与主流徽章一致的样式：

### - flat

默认样式，带有圆角和轻微渐变。

![flat](https://badge.jekit.cn/flat/pv?url=https://jekit.cn/stats/)

### - flat-square

与 flat 接近，但是使用直角边缘。

![flat-square](https://badge.jekit.cn/flat-square/pv?url=https://jekit.cn/stats/)

### - plastic

带有更明显的高光和立体效果。

![plastic](https://badge.jekit.cn/plastic/pv?url=https://jekit.cn/stats/)

### - for-the-badge

尺寸更大，文字使用粗体并增加间距。

![for-the-badge](https://badge.jekit.cn/for-the-badge/pv?url=https://jekit.cn/stats/)

## 性能指标是什么？

- `TTFB` 是首字节时间，表示从发出请求到收到服务器响应第一个字节的耗时。
- `PLT` 是页面加载时间，表示页面完成加载所需要的总耗时。
- 两个指标分别展示，不会合并为一个数值。
- 性能 Badge 使用当天采集到的站点数据，不区分具体页面。
- `P75` 表示 75% 的有效访问耗时不超过当前显示值。
- SPA 虚拟路由和采集失败的数据会自动排除；当天没有有效数据时显示“无数据”。

```text
https://badge.jekit.cn/flat/ttfb?url=https://jekit.cn/stats/
https://badge.jekit.cn/flat/plt?url=https://jekit.cn/stats/
```

## URL 应该怎么填写？

- URL 的填写方式与 [统计面板](/stats/) 一致，可以填写域名，也可以填写带路径的完整页面地址。
- 可以省略协议，省略时默认按照 `https://` 查询。
- 页面地址中的查询参数会按照 Jekit 的页面标识规则处理。
- `url` 必须是 Badge 地址中唯一的查询参数，它后面的内容都会被视为目标页面地址。
- 如果页面使用 hash 路由，请将 `#` 写成 `%23`，防止浏览器把它识别成 Badge 地址自身的锚点。

例如，下面两个地址查询的是同一个页面：

```text
https://badge.jekit.cn/flat/ppv?url=https://jekit.cn/stats/
https://badge.jekit.cn/flat/ppv?url=jekit.cn/stats/
```

## 为什么 Badge 显示无数据？

- 网站需要先接入 Jekit，并且至少被正常访问一次。
- 页面指标需要填写完整页面地址，确保路径与实际访问的页面一致。
- TTFB 和 PLT 只使用当天的有效性能记录，没有有效记录时会显示“无数据”。
- Badge 会缓存一小时，刚产生的数据可能不会立即显示。
