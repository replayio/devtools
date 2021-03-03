const { firefox } = require("playwright");

const examples = [
  'text="Line Chart"',
  'text="Bar Chart"',
  'text="Column Chart"',
  'text="Axis Options"',
  'text="Custom Tooltip"',
  'text="Synced Cursors"',
  'text="Grouping Modes"',
  'text="Tooltip Options"',
  'text="Dynamic Box"',
  'text="Sparklines"',
  'text="Mixed Types"',
  'text="Multiple Axes"',
  'text="Dark Mode"',
  'text="Stress Test"',
];

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://react-charts.tanstack.com/examples/bubble");

  for (const example of examples) {
    await page.click(example);
    await page.waitForTimeout(2000);
  }

  await context.close();
  await browser.close();
})();
