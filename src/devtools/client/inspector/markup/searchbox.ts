const { InspectorSearch } = require("devtools/client/inspector/inspector-search");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts").default;
const { LocalizationHelper } = require("devtools/shared/l10n");

export default class MarkupSearchbox {
  private markupPanel!: HTMLElement;
  private searchBox!: HTMLElement;
  private searchResultsContainer!: HTMLElement;
  private searchResultsLabel!: HTMLElement;
  private _search: any;
  private searchboxShortcuts: any;

  get search() {
    if (!this._search) {
      this._search = new InspectorSearch(this.searchBox);
    }

    return this._search;
  }

  /**
   * Hooks the searchbar to show result and auto completion suggestions.
   */
  setupSearchBox() {
    this.markupPanel = document.getElementById("inspector-main-content")!;
    this.searchBox = document.getElementById("inspector-searchbox")!;
    this.searchResultsContainer = document.getElementById("inspector-searchlabel-container")!;
    this.searchResultsLabel = document.getElementById("inspector-searchlabel")!;

    this.searchBox.addEventListener(
      "focus",
      () => {
        this.search.on("search-cleared", this._clearSearchResultsLabel);
        this.search.on("search-result", this._updateSearchResultsLabel);
      },
      { once: true }
    );

    this.createSearchBoxShortcuts();
  }

  createSearchBoxShortcuts() {
    this.searchboxShortcuts = new KeyShortcuts({
      window: document.defaultView,
      target: this.markupPanel,
    });
    const key = "CmdOrCtrl+F";
    this.searchboxShortcuts.on(key, (event: KeyboardEvent) => {
      event.preventDefault();
      this.searchBox.focus();
    });
  }

  _clearSearchResultsLabel = (result: any) => {
    return this._updateSearchResultsLabel(result, true);
  };

  _updateSearchResultsLabel = (result: any, clear = false) => {
    let str = "";
    if (!clear) {
      if (result) {
        str = `${result.resultsIndex + 1} of ${result.resultsLength}`;
      } else {
        str = "No matches";
      }

      this.searchResultsContainer!.hidden = false;
    } else {
      this.searchResultsContainer!.hidden = true;
    }

    this.searchResultsLabel!.textContent = str;
  };
}
