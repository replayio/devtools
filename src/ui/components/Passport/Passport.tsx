import classnames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import Icon from "replay-next/components/Icon";
import hooks from "ui/hooks";
import {
  shouldShowAddComment,
  shouldShowAddUnicornBadge,
  shouldShowBreakpointEdit,
  shouldShowConsoleNavigate,
  shouldShowInspectElement,
  shouldShowInspectNetworkRequest,
  shouldShowInspectReactComponent,
  shouldShowJumpToCode,
  shouldShowJumpToEvent,
  shouldShowSearchSourceText,
  shouldShowShareNag,
  shouldShowUseFocusMode,
} from "ui/utils/onboarding";

import styles from "./Passport.module.css";

const stepNames = ["step-one", "step-two", "step-three", "step-four"] as const;

const Passport = () => {
  const [selectedIndices, setSelectedIndices] = useState({ sectionIndex: 0, itemIndex: 0 });
  const { nags } = hooks.useGetUserInfo();
  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);
  const showAddComment = shouldShowAddComment(nags);
  const showJumpToCode = shouldShowJumpToCode(nags);
  const showAddUnicornBadge = shouldShowAddUnicornBadge(nags);
  const showSearchSourceText = shouldShowSearchSourceText(nags);
  const showShareNag = shouldShowShareNag(nags);
  const showJumpToEvent = shouldShowJumpToEvent(nags);
  const showInspectElement = shouldShowInspectElement(nags);
  const showInspectNetworkRequest = shouldShowInspectNetworkRequest(nags);
  const showInspectReactComponent = shouldShowInspectReactComponent(nags);
  const showUseFocusMode = shouldShowUseFocusMode(nags);

  type StepNames = typeof stepNames[number];
  const videoExampleRef = useRef<HTMLImageElement>(null);
  const [videoHeight, setVideoHeight] = useState<number | null>(null);

  useEffect(() => {
    if (videoExampleRef.current) {
      const videoHeight = videoExampleRef.current.offsetHeight;
      setVideoHeight(videoHeight);
    }
  }, [videoExampleRef]);

  useEffect(() => {
    const updateHeight = () => {
      if (videoExampleRef.current) {
        const videoHeight = videoExampleRef.current.offsetHeight;
        setVideoHeight(videoHeight);
        console.log("Updating", videoHeight);
      }
    };

    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

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

  const timeTravelItems = [
    {
      label: "Time travel in the console",
      completed: !showConsoleNavigate,
      videoUrl: "https://vercel.replay.io/passport/time_travel_in_console.gif",
      imageBaseName: "time_travel_in_the_console",
      docsLink:
        "https://www.notion.so/replayio/Debugging-1c18f02c9f1d455188e3f202ef5f5c08?pvs=4#5df63e4995a749eab6a04e266db98df0",
    },
    {
      label: "Add a console log",
      completed: !showBreakpointEdit,
      videoUrl: "https://vercel.replay.io/passport/set_print_statement.gif",
      imageBaseName: "set_a_print_statement",
      docsLink:
        "https://www.notion.so/replayio/Debugging-1c18f02c9f1d455188e3f202ef5f5c08?pvs=4#e52695c558884780a93be039ae42867a",
    },
    {
      label: "Jump to event",
      completed: !showJumpToEvent,
      videoUrl: "https://vercel.replay.io/passport/jump_to_an_event.gif",
      imageBaseName: "jump_to_event",
      docsLink:
        "https://www.notion.so/replayio/Debugging-1c18f02c9f1d455188e3f202ef5f5c08#c9aab3ee9d564e098b28096c9a6cda83",
    },
  ];

  const inspectionItems = [
    {
      label: "Inspect UI elements",
      completed: !showInspectElement,
      videoUrl: "https://vercel.replay.io/passport/inspect_an_element.gif",
      imageBaseName: "inspect_element",
      docsLink:
        "https://www.notion.so/replayio/Debugging-1c18f02c9f1d455188e3f202ef5f5c08?pvs=4#904253ec80e542f0bb77d2c5a9bb8a4e",
    },
    {
      label: "Inspect network requests",
      completed: !showInspectNetworkRequest,
      videoUrl: "https://vercel.replay.io/passport/inspect_a_network_request.gif",
      imageBaseName: "inspect_network_request",
      docsLink:
        "https://www.notion.so/replayio/Debugging-1c18f02c9f1d455188e3f202ef5f5c08?pvs=4#f2ae6cfcef014d9fa8dce383c2a9a7fa",
    },
    {
      label: "Inspect React components",
      completed: !showInspectReactComponent,
      videoUrl: "https://vercel.replay.io/passport/inspect_a_react_component.gif",
      imageBaseName: "inspect_react_component",
      docsLink:
        "https://www.notion.so/replayio/Debugging-1c18f02c9f1d455188e3f202ef5f5c08?pvs=4#a10146a9ed2c45f5bf34a59d7e1ea7b9",
    },
    {
      label: "Jump to code",
      completed: !showJumpToCode,
      videoUrl: "https://vercel.replay.io/passport/jump_to_code.gif",
      imageBaseName: "jump_to_code",
    },
  ];

  const swissArmyItems = [
    {
      label: "Add a unicorn badge",
      completed: !showAddUnicornBadge,
      videoUrl: "https://vercel.replay.io/passport/unicorn_badge.gif",
      imageBaseName: "add_a_unicorn_badge",
    },
    {
      label: "Search source text",
      completed: !showSearchSourceText,
      videoUrl: "https://vercel.replay.io/passport/search_source_text.gif",
      imageBaseName: "search_source_text",
      docsLink:
        "https://www.notion.so/replayio/Search-4bd72377ac3d498d96bb7bcb33722a75?pvs=4#167521cd6a0f44dabc257eb3fd8ca48b",
    },
    {
      label: "Set a focus window",
      completed: !showUseFocusMode,
      videoUrl: "https://vercel.replay.io/passport/use_focus_mode.gif",
      imageBaseName: "use_focus_mode",
      docsLink: "https://www.notion.so/replayio/Focus-Mode-bd7783ea740f40f1b25383b6aaa78471?pvs=4",
    },
  ];

  const multiplayerItems = [
    {
      label: "Add a comment",
      completed: !showAddComment,
      videoUrl: "https://vercel.replay.io/passport/add_a_comment.gif",
      imageBaseName: "add_a_comment",
      docsLink: "https://www.notion.so/replayio/Comments-0a140c06524d428681cadd78acf44661?pvs=4",
    },
    {
      label: "Share",
      completed: !showShareNag,
      videoUrl: "https://vercel.replay.io/passport/share.gif",
      imageBaseName: "share",
    },
  ];

  const sections: Section[] = [
    {
      title: "TIME TRAVEL",
      items: timeTravelItems,
    },
    {
      title: "INFRARED INSPECTION",
      items: inspectionItems,
    },
    {
      title: "SWISS ARMY KNIFE",
      items: swissArmyItems,
    },
    {
      title: "MULTIPLAYER",
      items: multiplayerItems,
    },
  ];

  interface ItemType {
    label: string;
    completed: boolean;
    videoUrl: string;
    imageBaseName: string;
    docsLink?: string;
  }

  interface Section {
    title: string;
    items: ItemType[];
  }

  const selectedItem = sections[selectedIndices.sectionIndex].items[selectedIndices.itemIndex];

  const rand = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const [randomBottom, setRandomBottom] = useState(rand(220, 320));
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
          <span className={`${styles.ml2}`}>{section.title}</span>
        </div>
        <div className={styles.checklist}>
          {section.items.map((item: ItemType, itemIndex: number) => (
            <div
              key={itemIndex}
              className={`flex ${getItemStyle(sectionIndex, itemIndex)} ${styles.checklistItem}`}
              onClick={() => handleClick(sectionIndex, itemIndex)}
              style={{ position: "relative" }}
            >
              <Icon className={styles.stepIcon} type={renderCheckmarkIcon(item.completed)} />
              <span className={styles.ml2}>{item.label}</span>
              {sectionIndex === selectedIndices.sectionIndex &&
                itemIndex === selectedIndices.itemIndex &&
                item.docsLink && (
                  <div
                    className={styles.docsIcon}
                    onClick={e => {
                      e.stopPropagation();
                      handleDocsClick(item.docsLink);
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <Icon type="document" className="mr-2 w-4" />
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    setRandomBottom(rand(220, 320));
    setRandomRight(rand(-50, 0));
    setRandomRotation(rand(-20, 20));
  }, [selectedItem.completed]);

  return (
    <div className={styles.PassportBoxWrapper}>
      <div className={styles.PassportBoxGradient}>
        <div className={styles.PassportBox}>
          <div className="p-0 pt-3">
            <img src={`/images/passport/passportHeader.svg`} className={`mb-5 w-full px-1`} />
            <div
              className={styles.PassportBoxInternal}
              style={{
                height: videoHeight !== null ? `calc(100vh - 200px - ${videoHeight}px)` : "100%",
              }}
            >
              <div className={styles.sectionsContainer}>
                {sections.map((section, sectionIndex) => (
                  <React.Fragment key={sectionIndex}>
                    {renderSection(section, sectionIndex)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
        {selectedItem.completed && (
          <img
            src={`/images/passport/${selectedItem.imageBaseName}-complete.png`}
            className={styles.largeCompletedImage}
            style={{
              zIndex: 0,
              opacity: 0.25,
              bottom: `${randomBottom}px`,
              right: `${randomRight}px`,
              transform: `rotate(${randomRotation}deg)`,
            }}
          />
        )}
        <div className={styles.videoExampleWrapper}>
          <div style={{ position: "relative" }}>
            <img
              src={selectedItem.videoUrl}
              className={styles.videoExample}
              ref={videoExampleRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Passport;
