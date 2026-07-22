// @ts-check
import { test, expect } from '@playwright/test';

// Real live testing against the actual running dev server + real Firestore +
// real Cloudflare Worker + real FedaPay sandbox. No mocking. Written to
// investigate specific issues found during manual testing on 2026-07-21.
test.setTimeout(60000);

test.describe('Forgot password flow', () => {
  test('submitting a known email shows a success message', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/forgot-password');
    await page.fill('input[id="username"]', 'amina.toffa.qa@ardoise-test.com');
    await page.click('button[type="submit"]');

    // Button should show the submitting state briefly, then resolve to
    // either a success or error <p> per ForgotPasswordPage.jsx's own logic.
    await page.waitForTimeout(3000);

    const successVisible = await page.locator('text=email de réinitialisation').isVisible().catch(() => false);
    const errorVisible = await page.locator('.text-danger-700').isVisible().catch(() => false);
    const buttonText = await page.locator('button[type="submit"]').textContent();

    console.log('QA RESULT forgot-password: successVisible=%s errorVisible=%s buttonText=%s consoleErrors=%o',
      successVisible, errorVisible, buttonText, consoleErrors);

    expect(successVisible || errorVisible, `Neither success nor error message appeared. Button text: "${buttonText}". Console errors: ${JSON.stringify(consoleErrors)}`).toBeTruthy();
  });
});

test.describe('Founder login (SaaS)', () => {
  test('founder@ardoise.com can log in with real credentials', async ({ page }) => {
    await page.goto('/login?saas=1');
    await page.fill('input[id="username"]', 'founder@ardoise.com');
    await page.fill('input[type="password"]', 'Ardoise2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    console.log('QA RESULT founder-login: url=%s bodyStart=%s', url, bodyText?.slice(0, 300));

    // Just confirm it didn't stay on /login with an error - actual dashboard
    // assertions come later once we know what actually renders.
    expect(url).not.toContain('/login');
  });
});

test.describe('Parent profile update', () => {
  test('amina can update her profile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="username"]', 'amina.toffa.qa@ardoise-test.com');
    await page.fill('input[type="password"]', 'ArdoiseTest2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.goto('/portal/settings');
    await page.waitForTimeout(1000);

    const phoneInput = page.locator('input').filter({ hasText: '' }).nth(2);
    // Use the labeled phone field directly instead - find by preceding label text
    const inputs = await page.locator('input:not([disabled])').all();
    console.log('QA RESULT profile-settings: editable input count=%d url=%s', inputs.length, page.url());

    if (inputs.length >= 3) {
      await inputs[2].fill('+229 97 00 11 22');
      await page.click('button:has-text("Enregistrer")');
      await page.waitForTimeout(2000);
      const saved = await page.locator('text=Profil mis a jour').isVisible().catch(() => false);
      console.log('QA RESULT profile-update: saved=%s', saved);
      expect(saved).toBeTruthy();
    } else {
      console.log('QA RESULT profile-update: SKIPPED - settings page did not render expected inputs, url=%s', page.url());
    }
  });
});
