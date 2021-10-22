const { validateEmail } = require("ui/utils/helpers");

test("isValidEmail", () => {
  expect(validateEmail("admin@replay.io")).toBeTruthy();
});
