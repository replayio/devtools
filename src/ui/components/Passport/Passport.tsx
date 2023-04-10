import { useState } from "react";

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
  shouldShowTour,
  shouldShowUseFocusMode,
} from "ui/utils/onboarding";

import styles from "./Passport.module.css";

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

  const [videoVisible, setVideoVisible] = useState(false);

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
  const showTour = shouldShowTour(nags);

  const handleClick = (index: number) => {
    setStepIndex(index);
  };

  const getItemStyle = (index: number) => {
    return stepIndex === index ? styles.selectedItem : "";
  };

  const updatedChecklistItems = [
    {
      label: "Tour Grad",
      completed: showTour,
      videoUrl: "https://vercel.replay.io/assist/set_print_statement.gif",
    },
    {
      label: "Time travel in the console",
      completed: showConsoleNavigate,
      videoUrl: "https://vercel.replay.io/assist/time_travel_in_console.gif",
    },
    {
      label: "Set a print statement",
      completed: showBreakpointEdit,
      videoUrl: "https://vercel.replay.io/assist/set_print_statement.gif",
    },

    {
      label: "Add a unicorn badge",
      completed: showAddUnicornBadge,
      videoUrl: "https://vercel.replay.io/assist/unicorn_badge.gif",
    },

    {
      label: "Jump to code",
      completed: showJumpToCode,
      videoUrl: "https://vercel.replay.io/assist/jump_to_code.gif",
    },
    {
      label: "Explore sources",
      completed: showExploreSources,
      videoUrl: "https://vercel.replay.io/assist/explore_sources.gif",
    },
    {
      label: "Search source text",
      completed: showSearchSourceText,
      videoUrl: "https://vercel.replay.io/assist/search_source_text.gif",
    },
    {
      label: "Jump to event",
      completed: showJumpToEvent,
      videoUrl: "https://vercel.replay.io/assist/jump_to_an_event.gif",
    },
    {
      label: "Add a comment",
      completed: showAddComment,
      videoUrl: "https://vercel.replay.io/assist/add_a_comment.gif",
    },

    {
      label: "Use focus mode",
      completed: showUseFocusMode,
      videoUrl: "https://vercel.replay.io/assist/use_focus_mode.gif",
    },
    {
      label: "Launch command palette",
      completed: showLaunchCommandPalette,
      videoUrl: "https://vercel.replay.io/assist/launch_command_palette.gif",
    },
    {
      label: "Inspect element",
      completed: showInspectElement,
      videoUrl: "https://vercel.replay.io/assist/inspect_an_element.gif",
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const selectedItem = updatedChecklistItems[stepIndex];

  return (
    <div className={styles.AssistBoxWrapper}>
      <div className={styles.AssistBoxGradient}>
        <div className={styles.AssistBox}>
          <div className={styles.AssistBoxInternal}>
            <div className={styles.checklist}>
              <img src={`/images/passport/passportHeader.svg`} className={`my-3 w-full px-8`} />

              {updatedChecklistItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${styles.checklistItem}`}
                  onClick={() => handleClick(index)}
                >
                  <div className={`relative ${getItemStyle(index)} ${styles.itemContainer}`}>
                    {renderItemImage(item.label, item.completed)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-32 w-full px-2">
          <img src={selectedItem.videoUrl} className={styles.videoExample} />
        </div>
      </div>
    </div>
  );
};

export default Passport;
