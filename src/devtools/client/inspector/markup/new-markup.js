const { createFactory, createElement } = require("react");
const { Provider } = require("react-redux");

const MarkupApp = createFactory(require("devtools/client/inspector/markup/components/MarkupApp"));

const { LocalizationHelper } = require("devtools/shared/l10n");
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

class MarkupView {
  constructor(inspector, window) {
    this.document = window.document;
    this.inspector = inspector;
    this.store = inspector.store;

    this.init();
  }

  init() {
    if (!this.inspector) {
      return;
    }

    const markupApp = MarkupApp({});

    const provider = createElement(
      Provider,
      {
        id: "markupview",
        key: "markupview",
        store: this.store,
        title: INSPECTOR_L10N.getStr("inspector.panelLabel.markupView"),
      },
      markupApp
    );

    // Expose the provider to let inspector.js use it in setupSidebar.
    this.provider = provider;
  }

  destroy() {
    this.document = null;
    this.inspector = null;
    this.store = null;
  }
}

module.exports = MarkupView;
