import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Things that exist on EVERY Hoopi page: header, sidebar, toasts.
 * Every other page object "extends" this, so they all get these for free.
 *
 * Labels below were recorded from the live app on 11 Nov 2026.
 */
export class BasePage {
  readonly page: Page;

  // ---- Header (top bar) ----
  readonly logo: Locator;
  readonly toggleSidebar: Locator;
  readonly workspaceButton: Locator;
  readonly addPeopleIcon: Locator;
  readonly workspaceSettingsIcon: Locator;

  // ---- Sidebar ----
  readonly settingsButton: Locator;
  readonly accountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('a[href="/dashboard/home"]').first();
    this.toggleSidebar = page.getByRole('button', { name: 'Toggle Sidebar' });
    // The workspace button shows the current workspace name, e.g. "QA Test WS 01".
    // It has no label of its own, so we find the first button whose text is one of our workspace names.
    const names = [process.env.HOOPI_QA_WORKSPACE || 'QA Test WS 01', process.env.HOOPI_MAIN_WORKSPACE || "Samina's Workspace"];
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.workspaceButton = page.getByRole('button', { name: new RegExp('^(' + names.map(esc).join('|') + ')') }).first();
    this.addPeopleIcon = page.getByRole('button', { name: 'Add people to this workspace' });
    this.workspaceSettingsIcon = page.getByRole('button', { name: 'Workspace settings' });
    this.settingsButton = page.getByRole('button', { name: 'Settings', exact: true });
    this.accountButton = page.getByRole('button', { name: 'Account', exact: true });
  }

  /** A sidebar link by its visible name: Dashboard, Get Started, Chat, Monitor, Sources, Files */
  sidebarLink(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true }).first();
  }

  /** Settings sub-menu link: Usage overview, Org & workspaces, Governance, Skills, ... */
  async openSettingsLink(name: string) {
    await this.settingsButton.click();
    await this.page.getByRole('link', { name, exact: true }).click();
  }

  /** Any toast / notification message */
  toast(text: string | RegExp): Locator {
    return this.page.getByText(text).first();
  }

  /** The open dialog (pop-up window) */
  dialog(name?: string | RegExp): Locator {
    return name ? this.page.getByRole('dialog', { name }) : this.page.getByRole('dialog');
  }

  /**
   * Switch workspace from the header menu.
   * Hoopi then redirects to /dashboard (known BUG-10), so callers navigate again afterwards.
   */
  async switchWorkspace(name: string) {
    const current = (await this.workspaceButton.innerText()).trim();
    if (current.startsWith(name)) return; // already there
    await this.workspaceButton.click();
    // The menu is rendered after the header in the page, so .last() is the menu entry
    await this.page.getByText(name, { exact: true }).last().click();
    await expect(this.workspaceButton).toContainText(name.slice(0, 8));
  }

  /** Waits for the main heading of a page */
  async expectHeading(name: string | RegExp) {
    await expect(this.page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 });
  }
}
