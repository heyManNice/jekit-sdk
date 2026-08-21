import Unknown from "@/images/brands/unknown.svg";

import Safari from "@/images/brands/safari.svg";
import Edge from "@/images/brands/edge.svg";
import Firefox from "@/images/brands/firefox.svg";
import Chrome from "@/images/brands/chrome.svg";
import Opera from "@/images/brands/opera.svg";
import WeChat from "@/images/brands/wechat.svg";
import Browser360 from "@/images/brands/browser-360.svg";

import Windows from "@/images/brands/windows.svg";
import MacOS from "@/images/brands/macos.svg";
import Android from "@/images/brands/android.svg";
import IOS from "@/images/brands/ios.svg";
import Linux from "@/images/brands/linux.svg";
import HMOS from "@/images/brands/hmos.svg";


import Direct from "@/images/brands/direct.svg";
import Google from "@/images/brands/google.svg";
import Baidu from "@/images/brands/baidu.svg";
import Bing from "@/images/brands/bing.svg";
import Doubao from "@/images/brands/doubao.svg";
import Copilot from "@/images/brands/copilot.svg";
import Claude from "@/images/brands/claude.svg";
import ChatGPT from "@/images/brands/chat-gpt.svg";
import DeepSeek from "@/images/brands/deepseek.svg";
import Perplexity from "@/images/brands/perplexity.svg";
import Grok from "@/images/brands/grok.svg";
import Gemini from "@/images/brands/gemini.svg";
import Kimi from "@/images/brands/kimi.svg";
import Yuanbao from "@/images/brands/yuanbao.svg";
import Sogou from "@/images/brands/sogou.svg";
import Search360 from "@/images/brands/search-360.svg";
import Brave from "@/images/brands/brave.svg";
import DuckDuckGo from "@/images/brands/duck-duck-go.svg";
import Yandex from "@/images/brands/yandex.svg";
import Wenxin from "@/images/brands/wenxin.svg";
import Qwen from "@/images/brands/qwen.svg";
import Spark from "@/images/brands/spark.svg";

import Other from "@/images/brands/other.svg";

const BrandIcons = {
    Safari,
    Edge,
    Firefox,
    Chrome,
    Opera,
    WeChat,
    Browser360,

    Windows,
    MacOS,
    Android,
    IOS,
    Linux,
    HMOS,

    Direct,
    Google,
    Baidu,
    Bing,
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
    Other,
};

export function getBrandIconSrc(name: string) {
    return BrandIcons[name as keyof typeof BrandIcons] || Unknown;
}
