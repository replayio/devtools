const getComponents = () => document.querySelectorAll("[class^=Tree] [class^=Wrapper]");
const getInspectedItems = () =>
  document.querySelectorAll("[class^=InspectedElement] [class^=Name]");
const getInspectedItem = name => [...getInspectedItems()].find(item => item.textContent === name);

Test.describe(`Test React DevTools.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("Initial list");

  await Test.selectReactDevTools();
  await Test.waitUntil(() => getComponents().length === 3, {
    waitingFor: "There to be 3 components in ReactDevTools",
  });

  await Test.selectConsole();
  await Test.warpToMessage("Added an entry");

  await Test.selectReactDevTools();
  await Test.waitUntil(() => getComponents().length === 4, {
    waitingFor: "There to be 4 components in ReactDevTools",
  });

  await Test.selectConsole();
  await Test.warpToMessage("Removed an entry");

  await Test.selectReactDevTools();
  await Test.waitUntil(() => getComponents().length === 3, {
    waitingFor: "There to be 3 components in ReactDevTools",
  });

  const rootComponent = getComponents()[0];

  rootComponent.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  await Test.checkHighlighterVisible(true);
  await Test.checkHighlighterShape("M40,16 L140,16 L140,36 L40,36");

  rootComponent.click();
  await Test.waitUntil(() => getInspectedItem("1State"), {
    waitingFor: "State to be among the inspected items",
  });

  getInspectedItem("1State").parentElement.firstChild.click();
  await Test.waitUntil(() => getInspectedItem("0"), { waitingFor: "0 to be among the inspected items" });
  getInspectedItem("0").parentElement.firstChild.click();
  await Test.waitUntil(() => getInspectedItem("key") && getInspectedItem("text"), {
    waitingFor: "key and text to be among the inspected items",
  });
});
