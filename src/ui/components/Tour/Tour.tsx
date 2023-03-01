import React, { useState } from 'react';
import { shouldShowConsoleNavigate, shouldShowBreakpointAdd, shouldShowBreakpointEdit  } from "ui/utils/onboarding";
import { UserInfo } from "ui/hooks/users";

import Events from "ui/components/Events";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import { setViewMode } from "ui/actions/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getViewMode } from "ui/reducers/layout";
import { ViewMode } from "ui/state/layout";
import hooks from "ui/hooks";
import styles from "./Tour.module.css";
import Icon from "replay-next/components/Icon";

const Checklist: React.FC = () => {

  const { nags } = hooks.useGetUserInfo();
  const viewMode = useAppSelector(getViewMode);
  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);
  
  const showConsoleNavigate = shouldShowConsoleNavigate(nags, viewMode);
  const showBreakpointAdd = shouldShowBreakpointAdd(nags, viewMode);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags, viewMode);
  
  const [checkedItems, setCheckedItems] = useState([0]);
  
  const handleShowHowClick = (index: number) => {
	alert("instructional text");
  };
  
  const isComplete = !showDevtoolsNag && !showConsoleNavigate && !showBreakpointAdd && !showBreakpointEdit;


  return (
	  
	  <div className={styles.TourBoxWrapper}>
	  <div className={styles.TourBox}>
	  <div className="p-3">
		<h1 className={styles.h1}>Getting started</h1>
		
		<ul className={styles.checklist}>
		  <li><Icon className={styles.Icon} type={showDevtoolsNag ? "unchecked-rounded" : "checked-rounded"} />Open DevTools</li>
		  <li><Icon className={styles.Icon} type={showConsoleNavigate ? "unchecked-rounded" : "checked-rounded"} />Time travel in the console</li>
		  <li><Icon className={styles.Icon} type={showBreakpointAdd ? "unchecked-rounded" : "checked-rounded"} /> Magic print statements </li>
		  <li><Icon className={styles.Icon} type={showBreakpointEdit ? "unchecked-rounded" : "checked-rounded"} /> Edit a print statement</li>				  
		</ul>
		
		{isComplete ? (
			<div className="bg-yellow-200 text-lg p-2 rounded-md text-black mt-8">
				Congratulations! You completed the checklist! Confetti and stuff!
			</div>
		  ) : null}
		
	  </div>
	</div>
	</div>
  );
};

export default Checklist;
