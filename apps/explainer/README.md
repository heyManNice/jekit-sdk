# jekit-explainer

Jekit 功能讲解片工程，基于 [Remotion](https://www.remotion.dev/)，用 React 代码逐帧生成视频。

- 规格：1920×1080 · 30fps · H.264 · 约 60 秒
- 定位：逐个演示功能，适合官网、文档或分享时播放
- 品牌宣传片在 `apps/promo`，那是另一套纯静态页面，与本工程无关
- 配色沿用 `apps/docs/src/bootloader.css`，图片直接引用 `apps/docs/src/images`
- 协议字节、页面哈希、徽章 SVG 由仓库源码现场计算（`src/lib/jekit.ts`），协议或徽章改动后重新渲染即可同步

## 命令

在仓库根目录运行：

```bash
npm run explainer          # 打开 Remotion Studio，可逐帧预览、拖动时间轴
npm run render:explainer   # 输出 apps/explainer/out/jekit-promo.mp4 和 jekit-poster.png
```

也可以在本目录运行 `npm run dev`、`npm run render`、`npm run render:poster`、`npm run typecheck`。

首次渲染时，Remotion 会自动下载 Chrome Headless Shell。`out/` 目录已加入 `.gitignore`。

## 分镜

| # | 场景 | 文件 | 内容 |
| --- | --- | --- | --- |
| 1 | Hook | `scenes/Hook.tsx` | 常见统计工具带走的数据被逐个划掉 |
| 2 | 10 字节 | `scenes/TenBytes.tsx` | 原始信息在浏览器内降维为 7 个整数，编码为 10 字节 |
| 3 | DevTools | `scenes/DevTools.tsx` | Payload / Headers / Cookies 三处可自行核对 |
| 4 | 接入 | `scenes/Install.tsx` | `npm install` 加几行代码，页脚出现访问量 |
| 5 | 生态 | `scenes/Frameworks.tsx` | React · Vue · CDN · Halo · Core API |
| 6 | AI 来源 | `scenes/AiSources.tsx` | 13 个 AI 渠道环绕 Jekit |
| 7 | 面板 | `scenes/Dashboard.tsx` | 趋势、来源、性能 P75、浏览器与系统分布 |
| 8 | 徽章 | `scenes/Badge.tsx` | 一行 Markdown 在 README 中显示访问量 |
| 9 | AI 接入 | `scenes/AiInstall.tsx` | 基于 `llms.txt`，一句话让 AI 完成接入 |
| 10 | 片尾 | `scenes/Outro.tsx` | 特性标签 + Logo + jekit.cn |

节奏统一在 `src/Promo.tsx` 的 `SCENES` 中调整，总时长自动计算。Studio 的 `Scenes` 文件夹下可以单独预览每个分镜。

## 说明

- 面板、接入演示里的访问量为示意数据；协议字节和徽章是真实计算结果。
- 视频只引用 core 的纯函数模块（编码器、schema、哈希），不经过 `jekit-core` 入口，避免把 `fetch`、`history-events` 等浏览器副作用带进渲染进程。
- 字体按 `HarmonyOS Sans SC → PingFang SC → Microsoft YaHei → Noto Sans SC` 回退。不同机器渲染出的字形可能略有差异，需要像素级一致时可在 `public/` 放入字体，再通过 `@remotion/fonts` 加载。
- Remotion 可能提示 zod 版本不一致：根目录的 `eslint-plugin-react-hooks` 引入了 zod 4.6，Remotion 使用自带的 4.5，二者互不影响，不影响渲染。
