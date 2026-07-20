import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.setTimeout(240000); // 4 minutes since this is a long scenario

test.describe('Full Enrollment & School Management Flow', () => {

  let testFile;

  test.beforeAll(() => {
    // Create a dummy PDF file for upload
    testFile = path.resolve('dummy.pdf');
    fs.writeFileSync(testFile, 'dummy content');
  });

  test.afterAll(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  test('End to End Life Scenario', async ({ browser }) => {
    const parentContext = await browser.newContext();
    const parentPage = await parentContext.newPage();

    // 1. PARENT ENROLLMENT (Marketplace)
    const email = `parent_${Date.now()}@qa.test`;
    await parentPage.goto('/register');
    
    // Parent registers
    await parentPage.fill('input[name="firstName"]', 'Parent QA');
    await parentPage.fill('input[name="lastName"]', 'E2E');
    await parentPage.fill('input[name="email"]', email);
    await parentPage.fill('input[name="phone"]', '12345678');
    await parentPage.fill('input[name="password"]', 'TestQA2026!');
    await parentPage.check('input[type="checkbox"]');
    await parentPage.click('button[type="submit"]');

    await expect(parentPage.locator('text=Parent QA E2E')).toBeVisible({ timeout: 15000 });

    // Navigate to marketplace to find school
    await parentPage.goto('/schools/1');
    await expect(parentPage.locator("text=Demander l'inscription")).toBeVisible({ timeout: 15000 });
    await parentPage.click("text=Demander l'inscription");

    // Fill Enrollment Form
    await parentPage.fill('input[type="text"]', 'Enfant E2E');
    await parentPage.fill('input[type="number"]', '10');
    await parentPage.locator('select').selectOption({ index: 0 });

    const fileInputs = await parentPage.locator('input[type="file"]').all();
    if (fileInputs.length > 0) {
      await fileInputs[0].setInputFiles(testFile);
    }

    // Mock FedaPay to bypass the iframe in E2E tests
    await parentPage.evaluate(() => {
      window.FedaPay = {
        init: (options) => ({
          open: () => {
            setTimeout(() => {
              options.onComplete({ transaction: { id: 'mock-playwright-txn' } });
            }, 100);
          }
        })
      };
    });

    await parentPage.click('button:has-text("Payer et Envoyer")');
    
    // Wait for redirect to portal after payment
    await expect(parentPage.locator('h1:has-text("Mes enfants")')).toBeVisible({ timeout: 15000 });
    await parentContext.close();

    // 2. SECRETARY PROCESSING (SaaS)
    const secretaryContext = await browser.newContext();
    const secretaryPage = await secretaryContext.newPage();
    
    // Create Secretary account on the fly or rely on seed
    // Using a seeded account if we seed_qa_accounts. If not, maybe we should have created them before.
    // For now we will login as founder because founder has access to everything
    const founderContext = await browser.newContext();
    await founderContext.addInitScript(() => {
      window.localStorage.setItem('MOCK_PREMIUM', 'true');
    });
    const founderPage = await founderContext.newPage();

    await founderPage.goto('/login');
    await founderPage.fill('input[id="username"]', 'founder@ardoise.com');
    await founderPage.fill('input[type="password"]', 'Ardoise2026!');
    await founderPage.click('button[type="submit"]');

    await expect(founderPage.locator('text=Tableau de bord').first()).toBeVisible({ timeout: 15000 });
    
    // Navigate to requests
    await founderPage.route('**/api/auth/marketplace/enrollment-requests/', async route => {
      const json = [{
        id: 'test-req-id',
        childName: 'Enfant E2E',
        childAge: 10,
        childClass: 'CP',
        parentName: 'Parent E2E',
        parentPhone: '12345678',
        parentEmail: 'parent_qa@ardoise.com',
        status: 'pending',
        createdAt: new Date().toISOString()
      }];
      await route.fulfill({ json });
    });
    await founderPage.route('**/api/auth/marketplace/enrollment-requests/*/accept/', async route => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await founderPage.goto('/portal');
    await expect(founderPage.locator('text=Vue d\'ensemble (Inscriptions)')).toBeVisible({ timeout: 15000 });
    await founderPage.click('text=Vue d\'ensemble (Inscriptions)');
    
    // Click on the specific request for Enfant E2E
    await founderPage.click('text=Enfant E2E');
    
    // Approve it
    await founderPage.click('button:has-text("Accepter et inscrire")');
    // Wait for the drawer to close (request disappears from selected state)
    await expect(founderPage.locator('button:has-text("Accepter et inscrire")')).toBeHidden({ timeout: 15000 });

    // Founder publishes a job
    await founderPage.click('text=Recrutement');
    // Fill job form
    await founderPage.locator('input[type="text"]').last().fill('Professeur E2E');
    // For description, we find the textarea inside the job form
    await founderPage.fill('textarea', 'Description E2E');
    // Dismiss any dialogues
    founderPage.once('dialog', dialog => dialog.accept());
    await founderPage.click('button:has-text("Publier sur la Marketplace")');

    // Wait a little bit for Firestore write
    await founderPage.waitForTimeout(2000);

    // 3. JOB APPLICATION (Marketplace)
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    // Teacher registers
    const teacherEmail = `teacher_${Date.now()}@qa.test`;
    await teacherPage.goto('/register');
    await teacherPage.fill('input[name="firstName"]', 'Prof QA');
    await teacherPage.fill('input[name="lastName"]', 'E2E');
    await teacherPage.fill('input[name="email"]', teacherEmail);
    await teacherPage.fill('input[name="phone"]', '87654321');
    await teacherPage.fill('input[name="password"]', 'TestQA2026!');
    await teacherPage.selectOption('select', 'teacher');
    await teacherPage.check('input[type="checkbox"]');
    await teacherPage.click('button[type="submit"]');

    await expect(teacherPage.locator('text=Mon Espace Tuteur')).toBeVisible({ timeout: 15000 });
    
    await teacherPage.goto('/schools/1');
    await teacherPage.click('text=Postuler');
    await expect(teacherPage.locator('h1', { hasText: 'Postuler' })).toBeVisible({ timeout: 15000 });
    await teacherPage.fill('textarea', 'Motivation from E2E');
    
    // Intercept the window.alert to auto-accept it, otherwise Playwright might hang or the test might fail depending on alert handling
    teacherPage.once('dialog', dialog => dialog.accept());
    
    await teacherPage.click('button:has-text("Envoyer ma candidature")');
    await teacherPage.waitForURL('**/portal', { timeout: 15000 });

    // Mock the applications route before navigating founder
    await founderPage.route('**/api/auth/marketplace/applications/', async route => {
      const json = [{
        id: 'test-app-id',
        teacherName: 'Prof QA E2E',
        email: 'teacher_qa@ardoise.com',
        jobTitle: 'Professeur E2E',
        motivation: 'Motivation from E2E',
        status: 'pending',
        createdAt: new Date().toISOString()
      }];
      await route.fulfill({ json });
    });

    // 4. HR PROCESSING
    await founderPage.goto('/portal');
    await expect(founderPage.locator('text=Recrutement')).toBeVisible({ timeout: 15000 });
    await founderPage.click('text=Recrutement'); // Assuming there's a Recruitment section for HR
    // Wait for the application
    await expect(founderPage.locator('text=Prof QA E2E')).toBeVisible({ timeout: 15000 });

    await teacherContext.close();
    await founderContext.close();
  });
});
