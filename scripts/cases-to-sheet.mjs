// Lists every automated test case as CSV so you can add new rows to the test sheet.
// Usage: npm run cases   ->  test-results/automated-cases.csv
import fs from 'node:fs';
const report = JSON.parse(fs.readFileSync('test-results/list.json', 'utf8'));
const rows = [];
function walk(suite, area) {
  const here = suite.title && !suite.title.endsWith('.ts') ? suite.title : area;
  for (const spec of suite.specs ?? []) {
    const id = spec.title.match(/TC-\d{3}/)?.[0] ?? '';
    const tags = [...`${here} ${spec.title}`.matchAll(/@\w+/g)].map((m) => m[0]).join(' ');
    rows.push([id, here.replace(/@\w+/g, '').trim(), spec.title.replace(/TC-\d{3}\s*/, '').replace(/@\w+/g, '').trim(), tags, spec.file, 'Yes']);
  }
  for (const s of suite.suites ?? []) walk(s, here);
}
report.suites.forEach((s) => walk(s, ''));
const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const out = [['TC ID', 'Widget / Area', 'Test Scenario', 'Tags', 'Spec file', 'Automated?'].join(',')]
  .concat(rows.map((r) => r.map(esc).join(',')));
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/automated-cases.csv', out.join('\n'));
console.log(`Wrote test-results/automated-cases.csv with ${rows.length} automated test cases`);
