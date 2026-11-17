import { test, expect } from '../../fixtures';
import { SETTINGS_PAGES } from '../../pages/SettingsPages';

/**
 * NAVIGATION - header + sidebar on every page inside a workspace.
 * Tests start on KHome: the Home page (/dashboard/home) is a workspace picker with no sidebar.
 * Data-driven: one table, a loop creates one test per row.
 */
const SIDEBAR = [
  { tc: 'TC-101', link: 'Get Started', url: /\/dashboard\/khome/,     heading: /^(Get Started|KHome)$/ },
  { tc: 'TC-102', link: 'Chat',        url: /\/dashboard\/agent/,     heading: /^Good (morning|afternoon|evening)/ },
  { tc: 'TC-103', link: 'Monitor',     url: /\/dashboard\/outputs/,   heading: 'Monitor' },
  { tc: 'TC-104', link: 'Sources',     url: /\/dashboard\/knowledge/, heading: 'Knowledge Base' },
  { tc: 'TC-105', link: 'Files',       url: /\/dashboard\/files/,     heading: 'Files' },
];

test.describe('Navigation - sidebar', () => {
  for (const row of SIDEBAR) {
    test(`${row.tc} Sidebar "${row.link}" opens the right page`, async ({ page, khome }) => {
      await khome.goto();
      await khome.sidebarLink(row.link).click();
      await expect(page).toHaveURL(row.url);
      await khome.expectHeading(row.heading);
    });
  }

  SETTINGS_PAGES.forEach((row, i) => {
    const tc = `TC-${110 + i}`;
    test(`${tc} Settings > "${row.link}" opens the right page`, async ({ page, khome }) => {
      await khome.goto();
      await khome.openSettingsLink(row.link);
      await expect(page).toHaveURL(new RegExp(row.url));
      await khome.expectHeading(row.heading);
    });
  });

  test('TC-106 Hoopi logo goes to Home', async ({ page, khome }) => {
    await khome.goto();
    await khome.logo.click();
    await expect(page).toHaveURL(/\/dashboard\/home/);
  });

  test('TC-107 Sidebar "Dashboard" opens executive dashboard', async ({ page, khome }) => {
    test.fail(true, 'Known bug BUG-05: Owner sees "Dashboard is Hidden".');
    await khome.goto();
    await khome.sidebarLink('Dashboard').click();
    await expect(page).toHaveURL(/\/dashboard\/executive/);
    await expect(page.getByText('Dashboard is Hidden')).toHaveCount(0);
  });
});

test.describe('Navigation - header menus', () => {
  test('TC-120 Workspace menu lists owned workspaces and actions', async ({ page, khome }) => {
    await khome.goto();
    await khome.workspaceButton.click();
    await expect(page.getByText('Workspaces you own', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Shared with you', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Manage workspaces')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('TC-121 Workspace settings menu shows all actions', async ({ page, khome }) => {
    await khome.goto();
    await khome.workspaceSettingsIcon.click();
    for (const item of ['Edit workspace', 'Save as template', 'Transfer ownership', 'Archive workspace']) {
      await expect(page.getByText(item, { exact: true })).toBeVisible();
    }
    await page.keyboard.press('Escape'); // never click Archive / Transfer in tests
  });

  test('TC-122 Account menu shows profile options', async ({ page, khome }) => {
    await khome.goto();
    await khome.accountButton.click();
    for (const item of ['Profile', 'Product tour', 'View Plans', 'Billing', 'Sign out']) {
      await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape'); // never click Sign out: it would kill the saved session
  });

  test('TC-123 Add-people icon opens the invite dialog', async ({ khome }) => {
    await khome.goto();
    await khome.addPeopleIcon.click();
    await expect(khome.dialog(/Add people to/)).toBeVisible();
  });

  test('TC-124 Toggle Sidebar hides and shows the sidebar', async ({ khome }) => {
    await khome.goto();
    const chatLink = khome.sidebarLink('Chat');
    await expect(chatLink).toBeVisible();
    await khome.toggleSidebar.click();
    await expect(chatLink).toBeHidden();
    await khome.toggleSidebar.click();
    await expect(chatLink).toBeVisible();
  });
});

test.describe('Home page', () => {
  test('TC-130 Home greets the user and lists workspaces', async ({ home }) => {
    await home.goto();
    await expect(home.workspacesHeading).toBeVisible();
    await expect(home.newWorkspace).toBeVisible();
  });
});
