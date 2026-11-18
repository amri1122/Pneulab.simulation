/**
 * Pneulab - Standalone Bundle Generator
 * Combines index.html, style.css, script.js, and image assets into index_single.html
 * Embeds images as Base64 Data URIs for true 100% offline standalone usage.
 * Guarantees pristine UTF-8 encoding without mojibake.
 */

const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlPath = path.join(dir, 'index.html');
const cssPath = path.join(dir, 'style.css');
const jsPath = path.join(dir, 'script.js');
const outPath = path.join(dir, 'index_single.html');

console.log('Reading source files with UTF-8 encoding...');
let html = fs.readFileSync(htmlPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

console.log('Inlining logo assets as Base64 Data URIs...');
const iconPngPath = path.join(dir, 'assets', 'logo-pneulab-icon.png');
const fullPngPath = path.join(dir, 'assets', 'logo-pneulab-full.png');
const origPngPath = path.join(dir, 'assets', 'logo-pneulab.png');
const fav32Path   = path.join(dir, 'assets', 'favicon-32x32.png');
const fav180Path  = path.join(dir, 'assets', 'favicon-180x180.png');

if (fs.existsSync(iconPngPath)) {
  const iconB64 = `data:image/png;base64,${fs.readFileSync(iconPngPath).toString('base64')}`;
  html = html.split('assets/logo-pneulab-icon.png').join(iconB64);
  js = js.split('assets/logo-pneulab-icon.png').join(iconB64);
}
if (fs.existsSync(fullPngPath)) {
  const fullB64 = `data:image/png;base64,${fs.readFileSync(fullPngPath).toString('base64')}`;
  html = html.split('assets/logo-pneulab-full.png').join(fullB64);
  js = js.split('assets/logo-pneulab-full.png').join(fullB64);
}
if (fs.existsSync(origPngPath)) {
  const origB64 = `data:image/png;base64,${fs.readFileSync(origPngPath).toString('base64')}`;
  html = html.split('assets/logo-pneulab.png').join(origB64);
  js = js.split('assets/logo-pneulab.png').join(origB64);
}
if (fs.existsSync(fav32Path)) {
  const fav32B64 = `data:image/png;base64,${fs.readFileSync(fav32Path).toString('base64')}`;
  html = html.split('assets/favicon-32x32.png').join(fav32B64);
}
if (fs.existsSync(fav180Path)) {
  const fav180B64 = `data:image/png;base64,${fs.readFileSync(fav180Path).toString('base64')}`;
  html = html.split('assets/favicon-180x180.png').join(fav180B64);
}

console.log('Bundling style and script into single HTML...');
let bundle = html.replace(
  /<link\s+rel="stylesheet"\s+href="style\.css">/,
  `<style>\n${css}\n  </style>`
);

bundle = bundle.replace(
  /<script\s+src="script\.js"><\/script>/,
  `<script>\n${js}\n  </script>`
);

console.log(`Writing bundled file to ${outPath}...`);
fs.writeFileSync(outPath, bundle, 'utf8');

const stats = fs.statSync(outPath);
const sizeKb = (stats.size / 1024).toFixed(2);
console.log(`Successfully generated index_single.html (${sizeKb} KB) with clean UTF-8 and inlined assets!`);
