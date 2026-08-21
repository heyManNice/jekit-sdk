import {
    dto,
    vto,
    type headers,
} from "../schema/source";
import {
    defineBuffer,
    fetchArrayResponse,
} from "../utils/io";

import {
    dimensionOption,
    scopeOption,
} from "../schema/options";

import { fnv1a32 } from "../utils/hash";

// 查询站点的维度数据（搜索引擎来源/浏览器/操作系统）
export async function source(props: {
    domain: string;
    path: string;
    scope: scopeOption;
    dimension: dimensionOption;
}) {
    const reqBuf = defineBuffer(dto, {
        dimension: props.dimension,
        theHashOfPath: fnv1a32(props.path),
        scope: props.scope,
    });
    const res = await fetchArrayResponse(vto, {
        target: '/source',
        headers: {
            "x-query-domain": props.domain,
        } satisfies headers,
        buffer: reqBuf,
    });
    return res;
}
