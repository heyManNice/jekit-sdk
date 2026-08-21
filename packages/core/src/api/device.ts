import {
    vto,
} from "../schema/device";
import {
    fetchResponse,
} from "../utils/io";

// 获取服务器设备运行状态
export async function device() {
    const res = await fetchResponse(vto, {
        target: '/device',
        headers: {},
        buffer: new ArrayBuffer(0),
    });
    return res;
}
