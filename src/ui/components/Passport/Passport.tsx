import { useEffect, useState } from "react";

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
      label: "Time travel in the console",
      completed: showConsoleNavigate,
      videoUrl: "https://vercel.replay.io/assist/time_travel_in_console.gif",
      imageBaseName: "time_travel_in_the_console",
    },
    {
      label: "Set a print statement",
      completed: showBreakpointEdit,
      videoUrl: "https://vercel.replay.io/assist/set_print_statement.gif",
      imageBaseName: "set_a_print_statement",
    },
    {
      label: "Launch command palette",
      completed: showLaunchCommandPalette,
      videoUrl: "https://vercel.replay.io/assist/launch_command_palette.gif",
      imageBaseName: "launch_command_palette",
    },
    {
      label: "Explore sources",
      completed: showExploreSources,
      videoUrl: "https://vercel.replay.io/assist/explore_sources.gif",
      imageBaseName: "explore_sources",
    },
    {
      label: "Search source text",
      completed: showSearchSourceText,
      videoUrl: "https://vercel.replay.io/assist/search_source_text.gif",
      imageBaseName: "search_source_text",
    },
    {
      label: "Jump to event",
      completed: showJumpToEvent,
      videoUrl: "https://vercel.replay.io/assist/jump_to_an_event.gif",
      imageBaseName: "jump_to_event",
    },
    {
      label: "Jump to code",
      completed: showJumpToCode,
      videoUrl: "https://vercel.replay.io/assist/jump_to_code.gif",
      imageBaseName: "jump_to_code",
    },
    {
      label: "Add a comment",
      completed: showAddComment,
      videoUrl: "https://vercel.replay.io/assist/add_a_comment.gif",
      imageBaseName: "add_a_comment",
    },
    {
      label: "Add a unicorn badge",
      completed: showAddUnicornBadge,
      videoUrl: "https://vercel.replay.io/assist/unicorn_badge.gif",
      imageBaseName: "add_a_unicorn_badge",
    },
    {
      label: "Use focus mode",
      completed: showUseFocusMode,
      videoUrl: "https://vercel.replay.io/assist/use_focus_mode.gif",
      imageBaseName: "use_focus_mode",
    },
    {
      label: "Record a replay",
      completed: showRecordReplay,
      videoUrl: "https://vercel.replay.io/assist/record_a_replay.gif",
      imageBaseName: "record_a_replay",
    },
    {
      label: "Inspect element",
      completed: showInspectElement,
      videoUrl: "https://vercel.replay.io/assist/inspect_an_element.gif",
      imageBaseName: "inspect_element",
    },
    ˇ,
  ];

  const selectedItem = updatedChecklistItems[stepIndex];
  const randomPosition = useRandomPosition([225, 410], [-45, 10], [stepIndex]);
  const randomRotation = useRandomRotation([-20, 20], [stepIndex]);

  return (
    <div className={styles.AssistBoxWrapper}>
      <div className={styles.AssistBoxGradient}>
        <div className={styles.AssistBox}>
          <div className="p-0 pt-3">
            <img src={`/images/passport/passportHeader.svg`} className={`mb-5 w-full px-1`} />
            <div className={styles.AssistBoxInternal}>
              <div className={styles.checklist}>
                {updatedChecklistItems.map((item, index) => (
                  <div
                    key={index}
                    className={`flex ${getItemStyle(index)} ${styles.checklistItem}`}
                    onClick={() => handleClick(index)}
                  >
                    <Icon className={styles.stepIcon} type={renderCheckmarkIcon(item.completed)} />

                    <span className="ml-2">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {renderCompletedImage(selectedItem.completed, selectedItem.imageBaseName) && (
          <img
            src={renderCompletedImage(selectedItem.completed, selectedItem.imageBaseName)}
            className={styles.largeCompletedImage}
            style={{
              bottom: `${randomPosition.bottom}px`,
              right: `${randomPosition.right}%`,
              transform: `rotate(${randomRotation}deg)`,
            }}
          />
        )}
        <div className={styles.videoExampleWrapper}>
          <img src={selectedItem.videoUrl} className={styles.videoExample} />
        </div>
      </div>
    </div>
  );
};

export default Passport;
