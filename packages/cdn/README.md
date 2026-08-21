# jekit-cdn

## 如何使用?

- 在顶层 html 文件中引入脚本资源。然后在以下三种方案中任选其一使用。

```html
<script src="https://cdn.jekit.cn/1.3.2.js" async></script>
```

- **自动注入方案**: 在目标元素上添加对应的类名即可使用

```html
<div>
    网站总访问量<span class="jk-site-pv">Loading</span>次 <br>
    网站总访客数<span class="jk-site-uv">Loading</span>人 <br>
    页面总访问量<span class="jk-page-pv">Loading</span>次 <br>
    页面总访客数<span class="jk-page-uv">Loading</span>人 <br>
    今日网站总访问量<span class="jk-site-pv-today">Loading</span>次 <br>
    今日网站总访客数<span class="jk-site-uv-today">Loading</span>人 <br>
    今日页面总访问量<span class="jk-page-pv-today">Loading</span>次 <br>
    今日页面总访客数<span class="jk-page-uv-today">Loading</span>人 <br>
</div>
```

- **事件监听方案**：监听 jekitchange 事件
``` javascript
window.addEventListener('jekitchange', (event) => {
    const jekit = event.detail;
    console.log('jekitchange', jekit);
});
// jekit中的对象有
// sitePv 网站总访问量
// siteUv 网站总访客数
// pagePv 页面总访问量
// pageUv 页面总访客数
// sitePvToday 今日网站总访问量
// siteUvToday 今日网站总访客数
// pagePvToday 今日页面总访问量
// pageUvToday 今日页面总访客数

// 共有四个事件，他们返回的数据结构都一样
// jekitchange 状态变化
// jekitloading 加载中
// jekitready 加载完成
// jekiterror 加载失败
```

- **全局对象方案**：注意时机，脚本未加载完成时值为 undefined
``` javascript
const jekit = window._jekit;
console.log('jekit', jekit);
// jekit中的对象有
// sitePv 网站总访问量
// siteUv 网站总访客数
// pagePv 页面总访问量
// pageUv 页面总访客数
// sitePvToday 今日网站总访问量
// siteUvToday 今日网站总访客数
// pagePvToday 今日页面总访问量
// pageUvToday 今日页面总访客数
```

## 设置默认值
修改 ```<span class="jk-site-pv">----</span>``` 标签内的文本区域，设置数据未加载成功时显示的默认值。

## 请求错误值
当请求发生错误时所有指标的值为 ```Err``` 

## 查看统计信息面板

[点击这里](https://jekit.cn/stats/) 跳转到统计信息面板，你需要在该页面中手动输入你想要查询的域名。