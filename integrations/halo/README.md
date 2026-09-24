# Jekit for Halo

Jekit 的 Halo 2.26+ 集成插件。插件将见客脚本（greeter）打包在 JAR 内，不依赖公共 CDN，也不需要部署 Umami 或额外数据库。

## 功能

- 安装并启用后自动采集主题页面访问数据
- Halo Console 中的只读统计页面
- 可添加到 Halo 仪表盘的今日 PV / UV 小部件
- 可选的文章正文前/正文后阅读量
- 可选的页脚站点指标
- 纯文本指标模板与三种样式预设

## 构建

需要 Java 21、Node.js 22.12+ 和 pnpm 10。

```powershell
cd integrations\halo
.\gradlew.bat clean build
```

Halo 插件版本由根目录 `package.json` 的两位版本和本目录 `gradle.properties` 中独立递增的 `haloRevision` 组成。根目录版本更新时，`haloRevision` 不重置。例如当前版本为 `1.5`、修订号为 `1`，构建产物位于：

```text
build/libs/plugin-jekit-halo-1.5.1.jar
```

构建任务不会启动 Docker。不要执行 `haloServer`，即可保持“本机只构建、远程 Halo 验证”的工作流。

## 安装验证

1. 进入 Halo Console 的“插件”页面。
2. 选择“安装”并上传构建的 JAR。
3. 启用“Jekit 统计”。
4. 打开插件设置，按需开启文章阅读量和页脚指标。
5. 从 Console 的“工具 / 访问统计”查看数据。

页脚显示依赖主题保留 `<halo:footer />`。文章阅读量的通用位置仅保证正文前或正文后；标题元信息区域需要主题专门适配。
