<p align="center">
  <a href="https://jekit.cn" target="_blank">
    <img height="180" src="./apps/docs/public/images/slogan.webp" alt="Jekit slogan">
  </a>
</p>

Jekit 是一个免费的公共统计基础工具，支持 CDN 引入、NPM 引入，支持 Vue 、React。支持公开查看基础计数、历史趋势、来源渠道（搜索引擎、AI ）、操作系统类别、浏览器类别和网站性能指标（ TTFB、PLT ）。

# 使用教程
请前往 [Jekit 文档网站](https://jekit.cn) 查看。下方内容均不是把 Jekit 按照到你的网站的教程。

# jekit-sdk

## 仓库结构

本仓库使用 npm workspaces 管理所有子项目，依赖统一安装在仓库根目录，并且只维护根目录的一份 `package-lock.json`。

```text
packages/       可发布的 Core、CDN、Vue、React SDK
apps/docs/      文档与统计面板
apps/demos/     CDN、Vue、React 接入示例
functions/      独立部署的边缘函数
tools/          全仓库共用的构建工具
```

安装全部子项目依赖：

```bash
npm install
```

## 开发与验证

- 启动文档站开发环境

```bash
npm run dev
```

- 检查全仓库（lint、类型检查和测试）

```bash
npm run check
```

- 构建文档

```bash
npm run docs
# 输出目录在 apps/docs/dist
```

- 构建所有 packages

```bash
npm run packages
# 输出目录在 packages/*/dist
```

- 构建全部正式产物和 demos

```bash
npm run build
```

- 完整检查并构建全部子项目

```bash
npm run all
```

## 版本号规则
- `apps/docs` 为线上实时更新，没有版本号记录  
- `packages/core` 的版本号在根目录 `package.json` 中，为两位长度。`core` build 之后会在第三位自动补0。语义为`<不兼容更新>.<兼容更新>`  
- `packages` 中的其他子包的版本号都只有一位长度，build 的时候会自动拼接为 `<core版本>.<子包版本>`，当 core 版本更新时，子包版本不需要归零，持续自增。
