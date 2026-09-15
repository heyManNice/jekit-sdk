import { performance as getPerformance, stats } from 'jekit-core';
import { renderBadgeSvg } from './badge/render-svg.ts';
import { BADGE_DEFAULTS, BADGE_METRICS } from './config/options.ts';
import { parseBadgeRequest } from './http/parse-request.ts';
import {
    docsRedirectResponse,
    errorResponse,
    methodNotAllowedResponse,
    svgResponse,
} from './http/responses.ts';
import type { WorkerEnv, WorkerExecutionContext } from './runtime/worker-types.ts';
import {
    formatPerformanceBucket,
    getPerformancePercentile,
} from './performance/percentile.ts';

export default {
    async fetch(
        request: Request,
        _env: WorkerEnv,
        _context: WorkerExecutionContext,
    ): Promise<Response> {
        const url = new URL(request.url);

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return methodNotAllowedResponse();
        }
        if (url.pathname === '/' && url.search === '') {
            return docsRedirectResponse();
        }
        if (url.pathname === '/favicon.ico') {
            return errorResponse('资源不存在', 404, request.method !== 'HEAD');
        }

        const parsed = parseBadgeRequest(request);
        if (!parsed.ok) {
            return errorResponse(parsed.message, parsed.status, request.method !== 'HEAD');
        }

        const { style, metric, target } = parsed.value;
        const metricOption = BADGE_METRICS[metric];

        try {
            let value: string;
            let valueColor: string | undefined;

            if (metricOption.source === 'stats') {
                const result = await stats({
                    domain: target.domain,
                    path: target.path,
                });
                value = result[metricOption.statsKey].toString();
            } else {
                const result = await getPerformance({ domain: target.domain });
                const bucket = getPerformancePercentile(
                    result[metricOption.histogramKey],
                    metricOption.percentile,
                );
                value = bucket === null
                    ? BADGE_DEFAULTS.emptyValue
                    : formatPerformanceBucket(bucket);
                valueColor = bucket === null ? BADGE_DEFAULTS.emptyColor : undefined;
            }

            const svg = renderBadgeSvg(
                {
                    label: metricOption.label,
                    value,
                },
                { style, valueColor },
            );

            return svgResponse(svg, request.method !== 'HEAD');
        } catch (error) {
            console.error('Badge 数据查询失败', error);
            return errorResponse('统计服务暂时不可用', 502, request.method !== 'HEAD');
        }
    },
};
