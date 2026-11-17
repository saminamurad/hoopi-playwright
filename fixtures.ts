import { test as base, expect, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { KHomePage } from './pages/KHomePage';
import { HomePage, ChatPage, MonitorPage, KnowledgePage, FilesPage } from './pages/AppPages';
import {
  UsageOverviewPage, OrgWorkspacesPage, GovernancePage, SkillsPage, MemoryPage,
  PersonalizationsPage, IntegrationsPage, McpServersPage, ApiKeysPage,
} from './pages/SettingsPages';

/**
 * FIXTURES = things Playwright hands to a test automatically.
 * Built-in ones: page, browser, context, request.
 * Here we add our own: write  async ({ knowledge }) => { ... }  in a test
 * and Playwright creates `new KnowledgePage(page)` for you.
 */
type Pages = {
  khome: KHomePage; home: HomePage; chat: ChatPage; monitor: MonitorPage;
  knowledge: KnowledgePage; files: FilesPage; usage: UsageOverviewPage; org: OrgWorkspacesPage;
  governance: GovernancePage; skills: SkillsPage; memory: MemoryPage; personalizations: PersonalizationsPage;
  integrations: IntegrationsPage; mcp: McpServersPage; apiKeys: ApiKeysPage;
  /** Switches to the safe QA workspace before the test (use it in every @writes test) */
  qaWorkspace: void;
};

export const QA_WS = process.env.HOOPI_QA_WORKSPACE || 'QA Test WS 01';

/** Chrome test profile that `npm run auth` logs in to. Tests run inside it, so they always use your live login. */
export const PROFILE_DIR = path.resolve('playwright/.chrome-profile');

type Options = {
  /** true (default) = run inside the logged-in Chrome test profile; false = fresh logged-out browser (TC-002) */
  useLoginProfile: boolean;
};

type Workers = {
  /** Opens the logged-in Chrome test profile ONCE per run and shares it between tests. */
  loginChrome: () => Promise<BrowserContext>;
};

export const test = base.extend<Pages & Options, Workers>({
  useLoginProfile: [true, { option: true }],

  /**
   * Hoopi keeps its login in a rotating refresh cookie plus browser storage, so a copied login file goes stale.
   * Instead the tests run inside the real Chrome test profile (playwright/.chrome-profile) that you logged into
   * with `npm run auth`. ONE Chrome window opens for the whole run and every test reuses it.
   * Don't close that window while tests are running.
   */
  loginChrome: [async ({ playwright }, use, workerInfo) => {
    let ctx: BrowserContext | undefined;
    const projectUse = workerInfo.project.use;
    await use(async () => {
      if (ctx) return ctx;
      if (!fs.existsSync(PROFILE_DIR)) throw new Error('No Chrome test profile yet. Run "npm run auth" and log in first.');
      ctx = await playwright.chromium.launchPersistentContext(PROFILE_DIR, {
        channel: process.env.PW_CHANNEL ?? 'chrome',
        // Hoopi logs out headless Chrome, so the window is shown unless HEADLESS=1.
        headless: process.env.HEADLESS === '1',
        viewport: projectUse.viewport ?? { width: 1366, height: 900 },
        baseURL: projectUse.baseURL, acceptDownloads: true,
      });
      ctx.on('close', () => { ctx = undefined; }); // window closed by hand -> reopen for the next test
      await ctx.tracing.start({ screenshots: true, snapshots: true });
      return ctx;
    });
    await ctx?.close().catch(() => {});
  }, { scope: 'worker' }],

  context: async ({ useLoginProfile, loginChrome, playwright, headless, viewport, baseURL }, use, testInfo) => {
    if (useLoginProfile) {
      const ctx = await loginChrome();
      await ctx.tracing.startChunk();
      await use(ctx);
      const failed = testInfo.status !== testInfo.expectedStatus;
      try {
        if (failed) {
          const trace = testInfo.outputPath('trace.zip');
          await ctx.tracing.stopChunk({ path: trace });
          await testInfo.attach('trace', { path: trace, contentType: 'application/zip' });
        } else {
          await ctx.tracing.stopChunk();
        }
      } catch { /* window was closed */ }
      return; // keep the shared Chrome open for the next test
    }
    // Logged-out tests (e.g. TC-002) get their own fresh browser.
    const video = process.env.PW_NO_VIDEO ? {} : { recordVideo: { dir: testInfo.outputPath('videos') } };
    const browser = await playwright.chromium.launch({ headless, channel: process.env.PW_CHANNEL || undefined });
    const ctx = await browser.newContext({ viewport, baseURL, ...video });
    await ctx.tracing.start({ screenshots: true, snapshots: true });
    await use(ctx);
    const failed = testInfo.status !== testInfo.expectedStatus;
    if (failed) {
      const trace = testInfo.outputPath('trace.zip');
      await ctx.tracing.stop({ path: trace });
      await testInfo.attach('trace', { path: trace, contentType: 'application/zip' });
    } else {
      await ctx.tracing.stop();
    }
    const videos = ctx.pages().map((p) => p.video()).filter(Boolean);
    await ctx.close();
    if (failed) for (const v of videos) await testInfo.attach('video', { path: await v!.path(), contentType: 'video/webm' });
    await browser.close();
  },

  page: async ({ context }, use, testInfo) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('screenshot', { body: await page.screenshot().catch(() => Buffer.from('')), contentType: 'image/png' });
    }
    // Tidy up for the next test: close extra tabs, leave the main tab on a blank page.
    for (const p of context.pages()) if (p !== page) await p.close().catch(() => {});
    await page.goto('about:blank').catch(() => {});
  },

  khome: async ({ page }, use) => use(new KHomePage(page)),
  home: async ({ page }, use) => use(new HomePage(page)),
  chat: async ({ page }, use) => use(new ChatPage(page)),
  monitor: async ({ page }, use) => use(new MonitorPage(page)),
  knowledge: async ({ page }, use) => use(new KnowledgePage(page)),
  files: async ({ page }, use) => use(new FilesPage(page)),
  usage: async ({ page }, use) => use(new UsageOverviewPage(page)),
  org: async ({ page }, use) => use(new OrgWorkspacesPage(page)),
  governance: async ({ page }, use) => use(new GovernancePage(page)),
  skills: async ({ page }, use) => use(new SkillsPage(page)),
  memory: async ({ page }, use) => use(new MemoryPage(page)),
  personalizations: async ({ page }, use) => use(new PersonalizationsPage(page)),
  integrations: async ({ page }, use) => use(new IntegrationsPage(page)),
  mcp: async ({ page }, use) => use(new McpServersPage(page)),
  apiKeys: async ({ page }, use) => use(new ApiKeysPage(page)),

  qaWorkspace: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();
    await home.switchWorkspace(QA_WS);
    await use();
  },
});

export { expect };
