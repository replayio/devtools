import "../src/test-prep";
import "ui/utils/whatwg-url-fix";

import Head from "next/head";
import type { AppContext, AppProps } from "next/app";
import NextApp from "next/app";
import React, { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { IntercomProvider } from "react-use-intercom";
import tokenManager from "ui/utils/tokenManager";
import { ApolloWrapper } from "ui/utils/apolloClient";
import LoadingScreen, { StaticLoadingScreen } from "ui/components/shared/LoadingScreen";
import ErrorBoundary from "ui/components/ErrorBoundary";
import _App from "ui/components/App";
import { bootstrapApp } from "ui/setup";
import "image/image.css";
import { Store } from "redux";
import { ConfirmProvider } from "ui/components/shared/Confirm";
import MaintenanceModeScreen from "ui/components/MaintenanceMode";

import "tailwindcss/tailwind.css";
import "../src/base.css";
import "devtools/client/debugger/src/components/variables.css";
import "devtools/client/themes/variables.css";

/////////////////// here be dragons ... ////////////////////
import "codemirror/lib/codemirror.css";
import "devtools/packages/devtools-reps/object-inspector/components/ObjectInspector.css";
import "devtools/packages/devtools-reps/reps/reps.css";
import "devtools/client/debugger/src/components/A11yIntention.css";
import "devtools/client/debugger/src/components/App.css";
import "devtools/client/debugger/src/components/Editor/Breakpoints/Breakpoints.css";
import "devtools/client/debugger/src/components/Editor/Breakpoints/Panel/Panel.css";
import "devtools/client/debugger/src/components/Editor/Editor.css";
import "devtools/client/debugger/src/components/Editor/Footer.css";
import "devtools/client/debugger/src/components/Editor/LineNumberTooltip.css";
import "devtools/client/debugger/src/components/Editor/Preview/Popup.css";
import "devtools/client/debugger/src/components/Editor/SearchBar.css";
import "devtools/client/debugger/src/components/Editor/Tabs.css";
import "devtools/client/debugger/src/components/SourceOutline/Outline.css";
import "devtools/client/debugger/src/components/PrimaryPanes/Sources.css";
import "devtools/client/debugger/src/components/FullTextSearch/FullTextSearch.css";
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
import "devtools/server/actors/highlighters.css";
import "ui/components/App.css";
import "ui/components/Comments/Comments.css";
import "ui/components/Comments/TranscriptComments/CommentActions.css";
import "ui/components/Comments/TranscriptComments/CommentEditor/CommentEditor.css";
import "ui/components/Comments/VideoComments/CommentsOverlay.css";
import "ui/components/Header/ShareDropdown.css";
import "ui/components/Header/UserOptions.css";
import "ui/components/Header/ViewToggle.css";
import "ui/components/Library/Sidebar.css";
import "ui/components/reactjs-popup.css";
import "ui/components/Events/Events.css";
import "ui/components/SecondaryToolbox/SecondaryToolbox.css";
import "ui/components/SecondaryToolbox/ToolboxOptions.css";
import "ui/components/shared/CommentTool.css";
import "ui/components/shared/Dialog.css";
import "ui/components/shared/Dropdown.css";
import "ui/components/shared/IconWithTooltip.css";
import "ui/components/shared/LoadingProgressBar.css";
import "ui/components/shared/LoginModal.css";
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
import { InstallRouteListener } from "ui/utils/routeListener";

interface AuthProps {
  apiKey?: string;
}

// _ONLY_ set this flag if you want to disable the frontend entirely
const maintenanceMode = false;

function AppUtilities({ children, apiKey }: { children: ReactNode } & AuthProps) {
  return (
    <tokenManager.Auth0Provider apiKey={apiKey}>
      <ApolloWrapper>
        <IntercomProvider appId={"k7f741xx"} autoBoot>
          <ConfirmProvider>{children}</ConfirmProvider>
        </IntercomProvider>
      </ApolloWrapper>
    </tokenManager.Auth0Provider>
  );
}
function Routing({ Component, pageProps }: AppProps) {
  const [store, setStore] = useState<Store | null>(null);
  useEffect(() => {
    bootstrapApp().then((store: Store) => setStore(store));
  }, []);

  if (!store) {
    // We hide the tips here since we don't have the store ready yet, which
    // the tips need to work properly.
    return <StaticLoadingScreen />;
  }

  if (!store) {
    // We hide the tips here since we don't have the store ready yet, which
    // the tips need to work properly.
    return <StaticLoadingScreen />;
  }

  if (maintenanceMode) {
    return <MaintenanceModeScreen />;
  }

  return (
    <Provider store={store}>
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
        <title>Replay</title>
        <link rel="stylesheet" href="/fonts/inter/inter.css" />
        <link rel="stylesheet" href="/fonts/material_icons/material_icons.css" />
      </Head>
      <_App>
        <InstallRouteListener />
        <ErrorBoundary>
          <React.Suspense fallback={<LoadingScreen />}>
            <Component {...pageProps} />
          </React.Suspense>
        </ErrorBoundary>
      </_App>
    </Provider>
  );
}

const App = ({ apiKey, ...props }: AppProps & AuthProps) => {
  return <AppUtilities apiKey={apiKey}>{<Routing {...props} />}</AppUtilities>;
};

App.getInitialProps = (appContext: AppContext) => {
  const props = NextApp.getInitialProps(appContext);
  const authHeader = appContext.ctx.req?.headers.authorization;
  const authProps: AuthProps = { apiKey: undefined };

  if (authHeader) {
    const [scheme, token] = authHeader.split(" ", 2);
    if (!token || !/^Bearer$/i.test(scheme)) {
      console.error("Format is Authorization: Bearer [token]");
    } else {
      authProps.apiKey = token;
    }
  }

  return { ...props, ...authProps };
};

export default App;
