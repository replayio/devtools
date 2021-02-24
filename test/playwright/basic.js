const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch();
  const page = await browser.newPage();

  console.log("Visiting page");
  await page.goto('http://whatsmyuseragent.org/');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Saving recording");
  await browser.close();
})();
