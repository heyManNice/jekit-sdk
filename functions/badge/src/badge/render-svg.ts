import {
    BADGE_DEFAULTS,
    BADGE_STYLES,
    type BadgeStyle,
} from '../config/options.ts';
import { escapeXml, estimateTextWidth } from './text.ts';

export type BadgeContent = {
    label: string;
    value: string;
};

export type BadgeAppearance = {
    style?: BadgeStyle;
    valueColor?: string;
    labelColor?: string;
};

export function renderBadgeSvg(
    content: BadgeContent,
    appearance: BadgeAppearance = {},
): string {
    const styleName = appearance.style ?? BADGE_DEFAULTS.style;
    const style = BADGE_STYLES[styleName];
    const label = style.fontWeight === 700 ? content.label.toUpperCase() : content.label;
    const value = style.fontWeight === 700 ? content.value.toUpperCase() : content.value;
    const safeLabel = escapeXml(label);
    const safeValue = escapeXml(value);
    const labelWidth = calculateSectionWidth(label, styleName);
    const valueWidth = calculateSectionWidth(value, styleName);
    const totalWidth = labelWidth + valueWidth;
    const labelX = labelWidth / 2;
    const valueX = labelWidth + valueWidth / 2;
    const textY = Math.round((style.height + style.fontSize) / 2) - 2;
    const gradient = renderGradient(style.gradient);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${style.height}" role="img" aria-label="${safeLabel}: ${safeValue}">
    <title>${safeLabel}: ${safeValue}</title>
    ${gradient}
    <mask id="badge-mask">
        <rect width="${totalWidth}" height="${style.height}" rx="${style.radius}" fill="#fff"/>
    </mask>
    <g mask="url(#badge-mask)">
        <path fill="${escapeXml(appearance.labelColor ?? BADGE_DEFAULTS.labelColor)}" d="M0 0h${labelWidth}v${style.height}H0z"/>
        <path fill="${escapeXml(appearance.valueColor ?? BADGE_DEFAULTS.valueColor)}" d="M${labelWidth} 0h${valueWidth}v${style.height}H${labelWidth}z"/>
        ${gradient ? `<path fill="url(#badge-gradient)" d="M0 0h${totalWidth}v${style.height}H0z"/>` : ''}
        <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${style.fontSize}" font-weight="${style.fontWeight}" letter-spacing="${style.letterSpacing}">
            ${renderText(labelX, textY, safeLabel, style.hasTextShadow)}
            ${renderText(valueX, textY, safeValue, style.hasTextShadow)}
        </g>
    </g>
</svg>`;
}

function calculateSectionWidth(text: string, styleName: BadgeStyle): number {
    const style = BADGE_STYLES[styleName];
    const weightFactor = style.fontWeight === 700 ? 1.1 : 1;
    const scaledWidth = estimateTextWidth(text) * style.fontSize / 11 * weightFactor;
    const spacingWidth = Array.from(text).length * style.letterSpacing;

    return Math.ceil(scaledWidth + spacingWidth + style.padding * 2);
}

function renderText(x: number, y: number, text: string, hasShadow: boolean): string {
    const shadow = hasShadow
        ? `<text x="${x}" y="${y + 1}" fill="#010101" fill-opacity=".3" aria-hidden="true">${text}</text>\n            `
        : '';

    return `${shadow}<text x="${x}" y="${y}">${text}</text>`;
}

function renderGradient(gradient: 'flat' | 'plastic' | 'none'): string {
    if (gradient === 'flat') {
        return `<linearGradient id="badge-gradient" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>`;
    }

    if (gradient === 'plastic') {
        return `<linearGradient id="badge-gradient" x2="0" y2="100%">
        <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
        <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
        <stop offset=".9" stop-opacity=".3"/>
        <stop offset="1" stop-opacity=".5"/>
    </linearGradient>`;
    }

    return '';
}
