import path from 'node:path';
import { test, expect, QA_WS } from '../../fixtures';
import { InviteDialog, CrawlDialog } from '../../pages/KHomePage';

const file = (name: string) => path.join(__dirname, '../../test-data', name);

test.describe('KHome - page load & access', () => {
  test('TC-001 KHome loads with all step cards', async ({ khome }) => {
    await khome.goto();
    await expect(khome.step1).toContainText('Update knowledge');
    await expect(khome.step2).toBeVisible();
    await expect(khome.step3).toContainText('Set up monitors');
    await expect(khome.askQuestion).toBeVisible();
  });

  test.describe('logged out', () => {
    test.use({ useLoginProfile: false }); // fresh browser, no login
    test('TC-002 Logged-out user is redirected to login', async ({ page }) => {
      await page.goto('/dashboard/khome');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test('TC-004 Refresh keeps the same counts', async ({ page, khome }) => {
    await khome.goto();
    const progress = await khome.progressText.innerText();
    const sources = await khome.getSourceCount();
    await page.reload();
    await expect(khome.progressText).toHaveText(progress, { timeout: 20_000 });
    expect(await khome.getSourceCount()).toBe(sources);
  });

  test('TC-005 Open Knowledge then browser Back returns to KHome', async ({ page, khome }) => {
    await khome.goto();
    await khome.openKnowledge.click();
    await expect(page).toHaveURL(/\/dashboard\/knowledge/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/khome/);
  });

  test('TC-033 Ask a question opens chat', async ({ page, khome }) => {
    await khome.goto();
    await khome.askQuestion.click();
    await expect(page).toHaveURL(/\/dashboard\/agent/);
  });

  test('TC-065 Open Files link opens Files', async ({ page, khome }) => {
    await khome.goto();
    await khome.openFiles.click();
    await expect(page).toHaveURL(/\/dashboard\/files/);
  });

  test('TC-067 Book a demo opens Google Calendar in a new tab', async ({ khome }) => {
    await khome.goto();
    await expect(khome.bookDemo).toHaveAttribute('href', /calendar\.app\.google/);
    await expect(khome.bookDemo).toHaveAttribute('target', '_blank');
  });

  test('TC-076 No console errors on load', async ({ page, khome }) => {
    test.fail(true, 'Known bug BUG-08: 401 + Stripe.js errors on every load.');
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await khome.goto();
    await page.waitForLoadState('networkidle');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('TC-069 Mobile layout has no horizontal scroll @mobile', async ({ page, khome }) => {
    await khome.goto();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});

test.describe('KHome - Invite teammates (validation only, nothing sent)', () => {
  let invite: InviteDialog;
  test.beforeEach(async ({ page, khome }) => {
    invite = new InviteDialog(page);
    await khome.goto();
    await khome.inviteTeammates.click();
    await expect(invite.dialog).toBeVisible();
  });

  test('TC-023 Invite dialog has email, role and buttons', async () => {
    await expect(invite.email).toBeVisible();
    await expect(invite.dialog).toContainText('member');
    await expect(invite.submit).toBeVisible();
  });

  test('TC-027 Empty email shows "Email required"', async ({ khome }) => {
    await invite.submit.click();
    await expect(khome.toast('Email required')).toBeVisible();
  });

  for (const bad of ['abc', 'abc@', '@test.com']) {
    test(`TC-028 Invalid email "${bad}" is blocked`, async ({ khome }) => {
      await invite.email.fill(bad);
      await invite.submit.click();
      await expect(invite.dialog).toBeVisible();
      await expect(khome.toast(/Invite sent/)).toHaveCount(0);
    });
  }

  test('TC-031 Esc closes the dialog without sending', async ({ page, khome }) => {
    await invite.email.fill('qa.cancel@test.com');
    await page.keyboard.press('Escape');
    await expect(invite.dialog).toBeHidden();
    await expect(khome.toast(/Invite sent/)).toHaveCount(0);
  });
});

test.describe('KHome - Crawl a website (form validation, no crawl started)', () => {
  let crawl: CrawlDialog;
  test.beforeEach(async ({ page, khome }) => {
    crawl = new CrawlDialog(page);
    await khome.goto();
    await khome.crawlWebsite.click();
    await expect(crawl.dialog).toBeVisible();
  });

  test('TC-046 Defaults: empty URL, 10 pages, depth 2, Q&A off, Start disabled', async () => {
    await expect(crawl.url).toHaveValue('');
    await expect(crawl.maxPages).toHaveValue('10');
    await expect(crawl.maxDepth).toHaveValue('2');
    await expect(crawl.qaCheckbox).not.toBeChecked();
    await expect(crawl.startCrawl).toBeDisabled();
  });

  test('TC-047 Start crawl enables once a URL is typed', async () => {
    await crawl.url.fill('https://example.com');
    await expect(crawl.startCrawl).toBeEnabled();
  });

  const pages = [['1', true], ['100', true], ['0', false], ['101', false], ['-5', false], ['', false]] as const;
  for (const [value, ok] of pages) {
    test(`TC-051 Max pages "${value}" -> ${ok ? 'allowed' : 'blocked'}`, async () => {
      await crawl.url.fill('https://example.com');
      await crawl.maxPages.fill(value);
      await (ok ? expect(crawl.startCrawl).toBeEnabled() : expect(crawl.startCrawl).toBeDisabled());
    });
  }

  const depths = [['0', true], ['5', true], ['-1', false], ['6', false], ['', false]] as const;
  for (const [value, ok] of depths) {
    test(`TC-052 Max link depth "${value}" -> ${ok ? 'allowed' : 'blocked'}`, async () => {
      await crawl.url.fill('https://example.com');
      await crawl.maxDepth.fill(value);
      await (ok ? expect(crawl.startCrawl).toBeEnabled() : expect(crawl.startCrawl).toBeDisabled());
    });
  }

  test('TC-052 Decimal depth 2.5 is rejected', async () => {
    test.fail(true, 'Known bug BUG-07: decimals are accepted.');
    await crawl.url.fill('https://example.com');
    await crawl.maxDepth.fill('2.5');
    await expect(crawl.startCrawl).toBeDisabled();
  });

  for (const bad of ['example', 'htp://x', 'ftp://x.com', 'abc def']) {
    test(`TC-054 Invalid URL "${bad}" keeps Start crawl disabled`, async () => {
      await crawl.url.fill(bad);
      await expect(crawl.startCrawl).toBeDisabled();
    });
  }

  test('TC-057 Cancel closes without crawling', async ({ page }) => {
    await crawl.url.fill('https://example.com');
    await crawl.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(crawl.dialog).toBeHidden();
    await expect(page.getByText(/Crawl started/)).toHaveCount(0);
  });
});

/** These change data -> tagged @writes and run only in the QA workspace */
test.describe('KHome - Uploads @writes', () => {
  test.beforeEach(async ({ qaWorkspace, khome }) => { void qaWorkspace; await khome.goto(); });

  test('TC-038 Upload a PDF adds one source', async ({ khome }) => {
    const before = await khome.getSourceCount();
    // The real <input type=file> behind "Upload documents" (no OS dialog needed)
    await khome.knowledgeFileInput.setInputFiles(file('qa_sample.pdf'));
    await expect.poll(() => khome.getSourceCount(), { timeout: 60_000 }).toBe(before + 1);
  });

  test('TC-043 Empty PDF is skipped with a message', async ({ khome }) => {
    const before = await khome.getSourceCount();
    await khome.knowledgeFileInput.setInputFiles(file('qa_empty.pdf'));
    await expect(khome.toast(/is empty/)).toBeVisible();
    expect(await khome.getSourceCount()).toBe(before);
  });

  test('TC-060 Upload files adds a file', async ({ page, khome }) => {
    await khome.filesFileInput.setInputFiles(file('qa_notes.txt'));
    await page.goto('/dashboard/files');
    await expect(page.getByText('qa_notes.txt').first()).toBeVisible({ timeout: 30_000 });
  });

  test('TC-016 Switching workspace keeps you on KHome', async ({ page, khome }) => {
    test.fail(true, 'Known bug BUG-10: switching redirects to /dashboard.');
    try {
      await khome.switchWorkspace(process.env.HOOPI_MAIN_WORKSPACE || "Samina's Workspace");
      await expect(page).toHaveURL(/\/dashboard\/khome/);
    } finally {
      await khome.switchWorkspace(QA_WS); // always switch back, even when the check fails
    }
  });
});
