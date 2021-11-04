require("tailwindcss/tailwind.css");
require("./base.css");

const url = new URL(window.location.href);
const test = url.searchParams.get("test");

// During testing, make sure we clear local storage before importing
// any code that might instantiate preferences from local storage.
// If the url contains a "navigated" parameter, we assume this is the
// second part of a test that contains a navigation and don't clear
// local storage in that case.
if (test && !url.searchParams.get("navigated")) {
  localStorage.clear();
  require("devtools/shared/async-storage").clear();
}

// *** WARNING ***
//
// Do not use "import" in this file. The import will run before we clear
// the local storage above, and existing local storage contents may be used
// when running automated tests, which we don't want to happen. It would
// be good if this was less fragile...
//

require("ui/utils/whatwg-url-fix");
const React = require("react");
const ReactDOM = require("react-dom");
const { BrowserRouter: Router, Route, Switch } = require("react-router-dom");
const { InstallRouteListener } = require("ui/utils/routeListener");
import "devtools/client/debugger/src/components/variables.css";
import "devtools/client/themes/variables.css";

import "tailwindcss/tailwind.css";
import "../src/base.css";
import "devtools/client/debugger/src/components/variables.css";
import "devtools/client/themes/variables.css";

/////////////////// here be dragons ... ////////////////////
import "devtools/client/debugger/packages/devtools-reps/src/object-inspector/components/ObjectInspector.css";
import "devtools/client/debugger/packages/devtools-reps/src/reps/reps.css";
import "devtools/client/debugger/packages/devtools-splitter/src/SplitBox.css";
import "devtools/client/debugger/src/components/A11yIntention.css";
import "devtools/client/debugger/src/components/Editor/Breakpoints/Breakpoints.css";
import "devtools/client/debugger/src/components/Editor/Breakpoints/Panel/FirstEditNag.css";
import "devtools/client/debugger/src/components/Editor/Breakpoints/Panel/Panel.css";
import "devtools/client/debugger/src/components/Editor/Editor.css";
import "devtools/client/debugger/src/components/Editor/Footer.css";
import "devtools/client/debugger/src/components/Editor/LineNumberTooltip.css";
import "devtools/client/debugger/src/components/Editor/Preview/Popup.css";
import "devtools/client/debugger/src/components/Editor/SearchBar.css";
import "devtools/client/debugger/src/components/Editor/Tabs.css";
import "devtools/client/debugger/src/components/PrimaryPanes/Outline.css";
import "devtools/client/debugger/src/components/PrimaryPanes/OutlineFilter.css";
import "devtools/client/debugger/src/components/PrimaryPanes/Sources.css";
import "devtools/client/debugger/src/components/ProjectSearch.css";
import "devtools/client/debugger/src/components/QuickOpenModal.css";
import "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/Breakpoint.css";
import "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation.css";
import "devtools/client/debugger/src/components/SecondaryPanes/CommandBar.css";
import "devtools/client/debugger/src/components/SecondaryPanes/EventListeners.css";
import "devtools/client/debugger/src/components/SecondaryPanes/Frames/Frames.css";
import "devtools/client/debugger/src/components/SecondaryPanes/Frames/Group.css";
import "devtools/client/debugger/src/components/SecondaryPanes/FrameTimeline.css";
import "devtools/client/debugger/src/components/SecondaryPanes/Scopes.css";
import "devtools/client/debugger/src/components/SecondaryPanes/SecondaryPanes.css";
import "devtools/client/debugger/src/components/shared/AccessibleImage.css";
import "devtools/client/debugger/src/components/shared/AccessibleImage.css";
import "devtools/client/debugger/src/components/shared/Accordion.css";
import "devtools/client/debugger/src/components/shared/Badge.css";
import "devtools/client/debugger/src/components/shared/BracketArrow.css";
import "devtools/client/debugger/src/components/shared/Button/styles/CloseButton.css";
import "devtools/client/debugger/src/components/shared/Button/styles/CommandBarButton.css";
import "devtools/client/debugger/src/components/shared/Button/styles/PaneToggleButton.css";
import "devtools/client/debugger/src/components/shared/Dropdown.css";
import "devtools/client/debugger/src/components/shared/ManagedTree.css";
import "devtools/client/debugger/src/components/shared/menu.css";
import "devtools/client/debugger/src/components/shared/Modal.css";
import "devtools/client/debugger/src/components/shared/Popover.css";
import "devtools/client/debugger/src/components/shared/PreviewFunction.css";
import "devtools/client/debugger/src/components/shared/ResultList.css";
import "devtools/client/debugger/src/components/shared/SearchInput.css";
import "devtools/client/debugger/src/components/shared/SourceIcon.css";
import "devtools/client/debugger/src/components/shared/tree.css";
import "devtools/client/debugger/src/components/ShortcutsModal.css";
import "devtools/client/debugger/src/components/WelcomeBox.css";
import "codemirror/lib/codemirror.css";
import "devtools/client/debugger/src/utils/editor/source-editor.css";
import "devtools/client/inspector/components/InspectorTabPanel.css";
import "devtools/client/inspector/markup/components/EventTooltip.css";
import "devtools/client/shared/components/Accordion.css";
import "devtools/client/shared/components/menu/MenuList.css";
import "devtools/client/shared/components/SidebarToggle.css";
import "devtools/client/shared/components/splitter/SplitBox.css";
import "devtools/client/shared/components/tabs/Tabs.css";
import "devtools/client/themes/accessibility-color-contrast.css";
import "devtools/client/themes/badge.css";
import "devtools/client/themes/boxmodel.css";
import "devtools/client/themes/breadcrumbs.css";
import "devtools/client/themes/changes.css";
import "devtools/client/themes/common.css";
import "devtools/client/themes/computed.css";
import "devtools/client/themes/inspector.css";
import "devtools/client/themes/layout.css";
import "devtools/client/themes/rules.css";
import "devtools/client/themes/splitters.css";
import "devtools/client/themes/toolbars.css";
import "devtools/client/themes/tooltips.css";
import "devtools/client/themes/webconsole.css";
import "devtools/client/webconsole/components/App.css";
import "devtools/client/webconsole/components/FilterBar/Events.css";
import "devtools/client/debugger/src/components/App.css";
import "devtools/server/actors/highlighters.css";
import "ui/components/App.css";
import "ui/components/Account/Account.css";
import "ui/components/Comments/Comments.css";
import "ui/components/Comments/TranscriptComments/CommentActions.css";
import "ui/components/Comments/TranscriptComments/CommentEditor/CommentEditor.css";
import "ui/components/Comments/VideoComments/CommentsOverlay.css";
import "ui/components/Comments/VideoComments/Hud.css";
import "ui/components/Header/ShareDropdown.css";
import "ui/components/Header/Header.css";
import "ui/components/Header/UserOptions.css";
import "ui/components/Header/ViewToggle.css";
import "ui/components/Library/Sidebar.css";
import "ui/components/reactjs-popup.css";
import "ui/components/SecondaryToolbox/SecondaryToolbox.css";
import "ui/components/SecondaryToolbox/ToolboxOptions.css";
import "ui/components/shared/CommentTool.css";
import "ui/components/shared/Dialog.css";
import "ui/components/shared/Dropdown.css";
import "ui/components/shared/IconWithTooltip.css";
import "ui/components/shared/LoadingProgressBar.css";
import "ui/components/shared/LoginModal.css";
import "ui/components/shared/MaterialIcon.css";
import "ui/components/shared/Modal.css";
import "ui/components/shared/PortalDropdown.css";
import "ui/components/shared/SettingsModal/SettingsBody.css";
import "ui/components/shared/SettingsModal/SettingsModal.css";
import "ui/components/shared/SettingsModal/SettingsNavigation.css";
import "ui/components/shared/SharingModal/CollaboratorsList.css";
import "ui/components/shared/SharingModal/EmailForm.css";
import "ui/components/shared/SharingModal/ReplayLink.css";
import "ui/components/shared/WorkspaceSettingsModal/WorkspaceMember.css";
import "ui/components/Timeline/MessageMarker.css";
import "ui/components/Timeline/ScrollContainer.css";
import "ui/components/Timeline/Timeline.css";
import "ui/components/Timeline/Tooltip.css";
import "ui/components/Toolbox.css";
import "ui/components/Transcript/Transcript.css";
import "ui/components/Views/NonDevView.css";

const BrowserError = React.lazy(() => import("views/browser/error"));
const BrowserImport = React.lazy(() => import("views/browser/import-settings"));
const BrowserLaunch = React.lazy(() => import("views/browser/launch"));
const BrowserNewTab = React.lazy(() => import("views/browser/new-tab"));
const BrowserWelcome = React.lazy(() => import("views/browser/welcome"));
const AppRouter = React.lazy(() => import("views/app"));
const MaintenanceModeScreen = React.lazy(() => import("ui/components/MaintenanceMode"));
const { BlankProgressScreen } = require("ui/components/shared/BlankScreen");

// _ONLY_ set this flag if you want to disable the frontend entirely
const maintenanceMode = false;

ReactDOM.render(
  <React.Suspense
    fallback={<BlankProgressScreen statusMessage="Fetching data" background="white" />}
  >
    <Router>
      <InstallRouteListener />
      <Switch>
        <Route path={maintenanceMode ? "/" : "/maintenance"} component={MaintenanceModeScreen} />
        <Route exact path="/browser/error" component={BrowserError} />
        <Route exact path="/browser/import-settings" component={BrowserImport} />
        <Route exact path="/browser/launch" component={BrowserLaunch} />
        <Route exact path="/browser/new-tab" component={BrowserNewTab} />
        <Route exact path="/browser/welcome" component={BrowserWelcome} />
        <Route component={AppRouter} />
      </Switch>
    </Router>
  </React.Suspense>,
  document.querySelector("#app")
);
