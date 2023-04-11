import { useEffect, useRef, useState } from "react";

import Icon from "replay-next/components/Icon";
import hooks from "ui/hooks";
import {
  shouldShowAddComment,
  shouldShowAddUnicornBadge,
  shouldShowBreakpointEdit,
  shouldShowConsoleNavigate,
  shouldShowExploreSources,
  shouldShowInspectElement,
  shouldShowJumpToCode,
  shouldShowJumpToEvent,
  shouldShowLaunchCommandPalette,
  shouldShowRecordReplay,
  shouldShowSearchSourceText,
  shouldShowUseFocusMode,
} from "ui/utils/onboarding";

import styles from "./Passport.module.css";

const useRandomPosition = (
  bottomRange: [number, number],
  rightRange: [number, number],
  deps: any[]
) => {
  const initialState = () => {
    const randomBottom = Math.floor(
      Math.random() * (bottomRange[1] - bottomRange[0]) + bottomRange[0]
    );
    const randomRight = Math.floor(Math.random() * (rightRange[1] - rightRange[0]) + rightRange[0]);
    return { bottom: randomBottom, right: randomRight };
  };

  const [position, setPosition] = useState(initialState);

  useEffect(() => {
    setPosition(initialState());
  }, deps);

  return position;
};

const useRandomRotation = (rotationRange: [number, number], deps: any[]) => {
  const initialState = () => {
    const randomRotation = Math.floor(
      Math.random() * (rotationRange[1] - rotationRange[0]) + rotationRange[0]
    );
    return randomRotation;
  };

  const [rotation, setRotation] = useState(initialState());

  useEffect(() => {
    setRotation(initialState());
  }, deps);

  return rotation;
};

const Passport: React.FC = () => {
  const { nags } = hooks.useGetUserInfo();
  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);
  const showAddComment = shouldShowAddComment(nags);
  const showJumpToCode = shouldShowJumpToCode(nags);
  const showAddUnicornBadge = shouldShowAddUnicornBadge(nags);
  const showRecordReplay = shouldShowRecordReplay(nags);
  const showExploreSources = shouldShowExploreSources(nags);
  const showSearchSourceText = shouldShowSearchSourceText(nags);
  const showLaunchCommandPalette = shouldShowLaunchCommandPalette(nags);
  const showJumpToEvent = shouldShowJumpToEvent(nags);
  const showInspectElement = shouldShowInspectElement(nags);
  const showUseFocusMode = shouldShowUseFocusMode(nags);
  const [stepIndex, setStepIndex] = useState(0);

  const videoExampleRef = useRef<HTMLDivElement>(null);
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

  const renderCheckmarkIcon = (completed: boolean | undefined) => {
    if (completed === false) {
      return "checked-rounded";
    }
    return "unchecked-rounded";
  };

  const renderCompletedImage = (completed: boolean | undefined, imageBaseName: string) => {
    if (completed != true) {
      return `/images/passport/${imageBaseName}-complete.svg`;
    }
    return null;
  };

  const getImageName = (label: string, completed: boolean) => {
    const baseName = label.toLowerCase().replace(/ /g, "_");
    return completed ? `${baseName}-default.svg` : `${baseName}-complete.svg`;
  };

  const renderItemImage = (label: string, completed: boolean) => (
    <img
      src={`/images/passport/${getImageName(label, completed)}`}
      alt={label}
      className={`absolute top-0 left-0 w-full ${styles.itemImage}`}
    />
  );

  const handleClick = (index: number) => {
    setStepIndex(index);
  };

  const getItemStyle = (index: number) => {
    return stepIndex === index ? styles.selectedItem : "";
  };

  const updatedChecklistItems = [
    {
      label: "Completed the tour",
      completed: showConsoleNavigate,
      videoUrl: "https://vercel.replay.io/passport/time_travel_in_console.gif",
      imageBaseName: "tour_grad",
    },
    {
      label: "Time travel in the console",
      completed: showConsoleNavigate,
      videoUrl: "https://vercel.replay.io/passport/time_travel_in_console.gif",
      imageBaseName: "time_travel_in_the_console",
    },
    {
      label: "Set a print statement",
      completed: showBreakpointEdit,
      videoUrl: "https://vercel.replay.io/passport/set_print_statement.gif",
      imageBaseName: "set_a_print_statement",
    },
    {
      label: "Launch command palette",
      completed: showLaunchCommandPalette,
      videoUrl: "https://vercel.replay.io/passport/launch_command_palette.gif",
      imageBaseName: "launch_command_palette",
    },
    {
      label: "Explore sources",
      completed: showExploreSources,
      videoUrl: "https://vercel.replay.io/passport/explore_sources.gif",
      imageBaseName: "explore_sources",
    },
    {
      label: "Search source text",
      completed: showSearchSourceText,
      videoUrl: "https://vercel.replay.io/passport/search_source_text.gif",
      imageBaseName: "search_source_text",
    },
    {
      label: "Jump to event",
      completed: showJumpToEvent,
      videoUrl: "https://vercel.replay.io/passport/jump_to_an_event.gif",
      imageBaseName: "jump_to_event",
    },
    {
      label: "Jump to code",
      completed: showJumpToCode,
      videoUrl: "https://vercel.replay.io/passport/jump_to_code.gif",
      imageBaseName: "jump_to_code",
    },
    {
      label: "Add a comment",
      completed: showAddComment,
      videoUrl: "https://vercel.replay.io/passport/add_a_comment.gif",
      imageBaseName: "add_a_comment",
    },
    {
      label: "Add a unicorn badge",
      completed: showAddUnicornBadge,
      videoUrl: "https://vercel.replay.io/passport/unicorn_badge.gif",
      imageBaseName: "add_a_unicorn_badge",
    },
    {
      label: "Use focus mode",
      completed: showUseFocusMode,
      videoUrl: "https://vercel.replay.io/passport/use_focus_mode.gif",
      imageBaseName: "use_focus_mode",
    },
    {
      label: "Record a replay",
      completed: showRecordReplay,
      videoUrl: "https://vercel.replay.io/passport/record_a_replay.gif",
      imageBaseName: "record_a_replay",
    },
    {
      label: "Inspect element",
      completed: showInspectElement,
      videoUrl: "https://vercel.replay.io/passport/inspect_an_element.gif",
      imageBaseName: "inspect_element",
    },
  ];

  const selectedItem = updatedChecklistItems[stepIndex];
  const randomPosition = useRandomPosition([225, 410], [-35, 7], [stepIndex]);
  const randomRotation = useRandomRotation([-30, 30], [stepIndex]);

  return (
    <div className={styles.AssistBoxWrapper}>
      <div className={styles.AssistBoxGradient}>
        <div className={styles.AssistBox}>
          <div className="p-0 pt-3">
            <img src={`/images/passport/passportHeader.svg`} className={`mb-5 w-full px-1`} />
            <div
              className={styles.AssistBoxInternal}
              style={{
                height: videoHeight !== null ? `calc(100vh - 200px - ${videoHeight}px)` : "100%",
              }}
            >
              <div className={styles.checklistContainer}>
                <div className={styles.checklist}>
                  {updatedChecklistItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex ${getItemStyle(index)} ${styles.checklistItem}`}
                      onClick={() => handleClick(index)}
                    >
                      <Icon
                        className={styles.stepIcon}
                        type={renderCheckmarkIcon(item.completed)}
                      />

                      <span className="ml-2">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {renderCompletedImage(selectedItem.completed, selectedItem.imageBaseName, 0, 30) && (
          <img
            src={renderCompletedImage(selectedItem.completed, selectedItem.imageBaseName, 0, 30)}
            className={styles.largeCompletedImage}
            style={{
              zIndex: 0,
              opacity: 0.25,
              bottom: `${randomPosition.bottom}px`,
              right: `${randomPosition.right}%`,
              transform: `rotate(${randomRotation}deg)`,
            }}
          />
        )}
        {renderCompletedImage(selectedItem.completed, selectedItem.imageBaseName, 100, 50) && (
          <img
            src={renderCompletedImage(selectedItem.completed, selectedItem.imageBaseName, 100, 50)}
            className={styles.largeCompletedImage}
            style={{
              zIndex: 100,
              opacity: 0.04,
              bottom: `${randomPosition.bottom}px`,
              right: `${randomPosition.right}%`,
              transform: `rotate(${randomRotation}deg)`,
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
