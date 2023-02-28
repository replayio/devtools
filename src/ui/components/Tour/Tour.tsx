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

interface TourSection {
  title: string;
  items: TourItem[];
}

interface TourItem {
  text: string;
  showHowLink: string;
  additionalText: string;
}

const tourData: TourSection[] = [
  {
	title: 'Getting Started (1/5)',
	items: [
	  {
		text: 'Open DevTools',
		showHowLink: '#',
		additionalText: 'This will open the DevTools window.'
	  },
	  {
		text: 'Add a comment',
		showHowLink: '#',
		additionalText: 'This will add a comment to the code.'
	  },
	  {
		text: 'Jump to code',
		showHowLink: '#',
		additionalText: 'This will jump to the code.'
	  },
	  {
		text: 'Open Pause Info',
		showHowLink: '#',
		additionalText: 'This will open the Pause Info window.'
	  },
	  {
		text: 'Create a print statement',
		showHowLink: '#',
		additionalText: 'This will create a print statement in the console.'
	  },
	],
  },  
];

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
		
	  </div>
	</div>
	</div>
  );
};

export default Checklist;
