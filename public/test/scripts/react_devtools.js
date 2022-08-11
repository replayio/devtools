const getComponents = () => document.querySelectorAll("[class^=Tree] [class^=Wrapper]");
const getInspectedItems = () =>
  document.querySelectorAll("[class^=InspectedElement] [class^=Name]");
const getInspectedItem = name => [...getInspectedItems()].find(item => item.textContent === name);
const getItemValue = item => item.parentElement.querySelector("[class^=Value]").textContent;
const waitForInspectedItem = (name, value) => Test.waitUntil(
  () => {
    const item = getInspectedItem(name);
    return item && getItemValue(item) === value;
  },
  { waitingFor: `An inspected item with name ${name} and value ${value}` }
);

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

  // enable the react devtools node picker
  document.querySelector("[data-react-devtools-portal-root] [class^=ToggleOff]").click();

  const result = await Test.app.threadFront.evaluate({ text: "document.querySelector('li:first-child').getBoundingClientRect()" });
  const bounds = await result.returned.getJSON();
  const x = (bounds.left + bounds.right) / 2;
  const y = (bounds.top + bounds.bottom) / 2;
  await Test.waitUntil(
    () => {
      Test.dispatchMouseEventInGraphics("mousemove", x, y);
      return document.querySelector("[class^=InactiveSelectedElement]");
    },
    { waitingFor: "A React node to be selected" },
  )
  await waitForInspectedItem("text", "\"Foo\"");

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
  await waitForInspectedItem("0", "{key: \"2\", text: \"Bar\"}");
  getInspectedItem("0").parentElement.firstChild.click();
  await waitForInspectedItem("key", "\"2\"");
  await waitForInspectedItem("text", "\"Bar\"");

  await Test.app.actions.seekToTime(0);
  await Test.waitUntil(
    () => document.querySelector(".secondary-toolbox-content").textContent.includes("Try picking a different point on the timeline"),
    { waitingFor: 'ReactDevTools to say "Try picking a different point"' },
  );
});
