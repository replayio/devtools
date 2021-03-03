const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  // Open new page
  const page = await context.newPage();

  // Go to https://next--storybookjs.netlify.app/official-storybook/?path=/story/addons-a11y-basebutton--default
  await page.goto(
    "https://next--storybookjs.netlify.app/official-storybook/?path=/story/addons-a11y-basebutton--default"
  );

  // Click text="Label"
  await page.click('text="Label"');
  // assert.equal(page.url(), 'https://next--storybookjs.netlify.app/official-storybook/?path=/story/addons-a11y-basebutton--label');

  // Click text="Disabled"
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://next--storybookjs.netlify.app/official-storybook/?path=/story/addons-a11y-basebutton--disabled' }*/),
    page.click('text="Disabled"'),
  ]);

  // Click text="Backgrounds"
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://next--storybookjs.netlify.app/official-storybook/?path=/story/addons-backgrounds--story-1' }*/),
    page.click('text="Backgrounds"'),
  ]);

  // Click text="Overridden"
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://next--storybookjs.netlify.app/official-storybook/?path=/story/addons-backgrounds--overridden' }*/),
    page.click('text="Overridden"'),
  ]);

  // Click //button[normalize-space(@title)='Zoom in']/*[local-name()="svg"]
  await page.click("//button[normalize-space(@title)='Zoom in']/*[local-name()=\"svg\"]");

  // Click //button[normalize-space(@title)='Zoom in']/*[local-name()="svg"]
  await page.click("//button[normalize-space(@title)='Zoom in']/*[local-name()=\"svg\"]");

  // Click //button[normalize-space(@title)='Zoom in']/*[local-name()="svg"]
  await page.click("//button[normalize-space(@title)='Zoom in']/*[local-name()=\"svg\"]");

  // Click //button[normalize-space(@title)='Zoom in']/*[local-name()="svg"]
  await page.click("//button[normalize-space(@title)='Zoom in']/*[local-name()=\"svg\"]");

  // Click //button[normalize-space(@title)='Zoom in']/*[local-name()="svg"]
  await page.click("//button[normalize-space(@title)='Zoom in']/*[local-name()=\"svg\"]");

  // Click button[role="tab"]
  await page.click('button[role="tab"]');

  // Click //button[normalize-space(.)='Actions' and normalize-space(@role)='tab']
  await page.click("//button[normalize-space(.)='Actions' and normalize-space(@role)='tab']");

  // Click //button[normalize-space(.)='Story' and normalize-space(@role)='tab']
  await page.click("//button[normalize-space(.)='Story' and normalize-space(@role)='tab']");

  // Click //button[normalize-space(.)='Events' and normalize-space(@role)='tab']
  await page.click("//button[normalize-space(.)='Events' and normalize-space(@role)='tab']");

  // Click //button[normalize-space(.)='Knobs' and normalize-space(@role)='tab']
  await page.click("//button[normalize-space(.)='Knobs' and normalize-space(@role)='tab']");

  // Click //button[normalize-space(.)='CSS resources' and normalize-space(@role)='tab']
  await page.click("//button[normalize-space(.)='CSS resources' and normalize-space(@role)='tab']");

  // Click //button[normalize-space(.)='Accessibility' and normalize-space(@role)='tab']
  await page.click("//button[normalize-space(.)='Accessibility' and normalize-space(@role)='tab']");

  // Click //button[normalize-space(.)='Tests' and normalize-space(@role)='tab']
  await page.click("//button[normalize-space(.)='Tests' and normalize-space(@role)='tab']");

  // Close page
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();
