Test.describe(`Test that stacktraces are sourcemapped.`, async () => {
  await Test.selectConsole();

  const messages = await Test.getAllMessages();
  const errorMessage = messages.find(message => message.innerText.includes('Error: Baz'));
  const errorMessageClickTarget = await Test.findMessageExpandableObjectInspector(errorMessage, 'Error');
  errorMessageClickTarget.click();

  const trace = await Test.waitUntil(() => errorMessage.querySelector('[data-test-name="Stack"]'));
  if (trace == null || trace.childElementCount === 0) {
    throw Error('No stack found');
  }
});
