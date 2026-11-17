import { test, expect } from '../../fixtures';

/**
 * CLIENT SITES - answer accuracy for SARIN Energy, Juicey Delta and Ross Beauty Center.
 * Needs: the three sites crawled into Samina's Workspace (done 14 Nov 2026).
 * Tagged @ai: real chat messages, slow, uses credits ->  npm run test:ai  or
 *   npx playwright test tests/client-sites
 *
 * Each row = one question + a pattern the answer MUST contain (the fact from the real website).
 * knownBug rows fail today because of BUG-01 (chat searches the web instead of the knowledge base).
 * When BUG-01 is fixed they will report "expected to fail but passed" -> delete knownBug.
 */
const MAIN_WS = process.env.HOOPI_MAIN_WORKSPACE || "Samina's Workspace";

const CASES: { tc: string; site: string; q: string; must: RegExp; knownBug?: string }[] = [
  // SARIN Energy Solutions (sarinenergy.com)
  { tc: 'TC-705', site: 'SARIN', q: 'Where is the headquarters of SARIN Energy Solutions?', must: /Lenexa/i },
  { tc: 'TC-706', site: 'SARIN', q: 'Which university tested SARIN UVC sanitizing lights?', must: /Kansas State/i },
  { tc: 'TC-707', site: 'SARIN', q: 'What is SARIN product 11701?', must: /gas price sign/i },
  { tc: 'TC-708', site: 'SARIN', q: 'What is the email address for SARIN Energy Solutions?', must: /LED@sarinenergy\.com/i },
  // Juicey Delta (juiceydelta.com)
  { tc: 'TC-711', site: 'Juicey Delta', q: 'What is the maximum THC content of products sold by Juicey Delta?', must: /0\.3\s?%/, knownBug: 'BUG-01: answered mg per bottle from the web' },
  { tc: 'TC-712', site: 'Juicey Delta', q: 'How much does the Jeeter THCA Mini Pre Rolls 6 pack in Durban Poison cost at Juicey Delta?', must: /\$?28(\.00)?/ },
  { tc: 'TC-714', site: 'Juicey Delta', q: 'Is Juicey Delta running a sale or closing down?', must: /(final sale|60\s?%|nov(ember)?\.? 30)/i, knownBug: 'BUG-01: said no sale/closing' },
  // Ross Beauty Center (rossbeautycenter.com)
  { tc: 'TC-716', site: 'Ross Beauty Center', q: 'What is the address of Ross Beauty Center?', must: /30097/, knownBug: 'BUG-01: gave ZIP 30096 from the web' },
  { tc: 'TC-717', site: 'Ross Beauty Center', q: 'What are the business hours of Ross Beauty Center?', must: /10(:00)?\s?(am|a\.m\.)?\s?[-–to ]+\s?5(:00)?\s?(pm|p\.m\.)/i, knownBug: 'BUG-01: said hours are not listed' },
  { tc: 'TC-718', site: 'Ross Beauty Center', q: 'What is the phone number for Ross Beauty Center?', must: /470[\s.\-)]*469[\s.\-]*1859/ },
  { tc: 'TC-719', site: 'Ross Beauty Center', q: 'Who is the founder of Ross Beauty Center?', must: /Rosibel/i },
  { tc: 'TC-723', site: 'Ross Beauty Center', q: 'How many clients has Ross Beauty Center served?', must: /6,?000/ },
  // Explicit knowledge-base questions (these work today)
  { tc: 'TC-725', site: 'Knowledge base', q: 'According to my knowledge base, what are the business hours of Ross Beauty Center?', must: /10(:00)?\s?(am)?\s?[-–to ]+\s?5(:00)?\s?(pm)?/i },
  { tc: 'TC-726', site: 'Knowledge base', q: 'According to my knowledge base, is Juicey Delta running a sale or closing down?', must: /(final sale|60\s?%|nov(ember)?\.? 30)/i },
];

test.describe('Client sites - answer accuracy @ai', () => {
  test.describe.configure({ timeout: 240_000 });

  test.beforeEach(async ({ home, chat }) => {
    await home.goto();
    await home.switchWorkspace(MAIN_WS);
    await chat.goto();
    await chat.page.getByRole('button', { name: 'New chat' }).click(); // fresh chat: no earlier answers in context
  });

  for (const c of CASES) {
    test(`${c.tc} [${c.site}] ${c.q}`, async ({ chat }) => {
      if (c.knownBug) test.fail(true, `Known bug ${c.knownBug}`);
      await chat.ask(c.q);
      // The answer bubble appears after the question; wait until it contains the expected fact
      await expect(chat.page.getByText(c.must).last()).toBeVisible({ timeout: 200_000 });
    });
  }
});
