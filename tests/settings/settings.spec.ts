import { test, expect } from '../../fixtures';
import { NewSkillDialog, NewMemoryDialog } from '../../pages/SettingsPages';

/* All Settings pages. Read-only checks + dialog validation. Nothing is saved
   except in the @writes group at the bottom (QA workspace only). */

test.describe('Settings - Usage overview', () => {
  test.beforeEach(async ({ usage }) => { await usage.goto(); });

  test('TC-220 Shows workspace usage table and alerts section', async ({ page, usage }) => {
    await expect(usage.workspaceRow(process.env.HOOPI_QA_WORKSPACE || 'QA Test WS 01')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Account usage alerts' })).toBeVisible();
    await expect(usage.addAlert).toBeVisible();
  });

  test('TC-221 Date range presets can be selected', async ({ page, usage }) => {
    for (const r of usage.ranges) {
      await page.getByRole('button', { name: r, exact: true }).click();
      await expect(usage.startDate).toBeVisible();
    }
  });

  test('TC-222 Custom date range + Apply', async ({ usage }) => {
    await usage.startDate.fill('2026-11-01');
    await usage.endDate.fill('2026-11-10');
    await usage.apply.click();
    await usage.expectHeading('Usage overview');
  });

  test('TC-223 End date before start date is rejected', async ({ page, usage }) => {
    await usage.startDate.fill('2026-11-10');
    await usage.endDate.fill('2026-11-01');
    await usage.apply.click();
    // Expect either an error message or Apply refusing; adjust once you see Hoopi's real behaviour
    await expect(page.getByText(/invalid|before|after/i).first()).toBeVisible();
  });

  test('TC-224 By Model / By Channel tabs switch', async ({ usage }) => {
    await usage.byChannel.click();
    await expect(usage.byChannel).toHaveAttribute('aria-selected', 'true');
    await usage.byModel.click();
    await expect(usage.byModel).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Settings - Org & workspaces', () => {
  test('TC-230 Lists both workspaces with Open and Settings', async ({ page, org }) => {
    await org.goto();
    await expect(page.locator('main').getByText("Samina's Workspace").first()).toBeVisible();
    await expect(page.locator('main').getByText('QA Test WS 01').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open' }).first()).toBeVisible();
    await expect(page.getByText('Current').first()).toBeVisible();
  });
});

test.describe('Settings - Governance', () => {
  test.beforeEach(async ({ governance }) => { await governance.goto(); });

  test('TC-240 Four tabs open', async ({ governance }) => {
    for (const t of ['Members', 'Audit Log', 'Controls', 'Overview'] as const) {
      await governance.tab(t).click();
      await expect(governance.tab(t)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('TC-241 Overview lists the Owner', async ({ page }) => {
    await expect(page.locator('main').getByText('Owner').first()).toBeVisible();
  });

  test('TC-242 Audit Log has Export JSON', async ({ page, governance }) => {
    await governance.tab('Audit Log').click();
    await expect(governance.exportJson).toBeVisible();
    const download = page.waitForEvent('download');
    await governance.exportJson.click();
    expect((await download).suggestedFilename()).toMatch(/\.json$/);
  });

  test('TC-243 Controls shows a switch for every feature', async ({ governance }) => {
    await governance.tab('Controls').click();
    for (const f of governance.controlFeatures) await expect(governance.toggle(f)).toBeVisible();
    // We only LOOK at the switches; flipping them changes what members can see.
  });

  test('TC-244 Records & Workflows are locked by the platform admin', async ({ page, governance }) => {
    await governance.tab('Controls').click();
    await expect(page.getByText('Disabled Globally by Platform Admin').first()).toBeVisible();
  });

  test('TC-245 Members tab has Add people', async ({ governance }) => {
    await governance.tab('Members').click();
    await expect(governance.addPeople).toBeVisible();
  });
});

test.describe('Settings - Skills', () => {
  test.beforeEach(async ({ skills }) => { await skills.goto(); });

  test('TC-260 Skills catalog loads with a count', async ({ skills }) => {
    expect(await skills.count()).toBeGreaterThan(0);
  });

  test('TC-261 Search narrows the list', async ({ page, skills }) => {
    await skills.search.fill('Weather');
    await expect(page.locator('main').getByText('Daily Houston Weather (9am)')).toBeVisible();
    await expect(page.locator('main').getByText('Candidate Screener')).toHaveCount(0);
  });

  test('TC-262 Category filters work', async ({ skills }) => {
    for (const c of skills.categories) {
      await skills.category(c).click();
      await skills.expectHeading('Skills');
    }
  });

  test('TC-263 Built-in skills cannot be deleted', async ({ page, skills }) => {
    await skills.search.fill('Email Sender');
    await expect(page.getByText(/defined in the codebase and cannot be deleted/).first()).toBeAttached();
  });

  test('TC-264 New skill dialog: fields and output formats', async ({ page, skills }) => {
    await skills.newSkill.click();
    const d = new NewSkillDialog(page);
    await expect(d.dialog).toBeVisible();
    for (const f of [d.name, d.description, d.tags, d.instructions]) await expect(f).toBeVisible();
    for (const fmt of ['Markdown', 'HTML', 'CSV', 'PDF', 'DOCX'] as const) await expect(d.outputFormat(fmt)).toBeVisible();
    await d.cancel.click();
    await expect(d.dialog).toBeHidden();
  });

  test('TC-265 New skill cannot be created with empty name', async ({ page, skills }) => {
    await skills.newSkill.click();
    const d = new NewSkillDialog(page);
    if (await d.create.isEnabled()) {
      await d.create.click();
      await expect(d.dialog).toBeVisible(); // still open = blocked
    } else {
      await expect(d.create).toBeDisabled();
    }
    await d.cancel.click();
  });
});

test.describe('Settings - Memory', () => {
  test.beforeEach(async ({ memory }) => { await memory.goto(); });

  test('TC-280 Memory page shows count, search and actions', async ({ memory }) => {
    await expect(memory.total).toBeVisible();
    await expect(memory.newMemory).toBeVisible();
    await expect(memory.clearAll).toBeVisible();
  });

  test('TC-281 New memory dialog: fields, Cancel', async ({ page, memory }) => {
    await memory.newMemory.click();
    const d = new NewMemoryDialog(page);
    await expect(d.content).toBeVisible();
    await expect(d.metadata).toBeVisible();
    await d.cancel.click();
    await expect(d.dialog).toBeHidden();
  });

  test('TC-282 Empty memory cannot be created', async ({ page, memory }) => {
    await memory.newMemory.click();
    const d = new NewMemoryDialog(page);
    if (await d.create.isEnabled()) { await d.create.click(); await expect(d.dialog).toBeVisible(); }
    else await expect(d.create).toBeDisabled();
    await d.cancel.click();
  });

  test('TC-283 Invalid metadata JSON is rejected', async ({ page, memory }) => {
    await memory.newMemory.click();
    const d = new NewMemoryDialog(page);
    await d.content.fill('QA invalid-json check - should not be saved');
    await d.metadata.fill('{not valid json');
    await d.create.click();
    await expect(d.dialog).toBeVisible();
    await expect(page.getByText(/json/i).first()).toBeVisible();
    await d.cancel.click();
  });
});

test.describe('Settings - Personalizations', () => {
  test.beforeEach(async ({ personalizations }) => { await personalizations.goto(); });

  test('TC-300 All four sections are shown', async ({ page }) => {
    for (const h of ['Workspace default model', 'Bring Your Own API Keys (BYOK)', 'Standing instructions', 'Model temperature']) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible();
    }
  });

  test('TC-301 Model list has options', async ({ personalizations }) => {
    expect(await personalizations.model.locator('option').count()).toBeGreaterThan(1);
  });

  test('TC-302 Temperature slider stays within range', async ({ personalizations }) => {
    const t = personalizations.temperature;
    const min = Number(await t.getAttribute('min')); const max = Number(await t.getAttribute('max'));
    const val = Number(await t.inputValue());
    expect(val).toBeGreaterThanOrEqual(min);
    expect(val).toBeLessThanOrEqual(max);
  });
});

test.describe('Settings - Integrations', () => {
  test.beforeEach(async ({ integrations }) => { await integrations.goto(); });

  test('TC-320 Catalog and Connected sections show', async ({ integrations }) => {
    await expect(integrations.catalogHeading).toBeVisible();
    await expect(integrations.connectedHeading).toBeVisible();
  });

  test('TC-321 Search finds Trello', async ({ page, integrations }) => {
    await integrations.search.fill('Trello');
    await expect(page.locator('main').getByText('Trello').first()).toBeVisible();
    await expect(page.locator('main').getByText('Google Ads')).toHaveCount(0);
  });

  test('TC-322 Add custom API dialog requires name and base URL', async ({ page, integrations }) => {
    await integrations.addCustomApi.click();
    const d = page.getByRole('dialog', { name: 'Register Custom API' });
    await expect(d.getByLabel('API Name')).toBeVisible();
    await expect(d.getByLabel('Base URL')).toBeVisible();
    const register = d.getByRole('button', { name: 'Register API' });
    if (await register.isEnabled()) { await register.click(); await expect(d).toBeVisible(); }
    await d.getByRole('button', { name: 'Cancel' }).click();
  });
});

test.describe('Settings - MCP servers', () => {
  test('TC-340 Add server dialog: fields, validation, Cancel', async ({ page, mcp }) => {
    await mcp.goto();
    await mcp.addServer.click();
    const d = page.getByRole('dialog', { name: 'Add MCP Server' });
    await expect(d.getByLabel('Name', { exact: true })).toBeVisible();
    await expect(d.getByLabel('Server URL')).toBeVisible();
    await d.getByLabel('Server URL').fill('not-a-url');
    const connect = d.getByRole('button', { name: 'Connect' });
    if (await connect.isEnabled()) { await connect.click(); await expect(d).toBeVisible(); }
    await d.getByRole('button', { name: 'Cancel' }).click();
    await expect(d).toBeHidden();
  });
});

test.describe('Settings - API keys & MCP server', () => {
  test.beforeEach(async ({ apiKeys }) => { await apiKeys.goto(); });

  test('TC-360 Server status and setup guides are shown', async ({ page, apiKeys }) => {
    await expect(page.getByText('Online & Ready')).toBeVisible();
    for (const t of apiKeys.setupTabs) await expect(page.getByRole('tab', { name: t })).toBeVisible();
  });

  test('TC-361 Setup guide tabs switch', async ({ page, apiKeys }) => {
    for (const t of apiKeys.setupTabs) {
      await page.getByRole('tab', { name: t }).click();
      await expect(page.getByRole('tab', { name: t })).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('TC-362 Create key dialog needs a label (no key generated)', async ({ page, apiKeys }) => {
    await apiKeys.createKey.click();
    const d = page.getByRole('dialog', { name: 'Generate Workspace API Key' });
    await expect(d.getByLabel('Key Label')).toBeVisible();
    const gen = d.getByRole('button', { name: 'Generate Key' });
    if (await gen.isEnabled()) { await gen.click(); await expect(d.getByLabel('Key Label')).toBeVisible(); }
    await d.getByRole('button', { name: 'Cancel' }).click();
  });
});

/* ---------- Create + clean up (QA workspace only) ---------- */
test.describe('Settings - Memory create & delete @writes', () => {
  test('TC-284 Create a memory, find it, delete it', async ({ page, qaWorkspace, memory }) => {
    void qaWorkspace;
    const text = `QA memory ${Date.now()}`; // unique text = easy to find & clean up
    await memory.goto();
    const before = await memory.count();
    await memory.newMemory.click();
    const d = new NewMemoryDialog(page);
    await d.content.fill(text);
    await d.create.click();
    await expect(d.dialog).toBeHidden();
    await expect(page.getByText(text)).toBeVisible();
    await expect.poll(() => memory.count()).toBe(before + 1);

    // Clean up: open the memory's delete control (adjust the locator with codegen if needed)
    const card = page.locator('main').locator('li, article, [role=row], div').filter({ hasText: text }).last();
    await card.getByRole('button', { name: /delete/i }).click();
    const confirm = page.getByRole('button', { name: /^(Delete|Confirm)$/ });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await expect(page.getByText(text)).toHaveCount(0);
  });
});
