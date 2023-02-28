import React, { useState } from 'react';
import { shouldShowJonDonut } from "ui/utils/onboarding";
import { UserInfo } from "ui/hooks/users";

import Events from "ui/components/Events";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import { setViewMode } from "ui/actions/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getViewMode } from "ui/reducers/layout";
import { ViewMode } from "ui/state/layout";
import hooks from "ui/hooks";


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
  const showJonDonutNag = shouldShowJonDonut(nags, viewMode);
  const [checkedItems, setCheckedItems] = useState([0]);
  
  const handleShowHowClick = (index: number) => {
	alert("instructional text");
  };

  return (
	  
	  <div>
	  <div className="p-3">
		<h1 className="text-lg font-bold text-pink-500">Jon wiring things up here:</h1>
		
		<ul>
		  <li>Open DevTools yet? {showDevtoolsNag ? "No" : "Yep!"}</li>
		  <li>Given Jon a donut? {showJonDonutNag ? "No" : "Yep!"}</li>
		</ul>
		
	  </div>
	  
	  
	<div className="p-3">
	  <h1 className="text-lg font-bold text-pink-500">Welcome!</h1>
	  
	  		  
	  {tourData.map((section, sectionIndex) => (
		<div key={section.title} className="mt-2">
		  <p className="text-lg font-medium mb-2">{section.title}</p>
		  <ul className="text-left">
			{section.items.map((item, itemIndex) => (
			  <li
				key={item.text}
				className="flex items-center justify-between py-1"
				onClick={() => setCheckedItems([sectionIndex, itemIndex])}
			  >
				<span
				  className={`ml-4 w-full ${
					checkedItems[0] === sectionIndex && checkedItems[1] === itemIndex
					  ? "line-through text-gray-500"
					  : ""
				  }`}
				>
				  {item.text}
				</span>
				<a
				  href="#"
				  className="text-blue-500 underline whitespace-nowrap"
				  onClick={(event) => {
					event.preventDefault();
					handleShowHowClick(itemIndex);
				  }}
				>
				  Show how
				</a>
			  </li>
			))}
		  </ul>
		</div>
	  ))}
	</div>
	</div>
  );
};

export default Checklist;
