import { test, expect } from '@playwright/test';

test.describe('Application Navigation', () => {
  test('should display main navigation tabs and allow navigating between pages', async ({ page }) => {
    // 1. Visit Home (MR Database)
    await page.goto('/');
    await expect(page).toHaveTitle(/Monitoring Rules|MR Database/i);

    // Verify NavTabs existence
    const mrDbTab = page.getByRole('link', { name: 'MR Database' });
    const analyticsTab = page.getByRole('link', { name: 'Analytics' });
    const alertReviewTab = page.getByRole('link', { name: 'Alert Review' });
    const auditTab = page.getByRole('link', { name: 'MR Audit Changes' });

    await expect(mrDbTab).toBeVisible();
    await expect(analyticsTab).toBeVisible();
    await expect(alertReviewTab).toBeVisible();
    await expect(auditTab).toBeVisible();

    // 2. Navigate to Analytics
    await analyticsTab.click();
    await expect(page).toHaveURL(/\/analytics/);
    await expect(page.locator('h1')).toContainText('Analytics');

    // 3. Navigate to Alert Review
    await alertReviewTab.click();
    await expect(page).toHaveURL(/\/alert-review/);
    await expect(page.locator('h1')).toContainText('Alert Review');

    // 4. Navigate to MR Audit Changes
    await auditTab.click();
    await expect(page).toHaveURL(/\/audit-changes/);
    await expect(page.locator('h1')).toContainText('MR Audit Changes');
  });
});
