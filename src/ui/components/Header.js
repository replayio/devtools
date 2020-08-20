import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

import "./Header.css";

const avatarColors = ["#2D4551", "#509A8F", "#E4C478", "#E9A56C", "#D97559"];

class Header extends React.Component {
  getAvatarColor(avatarID) {
    return avatarColors[avatarID % avatarColors.length];
  }

  render() {
    const { user } = this.props;

    return (
      <div id="header">
        <div className="logo"></div>
        <div id="status"></div>
        <div className="avatars">
          <div className="avatar" style={{ background: this.getAvatarColor(user.avatarID) }}></div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    user: selectors.getUser(state),
  }),
  { seek: actions.seek }
)(Header);
