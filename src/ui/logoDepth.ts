import { f } from './artKit';

/**
 * Depth for flat badge logos (games, rival orgs, sponsors), so they sit on the page the way the
 * players do: lit from the top left, shaded towards the bottom right, with a raised, glossy emblem
 * that casts a shadow onto its plate and a bevelled rim.
 *
 * Each call gets its own ids, so a logo's filters and gradients always resolve to its own copy even
 * when the same logo appears several times on the page or somewhere hidden. Output is built only
 * from the markup passed in (itself built from constants) and numbers, so it is safe for {@html}.
 */

let serial = 0;

/** A rounded rectangle as a path, for clipping the plate's lighting. */
export function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}

export interface DepthParts {
  /** The badge behind the emblem. */
  plate: string;
  /** The logo itself, drawn over the plate. */
  emblem: string;
  /** The plate's outline as a path, used to keep the lighting inside it. */
  outline: string;
}

/** The inner markup of a 48x48 logo with light, shade, gloss and a raised emblem. */
export function withDepth({ plate, emblem, outline }: DepthParts): string {
  const u = `ld${(++serial).toString(36)}`;
  const defs =
    `<clipPath id="${u}-c"><path d="${outline}"/></clipPath>` +
    // Light from the top left falling across the plate, darkening towards the bottom right.
    `<linearGradient id="${u}-l" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/></linearGradient>` +
    // A glassy reflection over the top of the badge.
    `<linearGradient id="${u}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.26"/><stop offset="1" stop-color="#fff" stop-opacity="0.02"/></linearGradient>` +
    // The emblem: embossed by a specular light from the top left, then lifted off the plate.
    `<filter id="${u}-e" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="0.7" result="b"/>` +
    `<feSpecularLighting in="b" surfaceScale="2.2" specularConstant="0.75" specularExponent="16" lighting-color="#ffffff" result="s"><fePointLight x="-12" y="-18" z="36"/></feSpecularLighting>` +
    `<feComposite in="s" in2="SourceAlpha" operator="in" result="si"/>` +
    `<feComposite in="SourceGraphic" in2="si" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0" result="lit"/>` +
    `<feDropShadow in="lit" dx="0.4" dy="1.3" stdDeviation="0.9" flood-color="#000" flood-opacity="0.65"/>` +
    `</filter>`;
  return (
    `<defs>${defs}</defs>` +
    plate +
    `<g clip-path="url(#${u}-c)"><rect x="0" y="0" width="48" height="48" fill="url(#${u}-l)"/></g>` +
    `<g filter="url(#${u}-e)">${emblem}</g>` +
    `<g clip-path="url(#${u}-c)"><ellipse cx="18" cy="4" rx="34" ry="17" fill="url(#${u}-g)"/></g>` +
    // Bevel: a lit top edge and a dark lower rim.
    `<g clip-path="url(#${u}-c)"><path d="${outline}" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="1.6" transform="translate(0.5 0.8)"/>` +
    `<path d="${outline}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="1.6" transform="translate(-0.4 -0.9)"/></g>`
  );
}
