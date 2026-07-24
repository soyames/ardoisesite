import { test, expect } from '@playwright/test';

test.describe('Daily Tasks E2E', () => {

  const QA_PASSWORD = 'TestQA2026!';
  
  test('Founder Flow: View Dashboard and Recruitment', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    
    await page.goto('/login?saas=1');
    await page.fill('input[id="username"]', 'founder@qa.test');
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for the dashboard to load
    await expect(page.locator('text=Tableau de bord').first()).toBeVisible({ timeout: 15000 });
    
    // Navigate to Recruitment
    await page.click('text=Recrutement');
    await expect(page.locator('text=Publier sur la Marketplace')).toBeVisible({ timeout: 10000 });
    
    expect(consoleErrors.length).toBe(0);
    await context.close();
  });

  test('Censeur Flow: View Classes and Bulletins', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    
    await page.goto('/login?saas=1');
    await page.fill('input[id="username"]', 'censeur@qa.test');
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Tableau de bord').first()).toBeVisible({ timeout: 15000 });
    
    await page.click('text=Classes & Matières');
    await expect(page.locator('text=Ajouter').first()).toBeVisible();

    await page.click('text=Bulletins');
    await expect(page.locator('text=Générer').or(page.locator('text=Classe'))).toBeVisible({ timeout: 10000 });
    
    expect(consoleErrors.length).toBe(0);
    await context.close();
  });

  test('Secretary Flow: Students and Parents', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    
    await page.goto('/login?saas=1');
    await page.fill('input[id="username"]', 'secretary@qa.test');
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Tableau de bord').first()).toBeVisible({ timeout: 15000 });
    
    await page.click('text=Eleves');
    await expect(page.locator('text=Inscrire un Eleve').or(page.locator('text=Ajouter')).first()).toBeVisible();
    
    await page.click('text=Encaissement');
    await expect(page.locator('text=Nouveau Paiement').or(page.locator('text=Ajouter')).first()).toBeVisible();

    expect(consoleErrors.length).toBe(0);
    await context.close();
  });

  test('Comptable Flow: Encaissement and Invoices', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    
    await page.goto('/login?saas=1');
    await page.fill('input[id="username"]', 'comptable@qa.test');
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Tableau de bord').first()).toBeVisible({ timeout: 15000 });
    
    await expect(page.locator('text=Encaisser').or(page.locator('text=Ajouter')).first()).toBeVisible();
    
    expect(consoleErrors.length).toBe(0);
    await context.close();
  });

});
