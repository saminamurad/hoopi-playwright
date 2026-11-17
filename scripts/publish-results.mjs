// Turns the last test run (test-results/results.json) into a results page GitHub can show:
//   results/latest/RESULTS.md            <- always the newest run (link this for your client)
//   results/<date_time>/RESULTS.md        <- a copy of every run, so you keep history
//   results/README.md                     <- list of all runs
// Failure screenshots are copied next to RESULTS.md. Traces and the HTML report are NOT
// published, because they can contain your Hoopi login cookies.
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'test-results/results.json';
if (!fs.existsSync(SRC)) {
  console.error('No test-results/results.json yet. Run the tests first, e.g. npm run test:safe');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const strip = (s = '') => s.replace(/\u001b\[[0-9;]*m/g, '');
const pad = (n) => String(n).padStart(2, '0');

const started = new Date(data.stats?.startTime ?? Date.now());
const stamp = `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())}_${pad(started.getHours())}${pad(started.getMinutes())}`;
const when = started.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

// ---- collect one row per test ----
const rows = [];
const walk = (suite, file) => {
  const f = suite.file ?? file;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const r = t.results?.[t.results.length - 1] ?? {};
      const knownBug = t.expectedStatus === 'failed';
      let result;
      if (t.status === 'skipped' || r.status === 'skipped') result = 'Not run';
      else if (r.status === 'interrupted') result = 'Not run';
      else if (t.status === 'expected') result = knownBug ? 'Known bug' : 'Pass';
      else if (t.status === 'flaky') result = 'Pass (retry)';
      else result = r.status === 'timedOut' ? 'Fail (timeout)' : 'Fail';
      const shot = (r.attachments ?? []).find((a) => a.contentType === 'image/png' && (a.body || a.path));
      const msg = strip(r.error?.message ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
      rows.push({
        id: (spec.title.match(/TC-\d+/) ?? ['-'])[0],
        title: spec.title.replace(/^TC-\d+\s*/, ''),
        area: (f ?? '').split(/[\\/]/)[0] || '-',
        result, shot,
        error: result.startsWith('Fail') ? msg.slice(0, 3).join(' ').slice(0, 300) : '',
        secs: Math.round((r.duration ?? 0) / 1000),
      });
    }
  }
  for (const s of suite.suites ?? []) walk(s, f);
};
for (const s of data.suites ?? []) walk(s, s.file);

const count = (k) => rows.filter((r) => r.result.startsWith(k)).length;
const summary = {
  stamp, when, total: rows.length,
  pass: count('Pass'), fail: count('Fail'), knownBug: count('Known bug'), notRun: count('Not run'),
  minutes: Math.round((data.stats?.duration ?? 0) / 60000),
};

// ---- write the run folder ----
const outDir = path.join('results', stamp);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'screenshots'), { recursive: true });

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/[<>]/g, '');
const icon = { Pass: '✅', Fail: '❌', 'Known bug': '🐞', 'Not run': '⏭️' };
const lines = [];
lines.push(`# Hoopi automated test results – ${when}`, '');
lines.push('| Total | ✅ Passed | ❌ Failed | 🐞 Known bug still present | ⏭️ Not run | Run time |');
lines.push('|---|---|---|---|---|---|');
lines.push(`| ${summary.total} | ${summary.pass} | ${summary.fail} | ${summary.knownBug} | ${summary.notRun} | ${summary.minutes} min |`, '');
lines.push('**Known bug** = a bug already logged in the test sheet; the test confirms it is still there.', '');

const failed = rows.filter((r) => r.result.startsWith('Fail'));
if (failed.length) {
  lines.push('## Failed tests', '');
  for (const r of failed) {
    lines.push(`### ❌ ${r.id} ${esc(r.title)}`, '', `- **Area:** ${r.area}`, `- **Result:** ${r.result}`);
    if (r.error) lines.push(`- **Error:** \`${r.error.replace(/`/g, "'")}\``);
    if (r.shot) {
      const name = `${r.id}_${rows.indexOf(r)}.png`;
      const dest = path.join(outDir, 'screenshots', name);
      try {
        if (r.shot.body) fs.writeFileSync(dest, Buffer.from(r.shot.body, 'base64'));
        else fs.copyFileSync(r.shot.path, dest);
        if (fs.statSync(dest).size > 0) lines.push('', `![${r.id} screenshot](screenshots/${name})`);
        else fs.rmSync(dest);
      } catch { /* screenshot missing */ }
    }
    lines.push('');
  }
}

lines.push('## All tests', '', '| TC | Test | Area | Result | Time |', '|---|---|---|---|---|');
for (const r of rows) {
  const key = Object.keys(icon).find((k) => r.result.startsWith(k));
  lines.push(`| ${r.id} | ${esc(r.title)} | ${r.area} | ${icon[key] ?? ''} ${r.result} | ${r.secs}s |`);
}
fs.writeFileSync(path.join(outDir, 'RESULTS.md'), lines.join('\n') + '\n');
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

// ---- results/latest = copy of this run ----
const latest = path.join('results', 'latest');
fs.rmSync(latest, { recursive: true, force: true });
fs.cpSync(outDir, latest, { recursive: true });

// ---- results/README.md = list of every run ----
const runs = fs.readdirSync('results')
  .filter((d) => d !== 'latest' && fs.existsSync(path.join('results', d, 'summary.json')))
  .map((d) => JSON.parse(fs.readFileSync(path.join('results', d, 'summary.json'), 'utf8')))
  .sort((a, b) => b.stamp.localeCompare(a.stamp));
const idx = ['# Test run history', '', '**[➡ Latest results](latest/RESULTS.md)**', '',
  '| Run | Total | ✅ Passed | ❌ Failed | 🐞 Known bug | ⏭️ Not run |', '|---|---|---|---|---|---|',
  ...runs.map((s) => `| [${s.when}](${s.stamp}/RESULTS.md) | ${s.total} | ${s.pass} | ${s.fail} | ${s.knownBug} | ${s.notRun} |`)];
fs.writeFileSync(path.join('results', 'README.md'), idx.join('\n') + '\n');

console.log(`Results page written: results/${stamp}/RESULTS.md (also results/latest)`);
console.log(`  ${summary.pass} passed, ${summary.fail} failed, ${summary.knownBug} known bugs, ${summary.notRun} not run`);
