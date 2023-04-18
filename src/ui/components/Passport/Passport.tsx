import React, { useEffect, useRef, useState } from "react";

import Icon from "replay-next/components/Icon";
import hooks from "ui/hooks";
import {
  shouldShowAddComment,
  shouldShowAddUnicornBadge,
  shouldShowBreakpointEdit,
  shouldShowConsoleNavigate,
  shouldShowInspectElement,
  shouldShowJumpToCode,
  shouldShowJumpToEvent,
  shouldShowSearchSourceText,
  shouldShowShareNag,
  shouldShowUseFocusMode,
} from "ui/utils/onboarding";

import styles from "./Passport.module.css";

const Passport = () => {
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
  const showUseFocusMode = shouldShowUseFocusMode(nags);
  const [selectedIndices, setSelectedIndices] = useState({ sectionIndex: 0, itemIndex: 0 });

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
    },
    {
      label: "Set a print statement",
      completed: !showBreakpointEdit,
      videoUrl: "https://vercel.replay.io/passport/set_print_statement.gif",
      imageBaseName: "set_a_print_statement",
    },
    {
      label: "Jump to event",
      completed: !showJumpToEvent,
      videoUrl: "https://vercel.replay.io/passport/jump_to_an_event.gif",
      imageBaseName: "jump_to_event",
    },
  ];

  const powerToolsItems = [
    {
      label: "Inspect element",
      completed: !showInspectElement,
      videoUrl: "https://vercel.replay.io/passport/inspect_an_element.gif",
      imageBaseName: "inspect_element",
    },
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
    },
    {
      label: "Use focus mode",
      completed: !showUseFocusMode,
      videoUrl: "https://vercel.replay.io/passport/use_focus_mode.gif",
      imageBaseName: "use_focus_mode",
    },
  ];

  const multiplayerItems = [
    {
      label: "Add a comment",
      completed: !showAddComment,
      videoUrl: "https://vercel.replay.io/passport/add_a_comment.gif",
      imageBaseName: "add_a_comment",
    },
    {
      label: "Share",
      completed: !showShareNag,
      videoUrl: "https://vercel.replay.io/passport/share.gif",
      imageBaseName: "share",
    },
  ];

  const sections = [
    {
      title: "Basics",
      items: timeTravelItems,
    },
    {
      title: "Advanced",
      items: powerToolsItems,
    },
    {
      title: "Collaboration",
      items: multiplayerItems,
    },
  ];

  const selectedItem = sections[selectedIndices.sectionIndex].items[selectedIndices.itemIndex];

  const rand = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const renderSection = (section: any, sectionIndex: number) => {
    return (
      <div className={styles.section}>
        <div className={`flex ${styles.headerItem}`}>
          <Icon
            className={styles.stepIcon}
            type={`step-${["one", "two", "three"][sectionIndex]}`}
          />
          <span className={`${styles.ml2}`}>{section.title}</span>
        </div>
        <div className={styles.checklist}>
          {section.items.map((item: any, itemIndex: number) => (
            <div
              key={itemIndex}
              className={`flex ${getItemStyle(sectionIndex, itemIndex)} ${styles.checklistItem}`}
              onClick={() => handleClick(sectionIndex, itemIndex)}
            >
              <Icon className={styles.stepIcon} type={renderCheckmarkIcon(item.completed)} />
              <span className={`${styles.ml2}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
              bottom: `${rand(220, 320)}px`,
              right: `${rand(-50, 0)}px`,
              transform: `rotate(${rand(-20, 20)}deg)`,
            }}
          />
        )}
        <div className={styles.videoExampleWrapper}>
          <img src={selectedItem.videoUrl} className={styles.videoExample} ref={videoExampleRef} />
        </div>
      </div>
    </div>
  );
};

export default Passport;
