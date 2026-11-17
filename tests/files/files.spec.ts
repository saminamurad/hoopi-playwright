import { test, expect } from '../../fixtures';

test.describe('Files page', () => {
  test.beforeEach(async ({ files }) => { await files.goto(); });

  test('TC-200 Files page shows tabs, search and actions', async ({ files }) => {
    for (const t of ['All', 'Uploaded', 'Documents', 'Agent generated'] as const) await expect(files.tab(t)).toBeVisible();
    await expect(files.search).toBeVisible();
    await expect(files.newDocument).toBeVisible();
    await expect(files.uploadFiles).toBeVisible();
  });

  test('TC-201 "All" count = Uploaded + Documents (+ Agent generated)', async ({ files }) => {
    const all = await files.tabCount('All');
    const uploaded = await files.tabCount('Uploaded');
    const docs = await files.tabCount('Documents');
    expect(all).toBeGreaterThanOrEqual(uploaded + docs);
  });

  test('TC-202 Uploaded tab shows only uploaded files', async ({ page, files }) => {
    await files.tab('Uploaded').click();
    await expect(page.locator('main').getByText(/Uploaded ·/).first()).toBeVisible();
    await expect(page.locator('main').getByText(/^Document ·/)).toHaveCount(0);
  });

  test('TC-203 Search filters files', async ({ page, files }) => {
    await files.search.fill('qa_notes');
    await expect(page.locator('main').getByText('qa_notes.txt').first()).toBeVisible();
    await expect(page.locator('main').getByText('qa_app.exe')).toHaveCount(0);
  });

  test('TC-204 File actions menu: Open, Download, Delete', async ({ page, files }) => {
    await files.search.fill('qa_notes');
    await files.actionsFor('qa_notes.txt').click();
    for (const item of ['Open', 'Download', 'Delete']) {
      await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape'); // do NOT click Delete
  });

  test('TC-205 Download gives the right file', async ({ page, files }) => {
    await files.search.fill('qa_notes');
    await files.actionsFor('qa_notes.txt').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'Download' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('qa_notes');
  });

  test('TC-206 Card / List view toggle', async ({ page }) => {
    await page.getByRole('button', { name: 'List view' }).click();
    await page.getByRole('button', { name: 'Card view' }).click();
    await expect(page.getByRole('heading', { name: 'Files' })).toBeVisible();
  });
});

test.describe('Files - documents @writes', () => {
  test.beforeEach(async ({ qaWorkspace, files }) => { void qaWorkspace; await files.goto(); });

  test('TC-062 New document opens the editor', async ({ page, files }) => {
    await files.newDocument.click();
    await expect(page).toHaveURL(/\/dashboard\/documents\/\d+/, { timeout: 30_000 });
  });

  test('TC-063 New document title has no leftover "Untitled"', async ({ page, files }) => {
    test.fail(true, 'Known bug BUG-04: title becomes "UntitledQA Doc 02".');
    await files.newDocument.click();
    await expect(page).toHaveURL(/\/dashboard\/documents\/\d+/, { timeout: 30_000 });
    const title = page.getByRole('textbox').first();
    await title.click();
    await page.keyboard.type('QA Doc 02');
    await expect(title).toHaveText('QA Doc 02');
  });
});
