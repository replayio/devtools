# Playwright DOM Selectors Bundle

The file `injectedScriptSource.raw.js` is a copy-paste of `node_modules/playwright-core/lib/generated/injectedScriptSource.js`, taken from `playwright-core@1.37.1`.

This is pre-built and part of the actual `playwright-core` package - it's how Playwright actually does real DOM selection during test execution, by injecting this bundle into the browser and sending it locator strings.

We inject that same bundle into paused browser instances and use it to look up the same DOM nodes for test steps.

It's unlikely we'll ever need to update this, but if we do, just copy-paste the bundle file from a newer version of `playwright-core`
