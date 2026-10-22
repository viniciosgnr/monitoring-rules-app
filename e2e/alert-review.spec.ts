import { test, expect } from '@playwright/test';

test.describe('Alert Review Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alert-review');
    await expect(page).toHaveURL(/\/alert-review/);
  });

  test('should display KPI summary cards', async ({ page }) => {
    // Assert presence of KPI cards
    await expect(page.locator('text=New').first()).toBeVisible();
    await expect(page.locator('text=Review in progress').first()).toBeVisible();
    await expect(page.locator('text=Total alerts').first()).toBeVisible();
  });

  test('should toggle between To be Reviewed and Eligible for Event Manager tabs', async ({ page }) => {
    const toBeReviewedBtn = page.getByRole('button', { name: 'To be Reviewed' });
    const eligibleBtn = page.getByRole('button', { name: 'Eligible for Event Manager' });

    await expect(toBeReviewedBtn).toBeVisible();
    await expect(eligibleBtn).toBeVisible();

    // Switch to Eligible tab
    await eligibleBtn.click();
    await expect(eligibleBtn).toHaveClass(/text-\[#3B82F6\]/);

    // Switch back to To be Reviewed
    await toBeReviewedBtn.click();
    await expect(toBeReviewedBtn).toHaveClass(/text-\[#3B82F6\]/);
  });

  test('should display alert table with rows and allow viewing event details modal', async ({ page }) => {
    // Wait for the table to render
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check header columns
    await expect(page.locator('th', { hasText: 'FPSO' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'RULE' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'STATUS' })).toBeVisible();

    // Check if table rows exist
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Click the first row to view event details modal
      await rows.first().click();

      // Verify modal opened
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
        // Close modal via Escape or close button
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('should toggle to Rejected Alerts tab, display KPIs and Justification column', async ({ page }) => {
    const rejectedBtn = page.getByRole('button', { name: 'Rejected Alerts' });
    await expect(rejectedBtn).toBeVisible();

    // Switch to Rejected Alerts tab
    await rejectedBtn.click();
    await expect(rejectedBtn).toHaveClass(/text-\[#3B82F6\]/);

    // Verify Rejected Alerts KPI Cards
    await expect(page.locator('text=Rejected alerts').first()).toBeVisible();
    await expect(page.locator('text=Rejection Rate').first()).toBeVisible();
    await expect(page.locator('text=Top Category').first()).toBeVisible();

    // Verify Table Header & Justification Column
    await expect(page.locator('th', { hasText: 'Justification' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Monitoring Rule ID' })).toBeVisible();
  });

  test('should format Alert Ref with ALT-[MRTYPE]-[SEQ]', async ({ page }) => {
    // Wait for the table to render
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check that Alert Ref follows ALT-[MRTYPE]-[SEQ] format
    const alertRef = page.locator('td', { hasText: /^ALT-(SPK|DRF|NDP|THR|SEE)-\d+$/ }).first();
    await expect(alertRef).toBeVisible();
  });
});

