import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/* One small class per Hoopi page. Labels recorded from the live app (11 Nov 2026). */

/** /dashboard/home - "Good evening, Samina" + Your workspaces */
export class HomePage extends BasePage {
  readonly newWorkspace = this.page.getByRole('button', { name: 'New workspace' });
  readonly workspacesHeading = this.page.getByRole('heading', { name: 'Your workspaces' });
  async goto() { await this.page.goto('/dashboard/home'); await this.expectHeading(/^Good (morning|afternoon|evening)/); }
  workspaceCard(name: string) { return this.page.getByRole('button', { name: new RegExp(name) }); }
}

/** /dashboard/agent - Chat (and the "Work" tab -> /dashboard) */
export class ChatPage extends BasePage {
  readonly chatTab = this.page.getByRole('tab', { name: 'Chat' });
  readonly workTab = this.page.getByRole('tab', { name: 'Work' });
  readonly input = this.page.getByPlaceholder(/Ask Hoopi anything/);
  readonly send = this.page.getByRole('button', { name: 'Send message' });
  readonly attach = this.page.getByRole('button', { name: 'Attach' });
  readonly skills = this.page.getByRole('button', { name: 'Skills', exact: true });
  readonly tools = this.page.getByRole('button', { name: 'Tools', exact: true });
  readonly schedule = this.page.getByRole('button', { name: 'Schedule', exact: true });
  readonly voice = this.page.getByRole('button', { name: 'Start voice input' });
  readonly suggestions = ['Summarize my recent files', 'Help me debug an issue', 'Create a project plan', 'Analyze data from a spreadsheet'];

  async goto() { await this.page.goto('/dashboard/agent'); await expect(this.input).toBeVisible({ timeout: 20_000 }); }

  /** Type a question and send it */
  async ask(question: string) {
    await this.input.fill(question);
    await this.send.click();
  }
}

/** /dashboard/outputs - "Monitor" in the sidebar */
export class MonitorPage extends BasePage {
  readonly refresh = this.page.getByRole('button', { name: 'Refresh' });
  readonly newMonitor = this.page.getByRole('button', { name: 'New monitor' });
  readonly search = this.page.getByPlaceholder('Search outputs');
  readonly cardView = this.page.getByRole('button', { name: 'Card view' });
  readonly listView = this.page.getByRole('button', { name: 'List view' });
  readonly formatChips = ['All formats', 'Document', 'Report', 'Data table', 'Chart', 'Deck', 'File', 'Email draft'];
  async goto() { await this.page.goto('/dashboard/outputs'); await this.expectHeading('Monitor'); }
}

/** "New monitor" dialog (Monitor page, Schedules page, Chat > Schedule) */
export class NewMonitorDialog {
  readonly dialog: Locator;
  readonly describeTab: Locator;
  readonly stepByStepTab: Locator;
  readonly description: Locator;
  readonly create: Locator;
  readonly cancel: Locator;
  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New monitor' });
    this.describeTab = this.dialog.getByRole('button', { name: 'Describe it' }).or(this.dialog.getByRole('tab', { name: 'Describe it' }));
    this.stepByStepTab = this.dialog.getByRole('button', { name: 'Step by step', exact: true }).or(this.dialog.getByRole('tab', { name: 'Step by step' }));
    this.description = this.dialog.getByLabel('What should this monitor do?');
    this.create = this.dialog.getByRole('button', { name: 'Create monitor' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
  }
  example(startsWith: string) { return this.dialog.getByRole('button', { name: new RegExp('^' + startsWith) }); }
}

/** /dashboard/knowledge - "Sources" in the sidebar */
export class KnowledgePage extends BasePage {
  readonly crawlWebsite = this.page.getByRole('button', { name: 'Crawl website' });
  readonly uploadDocuments = this.page.getByRole('button', { name: 'Upload documents' });
  readonly search = this.page.getByPlaceholder('Search documents…');
  readonly summary = this.page.getByText(/\d+ documents · \d+ searchable/);
  readonly fileInput = this.page.locator('main input[type=file]');
  async goto() {
    await this.page.goto('/dashboard/knowledge');
    await this.expectHeading('Knowledge Base');
    await expect(this.summary).toBeVisible({ timeout: 30_000 }); // list shows "Loading…" first
  }
  /** "15 documents · 10 searchable · 5 failed" -> {total, searchable, failed} */
  async counts() {
    const t = await this.page.getByText(/\d+ documents/).first().innerText();
    const n = (re: RegExp) => Number(t.match(re)?.[1] ?? 0);
    return { total: n(/(\d+) documents/), searchable: n(/(\d+) searchable/), failed: n(/(\d+) failed/) };
  }
  row(fileName: string) { return this.page.locator('main').getByText(fileName, { exact: true }).first(); }
}

/** /dashboard/files */
export class FilesPage extends BasePage {
  readonly newDocument = this.page.getByRole('button', { name: 'New document' });
  readonly uploadFiles = this.page.getByRole('button', { name: 'Upload files' });
  readonly search = this.page.getByPlaceholder('Search files…');
  readonly cards = this.page.getByTestId('library-cards');
  tab(name: 'All' | 'Uploaded' | 'Documents' | 'Agent generated') { return this.page.getByRole('tab', { name: new RegExp('^' + name) }); }
  actionsFor(fileName: string) { return this.page.getByRole('button', { name: `Actions for ${fileName}` }); }
  async goto() { await this.page.goto('/dashboard/files'); await this.expectHeading('Files'); }
  /** "Uploaded 4" tab -> 4 */
  async tabCount(name: 'All' | 'Uploaded' | 'Documents') {
    return Number((await this.tab(name).innerText()).match(/\d+/)?.[0] ?? 0);
  }
}
