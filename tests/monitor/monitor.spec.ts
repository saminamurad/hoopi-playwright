import { test, expect } from '../../fixtures';
import { NewMonitorDialog } from '../../pages/AppPages';

test.describe('Monitor (outputs) page', () => {
  test.beforeEach(async ({ monitor }) => { await monitor.goto(); });

  test('TC-160 Monitor page shows stats, filters and format chips', async ({ page, monitor }) => {
    await expect(page.getByText('WAITING FOR YOUR REVIEW', { exact: false })).toBeVisible();
    await expect(monitor.search).toBeVisible();
    for (const chip of monitor.formatChips) {
      await expect(page.getByRole('button', { name: new RegExp('^' + chip) })).toBeVisible();
    }
  });

  test('TC-161 Card / List view toggle works', async ({ monitor }) => {
    await monitor.listView.click();
    await monitor.cardView.click();
    await expect(monitor.cardView).toBeVisible();
  });

  test('TC-162 Search with no match shows nothing broken', async ({ page, monitor }) => {
    await monitor.search.fill('zzz-no-such-output-qa');
    await expect(page.getByRole('heading', { name: 'Monitor' })).toBeVisible();
  });

  test('TC-163 Refresh keeps the page working', async ({ monitor }) => {
    await monitor.refresh.click();
    await monitor.expectHeading('Monitor');
  });
});

test.describe('New monitor dialog (nothing created)', () => {
  let dlg: NewMonitorDialog;
  test.beforeEach(async ({ page, monitor }) => {
    await monitor.goto();
    await monitor.newMonitor.click();
    dlg = new NewMonitorDialog(page);
    await expect(dlg.dialog).toBeVisible();
  });

  test('TC-164 Dialog shows Describe it / Step by step and examples', async () => {
    await expect(dlg.describeTab).toBeVisible();
    await expect(dlg.stepByStepTab).toBeVisible();
    await expect(dlg.description).toBeVisible();
    await expect(dlg.example('Check my help desk')).toBeVisible();
  });

  test('TC-165 Picking an example fills the description', async () => {
    await dlg.example('Watch our pricing page').click();
    await expect(dlg.description).toHaveValue(/pricing page/i);
  });

  test('TC-166 Create monitor is not possible with an empty description', async () => {
    await expect(dlg.description).toHaveValue('');
    if (await dlg.create.isEnabled()) {
      await dlg.create.click();
      await expect(dlg.dialog).toBeVisible(); // still open = not created
    } else {
      await expect(dlg.create).toBeDisabled();
    }
  });

  test('TC-167 Step by step view opens', async () => {
    await dlg.stepByStepTab.click();
    await expect(dlg.dialog).toBeVisible();
  });

  test('TC-168 Cancel closes without creating', async () => {
    await dlg.description.fill('QA test monitor - should never be created');
    await dlg.cancel.click();
    await expect(dlg.dialog).toBeHidden();
  });
});

test.describe('Schedules page', () => {
  test('TC-169 Settings > Schedules shows Monitors with counters', async ({ page }) => {
    await page.goto('/dashboard/schedules');
    await expect(page).toHaveURL(/tab=schedules/);
    await expect(page.getByRole('heading', { level: 1, name: 'Monitors' })).toBeVisible();
    for (const label of ['In progress', 'Completed', 'Failed', 'Scheduled']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });
});
