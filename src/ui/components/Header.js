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

  renderAvatars() {
    const { user, getActiveUsers } = this.props;

    const activeUsers = getActiveUsers();
    const firstPlayer = this.props.user;
    const otherPlayers = activeUsers.filter(user => user.id != firstPlayer.id);

    // We sort the other players by id here to prevent them from shuffling
    const sortedOtherPlayers = otherPlayers.sort((a, b) => a.id - b.id);

    return (
      <div className="avatars">
        {this.renderAvatar(firstPlayer, true)}
        {sortedOtherPlayers.map(player => this.renderAvatar(player, false))}
      </div>
    );
  }

  renderAvatar(player, isFirstPlayer) {
    return (
      <div
        className={`avatar ${isFirstPlayer ? "first-player" : null}`}
        style={{ background: this.getAvatarColor(player.avatarID) }}
      ></div>
    );
  }

  render() {
    return (
      <div id="header">
        <div className="logo"></div>
        <div id="status"></div>
        {this.renderAvatars()}
      </div>
    );
  }
}

export default connect(
  state => ({
    user: selectors.getUser(state),
    users: selectors.getUsers(state),
  }),
  { seek: actions.seek, getActiveUsers: actions.getActiveUsers }
)(Header);
