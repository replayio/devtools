Test.describe(`Test changing the user's settings.`, async () => {
  const menuBtn = await Test.waitUntil(() => document.querySelector(".expand-dropdown"));
  menuBtn.click();

  const settingsBtn = await Test.waitUntil(() => {
    const menuContent = document.querySelector(".user-options .content");
    if (menuContent) {
      return [...menuContent.children].find(item => item.lastChild.textContent === "Settings");
    }
  });
  settingsBtn.click();

  const sections = await Test.waitUntil(() => {
    const spans = document.querySelectorAll(".settings-modal nav ul li span");
    if (spans.length > 0) {
      return spans;
    }
  });
  const experimentalSection = [...sections].find(s => s.textContent === "Experimental");
  experimentalSection.click();

  let elementsCheckbox = await Test.waitUntil(() => document.getElementById("showElements"));
  const initialState = elementsCheckbox.checked;
  await new Promise(resolve => setTimeout(resolve, 0)); // otherwise the following click gets lost, but why?
  elementsCheckbox.click();
  await Test.waitUntil(() => elementsCheckbox.checked === !initialState);
  elementsCheckbox.click();
  await Test.waitUntil(() => elementsCheckbox.checked === initialState);
});
