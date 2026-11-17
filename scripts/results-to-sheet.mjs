// Turns Playwright's JSON report into a CSV you can paste into the test sheet.
// Usage:  npm test   then   npm run sheet
// Output: test-results/sheet-update.csv  (TC ID, Status, Test Date, Notes)
//
// Status mapping:
//   passed                      -> Pass
//   failed / timedOut           -> Fail
//   skipped                     -> Blocked
//   "expected to fail" (test.fail) that still fails -> Fail (known bug still open)
//   "expected to fail" that now PASSES             -> Pass (bug fixed! remove test.fail)

import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const rows = new Map(); // TC ID -> {status, notes[]}
const rank = { Fail: 3, Blocked: 2, Pass: 1 };

function walk(suite) {
  for (const spec of suite.specs ?? []) {
    const id = spec.title.match(/TC-\d{3}/)?.[0];
    if (!id) continue;
    for (const t of spec.tests ?? []) {
      const r = t.results?.at(-1);
      if (!r) continue;
      const knownBug = t.expectedStatus === 'failed';
      let status, note = `${spec.title} [${t.projectName}]`;
      if (r.status === 'skipped') status = 'Blocked';
      else if (knownBug) {
        status = r.status === 'failed' ? 'Fail' : 'Pass';
        note += r.status === 'failed' ? ' - known bug still open' : ' - KNOWN BUG NOW FIXED, retest & close it';
      } else status = r.status === 'passed' ? 'Pass' : 'Fail';
      if (status === 'Fail' && r.error?.message) note += ' - ' + r.error.message.replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0].slice(0, 150);
      const cur = rows.get(id) ?? { status: 'Pass', notes: [] };
      if (rank[status] > rank[cur.status]) cur.status = status; // worst result wins
      cur.notes.push(`${status}: ${note}`);
      rows.set(id, cur);
    }
  }
  for (const s of suite.suites ?? []) walk(s);
}
report.suites.forEach(walk);

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const lines = [['TC ID', 'Status', 'Test Date', 'Automation notes'].join(',')];
[...rows.keys()].sort().forEach((id) => {
  const r = rows.get(id);
  lines.push([id, r.status, today, r.notes.join(' | ')].map(esc).join(','));
});
fs.writeFileSync('test-results/sheet-update.csv', lines.join('\n'));
const counts = [...rows.values()].reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
console.log(`Wrote test-results/sheet-update.csv for ${rows.size} test cases`, counts);
