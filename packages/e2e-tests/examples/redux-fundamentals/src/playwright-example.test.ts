import { Locator, Page, expect, test } from '@playwright/test'

export function delay(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

export async function waitFor(
  callback: () => Promise<void>,
  options: {
    retryInterval?: number
    timeout?: number
  } = {}
): Promise<void> {
  const { retryInterval = 250, timeout = 5_000 } = options

  const startTime = performance.now()

  while (true) {
    try {
      await callback()

      return
    } catch (error) {
      if (typeof error === 'string') {
        console.log(error)
      }

      if (performance.now() - startTime > timeout) {
        throw error
      }

      await delay(retryInterval)

      continue
    }
  }
}

function getTodoListItems(page: Page) {
  return page.locator('ul.todo-list li')
}

function getTodoCheckbox(locator: Locator) {
  return locator.locator('input[type="checkbox"]')
}

function getTodoDeleteButton(locator: Locator) {
  return locator.locator('button.destroy')
}

function getTodoColorDropdown(locator: Locator) {
  return locator.locator('select.colorPicker')
}

function getTextInput(page: Page) {
  return page.locator('input.new-todo')
}

function getFiltersPanel(page: Page) {
  return page.locator('div.filters')
}

export const testFunction = async (page: Page) => {
  await page.goto('http://localhost:5173')

  const listItems = getTodoListItems(page)

  await waitFor(async () => {
    const numListItems = await listItems.count()

    expect(numListItems).toBe(5)
  })

  const viewportSize = page.viewportSize()!
  // Click outside the main area a couple times, which should _not_ trigger event listeners
  const body = page.locator('body')

  // Upper left
  await body.click({
    force: true,
    position: { x: 10, y: 10 },
  })
  // Lower right
  await body.click({
    force: true,
    position: { x: viewportSize.width - 10, y: viewportSize.height - 10 },
  })

  await body.focus()

  // Keyboard events with no input focused, so no event listeners
  await body.type('test')

  const textInput = getTextInput(page)
  await textInput.focus()

  await textInput.type('Watch Bengals')
  await textInput.press('Enter')
  expect(await listItems.count()).toBe(6)

  await textInput.type('Celebrate')
  await textInput.press('Enter')
  expect(await listItems.count()).toBe(7)

  await getTodoCheckbox(listItems.first()).click()
  await getTodoCheckbox(listItems.nth(3)).click()

  await getTodoDeleteButton(listItems.nth(1)).click()
  expect(await listItems.count()).toBe(6)

  await getTodoDeleteButton(listItems.nth(3)).click()
  expect(await listItems.count()).toBe(5)

  expect(await page.getByText('3 items left').isVisible()).toBe(true)

  const filtersPanel = getFiltersPanel(page)

  await filtersPanel.getByText('Active').click()
  expect(await listItems.count()).toBe(3)

  await filtersPanel.getByText('Completed').click()
  expect(await listItems.count()).toBe(2)

  await filtersPanel.getByText('All').click()
  expect(await listItems.count()).toBe(5)

  await page.getByText('Clear completed').click()
  expect(await listItems.count()).toBe(3)

  await getTodoColorDropdown(listItems.first()).selectOption({ label: 'Red' })
  await getTodoColorDropdown(listItems.nth(1)).selectOption({ label: 'Green' })

  await filtersPanel.getByText('Red').click()
  expect(await listItems.count()).toBe(1)

  await filtersPanel.getByText('Green').click()
  expect(await listItems.count()).toBe(2)
}

test('Basic todo app mouse and keyboard interactions', async ({ page }) => {
  await testFunction(page)
})
