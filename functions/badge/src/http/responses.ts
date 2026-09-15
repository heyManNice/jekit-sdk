export function svgResponse(svg: string, includeBody = true): Response {
    return new Response(includeBody ? svg : null, {
        headers: {
            'Content-Type': 'image/svg+xml;charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}

export function errorResponse(message: string, status: number): Response {
    return new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

export function methodNotAllowedResponse(): Response {
    return new Response(null, {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
    });
}
