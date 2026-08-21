import {
    vto,
    type headers
} from "../schema/performance";
import {
    fetchResponse,
} from "../utils/io";

// 获取服务器性能运行状态
export async function performance(props: {
    domain: string;
}) {
    const res = await fetchResponse(vto, {
        target: '/performance',
        headers: {
            "x-query-domain": props.domain,
        } satisfies headers,
        buffer: new ArrayBuffer(0),
    });
    return res;
}
