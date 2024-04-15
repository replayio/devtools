import classnames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import Icon from "replay-next/components/Icon";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { useHasNoRole } from "ui/hooks/recordings";
import {
  shouldShowAddComment,
  shouldShowAddUnicornBadge,
  shouldShowBreakpointEdit,
  shouldShowConsoleNavigate,
  shouldShowFindFile,
  shouldShowInspectElement,
  shouldShowInspectNetworkRequest,
  shouldShowInspectReactComponent,
  shouldShowJumpToCode,
  shouldShowJumpToEvent,
  shouldShowJumpToNetworkRequest,
  shouldShowSearchSourceText,
  shouldShowShareNag,
  shouldShowUseFocusMode,
} from "ui/utils/onboarding";

import styles from "./Passport.module.css";

const stepNames = ["step-one", "step-two", "step-three", "step-four"] as const;

const Passport = (props: PropsFromRedux) => {
  const [showTestsuitesPassportFirstRun, setShowTestsuitesPassportFirstRun] = useGraphQLUserData(
    "layout_testsuitesPassportFirstRun"
  );

  const [selectedIndices, setSelectedIndices] = useState({ sectionIndex: 0, itemIndex: 0 });
  const { nags } = hooks.useGetUserInfo();
  const showAddComment = shouldShowAddComment(nags);
  const showAddUnicornBadge = shouldShowAddUnicornBadge(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);
  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showFindFile = shouldShowFindFile(nags);
  const showInspectElement = shouldShowInspectElement(nags);
  const showInspectNetworkRequest = shouldShowInspectNetworkRequest(nags);
  const showInspectReactComponent = shouldShowInspectReactComponent(nags);
  const showJumpToCode = shouldShowJumpToCode(nags);
  const showJumpToEvent = shouldShowJumpToEvent(nags);
  const showJumpToNetworkRequest = shouldShowJumpToNetworkRequest(nags);
  const showSearchSourceText = shouldShowSearchSourceText(nags);
  const showShareNag = shouldShowShareNag(nags);
  const showUseFocusMode = shouldShowUseFocusMode(nags);

  const { hasNoRole, loading: roleDataLoading } = useHasNoRole();

  const videoExampleRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (showTestsuitesPassportFirstRun) {
      setShowTestsuitesPassportFirstRun(false);
    }
  }, [showTestsuitesPassportFirstRun, setShowTestsuitesPassportFirstRun]);

  const getItemStyle = (sectionIndex: number, itemIndex: number) => {
    if (sectionIndex === selectedIndices.sectionIndex && itemIndex === selectedIndices.itemIndex) {
      return styles.selectedItem;
    }
    return "";
  };

  const renderCheckmarkIcon = (completed: boolean | undefined) => {
    if (completed === true) {
      return "checked-rounded";
    }
    return "unchecked-rounded";
  };

  const handleClick = (sectionIndex: number, itemIndex: number) => {
    setSelectedIndices({ sectionIndex, itemIndex });
  };

  const hideFeatureShowPassport = () => {
    props.setModal("passport-dismiss");
  };

  const timeTravelItems = [
    {
      label: "Console time travel",
      completed: !showConsoleNavigate,
      videoUrl: "https://vercel.replay.io/passport/time_travel_in_console.gif",
      imageBaseName: "time_travel_in_the_console",
      docsLink:
        "https://replayio.notion.site/Navigate-in-the-console-3b732260a9254c20b43d213c4a93c9de?pvs=4",
      blurb: "Look for the blue button in the console.",
    },
    {
      label: "Add a console log",
      completed: !showBreakpointEdit,
      videoUrl: "https://vercel.replay.io/passport/set_print_statement.gif",
      imageBaseName: "set_a_print_statement",
      docsLink:
        "https://replayio.notion.site/Adding-print-statements-18a7d1f85b434706b46af0a8d5d298fe?pvs=4",
      blurb: "When looking at a source, click the plus sign.",
    },
  ];

  const jumpItems = [
    {
      label: "Jump to code",
      completed: !showJumpToCode,
      videoUrl: "https://vercel.replay.io/passport/jump_to_code.gif",
      imageBaseName: "jump_to_code",
      docsLink: "https://replayio.notion.site/Jump-to-code-45026e5087014475a52dc4a8024dc850?pvs=4",
      blurb: "Click the info icon on the left nav, then look for the blue button.",
    },
    {
      label: "Jump to event",
      completed: !showJumpToEvent,
      videoUrl: "https://vercel.replay.io/passport/jump_to_an_event.gif",
      imageBaseName: "jump_to_event",
      docsLink: "https://replayio.notion.site/Jump-to-event-199d592b0ff1458bac0f27a7c2a9f78d?pvs=4",
      blurb: "Click the info icon on the left nav to see all events in your replay.",
    },
    {
      label: "Jump to network request",
      completed: !showJumpToNetworkRequest,
      videoUrl: "https://vercel.replay.io/passport/jump_to_network_request.gif",
      imageBaseName: "jump_to_network_request",
      docsLink:
        "https://www.notion.so/replayio/Jump-to-network-request-8fc5dadc78274ca68a91714226ca165d?pvs=4",
      blurb: "In the network pane, you can jump to some requests.",
    },
  ];

  const inspectionItems = [
    {
      label: "Inspect UI elements",
      completed: !showInspectElement,
      videoUrl: "https://vercel.replay.io/passport/inspect_an_element.gif",
      imageBaseName: "inspect_element",
      docsLink:
        "https://replayio.notion.site/Inspect-UI-elements-5dcab655fe7343a798f3adacbaf937fc?pvs=4",
      blurb: "Look for the elements tab to the right of the console.",
    },
    {
      label: "Inspect network requests",
      completed: !showInspectNetworkRequest,
      videoUrl: "https://vercel.replay.io/passport/inspect_a_network_request.gif",
      imageBaseName: "inspect_network_request",
      docsLink:
        "https://replayio.notion.site/Inspect-network-elements-f3e47ee936324fef92fe555c9de6567d?pvs=4",
      blurb: "Network requests is to the right of the console and elements tabs.",
    },
    {
      label: "Inspect React components",
      completed: !showInspectReactComponent,
      videoUrl: "https://vercel.replay.io/passport/inspect_a_react_component.gif",
      imageBaseName: "inspect_react_component",
      docsLink:
        "https://replayio.notion.site/Inspect-React-elements-5e4ae5b2a8fb4b6bba8ca5167ce94eb0?pvs=4",
      blurb: "The React tab is in the same area as console, elements, and network events.",
    },
  ];

  const swissArmyItems = [
    {
      label: "Add a comment",
      completed: !showAddComment,
      videoUrl: "https://vercel.replay.io/passport/add_a_comment.gif",
      imageBaseName: "add_a_comment",
      docsLink: "https://replayio.notion.site/Add-a-comment-1b042007d9874ad6880af1dea7dd1e42?pvs=4",
      blurb:
        "Click in the video region to set a comment. It's also possible to add comments to console logs, print statements, and network monitor requests.",
    },
    {
      label: "Add a unicorn badge",
      completed: !showAddUnicornBadge,
      videoUrl: "https://vercel.replay.io/passport/unicorn_badge.gif",
      imageBaseName: "add_a_unicorn_badge",
      docsLink: "https://replayio.notion.site/Add-a-badge-c50800e3065c4c2d9ad7b16449d0a8a1?pvs=4",
      blurb: "When setting a print statement, click the gray circle to the left.",
    },
    {
      label: "Search source text",
      completed: !showSearchSourceText,
      videoUrl: "https://vercel.replay.io/passport/search_source_text.gif",
      imageBaseName: "search_source_text",
      docsLink:
        "https://replayio.notion.site/Search-source-text-869e0205b8b14f94b3f15020fc4bf0f9?pvs=4",
      blurb: "Click the magnifying glass icon in the left nav.",
    },
    {
      label: "Set a focus window",
      completed: !showUseFocusMode,
      videoUrl: "https://vercel.replay.io/passport/use_focus_mode.gif",
      imageBaseName: "use_focus_mode",
      docsLink:
        "https://replayio.notion.site/Set-a-focus-window-2409a0207b2449e6baf162f27ce37b35?pvs=4",
      blurb: "Look for the focus icon in the bottom right corner.",
    },
    {
      label: "Go to file (cmd-p)",
      completed: !showFindFile,
      videoUrl: "https://vercel.replay.io/passport/find_file.gif",
      imageBaseName: "find_file",
      docsLink: "https://replayio.notion.site/Go-to-file-4e867dc10f7d4db3be78e9bfc53c97f9?pvs=4",
      blurb: "Press command-P on your keyboard.",
    },
  ];

  // Users that have no role don't see the "Share" dialog
  if (!roleDataLoading && !hasNoRole) {
    swissArmyItems.push({
      label: "Share",
      completed: !showShareNag,
      videoUrl: "https://vercel.replay.io/passport/share.gif",
      imageBaseName: "share",
      docsLink: "https://replayio.notion.site/Share-7ecdd5ce6c36456bb1354540656f6799?pvs=4",
      blurb: "Click the blue share button at the top of the app.",
    });
  }

  const sections: Section[] = [
    {
      title: "TIME TRAVELLER",
      items: timeTravelItems,
    },
    {
      title: "JUMP EXPERT",
      items: jumpItems,
    },
    {
      title: "INSPECTOR",
      items: inspectionItems,
    },
    {
      title: "ADVENTURER",
      items: swissArmyItems,
    },
  ];

  interface ItemType {
    label: string;
    completed: boolean;
    videoUrl: string;
    imageBaseName: string;
    docsLink?: string;
    blurb: string;
  }

  interface Section {
    title: string;
    items: ItemType[];
  }

  const selectedItem = sections[selectedIndices.sectionIndex].items[selectedIndices.itemIndex];

  const rand = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const [randomRight, setRandomRight] = useState(rand(-50, 0));
  const [randomRotation, setRandomRotation] = useState(rand(-20, 20));

  const handleDocsClick = (link: string) => {
    window.open(link, "_blank");
  };

  const renderSection = (section: Section, sectionIndex: number) => {
    return (
      <div className={styles.section}>
        <div className={classnames("flex", styles.headerItem)}>
          <Icon className={styles.stepIcon} type={stepNames[sectionIndex]} />
          <span className={`${styles.title}`}>{section.title}</span>
        </div>
        <div className={styles.checklist}>
          {section.items.map((item: ItemType, itemIndex: number) => (
            <div
              key={itemIndex}
              className={`flex ${getItemStyle(sectionIndex, itemIndex)} ${styles.checklistItem}`}
              onClick={() => handleClick(sectionIndex, itemIndex)}
              style={{ position: "relative" }}
              data-test-name="PassportItem"
              data-test-completed={item.completed}
            >
              <Icon className={styles.stepIcon} type={renderCheckmarkIcon(item.completed)} />
              <span className={styles.title}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    setRandomRight(rand(-50, 0));
    setRandomRotation(rand(-20, 20));
  }, [selectedItem.completed]);

  return (
    <div className={`${styles.PassportBoxWrapper} flex h-screen flex-col`}>
      {selectedItem.completed && (
        <img
          src={`/recording/images/passport/${selectedItem.imageBaseName}-complete.png`}
          className={styles.largeCompletedImage}
          style={{
            zIndex: 0,
            opacity: 0.25,
            top: `50px`,
            right: `${randomRight}px`,
            transform: `rotate(${randomRotation}deg)`,
          }}
        />
      )}

      <div className={styles.ToolbarHeader}>
        Time Traveller Passport
        <button className={styles.close} onClick={hideFeatureShowPassport}>
          <Icon type="close" />
        </button>
      </div>

      <div className="flex-grow overflow-auto">
        <div className="p-2">
          <div className={styles.sectionsContainer}>
            {sections.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                {renderSection(section, sectionIndex)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="p-1">
        <div className={styles.blurbContainer}>
          <p>
            {selectedItem.blurb}{" "}
            <a href={selectedItem.docsLink} target="docs" rel="noreferrer">
              Read docs
            </a>
          </p>
        </div>
        <img
          src={selectedItem.videoUrl}
          className={`${styles.videoExample} w-full object-cover`}
          ref={videoExampleRef}
        />
      </div>
    </div>
  );
};

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Passport);
