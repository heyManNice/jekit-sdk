import {
    dto,
    vto,
    type headers,
} from "../schema/stats";
import {
    defineBuffer,
    fetchResponse,
} from "../utils/io";
import { getHashOfPagePath } from "../utils/uri";

// 查询站点的访问统计基本数据
export async function stats(props: {
    domain: string;
    path: string;
}) {
    const reqBuf = defineBuffer(dto, {
        theHashOfPath: getHashOfPagePath(props.path),
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
