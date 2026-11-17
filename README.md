# Hoopi – Playwright automated tests (whole app)

> ## 📊 Test results
> **[➡ Latest test run](results/latest/RESULTS.md)** · [All previous runs](results/README.md) · [Full test case sheet](Hoopi_Full_App_Test_Cases.xlsx)

**131 automated tests** covering every Hoopi page: navigation, KHome, Chat, Monitor, Sources, Files and all 10 Settings pages.
Button and field names were recorded from the live app on 11 Nov 2026. Each test title starts with a **TC ID**, so results go straight into your test sheet.

## Folder map

```
hoopi-playwright/
├─ playwright.config.ts   # browsers, timeouts, reports, saved login
├─ fixtures.ts            # gives every test ready-made page objects (khome, chat, files ...)
├─ pages/                 # PAGE OBJECTS: every button/field name lives here, once
│  ├─ BasePage.ts         #   header + sidebar + toasts (shared by all pages)
│  ├─ KHomePage.ts        #   KHome + Invite dialog + Crawl dialog
│  ├─ AppPages.ts         #   Home, Chat, Monitor, Sources, Files
│  └─ SettingsPages.ts    #   Usage, Org, Governance, Skills, Memory, Personalizations,
│                         #   Integrations, MCP servers, API keys
├─ tests/                 # the TESTS, one folder per area
│  ├─ navigation/  khome/  chat/  monitor/  knowledge/  files/  settings/
├─ test-data/             # qa_sample.pdf (contains ORANGE-4471), qa_broken.pdf, qa_empty.pdf ...
└─ scripts/               # results -> sheet CSV, test list -> sheet CSV
```

## Test IDs by area

| IDs | Area | Spec file |
| --- | --- | --- |
| TC-001 – TC-076 | KHome (your existing sheet) | tests/khome/khome.spec.ts |
| TC-101 – TC-130 | Sidebar, Settings menu, header menus, Home | tests/navigation/navigation.spec.ts |
| TC-140 – TC-148 | Chat + AI answers | tests/chat/chat.spec.ts |
| TC-160 – TC-169 | Monitor, New monitor dialog, Schedules | tests/monitor/monitor.spec.ts |
| TC-180 – TC-185 | Sources (Knowledge Base) | tests/knowledge/knowledge.spec.ts |
| TC-200 – TC-206 | Files | tests/files/files.spec.ts |
| TC-220 – TC-362 | All Settings pages | tests/settings/settings.spec.ts |

## Tags: what is safe to run

| Tag | Meaning | Included in |
| --- | --- | --- |
| *(none)* | Read-only: opens pages and dialogs, checks them, cancels | every run |
| `@writes` | Uploads, creates a document or memory. Switches to **QA Test WS 01** first | `npm test` |
| `@ai` | Sends real chat messages (slow, uses credits) | `npm run test:ai` only |
| `@mobile` | Phone layout | `--project=mobile` |

Tests **never** click Sign out, Delete (except their own test memory), Archive workspace, Transfer ownership, Clear workspace memory or governance switches.

## Commands

| Command | What it does |
| --- | --- |
| `npm run test:safe` | All read-only tests in Chrome (118). **Start here.** |
| `npm test` | Read-only + `@writes` tests (QA workspace) |
| `npm run test:ai` | The AI chat tests |
| `npm run test:ui` | **UI mode**: list of tests, click ▶, watch each step, time-travel. Best way to learn |
| `npm run test:headed` | Run with the browser visible |
| `npx playwright test tests/settings` | Run one folder |
| `npx playwright test -g "TC-264"` | Run one test case |
| `npm run report` | HTML report with screenshot, video and trace of every failure |
| `npm run sheet` | After a run: `test-results/sheet-update.csv` with Pass/Fail/Blocked per TC ID |
| `npm run share` | After a run: builds the results page in `results/` and pushes it to GitHub for the client |
| `npm run publish` | Builds the results page only (no push) |
| `npm run cases` | `test-results/automated-cases.csv`: all automated cases, to add new rows to your sheet |
| `npm run codegen` | Opens Hoopi logged in and records your clicks as code |
| `npm run auth` | Save your login again (when tests land on /login) |

## First run: expect a few fixes

Tests were written from the live page structure, but haven't been run against Hoopi yet. On the first run, some will fail because of:

1. **A locator.** Error: "waiting for getByRole(...)". Open `npm run codegen`, click the element, copy the suggested locator into the right file in `pages/`. One fix covers every test that uses it.
2. **Hoopi's real behaviour differs from my guess.** Marked in the code with comments like "adjust once you see Hoopi's real behaviour" (e.g. TC-223 date validation, TC-283 invalid JSON). Decide: is it a bug (log it, add `test.fail`) or is the test wrong (fix the expectation)?
3. **Timing.** Pages that show "Loading…" first already have longer waits. If one is still slow, raise the `timeout` on that `expect`.

## Known bugs (test.fail)

BUG-01 TC-034 · BUG-02 TC-039 · BUG-03 TC-043 · BUG-04 TC-063 · BUG-05 TC-107 · BUG-06 TC-045 · BUG-07 TC-052 · BUG-08 TC-076 · BUG-09 TC-185 · BUG-10 TC-016.
They show as passed while the bug is still there. When a bug is fixed, the test turns **red** with "expected to fail but passed". That's your signal to retest and close the bug.

## Setup reminder (Windows)

`npm install` → `npx playwright install` → `copy .env.example .env` → `npm run auth` (log in, wait for the dashboard, close the window) → `npm run test:safe`.

## Sharing results on GitHub

1. Run the tests: `npm run test:safe` (keep the Chrome window open until it finishes).
2. Run `npm run share`. It writes `results/latest/RESULTS.md` (pass/fail table, errors, screenshots of failures), keeps a dated copy of each run, and pushes to GitHub.
3. The client opens the repo and clicks **Latest test run** at the top of this page.

Only `results/` is published. The HTML report and traces stay on this computer because they can contain login cookies.
