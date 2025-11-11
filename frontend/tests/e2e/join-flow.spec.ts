import { test, expect } from '@playwright/test';

test.describe('Flux bàsic del joc', () => {
  test('un usuari pot accedir al lobby', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Introdueix el teu nom').fill('QA Tester');
    await page.getByRole('combobox').selectOption('arena');
    await page.getByRole('button', { name: /Entra al Lobby/i }).click();

    await expect(page.getByRole('heading', { name: /Jugadors Connectats/i })).toBeVisible();
  });
});
