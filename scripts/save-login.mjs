// Saves your Hoopi login for the tests, using your REAL Google Chrome.
// Why: Google blocks "Continue with Google" inside Playwright's test browser,
// but allows it in normal Chrome. So we open normal Chrome, you log in,
// The tests then run inside this same Chrome profile (playwright/.chrome-profile), so they always use your live login.
//
// Usage:  npm run auth
//   1. A Chrome window opens on the Hoopi login page (separate test profile).
//   2. Log in (Google is fine) and wait until the Hoopi dashboard shows.
//   3. Come back to the VS Code terminal and press Enter.

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chromePath = CHROME_PATHS.find((p) => fs.existsSync(p));
if (!chromePath) {
  console.error('Google Chrome not found. Set CHROME_PATH in .env to your chrome.exe path.');
  process.exit(1);
}

const PORT = 9333;
const profileDir = path.resolve('playwright/.chrome-profile'); // separate test profile, kept for next time
const authFile = path.resolve('playwright/.auth/user.json');
fs.mkdirSync(path.dirname(authFile), { recursive: true });

console.log('Opening Google Chrome with a separate test profile...');
const chrome = spawn(chromePath, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'https://app.hoopi.ai/login',
], { detached: true, stdio: 'ignore' });
chrome.unref();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await new Promise((resolve) => rl.question(
  '\n>>> Log in to Hoopi in that Chrome window. When you see the Hoopi dashboard, come back here and press Enter... ', resolve));
rl.close();

let browser;
for (let i = 0; i < 10 && !browser; i++) {
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`); }
  catch { await new Promise((r) => setTimeout(r, 1000)); }
}
if (!browser) { console.error('Could not connect to Chrome. Close all Chrome windows of the test profile and try again.'); process.exit(1); }

const context = browser.contexts()[0];
const page = context.pages().find((p) => p.url().includes('hoopi.ai')) || context.pages()[0];
const url = page ? page.url() : '';
if (!url.includes('/dashboard')) {
  console.warn(`\nWarning: the Hoopi tab is on ${url || 'nothing'} - it does not look logged in. Saving anyway; run "npm run auth" again if tests still land on /login.`);
}
await context.storageState({ path: authFile });
const saved = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const hoopiCookies = saved.cookies.filter((c) => c.domain.includes('hoopi.ai')).length;
const hoopiStorage = saved.origins.filter((o) => o.origin.includes('hoopi.ai')).length;
console.log(`\nSaved login to playwright/.auth/user.json (${hoopiCookies} Hoopi cookies, ${hoopiStorage} Hoopi storage entries).`);
console.log(hoopiCookies + hoopiStorage > 0 ? 'Done! Now run: npm run test:safe' : 'No Hoopi login found - make sure you finished logging in, then run npm run auth again.');
// Close the test Chrome: tests open this same profile and Chrome allows only one window per profile.
try { const cdp = await browser.newBrowserCDPSession(); await cdp.send('Browser.close'); } catch { /* already closed */ }
console.log('The test Chrome window was closed. Your login stays in playwright/.chrome-profile for the tests.');
process.exit(0);
