import "../src/test-prep";

import { useAuth0 } from "@auth0/auth0-react";
import Head from "next/head";
import type { AppContext, AppProps } from "next/app";
import { useRouter } from "next/router";
import NextApp from "next/app";
import { setRepaintAfterEvaluations } from "protocol/thread/thread";
import React, { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { Store } from "redux";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import ErrorBoundary from "ui/components/ErrorBoundary";
import _App from "ui/components/App";
import { bootstrapApp } from "ui/setup";
import { ConfirmProvider } from "ui/components/shared/Confirm";
import MaintenanceModeScreen from "ui/components/MaintenanceMode";
import { InstallRouteListener } from "ui/utils/routeListener";
import { useLaunchDarkly } from "ui/utils/launchdarkly";
import { pingTelemetry } from "ui/utils/replay-telemetry";
import tokenManager from "ui/utils/tokenManager";
import { ApolloWrapper } from "ui/components/ApolloWrapper";
import { configureMockEnvironmentForTesting, isMock } from "ui/utils/environment";
import { features } from "ui/utils/prefs";

import "image/image.css";
import "image/icon.css";
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
import "ui/components/Header/UserOptions.css";
import "ui/components/Header/ViewToggle.css";
import "ui/components/Library/Sidebar.css";
import "ui/components/reactjs-popup.css";
import "ui/components/Events/Events.css";
import "ui/components/SecondaryToolbox/SecondaryToolbox.css";
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
import "ui/components/Timeline/Timeline.css";
import "ui/components/Timeline/Tooltip.css";
import "ui/components/Toolbox.css";
import "ui/components/Transcript/Transcript.css";
import "ui/utils/sourcemapVisualizer.css";

if (isMock()) {
  // If this is an end to end test, bootstrap the mock environment.
  configureMockEnvironmentForTesting();
}

// Expose app feature flags to the protocol through an app-agnostic API.
if (features.repaintEvaluations) {
  setRepaintAfterEvaluations(true);
}

interface AuthProps {
  apiKey?: string;
}

// We need to ensure that we always pass the same handleAuthError function
// to ApolloWrapper, otherwise it will create a new apolloClient every time
// and parts of the UI will reset (https://github.com/RecordReplay/devtools/issues/6168).
// But handleAuthError needs access to the current values from useAuth0(),
// so we use a constant wrapper around the _handleAuthError() function that
// will be recreated with the current values.
let _handleAuthError: () => Promise<void>;
function handleAuthError() {
  _handleAuthError?.();
}

function AppUtilities({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, getAccessTokenSilently, error } = useAuth0();

  _handleAuthError = async () => {
    // This handler attempts to handle the scenario in which the frontend and
    // our auth client think the user has a valid auth session but the backend
    // disagrees. In this case, we should refresh the token so we can continue
    // or, if that fails, return to the login page so the user can resume.
    if (!isAuthenticated || router.pathname.startsWith("/login")) {
      return;
    }

    try {
      pingTelemetry("devtools-auth-error-refresh");
      await getAccessTokenSilently({ ignoreCache: true });
    } catch {
      pingTelemetry("devtools-auth-error-refresh-fail");
      const returnToPath = window.location.pathname + window.location.search;
      router.push({ pathname: "/login", query: { returnTo: returnToPath } });
    }
  };

  return (
    <ApolloWrapper onAuthError={handleAuthError}>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ApolloWrapper>
  );
}
function Routing({ Component, pageProps }: AppProps) {
  const [store, setStore] = useState<Store | null>(null);
  const { getFeatureFlag } = useLaunchDarkly();

  useEffect(() => {
    bootstrapApp().then((store: Store) => setStore(store));
  }, []);

  if (!store) {
    // We hide the tips here since we don't have the store ready yet, which
    // the tips need to work properly.
    return null;
  }

  if (getFeatureFlag("maintenance-mode")) {
    return <MaintenanceModeScreen />;
  }

  return (
    <Provider store={store}>
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
        <title>Replay</title>
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
  const router = useRouter();
  let head: React.ReactNode;

  // HACK: Coordinates with the recording page to render its <head> contents for
  // social meta tags. This can be removed once we are able to handle SSR
  // properly all the way to the pages. __N_SSG is a very private
  // (https://github.com/vercel/next.js/discussions/12558) Next.js prop to
  // indicate server-side rendering. It works for now but likely will be removed
  // or replaced so we need to fix our SSR and stop using it.
  if (props.__N_SSG && router.pathname.match(/^\/recording\//)) {
    head = <props.Component {...props.pageProps} headOnly />;
  }
  return (
    <tokenManager.Auth0Provider apiKey={apiKey}>
      {head}
      <AppUtilities>
        <Routing {...props} />
      </AppUtilities>
    </tokenManager.Auth0Provider>
  );
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
