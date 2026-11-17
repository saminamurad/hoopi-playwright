// npm run share  =  build the results page, then commit and push it to GitHub.
import { execSync } from 'node:child_process';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const quiet = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

run('node scripts/publish-results.mjs');

try { quiet('git rev-parse --is-inside-work-tree'); }
catch { console.error('\nThis folder is not connected to Git yet. Follow the GitHub steps in README.md first.'); process.exit(1); }

run('git add results');
if (!quiet('git status --porcelain results')) { console.log('Nothing new to share.'); process.exit(0); }
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
run(`git commit -m "Test results ${stamp}"`);
run('git push');
console.log('\nDone. Your client can see it on GitHub in results/latest/RESULTS.md');
