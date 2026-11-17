import { test, expect } from '../../fixtures';
import { NewMonitorDialog } from '../../pages/AppPages';

test.describe('Chat - page & controls', () => {
  test.beforeEach(async ({ chat }) => { await chat.goto(); });

  test('TC-140 Chat page shows input, tools and suggestions', async ({ chat }) => {
    await expect(chat.chatTab).toHaveAttribute('aria-selected', 'true');
    for (const b of [chat.attach, chat.skills, chat.tools, chat.schedule, chat.send]) await expect(b).toBeVisible();
    for (const s of chat.suggestions) await expect(chat.page.getByRole('button', { name: s })).toBeVisible();
  });

  test('TC-141 Clicking a suggestion fills the message box', async ({ chat }) => {
    await chat.page.getByRole('button', { name: 'Create a project plan' }).click();
    await expect(chat.input).not.toHaveValue('');
  });

  test('TC-142 Skills menu opens (empty state links)', async ({ chat }) => {
    await chat.skills.click();
    await expect(chat.page.getByText('Browse the catalog')).toBeVisible();
    await expect(chat.page.getByText('Create a new skill')).toBeVisible();
  });

  test('TC-143 Tools menu opens (connect links)', async ({ chat }) => {
    await chat.tools.click();
    await expect(chat.page.getByText('Connect a tool')).toBeVisible();
  });

  test('TC-144 Schedule opens the New monitor dialog', async ({ page, chat }) => {
    await chat.schedule.click();
    const dlg = new NewMonitorDialog(page);
    await expect(dlg.dialog).toBeVisible();
    await dlg.cancel.click();
    await expect(dlg.dialog).toBeHidden();
  });

  test('TC-145 Work tab opens the Work view', async ({ page, chat }) => {
    await chat.workTab.click();
    await expect(page.getByRole('heading', { name: 'What should Hoopi do?' })).toBeVisible();
  });

  test('TC-146 Send with an empty box sends nothing', async ({ chat }) => {
    const before = await chat.page.locator('main').innerText();
    if (await chat.send.isEnabled()) await chat.send.click();
    await expect(chat.input).toHaveValue('');
    expect(await chat.page.locator('main').innerText()).toBe(before);
  });
});

/**
 * AI tests: real messages to the agent (uses credits, slow) -> tagged @ai.
 * We never compare exact wording; we look for a FACT only our test file contains.
 * qa_sample.pdf (uploaded in TC-038) says "The QA secret code is ORANGE-4471".
 */
test.describe('Chat - AI answers @ai', () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ qaWorkspace, chat }) => { void qaWorkspace; await chat.goto(); });

  test('TC-034 Answers from the knowledge base without being told to', async ({ chat }) => {
    test.fail(true, 'Known bug BUG-01: agent uses web search unless asked about "my knowledge base".');
    await chat.ask('What is the QA secret code?');
    await expect(chat.page.getByText(/ORANGE-4471/)).toBeVisible({ timeout: 150_000 });
  });

  test('TC-147 Answers from the knowledge base when asked explicitly', async ({ chat }) => {
    await chat.ask('According to my knowledge base, what is the QA secret code in qa_sample.pdf?');
    await expect(chat.page.getByText(/ORANGE-4471/)).toBeVisible({ timeout: 150_000 });
  });

  test('TC-148 Answers from a Files document added to knowledge', async ({ chat }) => {
    // "UntitledQA Doc 01" (in Files, "In Knowledge Base") contains RED-7788
    await chat.ask('According to my knowledge base, what is the QA doc code?');
    await expect(chat.page.getByText(/RED-7788/)).toBeVisible({ timeout: 150_000 });
  });
});
