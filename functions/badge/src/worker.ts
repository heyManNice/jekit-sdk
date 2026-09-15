import { stats } from 'jekit-core';
import { renderBadgeSvg } from './badge/render-svg.ts';
import { BADGE_METRICS } from './config/options.ts';
import { parseBadgeRequest } from './http/parse-request.ts';
import {
    errorResponse,
    methodNotAllowedResponse,
    svgResponse,
} from './http/responses.ts';
import type { WorkerEnv, WorkerExecutionContext } from './runtime/worker-types.ts';

export default {
    async fetch(
        request: Request,
        _env: WorkerEnv,
        _context: WorkerExecutionContext,
    ): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/favicon.ico') {
            return new Response(null, { status: 404 });
        }
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return methodNotAllowedResponse();
        }

        const parsed = parseBadgeRequest(request);
        if (!parsed.ok) {
            return errorResponse(parsed.message, parsed.status);
        }

        const { style, metric, target } = parsed.value;
        const metricOption = BADGE_METRICS[metric];

        try {
            const result = await stats({
                domain: target.domain,
                path: target.path,
            });
            const svg = renderBadgeSvg(
                {
                    label: metricOption.label,
                    value: result[metricOption.statsKey].toString(),
                },
                { style },
            );

            return svgResponse(svg, request.method !== 'HEAD');
        } catch (error) {
            console.error('Badge 统计查询失败', error);
            return errorResponse('统计服务暂时不可用', 502);
        }
    },
};
