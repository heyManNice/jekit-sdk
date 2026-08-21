import {
    dto,
    vto,
    type headers,
} from "../schema/stats";
import {
    defineBuffer,
    fetchResponse,
} from "../utils/io";

import { fnv1a32 } from "../utils/hash";

// 查询站点的访问统计基本数据
export async function stats(props: {
    domain: string;
    path: string;
}) {
    const reqBuf = defineBuffer(dto, {
        theHashOfPath: fnv1a32(props.path),
    });
    const res = await fetchResponse(vto, {
        target: '/stats',
        headers: {
            "x-query-domain": props.domain,
        } satisfies headers,
        buffer: reqBuf,
    });
    return res;
}
