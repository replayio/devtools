const getComponents = () => document.querySelectorAll("[class^=Tree] [class^=Wrapper]");
const getInspectedItems = () =>
  document.querySelectorAll("[class^=InspectedElement] [class^=Name]");
const getInspectedItem = name => [...getInspectedItems()].find(item => item.textContent === name);

Test.describe(`Test React DevTools.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("Initial list");

  await Test.selectReactDevTools();
  await Test.waitUntil(() => getComponents().length === 3);

  await Test.selectConsole();
  await Test.warpToMessage("Added an entry");

  await Test.selectReactDevTools();
  await Test.waitUntil(() => getComponents().length === 4);

  await Test.selectConsole();
  await Test.warpToMessage("Removed an entry");

  await Test.selectReactDevTools();
  await Test.waitUntil(() => getComponents().length === 3);

  const rootComponent = getComponents()[0];

  rootComponent.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  await Test.checkHighlighterVisible(true);
  await Test.checkHighlighterShape("M40,16 L1280,16 L1280,35 L40,35");

  rootComponent.parentElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  await Test.waitUntil(() => getInspectedItem("State"));

  getInspectedItem("State").parentElement.firstChild.click();
  await Test.waitUntil(() => getInspectedItem("0"));
  getInspectedItem("0").parentElement.firstChild.click();
  await Test.waitUntil(() => getInspectedItem("key") && getInspectedItem("text"));
});
