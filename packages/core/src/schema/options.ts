
export enum visitorStatusOption {
    NewUser_TodayNewSite_TodayNewPage = 1,  // 新用户，今天访问了一个新站点的一个新页面
    ExistingUser_TodayNewSite_TodayNewPage, // 老用户，今天访问了一个新站点的一个新页面
    ExistingUser_ExistingSite_TodayNewPage, // 老用户，今天访问了一个已有的站点的一个新页面
    ExistingUser_ExistingSite_ExistingPage, // 老用户，今天访问了一个已有的站点的一个已有页面
}

export enum whereWasIFromOption {
    Other = 1,
    Direct,
    Bing,
    Google,
    Baidu,
    Doubao,
    Copilot,
    Claude,
    ChatGPT,
    DeepSeek,
    Perplexity,
    Grok,
    Gemini,
    Kimi,
    Yuanbao,
    Sogou,
    Search360,
    Brave,
    DuckDuckGo,
    Yandex,
    Wenxin,
    Qwen,
    Spark,
};

export enum whichBrowserOption {
    Other = 1,
    Chrome,
    Edge,
    Safari,
    Firefox,
    Opera,
    WeChat,
    Browser360
}

export enum whichOsOption {
    Other = 1,
    Windows,
    MacOS,
    Linux,
    Android,
    iOS,
    HarmonyOS
}

export enum dimensionOption {
    SearchEngine = 1,
    Browser,
    OS,
}

export enum rangeOption {
    Daily = 1,
    Monthly,
    Yearly,
}

export enum metricOption {
    totalUserForSite = 1, // 网站用户总数
    totalRequestForSite,  // 网站请求总数
    totalRequestForPage,  // 页面请求总数
    totalVisitorForSite,  // 网站访客总数
    totalVisitorForPage,  // 页面访客总数
    // 今日的指标
    todayRequestForSite, // 网站今日请求数
    todayRequestForPage, // 页面今日请求数
    todayVisitorForSite, // 网站今日访客数
    todayVisitorForPage, // 页面今日访客数

    // 来源选项指标
    // 来源类型需要配合 dimensionValue 字段请求
    totalRequestFromForSite, // 网站某个来源总请求数
    totalRequestFromForPage, // 页面某个来源总请求数
    todayRequestFromForSite, // 网站某个来源今日请求数
    todayRequestFromForPage, // 页面某个来源今日请求数

    // 浏览器选项指标
    totalRequestFromBrowserForSite, // 网站某浏览器总请求数
    totalRequestFromBrowserForPage, // 页面某浏览器总请求数
    todayRequestFromBrowserForSite, // 网站某浏览器今日请求数
    todayRequestFromBrowserForPage, // 页面某浏览器今日请求数

    // 操作系统选项指标
    totalRequestFromOSForSite, // 网站某操作系统总请求数
    totalRequestFromOSForPage, // 页面某操作系统总请求数
    todayRequestFromOSForSite, // 网站某操作系统今日请求数
    todayRequestFromOSForPage, // 页面某操作系统今日请求数
}

export enum scopeOption {
    Site = 1,
    Page
}