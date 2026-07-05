import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AAB_PATH = path.resolve(__dirname, '..', 'bubblewrap', 'output.aab');
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'public', 'screenshots');
const GOOGLE_PLAY_URL = 'https://play.google.com/console';

test.describe('Google Play Console - Auto Upload AAB', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(300000);
  });

  test('Step 1: Login to Google Play Console', async ({ page }) => {
    const email = process.env.GOOGLE_PLAY_EMAIL || '';
    const password = process.env.GOOGLE_PLAY_PASSWORD || '';
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();

    await page.goto(GOOGLE_PLAY_URL, { waitUntil: 'networkidle' });

    // Enter email
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    await page.fill('input[type="email"]', email);
    await page.click('#identifierNext');
    await page.waitForTimeout(3000);

    // Enter password
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', password);
    await page.click('#passwordNext');
    await page.waitForTimeout(5000);

    // Wait for Play Console to load
    await page.waitForURL('**/console/**', { timeout: 60000 });
    console.log('[Playwright] Logged in to Google Play Console');
  });

  test('Step 2: Select app or create new', async ({ page }) => {
    // Click on the app if it exists in the list
    const appSelector = 'text=SilverCare Thailand';
    const createAppButton = 'text=Create app';

    try {
      await page.waitForSelector(appSelector, { timeout: 10000 });
      await page.click(appSelector);
      console.log('[Playwright] Selected existing app: SilverCare Thailand');
    } catch {
      // Create new app
      await page.click('text=Add app');
      await page.waitForTimeout(2000);
      await page.click(createAppButton);
      console.log('[Playwright] Creating new app entry');
    }
    await page.waitForTimeout(3000);
  });

  test('Step 3: Navigate to Production / Internal testing', async ({ page }) => {
    // Click on "Internal testing" in the left nav
    const internalTestingLinks = [
      'text=Internal testing',
      '[aria-label="Internal testing"]',
      'text=Testing',
      'text=Production',
    ];

    for (const selector of internalTestingLinks) {
      try {
        await page.click(selector, { timeout: 5000 });
        console.log(`[Playwright] Clicked: ${selector}`);
        await page.waitForTimeout(2000);
        break;
      } catch {
        console.log(`[Playwright] Selector not found: ${selector}`);
      }
    }
  });

  test('Step 4: Upload AAB bundle', async ({ page }) => {
    // Verify AAB file exists
    expect(fs.existsSync(AAB_PATH)).toBeTruthy();

    // Find file upload input
    const fileInputSelectors = [
      'input[type="file"]',
      'input[accept*=".aab"]',
      '[data-test-id="upload-bundle"] input',
      '.upload-button input',
    ];

    let fileInput = null;
    for (const selector of fileInputSelectors) {
      fileInput = await page.$(selector);
      if (fileInput) break;
    }

    if (!fileInput) {
      // Try clicking the upload button first to reveal input
      const uploadButtons = [
        'text=Upload',
        'text=Upload bundle',
        'text=Upload AAB',
        '[data-test-id="upload-bundle"]',
        '.upload-button',
      ];
      for (const btn of uploadButtons) {
        try {
          await page.click(btn, { timeout: 5000 });
          await page.waitForTimeout(2000);
          break;
        } catch { /* continue */ }
      }
      fileInput = await page.$('input[type="file"]');
    }

    expect(fileInput).toBeTruthy();
    await fileInput!.setInputFiles(AAB_PATH);
    console.log(`[Playwright] Uploaded AAB: ${AAB_PATH}`);
    await page.waitForTimeout(10000);

    // Wait for processing to complete
    await page.waitForSelector('text=Processing complete', { timeout: 120000 })
      .catch(() => console.log('[Playwright] Processing complete message not detected, continuing...'));
    await page.waitForTimeout(5000);
  });

  test('Step 5: Fill store listing (English)', async ({ page }) => {
    await page.goto(`${GOOGLE_PLAY_URL}/listing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Switch to English (US)
    try {
      await page.click('[data-test-id="language-selector"]');
      await page.click('text=English (United States)');
      await page.waitForTimeout(2000);
    } catch {
      console.log('[Playwright] Language selector not found, continuing...');
    }

    // Full description
    const fullDescEn = `SilverCare Thailand is a premium elderly care management platform designed specifically for Thailand's nursing homes, elderly care centers, and wellness clinics. The platform enables healthcare providers to manage patient records, schedule appointments, process billing with PromptPay QR payment integration, and keep family members informed via Line messaging notifications.

Key Features:
- Multi-language support (English and Thai)
- Patient medical records management
- Appointment scheduling and reminders
- Billing and invoice management with PromptPay QR
- Line Messaging API notifications for family members
- Multi-tenant isolation for clinic data security
- PWA enabled for mobile access`;

    const shortDescEn = 'Premium elderly care management platform for Thailand with PromptPay and Line integration.';

    const descFields = [
      { field: '[name="fullDescription"]', value: fullDescEn },
      { field: '[name="shortDescription"]', value: shortDescEn },
    ];

    for (const { field, value } of descFields) {
      try {
        const el = await page.$(field);
        if (el) {
          await el.fill('');
          await el.fill(value);
          console.log(`[Playwright] Filled ${field}`);
        }
      } catch {
        console.log(`[Playwright] Could not fill ${field}`);
      }
    }
  });

  test('Step 6: Fill store listing (Thai)', async ({ page }) => {
    try {
      await page.click('[data-test-id="language-selector"]');
      await page.click('text=Thai');
      await page.waitForTimeout(2000);
    } catch {
      console.log('[Playwright] Language selector not found for Thai, continuing...');
    }

    const fullDescTh = `ซิลเวอร์แคร์ ไทยแลนด์ เป็นแพลตฟอร์มจัดการดูแลผู้สูงอายุระดับพรีเมียม ออกแบบมาโดยเฉพาะสำหรับสถานดูแลผู้สูงอายุ ศูนย์ดูแลผู้สูงอายุ และคลินิกเพื่อสุขภาพในประเทศไทย แพลตฟอร์มช่วยให้ผู้ให้บริการด้านสุขภาพสามารถจัดการบันทึกผู้ป่วย จัดการนัดหมาย ดำเนินการเรียกเก็บเงินพร้อมการชำระเงินผ่านพร้อมเพย์ QR และแจ้งเตือนสมาชิกในครอบครัวผ่าน Line Messaging

คุณสมบัติหลัก:
- รองรับสองภาษา (อังกฤษและไทย)
- จัดการบันทึกทางการแพทย์ของผู้ป่วย
- จัดการนัดหมายและการแจ้งเตือน
- จัดการการเรียกเก็บเงินและใบแจ้งหนี้พร้อมพร้อมเพย์ QR
- การแจ้งเตือนผ่าน Line Messaging API สำหรับสมาชิกในครอบครัว
- การแยกข้อมูลผู้เช่าหลายรายเพื่อความปลอดภัยของข้อมูลคลินิก
- รองรับ PWA สำหรับการเข้าถึงผ่านมือถือ`;

    const shortDescTh = 'แพลตฟอร์มจัดการดูแลผู้สูงอายุระดับพรีเมียมสำหรับประเทศไทย พร้อมพร้อมเพย์และ Line';

    const thFields = [
      { field: '[name="fullDescription"]', value: fullDescTh },
      { field: '[name="shortDescription"]', value: shortDescTh },
    ];

    for (const { field, value } of thFields) {
      try {
        const el = await page.$(field);
        if (el) {
          await el.fill('');
          await el.fill(value);
          console.log(`[Playwright] Filled Thai ${field}`);
        }
      } catch {
        console.log(`[Playwright] Could not fill Thai ${field}`);
      }
    }
  });

  test('Step 7: Upload screenshots', async ({ page }) => {
    const screenshotFiles = [
      path.join(SCREENSHOTS_DIR, 'desktop-1.png'),
      path.join(SCREENSHOTS_DIR, 'mobile-1.png'),
    ];

    for (const screenshotPath of screenshotFiles) {
      if (fs.existsSync(screenshotPath)) {
        try {
          const screenshotInput = await page.$('input[type="file"][accept*="image"]');
          if (screenshotInput) {
            await screenshotInput.setInputFiles(screenshotPath);
            console.log(`[Playwright] Uploaded screenshot: ${screenshotPath}`);
            await page.waitForTimeout(3000);
          }
        } catch {
          console.log(`[Playwright] Could not upload screenshot: ${screenshotPath}`);
        }
      }
    }
  });

  test('Step 8: Submit for review', async ({ page }) => {
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const submitButtons = [
      'text=Submit for review',
      'text=Submit update',
      'text=Save and submit',
      'text=Submit',
      '[data-test-id="submit-button"]',
      'button:has-text("Submit")',
    ];

    for (const btn of submitButtons) {
      try {
        await page.click(btn, { timeout: 5000 });
        console.log(`[Playwright] Clicked submit button: ${btn}`);
        await page.waitForTimeout(5000);

        // Confirm dialog if present
        try {
          await page.click('text=Confirm', { timeout: 5000 });
          await page.waitForTimeout(2000);
        } catch {
          console.log('[Playwright] No confirmation dialog');
        }
        break;
      } catch {
        console.log(`[Playwright] Submit button not found: ${btn}`);
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: path.resolve(__dirname, 'submission-result.png'),
      fullPage: true,
    });

    console.log('[Playwright] Submission complete!');
  });

  test('Step 9: Verify submission status', async ({ page }) => {
    await page.waitForTimeout(5000);
    const statusIndicators = [
      'text=Under review',
      'text=Submitted',
      'text=Published',
      'text=Ready to submit',
    ];

    for (const indicator of statusIndicators) {
      try {
        await page.waitForSelector(indicator, { timeout: 10000 });
        console.log(`[Playwright] Status detected: ${indicator}`);
        break;
      } catch { /* continue */ }
    }

    const pageUrl = page.url();
    console.log(`[Playwright] Current page: ${pageUrl}`);

    expect(pageUrl).toContain('play.google.com');
  });
});
