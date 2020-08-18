/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Instead of using url() in CSS files, this is a centralized place to specify
// load SVGs, convert them to data: urls, and create a style sheet with those
// data urls embedded.
//
// There is a webpack loader that is supposed to do this, but getting it to
// actually work turned out to be more difficult than reimplementing it.

const gBackgroundImages = {
  ".img.webpack": require("devtools/client/debugger/images/sources/webpack.svg"),
  ".img.vue": require("devtools/client/debugger/images/sources/vuejs.svg"),
  ".img.vuejs": require("devtools/client/debugger/images/sources/vuejs.svg"),
  ".img.aframe": require("devtools/client/debugger/images/sources/aframe.svg"),
  ".img.angular": require("devtools/client/debugger/images/sources/angular.svg"),
  ".img.choo": require("devtools/client/debugger/images/sources/choo.svg"),
  ".img.dojo": require("devtools/client/debugger/images/sources/dojo.svg"),
  ".img.ember": require("devtools/client/debugger/images/sources/ember.svg"),
  ".img.marko": require("devtools/client/debugger/images/sources/marko.svg"),
  ".img.mobx": require("devtools/client/debugger/images/sources/mobx.svg"),
  ".img.nextjs": require("devtools/client/debugger/images/sources/nextjs.svg"),
  ".img.node": require("devtools/client/debugger/images/sources/node.svg"),
  ".img.nuxtjs": require("devtools/client/debugger/images/sources/nuxtjs.svg"),
  ".img.preact": require("devtools/client/debugger/images/sources/preact.svg"),
  ".img.pug": require("devtools/client/debugger/images/sources/pug.svg"),
  ".img.rxjs": require("devtools/client/debugger/images/sources/rxjs.svg"),
  ".img.sencha-extjs": require("devtools/client/debugger/images/sources/sencha-extjs.svg"),
  ".webconsole-console-settings-menu-button::before": require("devtools/client/themes/images/settings.svg"),
  ".webconsole-input-openEditorButton::before": require("devtools/client/themes/images/webconsole/editor.svg"),
  ".sidebar-close-button::before": require("devtools/client/themes/images/close.svg"),
  ".jsterm-editor .webconsole-editor-toolbar .webconsole-editor-toolbar-history-prevExpressionButton::before": require("devtools/client/themes/images/arrowhead-up.svg"),
  ".jsterm-editor .webconsole-editor-toolbar .webconsole-editor-toolbar-history-nextExpressionButton::before": require("devtools/client/themes/images/arrowhead-down.svg"),
  ".jsterm-editor .webconsole-editor-toolbar .webconsole-editor-toolbar-reverseSearchButton::before": require("devtools/client/themes/images/webconsole/reverse-search.svg"),
  ".jsterm-editor .webconsole-editor-toolbar .webconsole-editor-toolbar-closeButton::before": require("devtools/client/themes/images/close.svg"),
  ".devtools-button.devtools-clear-icon::before": require("devtools/client/themes/images/clear.svg"),
  ".devtools-searchinput": require("devtools/client/themes/images/search.svg"),
  ".devtools-filterinput": require("devtools/client/themes/images/filter-small.svg"),
  ".devtools-searchinput-clear": require("devtools/client/themes/images/search-clear.svg"),
  ".theme-twisty": require("devtools/client/themes/images/arrow.svg"),
  ".all-tabs-menu": require("devtools/client/themes/images/dropmarker.svg"),
  ".message.command > .icon": require("devtools/client/themes/images/webconsole/input.svg"),
  ".message.result > .icon": require("devtools/client/themes/images/webconsole/return.svg"),
  ".message.info > .icon": require("devtools/client/themes/images/info-small.svg"),
  ".message.error > .icon": require("devtools/client/themes/images/error-small.svg"),
  ".message.warn > .icon": require("devtools/client/themes/images/alert-small.svg"),
  ".message.navigationMarker > .icon": require("devtools/client/themes/images/webconsole/navigation.svg"),
  ".message > .icon.logpoint": require("devtools/client/debugger/images/webconsole-logpoint.svg"),
  //".jsterm-input-container > .CodeMirror": require("devtools/client/themes/images/webconsole/input.svg"),
  "#split-console-close-button::before": require("devtools/client/themes/images/close.svg"),
  '.menuitem > .command[aria-checked="true"]': require("devtools/client/themes/images/check.svg"),
  ".message.network > .collapse-button::before, .message.startGroup > .indent[data-indent='0'] ~ .collapse-button::before, .message.startGroupCollapsed > .indent[data-indent='0'] ~ .collapse-button::before": require("devtools/client/themes/images/arrow-big.svg"),
  ".message:hover > .icon.rewindable": require("devtools/client/debugger/images/next-circle.svg"),
  "button.jump-definition": require("devtools/client/shared/components/reps/images/jump-definition-dark.svg"),
  ".img.column-marker": require("devtools/client/debugger/images/column-marker.svg"),
  ".event-tooltip-debugger-icon": require("devtools/client/shared/components/reps/images/jump-definition-dark.svg"),
  ".invoke-confirm .close-confirm-dialog-button::before": require("devtools/client/debugger/images/close.svg"),
  ".invoke-confirm .learn-more-link::after": require("devtools/client/themes/images/help.svg"),
  "#header .logo": require("./images/logo.svg"),
  ".comment-close": require("devtools/client/themes/images/close.svg"),
  ".comment-write": require("devtools/client/themes/images/pen.svg"),
  ".comment-confirm": require("devtools/client/themes/images/check.svg"),
  ".comment-jump": require("devtools/client/debugger/images/next-circle.svg"),
};

const gMaskImages = {
  ".img.babel": require("devtools/client/debugger/images/sources/babel.svg"),
  ".img.backbone": require("devtools/client/debugger/images/sources/backbone.svg"),
  ".img.coffeescript": require("devtools/client/debugger/images/sources/coffeescript.svg"),
  ".img.express": require("devtools/client/debugger/images/sources/express.svg"),
  ".img.extension": require("devtools/client/debugger/images/sources/extension.svg"),
  ".img.immutable": require("devtools/client/debugger/images/sources/immutable.svg"),
  ".img.javascript": require("devtools/client/debugger/images/sources/javascript.svg"),
  ".img.jquery": require("devtools/client/debugger/images/sources/jquery.svg"),
  ".img.lodash": require("devtools/client/debugger/images/sources/lodash.svg"),
  ".img.react": require("devtools/client/debugger/images/sources/react.svg"),
  ".img.redux": require("devtools/client/debugger/images/sources/redux.svg"),
  ".img.typescript": require("devtools/client/debugger/images/sources/typescript.svg"),
  ".img.underscore": require("devtools/client/debugger/images/sources/underscore.svg"),
  ".img.arrow": require("devtools/client/debugger/images/arrow.svg"),
  ".img.arrow-down": require("devtools/client/debugger/images/arrow-down.svg"),
  ".img.arrow-up": require("devtools/client/debugger/images/arrow-up.svg"),
  ".img.blackBox": require("devtools/client/debugger/images/blackBox.svg"),
  ".img.breadcrumb": require("devtools/client/debugger/images/breadcrumbs-divider.svg"),
  ".img.case-match": require("devtools/client/debugger/images/case-match.svg"),
  ".img.close": require("devtools/client/debugger/images/close.svg"),
  ".img.disable-pausing": require("devtools/client/debugger/images/disable-pausing.svg"),
  ".img.globe": require("devtools/client/debugger/images/globe.svg"),
  ".img.globe-small": require("devtools/client/debugger/images/globe-small.svg"),
  ".img.window": require("devtools/client/debugger/images/window.svg"),
  ".img.file": require("devtools/client/debugger/images/file-small.svg"),
  ".img.folder": require("devtools/client/debugger/images/folder.svg"),
  ".img.home": require("devtools/client/debugger/images/home.svg"),
  ".img.info": require("devtools/client/debugger/images/info.svg"),
  ".img.loader": require("devtools/client/debugger/images/loader.svg"),
  ".img.more-tabs": require("devtools/client/debugger/images/command-chevron.svg"),
  ".img.next": require("devtools/client/debugger/images/next.svg"),
  ".img.next-circle": require("devtools/client/debugger/images/next-circle.svg"),
  ".img.pane-collapse": require("devtools/client/debugger/images/pane-collapse.svg"),
  ".img.pane-expand": require("devtools/client/debugger/images/pane-expand.svg"),
  ".img.pause": require("devtools/client/debugger/images/pause.svg"),
  ".img.plus": require("devtools/client/debugger/images/plus.svg"),
  ".img.prettyPrint": require("devtools/client/debugger/images/prettyPrint.svg"),
  ".img.refresh": require("devtools/client/debugger/images/reload.svg"),
  ".img.regex-match": require("devtools/client/debugger/images/regex-match.svg"),
  ".img.resume": require("devtools/client/debugger/images/resume.svg"),
  ".img.reverseStepOver": require("devtools/client/debugger/images/stepOver.svg"),
  ".img.rewind": require("devtools/client/debugger/images/rewind.svg"),
  ".img.search": require("devtools/client/debugger/images/search.svg"),
  ".img.shortcuts": require("devtools/client/debugger/images/help.svg"),
  ".img.stepIn": require("devtools/client/debugger/images/stepIn.svg"),
  ".img.stepOut": require("devtools/client/debugger/images/stepOut.svg"),
  ".img.stepOver": require("devtools/client/debugger/images/stepOver.svg"),
  ".img.tab": require("devtools/client/debugger/images/tab.svg"),
  ".img.whole-word-match": require("devtools/client/debugger/images/whole-word-match.svg"),
  ".img.worker": require("devtools/client/debugger/images/worker.svg"),
  "#toolbox-toolbar-console .toolbar-panel-icon": require("devtools/client/themes/images/tool-webconsole.svg"),
  "#toolbox-toolbar-debugger .toolbar-panel-icon": require("devtools/client/themes/images/tool-debugger.svg"),
  "#toolbox-toolbar-inspector .toolbar-panel-icon": require("devtools/client/themes/images/tool-inspector.svg"),
  ".tree-node button.arrow": require("devtools/client/debugger/images/arrow.svg"),
  "#command-button-pick::before": require("devtools/client/themes/images/command-pick.svg"),
  "button.open-inspector": require("devtools/client/themes/images/open-inspector.svg"),
  ".img.comment-icon": require("devtools/client/themes/images/comment.svg"),
  ".img.comment": require("devtools/client/themes/images/comment-small.svg"),
};

const gContentImages = {
  ".jsterm-editor .webconsole-editor-toolbar .webconsole-editor-toolbar-executeButton::before": require("devtools/client/themes/images/webconsole/run.svg"),
  ".devtools-button.devtools-feature-callout::after": require("devtools/client/themes/images/badge-blue.svg"),
};

const gListStyleImages = {
  ".devtools-toolbarbutton.devtools-clear-icon": require("devtools/client/themes/images/clear.svg"),
  ".devtools-option-toolbarbutton": require("devtools/client/themes/images/settings.svg"),
};

// Images with additional data in the CSS rule.
const gOtherImages = {
  ".collapse-button::before": {
    style: "background",
    url: require("devtools/client/themes/images/arrow.svg"),
    after: "no-repeat center",
  },

  "button.open-accessibility-inspector, button.open-inspector": {
    style: "mask",
    url: require("devtools/client/shared/components/reps/images/open-inspector.svg"),
    after: "no-repeat",
  },
  "button.invoke-getter": {
    style: "mask",
    url: require("devtools/client/shared/components/reps/images/input.svg"),
    after: "no-repeat",
  },
};

function loadImages() {
  const style = document.createElement("style");
  document.head.appendChild(style);
  const sheet = style.sheet;

  for (const [selector, url] of Object.entries(gBackgroundImages)) {
    sheet.insertRule(`${selector} { background-image: url(${url.default}) }`);
  }

  for (const [selector, url] of Object.entries(gMaskImages)) {
    sheet.insertRule(`${selector} { mask-image: url(${url.default}) }`);
    sheet.insertRule(`${selector} { -webkit-mask-image: url(${url.default}) }`);
  }

  for (const [selector, url] of Object.entries(gContentImages)) {
    sheet.insertRule(`${selector} { content: url(${url.default}) }`);
  }

  for (const [selector, url] of Object.entries(gListStyleImages)) {
    sheet.insertRule(`${selector} { list-style-image: url(${url.default}) }`);
  }

  for (const [selector, info] of Object.entries(gOtherImages)) {
    const { style, url, before = "", after = "" } = info;
    sheet.insertRule(`${selector} { ${style}: ${before} url(${url.default}) ${after} }`);
  }
}

module.exports = loadImages;
