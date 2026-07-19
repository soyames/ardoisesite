// @ts-check
import { test, expect } from '@playwright/test';

// Use a long timeout for E2E flow
test.setTimeout(120000);

test.describe('School E2E Flow', () => {
  test('Secretary can create a creneau without erreur inattendue', async ({ page }) => {
    // Navigate to Login
    await page.goto('/login');
    
    // Login as Secretary
    await page.fill('input[type="email"]', 'secretaire@ardoise.com');
    await page.fill('input[type="password"]', 'Ardoise2026!');
    await page.click('button[type="submit"]');

    // Wait for SaaS dashboard to load
    await expect(page.locator('text=Secretariat')).toBeVisible({ timeout: 15000 });

    // Navigate to Appointments (Rendez-vous) tab
    await page.click('button:has-text("Rendez-vous")');

    // Wait for the panel to load
    await expect(page.locator('text=Creneaux du jour')).toBeVisible();

    // Click "+ Creneau"
    await page.click('button:has-text("+ Creneau")');

    // Fill form (start/end time already defaulted to 09:00 - 09:30)
    await page.click('button:has-text("Ajouter le creneau")');

    // It should not show "Erreur inattendue"
    await expect(page.locator('text=Erreur inattendue')).toBeHidden();
    
    // The slot should appear
    await expect(page.locator('text=09:00').first()).toBeVisible();
  });
});
