/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Embed the various SVGs used in the devtools here so that we don't need
// to deal with loading them in webpack.
//
// FIXME remove this and integrate with image.js

export const SVG = {
  // From https://systemuicons.com/
  Comment: `
<svg height="21" viewBox="0 0 21 21" width="21" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" transform="translate(2 3)"><path d="m14.5.5c1.1045695 0 2 .8954305 2 2v10c0 1.1045695-.8954305 2-2 2l-2.999-.001-2.29389322 2.2938932c-.36048396.360484-.92771502.3882135-1.32000622.0831886l-.09420734-.0831886-2.29389322-2.2938932-2.999.001c-1.1045695 0-2-.8954305-2-2v-10c0-1.1045695.8954305-2 2-2z" stroke="#2a2e3b" stroke-linecap="round" stroke-linejoin="round"/><path d="m8.49884033 8.5c.5 0 1-.5 1-1s-.5-1-1-1-.99884033.5-.99884033 1 .49884033 1 .99884033 1zm-4 0c.5 0 1-.5 1-1s-.5-1-1-1-.99884033.5-.99884033 1 .49884033 1 .99884033 1zm7.99999997 0c.5 0 1-.5 1-1s-.5-1-1-1-.9988403.5-.9988403 1 .4988403 1 .9988403 1z" fill="#2a2e3b"/></g></svg>
`,

  NextButton: `
<svg version="1.1" xmlns:svg="http://www.w3.org/2000/svg"
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 16 16">
<path d="M12.4,2.1c-0.3,0-0.5,0.2-0.5,0.5v4.8c0,0-0.1-0.1-0.1-0.1l-7.4-5C3.8,1.8,3,2.2,3,3v10c0,0.8,0.8,1.3,1.4,0.8l7.4-5
    c0.1,0,0.1-0.1,0.1-0.1v4.8c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5v-11C12.9,2.3,12.7,2.1,12.4,2.1z M3.9,13V3l7.4,5L3.9,13z"/>
</svg>
`,

  ReplayPause: `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.5 2.5V13.5" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
<path d="M4.5 2.5V13.5" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`,

  ReplayResume: `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 13.5329V2.46713C4 2.26746 4.22254 2.14836 4.38868 2.25912L12.688 7.79199C12.8364 7.89094 12.8364 8.10906 12.688 8.20801L4.38868 13.7409C4.22254 13.8516 4 13.7325 4 13.5329Z" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
</svg>
`,

  ZoomOut: `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <path fill="context-fill" fill-opacity="context-fill-opacity" d="M15.707 14.293l-4.822-4.822a6.019 6.019 0 1 0-1.414 1.414l4.822 4.822a1 1 0 0 0 1.414-1.414zM6 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/>
  <path d="M3.5 6L8.5 6" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
</svg>
`,
};
