# Jekit Badge

将站点或页面的统计数据生成为 SVG 图片。

```text
/样式/指标?url=网站或页面网址
```

例如：

```text
http://localhost:3004/flat/pv?url=https://jekit.cn/stats/
http://localhost:3004/for-the-badge/tpuv?url=jekit.cn/stats/
```

URL 的输入规则与统计面板一致：可以省略协议，省略时按 `https://` 查询。页面标识保留 pathname、查询参数和路由 hash。例如：

```text
/flat/ppv?url=jekit.cn/stats/?id=1&doc=2
```

`url` 必须是 Badge 的唯一查询参数，它后面的 `&` 会被视为目标 URL 的内容。整体编码后的 URL 也可以使用。在浏览器或 Markdown 中传入 hash 时，需要将 `#` 写成 `%23`，避免它作为图片地址自身的 fragment 而不发送给服务端。

## 样式

参考 [Shields.io 样式](https://shields.io/badges)，使用本地 SVG 模板和中文、英文、数字宽度估算，不保证逐像素一致。

| 样式 | 外观 |
| --- | --- |
| `flat` | 20px 高，圆角，轻微渐变和文字阴影 |
| `flat-square` | 20px 高，直角，纯色 |
| `plastic` | 18px 高，圆角，高光渐变 |
| `for-the-badge` | 28px 高，直角，加粗、加字距，英文转大写 |

## 指标

`pv` 表示访问量，`uv` 表示访客数；默认查询站点累计值，`p` 前缀表示页面，`t` 前缀表示今日。

| 指标 | 标签 |
| --- | --- |
| `pv` | 站点PV |
| `ppv` | 页面PV |
| `uv` | 站点UV |
| `puv` | 页面UV |
| `tpv` | 今日站点PV |
| `tppv` | 今日页面PV |
| `tuv` | 今日站点UV |
| `tpuv` | 今日页面UV |

`/?url=...` 默认使用 `flat/pv`。完整路径允许一个末尾斜杠。

接口只接受表中的指标简写和 `url` 参数。完整的 stats 字段名及 `query` 参数不再识别。Badge 在自身目录维护 URL 解析逻辑，并参照统计面板保持一致。

支持 GET 和 HEAD。缺少参数、无效样式或指标、非 HTTP(S) 网址返回 400；路径结构错误返回 404；其他方法返回 405；上游查询失败返回 502。错误响应不缓存，成功 SVG 缓存一小时。

## 开发与验证

代码按职责组织：

```text
main.ts                        Worker 构建入口
dev.ts                         Bun 本地服务入口
src/
├─ config/options.ts           样式、指标、默认值及其派生类型
├─ badge/
│  ├─ render-svg.ts            SVG 布局与渲染
│  └─ text.ts                  XML 转义与文本宽度估算
├─ http/
│  ├─ parse-request.ts         URL 路径和参数解析
│  ├─ parse-target-url.ts      统计目标 URL 解析
│  └─ responses.ts             HTTP 响应构造
├─ runtime/
│  ├─ configure-fetch.ts       上游请求运行时配置
│  └─ worker-types.ts          Worker 运行时类型
└─ worker.ts                   请求处理流程
```

所有可选样式、指标、标签、stats 字段映射和对应类型均从 `src/config/options.ts` 派生。

在已安装依赖的 jekit-sdk 仓库中运行：

```sh
npm run dev
npm run typecheck
npm run build
npm test
```

测试命令自动构建，然后使用模拟统计接口验证构建产物，不请求线上服务。测试需要支持 TypeScript 类型擦除的 Node.js（22.6+）。
