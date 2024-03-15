import { Locator, Page, expect, test } from '@playwright/test'

import testFunction from './example-script'

test('Basic todo app mouse and keyboard interactions', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await testFunction(page, expect)
})
