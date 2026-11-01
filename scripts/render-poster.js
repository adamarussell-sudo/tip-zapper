// Renders website/images/tip-zapper-poster (the 6foot5.com post's featured image, 1600x900).
// Needs Playwright (see render-brand.js). Writes poster.png in the current folder; convert to WebP after.

const { chromium } = require('playwright');
const fs = require('fs');
const F = (f) => 'file:///home/claude/repo/tip-zapper/node_modules/@fontsource/' + f;
const C = { lake:'#1E4B57', mustard:'#E0A53B', cream:'#F0E2C4', ink:'#22201C', rust:'#A8481F', rule:'#CDBB94', pine:'#22352B', navy:'#2E3F5C', midnight:'#16233B', barn:'#9C3B2A' };
const W = 1600, H = 900, cx = 800, cy = 560, R = 210;
// sunburst rays behind the coin
let rays = '';
for (let i = 0; i < 36; i++) {
  const a0 = (i / 36) * Math.PI * 2, a1 = a0 + Math.PI / 36;
  const L = 1400;
  rays += `<path d="M${cx} ${cy} L${cx + L * Math.cos(a0)} ${cy + L * Math.sin(a0)} L${cx + L * Math.cos(a1)} ${cy + L * Math.sin(a1)} Z" fill="${C.navy}" opacity=".55"/>`;
}
// bolt (icon bolt path, scaled into the coin)
const bolt = 'M66 4 L28 74 H56 L42 124 L100 50 H72 L92 4 Z';
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="sky"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>
  <rect width="${W}" height="${H}" fill="${C.lake}"/>
  <g clip-path="url(#sky)">${rays}</g>
  <!-- coin rising like a sun -->
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.cream}"/>
  <circle cx="${cx}" cy="${cy}" r="${R - 22}" fill="none" stroke="${C.rule}" stroke-width="6"/>
  <text x="${cx}" y="${cy + 62}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="190" fill="${C.ink}" letter-spacing="-4">$0</text>
  <!-- far hills -->
  <path d="M0 690 C 180 610, 330 640, 470 660 S 760 600, 900 640 S 1220 610, 1380 650 S 1560 640, 1600 630 L1600 900 L0 900 Z" fill="${C.midnight}"/>
  <!-- bolt striking the coin -->
  <g transform="translate(822 212) scale(1.95)">
    <path d="${bolt}" fill="${C.mustard}" stroke="${C.lake}" stroke-width="3.2" stroke-linejoin="round"/>
  </g>
  <!-- spark ticks where it hits, off to the right of the zero -->
  <g stroke="${C.mustard}" stroke-width="6" stroke-linecap="round">
    <line x1="922" y1="452" x2="954" y2="436"/>
    <line x1="926" y1="470" x2="960" y2="476"/>
    <line x1="916" y1="486" x2="934" y2="512"/>
  </g>
  <!-- near hill with a grocery bag on the ridge -->
  <path d="M0 760 C 220 700, 420 720, 600 740 S 980 700, 1180 735 S 1480 760, 1600 745 L1600 900 L0 900 Z" fill="${C.pine}"/>
  <g transform="translate(1210 640)">
    <path d="M8 30 L92 30 L84 112 L16 112 Z" fill="${C.rust}"/>
    <path d="M30 32 C 30 6, 70 6, 70 32" fill="none" stroke="${C.rust}" stroke-width="7"/>
    <path d="M30 30 L28 6 M46 30 L52 0 M62 30 L72 8" stroke="${C.pine}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="36" cy="8" r="9" fill="${C.barn}"/><path d="M58 2 q8 -12 16 2 q-8 4 -16 -2z" fill="#4E7A3F"/>
  </g>
  <!-- the sneaked-in tech: a mouse pointer in the sky -->
  <g transform="translate(470 300) rotate(-20) scale(.8)">
    <path d="M0 0 L0 64 L16 49 L27 74 L38 69 L27 45 L48 45 Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
  </g>
  <!-- poster frame + title -->
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="${C.cream}" stroke-width="4"/>
  <text x="${cx}" y="146" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="108" fill="${C.cream}" letter-spacing="10">TIP ZAPPER</text>
  <text x="${cx}" y="194" text-anchor="middle" font-family="Bitter" font-style="italic" font-size="34" fill="${C.cream}" opacity=".88">A chore a computer should be doing.</text>
  <text x="${cx}" y="842" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="22" fill="${C.cream}" opacity=".7" letter-spacing="6">A 6FOOT5 AI PROJECT</text>
</svg>`;
const html = `<!doctype html><html><head><style>
@font-face{font-family:Oswald;font-weight:700;src:url(${F('oswald/files/oswald-latin-700-normal.woff2')})}
@font-face{font-family:Bitter;font-style:italic;src:url(${F('bitter/files/bitter-latin-400-italic.woff2')})}
html,body{margin:0}</style></head><body>${svg}</body></html>`;
fs.writeFileSync('poster.html', html);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('file://' + process.cwd() + '/poster.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  await p.screenshot({ path: 'poster.png' }); await b.close();
})();
