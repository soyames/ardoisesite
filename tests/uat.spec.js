import { test, expect } from '@playwright/test';

test.describe('UAT Phase 5 & 6', () => {
  const timestamp = Date.now();
  const parentEmail = `parent_${timestamp}@test.com`;
  const teacherEmail = `teacher_${timestamp}@test.com`;
  const testPassword = 'TestPassword123!';

  test('Phase 5: Parent Portal Testing', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', dialog => {
      dialogMessage = dialog.message();
      console.log('DIALOG:', dialogMessage);
      dialog.accept();
    });

    await page.goto('/register');
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Parent');
    await page.fill('input[name="email"]', parentEmail);
    await page.fill('input[name="phone"]', `+22990000000`);
    await page.fill('input[name="password"]', testPassword);
    
    await page.selectOption('select', 'parent');
    
    // Check the terms checkbox
    await page.check('input[type="checkbox"]');
    
    await page.click('button[type="submit"]');

    // Wait for redirect to /portal
    await page.waitForURL('**/portal', { timeout: 10000 });
    
    // Assert the dashboard rendered
    await expect(page.locator('h1')).toContainText('Mes enfants');
  });

  test('Phase 6: Teacher Portal Testing', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', dialog => {
      dialogMessage = dialog.message();
      dialog.accept();
    });

    await page.goto('/register');
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Teacher');
    await page.fill('input[name="email"]', teacherEmail);
    await page.fill('input[name="phone"]', `+22990000001`);
    await page.fill('input[name="password"]', testPassword);
    
    await page.selectOption('select', 'teacher');
    
    // Check the terms checkbox
    await page.check('input[type="checkbox"]');
    
    await page.click('button[type="submit"]');

    // Wait for redirect to /teacher-dashboard
    await page.waitForURL('**/teacher-dashboard', { timeout: 10000 });
    
    // Assert the dashboard rendered
    await expect(page.locator('h1')).toBeVisible();
  });
});
