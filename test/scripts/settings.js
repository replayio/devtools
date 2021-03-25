Test.describe(`Test changing the user's settings.`, async () => {
  const menuBtn = document.querySelector(".expand-dropdown");
  menuBtn.click();

  const settingsBtn = await Test.waitUntil(() => {
    const menuContent = document.querySelector(".user-options .content");
    if (menuContent) {
      return [...menuContent.children].find(item => item.lastChild.textContent === "Settings");
    }
  });
  settingsBtn.click();

  const elementsCheckbox = await Test.waitUntil(() => document.getElementById("show_elements"));
  const initialState = elementsCheckbox.checked;
  elementsCheckbox.click();
  await Test.waitUntil(() => elementsCheckbox.checked === !initialState);
  elementsCheckbox.click();
  await Test.waitUntil(() => elementsCheckbox.checked === initialState);
});
