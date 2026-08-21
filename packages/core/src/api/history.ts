import {
    dto,
    vto,
    type headers,
} from "../schema/history";
import {
    defineBuffer,
    fetchArrayResponse,
} from "../utils/io";

import {
    whereWasIFromOption,
    whichBrowserOption,
    whichOsOption,
    rangeOption,
    metricOption
} from "../schema/options";

import { fnv1a32 } from "../utils/hash";

// 查询站点某个指标的历史数据
export async function history(props: {
    domain: string;
    path: string;
    range: rangeOption;
    metric: metricOption;
    dimensionValue: whereWasIFromOption | whichBrowserOption | whichOsOption;
}) {
    const reqBuf = defineBuffer(dto, {
        theHashOfPath: fnv1a32(props.path),
        range: props.range,
        metric: props.metric,
        dimensionValue: props.dimensionValue
    });
    const res = await fetchArrayResponse(vto, {
        target: '/history',
        headers: {
            "x-query-domain": props.domain,
        } satisfies headers,
        buffer: reqBuf,
    });
    return res;
}
