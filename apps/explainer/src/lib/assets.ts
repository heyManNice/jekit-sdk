// 素材直接复用文档站的图片，不在视频工程里另存一份
import jekitLogo from '../../../docs/src/images/jekit.webp';

import chatgpt from '../../../docs/src/images/brands/chat-gpt.svg';
import claude from '../../../docs/src/images/brands/claude.svg';
import deepseek from '../../../docs/src/images/brands/deepseek.svg';
import gemini from '../../../docs/src/images/brands/gemini.svg';
import kimi from '../../../docs/src/images/brands/kimi.svg';
import doubao from '../../../docs/src/images/brands/doubao.svg';
import yuanbao from '../../../docs/src/images/brands/yuanbao.svg';
import copilot from '../../../docs/src/images/brands/copilot.svg';
import perplexity from '../../../docs/src/images/brands/perplexity.svg';
import grok from '../../../docs/src/images/brands/grok.svg';
import qwen from '../../../docs/src/images/brands/qwen.svg';
import wenxin from '../../../docs/src/images/brands/wenxin.svg';
import spark from '../../../docs/src/images/brands/spark.svg';

import google from '../../../docs/src/images/brands/google.svg';
import bing from '../../../docs/src/images/brands/bing.svg';
import baidu from '../../../docs/src/images/brands/baidu.svg';
import direct from '../../../docs/src/images/brands/direct.svg';

import chrome from '../../../docs/src/images/brands/chrome.svg';
import edge from '../../../docs/src/images/brands/edge.svg';
import safari from '../../../docs/src/images/brands/safari.svg';
import firefox from '../../../docs/src/images/brands/firefox.svg';
import wechat from '../../../docs/src/images/brands/wechat.svg';

import windows from '../../../docs/src/images/brands/windows.svg';
import macos from '../../../docs/src/images/brands/macos.svg';
import android from '../../../docs/src/images/brands/android.svg';
import ios from '../../../docs/src/images/brands/ios.svg';
import linux from '../../../docs/src/images/brands/linux.svg';
import hmos from '../../../docs/src/images/brands/hmos.svg';

export { jekitLogo };

export type Brand = { name: string; icon: string };

export const aiBrands: Brand[] = [
    { name: 'ChatGPT', icon: chatgpt },
    { name: 'DeepSeek', icon: deepseek },
    { name: 'Claude', icon: claude },
    { name: 'Gemini', icon: gemini },
    { name: 'Kimi', icon: kimi },
    { name: '豆包', icon: doubao },
    { name: '元宝', icon: yuanbao },
    { name: 'Copilot', icon: copilot },
    { name: 'Perplexity', icon: perplexity },
    { name: 'Grok', icon: grok },
    { name: '通义千问', icon: qwen },
    { name: '文心一言', icon: wenxin },
    { name: '讯飞星火', icon: spark },
];

export const icons = {
    chatgpt,
    deepseek,
    doubao,
    kimi,
    google,
    bing,
    baidu,
    direct,
    chrome,
    edge,
    safari,
    firefox,
    wechat,
    windows,
    macos,
    android,
    ios,
    linux,
    hmos,
} as const;
