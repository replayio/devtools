/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const BoxModel = require("devtools/client/inspector/boxmodel/components/BoxModel");
const BoxModelTypes = require("devtools/client/inspector/boxmodel/types");
const Accordion = require("devtools/client/shared/components/Accordion");
const { LocalizationHelper } = require("devtools/shared/l10n");
const Services = require("devtools/shared/services");
const PropTypes = require("prop-types");
const React = require("react");
const dom = require("react-dom-factories");
const { connect } = require("react-redux");

const BOXMODEL_STRINGS_URI = "devtools/client/locales/boxmodel.properties";
const BOXMODEL_L10N = new LocalizationHelper(BOXMODEL_STRINGS_URI);

const LAYOUT_STRINGS_URI = "devtools/client/locales/layout.properties";
const LAYOUT_L10N = new LocalizationHelper(LAYOUT_STRINGS_URI);

const BOXMODEL_OPENED_PREF = "devtools.layout.boxmodel.opened";

class LayoutApp extends React.PureComponent {
  static get propTypes() {
    return {
      boxModel: PropTypes.shape(BoxModelTypes.boxModel).isRequired,
      onHideBoxModelHighlighter: PropTypes.func.isRequired,
      onShowBoxModelEditor: PropTypes.func.isRequired,
      onShowBoxModelHighlighter: PropTypes.func.isRequired,
      onShowBoxModelHighlighterForNode: PropTypes.func.isRequired,
      setSelectedNode: PropTypes.func.isRequired,
      showBoxModelProperties: PropTypes.bool.isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.containerRef = React.createRef();

    this.scrollToTop = this.scrollToTop.bind(this);
  }

  getBoxModelSection() {
    return {
      component: BoxModel,
      componentProps: this.props,
      contentClassName: "layout-content",
      header: "Box Model",
      id: "layout-section-boxmodel",
      onToggle: opened => {
        Services.prefs.setBoolPref(BOXMODEL_OPENED_PREF, opened);
      },
      opened: Services.prefs.getBoolPref(BOXMODEL_OPENED_PREF),
    };
  }

  getGridSection() {
    return {
      component: Grid,
      componentProps: this.props,
      contentClassName: "layout-content",
      header: "Grid",
      id: "layout-grid-section",
      onToggle: opened => {
        Services.prefs.setBoolPref(GRID_OPENED_PREF, opened);
      },
      opened: Services.prefs.getBoolPref(GRID_OPENED_PREF),
    };
  }

  /**
   * Scrolls to the top of the layout container.
   */
  scrollToTop() {
    this.containerRef.current.scrollTop = 0;
  }

  render() {
    const items = [this.getBoxModelSection()];
    return dom.div(
      { className: "layout-container", ref: this.containerRef },
      dom.div(
        {
          className: "h-full overflow-y-auto",
        },
        React.createElement(Accordion, {
          items,
          style: {
            overflow: "auto",
          },
        })
      )
    );
  }
}

const mapStateToProps = state => ({
  boxModel: state.boxModel,
});

module.exports = connect(mapStateToProps)(LayoutApp);
