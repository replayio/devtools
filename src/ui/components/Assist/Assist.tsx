import React, { useEffect, useState } from "react";

import Icon from "replay-next/components/Icon";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { setViewMode } from "ui/actions/layout";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import Events from "ui/components/Events";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import Confetti from "ui/components/shared//Confetti";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { useDismissNag } from "ui/hooks/users";
import { UserInfo } from "ui/hooks/users";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ViewMode } from "ui/state/layout";
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

import styles from "./Assist.module.css";

const useNagDismissal = () => {
  const dismissNag = useDismissNag();
  const dispatch = useAppDispatch();
  const info = useTestInfo();

  const dismissTourNag = () => {
    const initialPrimaryPanel = "events";
    dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
    dismissNag(Nag.DISMISS_TOUR);
  };

  return { dismissTourNag };
};

const Assist: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState(2);
  const { nags } = hooks.useGetUserInfo();
  const viewMode = useAppSelector(getViewMode);
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

  const [showConfetti, setShowConfetti] = useState(false);

  const info = useTestInfo();

  const renderCheckmarkIcon = (completed: boolean | undefined) => {
    if (completed === false) {
      return "checked-rounded";
    }
    return "unchecked-rounded";
  };

  const [stepIndex, setStepIndex] = useState(0);

  const handleClick = (index: number) => {
    setStepIndex(index);
    setSelectedItem(index);
  };

  const getItemStyle = (index: number) => {
    return selectedItem === index ? styles.selectedItem : "";
  };

  const updatedChecklistItems = [
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
      label: "Launch command palette",
      completed: showLaunchCommandPalette,
      videoUrl: "https://vercel.replay.io/assist/launch_command_palette.gif",
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
      label: "Jump to code",
      completed: showJumpToCode,
      videoUrl: "https://vercel.replay.io/assist/jump_to_code.gif",
    },
    {
      label: "Add a comment",
      completed: showAddComment,
      videoUrl: "https://vercel.replay.io/assist/add_a_comment.gif",
    },
    {
      label: "Add a unicorn badge",
      completed: showAddUnicornBadge,
      videoUrl: "https://vercel.replay.io/assist/unicorn_badge.gif",
    },
    {
      label: "Use focus mode",
      completed: showUseFocusMode,
      videoUrl: "https://vercel.replay.io/assist/use_focus_mode.gif",
    },
    {
      label: "Record a replay",
      completed: showRecordReplay,
      videoUrl: "https://vercel.replay.io/assist/record_a_replay.gif",
    },
    {
      label: "Inspect element",
      completed: showInspectElement,
      videoUrl: "https://vercel.replay.io/assist/inspect_an_element.gif",
    },
  ];

  useEffect(() => {
    const firstUnselectedIndex = updatedChecklistItems.findIndex(item => !item.completed);
    if (firstUnselectedIndex !== -1) {
      setSelectedItem(firstUnselectedIndex);
      setStepIndex(firstUnselectedIndex);
    }
  }, []);

  const videoUrl = updatedChecklistItems[stepIndex].videoUrl;

  return (
    <div className={styles.AssistBoxWrapper}>
      <div className={styles.AssistBoxGradient}>
        <div className={styles.AssistBox}>
          <div className="p-0 pt-3">
            <div className={styles.h1}>Replay Assist</div>
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
        <div className="absolute bottom-32 w-full px-2">
          <img src={videoUrl} className={styles.videoExample} />
        </div>
      </div>
    </div>
  );
};

export default Assist;
