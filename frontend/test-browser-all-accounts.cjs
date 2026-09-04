const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SCREENSHOTS_DIR = "C:\\Users\\ahmd5\\.gemini\\antigravity\\brain\\8928785f-15e2-4834-8656-889ed1a77948\\screenshots";

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log("Launching Chromium browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Test port 5173 or 5174
  let baseUrl = "http://localhost:5173";
  try {
    const res = await page.goto(`${baseUrl}/login`, { timeout: 3000 });
    if (!res || res.status() !== 200) baseUrl = "http://localhost:5174";
  } catch {
    baseUrl = "http://localhost:5174";
  }
  console.log(`Using Base URL: ${baseUrl}`);

  const accounts = [
    {
      name: "1. Administrator",
      email: "admin@flowcrm.local",
      pass: "FlowAdmin123!",
      role: "Admin",
      prefix: "admin",
      extraSteps: async () => {
        // Leads
        console.log("  [Admin] Navigating to /leads...");
        await page.goto(`${baseUrl}/leads`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "admin_02_leads.png"), fullPage: true });

        // Customers
        console.log("  [Admin] Navigating to /customers...");
        await page.goto(`${baseUrl}/customers`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "admin_03_customers.png"), fullPage: true });

        // Pipeline
        console.log("  [Admin] Navigating to /pipeline...");
        await page.goto(`${baseUrl}/pipeline`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "admin_04_pipeline.png"), fullPage: true });

        // Users
        console.log("  [Admin] Navigating to /users...");
        await page.goto(`${baseUrl}/users`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "admin_05_users.png"), fullPage: true });
      }
    },
    {
      name: "2. Sales Manager",
      email: "manager@flowcrm.local",
      pass: "FlowManager123!",
      role: "Manager",
      prefix: "manager",
      extraSteps: async () => {
        console.log("  [Manager] Navigating to /tasks...");
        await page.goto(`${baseUrl}/tasks`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "manager_02_tasks.png"), fullPage: true });

        console.log("  [Manager] Navigating to /reports...");
        await page.goto(`${baseUrl}/reports`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "manager_03_reports.png"), fullPage: true });
      }
    },
    {
      name: "3. Sales Representative (Sara)",
      email: "sara@flowcrm.local",
      pass: "FlowSara123!",
      role: "SalesRepresentative",
      prefix: "sara",
      extraSteps: async () => {
        console.log("  [Sara] Navigating to /leads...");
        await page.goto(`${baseUrl}/leads`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "sara_02_leads.png"), fullPage: true });

        console.log("  [Sara] Navigating to /pipeline...");
        await page.goto(`${baseUrl}/pipeline`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "sara_03_pipeline.png"), fullPage: true });
      }
    },
    {
      name: "4. Sales Representative (Omar)",
      email: "omar@flowcrm.local",
      pass: "FlowOmar123!",
      role: "SalesRepresentative",
      prefix: "omar",
      extraSteps: async () => {
        console.log("  [Omar] Navigating to /tasks...");
        await page.goto(`${baseUrl}/tasks`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "omar_02_tasks.png"), fullPage: true });
      }
    }
  ];

  for (const acc of accounts) {
    console.log(`\n=== Testing Account: ${acc.name} (${acc.email}) ===`);
    // Clear storage
    await context.clearCookies();
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });

    // Capture login screen once
    if (acc.prefix === "admin") {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "00_login_page.png"), fullPage: true });
    }

    // Fill form
    console.log(`  Filling credentials for ${acc.email}...`);
    await page.fill('input[type="email"], input[name="email"]', acc.email);
    await page.fill('input[type="password"], input[name="password"]', acc.pass);
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    console.log(`  Successfully reached dashboard as ${acc.role}!`);
    await page.waitForTimeout(1500); // Allow charts/metrics to render
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${acc.prefix}_01_dashboard.png`), fullPage: true });

    if (acc.extraSteps) {
      await acc.extraSteps();
    }
  }

  await browser.close();
  console.log("\nAll browser tests completed successfully! All screenshots saved.");
}

run().catch((err) => {
  console.error("Browser test failed:", err);
  process.exit(1);
});
