<p align="center">
  <a href="https://jekit.cn" target="_blank">
    <img height="180" src="./apps//docs/public/images/slogan.webp" alt="Jekit slogan">
  </a>
</p>

Jekit 是一个免费的公共统计基础工具，支持 CDN 引入、NPM 引入，支持 Vue 、React。支持公开查看基础计数、历史趋势、来源渠道（搜索引擎、AI ）、操作系统类别、浏览器类别和网站性能指标（ TTFB、PLT ）。

# 使用教程
请前往 [Jekit 文档网站](https://jekit.cn) 查看。下方内容均不是把 Jekit 按照到你的网站的教程。

# jekit-sdk

## 如何构建?
- 构建文档
```bash
npm run docs
# 输出目录在/app/docs/dist
```

- 构建所有 packages
```bash
npm run packages
# 输出目录在/packages/*/dist
```

- 构建全部
```bash
npm run all
# 输出目录在如上所述
```

## 版本号规则
- `apps/docs` 为线上实时更新，没有版本号记录  
- `packages/core` 的版本号在根目录 `package.json` 中，为两位长度。`core` build 之后会在第三位自动补0。语义为`<不兼容更新>.<兼容更新>`  
- `packages` 中的其他子包的版本号都只有一位长度，build 的时候会自动拼接为 `<core版本>.<子包版本>`，当 core 版本更新时，子包版本不需要归零，持续自增。