import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL(/\/analytics/);
  });

  test('should display top KPI cards for Accuracy, False Positive, and Avg. Time to Treat', async ({ page }) => {
    await expect(page.locator('text=Accuracy').first()).toBeVisible();
    await expect(page.locator('text=False Positive').first()).toBeVisible();
    await expect(page.locator('text=Avg. Time to Treat').first()).toBeVisible();
  });

  test('should display Overview & Trends charts and breakdown tables', async ({ page }) => {
    // Assert line chart titles
    await expect(page.locator('text=Accuracy Over Time')).toBeVisible();
    await expect(page.locator('text=False Positive Over Time')).toBeVisible();

    // Assert breakdown table cards
    await expect(page.locator('text=Accuracy Breakdown by Instance')).toBeVisible();
    await expect(page.locator('text=False Positive Breakdown by Instance')).toBeVisible();
  });

  test('should toggle to Alerts Treated tab and display Days to Treat, status charts, and Bad Actors List', async ({ page }) => {
    const alertsTreatedBtn = page.getByRole('button', { name: 'Alerts Treated' });
    await expect(alertsTreatedBtn).toBeVisible();

    await alertsTreatedBtn.click();

    // Verify Days to Treat an Alert (Average)
    await expect(page.locator('text=Days to Treat an Alert (Average)')).toBeVisible();

    // Verify Charts
    await expect(page.locator('text=Alerts Treated by Monitoring Rule')).toBeVisible();
    await expect(page.locator('text=Alerts Treated by Status')).toBeVisible();

    // Verify Bad Actors List
    await expect(page.locator('text=Bad Actors List')).toBeVisible();
  });
});
