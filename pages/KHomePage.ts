import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * KHome ("Get Started" in the sidebar) - https://app.hoopi.ai/dashboard/khome
 * Hoopi's developers already added data-testid attributes here (khome-progress, khome-step-1 ...),
 * so we use them: they never change when the wording changes.
 */
export class KHomePage extends BasePage {
  readonly progressText: Locator;
  readonly step1: Locator;
  readonly step2: Locator;
  readonly step3: Locator;
  readonly knowledgeFileInput: Locator;
  readonly filesFileInput: Locator;

  readonly inviteTeammates: Locator;
  readonly askQuestion: Locator;
  readonly uploadDocuments: Locator;
  readonly crawlWebsite: Locator;
  readonly openKnowledge: Locator;
  readonly uploadFiles: Locator;
  readonly newDocument: Locator;
  readonly openFiles: Locator;
  readonly bookDemo: Locator;
  readonly sourceCount: Locator;

  constructor(page: Page) {
    super(page);
    this.progressText = page.getByTestId('khome-progress');
    this.step1 = page.getByTestId('khome-step-1');
    this.step2 = page.getByTestId('khome-step-2');
    this.step3 = page.getByTestId('khome-step-3');
    this.knowledgeFileInput = page.getByTestId('khome-knowledge-input'); // hidden <input type=file>
    this.filesFileInput = page.getByTestId('khome-files-input');

    this.inviteTeammates = page.getByRole('button', { name: 'Invite teammates' });
    this.askQuestion = page.getByRole('button', { name: 'Ask a question' }).or(page.getByRole('link', { name: 'Ask a question' })).first();
    this.uploadDocuments = page.getByRole('button', { name: 'Upload documents' });
    this.crawlWebsite = page.getByRole('button', { name: 'Crawl a website' });
    this.openKnowledge = page.getByRole('link', { name: 'Open Knowledge' });
    this.uploadFiles = page.getByRole('button', { name: 'Upload files' });
    this.newDocument = page.getByRole('button', { name: 'New document' });
    this.openFiles = page.getByRole('link', { name: 'Open Files' });
    this.bookDemo = page.getByRole('link', { name: 'Book a demo' });
    this.sourceCount = this.step1.getByText(/\d+ sources?/);
  }

  async goto() {
    await this.page.goto('/dashboard/khome');
    await this.expectHeading(/^(Get Started|KHome)$/); // renamed from KHome to Get Started on 13 Nov 2026
    await expect(this.progressText).toHaveText(/\d+ of \d+ steps done/, { timeout: 20_000 });
  }

  /** "15 sources · 5 failed" -> 15 */
  async getSourceCount(): Promise<number> {
    return parseInt((await this.sourceCount.innerText()).trim(), 10);
  }
}

/** "Add people to <workspace>" dialog (Invite teammates / person+ icon) */
export class InviteDialog {
  readonly dialog: Locator;
  readonly email: Locator;
  readonly role: Locator;
  readonly submit: Locator;
  readonly cancel: Locator;
  readonly close: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: /Add people to/ });
    this.email = this.dialog.getByLabel('Email address');
    this.role = this.dialog.getByRole('combobox').first();
    this.submit = this.dialog.getByRole('button', { name: 'Add to workspace' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.close = this.dialog.getByRole('button', { name: 'Close' });
  }
}

/** "Crawl a website" dialog (KHome and Sources page) */
export class CrawlDialog {
  readonly dialog: Locator;
  readonly url: Locator;
  readonly maxPages: Locator;
  readonly maxDepth: Locator;
  readonly qaCheckbox: Locator;
  readonly startCrawl: Locator;
  readonly back: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: /Crawl a website/ });
    this.url = this.dialog.getByLabel('Starting URL');
    this.maxPages = this.dialog.getByLabel(/Max pages/);
    this.maxDepth = this.dialog.getByLabel(/Max link depth/);
    this.qaCheckbox = this.dialog.getByLabel(/Also generate suggested Q&A/);
    this.startCrawl = this.dialog.getByRole('button', { name: 'Start crawl' });
    this.back = this.dialog.getByRole('button', { name: 'Back' });
  }
}
