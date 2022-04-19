/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { isFirefox } from "ui/utils/environment";

export function scrollList(resultList, index) {
  if (!resultList.hasOwnProperty(index)) {
    return;
  }

  const resultEl = resultList[index];

  const scroll = () => {
    if (isFirefox()) {
      // Avoid expensive DOM computations involved in scrollIntoView
      // https://nolanlawson.com/2018/09/25/accurately-measuring-layout-on-the-web/
      requestAnimationFrame(() => {
        setTimeout(() => {
          resultEl.scrollIntoView({ behavior: "auto", block: "nearest" });
        });
      });
    } else {
      chromeScrollList(resultEl, index);
    }
  };

  scroll();
}

function chromeScrollList(elem, index) {
  const resultsEl = elem.parentNode;

  if (!resultsEl || resultsEl.children.length === 0) {
    return;
  }

  // Avoid expensive DOM computations (reading clientHeight)
  // https://nolanlawson.com/2018/09/25/accurately-measuring-layout-on-the-web/
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (!resultsEl) {
        return;
      }

      const resultsHeight = resultsEl.clientHeight;
      const firstChild = resultsEl.children[0];

      if (!firstChild) {
        return;
      }

      const itemHeight = firstChild.clientHeight;

      const numVisible = resultsHeight / itemHeight;
      const positionsToScroll = index - numVisible + 1;
      const itemOffset = resultsHeight % itemHeight;
      const scroll = positionsToScroll * (itemHeight + 2) + itemOffset;

      resultsEl.scrollTop = Math.max(0, scroll);
    });
  });
}
