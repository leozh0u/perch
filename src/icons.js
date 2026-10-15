export const paths = {
  captions:
    '<path d="M3 5h18v14H3z"/><text x="12" y="15" fill="currentColor" stroke="none" text-anchor="middle" font-size="9" font-weight="700">CC</text>',
  play: '<path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
  back: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/><text x="12" y="16" fill="currentColor" stroke="none" text-anchor="middle" font-size="8" font-weight="700">10</text>',
  forward:
    '<path d="M20 10a8 8 0 1 0-1 8M20 4v6h-6"/><text x="12" y="16" fill="currentColor" stroke="none" text-anchor="middle" font-size="8" font-weight="700">10</text>',
  next: '<path d="m5 5 10 7-10 7z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>',
  previous: '<path d="m19 5-10 7 10 7z" fill="currentColor" stroke="none"/><path d="M5 5v14"/>',
  volume: '<path d="m11 4-6 5H2v6h3l6 5zM15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>',
  queue: '<path d="M4 5h16M4 10h16M4 15h9m-9 5h9m4-5 5 3-5 3z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  pin: '<path d="m8 3 8 0-1 6 4 5H5l4-5zm4 11v7"/>',
  external: '<path d="M14 3h7v7m0-7L10 14m0-9H4v15h15v-6"/>',
  link: '<path d="m10 14 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m4 0 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 -1)"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  perch:
    '<path d="M5 16V5h11v2M5 16h15M7 16l-2 5m13-5 2 5M9 7h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke-width="1.4"/><path d="m12 9 4 2-4 2z" fill="currentColor" stroke="none"/>',
  size: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
};
export const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.play}</svg>`;

// Constant SVG shapes built with DOM APIs also work on Trusted Types sites.
export function iconNode(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  for (const [key, value] of Object.entries({
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  }))
    svg.setAttribute(key, value);
  for (const [, tag, attributes, text] of (paths[name] || paths.play).matchAll(
    /<(path|text)\b([^>]*?)(?:\/>|>([^<]*)<\/text>)/g,
  )) {
    const shape = document.createElementNS(namespace, tag);
    for (const [, key, value] of attributes.matchAll(/([\w-]+)="([^"]*)"/g))
      shape.setAttribute(key, value);
    if (text) shape.textContent = text;
    svg.append(shape);
  }
  return svg;
}
