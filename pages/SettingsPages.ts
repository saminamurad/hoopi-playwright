import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/* Settings sub-pages (sidebar > Settings). Labels recorded from the live app (11 Nov 2026). */

/** One row per settings page: used by the navigation test and by each page's own test. */
export const SETTINGS_PAGES = [
  { link: 'Usage overview',   url: '/dashboard/usage-overview',   heading: 'Usage overview' },
  { link: 'Org & workspaces', url: '/dashboard/overview',         heading: 'Org & workspaces' },
  { link: 'Governance',       url: '/dashboard/governance',       heading: 'Governance' },
  { link: 'Skills',           url: '/dashboard/skills',           heading: 'Skills' },
  { link: 'Memory',           url: '/dashboard/memory',           heading: 'Memory' },
  { link: 'Personalizations', url: '/dashboard/personalizations', heading: 'Personalizations' },
  { link: 'Integrations',     url: '/dashboard/integrations',     heading: 'Integrations' },
  { link: 'MCP servers',      url: '/dashboard/mcp-servers',      heading: 'MCP servers' },
  { link: 'API keys',         url: '/dashboard/api-keys',         heading: 'API keys & MCP server' },
  { link: 'Schedules',        url: '/dashboard/work',             heading: 'Monitors' }, // redirects to /dashboard/work?tab=schedules
] as const;

export class UsageOverviewPage extends BasePage {
  readonly sync = this.page.getByRole('button', { name: 'Sync' });
  readonly addAlert = this.page.getByRole('button', { name: 'Add alert' });
  readonly startDate = this.page.getByLabel('Start date');
  readonly endDate = this.page.getByLabel('End date');
  readonly apply = this.page.getByRole('button', { name: 'Apply' });
  readonly byModel = this.page.getByRole('tab', { name: 'By Model' });
  readonly byChannel = this.page.getByRole('tab', { name: 'By Channel' });
  readonly ranges = ['Today', 'This month', 'Last 30 days', 'Last 7 days', 'All time'];
  async goto() { await this.page.goto('/dashboard/usage-overview'); await this.expectHeading('Usage overview'); }
  workspaceRow(name: string) { return this.page.getByRole('button', { name: `Open usage for ${name}` }); }
}

export class OrgWorkspacesPage extends BasePage {
  readonly newWorkspace = this.page.getByRole('button', { name: 'New workspace' });
  readonly table = this.page.getByRole('table').first();
  async goto() { await this.page.goto('/dashboard/overview'); await this.expectHeading('Org & workspaces'); }
}

export class GovernancePage extends BasePage {
  tab(name: 'Overview' | 'Members' | 'Audit Log' | 'Controls') { return this.page.getByRole('tab', { name }); }
  readonly addPeople = this.page.getByRole('button', { name: 'Add people' });
  readonly exportJson = this.page.getByRole('button', { name: 'Export JSON' });
  readonly refresh = this.page.getByRole('button', { name: 'Refresh' });
  /** Controls tab switches, e.g. toggle('Knowledge') -> "Toggle Knowledge" */
  toggle(feature: string) { return this.page.getByRole('switch', { name: `Toggle ${feature}` }); }
  readonly controlFeatures = ['Agent chat', 'Work Agents', 'Records', 'Workflows', 'Knowledge', 'Files', 'Skills', 'Memory', 'Personalizations', 'Integrations'];
  async goto() { await this.page.goto('/dashboard/governance'); await this.expectHeading('Governance'); }
}

export class SkillsPage extends BasePage {
  readonly newSkill = this.page.getByRole('button', { name: 'New skill' });
  readonly search = this.page.getByPlaceholder('Search skills');
  readonly total = this.page.getByText(/^\d+ skills$/);
  readonly categories = ['All', 'Analysis', 'Governance', 'Knowledge management', 'Process', 'Q&A', 'Writing'];
  category(name: string) { return this.page.getByRole('button', { name, exact: true }); }
  activateSwitch(skill: string) { return this.page.getByRole('switch', { name: `Activate ${skill}` }); }
  async goto() { await this.page.goto('/dashboard/skills'); await this.expectHeading('Skills'); await expect(this.total).toBeVisible({ timeout: 20_000 }); }
  async count() { return parseInt(await this.total.innerText(), 10); }
}

export class NewSkillDialog {
  readonly dialog: Locator; readonly name: Locator; readonly description: Locator;
  readonly tags: Locator; readonly instructions: Locator; readonly create: Locator; readonly cancel: Locator;
  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New skill' });
    this.name = this.dialog.getByLabel('Name', { exact: true });
    this.description = this.dialog.getByLabel('Description', { exact: true });
    this.tags = this.dialog.getByLabel('Tags');
    this.instructions = this.dialog.getByLabel('Instructions');
    this.create = this.dialog.getByRole('button', { name: 'Create skill' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
  }
  outputFormat(name: 'Markdown' | 'HTML' | 'CSV' | 'PDF' | 'DOCX') { return this.dialog.getByRole('button', { name, exact: true }); }
}

export class MemoryPage extends BasePage {
  readonly newMemory = this.page.getByRole('button', { name: 'New memory' });
  readonly clearAll = this.page.getByRole('button', { name: 'Clear workspace memory' });
  readonly search = this.page.getByPlaceholder('Search memories…');
  readonly total = this.page.getByText(/^\d+ memor(y|ies)$/);
  async goto() { await this.page.goto('/dashboard/memory'); await this.expectHeading('Memory'); }
  async count() { return parseInt(await this.total.innerText(), 10); }
}

export class NewMemoryDialog {
  readonly dialog: Locator; readonly content: Locator; readonly metadata: Locator; readonly create: Locator; readonly cancel: Locator;
  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New memory' });
    this.content = this.dialog.getByLabel('Content');
    this.metadata = this.dialog.getByLabel(/Metadata/);
    this.create = this.dialog.getByRole('button', { name: 'Create memory' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
  }
}

export class PersonalizationsPage extends BasePage {
  readonly model = this.page.getByLabel('Select model');
  readonly saveModel = this.page.getByRole('button', { name: 'Save default model' });
  readonly instructions = this.page.getByLabel('Instructions');
  readonly savePreferences = this.page.getByRole('button', { name: 'Save preferences' });
  readonly temperature = this.page.locator('input[type=range]');
  readonly saveTemperature = this.page.getByRole('button', { name: 'Save temperature' });
  readonly connectKey = this.page.getByRole('button', { name: 'Connect Key' });
  async goto() { await this.page.goto('/dashboard/personalizations'); await this.expectHeading('Personalizations'); }
}

export class IntegrationsPage extends BasePage {
  readonly search = this.page.getByPlaceholder('Search integrations…');
  readonly addCustomApi = this.page.getByRole('button', { name: 'Add custom API' });
  readonly catalogHeading = this.page.getByRole('heading', { name: /^Catalog/ });
  readonly connectedHeading = this.page.getByRole('heading', { name: /^Connected/ });
  async goto() { await this.page.goto('/dashboard/integrations'); await this.expectHeading('Integrations'); }
}

export class McpServersPage extends BasePage {
  readonly addServer = this.page.getByRole('button', { name: 'Add server' });
  async goto() { await this.page.goto('/dashboard/mcp-servers'); await this.expectHeading('MCP servers'); }
}

export class ApiKeysPage extends BasePage {
  readonly createKey = this.page.getByRole('button', { name: 'Create key' });
  readonly refreshStatus = this.page.getByRole('button', { name: 'Refresh status' });
  readonly setupTabs = ['Claude Desktop', 'Cursor IDE', 'OAuth 2.0 (Zero-Config)', 'Zed & Custom Clients'];
  async goto() { await this.page.goto('/dashboard/api-keys'); await this.expectHeading('API keys & MCP server'); }
}
