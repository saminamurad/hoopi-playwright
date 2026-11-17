import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Runs once before the tests.
 * Chrome refuses to open the test profile (playwright/.chrome-profile) if another Chrome
 * is still using it, e.g. the window from `npm run auth` or a Chrome left running in the
 * background after an earlier run. This closes ONLY those test-profile Chrome processes
 * (your normal Chrome is not touched) and removes the stale lock file.
 */
export default async function globalSetup() {
  const profile = path.resolve('playwright/.chrome-profile');
  if (!fs.existsSync(profile)) return;

  try {
    if (process.platform === 'win32') {
      const ps =
        "Get-CimInstance Win32_Process -Filter \"name='chrome.exe'\" | " +
        "Where-Object { $_.CommandLine -like '*chrome-profile*' } | " +
        "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $_.ProcessId }";
      const out = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
      if (out) console.log(`Closed leftover test-profile Chrome (pid ${out.split(/\s+/).join(', ')})`);
    } else {
      execSync(`pkill -f "${profile}" || true`);
    }
  } catch {
    /* nothing to close */
  }

  await new Promise((r) => setTimeout(r, 1500));
  for (const f of ['lockfile', 'SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.rmSync(path.join(profile, f), { force: true }); } catch { /* still locked */ }
  }
}
