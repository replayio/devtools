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

  let checkbox = await Test.waitUntil(() => document.getElementById("enableColumnBreakpoints"));
  const initialState = checkbox.checked;
  checkbox.click();
  await Test.waitUntil(() => checkbox.checked === !initialState);
  checkbox.click();
  await Test.waitUntil(() => checkbox.checked === initialState);
});
