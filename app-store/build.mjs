// Builds the app version of the game into www/index.html from ../drift-racers/src.
// Same game as the web site, plus: Cash Packs shop on, cheat codes off, server list pointed at the Netlify site.
// Run: node build.mjs   (then: npx cap sync)
import {readFileSync, writeFileSync, readdirSync, mkdirSync} from 'node:fs';
const src = new URL('../drift-racers/src/', import.meta.url);
const files = readdirSync(src).filter(f => /^0.*\.js$/.test(f)).sort();
const js = files.map(f => readFileSync(new URL(f, src), 'utf8')).join('\n');
const pre = `window.STORE_BUILD = true; window.NET_LOBBY = 'https://pixel-drift-racers.netlify.app/api/rooms';\n`;
const shell = readFileSync(new URL('shell.html', src), 'utf8');
const i = shell.indexOf('/*__JS__*/');
let html = shell.slice(0, i) + pre + js + shell.slice(i + 10);
// no cheat codes in the store version
html = html.replace(/const CODES = \{[^;]*\};/, 'const CODES = {};');
mkdirSync(new URL('www/', import.meta.url), {recursive: true});
writeFileSync(new URL('www/index.html', import.meta.url), html);
console.log('www/index.html', (html.length / 1024).toFixed(1) + ' KB from', files.length, 'files');
