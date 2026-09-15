import { renderBadgeSvg } from '../badge/render-svg.ts';
import { BADGE_DEFAULTS } from '../config/options.ts';

export const BADGE_DOCS_URL = 'https://jekit.cn/docs/more/badge/';

export function svgResponse(svg: string, includeBody = true): Response {
    return new Response(includeBody ? svg : null, {
        headers: {
            'Content-Type': 'image/svg+xml;charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}

export function errorResponse(
    message: string,
    status: number,
    includeBody = true,
): Response {
    const svg = renderBadgeSvg(
        { label: BADGE_DEFAULTS.errorLabel, value: message },
        { valueColor: BADGE_DEFAULTS.errorColor },
    );

    return new Response(includeBody ? svg : null, {
        status,
        headers: {
            'Content-Type': 'image/svg+xml;charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

export function methodNotAllowedResponse(): Response {
    const response = errorResponse('仅支持 GET 或 HEAD', 405);
    response.headers.set('Allow', 'GET, HEAD');
    return response;
}

export function docsRedirectResponse(): Response {
    return new Response(null, {
        status: 301,
        headers: { Location: BADGE_DOCS_URL },
    });
}
