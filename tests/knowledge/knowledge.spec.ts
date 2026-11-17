import path from 'node:path';
import { test, expect } from '../../fixtures';
import { CrawlDialog } from '../../pages/KHomePage';

const file = (name: string) => path.join(__dirname, '../../test-data', name);

test.describe('Sources (Knowledge Base)', () => {
  test.beforeEach(async ({ knowledge }) => { await knowledge.goto(); });

  test('TC-180 Knowledge page shows counts and actions', async ({ knowledge }) => {
    await expect(knowledge.crawlWebsite).toBeVisible();
    await expect(knowledge.uploadDocuments).toBeVisible();
    const c = await knowledge.counts();
    expect(c.total).toBe(c.searchable + c.failed); // the numbers must add up
  });

  test('TC-181 Search filters the document list', async ({ page, knowledge }) => {
    await knowledge.search.fill('zzz-no-such-doc-qa');
    await expect(page.locator('main').getByText('.md', { exact: false })).toHaveCount(0);
    await knowledge.search.clear();
  });

  test('TC-182 Crawl website button opens the crawl dialog', async ({ page, knowledge }) => {
    await knowledge.crawlWebsite.click();
    await expect(new CrawlDialog(page).dialog).toBeVisible();
  });

  test('TC-183 "Used by" section lists the Assistant', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Used by' })).toBeVisible();
    await expect(page.locator('main').getByText('Assistant').first()).toBeVisible();
  });

  test('TC-184 KHome source count matches Knowledge page', async ({ knowledge, khome }) => {
    const { total } = await knowledge.counts();
    await khome.goto();
    expect(await khome.getSourceCount()).toBe(total);
  });

  test('TC-185 Failed sources show a readable error (not raw JSON)', async ({ page }) => {
    test.fail(true, 'Known bug BUG-09: errors are shown as raw JSON from the knowledge engine.');
    await expect(page.locator('main').getByText('{"detail"', { exact: false })).toHaveCount(0);
  });
});

test.describe('Sources - uploads @writes', () => {
  test.beforeEach(async ({ qaWorkspace, knowledge }) => { void qaWorkspace; await knowledge.goto(); });

  test('TC-043 Corrupted PDF is marked Failed, not Completed', async ({ page, knowledge }) => {
    test.fail(true, 'Known bug BUG-03: broken PDF shows Completed.');
    await knowledge.fileInput.setInputFiles(file('qa_broken.pdf'));
    await page.reload();
    const row = page.locator('main li, main tr, main [role=row], main article').filter({ hasText: 'qa_broken.pdf' }).first();
    await expect(row).toContainText('Failed', { timeout: 60_000 });
  });

  test('TC-039 DOCX upload is processed', async ({ page, knowledge }) => {
    test.fail(true, 'Known bug BUG-02: DOCX fails with "Could not extract text".');
    await knowledge.fileInput.setInputFiles(file('qa_sample.docx'));
    await page.reload();
    const row = page.locator('main li, main tr, main [role=row], main article').filter({ hasText: 'qa_sample.docx' }).first();
    await expect(row).toContainText('Completed', { timeout: 90_000 });
  });

  test('TC-045 Uploading the same file twice warns about a duplicate', async ({ page, knowledge }) => {
    test.fail(true, 'Known bug BUG-06: duplicates are added silently.');
    const before = (await knowledge.counts()).total;
    await knowledge.fileInput.setInputFiles(file('qa_sample.pdf'));
    await page.reload();
    await knowledge.goto();
    expect((await knowledge.counts()).total).toBe(before);
  });
});
