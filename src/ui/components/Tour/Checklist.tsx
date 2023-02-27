import React, { useState } from 'react';

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
  {
	title: 'Cool Advanced Stuff (1/4)',
	items: [
	  {
		text: 'Add a comment to code',
		showHowLink: '#',
		additionalText: 'This will add a comment to the code.'
	  },
	  {
		text: 'Add a unicorn',
		showHowLink: '#',
		additionalText: 'This will add a unicorn to the page.'
	  },
	  {
		text: 'Comment net request',
		showHowLink: '#',
		additionalText: 'This will comment out a network request.'
	  },
	  {
		text: 'Save a video',
		showHowLink: '#',
		additionalText: 'This will save a video of the page.'
	  },
	],
  },
];

const Checklist: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState([0]);

  const handleShowHowClick = (index: number) => {
	alert('This is how to do it!');
  };

  return (
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
  );
};

export default Checklist;
